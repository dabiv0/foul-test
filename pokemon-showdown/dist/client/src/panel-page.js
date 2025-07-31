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
var panel_page_exports = {};
__export(panel_page_exports, {
  SanitizedHTML: () => SanitizedHTML
});
module.exports = __toCommonJS(panel_page_exports);
var import_client_main = require("./client-main");
var import_panels = require("./panels");
var import_battle_log = require("./battle-log");
/**
 * Page Panel
 *
 * Panel for static content and server-rendered HTML.
 *
 * @author Adam Tran <aviettran@gmail.com>
 * @license MIT
 */
function SanitizedHTML(props) {
  return /* @__PURE__ */ Chat.h("div", { dangerouslySetInnerHTML: { __html: import_battle_log.BattleLog.sanitizeHTML(props.children) } });
}
class PageRoom extends import_client_main.PSRoom {
  constructor(options) {
    super(options);
    this.classType = "html";
    this.page = this.id.split("-")[1];
    this.canConnect = true;
    this.loading = true;
    this.setHTMLData = (htmlData) => {
      this.loading = false;
      this.htmlData = htmlData;
      this.update(null);
    };
    this.connect();
    this.title = this.id.split("-")[1];
  }
  connect() {
    if (!this.connected && !PagePanel.clientRooms.hasOwnProperty(this.id.split("-")[1])) {
      import_client_main.PS.send(`/join ${this.id}`);
      this.connected = true;
      this.connectWhenLoggedIn = false;
    }
  }
}
function PageLadderHelp() {
  return /* @__PURE__ */ Chat.h("div", { class: "ladder pad" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": "/ladder", "data-target": "replace" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-chevron-left", "aria-hidden": true }), " Format List")), /* @__PURE__ */ Chat.h("h3", null, "How the ladder works"), /* @__PURE__ */ Chat.h("p", null, "Our ladder displays three ratings: Elo, GXE, and Glicko-1."), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("strong", null, "Elo"), " is the main ladder rating. It's a pretty normal ladder rating: goes up when you win and down when you lose."), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("strong", null, "GXE"), " (Glicko X-Act Estimate) is an estimate of your win chance against an average ladder player."), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("strong", null, "Glicko-1"), " is ", /* @__PURE__ */ Chat.h("a", { href: "https://en.wikipedia.org/wiki/Glicko_rating_system" }, "another rating system"), ". It has rating and deviation values."), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("strong", null, "COIL"), " (Converging Order Invariant Ladder) is used for suspect tests. The more games you play, the closer it will get to your GXE \xD7 4000. How fast it reaches GXE \xD7 4000 depends on ", /* @__PURE__ */ Chat.h("a", { href: "https://www.smogon.com/forums/threads/reintroducing-coil.3747719/", target: "_blank" }, "a custom B value"), " ", "which is different for each suspect test."), /* @__PURE__ */ Chat.h("p", null, "Note that win/loss should not be used to estimate skill, since who you play against is much more important than how many times you win or lose. Our other stats like Elo and GXE are much better for estimating skill."));
}
class PagePanel extends import_panels.PSRoomPanel {
  static {
    this.id = "html";
  }
  static {
    this.routes = ["view-*"];
  }
  static {
    this.Model = PageRoom;
  }
  static {
    this.clientRooms = { "ladderhelp": /* @__PURE__ */ Chat.h(PageLadderHelp, null) };
  }
  /**
   * @return true to prevent line from being sent to server
   */
  receiveLine(args) {
    const { room } = this.props;
    switch (args[0]) {
      case "title":
        room.title = args[1];
        import_client_main.PS.update();
        return true;
      case "tempnotify": {
        const [, id, title, body] = args;
        room.notify({ title, body, id });
        return true;
      }
      case "tempnotifyoff": {
        const [, id] = args;
        room.dismissNotification(id);
        return true;
      }
      case "selectorhtml":
        const pageHTMLContainer = this.base.querySelector(".page-html-container");
        const selectedElement = pageHTMLContainer?.querySelector(args[1]);
        if (!selectedElement) return;
        selectedElement.innerHTML = import_battle_log.BattleLog.sanitizeHTML(args.slice(2).join("|"));
        room.subtleNotify();
        return true;
      case "noinit":
        if (args[1] === "namerequired") {
          room.setHTMLData(args[2]);
        }
        return true;
      case "pagehtml":
        room.setHTMLData(args[1]);
        room.subtleNotify();
        return true;
    }
  }
  render() {
    const { room } = this.props;
    let renderPage;
    if (room.page !== void 0 && PagePanel.clientRooms[room.page]) {
      renderPage = PagePanel.clientRooms[room.page];
    } else {
      if (room.loading) {
        renderPage = /* @__PURE__ */ Chat.h("p", null, "Loading...");
      } else {
        renderPage = /* @__PURE__ */ Chat.h("div", { class: "page-html-container" }, /* @__PURE__ */ Chat.h(SanitizedHTML, null, room.htmlData || ""));
      }
    }
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, scrollable: true }, renderPage);
  }
}
import_client_main.PS.addRoomType(PagePanel);
//# sourceMappingURL=panel-page.js.map
