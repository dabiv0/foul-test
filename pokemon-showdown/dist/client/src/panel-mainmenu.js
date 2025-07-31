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
var panel_mainmenu_exports = {};
__export(panel_mainmenu_exports, {
  FormatDropdown: () => FormatDropdown,
  MainMenuRoom: () => MainMenuRoom,
  TeamForm: () => TeamForm
});
module.exports = __toCommonJS(panel_mainmenu_exports);
var import_preact = __toESM(require("../js/lib/preact"));
var import_client_connection = require("./client-connection");
var import_client_main = require("./client-main");
var import_panels = require("./panels");
var import_panel_teamdropdown = require("./panel-teamdropdown");
var import_battle_dex = require("./battle-dex");
var import_battle_log = require("./battle-log");
/**
 * Main menu panel
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
class MainMenuRoom extends import_client_main.PSRoom {
  constructor(options) {
    super(options);
    this.classType = "mainmenu";
    this.userdetailsCache = {};
    this.roomsCache = {};
    this.searchCountdown = null;
    /** used to track the moment between "search sent" and "server acknowledged search sent" */
    this.searchSent = false;
    this.search = { searching: [], games: null };
    this.disallowSpectators = import_client_main.PS.prefs.disallowspectators;
    this.startSearch = (format, team) => {
      import_client_main.PS.requestNotifications();
      if (this.searchCountdown) {
        import_client_main.PS.alert("Wait for this countdown to finish first...");
        return;
      }
      this.searchCountdown = {
        format,
        packedTeam: team?.packedTeam || "",
        countdown: 3,
        timer: setInterval(this.doSearchCountdown, 1e3)
      };
      this.update(null);
    };
    this.cancelSearch = () => {
      if (this.searchCountdown) {
        clearTimeout(this.searchCountdown.timer);
        this.searchCountdown = null;
        this.update(null);
        return true;
      }
      if (this.searchSent || this.search.searching?.length) {
        this.searchSent = false;
        import_client_main.PS.send(`/cancelsearch`);
        this.update(null);
        return true;
      }
      return false;
    };
    this.doSearchCountdown = () => {
      if (!this.searchCountdown) return;
      this.searchCountdown.countdown--;
      if (this.searchCountdown.countdown <= 0) {
        this.doSearch(this.searchCountdown);
        clearTimeout(this.searchCountdown.timer);
        this.searchCountdown = null;
      }
      this.update(null);
    };
    this.doSearch = (search) => {
      this.searchSent = true;
      const privacy = this.adjustPrivacy();
      import_client_main.PS.send(`/utm ${search.packedTeam}`);
      import_client_main.PS.send(`${privacy}/search ${search.format}`);
    };
    if (this.backlog) {
      import_client_main.PS.rooms[""] = this;
      import_client_main.PS.mainmenu = this;
      for (const args of this.backlog) {
        this.receiveLine(args);
      }
      this.backlog = null;
    }
  }
  adjustPrivacy() {
    import_client_main.PS.prefs.set("disallowspectators", this.disallowSpectators);
    if (this.disallowSpectators) return "/noreply /hidenext \n";
    return "";
  }
  receiveLine(args) {
    const [cmd] = args;
    switch (cmd) {
      case "challstr": {
        const [, challstr] = args;
        import_client_main.PS.user.challstr = challstr;
        import_client_connection.PSLoginServer.query(
          "upkeep",
          { challstr }
        ).then((res) => {
          if (!res?.username) {
            import_client_main.PS.user.initializing = false;
            return;
          }
          res.username = res.username.replace(/[|,;]+/g, "");
          if (res.loggedin) {
            import_client_main.PS.user.registered = { name: res.username, userid: (0, import_battle_dex.toID)(res.username) };
          }
          import_client_main.PS.user.handleAssertion(res.username, res.assertion);
        });
        return;
      }
      case "updateuser": {
        const [, fullName, namedCode, avatar] = args;
        const named = namedCode === "1";
        if (named) import_client_main.PS.user.initializing = false;
        import_client_main.PS.user.setName(fullName, named, avatar);
        import_client_main.PS.teams.loadRemoteTeams();
        return;
      }
      case "updatechallenges": {
        const [, challengesBuf] = args;
        this.receiveChallenges(challengesBuf);
        return;
      }
      case "updatesearch": {
        const [, searchBuf] = args;
        this.receiveSearch(searchBuf);
        return;
      }
      case "queryresponse": {
        const [, queryId, responseJSON] = args;
        this.handleQueryResponse(queryId, JSON.parse(responseJSON));
        return;
      }
      case "pm": {
        const [, user1, user2, message] = args;
        this.handlePM(user1, user2, message);
        let sideRoom = import_client_main.PS.rightPanel;
        if (sideRoom?.type === "chat" && import_client_main.PS.prefs.inchatpm) sideRoom?.log?.add(args);
        return;
      }
      case "formats": {
        this.parseFormats(args);
        return;
      }
      case "popup": {
        const [, message] = args;
        import_client_main.PS.alert(message.replace(/\|\|/g, "\n"));
        return;
      }
    }
    const lobby = import_client_main.PS.rooms["lobby"];
    if (lobby) lobby.receiveLine(args);
  }
  receiveChallenges(dataBuf) {
    let json;
    try {
      json = JSON.parse(dataBuf);
    } catch {
    }
    for (const userid in json.challengesFrom) {
      import_client_main.PS.getPMRoom((0, import_battle_dex.toID)(userid));
    }
    if (json.challengeTo) {
      import_client_main.PS.getPMRoom((0, import_battle_dex.toID)(json.challengeTo.to));
    }
    for (const roomid in import_client_main.PS.rooms) {
      const room = import_client_main.PS.rooms[roomid];
      if (!room.pmTarget) continue;
      const targetUserid = (0, import_battle_dex.toID)(room.pmTarget);
      if (!room.challenged && !(targetUserid in json.challengesFrom) && !room.challenging && json.challengeTo?.to !== targetUserid) {
        continue;
      }
      room.challenged = room.parseChallenge(json.challengesFrom[targetUserid]);
      room.challenging = json.challengeTo?.to === targetUserid ? room.parseChallenge(json.challengeTo.format) : null;
      room.update(null);
    }
  }
  receiveSearch(dataBuf) {
    let json;
    this.searchSent = false;
    try {
      json = JSON.parse(dataBuf);
    } catch {
    }
    this.search = json;
    this.update(null);
  }
  parseFormats(formatsList) {
    let isSection = false;
    let section = "";
    let column = 0;
    window.NonBattleGames = { rps: "Rock Paper Scissors" };
    for (let i = 3; i <= 9; i += 2) {
      window.NonBattleGames[`bestof${i}`] = `Best-of-${i}`;
    }
    window.BattleFormats = {};
    for (let j = 1; j < formatsList.length; j++) {
      const entry = formatsList[j];
      if (isSection) {
        section = entry;
        isSection = false;
      } else if (entry === ",LL") {
        import_client_main.PS.teams.usesLocalLadder = true;
      } else if (entry === "" || entry.startsWith(",") && !isNaN(Number(entry.slice(1)))) {
        isSection = true;
        if (entry) {
          column = parseInt(entry.slice(1), 10) || 0;
        }
      } else {
        let name = entry;
        let searchShow = true;
        let challengeShow = true;
        let tournamentShow = true;
        let team = null;
        let teambuilderLevel = null;
        let lastCommaIndex = name.lastIndexOf(",");
        let code = lastCommaIndex >= 0 ? parseInt(name.substr(lastCommaIndex + 1), 16) : NaN;
        if (!isNaN(code)) {
          name = name.substr(0, lastCommaIndex);
          if (code & 1) team = "preset";
          if (!(code & 2)) searchShow = false;
          if (!(code & 4)) challengeShow = false;
          if (!(code & 8)) tournamentShow = false;
          if (code & 16) teambuilderLevel = 50;
        } else {
          if (name.substr(name.length - 2) === ",#") {
            team = "preset";
            name = name.substr(0, name.length - 2);
          }
          if (name.substr(name.length - 2) === ",,") {
            challengeShow = false;
            name = name.substr(0, name.length - 2);
          } else if (name.substr(name.length - 1) === ",") {
            searchShow = false;
            name = name.substr(0, name.length - 1);
          }
        }
        let id = (0, import_battle_dex.toID)(name);
        let isTeambuilderFormat = !team && !name.endsWith("Custom Game");
        let teambuilderFormat = "";
        let teambuilderFormatName = "";
        if (isTeambuilderFormat) {
          teambuilderFormatName = name;
          if (!id.startsWith("gen")) {
            teambuilderFormatName = "[Gen 6] " + name;
          }
          let parenPos = teambuilderFormatName.indexOf("(");
          if (parenPos > 0 && name.endsWith(")")) {
            teambuilderFormatName = teambuilderFormatName.slice(0, parenPos).trim();
          }
          if (teambuilderFormatName !== name) {
            teambuilderFormat = (0, import_battle_dex.toID)(teambuilderFormatName);
            if (BattleFormats[teambuilderFormat]) {
              BattleFormats[teambuilderFormat].isTeambuilderFormat = true;
            } else {
              BattleFormats[teambuilderFormat] = {
                id: teambuilderFormat,
                name: teambuilderFormatName,
                team,
                section,
                column,
                rated: false,
                isTeambuilderFormat: true,
                effectType: "Format"
              };
            }
            isTeambuilderFormat = false;
          }
        }
        if (BattleFormats[id]?.isTeambuilderFormat) {
          isTeambuilderFormat = true;
        }
        if (BattleFormats[id]) delete BattleFormats[id];
        BattleFormats[id] = {
          id,
          name,
          team,
          section,
          column,
          searchShow,
          challengeShow,
          tournamentShow,
          rated: searchShow && id.substr(4, 7) !== "unrated",
          teambuilderLevel,
          teambuilderFormat,
          isTeambuilderFormat,
          effectType: "Format"
        };
      }
    }
    let multivariantFormats = {};
    for (let id in BattleFormats) {
      let teambuilderFormat = BattleFormats[BattleFormats[id].teambuilderFormat];
      if (!teambuilderFormat || multivariantFormats[teambuilderFormat.id]) continue;
      if (!teambuilderFormat.searchShow && !teambuilderFormat.challengeShow && !teambuilderFormat.tournamentShow) {
        if (teambuilderFormat.battleFormat) {
          multivariantFormats[teambuilderFormat.id] = 1;
          teambuilderFormat.battleFormat = "";
        } else {
          teambuilderFormat.battleFormat = id;
        }
      }
    }
    import_client_main.PS.teams.update("format");
  }
  handlePM(user1, user2, message) {
    const userid1 = (0, import_battle_dex.toID)(user1);
    const userid2 = (0, import_battle_dex.toID)(user2);
    const pmTarget = import_client_main.PS.user.userid === userid1 ? user2 : user1;
    const pmTargetid = import_client_main.PS.user.userid === userid1 ? userid2 : userid1;
    let roomid = `dm-${pmTargetid}`;
    if (pmTargetid === import_client_main.PS.user.userid) roomid = "dm-";
    let room = import_client_main.PS.rooms[roomid];
    if (!room) {
      import_client_main.PS.addRoom({
        id: roomid,
        args: { pmTarget }
      }, true);
      room = import_client_main.PS.rooms[roomid];
    } else {
      room.updateTarget(pmTarget);
    }
    if (message) room.receiveLine([`c`, user1, message]);
    import_client_main.PS.update();
  }
  handleQueryResponse(id, response) {
    switch (id) {
      case "userdetails":
        let userid = response.userid;
        let userdetails = this.userdetailsCache[userid];
        if (!userdetails) {
          this.userdetailsCache[userid] = response;
        } else {
          Object.assign(userdetails, response);
        }
        import_client_main.PS.rooms[`user-${userid}`]?.update(null);
        import_client_main.PS.rooms[`viewuser-${userid}`]?.update(null);
        import_client_main.PS.rooms[`users`]?.update(null);
        break;
      case "rooms":
        if (response.pspl) {
          for (const roomInfo of response.pspl) roomInfo.spotlight = "Spotlight";
          response.chat = [...response.pspl, ...response.chat];
          response.pspl = null;
        }
        if (response.official) {
          for (const roomInfo of response.official) roomInfo.section = "Official";
          response.chat = [...response.official, ...response.chat];
          response.official = null;
        }
        this.roomsCache = response;
        const roomsRoom = import_client_main.PS.rooms[`rooms`];
        if (roomsRoom) roomsRoom.update(null);
        break;
      case "roomlist":
        const battlesRoom = import_client_main.PS.rooms[`battles`];
        if (battlesRoom) {
          const battleTable = response.rooms;
          const battles = [];
          for (const battleid in battleTable) {
            battleTable[battleid].id = battleid;
            battles.push(battleTable[battleid]);
          }
          battlesRoom.battles = battles;
          battlesRoom.update(null);
        }
        break;
      case "laddertop":
        for (const [roomid, ladderRoom] of Object.entries(import_client_main.PS.rooms)) {
          if (roomid.startsWith("ladder-")) {
            ladderRoom.update(response);
          }
        }
        break;
      case "teamupload":
        if (import_client_main.PS.teams.uploading) {
          const team = import_client_main.PS.teams.uploading;
          team.uploaded = {
            teamid: response.teamid,
            notLoaded: false,
            private: response.private
          };
          import_client_main.PS.rooms[`team-${team.key}`]?.update(null);
          import_client_main.PS.rooms.teambuilder?.update(null);
          import_client_main.PS.teams.uploading = null;
        }
        break;
      case "teamupdate":
        for (const team of import_client_main.PS.teams.list) {
          if (team.teamid === response.teamid) {
            team.uploaded = {
              teamid: response.teamid,
              notLoaded: false,
              private: response.private
            };
            import_client_main.PS.rooms[`team-${team.key}`]?.update(null);
            import_client_main.PS.rooms.teambuilder?.update(null);
            import_client_main.PS.teams.uploading = null;
            break;
          }
        }
        break;
    }
  }
}
class NewsPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.change = (ev) => {
      const target = ev.currentTarget;
      if (target.value === "1") {
        document.cookie = "preactalpha=1; expires=Thu, 1 Jun 2025 12:00:00 UTC; path=/";
      } else {
        document.cookie = "preactalpha=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
      if (target.value === "leave") {
        document.location.href = `/`;
      }
    };
  }
  static {
    this.id = "news";
  }
  static {
    this.routes = ["news"];
  }
  static {
    this.title = "News";
  }
  static {
    this.location = "mini-window";
  }
  render() {
    const cookieSet = document.cookie.includes("preactalpha=1");
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room: this.props.room, fullSize: true, scrollable: true }, /* @__PURE__ */ Chat.h("div", { class: "construction" }, "This is the client rewrite beta test.", /* @__PURE__ */ Chat.h("form", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h("input", { type: "radio", name: "preactalpha", value: "1", onChange: this.change, checked: cookieSet }), " ", "Use Rewrite always"), /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h("input", { type: "radio", name: "preactalpha", value: "0", onChange: this.change, checked: !cookieSet }), " ", "Use Rewrite with URL"), /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h("input", { type: "radio", name: "preactalpha", value: "leave", onChange: this.change }), " ", "Back to the old client")), "Provide feedback in ", /* @__PURE__ */ Chat.h("a", { href: "development", style: "color:black" }, "the Dev chatroom"), "."), /* @__PURE__ */ Chat.h("div", { class: "readable-bg", dangerouslySetInnerHTML: { __html: import_client_main.PS.newsHTML } }));
  }
}
class MainMenuPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.submitSearch = (ev, format, team) => {
      if (!import_client_main.PS.user.named) {
        import_client_main.PS.join("login", {
          parentElem: this.base.querySelector(".big.button")
        });
        return;
      }
      import_client_main.PS.mainmenu.startSearch(format, team);
    };
    this.handleDragStart = (e) => {
      const room = import_client_main.PS.getRoom(e.currentTarget);
      if (!room) return;
      const foreground = import_client_main.PS.leftPanel.id === room.id || import_client_main.PS.rightPanel?.id === room.id;
      import_client_main.PS.dragging = { type: "room", roomid: room.id, foreground };
    };
    this.handleDragEnter = (e) => {
      e.preventDefault();
      if (import_client_main.PS.dragging?.type !== "room") return;
      const draggingRoom = import_client_main.PS.dragging.roomid;
      if (draggingRoom === null) return;
      const draggedOverRoom = import_client_main.PS.getRoom(e.target);
      if (draggingRoom === draggedOverRoom?.id) return;
      const index = import_client_main.PS.miniRoomList.indexOf(draggedOverRoom?.id);
      if (index >= 0) {
        import_client_main.PS.dragOnto(import_client_main.PS.rooms[draggingRoom], "mini-window", index);
      } else if (import_client_main.PS.rooms[draggingRoom]?.location !== "mini-window") {
        import_client_main.PS.dragOnto(import_client_main.PS.rooms[draggingRoom], "mini-window", 0);
      }
    };
    this.handleClickMinimize = (e) => {
      if (e.target?.getAttribute("data-cmd")) {
        return;
      }
      if (e.target?.parentNode?.getAttribute("data-cmd")) {
        return;
      }
      const room = import_client_main.PS.getRoom(e.currentTarget);
      if (room) {
        room.minimized = !room.minimized;
        this.forceUpdate();
      }
    };
  }
  static {
    this.id = "mainmenu";
  }
  static {
    this.routes = [""];
  }
  static {
    this.Model = MainMenuRoom;
  }
  static {
    this.icon = /* @__PURE__ */ Chat.h("i", { class: "fa fa-home", "aria-hidden": true });
  }
  focus() {
    this.base?.querySelector(".formatselect")?.focus();
  }
  renderMiniRoom(room) {
    const RoomType = import_client_main.PS.roomTypes[room.type];
    const Panel = RoomType || import_panels.PSRoomPanel;
    return /* @__PURE__ */ Chat.h(Panel, { key: room.id, room });
  }
  renderMiniRooms() {
    return import_client_main.PS.miniRoomList.map((roomid) => {
      const room = import_client_main.PS.rooms[roomid];
      const notifying = room.notifications.length ? " notifying" : room.isSubtleNotifying ? " subtle-notifying" : "";
      return /* @__PURE__ */ Chat.h(
        "div",
        {
          class: `mini-window${room.minimized ? " collapsed" : ""}${room === import_client_main.PS.room ? " focused" : ""}`,
          key: roomid,
          "data-roomid": roomid
        },
        /* @__PURE__ */ Chat.h(
          "h3",
          {
            class: `mini-window-header${notifying}`,
            draggable: true,
            onDragStart: this.handleDragStart,
            onClick: this.handleClickMinimize
          },
          /* @__PURE__ */ Chat.h("button", { class: "closebutton", "data-cmd": "/close", "aria-label": "Close", tabIndex: -1 }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-times-circle", "aria-hidden": true })),
          /* @__PURE__ */ Chat.h("button", { class: "maximizebutton", "data-cmd": "/maximize", tabIndex: -1, "aria-label": "Maximize" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-stop-circle", "aria-hidden": true })),
          /* @__PURE__ */ Chat.h("button", { class: "minimizebutton", tabIndex: -1, "aria-label": "Expand/Collapse" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-minus-circle", "aria-hidden": true })),
          room.title
        ),
        this.renderMiniRoom(room)
      );
    });
  }
  renderGames() {
    if (!import_client_main.PS.mainmenu.search.games) return null;
    return /* @__PURE__ */ Chat.h("div", { class: "menugroup" }, /* @__PURE__ */ Chat.h("p", { class: "label" }, "You are in:"), Object.entries(import_client_main.PS.mainmenu.search.games).map(([roomid, gameName]) => /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("a", { class: "blocklink", href: `${roomid}` }, gameName))));
  }
  renderSearchButton() {
    if (import_client_main.PS.down) {
      return /* @__PURE__ */ Chat.h("div", { class: "menugroup", style: "background: rgba(10,10,10,.6)" }, import_client_main.PS.down === "ddos" ? /* @__PURE__ */ Chat.h("p", { class: "error" }, /* @__PURE__ */ Chat.h("strong", null, "Pok\xE9mon Showdown is offline due to a DDoS attack!")) : /* @__PURE__ */ Chat.h("p", { class: "error" }, /* @__PURE__ */ Chat.h("strong", null, "Pok\xE9mon Showdown is offline due to technical difficulties!")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("div", { style: { textAlign: "center" } }, /* @__PURE__ */ Chat.h("img", { width: "96", height: "96", src: `//${import_client_main.Config.routes.client}/sprites/gen5/teddiursa.png`, alt: "" })), "Bear with us as we freak out."), /* @__PURE__ */ Chat.h("p", null, "(We'll be back up in a few hours.)"));
    }
    if (!import_client_main.PS.user.userid || import_client_main.PS.isOffline) {
      return /* @__PURE__ */ Chat.h(TeamForm, { class: "menugroup", onSubmit: this.submitSearch, selectType: "search" }, /* @__PURE__ */ Chat.h("button", { class: "mainmenu1 mainmenu big button disabled", disabled: true, name: "search" }, /* @__PURE__ */ Chat.h("em", null, import_client_main.PS.isOffline ? [/* @__PURE__ */ Chat.h("span", { class: "fa-stack fa-lg" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-plug fa-flip-horizontal fa-stack-1x", "aria-hidden": true }), /* @__PURE__ */ Chat.h("i", { class: "fa fa-ban fa-stack-2x text-danger", "aria-hidden": true })), " Disconnected"] : "Connecting...")), import_client_main.PS.isOffline && /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/reconnect" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-plug", "aria-hidden": true }), " ", /* @__PURE__ */ Chat.h("strong", null, "Reconnect")), " ", import_client_main.PS.connection?.reconnectTimer && /* @__PURE__ */ Chat.h("small", null, "(Autoreconnect in ", Math.round(import_client_main.PS.connection.reconnectDelay / 1e3), "s)")));
    }
    return /* @__PURE__ */ Chat.h(
      TeamForm,
      {
        class: "menugroup",
        format: import_client_main.PS.mainmenu.searchCountdown?.format,
        selectType: "search",
        onSubmit: this.submitSearch
      },
      /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button small", "data-href": "battleoptions", title: "Options", "aria-label": "Options" }, "Battle options ", /* @__PURE__ */ Chat.h("i", { class: "fa fa-caret-down" }))),
      import_client_main.PS.mainmenu.searchCountdown ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("button", { class: "mainmenu1 mainmenu big button disabled", type: "submit" }, /* @__PURE__ */ Chat.h("strong", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-refresh fa-spin", "aria-hidden": true }), " Searching in ", import_client_main.PS.mainmenu.searchCountdown.countdown, "...")), /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/cancelsearch" }, "Cancel"))) : import_client_main.PS.mainmenu.searchSent || import_client_main.PS.mainmenu.search.searching.length ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("button", { class: "mainmenu1 mainmenu big button disabled", type: "submit" }, /* @__PURE__ */ Chat.h("strong", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-refresh fa-spin", "aria-hidden": true }), " Searching...")), /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/cancelsearch" }, "Cancel"))) : /* @__PURE__ */ Chat.h("button", { class: "mainmenu1 mainmenu big button", type: "submit" }, /* @__PURE__ */ Chat.h("strong", null, "Battle!"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("small", null, "Find a random opponent"))
    );
  }
  render() {
    const onlineButton = " button" + (import_client_main.PS.isOffline ? " disabled" : "");
    const tinyLayout = this.props.room.width < 620 ? " tiny-layout" : "";
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room: this.props.room, scrollable: true, onDragEnter: this.handleDragEnter }, /* @__PURE__ */ Chat.h("div", { class: `mainmenu-mini-windows${tinyLayout}` }, this.renderMiniRooms()), /* @__PURE__ */ Chat.h("div", { class: `mainmenu${tinyLayout}` }, /* @__PURE__ */ Chat.h("div", { class: "mainmenu-left" }, this.renderGames(), this.renderSearchButton(), /* @__PURE__ */ Chat.h("div", { class: "menugroup" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("a", { class: "mainmenu2 mainmenu button", href: "teambuilder" }, "Teambuilder")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("a", { class: "mainmenu3 mainmenu" + onlineButton, href: "ladder" }, "Ladder")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("a", { class: "mainmenu4 mainmenu" + onlineButton, href: "view-tournaments-all" }, "Tournaments"))), /* @__PURE__ */ Chat.h("div", { class: "menugroup" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("a", { class: "mainmenu4 mainmenu" + onlineButton, href: "battles" }, "Watch a battle")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("a", { class: "mainmenu5 mainmenu" + onlineButton, href: "users" }, "Find a user")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("a", { class: "mainmenu6 mainmenu" + onlineButton, href: "view-friends-all" }, "Friends")))), /* @__PURE__ */ Chat.h("div", { class: "mainmenu-right", style: { display: import_client_main.PS.leftPanelWidth ? "none" : "block" } }, /* @__PURE__ */ Chat.h("div", { class: "menugroup" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("a", { class: "mainmenu1 mainmenu" + onlineButton, href: "rooms" }, "Chat rooms")), import_client_main.PS.server.id !== "showdown" && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("a", { class: "mainmenu2 mainmenu" + onlineButton, href: "lobby" }, "Lobby chat")))), /* @__PURE__ */ Chat.h("div", { class: "mainmenu-footer" }, /* @__PURE__ */ Chat.h("div", { class: "bgcredit" }), /* @__PURE__ */ Chat.h("small", null, /* @__PURE__ */ Chat.h("a", { href: `//${import_client_main.Config.routes.dex}/`, target: "_blank" }, "Pok\xE9dex"), " | ", /* @__PURE__ */ Chat.h("a", { href: `//${import_client_main.Config.routes.replays}/`, target: "_blank" }, "Replays"), " | ", /* @__PURE__ */ Chat.h("a", { href: `//${import_client_main.Config.routes.root}/rules`, target: "_blank" }, "Rules"), " | ", /* @__PURE__ */ Chat.h("a", { href: `//${import_client_main.Config.routes.root}/credits`, target: "_blank" }, "Credits"), " | ", /* @__PURE__ */ Chat.h("a", { href: "//smogon.com/forums/", target: "_blank" }, "Forum")))));
  }
}
class FormatDropdown extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.format = "";
    this.change = (e) => {
      if (!this.base) return;
      this.format = this.base.value;
      this.forceUpdate();
      if (this.props.onChange) this.props.onChange(e);
    };
  }
  componentWillMount() {
    if (this.props.format !== void 0) {
      this.format = this.props.format;
    }
  }
  render() {
    this.format ||= this.props.format || this.props.defaultFormat || "";
    let [formatName, customRules] = this.format.split("@@@");
    if (window.BattleLog) formatName = import_battle_log.BattleLog.formatName(formatName);
    if (this.props.format || import_client_main.PS.mainmenu.searchSent) {
      return /* @__PURE__ */ Chat.h(
        "button",
        {
          name: "format",
          value: this.format,
          class: "select formatselect preselected",
          disabled: true
        },
        formatName,
        !!customRules && [/* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("small", null, "Custom rules: ", customRules)]
      );
    }
    return /* @__PURE__ */ Chat.h(
      "button",
      {
        name: "format",
        value: this.format,
        "data-selecttype": this.props.selectType,
        class: "select formatselect",
        "data-href": "/formatdropdown",
        onChange: this.change
      },
      formatName || !!this.props.placeholder && /* @__PURE__ */ Chat.h("em", null, this.props.placeholder) || null,
      !!customRules && [/* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("small", null, "Custom rules: ", customRules)]
    );
  }
}
class TeamDropdown extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.teamFormat = "";
    this.teamKey = "";
    this.change = () => {
      if (!this.base) return;
      this.teamKey = this.base.value;
      this.forceUpdate();
    };
  }
  getDefaultTeam(teambuilderFormat) {
    for (const team of import_client_main.PS.teams.list) {
      if (team.format === teambuilderFormat) return team.key;
    }
    return "";
  }
  render() {
    const teamFormat = import_client_main.PS.teams.teambuilderFormat(this.props.format);
    const formatData = window.BattleFormats?.[teamFormat];
    if (formatData?.team) {
      return /* @__PURE__ */ Chat.h("button", { class: "select teamselect preselected", name: "team", value: "random", disabled: true }, /* @__PURE__ */ Chat.h("div", { class: "team" }, /* @__PURE__ */ Chat.h("strong", null, "Random team"), /* @__PURE__ */ Chat.h("small", null, /* @__PURE__ */ Chat.h(import_panels.PSIcon, { pokemon: null }), /* @__PURE__ */ Chat.h(import_panels.PSIcon, { pokemon: null }), /* @__PURE__ */ Chat.h(import_panels.PSIcon, { pokemon: null }), /* @__PURE__ */ Chat.h(import_panels.PSIcon, { pokemon: null }), /* @__PURE__ */ Chat.h(import_panels.PSIcon, { pokemon: null }), /* @__PURE__ */ Chat.h(import_panels.PSIcon, { pokemon: null }))));
    }
    if (teamFormat !== this.teamFormat) {
      this.teamFormat = teamFormat;
      this.teamKey = this.getDefaultTeam(teamFormat);
    }
    const team = import_client_main.PS.teams.byKey[this.teamKey] || null;
    return /* @__PURE__ */ Chat.h(
      "button",
      {
        name: "team",
        value: this.teamKey,
        class: "select teamselect",
        "data-href": "/teamdropdown",
        "data-format": teamFormat,
        onChange: this.change
      },
      import_client_main.PS.roomTypes["teamdropdown"] && /* @__PURE__ */ Chat.h(import_panel_teamdropdown.TeamBox, { team, noLink: true })
    );
  }
}
class TeamForm extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.format = "";
    this.changeFormat = (ev) => {
      this.format = ev.target.value;
    };
    this.submit = (ev, validate) => {
      ev.preventDefault();
      const format = this.format;
      const teamKey = this.base.querySelector("button[name=team]").value;
      const team = teamKey ? import_client_main.PS.teams.byKey[teamKey] : void 0;
      import_client_main.PS.teams.loadTeam(team).then(() => {
        (validate === "validate" ? this.props.onValidate : this.props.onSubmit)?.(ev, format, team);
      });
    };
    this.handleClick = (ev) => {
      let target = ev.target;
      while (target && target !== this.base) {
        if (target.tagName === "BUTTON" && target.name === "validate") {
          this.submit(ev, "validate");
          return;
        }
        target = target.parentNode;
      }
    };
  }
  render() {
    if (window.BattleFormats) {
      const starredPrefs = import_client_main.PS.prefs.starredformats || {};
      const starred = Object.keys(starredPrefs).filter((id) => starredPrefs[id] === true).reverse();
      if (!this.format) {
        this.format = `gen${import_battle_dex.Dex.gen}randombattle`;
        for (let id of starred) {
          let format = window.BattleFormats[id];
          if (!format) continue;
          if (this.props.selectType === "challenge" && format?.challengeShow === false) continue;
          if (this.props.selectType === "search" && format?.searchShow === false) continue;
          if (this.props.selectType === "teambuilder" && format?.team) continue;
          this.format = id;
          break;
        }
      }
    }
    return /* @__PURE__ */ Chat.h("form", { class: this.props.class, onSubmit: this.submit, onClick: this.handleClick }, !this.props.hideFormat && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Format:", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h(
      FormatDropdown,
      {
        selectType: this.props.selectType,
        format: this.props.format,
        defaultFormat: this.format,
        onChange: this.changeFormat
      }
    ))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Team:", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h(TeamDropdown, { format: this.props.teamFormat || this.format }))), /* @__PURE__ */ Chat.h("p", null, this.props.children));
  }
}
import_client_main.PS.addRoomType(NewsPanel, MainMenuPanel);
//# sourceMappingURL=panel-mainmenu.js.map
