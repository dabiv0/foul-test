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
var panel_topbar_exports = {};
__export(panel_topbar_exports, {
  PSHeader: () => PSHeader,
  PSMiniHeader: () => PSMiniHeader
});
module.exports = __toCommonJS(panel_topbar_exports);
var import_preact = __toESM(require("../js/lib/preact"));
var import_client_main = require("./client-main");
var import_panels = require("./panels");
var import_battle_log = require("./battle-log");
/**
 * Topbar Panel
 *
 * Topbar view - handles the topbar and some generic popups.
 *
 * Also handles global drag-and-drop support.
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
window.addEventListener("drop", (e) => {
  console.log("drop " + e.dataTransfer.dropEffect);
  const target = e.target;
  if (target.type?.startsWith("text")) {
    import_client_main.PS.dragging = null;
    return;
  }
  e.preventDefault();
  import_client_main.PS.dragging = null;
  import_client_main.PS.updateAutojoin();
});
window.addEventListener("dragover", (e) => {
  e.preventDefault();
});
class PSHeader extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.handleResize = () => {
      if (!this.base) return;
      if (import_client_main.PS.leftPanelWidth === null) {
        const width = document.documentElement.clientWidth;
        const oldNarrowMode = import_panels.PSView.narrowMode;
        import_panels.PSView.narrowMode = width <= 700;
        import_panels.PSView.verticalHeaderWidth = import_panels.PSView.narrowMode ? import_panels.NARROW_MODE_HEADER_WIDTH : import_panels.VERTICAL_HEADER_WIDTH;
        document.documentElement.style.width = import_panels.PSView.narrowMode ? `${width + import_panels.NARROW_MODE_HEADER_WIDTH}px` : "auto";
        if (oldNarrowMode !== import_panels.PSView.narrowMode) {
          if (import_panels.PSView.narrowMode) {
            if (!import_panels.PSView.textboxFocused) {
              document.documentElement.classList?.add("scroll-snap-enabled");
            }
          } else {
            document.documentElement.classList?.remove("scroll-snap-enabled");
          }
          import_client_main.PS.update();
        }
        return;
      }
      if (import_panels.PSView.narrowMode) {
        document.documentElement.classList?.remove("scroll-snap-enabled");
        import_panels.PSView.narrowMode = false;
      }
      const userbarLeft = this.base.querySelector("div.userbar")?.getBoundingClientRect()?.left;
      const plusTabRight = this.base.querySelector('a.roomtab[aria-label="Join chat"]')?.getBoundingClientRect()?.right;
      const overflow = this.base.querySelector(".overflow");
      if (!overflow || !userbarLeft || !plusTabRight) return;
      if (plusTabRight > userbarLeft - 3) {
        overflow.style.display = "block";
      } else {
        overflow.style.display = "none";
      }
    };
  }
  static {
    this.toggleMute = (e) => {
      import_client_main.PS.prefs.set("mute", !import_client_main.PS.prefs.mute);
      import_client_main.PS.update();
    };
  }
  static {
    this.handleDragEnter = (e) => {
      e.preventDefault();
      if (import_client_main.PS.dragging?.type !== "room") return;
      const target = e.currentTarget;
      const draggingRoom = import_client_main.PS.dragging.roomid;
      if (draggingRoom === null) return;
      const draggedOverRoom = import_client_main.PS.router.extractRoomID(target.href);
      if (draggedOverRoom === null) return;
      if (draggingRoom === draggedOverRoom) return;
      const leftIndex = import_client_main.PS.leftRoomList.indexOf(draggedOverRoom);
      if (leftIndex >= 0) {
        import_client_main.PS.dragOnto(import_client_main.PS.rooms[draggingRoom], "left", leftIndex);
      } else {
        const rightIndex = import_client_main.PS.rightRoomList.indexOf(draggedOverRoom);
        if (rightIndex >= 0) {
          import_client_main.PS.dragOnto(import_client_main.PS.rooms[draggingRoom], "right", rightIndex);
        } else {
          return;
        }
      }
    };
  }
  static {
    this.handleDragStart = (e) => {
      const roomid = import_client_main.PS.router.extractRoomID(e.currentTarget.href);
      if (!roomid) return;
      import_client_main.PS.dragging = { type: "room", roomid };
    };
  }
  static roomInfo(room) {
    const RoomType = import_client_main.PS.roomTypes[room.type];
    let icon = RoomType?.icon || /* @__PURE__ */ Chat.h("i", { class: "fa fa-file-text-o", "aria-hidden": true });
    let title = room.title;
    switch (room.type) {
      case "battle":
        let idChunks = room.id.slice(7).split("-");
        let formatName;
        if (idChunks.length <= 1) {
          if (idChunks[0] === "uploadedreplay") formatName = "Uploaded Replay";
        } else {
          formatName = window.BattleLog ? import_battle_log.BattleLog.formatName(idChunks[0]) : idChunks[0];
        }
        if (!title) {
          let battle = room.battle;
          let p1 = battle?.p1?.name || "";
          let p2 = battle?.p2?.name || "";
          if (p1 && p2) {
            title = `${p1} v. ${p2}`;
          } else if (p1 || p2) {
            title = `${p1}${p2}`;
          } else {
            title = `(empty room)`;
          }
        }
        icon = /* @__PURE__ */ Chat.h("i", { class: "text" }, formatName);
        break;
      case "html":
      default:
        if (title.startsWith("[")) {
          let closeBracketIndex = title.indexOf("]");
          if (closeBracketIndex > 0) {
            icon = /* @__PURE__ */ Chat.h("i", { class: "text" }, title.slice(1, closeBracketIndex));
            title = title.slice(closeBracketIndex + 1);
            break;
          }
        }
        break;
    }
    return { icon, title };
  }
  static renderRoomTab(id, noAria) {
    const room = import_client_main.PS.rooms[id];
    if (!room) return null;
    const closable = id === "" || id === "rooms" ? "" : " closable";
    const cur = import_client_main.PS.isVisible(room) ? " cur" : "";
    let notifying = room.isSubtleNotifying ? " subtle-notifying" : "";
    let hoverTitle = "";
    let notifications = room.notifications;
    if (id === "") {
      for (const roomid of import_client_main.PS.miniRoomList) {
        const miniNotifications = import_client_main.PS.rooms[roomid]?.notifications;
        if (miniNotifications?.length) notifications = [...notifications, ...miniNotifications];
      }
    }
    if (notifications.length) {
      notifying = " notifying";
      for (const notif of notifications) {
        if (!notif.body) continue;
        hoverTitle += `${notif.title}
${notif.body}
`;
      }
    }
    let className = `roomtab button${notifying}${closable}${cur}`;
    let { icon, title: roomTitle } = PSHeader.roomInfo(room);
    if (room.type === "rooms" && import_client_main.PS.leftPanelWidth !== null) roomTitle = "";
    if (room.type === "battle") className += " roomtab-battle";
    let closeButton = null;
    if (closable) {
      closeButton = /* @__PURE__ */ Chat.h("button", { class: "closebutton", name: "closeRoom", value: id, "aria-label": "Close" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-times-circle", "aria-hidden": true }));
    }
    const aria = noAria ? {} : {
      "role": "tab",
      "id": `roomtab-${id}`,
      "aria-selected": cur ? "true" : "false"
    };
    if (id === "rooms") aria["aria-label"] = "Join chat";
    return /* @__PURE__ */ Chat.h("li", { class: id === "" ? "home-li" : "", key: id }, /* @__PURE__ */ Chat.h(
      "a",
      {
        class: className,
        href: `/${id}`,
        draggable: true,
        title: hoverTitle || void 0,
        onDragEnter: this.handleDragEnter,
        onDragStart: this.handleDragStart,
        ...aria
      },
      icon,
      " ",
      roomTitle
    ), closeButton);
  }
  componentDidMount() {
    import_client_main.PS.user.subscribe(() => {
      this.forceUpdate();
    });
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  }
  componentDidUpdate() {
    this.handleResize();
  }
  renderUser() {
    if (!import_client_main.PS.connected) {
      return /* @__PURE__ */ Chat.h("button", { class: "button", disabled: true }, /* @__PURE__ */ Chat.h("em", null, "Offline"));
    }
    if (import_client_main.PS.user.initializing) {
      return /* @__PURE__ */ Chat.h("button", { class: "button", disabled: true }, /* @__PURE__ */ Chat.h("em", null, "Connecting..."));
    }
    if (!import_client_main.PS.user.named) {
      return /* @__PURE__ */ Chat.h("a", { class: "button", href: "login" }, "Choose name");
    }
    const userColor = window.BattleLog && `color:${import_battle_log.BattleLog.usernameColor(import_client_main.PS.user.userid)}`;
    return /* @__PURE__ */ Chat.h("span", { class: "username", style: userColor }, /* @__PURE__ */ Chat.h("span", { class: "usernametext" }, import_client_main.PS.user.name));
  }
  renderVertical() {
    return /* @__PURE__ */ Chat.h(
      "div",
      {
        id: "header",
        class: "header-vertical",
        role: "navigation",
        style: `width:${import_panels.PSView.verticalHeaderWidth - 7}px`,
        onClick: import_panels.PSView.scrollToHeader
      },
      /* @__PURE__ */ Chat.h("div", { class: "maintabbarbottom" }),
      /* @__PURE__ */ Chat.h("div", { class: "scrollable-part" }, /* @__PURE__ */ Chat.h(
        "img",
        {
          class: "logo",
          src: `https://${import_client_main.Config.routes.client}/favicon-256.png`,
          alt: "Pok\xE9mon Showdown! (beta)",
          width: "50",
          height: "50"
        }
      ), /* @__PURE__ */ Chat.h("div", { class: "tablist", role: "tablist" }, /* @__PURE__ */ Chat.h("ul", null, PSHeader.renderRoomTab(import_client_main.PS.leftRoomList[0])), /* @__PURE__ */ Chat.h("ul", null, import_client_main.PS.leftRoomList.slice(1).map((roomid) => PSHeader.renderRoomTab(roomid))), /* @__PURE__ */ Chat.h("ul", { class: "siderooms" }, import_client_main.PS.rightRoomList.map((roomid) => PSHeader.renderRoomTab(roomid))))),
      null,
      /* @__PURE__ */ Chat.h("div", { class: "userbar" }, this.renderUser(), " ", /* @__PURE__ */ Chat.h("div", { style: "float:right" }, /* @__PURE__ */ Chat.h("button", { class: "icon button", "data-href": "volume", title: "Sound", "aria-label": "Sound", onDblClick: PSHeader.toggleMute }, /* @__PURE__ */ Chat.h("i", { class: import_client_main.PS.prefs.mute ? "fa fa-volume-off" : "fa fa-volume-up" })), " ", /* @__PURE__ */ Chat.h("button", { class: "icon button", "data-href": "options", title: "Options", "aria-label": "Options" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-cog", "aria-hidden": true }))))
    );
  }
  render() {
    if (import_client_main.PS.leftPanelWidth === null) {
      return this.renderVertical();
    }
    return /* @__PURE__ */ Chat.h("div", { id: "header", class: "header", role: "navigation" }, /* @__PURE__ */ Chat.h("div", { class: "maintabbarbottom" }), /* @__PURE__ */ Chat.h("div", { class: "tabbar maintabbar" }, /* @__PURE__ */ Chat.h("div", { class: "inner-1", role: import_client_main.PS.leftPanelWidth ? "none" : "tablist" }, /* @__PURE__ */ Chat.h("div", { class: "inner-2" }, /* @__PURE__ */ Chat.h("ul", { class: "maintabbar-left", style: { width: `${import_client_main.PS.leftPanelWidth}px` }, role: import_client_main.PS.leftPanelWidth ? "tablist" : "none" }, /* @__PURE__ */ Chat.h("li", null, /* @__PURE__ */ Chat.h(
      "img",
      {
        class: "logo",
        src: `https://${import_client_main.Config.routes.client}/favicon-256.png`,
        alt: "Pok\xE9mon Showdown! (beta)",
        width: "48",
        height: "48"
      }
    )), PSHeader.renderRoomTab(import_client_main.PS.leftRoomList[0]), import_client_main.PS.leftRoomList.slice(1).map((roomid) => PSHeader.renderRoomTab(roomid))), /* @__PURE__ */ Chat.h("ul", { class: "maintabbar-right", role: import_client_main.PS.leftPanelWidth ? "tablist" : "none" }, import_client_main.PS.rightRoomList.map((roomid) => PSHeader.renderRoomTab(roomid)))))), /* @__PURE__ */ Chat.h("div", { class: "overflow" }, /* @__PURE__ */ Chat.h("button", { name: "tablist", class: "button", "data-href": "roomtablist", "aria-label": "All tabs", type: "button" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-caret-down", "aria-hidden": true }))), /* @__PURE__ */ Chat.h("div", { class: "userbar" }, this.renderUser(), " ", /* @__PURE__ */ Chat.h("button", { class: "icon button", "data-href": "volume", title: "Sound", "aria-label": "Sound", onDblClick: PSHeader.toggleMute }, /* @__PURE__ */ Chat.h("i", { class: import_client_main.PS.prefs.mute ? "fa fa-volume-off" : "fa fa-volume-up" })), " ", /* @__PURE__ */ Chat.h("button", { class: "icon button", "data-href": "options", title: "Options", "aria-label": "Options" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-cog", "aria-hidden": true }))));
  }
}
class PSMiniHeader extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.handleScroll = () => {
      this.forceUpdate();
    };
  }
  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll);
  }
  componentWillUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  }
  render() {
    if (import_client_main.PS.leftPanelWidth !== null) return null;
    let notificationsCount = 0;
    for (const roomid of import_client_main.PS.leftRoomList) {
      const miniNotifications = import_client_main.PS.rooms[roomid]?.notifications;
      if (miniNotifications?.length) notificationsCount++;
    }
    const { icon, title } = PSHeader.roomInfo(import_client_main.PS.panel);
    const userColor = window.BattleLog && `color:${import_battle_log.BattleLog.usernameColor(import_client_main.PS.user.userid)}`;
    const showMenuButton = import_panels.PSView.narrowMode;
    const notifying = !showMenuButton && !window.scrollX && Object.values(import_client_main.PS.rooms).some((room) => room.notifications.length) ? " notifying" : "";
    const menuButton = !showMenuButton ? null : window.scrollX ? /* @__PURE__ */ Chat.h("button", { onClick: import_panels.PSView.scrollToHeader, class: `mini-header-left ${notifying}`, "aria-label": "Menu" }, !!notificationsCount && /* @__PURE__ */ Chat.h("div", { class: "notification-badge" }, notificationsCount), /* @__PURE__ */ Chat.h("i", { class: "fa fa-bars", "aria-hidden": true })) : /* @__PURE__ */ Chat.h("button", { onClick: import_panels.PSView.scrollToRoom, class: "mini-header-left", "aria-label": "Menu" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-arrow-right", "aria-hidden": true }));
    return /* @__PURE__ */ Chat.h("div", { class: "mini-header", style: `left:${import_panels.PSView.verticalHeaderWidth + (import_panels.PSView.narrowMode ? 0 : -1)}px;` }, menuButton, icon, " ", title, /* @__PURE__ */ Chat.h("button", { "data-href": "options", class: "mini-header-right", "aria-label": "Options" }, import_client_main.PS.user.named ? /* @__PURE__ */ Chat.h("strong", { style: userColor }, import_client_main.PS.user.name) : /* @__PURE__ */ Chat.h("i", { class: "fa fa-cog", "aria-hidden": true })));
  }
}
import_preact.default.render(/* @__PURE__ */ Chat.h(import_panels.PSView, null), document.body, document.getElementById("ps-frame"));
//# sourceMappingURL=panel-topbar.js.map
