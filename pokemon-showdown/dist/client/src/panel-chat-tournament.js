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
var panel_chat_tournament_exports = {};
__export(panel_chat_tournament_exports, {
  ChatTournament: () => ChatTournament,
  TourPopOutPanel: () => TourPopOutPanel,
  TournamentBox: () => TournamentBox,
  TournamentBracket: () => TournamentBracket,
  TournamentTreeBracket: () => TournamentTreeBracket
});
module.exports = __toCommonJS(panel_chat_tournament_exports);
var import_preact = __toESM(require("../js/lib/preact"));
var import_battle_dex = require("./battle-dex");
var import_battle_log = require("./battle-log");
var import_client_core = require("./client-core");
var import_client_main = require("./client-main");
var import_panel_mainmenu = require("./panel-mainmenu");
var d3 = __toESM(require("d3"));
var import_panels = require("./panels");
class ChatTournament extends import_client_core.PSModel {
  constructor(room) {
    super();
    this.info = {};
    this.updates = {};
    this.boxVisible = false;
    this.selectedChallenge = 0;
    this.joinLeave = null;
    this.room = room;
  }
  tryAdd(line) {
    if (import_client_main.PS.prefs.tournaments === "hide") return false;
    this.room.add(line);
    return true;
  }
  static arrayToPhrase(array, finalSeparator = "and") {
    if (array.length <= 1)
      return array.join();
    return `${array.slice(0, -1).join(", ")} ${finalSeparator} ${array.slice(-1)[0]}`;
  }
  handleJoinLeave(action, name) {
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
    if (!this.joinLeave[action].includes(name)) this.joinLeave[action].push(name);
    let message = this.joinLeave["join"].length ? ChatTournament.arrayToPhrase(this.joinLeave["join"]) + " joined the tournament" : "";
    if (this.joinLeave["join"].length && this.joinLeave["leave"].length) message += "; ";
    message += this.joinLeave["leave"].length ? ChatTournament.arrayToPhrase(this.joinLeave["leave"]) + " left the tournament" : "";
    this.tryAdd(`|uhtml|${this.joinLeave.messageId}|<div class="tournament-message-joinleave">${message}.</div>`);
  }
  tournamentName() {
    if (!this.info.format || !this.info.generator) return "";
    const formatName = import_battle_log.BattleLog.formatName(this.info.format);
    const type = this.info.generator;
    return `${formatName} ${type} Tournament`;
  }
  receiveLine(args) {
    const data = args.slice(2);
    const notify = import_client_main.PS.prefs.tournaments === "notify" || !import_client_main.PS.prefs.tournaments && this.info.isJoined;
    let cmd = args[1].toLowerCase();
    if (args[0] === "tournaments") {
      switch (cmd) {
        case "info":
          const tournaments = JSON.parse(data.join("|"));
          let buf = `<div class="infobox tournaments-info">`;
          if (tournaments.length <= 0) {
            buf += `No tournaments are currently running.`;
          } else {
            buf += `<ul>`;
            for (const tournament of tournaments) {
              const formatName = import_battle_log.BattleLog.formatName(tournament.format);
              buf += `<li>`;
              buf += import_battle_log.BattleLog.html`<a class="ilink" href="${(0, import_battle_dex.toRoomid)(tournament.room)}">${tournament.room}</a>`;
              buf += import_battle_log.BattleLog.html`: ${formatName} ${tournament.generator}${tournament.isStarted ? " (Started)" : ""}`;
              buf += `</li>`;
            }
            buf += `</ul>`;
          }
          buf += "</div>";
          this.tryAdd(`|html|${buf}`);
          break;
        default:
          return true;
      }
    } else if (args[0] === "tournament") {
      switch (cmd) {
        case "create": {
          this.info.format = args[2];
          this.info.generator = args[3];
          const formatName = import_battle_log.BattleLog.formatName(args[2]);
          const type = args[3];
          const buf = import_battle_log.BattleLog.html`<div class="tournament-message-create">${this.tournamentName()} created.</div>`;
          if (!this.tryAdd(`|html|${buf}`)) {
            const hiddenBuf = import_battle_log.BattleLog.html`<div class="tournament-message-create">${this.tournamentName()} created (and hidden).</div>`;
            this.room.add(`|html|${hiddenBuf}`);
          }
          if (notify) {
            this.room.notify({
              title: "Tournament created",
              body: `Room: ${this.room.title}
Format: ${formatName}
Type: ${type}`,
              id: "tournament-create"
            });
          }
          break;
        }
        case "join":
        case "leave": {
          this.handleJoinLeave(cmd, args[2]);
          break;
        }
        case "replace": {
          this.tryAdd(`||${args[3]} has joined the tournament, replacing ${args[4]}.`);
          break;
        }
        case "start":
          this.room.dismissNotification("tournament-create");
          if (!this.info.isJoined) {
            this.boxVisible = false;
          } else if (this.info.teambuilderFormat?.startsWith("gen5") && !import_battle_dex.Dex.loadedSpriteData["bw"]) {
            import_battle_dex.Dex.loadSpriteData("bw");
          }
          let participants = data[0] ? ` (${data[0]} players)` : "";
          this.room.add(`|html|<div class="tournament-message-start">The tournament has started!${participants}</div>`);
          break;
        case "disqualify":
          this.tryAdd(import_battle_log.BattleLog.html`|html|<div class="tournament-message-disqualify">${data[0]} has been disqualified from the tournament.</div>`);
          break;
        case "autodq":
          if (data[0] === "off") {
            this.tryAdd(`|html|<div class="tournament-message-autodq-off">The tournament's automatic disqualify timer has been turned off.</div>`);
          } else if (data[0] === "on") {
            let minutes = Math.round(parseInt(data[1]) / 1e3 / 60);
            this.tryAdd(import_battle_log.BattleLog.html`|html|<div class="tournament-message-autodq-on">The tournament's automatic disqualify timer has been set to ${minutes} minute${minutes === 1 ? "" : "s"}.</div>`);
          } else {
            let seconds = Math.floor(parseInt(data[1]) / 1e3);
            import_client_main.PS.alert(`Please respond to the tournament within ${seconds} seconds or you may be automatically disqualified.`);
            if (notify) {
              this.room.notify({
                title: "Tournament Automatic Disqualification Warning",
                body: `Room: ${this.room.title}
Seconds: ${seconds}`,
                id: "tournament-autodq-warning"
              });
            }
          }
          break;
        case "autostart":
          if (data[0] === "off") {
            this.tryAdd(`|html|<div class="tournament-message-autostart">The tournament's automatic start is now off.</div>`);
          } else if (data[0] === "on") {
            let minutes = parseInt(data[1]) / 1e3 / 60;
            this.tryAdd(import_battle_log.BattleLog.html`|html|<div class="tournament-message-autostart">The tournament will automatically start in ${minutes} minute${minutes === 1 ? "" : "s"}.</div>`);
          }
          break;
        case "scouting":
          if (data[0] === "allow") {
            this.tryAdd(`|html|<div class="tournament-message-scouting">Scouting is now allowed (Tournament players can watch other tournament battles)</div>`);
          } else if (data[0] === "disallow") {
            this.tryAdd(`|html|<div class="tournament-message-scouting">Scouting is now banned (Tournament players can't watch other tournament battles)</div>`);
          }
          break;
        case "update":
          Object.assign(this.updates, JSON.parse(data.join("|")));
          break;
        case "updateend":
          const info = { ...this.info, ...this.updates };
          if (!info.isActive) {
            if (!info.isStarted || info.isJoined)
              this.boxVisible = true;
            info.isActive = true;
          }
          if ("format" in this.updates || "teambuilderFormat" in this.updates) {
            if (!info.teambuilderFormat) info.teambuilderFormat = info.format;
          }
          if (info.isStarted && info.isJoined) {
            if ("challenges" in this.updates) {
              if (info.challenges?.length) {
                this.boxVisible = true;
                if (!this.info.challenges?.length) {
                  if (notify) {
                    this.room.notify({
                      title: "Tournament challenges available",
                      body: `Room: ${this.room.title}`,
                      id: "tournament-challenges"
                    });
                  }
                }
              }
            }
            if ("challenged" in this.updates) {
              if (info.challenged) {
                this.boxVisible = true;
                if (!this.info.challenged) {
                  if (notify) {
                    this.room.notify({
                      title: `Tournament challenge from ${info.challenged}`,
                      body: `Room: ${this.room.title}`,
                      id: "tournament-challenged"
                    });
                  }
                }
              }
            }
          }
          this.info = info;
          this.updates = {};
          this.update();
          break;
        case "battlestart": {
          const roomid = (0, import_battle_dex.toRoomid)(data[2]);
          this.tryAdd(`|uhtml|tournament-${roomid}|<div class="tournament-message-battlestart"><a href="${roomid}" class="ilink">Tournament battle between ${import_battle_log.BattleLog.escapeHTML(data[0])} and ${import_battle_log.BattleLog.escapeHTML(data[1])} started.</a></div>`);
          break;
        }
        case "battleend": {
          let result = "drawn";
          if (data[2] === "win")
            result = "won";
          else if (data[2] === "loss")
            result = "lost";
          const message = `${import_battle_log.BattleLog.escapeHTML(data[0])} has ${result} the match ${import_battle_log.BattleLog.escapeHTML(data[3].split(",").join(" - "))} against ${import_battle_log.BattleLog.escapeHTML(data[1])}${data[4] === "fail" ? " but the tournament does not support drawing, so it did not count" : ""}.`;
          const roomid = (0, import_battle_dex.toRoomid)(data[5]);
          this.tryAdd(`|uhtml|tournament-${roomid}|<div class="tournament-message-battleend"><a href="${roomid}" class="ilink">${message}</a></div>`);
          break;
        }
        case "end":
          let endData = JSON.parse(data.join("|"));
          this.info.format = endData.format;
          this.info.generator = endData.generator;
          if (endData.bracketData) this.info.bracketData = endData.bracketData;
          if (this.room.log) {
            const bracketNode = document.createElement("div");
            bracketNode.style.position = "relative";
            this.room.log.addNode(bracketNode);
            import_preact.default.render(/* @__PURE__ */ Chat.h(TournamentBracket, { tour: this, abbreviated: true }), bracketNode);
          }
          this.room.add(import_battle_log.BattleLog.html`|html|<div class="tournament-message-end-winner">Congratulations to ${ChatTournament.arrayToPhrase(endData.results[0])} for winning the ${this.tournamentName()}!</div>`);
          if (endData.results[1]) {
            this.tryAdd(import_battle_log.BattleLog.html`|html|<div class="tournament-message-end-runnerup">Runner${endData.results[1].length > 1 ? "s" : ""}-up: ${ChatTournament.arrayToPhrase(endData.results[1])}</div>`);
          }
        // Fallthrough
        case "forceend":
          this.room.dismissNotification("tournament-create");
          this.updates = {};
          this.info.isActive = false;
          this.boxVisible = false;
          if (cmd === "forceend") {
            this.info = {};
            this.room.add(`|html|<div class="tournament-message-forceend">The tournament was forcibly ended.</div>`);
          }
          this.room.tour = null;
          this.update();
          break;
        case "error": {
          let appendError = (message) => {
            this.tryAdd(`|html|<div class="tournament-message-forceend">${import_battle_log.BattleLog.sanitizeHTML(message)}</div>`);
          };
          switch (data[0]) {
            case "BracketFrozen":
            case "AlreadyStarted":
              appendError("The tournament has already started.");
              break;
            case "BracketNotFrozen":
            case "NotStarted":
              appendError("The tournament hasn't started yet.");
              break;
            case "UserAlreadyAdded":
              appendError("You are already in the tournament.");
              break;
            case "AltUserAlreadyAdded":
              appendError("One of your alts is already in the tournament.");
              break;
            case "UserNotAdded":
              appendError(`${data[1] && data[1] === import_client_main.PS.user.userid ? "You aren't" : "This user isn't"} in the tournament.`);
              break;
            case "NotEnoughUsers":
              appendError("There aren't enough users.");
              break;
            case "InvalidAutoDisqualifyTimeout":
            case "InvalidAutoStartTimeout":
              appendError("That isn't a valid timeout value.");
              break;
            case "InvalidMatch":
              appendError("That isn't a valid tournament matchup.");
              break;
            case "UserNotNamed":
              appendError("You must have a name in order to join the tournament.");
              break;
            case "Full":
              appendError("The tournament is already at maximum capacity for users.");
              break;
            case "AlreadyDisqualified":
              appendError(`${data[1] && data[1] === import_client_main.PS.user.userid ? "You have" : "This user has"} already been disqualified.`);
              break;
            case "Banned":
              appendError("You are banned from entering tournaments.");
              break;
            default:
              appendError("Unknown error: " + data[0]);
              break;
          }
          break;
        }
        default:
          return true;
      }
    }
  }
}
class TournamentBox extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.acceptChallenge = (ev, format, team) => {
      const tour = this.props.tour;
      const room = tour.room;
      const packedTeam = team ? team.packedTeam : "";
      import_client_main.PS.send(`/utm ${packedTeam}`);
      if (tour.info.challenged) {
        room.send(`/tournament acceptchallenge`);
      } else if (tour.info.challenges?.length) {
        const target = tour.info.challenges[tour.selectedChallenge] || tour.info.challenges[0];
        room.send(`/tournament challenge ${target}`);
      }
      room.update(null);
    };
    this.validate = (ev, format, team) => {
      const room = this.props.tour.room;
      const packedTeam = team ? team.packedTeam : "";
      import_client_main.PS.send(`/utm ${packedTeam}`);
      room.send(`/tournament vtm`);
      room.update(null);
    };
    this.toggleBoxVisibility = () => {
      this.props.tour.boxVisible = !this.props.tour.boxVisible;
      this.forceUpdate();
    };
  }
  componentDidMount() {
    this.subscription = this.props.tour.subscribe(() => {
      this.forceUpdate();
    });
  }
  componentWillUnmount() {
    this.subscription.unsubscribe();
  }
  selectChallengeUser(ev) {
    const target = ev.target;
    if (target.tagName !== "SELECT") return;
    const selectedIndex = target.selectedIndex;
    if (selectedIndex < 0) return;
    this.props.tour.selectedChallenge = selectedIndex;
    this.forceUpdate();
  }
  renderTournamentTools() {
    const tour = this.props.tour;
    const info = tour.info;
    if (!info.isJoined) {
      if (info.isStarted) return null;
      return /* @__PURE__ */ Chat.h("div", { class: "tournament-tools" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { "data-cmd": "/tournament join", class: "button" }, /* @__PURE__ */ Chat.h("strong", null, "Join")), " ", /* @__PURE__ */ Chat.h("button", { onClick: this.toggleBoxVisibility, class: "button" }, "Close")));
    }
    const noMatches = !info.challenges?.length && !info.challengeBys?.length && !info.challenging && !info.challenged;
    return /* @__PURE__ */ Chat.h("div", { class: "tournament-tools" }, /* @__PURE__ */ Chat.h(
      import_panel_mainmenu.TeamForm,
      {
        format: info.format,
        teamFormat: info.teambuilderFormat,
        hideFormat: true,
        onSubmit: this.acceptChallenge,
        onValidate: this.validate
      },
      info.isJoined && !info.challenging && !info.challenged && !info.challenges?.length && /* @__PURE__ */ Chat.h("button", { name: "validate", class: "button" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-check", "aria-hidden": true }), " Validate"),
      " ",
      !!(!info.isStarted && info.isJoined) && /* @__PURE__ */ Chat.h("button", { "data-cmd": "/tournament leave", class: "button" }, "Leave"),
      info.isStarted && noMatches && /* @__PURE__ */ Chat.h("div", { class: "tournament-nomatches" }, "Waiting for battles to become available..."),
      !!info.challenges?.length && /* @__PURE__ */ Chat.h("div", { class: "tournament-challenge" }, /* @__PURE__ */ Chat.h("div", { class: "tournament-challenge-user" }, "vs. ", info.challenges[tour.selectedChallenge]), /* @__PURE__ */ Chat.h("button", { type: "submit", class: "button" }, /* @__PURE__ */ Chat.h("strong", null, "Ready!")), info.challenges.length > 1 && /* @__PURE__ */ Chat.h("span", { class: "tournament-challenge-user-menu" }, /* @__PURE__ */ Chat.h("select", { onChange: this.selectChallengeUser }, info.challenges.map((challenge, index) => /* @__PURE__ */ Chat.h("option", { value: index, selected: index === tour.selectedChallenge }, challenge))))),
      !!info.challengeBys?.length && /* @__PURE__ */ Chat.h("div", { class: "tournament-challengeby" }, info.challenges?.length ? "Or wait" : "Waiting", " for ", ChatTournament.arrayToPhrase(info.challengeBys, "or"), " ", "to challenge you."),
      !!info.challenging && /* @__PURE__ */ Chat.h("div", { class: "tournament-challenging" }, /* @__PURE__ */ Chat.h("div", { class: "tournament-challenging-message" }, "Waiting for ", info.challenging, "..."), /* @__PURE__ */ Chat.h("button", { "data-cmd": "/tournament cancelchallenge", class: "button" }, "Cancel")),
      !!info.challenged && /* @__PURE__ */ Chat.h("div", { class: "tournament-challenged" }, /* @__PURE__ */ Chat.h("div", { class: "tournament-challenged-message" }, "vs. ", info.challenged), /* @__PURE__ */ Chat.h("button", { type: "submit", class: "button" }, /* @__PURE__ */ Chat.h("strong", null, "Ready!")))
    ));
  }
  render() {
    const tour = this.props.tour;
    const info = tour.info;
    return /* @__PURE__ */ Chat.h("div", { class: `tournament-wrapper ${info.isActive ? "active" : ""}`, style: { left: this.props.left || 0 } }, /* @__PURE__ */ Chat.h("button", { class: "tournament-title", onClick: this.toggleBoxVisibility }, /* @__PURE__ */ Chat.h("span", { class: "tournament-status" }, info.isStarted ? "In Progress" : "Signups"), tour.tournamentName(), tour.boxVisible ? /* @__PURE__ */ Chat.h("i", { class: "fa fa-caret-up", "aria-hidden": true }) : /* @__PURE__ */ Chat.h("i", { class: "fa fa-caret-down", "aria-hidden": true })), /* @__PURE__ */ Chat.h("div", { class: `tournament-box ${tour.boxVisible ? "active" : ""}` }, /* @__PURE__ */ Chat.h(TournamentBracket, { tour }), this.renderTournamentTools()));
  }
}
class TournamentBracket extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.dragging = null;
    this.onMouseDown = (ev) => {
      const elem = this.base;
      const canScrollVertically = elem.scrollHeight > elem.clientHeight;
      const canScrollHorizontally = elem.scrollWidth > elem.clientWidth;
      if (!canScrollVertically && !canScrollHorizontally) return;
      if (ev.button) return;
      ev.preventDefault();
      window.addEventListener("mousemove", this.onMouseMove);
      window.addEventListener("mouseup", this.onMouseUp);
      this.dragging = {
        x: ev.clientX,
        y: ev.clientY
      };
      elem.style.cursor = "grabbing";
    };
    this.onMouseMove = (ev) => {
      if (!this.dragging) return;
      const dx = ev.clientX - this.dragging.x;
      const dy = ev.clientY - this.dragging.y;
      this.dragging.x = ev.clientX;
      this.dragging.y = ev.clientY;
      const elem = this.base;
      elem.scrollLeft -= dx;
      elem.scrollTop -= dy;
    };
    this.onMouseUp = (ev) => {
      if (!this.dragging) return;
      this.dragging = null;
      const elem = this.base;
      elem.style.cursor = "grab";
      window.removeEventListener("mousemove", this.onMouseMove);
      window.removeEventListener("mouseup", this.onMouseUp);
    };
    this.popOut = (ev) => {
      import_client_main.PS.join("tourpopout", {
        parentElem: ev.currentTarget,
        args: { tour: this.props.tour }
      });
      ev.stopImmediatePropagation();
      ev.preventDefault();
    };
  }
  renderTableBracket(data) {
    if (data.tableContents.length === 0)
      return null;
    if (data.tableHeaders.rows.length > 4 && this.props.abbreviated) {
      let rows = data.tableHeaders.rows.map((row, i) => ({
        name: row,
        score: data.scores[i]
      }));
      rows.sort((a, b) => b.score - a.score);
      rows = rows.slice(0, 4);
      return /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("table", { class: "tournament-bracket-table", style: "border-bottom-width:0" }, rows.map((row, i) => /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("th", null, row.name), /* @__PURE__ */ Chat.h("td", null, row.score), /* @__PURE__ */ Chat.h("td", { class: "tournament-bracket-table-cell-null" }, i < 3 ? /* @__PURE__ */ Chat.h("i", { class: "fa fa-trophy", "aria-hidden": true, style: { color: ["#d6c939", "#adb2bb", "#ca8530"][i] } }) : null))), /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("th", { colSpan: 2 }, "..."), /* @__PURE__ */ Chat.h("td", { class: "tournament-bracket-table-cell-null" }))));
    }
    return /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("table", { class: "tournament-bracket-table" }, /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { class: "empty" }), data.tableHeaders.cols.map((name) => /* @__PURE__ */ Chat.h("th", null, name))), data.tableHeaders.rows.map((name, r) => /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("th", null, name), data.tableContents[r].map((cell) => cell ? /* @__PURE__ */ Chat.h(
      "td",
      {
        class: `tournament-bracket-table-cell-${cell.state}${cell.state === "finished" ? `tournament-bracket-table-cell-result-${cell.result}` : ""}`
      },
      cell.state === "unavailable" ? "Unavailable" : cell.state === "available" ? "Waiting" : cell.state === "challenging" ? "Challenging" : cell.state === "inprogress" ? /* @__PURE__ */ Chat.h("a", { href: (0, import_battle_dex.toRoomid)(cell.room), class: "ilink" }, "In-progress") : cell.state === "finished" ? cell.score.join(" - ") : null
    ) : /* @__PURE__ */ Chat.h("td", { class: "tournament-bracket-table-cell-null" })), /* @__PURE__ */ Chat.h("th", { class: "tournament-bracket-row-score" }, data.scores[r])))));
  }
  componentWillUnmount() {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
  }
  componentDidUpdate() {
    const elem = this.base;
    const canScrollVertically = elem.scrollHeight > elem.clientHeight;
    const canScrollHorizontally = elem.scrollWidth > elem.clientWidth;
    if (!canScrollVertically && !canScrollHorizontally) {
      elem.style.cursor = "default";
    } else {
      elem.style.cursor = "grab";
    }
  }
  componentDidMount() {
    this.componentDidUpdate();
  }
  render() {
    const data = this.props.tour.info.bracketData;
    return /* @__PURE__ */ Chat.h(
      "div",
      {
        class: `tournament-bracket${this.props.poppedOut ? " tournament-popout-bracket" : ""}`,
        onMouseDown: this.onMouseDown,
        onMouseUp: this.onMouseUp,
        onMouseMove: this.onMouseMove
      },
      data?.type === "table" ? this.renderTableBracket(data) : data?.type === "tree" ? /* @__PURE__ */ Chat.h(TournamentTreeBracket, { data, abbreviated: this.props.abbreviated }) : null,
      this.props.poppedOut ? /* @__PURE__ */ Chat.h("button", { class: "tournament-close-link button", "data-cmd": "/close" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-times", "aria-hidden": true }), " Close") : /* @__PURE__ */ Chat.h("button", { class: "tournament-popout-link button", onClick: this.popOut }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-arrows-alt", "aria-hidden": true }), " Pop-out")
    );
  }
}
class TournamentTreeBracket extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.d3Loader = null;
  }
  forEachTreeNode(node, callback, depth = 0) {
    callback(node, depth);
    if (node.children) {
      for (const child of node.children) {
        this.forEachTreeNode(child, callback, depth + 1);
      }
    }
  }
  cloneTree(node) {
    const clonedNode = { ...node };
    if (node.children) {
      clonedNode.children = node.children.map((child) => this.cloneTree(child));
    }
    return clonedNode;
  }
  static {
    /**
     * Customize tree size. Height is for a single player, a full node is double that.
     */
    this.nodeSize = {
      width: 160,
      height: 15,
      radius: 5,
      separationX: 20,
      separationY: 10,
      // Safari bug: some issue with dominant-baseline. whatever, we can just manually v-align text
      textOffset: 4
    };
  }
  generateTreeBracket(data, abbreviated) {
    const div = document.createElement("div");
    div.className = "tournament-bracket-tree";
    if (!data.rootNode) {
      const users = data.users;
      if (users?.length) {
        div.innerHTML = `<b>${users.length}</b> user${users.length !== 1 ? "s" : ""}:<br />${import_battle_log.BattleLog.escapeHTML(users.join(", "))}`;
      } else {
        div.innerHTML = `<b>0</b> users`;
      }
      return div;
    }
    if (!window.d3) {
      div.innerHTML = `<b>d3 not loaded yet</b>`;
      this.d3Loader ||= import_client_main.PS.libsLoaded.then(() => {
        this.forceUpdate();
      });
      return div;
    }
    this.d3Loader = null;
    let name = import_client_main.PS.user.name;
    const newTree = this.cloneTree(data.rootNode);
    if (newTree.team) newTree.highlightLink = true;
    const highlightName = newTree.team;
    this.forEachTreeNode(newTree, (node, depth) => {
      if (node.children?.length === 2) {
        node.team1 = node.children[0].team;
        node.team2 = node.children[1].team;
        const shouldHaveChildren = node.children.some((child) => child.children?.length === 2);
        if (!shouldHaveChildren) node.children = [];
        if (depth >= 2 && node.children?.length && abbreviated) {
          node.children = [];
          node.abbreviated = true;
        }
        if (node.highlightLink) {
          for (const child of node.children) {
            if (child.team === node.team) {
              child.highlightLink = true;
            }
          }
        } else if (node.state === "inprogress" || node.state === "available" || node.state === "challenging" || node.state === "unavailable") {
          for (const child of node.children) {
            if (child.team && !child.team.startsWith("(")) {
              child.highlightLink = true;
            }
          }
        } else if (highlightName) {
          for (const child of node.children) {
            if (child.team === highlightName) {
              child.highlightLink = true;
            }
          }
        }
      }
    });
    let numLeaves = 0;
    const hasLeafAtDepth = [];
    this.forEachTreeNode(newTree, (node, depth) => {
      hasLeafAtDepth[depth] ||= false;
      if (!node.children?.length) {
        numLeaves++;
        hasLeafAtDepth[depth] = true;
      }
    });
    const depthsWithLeaves = hasLeafAtDepth.filter(Boolean).length;
    const breadthCompression = depthsWithLeaves > 2 ? 0.8 : 2;
    const maxBreadth = numLeaves - (depthsWithLeaves - 1) / breadthCompression;
    const maxDepth = hasLeafAtDepth.length;
    const nodeSize = TournamentTreeBracket.nodeSize;
    const size = {
      width: nodeSize.width * maxDepth + nodeSize.separationX * (maxDepth + 1),
      height: nodeSize.height * 2 * (maxBreadth + 0.5) + nodeSize.separationY * maxBreadth
    };
    const tree = d3.layout.tree().size([size.height, size.width - nodeSize.width - nodeSize.separationX]).separation(() => 1).children((node) => node.children?.length ? node.children : null);
    const nodes = tree.nodes(newTree);
    const links = tree.links(nodes);
    const layoutRoot = d3.select(div).append("svg:svg").attr("width", size.width).attr("height", size.height).append("svg:g").attr("transform", `translate(${-nodeSize.width / 2 - 6},0)`);
    const diagonalLink = d3.svg.diagonal().source((link) => ({
      x: link.source.x,
      y: link.source.y + nodeSize.width / 2
    })).target((link) => ({
      x: link.target.x,
      y: link.target.y - nodeSize.width / 2
    })).projection((link) => [
      size.width - link.y,
      link.x
    ]);
    layoutRoot.selectAll("path.tournament-bracket-tree-link").data(links).enter().append("svg:path").attr("d", diagonalLink).classed("tournament-bracket-tree-link", true).classed("tournament-bracket-tree-link-active", (link) => !!link.target.highlightLink);
    const nodeGroup = layoutRoot.selectAll("g.tournament-bracket-tree-node").data(nodes).enter().append("svg:g").classed("tournament-bracket-tree-node", true).attr("transform", (node) => `translate(${size.width - node.y},${node.x})`);
    nodeGroup.each(function(node) {
      let elem = d3.select(this);
      const outerElem = elem;
      if (node.abbreviated) {
        elem.append("svg:text").attr("y", -nodeSize.height / 2 + 4).attr("x", -nodeSize.width / 2 - 7).classed("tournament-bracket-tree-abbreviated", true).text("...");
      }
      if (node.state === "inprogress") {
        elem = elem.append("svg:a").attr("xlink:href", (0, import_battle_dex.toRoomid)(node.room)).classed("ilink", true).on("click", () => {
          const ev = d3.event;
          if (ev.metaKey || ev.ctrlKey) return;
          ev.preventDefault();
          ev.stopPropagation();
          const roomid = ev.currentTarget.getAttribute("href");
          import_client_main.PS.join(roomid);
        });
      }
      outerElem.classed("tournament-bracket-tree-node-match", true);
      outerElem.classed("tournament-bracket-tree-node-match-" + node.state, true);
      if (node.team && !node.team1 && !node.team2) {
        const rect = elem.append("svg:rect").classed("tournament-bracket-tree-draw", true).attr("rx", nodeSize.radius).attr("x", -nodeSize.width / 2).attr("width", nodeSize.width).attr("y", -nodeSize.height / 2).attr("height", nodeSize.height);
        if (node.team === name) rect.attr("stroke-dasharray", "5,5").attr("stroke-width", 2);
        elem.append("svg:text").classed("tournament-bracket-tree-node-team", true).attr("y", nodeSize.textOffset).classed("tournament-bracket-tree-node-team-draw", true).text(node.team || "");
      } else {
        const rect1 = elem.append("svg:rect").attr("rx", nodeSize.radius).attr("x", -nodeSize.width / 2).attr("width", nodeSize.width).attr("y", -nodeSize.height).attr("height", nodeSize.height);
        const rect2 = elem.append("svg:rect").attr("rx", nodeSize.radius).attr("x", -nodeSize.width / 2).attr("width", nodeSize.width).attr("y", 0).attr("height", nodeSize.height);
        if (node.team1 === name) rect1.attr("stroke-dasharray", "5,5").attr("stroke-width", 2);
        if (node.team2 === name) rect2.attr("stroke-dasharray", "5,5").attr("stroke-width", 2);
        const row1 = elem.append("svg:text").attr("y", -nodeSize.height / 2 + nodeSize.textOffset).classed("tournament-bracket-tree-node-row1", true);
        const row2 = elem.append("svg:text").attr("y", nodeSize.height / 2 + nodeSize.textOffset).classed("tournament-bracket-tree-node-row2", true);
        const team1 = row1.append("svg:tspan").classed("tournament-bracket-tree-team", true).text(node.team1 || "");
        const team2 = row2.append("svg:tspan").classed("tournament-bracket-tree-team", true).text(node.team2 || "");
        if (node.state === "available") {
          elem.append("title").text("Waiting");
        } else if (node.state === "challenging") {
          elem.append("title").text("Challenging");
        } else if (node.state === "inprogress") {
          elem.append("title").text("In-progress");
        } else if (node.state === "finished") {
          if (node.result === "win") {
            rect1.classed("tournament-bracket-tree-win", true);
            rect2.classed("tournament-bracket-tree-loss", true);
            team1.classed("tournament-bracket-tree-team-win", true);
            team2.classed("tournament-bracket-tree-team-loss", true);
          } else if (node.result === "loss") {
            rect1.classed("tournament-bracket-tree-loss", true);
            rect2.classed("tournament-bracket-tree-win", true);
            team1.classed("tournament-bracket-tree-team-loss", true);
            team2.classed("tournament-bracket-tree-team-win", true);
          } else {
            rect1.classed("tournament-bracket-tree-draw", true);
            rect2.classed("tournament-bracket-tree-draw", true);
            team1.classed("tournament-bracket-tree-team-draw", true);
            team2.classed("tournament-bracket-tree-team-draw", true);
          }
          elem.classed("tournament-bracket-tree-node-match-result-" + node.result, true);
          row1.append("svg:tspan").text(` (${node.score[0]})`).classed("tournament-bracket-tree-score", true);
          row2.append("svg:tspan").text(` (${node.score[1]})`).classed("tournament-bracket-tree-score", true);
        }
      }
    });
    return div;
  }
  componentDidMount() {
    this.base.appendChild(this.generateTreeBracket(this.props.data, this.props.abbreviated));
  }
  shouldComponentUpdate(props) {
    if (props.data === this.props.data && !this.d3Loader) return false;
    this.base.replaceChild(this.generateTreeBracket(props.data), this.base.children[0]);
    return false;
  }
  render() {
    return /* @__PURE__ */ Chat.h("div", { class: "pad" });
  }
}
class TourPopOutPanel extends import_panels.PSRoomPanel {
  static {
    this.id = "tourpopout";
  }
  static {
    this.routes = ["tourpopout"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  componentDidMount() {
    const tour = this.props.room.args?.tour;
    if (tour) this.subscribeTo(tour);
  }
  render() {
    const room = this.props.room;
    const tour = room.args?.tour;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, fullSize: true }, tour && /* @__PURE__ */ Chat.h(TournamentBracket, { tour, poppedOut: true }));
  }
}
import_client_main.PS.addRoomType(TourPopOutPanel);
//# sourceMappingURL=panel-chat-tournament.js.map
