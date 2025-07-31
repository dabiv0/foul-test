"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var panel_chat_exports = {};
__export(panel_chat_exports, {
  ChatLog: () => ChatLog,
  ChatRoom: () => ChatRoom,
  ChatTextEntry: () => ChatTextEntry,
  ChatUserList: () => ChatUserList,
  CopyableURLBox: () => CopyableURLBox
});
module.exports = __toCommonJS(panel_chat_exports);
var import_preact = __toESM(require("../js/lib/preact"));
var import_client_main = require("./client-main");
var import_panels = require("./panels");
var import_panel_mainmenu = require("./panel-mainmenu");
var import_battle_log = require("./battle-log");
var import_miniedit = require("./miniedit");
var import_battle_dex = require("./battle-dex");
var import_battle_text_parser = require("./battle-text-parser");
var import_client_connection = require("./client-connection");
var import_battle_choices = require("./battle-choices");
var import_panel_chat_tournament = require("./panel-chat-tournament");
/**
 * Chat panel
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
class ChatRoom extends import_client_main.PSRoom {
  constructor(options) {
    super(options);
    this.classType = "chat";
    /** note: includes offline users! use onlineUsers if you need onlineUsers */
    this.users = {};
    /** not equal to onlineUsers.length because guests exist */
    this.userCount = 0;
    this.onlineUsers = [];
    this.canConnect = true;
    // PM-only properties
    this.pmTarget = null;
    this.challengeMenuOpen = false;
    this.initialSlash = false;
    this.challenging = null;
    this.challenged = null;
    /** n.b. this will be null outside of battle rooms */
    this.battle = null;
    this.log = null;
    this.tour = null;
    this.lastMessage = null;
    this.lastMessageTime = null;
    this.joinLeave = null;
    /** in order from least to most recent */
    this.userActivity = [];
    this.timeOffset = 0;
    this.handleHighlight = (args) => {
      let name;
      let message;
      let msgTime = 0;
      if (args[0] === "c:") {
        msgTime = parseInt(args[1]);
        name = args[2];
        message = args[3];
      } else {
        name = args[1];
        message = args[2];
      }
      let lastMessageDates = import_battle_dex.Dex.prefs("logtimes") || (import_client_main.PS.prefs.set("logtimes", {}), import_battle_dex.Dex.prefs("logtimes"));
      if (!lastMessageDates[import_client_main.PS.server.id]) lastMessageDates[import_client_main.PS.server.id] = {};
      let lastMessageDate = lastMessageDates[import_client_main.PS.server.id][this.id] || 0;
      let serverMsgTime = msgTime - (this.timeOffset || 0);
      let mayNotify = serverMsgTime > lastMessageDate && name !== import_client_main.PS.user.userid;
      if (import_client_main.PS.isVisible(this)) {
        this.lastMessageTime = null;
        lastMessageDates[import_client_main.PS.server.id][this.id] = serverMsgTime;
        import_client_main.PS.prefs.set("logtimes", lastMessageDates);
      } else {
        let lastMessageTime = this.lastMessageTime || 0;
        if (lastMessageTime < serverMsgTime) this.lastMessageTime = serverMsgTime;
      }
      return !!(ChatRoom.getHighlight(message, this.id) && mayNotify);
    };
    this.clientCommands = this.parseClientCommands({
      "chall,challenge"(target) {
        if (target) {
          const [targetUser, format] = target.split(",");
          import_client_main.PS.join(`challenge-${(0, import_battle_dex.toID)(targetUser)}`);
          return;
        }
        this.openChallenge();
      },
      "cchall,cancelchallenge"(target) {
        this.cancelChallenge();
      },
      "reject"(target) {
        this.challenged = null;
        this.update(null);
      },
      "clear"() {
        this.log?.reset();
        this.update(null);
      },
      "rank,ranking,rating,ladder"(target) {
        let arg = target;
        if (!arg) {
          arg = import_client_main.PS.user.userid;
        }
        if (this.battle && !arg.includes(",")) {
          arg += ", " + this.id.split("-")[1];
        }
        const targets = arg.split(",");
        let formatTargeting = false;
        const formats = {};
        const gens = {};
        for (let i = 1, len = targets.length; i < len; i++) {
          targets[i] = $.trim(targets[i]);
          if (targets[i].length === 4 && targets[i].startsWith("gen")) {
            gens[targets[i]] = 1;
          } else {
            formats[(0, import_battle_dex.toID)(targets[i])] = 1;
          }
          formatTargeting = true;
        }
        import_client_connection.PSLoginServer.query("ladderget", {
          user: targets[0]
        }).then((data) => {
          if (!data || !Array.isArray(data)) return this.add(`|error|Error: corrupted ranking data`);
          let buffer = `<div class="ladder"><table><tr><td colspan="9">User: <strong>${(0, import_battle_dex.toID)(targets[0])}</strong></td></tr>`;
          if (!data.length) {
            buffer += '<tr><td colspan="9"><em>This user has not played any ladder games yet.</em></td></tr>';
            buffer += "</table></div>";
            return this.add(`|html|${buffer}`);
          }
          buffer += `<tr><th>Format</th><th><abbr title="Elo rating">Elo</abbr></th><th><abbr title="user's percentage chance of winning a random battle (aka GLIXARE)">GXE</abbr></th><th><abbr title="Glicko-1 rating: rating &#177; deviation">Glicko-1</abbr></th><th>COIL</th><th>W</th><th>L</th><th>Total</th>`;
          let suspect = false;
          for (const item of data) {
            if ("suspect" in item) suspect = true;
          }
          if (suspect) buffer += "<th>Suspect reqs possible?</th>";
          buffer += "</tr>";
          const hiddenFormats = [];
          for (const row of data) {
            if (!row) return this.add(`|error|Error: corrupted ranking data`);
            const formatId = (0, import_battle_dex.toID)(row.formatid);
            if (!formatTargeting || formats[formatId] || gens[formatId.slice(0, 4)] || gens["gen6"] && !formatId.startsWith("gen")) {
              buffer += "<tr>";
            } else {
              buffer += '<tr class="hidden">';
              hiddenFormats.push(window.BattleLog.escapeFormat(formatId, true));
            }
            for (const value of [row.elo, row.rpr, row.rprd, row.gxe, row.w, row.l, row.t]) {
              if (typeof value !== "number" && typeof value !== "string") {
                return this.add(`|error|Error: corrupted ranking data`);
              }
            }
            buffer += `<td> ${import_battle_log.BattleLog.escapeHTML(import_battle_log.BattleLog.formatName(formatId, true))} </td><td><strong>${Math.round(row.elo)}</strong></td>`;
            if (row.rprd > 100) {
              buffer += `<td>&ndash;</td>`;
              buffer += `<td><span style="color:#888"><em>${Math.round(row.rpr)} <small> &#177; ${Math.round(row.rprd)} </small></em> <small>(provisional)</small></span></td>`;
            } else {
              buffer += `<td>${Math.trunc(row.gxe)}<small>.${row.gxe.toFixed(1).slice(-1)}%</small></td>`;
              buffer += `<td><em>${Math.round(row.rpr)} <small> &#177; ${Math.round(row.rprd)}</small></em></td>`;
            }
            const N = parseInt(row.w, 10) + parseInt(row.l, 10) + parseInt(row.t, 10);
            const COIL_B = void 0;
            if (COIL_B) {
              buffer += `<td>${Math.round(40 * parseFloat(row.gxe) * 2 ** (-COIL_B / N))}</td>`;
            } else {
              buffer += "<td>&mdash;</td>";
            }
            buffer += `<td> ${row.w} </td><td> ${row.l} </td><td> ${N} </td>`;
            if (suspect) {
              if (typeof row.suspect === "undefined") {
                buffer += "<td>&mdash;</td>";
              } else {
                buffer += "<td>";
                buffer += row.suspect ? "Yes" : "No";
                buffer += "</td>";
              }
            }
            buffer += "</tr>";
          }
          if (hiddenFormats.length) {
            if (hiddenFormats.length === data.length) {
              const formatsText = Object.keys(gens).concat(Object.keys(formats)).join(", ");
              buffer += `<tr class="no-matches"><td colspan="8">` + import_battle_log.BattleLog.html`<em>This user has not played any ladder games that match ${formatsText}.</em></td></tr>`;
            }
            const otherFormats = hiddenFormats.slice(0, 3).join(", ") + (hiddenFormats.length > 3 ? ` and ${hiddenFormats.length - 3} other formats` : "");
            buffer += `<tr><td colspan="8"><button name="showOtherFormats">` + import_battle_log.BattleLog.html`${otherFormats} not shown</button></td></tr>`;
          }
          let userid = (0, import_battle_dex.toID)(targets[0]);
          let registered = import_client_main.PS.user.registered;
          if (registered && import_client_main.PS.user.userid === userid) {
            buffer += `<tr><td colspan="8" style="text-align:right"><a href="//${import_client_main.PS.routes.users}/${userid}">Reset W/L</a></tr></td>`;
          }
          buffer += "</table></div>";
          this.add(`|html|${buffer}`);
        });
      },
      // battle-specific commands
      // ------------------------
      "play"() {
        if (!this.battle) return this.add("|error|You are not in a battle");
        if (this.battle.atQueueEnd) {
          this.battle.reset();
        }
        this.battle.play();
        this.update(null);
      },
      "pause"() {
        if (!this.battle) return this.add("|error|You are not in a battle");
        this.battle.pause();
        this.update(null);
      },
      "ffto,fastfowardto"(target) {
        if (!this.battle) return this.add("|error|You are not in a battle");
        let turnNum = Number(target);
        if (target.startsWith("+") || turnNum < 0) {
          turnNum += this.battle.turn;
          if (turnNum < 0) turnNum = 0;
        } else if (target === "end") {
          turnNum = Infinity;
        }
        if (isNaN(turnNum)) {
          this.receiveLine([`error`, `/ffto - Invalid turn number: ${target}`]);
          return;
        }
        this.battle.seekTurn(turnNum);
        this.update(null);
      },
      "switchsides"() {
        if (!this.battle) return this.add("|error|You are not in a battle");
        this.battle.switchViewpoint();
      },
      "cancel,undo"() {
        if (!this.battle) return this.send("/cancelchallenge");
        const room = this;
        if (!room.choices || !room.request) {
          this.receiveLine([`error`, `/choose - You are not a player in this battle`]);
          return;
        }
        if (room.choices.isDone() || room.choices.isEmpty()) {
          this.sendDirect("/undo");
        }
        room.choices = new import_battle_choices.BattleChoiceBuilder(room.request);
        this.update(null);
      },
      "move,switch,team,pass,shift,choose"(target, cmd) {
        if (!this.battle) return this.add("|error|You are not in a battle");
        const room = this;
        if (!room.choices) {
          this.receiveLine([`error`, `/choose - You are not a player in this battle`]);
          return;
        }
        if (cmd !== "choose") target = `${cmd} ${target}`;
        if (target === "choose auto" || target === "choose default") {
          this.sendDirect("/choose default");
          return;
        }
        const possibleError = room.choices.addChoice(target);
        if (possibleError) {
          this.errorReply(possibleError);
          return;
        }
        if (room.choices.isDone()) this.sendDirect(`/choose ${room.choices.toString()}`);
        this.update(null);
      }
    });
    if (options.args?.pmTarget) this.pmTarget = options.args.pmTarget;
    if (options.args?.challengeMenuOpen) this.challengeMenuOpen = true;
    if (options.args?.initialSlash) this.initialSlash = true;
    this.updateTarget(this.pmTarget);
    this.connect();
  }
  static {
    this.highlightRegExp = null;
  }
  connect() {
    if (!this.connected) {
      if (this.pmTarget === null) import_client_main.PS.send(`/join ${this.id}`);
      this.connected = true;
      this.connectWhenLoggedIn = false;
    }
  }
  receiveLine(args) {
    switch (args[0]) {
      case "users":
        const usernames = args[1].split(",");
        const count = parseInt(usernames.shift(), 10);
        this.setUsers(count, usernames);
        return;
      case "join":
      case "j":
      case "J":
        this.addUser(args[1]);
        this.handleJoinLeave("join", args[1], args[0] === "J");
        return true;
      case "leave":
      case "l":
      case "L":
        this.removeUser(args[1]);
        this.handleJoinLeave("leave", args[1], args[0] === "L");
        return true;
      case "name":
      case "n":
      case "N":
        this.renameUser(args[1], args[2]);
        break;
      case "tournament":
      case "tournaments":
        this.tour ||= new import_panel_chat_tournament.ChatTournament(this);
        this.tour.receiveLine(args);
        return;
      case "noinit":
        if (this.battle) {
          this.loadReplay();
        } else {
          this.receiveLine(["bigerror", "Room does not exist"]);
        }
        return;
      case "expire":
        this.connected = "expired";
        this.receiveLine(["", `This room has expired (you can't chat in it anymore)`]);
        return;
      case "chat":
      case "c":
        if (`${args[2]} `.startsWith("/challenge ")) {
          this.updateChallenge(args[1], args[2].slice(11));
          return;
        }
      // falls through
      case "c:":
        if (args[0] === "c:") import_client_main.PS.lastMessageTime = args[1];
        this.lastMessage = args;
        this.joinLeave = null;
        this.markUserActive(args[args[0] === "c:" ? 2 : 1]);
        if (this.tour) this.tour.joinLeave = null;
        if (this.id.startsWith("dm-")) {
          const fromUser = args[args[0] === "c:" ? 2 : 1];
          if ((0, import_battle_dex.toID)(fromUser) === import_client_main.PS.user.userid) break;
          const message = args[args[0] === "c:" ? 3 : 2];
          this.notify({
            title: `${this.title}`,
            body: message
          });
        } else {
          this.subtleNotify();
        }
        break;
      case ":":
        this.timeOffset = Math.trunc(Date.now() / 1e3) - (parseInt(args[1], 10) || 0);
        break;
    }
    super.receiveLine(args);
  }
  handleReconnect(msg) {
    if (this.battle) {
      this.battle.reset();
      this.battle.stepQueue = [];
      return false;
    } else {
      let lines = msg.split("\n");
      let cutOffStart = 0;
      let cutOffEnd = lines.length;
      const cutOffTime = parseInt(import_client_main.PS.lastMessageTime);
      const cutOffExactLine = this.lastMessage ? "|" + this.lastMessage?.join("|") : "";
      let reconnectMessage = '|raw|<div class="infobox">You reconnected.</div>';
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("|users|")) {
          this.add(lines[i]);
        }
        if (lines[i] === cutOffExactLine) {
          cutOffStart = i + 1;
        } else if (lines[i].startsWith(`|c:|`)) {
          const time = parseInt(lines[i].split("|")[2] || "");
          if (time < cutOffTime) cutOffStart = i;
        }
        if (lines[i].startsWith('|raw|<div class="infobox"> You joined ')) {
          reconnectMessage = `|raw|<div class="infobox">You reconnected to ${lines[i].slice(38)}`;
          cutOffEnd = i;
          if (!lines[i - 1]) cutOffEnd = i - 1;
        }
      }
      lines = lines.slice(cutOffStart, cutOffEnd);
      if (lines.length) {
        this.receiveLine([`raw`, `<div class="infobox">You disconnected.</div>`]);
        for (const line of lines) this.receiveLine(import_battle_text_parser.BattleTextParser.parseLine(line));
        this.receiveLine(import_battle_text_parser.BattleTextParser.parseLine(reconnectMessage));
      }
      this.update(null);
      return true;
    }
  }
  updateTarget(name) {
    const selfWithGroup = `${import_client_main.PS.user.group || " "}${import_client_main.PS.user.name}`;
    if (this.id === "dm-") {
      this.pmTarget = selfWithGroup;
      this.setUsers(1, [selfWithGroup]);
      this.title = `Console`;
    } else if (this.id.startsWith("dm-")) {
      const id = this.id.slice(3);
      if ((0, import_battle_dex.toID)(name) !== id) name = null;
      name ||= this.pmTarget || id;
      if (/[A-Za-z0-9]/.test(name.charAt(0))) name = ` ${name}`;
      const nameWithGroup = name;
      name = name.slice(1);
      this.pmTarget = name;
      if (!import_client_main.PS.user.userid) {
        this.setUsers(1, [nameWithGroup]);
      } else {
        this.setUsers(2, [nameWithGroup, selfWithGroup]);
      }
      this.title = `[DM] ${nameWithGroup.trim()}`;
    }
  }
  static getHighlight(message, roomid) {
    let highlights = import_client_main.PS.prefs.highlights || {};
    if (Array.isArray(highlights)) {
      highlights = { global: highlights };
      import_client_main.PS.prefs.set("highlights", highlights);
    }
    if (!import_client_main.PS.prefs.noselfhighlight && import_client_main.PS.user.nameRegExp) {
      if (import_client_main.PS.user.nameRegExp?.test(message)) return true;
    }
    if (!this.highlightRegExp) {
      try {
        this.updateHighlightRegExp(highlights);
      } catch {
        return false;
      }
    }
    const id = import_client_main.PS.server.id + "#" + roomid;
    const globalHighlightsRegExp = this.highlightRegExp?.["global"];
    const roomHighlightsRegExp = this.highlightRegExp?.[id];
    return globalHighlightsRegExp?.test(message) || roomHighlightsRegExp?.test(message);
  }
  static updateHighlightRegExp(highlights) {
    this.highlightRegExp = {};
    for (let i in highlights) {
      if (!highlights[i].length) {
        this.highlightRegExp[i] = null;
        continue;
      }
      this.highlightRegExp[i] = new RegExp("(?:\\b|(?!\\w))(?:" + highlights[i].join("|") + ")(?:\\b|(?!\\w))", "i");
    }
  }
  openChallenge() {
    if (!this.pmTarget) {
      this.add(`|error|Can only be used in a PM.`);
      return;
    }
    this.challengeMenuOpen = true;
    this.update(null);
  }
  cancelChallenge() {
    if (!this.pmTarget) {
      this.add(`|error|Can only be used in a PM.`);
      return;
    }
    if (this.challenging) {
      this.sendDirect("/cancelchallenge");
      this.challenging = null;
      this.challengeMenuOpen = true;
    } else {
      this.challengeMenuOpen = false;
    }
    this.update(null);
  }
  parseChallenge(challengeString) {
    if (!challengeString) return null;
    let splitChallenge = challengeString.split("|");
    const challenge = {
      formatName: splitChallenge[0],
      teamFormat: splitChallenge[1] ?? splitChallenge[0],
      message: splitChallenge[2],
      acceptButtonLabel: splitChallenge[3],
      rejectButtonLabel: splitChallenge[4]
    };
    if (!challenge.formatName && !challenge.message) {
      return null;
    }
    return challenge;
  }
  updateChallenge(name, challengeString) {
    const challenge = this.parseChallenge(challengeString);
    const userid = (0, import_battle_dex.toID)(name);
    if (userid === import_client_main.PS.user.userid) {
      if (!challenge && !this.challenging) {
        this.challenged = null;
      }
      this.challenging = challenge;
    } else {
      if (!challenge && !this.challenged) {
        this.challenging = null;
      }
      this.challenged = challenge;
      if (challenge) {
        this.notify({
          title: `Challenge from ${name}`,
          body: `Format: ${import_battle_log.BattleLog.formatName(challenge.formatName)}`,
          id: "challenge"
        });
      }
    }
    this.update(null);
  }
  markUserActive(name) {
    const userid = (0, import_battle_dex.toID)(name);
    const idx = this.userActivity.indexOf(userid);
    this.users[userid] = name;
    if (idx !== -1) {
      this.userActivity.splice(idx, 1);
    }
    this.userActivity.push(userid);
    if (this.userActivity.length > 100) {
      this.userActivity.splice(0, 20);
    }
  }
  sendDirect(line) {
    if (this.pmTarget) {
      line = line.split("\n").filter(Boolean).map((row) => `/pm ${this.pmTarget}, ${row}`).join("\n");
      import_client_main.PS.send(line);
      return;
    }
    super.sendDirect(line);
  }
  setUsers(count, usernames) {
    this.userCount = count;
    this.onlineUsers = [];
    for (const username of usernames) {
      const userid = (0, import_battle_dex.toID)(username);
      this.users[userid] = username;
      this.onlineUsers.push([userid, username]);
    }
    this.sortOnlineUsers();
    this.update(null);
  }
  sortOnlineUsers() {
    import_battle_dex.PSUtils.sortBy(this.onlineUsers, ([id, name]) => [import_client_main.PS.server.getGroup(name.charAt(0)).order, !name.endsWith("@!"), id]);
  }
  addUser(username) {
    if (!username) return;
    const userid = (0, import_battle_dex.toID)(username);
    this.users[userid] = username;
    const index = this.onlineUsers.findIndex(([curUserid]) => curUserid === userid);
    if (index >= 0) {
      this.onlineUsers[index] = [userid, username];
    } else {
      this.userCount++;
      this.onlineUsers.push([userid, username]);
      this.sortOnlineUsers();
    }
    this.update(null);
  }
  removeUser(username, noUpdate) {
    if (!username) return;
    const userid = (0, import_battle_dex.toID)(username);
    const index = this.onlineUsers.findIndex(([curUserid]) => curUserid === userid);
    if (index >= 0) {
      this.userCount--;
      this.onlineUsers.splice(index, 1);
      if (!noUpdate) this.update(null);
    }
  }
  renameUser(username, oldUsername) {
    this.removeUser(oldUsername, true);
    this.addUser(username);
    this.update(null);
  }
  handleJoinLeave(action, name, silent) {
    if (action === "join") {
      this.addUser(name);
    } else if (action === "leave") {
      this.removeUser(name);
    }
    const showjoins = import_client_main.PS.prefs.showjoins?.[import_client_main.PS.server.id];
    if (!(showjoins?.[this.id] ?? showjoins?.["global"] ?? !silent)) return;
    this.joinLeave ||= {
      join: [],
      leave: [],
      messageId: `joinleave-${Date.now()}`
    };
    if (action === "join" && this.joinLeave["leave"].includes(name)) {
      this.joinLeave["leave"].splice(this.joinLeave["leave"].indexOf(name), 1);
    } else if (action === "leave" && this.joinLeave["join"].includes(name)) {
      this.joinLeave["join"].splice(this.joinLeave["join"].indexOf(name), 1);
    } else {
      this.joinLeave[action].push(name);
    }
    let message = this.formatJoinLeave(this.joinLeave["join"], "joined");
    if (this.joinLeave["join"].length && this.joinLeave["leave"].length) message += "; ";
    message += this.formatJoinLeave(this.joinLeave["leave"], "left");
    this.add(`|uhtml|${this.joinLeave.messageId}|<small style="color: #555555">${message}</small>`);
  }
  formatJoinLeave(preList, action) {
    if (!preList.length) return "";
    let message = "";
    let list = [];
    let named = {};
    for (let item of preList) {
      if (!named[item]) list.push(item);
      named[item] = true;
    }
    for (let j = 0; j < list.length; j++) {
      if (j >= 5) {
        message += `, and ${list.length - 5} others`;
        break;
      }
      if (j > 0) {
        if (j === 1 && list.length === 2) {
          message += " and ";
        } else if (j === list.length - 1) {
          message += ", and ";
        } else {
          message += ", ";
        }
      }
      message += import_battle_log.BattleLog.escapeHTML(list[j]);
    }
    return `${message} ${action}`;
  }
  destroy() {
    if (this.pmTarget) this.connected = false;
    if (this.battle) {
      this.battle.destroy();
    } else {
      this.log?.destroy();
    }
    super.destroy();
  }
}
class CopyableURLBox extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.copy = () => {
      const input = this.base.children[0];
      input.select();
      document.execCommand("copy");
    };
  }
  render() {
    return /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "text",
        class: "textbox",
        readOnly: true,
        size: 45,
        value: this.props.url,
        style: "field-sizing:content"
      }
    ), " ", /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.copy }, "Copy"), " ", /* @__PURE__ */ Chat.h("a", { href: this.props.url, target: "_blank", class: "no-panel-intercept" }, /* @__PURE__ */ Chat.h("button", { class: "button" }, "Visit")));
  }
}
class ChatTextEntry extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.subscription = null;
    this.textbox = null;
    this.miniedit = null;
    this.history = [];
    this.historyIndex = 0;
    this.tabComplete = null;
    this.update = () => {
      if (!this.miniedit) {
        const textbox = this.textbox;
        textbox.style.height = `12px`;
        const newHeight = Math.min(Math.max(textbox.scrollHeight - 2, 16), 600);
        textbox.style.height = `${newHeight}px`;
      }
    };
    this.focusIfNoSelection = (e) => {
      if (e.target.tagName === "TEXTAREA") return;
      const selection = window.getSelection();
      if (selection.type === "Range") return;
      const elem = this.base.children[0].children[1];
      elem.focus();
    };
    this.onKeyDown = (e) => {
      if (this.handleKey(e) || this.props.onKey(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
  }
  componentDidMount() {
    this.subscription = import_client_main.PS.user.subscribe(() => {
      this.forceUpdate();
    });
    const textbox = this.base.children[0].children[1];
    if (textbox.tagName === "TEXTAREA") this.textbox = textbox;
    this.miniedit = new import_miniedit.MiniEdit(textbox, {
      setContent: (text) => {
        textbox.innerHTML = formatText(text, false, false, true) + "\n";
        textbox.classList?.toggle("textbox-empty", !text);
      },
      onKeyDown: this.onKeyDown
    });
    if (this.props.room.args?.initialSlash) {
      this.props.room.args.initialSlash = false;
      this.setValue("/", 1);
    }
    if (this.base) this.update();
  }
  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
  submit() {
    this.props.onMessage(this.getValue(), this.miniedit?.element || this.textbox);
    this.historyPush(this.getValue());
    this.setValue("", 0);
    this.update();
    return true;
  }
  // Direct manipulation functions
  getValue() {
    return this.miniedit ? this.miniedit.getValue() : this.textbox.value;
  }
  setValue(value, start, end = start) {
    if (this.miniedit) {
      this.miniedit.setValue(value, { start, end });
    } else {
      this.textbox.value = value;
      this.textbox.setSelectionRange?.(start, end);
    }
  }
  getSelection() {
    const value = this.getValue();
    let { start, end } = this.miniedit ? this.miniedit.getSelection() || { start: value.length, end: value.length } : { start: this.textbox.selectionStart, end: this.textbox.selectionEnd };
    return { value, start, end };
  }
  setSelection(start, end) {
    if (this.miniedit) {
      this.miniedit.setSelection({ start, end });
    } else {
      this.textbox.setSelectionRange?.(start, end);
    }
  }
  replaceSelection(text) {
    if (this.miniedit) {
      this.miniedit.replaceSelection(text);
    } else {
      const { value, start, end } = this.getSelection();
      const newSelection = start + text.length;
      this.setValue(value.slice(0, start) + text + value.slice(end), newSelection);
    }
  }
  historyUp(ifSelectionCorrect) {
    if (ifSelectionCorrect) {
      const { value, start, end } = this.getSelection();
      if (start !== end) return false;
      if (end !== 0) {
        if (end < value.length) return false;
      }
    }
    if (this.historyIndex === 0) return false;
    const line = this.getValue();
    if (line !== "") this.history[this.historyIndex] = line;
    const newValue = this.history[--this.historyIndex];
    this.setValue(newValue, newValue.length);
    return true;
  }
  historyDown(ifSelectionCorrect) {
    if (ifSelectionCorrect) {
      const { value, start, end } = this.getSelection();
      if (start !== end) return false;
      if (end < value.length) return false;
    }
    const line = this.getValue();
    if (line !== "") this.history[this.historyIndex] = line;
    if (this.historyIndex === this.history.length) {
      if (!line) return false;
      this.setValue("", 0);
    } else if (++this.historyIndex === this.history.length) {
      this.setValue("", 0);
    } else {
      const newValue = this.history[this.historyIndex];
      this.setValue(newValue, newValue.length);
    }
    return true;
  }
  historyPush(line) {
    const duplicateIndex = this.history.lastIndexOf(line);
    if (duplicateIndex >= 0) this.history.splice(duplicateIndex, 1);
    if (this.history.length > 100) this.history.splice(0, 20);
    this.history.push(line);
    this.historyIndex = this.history.length;
  }
  handleKey(ev) {
    const cmdKey = (ev.metaKey ? 1 : 0) + (ev.ctrlKey ? 1 : 0) === 1 && !ev.altKey && !ev.shiftKey;
    if (ev.keyCode === 13 && !ev.shiftKey) {
      return this.submit();
    } else if (ev.keyCode === 13) {
      this.replaceSelection("\n");
      return true;
    } else if (ev.keyCode === 73 && cmdKey) {
      return this.toggleFormatChar("_");
    } else if (ev.keyCode === 66 && cmdKey) {
      return this.toggleFormatChar("*");
    } else if (ev.keyCode === 192 && cmdKey) {
      return this.toggleFormatChar("`");
    } else if (ev.keyCode === 9 && !ev.ctrlKey) {
      const reverse = !!ev.shiftKey;
      return this.handleTabComplete(reverse);
    } else if (ev.keyCode === 38 && !ev.shiftKey && !ev.altKey) {
      return this.historyUp(true);
    } else if (ev.keyCode === 40 && !ev.shiftKey && !ev.altKey) {
      return this.historyDown(true);
    } else if (ev.keyCode === 27) {
      if (this.undoTabComplete()) {
        return true;
      }
      if (import_client_main.PS.room !== import_client_main.PS.panel) {
        import_client_main.PS.leave(import_client_main.PS.room.id);
        return true;
      }
    }
    return false;
  }
  // TODO - add support for commands tabcomplete
  handleTabComplete(reverse) {
    let { value, start, end } = this.getSelection();
    if (start !== end || end === 0) return false;
    const users = this.props.room.users;
    let prefix = value.slice(0, end);
    if (this.tabComplete && prefix === this.tabComplete.cursor) {
      if (reverse) {
        this.tabComplete.candidateIndex--;
        if (this.tabComplete.candidateIndex < 0) {
          this.tabComplete.candidateIndex = this.tabComplete.candidates.length - 1;
        }
      } else {
        this.tabComplete.candidateIndex++;
        if (this.tabComplete.candidateIndex >= this.tabComplete.candidates.length) {
          this.tabComplete.candidateIndex = 0;
        }
      }
    } else if (!value || reverse) {
      return false;
    } else {
      prefix = prefix.trim();
      const match1 = /^([\s\S!/]*?)([A-Za-z0-9][^, \n]*)$/.exec(prefix);
      const match2 = /^([\s\S!/]*?)([A-Za-z0-9][^, \n]* [^, ]*)$/.exec(prefix);
      if (!match1 && !match2) return true;
      const idprefix = match1 ? (0, import_battle_dex.toID)(match1[2]) : "";
      let spaceprefix = match2 ? match2[2].replace(/[^A-Za-z0-9 ]+/g, "").toLowerCase() : "";
      const candidates = [];
      if (match2 && (match2[0] === "/" || match2[0] === "!")) spaceprefix = "";
      for (const userid in users) {
        if (spaceprefix && users[userid].slice(1).replace(/[^A-Za-z0-9 ]+/g, "").toLowerCase().startsWith(spaceprefix)) {
          if (match2) candidates.push({ userid, prefixIndex: match2[1].length });
        } else if (idprefix && userid.startsWith(idprefix)) {
          if (match1) candidates.push({ userid, prefixIndex: match1[1].length });
        }
      }
      const userActivity = this.props.room.userActivity;
      candidates.sort((a, b) => {
        if (a.prefixIndex !== b.prefixIndex) {
          return a.prefixIndex - b.prefixIndex;
        }
        const aIndex = userActivity?.indexOf(a.userid) ?? -1;
        const bIndex = userActivity?.indexOf(b.userid) ?? -1;
        if (aIndex !== bIndex) {
          return bIndex - aIndex;
        }
        return a.userid < b.userid ? -1 : 1;
      });
      if (!candidates.length) {
        this.tabComplete = null;
        return true;
      }
      this.tabComplete = {
        candidates,
        candidateIndex: 0,
        prefix,
        cursor: prefix
      };
    }
    const candidate = this.tabComplete.candidates[this.tabComplete.candidateIndex];
    let name = users[candidate.userid];
    if (!name) return true;
    name = import_battle_dex.Dex.getShortName(name.slice(1));
    const cursor = this.tabComplete.prefix.slice(0, candidate.prefixIndex) + name;
    this.setValue(cursor + value.slice(end), cursor.length);
    this.tabComplete.cursor = cursor;
    return true;
  }
  undoTabComplete() {
    if (!this.tabComplete) return false;
    const value = this.getValue();
    if (!value.startsWith(this.tabComplete.cursor)) return false;
    this.setValue(this.tabComplete.prefix + value.slice(this.tabComplete.cursor.length), this.tabComplete.prefix.length);
    this.tabComplete = null;
    return true;
  }
  toggleFormatChar(formatChar) {
    let { value, start, end } = this.getSelection();
    if (value.charAt(start) === formatChar && value.charAt(start - 1) === formatChar && value.charAt(start - 2) !== formatChar) {
      start++;
    }
    if (value.charAt(end) === formatChar && value.charAt(end - 1) === formatChar && value.charAt(end - 2) !== formatChar) {
      end--;
    }
    const wrap = formatChar + formatChar;
    value = value.slice(0, start) + wrap + value.slice(start, end) + wrap + value.slice(end);
    start += 2;
    end += 2;
    const nesting = wrap + wrap;
    if (value.slice(start - 4, start) === nesting) {
      value = value.slice(0, start - 4) + value.slice(start);
      start -= 4;
      end -= 4;
    } else if (start !== end && value.slice(start - 2, start + 2) === nesting) {
      value = value.slice(0, start - 2) + value.slice(start + 2);
      start -= 2;
      end -= 4;
    }
    if (value.slice(end, end + 4) === nesting) {
      value = value.slice(0, end) + value.slice(end + 4);
    } else if (start !== end && value.slice(end - 2, end + 2) === nesting) {
      value = value.slice(0, end - 2) + value.slice(end + 2);
      end -= 2;
    }
    this.setValue(value, start, end);
    return true;
  }
  render() {
    const { room } = this.props;
    const OLD_TEXTBOX = false;
    const canTalk = import_client_main.PS.user.named || room.id === "dm-";
    if (room.connected === "client-only" && room.id.startsWith("battle-")) {
      return /* @__PURE__ */ Chat.h(
        "div",
        {
          class: "chat-log-add hasuserlist",
          onClick: this.focusIfNoSelection,
          style: { left: this.props.left || 0 }
        },
        /* @__PURE__ */ Chat.h(CopyableURLBox, { url: `https://psim.us/r/${room.id.slice(7)}` })
      );
    }
    return /* @__PURE__ */ Chat.h(
      "div",
      {
        class: "chat-log-add hasuserlist",
        onClick: this.focusIfNoSelection,
        style: { left: this.props.left || 0 }
      },
      /* @__PURE__ */ Chat.h("form", { class: `chatbox${this.props.tinyLayout ? " nolabel" : ""}`, style: canTalk ? {} : { display: "none" } }, /* @__PURE__ */ Chat.h("label", { style: `color:${import_battle_log.BattleLog.usernameColor(import_client_main.PS.user.userid)}` }, import_client_main.PS.user.name, ":"), OLD_TEXTBOX ? /* @__PURE__ */ Chat.h(
        "textarea",
        {
          class: room.connected === true && canTalk ? "textbox autofocus" : "textbox disabled",
          autofocus: true,
          rows: 1,
          onInput: this.update,
          onKeyDown: this.onKeyDown,
          style: { resize: "none", width: "100%", height: "16px", padding: "2px 3px 1px 3px" },
          placeholder: import_panels.PSView.focusPreview(room)
        }
      ) : /* @__PURE__ */ Chat.h(
        ChatTextBox,
        {
          disabled: room.connected !== true || !canTalk,
          placeholder: import_panels.PSView.focusPreview(room)
        }
      )),
      !canTalk && /* @__PURE__ */ Chat.h("button", { "data-href": "login", class: "button autofocus" }, "Choose a name before sending messages")
    );
  }
}
class ChatTextBox extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.handleFocus = () => {
      import_panels.PSView.setTextboxFocused(true);
    };
    this.handleBlur = () => {
      import_panels.PSView.setTextboxFocused(false);
    };
  }
  shouldComponentUpdate(nextProps) {
    this.base.setAttribute("placeholder", nextProps.placeholder);
    this.base.classList?.toggle("disabled", !!nextProps.disabled);
    this.base.classList?.toggle("autofocus", !nextProps.disabled);
    return false;
  }
  render() {
    return /* @__PURE__ */ Chat.h(
      "pre",
      {
        class: `textbox textbox-empty ${this.props.disabled ? " disabled" : " autofocus"}`,
        placeholder: this.props.placeholder,
        onFocus: this.handleFocus,
        onBlur: this.handleBlur
      },
      "\n"
    );
  }
}
class ChatPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.send = (text, elem) => {
      this.props.room.send(text, elem);
    };
    this.onKey = (e) => {
      if (e.keyCode === 33) {
        const chatLog = this.base.getElementsByClassName("chat-log")[0];
        chatLog.scrollTop = chatLog.scrollTop - chatLog.offsetHeight + 60;
        return true;
      } else if (e.keyCode === 34) {
        const chatLog = this.base.getElementsByClassName("chat-log")[0];
        chatLog.scrollTop = chatLog.scrollTop + chatLog.offsetHeight - 60;
        return true;
      }
      return false;
    };
    this.makeChallenge = (e, format, team) => {
      import_client_main.PS.requestNotifications();
      const room = this.props.room;
      const packedTeam = team ? team.packedTeam : "";
      const privacy = import_client_main.PS.mainmenu.adjustPrivacy();
      if (!room.pmTarget) throw new Error("Not a PM room");
      import_client_main.PS.send(`/utm ${packedTeam}`);
      import_client_main.PS.send(`${privacy}/challenge ${room.pmTarget}, ${format}`);
      room.challengeMenuOpen = false;
      room.challenging = {
        formatName: format,
        teamFormat: format
      };
      room.update(null);
    };
    this.acceptChallenge = (e, format, team) => {
      const room = this.props.room;
      const packedTeam = team ? team.packedTeam : "";
      if (!room.pmTarget) throw new Error("Not a PM room");
      import_client_main.PS.send(`/utm ${packedTeam}`);
      this.props.room.send(`/accept`);
      room.challenged = null;
      room.update(null);
    };
  }
  static {
    this.id = "chat";
  }
  static {
    this.routes = ["dm-*", "groupchat-*", "*"];
  }
  static {
    this.Model = ChatRoom;
  }
  static {
    this.location = "right";
  }
  static {
    this.icon = /* @__PURE__ */ Chat.h("i", { class: "fa fa-comment-o", "aria-hidden": true });
  }
  componentDidMount() {
    super.componentDidMount();
    this.subscribeTo(import_client_main.PS.user, () => {
      this.props.room.updateTarget();
    });
  }
  render() {
    const room = this.props.room;
    const tinyLayout = room.width < 450;
    const challengeTo = room.challenging ? /* @__PURE__ */ Chat.h("div", { class: "challenge" }, /* @__PURE__ */ Chat.h("p", null, "Waiting for ", room.pmTarget, "..."), /* @__PURE__ */ Chat.h(import_panel_mainmenu.TeamForm, { format: room.challenging.formatName, teamFormat: room.challenging.teamFormat, onSubmit: null }, /* @__PURE__ */ Chat.h("button", { "data-cmd": "/cancelchallenge", class: "button" }, "Cancel"))) : room.challengeMenuOpen ? /* @__PURE__ */ Chat.h("div", { class: "challenge" }, /* @__PURE__ */ Chat.h(import_panel_mainmenu.TeamForm, { onSubmit: this.makeChallenge }, /* @__PURE__ */ Chat.h("button", { type: "submit", class: "button button-first" }, /* @__PURE__ */ Chat.h("strong", null, "Challenge")), /* @__PURE__ */ Chat.h("button", { "data-href": "battleoptions", class: "button button-last", "aria-label": "Battle options" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-caret-down", "aria-hidden": true })), " ", /* @__PURE__ */ Chat.h("button", { "data-cmd": "/cancelchallenge", class: "button" }, "Cancel"))) : null;
    const challengeFrom = room.challenged ? /* @__PURE__ */ Chat.h("div", { class: "challenge" }, !!room.challenged.message && /* @__PURE__ */ Chat.h("p", null, room.challenged.message), /* @__PURE__ */ Chat.h(import_panel_mainmenu.TeamForm, { format: room.challenged.formatName, teamFormat: room.challenged.teamFormat, onSubmit: this.acceptChallenge }, /* @__PURE__ */ Chat.h("button", { type: "submit", class: room.challenged.formatName ? `button button-first` : `button` }, /* @__PURE__ */ Chat.h("strong", null, room.challenged.acceptButtonLabel || "Accept")), room.challenged.formatName && /* @__PURE__ */ Chat.h("button", { "data-href": "battleoptions", class: "button button-last", "aria-label": "Battle options" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-caret-down", "aria-hidden": true })), " ", /* @__PURE__ */ Chat.h("button", { "data-cmd": "/reject", class: "button" }, room.challenged.rejectButtonLabel || "Reject"))) : null;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, focusClick: true, fullSize: true }, /* @__PURE__ */ Chat.h(ChatLog, { class: "chat-log", room: this.props.room, left: tinyLayout ? 0 : 146, top: room.tour?.info.isActive ? 30 : 0 }, challengeTo, challengeFrom, import_client_main.PS.isOffline && /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/reconnect" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-plug", "aria-hidden": true }), " ", /* @__PURE__ */ Chat.h("strong", null, "Reconnect")), " ", import_client_main.PS.connection?.reconnectTimer && /* @__PURE__ */ Chat.h("small", null, "(Autoreconnect in ", Math.round(import_client_main.PS.connection.reconnectDelay / 1e3), "s)"))), room.tour && /* @__PURE__ */ Chat.h(import_panel_chat_tournament.TournamentBox, { tour: room.tour, left: tinyLayout ? 0 : 146 }), /* @__PURE__ */ Chat.h(
      ChatTextEntry,
      {
        room: this.props.room,
        onMessage: this.send,
        onKey: this.onKey,
        left: tinyLayout ? 0 : 146,
        tinyLayout
      }
    ), /* @__PURE__ */ Chat.h(ChatUserList, { room: this.props.room, minimized: tinyLayout }));
  }
}
class ChatUserList extends import_preact.default.Component {
  render() {
    const room = this.props.room;
    const pmTargetid = room.pmTarget ? (0, import_battle_dex.toID)(room.pmTarget) : null;
    return /* @__PURE__ */ Chat.h(
      "div",
      {
        class: "userlist" + (this.props.minimized ? " userlist-hidden" : this.props.static ? " userlist-static" : ""),
        style: { left: this.props.left || 0, top: this.props.top || 0 }
      },
      !this.props.minimized ? /* @__PURE__ */ Chat.h("div", { class: "userlist-count" }, /* @__PURE__ */ Chat.h("small", null, room.userCount, " users")) : room.id === "dm-" ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("button", { class: "button button-middle", "data-cmd": "/help" }, "Commands")) : pmTargetid ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("button", { class: "button button-middle", "data-cmd": "/challenge" }, "Challenge"), /* @__PURE__ */ Chat.h("button", { class: "button button-middle", "data-href": `useroptions-${pmTargetid}` }, "\u2026")) : /* @__PURE__ */ Chat.h("button", { "data-href": "userlist", class: "button button-middle" }, room.userCount, " users"),
      /* @__PURE__ */ Chat.h("ul", null, room.onlineUsers.map(([userid, name]) => {
        const groupSymbol = name.charAt(0);
        const group = import_client_main.PS.server.groups[groupSymbol] || { type: "user", order: 0 };
        let color;
        if (name.endsWith("@!")) {
          name = name.slice(0, -2);
          color = "#888888";
        } else {
          color = import_battle_log.BattleLog.usernameColor(userid);
        }
        return /* @__PURE__ */ Chat.h("li", { key: userid }, /* @__PURE__ */ Chat.h("button", { class: "userbutton username" }, /* @__PURE__ */ Chat.h("em", { class: `group${["leadership", "staff"].includes(group.type) ? " staffgroup" : ""}` }, groupSymbol), group.type === "leadership" ? /* @__PURE__ */ Chat.h("strong", null, /* @__PURE__ */ Chat.h("em", { style: `color:${color}` }, name.slice(1))) : group.type === "staff" ? /* @__PURE__ */ Chat.h("strong", { style: `color:${color} ` }, name.slice(1)) : /* @__PURE__ */ Chat.h("span", { style: `color:${color}` }, name.slice(1))));
      }))
    );
  }
}
class ChatLog extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.subscription = null;
  }
  componentDidMount() {
    const room = this.props.room;
    if (room.log) {
      const elem = room.log.elem;
      this.base.replaceChild(elem, this.base.firstChild);
      elem.className = this.props.class;
      elem.style.left = `${this.props.left || 0}px`;
      elem.style.top = `${this.props.top || 0}px`;
    }
    if (!this.props.noSubscription) {
      room.log ||= new import_battle_log.BattleLog(this.base.firstChild);
      room.log.getHighlight = room.handleHighlight;
      if (room.backlog) {
        const backlog = room.backlog;
        room.backlog = null;
        for (const args of backlog) {
          room.log.add(args, void 0, void 0, import_client_main.PS.prefs.timestamps[room.pmTarget ? "pms" : "chatrooms"]);
        }
      }
      this.subscription = room.subscribe((tokens) => {
        if (!tokens) return;
        this.props.room.log.add(tokens, void 0, void 0, import_client_main.PS.prefs.timestamps[room.pmTarget ? "pms" : "chatrooms"]);
      });
    }
    this.setControlsJSX(this.props.children);
  }
  componentWillUnmount() {
    this.subscription?.unsubscribe();
  }
  shouldComponentUpdate(props) {
    const elem = this.base.firstChild;
    if (props.class !== this.props.class) {
      elem.className = props.class;
    }
    if (props.left !== this.props.left) elem.style.left = `${props.left || 0}px`;
    if (props.top !== this.props.top) elem.style.top = `${props.top || 0}px`;
    this.setControlsJSX(props.children);
    this.updateScroll();
    return false;
  }
  setControlsJSX(jsx) {
    const elem = this.base.firstChild;
    const children = elem.children;
    let controlsElem = children[children.length - 1];
    if (controlsElem && controlsElem.className !== "controls") controlsElem = void 0;
    if (!jsx) {
      if (!controlsElem) return;
      elem.removeChild(controlsElem);
      this.updateScroll();
      return;
    }
    if (!controlsElem) {
      controlsElem = document.createElement("div");
      controlsElem.className = "controls";
      elem.appendChild(controlsElem);
    }
    if (controlsElem.children[0]) controlsElem.removeChild(controlsElem.children[0]);
    import_preact.default.render(/* @__PURE__ */ Chat.h("div", null, jsx), controlsElem);
    this.updateScroll();
  }
  updateScroll() {
    this.props.room.log?.updateScroll();
  }
  render() {
    return /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h(
      "div",
      {
        class: this.props.class,
        role: "log",
        "aria-label": "Chat log",
        style: { left: this.props.left || 0, top: this.props.top || 0 }
      }
    ));
  }
}
import_client_main.PS.addRoomType(ChatPanel);
//# sourceMappingURL=panel-chat.js.map
