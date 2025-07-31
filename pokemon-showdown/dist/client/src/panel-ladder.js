"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var panel_ladder_exports = {};
__export(panel_ladder_exports, {
  LadderFormatRoom: () => LadderFormatRoom
});
module.exports = __toCommonJS(panel_ladder_exports);
var import_client_main = require("./client-main");
var import_client_connection = require("./client-connection");
var import_panels = require("./panels");
var import_battle_log = require("./battle-log");
var import_battle_dex = require("./battle-dex");
/**
 * Ladder Panel
 *
 * Panel for ladder formats and associated ladder tables.
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>, Adam Tran <aviettran@gmail.com>
 * @license MIT
 */
class LadderFormatRoom extends import_client_main.PSRoom {
  constructor(options) {
    super(options);
    this.classType = "ladder";
    this.format = this.id.split("-")[1];
    this.searchValue = "";
    this.loading = false;
    this.setNotice = (notice) => {
      this.notice = notice;
      this.update(null);
    };
    this.setSearchValue = (searchValue) => {
      this.searchValue = searchValue;
      this.update(null);
    };
    this.setError = (error) => {
      this.loading = false;
      this.error = error.message;
      this.update(null);
    };
    this.setLadderData = (ladderData) => {
      this.loading = false;
      if (ladderData) {
        this.ladderData = JSON.parse(ladderData);
      } else {
        this.ladderData = void 0;
      }
      this.update(null);
    };
    this.requestLadderData = (searchValue) => {
      if (!this.format) return;
      this.searchValue = searchValue;
      this.loading = true;
      if (import_client_main.PS.teams.usesLocalLadder) {
        this.send(`/cmd laddertop ${this.format} ${(0, import_battle_dex.toID)(this.searchValue)}`);
      } else if (this.format !== void 0) {
        (0, import_client_connection.Net)(`//pokemonshowdown.com/ladder/${this.format}.json`).get({
          query: {
            prefix: (0, import_battle_dex.toID)(searchValue)
          }
        }).then(this.setLadderData).catch(this.setError);
      }
      this.update(null);
    };
    if (this.format) this.title = import_battle_log.BattleLog.formatName(this.format);
  }
}
class LadderFormatPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.changeSearch = (e) => {
      e.preventDefault();
      this.props.room.requestLadderData(this.base.querySelector("input[name=searchValue]").value);
    };
  }
  static {
    this.id = "ladderformat";
  }
  static {
    this.routes = ["ladder-*"];
  }
  static {
    this.Model = LadderFormatRoom;
  }
  static {
    this.icon = /* @__PURE__ */ Chat.h("i", { class: "fa fa-list-ol", "aria-hidden": true });
  }
  componentDidMount() {
    const { room } = this.props;
    room.requestLadderData("");
    this.subscriptions.push(
      room.subscribe((response) => {
        if (response) {
          const [format, ladderData] = response;
          if (room.format === format) {
            if (!ladderData) {
              room.setError(new Error("No data returned from server."));
            } else {
              room.setLadderData(ladderData);
            }
          }
        }
        this.forceUpdate();
      })
    );
    this.subscriptions.push(
      import_client_main.PS.teams.subscribe(() => {
        this.forceUpdate();
      })
    );
  }
  renderHeader() {
    if (import_client_main.PS.teams.usesLocalLadder) return null;
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h("h3", null, import_battle_log.BattleLog.formatName(room.format), " Top", room.searchValue ? ` - '${room.searchValue}'` : " 500");
  }
  renderSearch() {
    if (import_client_main.PS.teams.usesLocalLadder) return null;
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h("form", { class: "search", onSubmit: this.changeSearch }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "text",
        name: "searchValue",
        class: "textbox searchinput",
        value: import_battle_log.BattleLog.escapeHTML(room.searchValue),
        placeholder: "username prefix",
        onChange: this.changeSearch
      }
    ), " ", /* @__PURE__ */ Chat.h("button", { type: "submit", class: "button" }, "Search")));
  }
  renderTable() {
    const room = this.props.room;
    if (room.loading || !BattleFormats) {
      return /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-refresh fa-spin", "aria-hidden": true }), " ", /* @__PURE__ */ Chat.h("em", null, "Loading..."));
    } else if (room.error !== void 0) {
      return /* @__PURE__ */ Chat.h("p", null, "Error: ", room.error);
    } else if (!room.ladderData) {
      return null;
    }
    const showCOIL = room.ladderData?.toplist[0]?.coil !== void 0;
    return /* @__PURE__ */ Chat.h("table", { class: "table readable-bg" }, /* @__PURE__ */ Chat.h("tr", { class: "table-header" }, /* @__PURE__ */ Chat.h("th", null), /* @__PURE__ */ Chat.h("th", null, "Name"), /* @__PURE__ */ Chat.h("th", { style: { textAlign: "center" } }, /* @__PURE__ */ Chat.h("abbr", { title: "Elo rating" }, "Elo")), /* @__PURE__ */ Chat.h("th", { style: { textAlign: "center" } }, /* @__PURE__ */ Chat.h("abbr", { title: "user's percentage chance of winning a random battle (Glicko X-Act Estimate)" }, "GXE")), /* @__PURE__ */ Chat.h("th", { style: { textAlign: "center" } }, /* @__PURE__ */ Chat.h("abbr", { title: "Glicko-1 rating system: rating\xB1deviation (provisional if deviation>100)" }, "Glicko-1")), showCOIL && /* @__PURE__ */ Chat.h("th", { style: { textAlign: "center" } }, "COIL")), room.ladderData.toplist.map((row, i) => /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { style: { textAlign: "right" } }, i < 3 && /* @__PURE__ */ Chat.h("i", { class: "fa fa-trophy", "aria-hidden": true, style: { color: ["#d6c939", "#adb2bb", "#ca8530"][i] } }), " ", i + 1), /* @__PURE__ */ Chat.h("td", null, /* @__PURE__ */ Chat.h(
      "span",
      {
        class: "username no-interact",
        style: {
          fontWeight: i < 10 ? "bold" : "normal",
          color: import_battle_log.BattleLog.usernameColor(row.userid)
        }
      },
      row.username
    )), /* @__PURE__ */ Chat.h("td", { style: { textAlign: "center" } }, /* @__PURE__ */ Chat.h("strong", null, row.elo.toFixed(0))), /* @__PURE__ */ Chat.h("td", { style: { textAlign: "center" } }, Math.trunc(row.gxe), /* @__PURE__ */ Chat.h("small", null, ".", row.gxe.toFixed(1).slice(-1), "%")), /* @__PURE__ */ Chat.h("td", { style: { textAlign: "center" } }, /* @__PURE__ */ Chat.h("em", null, row.rpr.toFixed(0), /* @__PURE__ */ Chat.h("small", null, " \xB1 ", row.rprd.toFixed(0)))), showCOIL && /* @__PURE__ */ Chat.h("td", { style: { textAlign: "center" } }, row.coil?.toFixed(0)))), !room.ladderData.toplist.length && /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { colSpan: 5 }, /* @__PURE__ */ Chat.h("em", null, "No one has played any ranked games yet."))));
  }
  render() {
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, scrollable: true }, /* @__PURE__ */ Chat.h("div", { class: "ladder pad" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": "ladder", "data-target": "replace" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-chevron-left", "aria-hidden": true }), " Format List")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": "ladder", "data-target": "replace" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-refresh", "aria-hidden": true }), " Refresh"), " ", /* @__PURE__ */ Chat.h("a", { class: "button", href: "/view-seasonladder-gen9randombattle" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-trophy", "aria-hidden": true }), " Seasonal rankings"), this.renderSearch()), this.renderHeader(), this.renderTable()));
  }
}
class LadderListPanel extends import_panels.PSRoomPanel {
  static {
    this.id = "ladder";
  }
  static {
    this.routes = ["ladder"];
  }
  static {
    this.icon = /* @__PURE__ */ Chat.h("i", { class: "fa fa-list-ol", "aria-hidden": true });
  }
  static {
    this.title = "Ladder";
  }
  componentDidMount() {
    this.subscribeTo(import_client_main.PS.teams);
  }
  renderList() {
    if (!window.BattleFormats) {
      return /* @__PURE__ */ Chat.h("p", null, "Loading...");
    }
    let currentSection = "";
    const buf = [];
    for (const [id, format] of Object.entries(BattleFormats)) {
      if (!format.rated || !format.searchShow) continue;
      if (format.section !== currentSection) {
        currentSection = format.section;
        buf.push(/* @__PURE__ */ Chat.h("h3", null, currentSection));
      }
      buf.push(/* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("a", { href: `/ladder-${id}`, class: "blocklink", style: { fontSize: "11pt", padding: "3px 6px" } }, import_battle_log.BattleLog.formatName(format.id))));
    }
    return buf;
  }
  render() {
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, scrollable: true }, /* @__PURE__ */ Chat.h("div", { class: "ladder pad" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("a", { class: "button", href: `//${import_client_main.Config.routes.users}/`, target: "_blank" }, "Look up a specific user's rating")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { "data-href": "view-ladderhelp", class: "button" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-info-circle", "aria-hidden": true }), " How the ladder works")), this.renderList()));
  }
}
import_client_main.PS.addRoomType(LadderFormatPanel, LadderListPanel);
//# sourceMappingURL=panel-ladder.js.map
