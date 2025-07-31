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
var panel_rooms_exports = {};
__export(panel_rooms_exports, {
  RoomsRoom: () => RoomsRoom
});
module.exports = __toCommonJS(panel_rooms_exports);
var import_client_main = require("./client-main");
var import_panels = require("./panels");
var import_battle_dex = require("./battle-dex");
/**
 * Room-list panel (default right-panel)
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
class RoomsRoom extends import_client_main.PSRoom {
  constructor(options) {
    super(options);
    this.classType = "rooms";
    import_client_main.PS.send(`/cmd rooms`);
  }
}
class RoomsPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.hidden = false;
    this.search = "";
    this.section = "";
    this.lastKeyCode = 0;
    this.roomList = [];
    this.roomListFocusIndex = -1;
    this.roomListLength = 0;
    this.hide = (ev) => {
      ev.stopImmediatePropagation();
      import_client_main.PS.hideRightRoom();
    };
    this.changeSearch = (ev) => {
      const target = ev.currentTarget;
      if (target.selectionStart !== target.selectionEnd) return;
      this.updateRoomList(target.value);
      this.forceUpdate();
    };
    this.changeSection = (ev) => {
      const target = ev.currentTarget;
      this.section = target.value;
      this.forceUpdate();
    };
    this.handleOnBlur = (ev) => {
      this.roomListFocusIndex = -1;
      this.forceUpdate();
    };
    this.keyDownSearch = (ev) => {
      this.lastKeyCode = ev.keyCode;
      if (ev.shiftKey || ev.ctrlKey || ev.altKey || ev.metaKey) return;
      if (ev.keyCode === 38) {
        this.roomListFocusIndex = Math.max(this.roomListFocusIndex - 1, this.search ? 0 : -1);
        this.forceUpdate();
        ev.preventDefault();
      } else if (ev.keyCode === 40) {
        this.roomListFocusIndex = Math.min(this.roomListFocusIndex + 1, this.roomListLength - 1);
        this.forceUpdate();
        ev.preventDefault();
      } else if (ev.keyCode === 13) {
        const target = ev.currentTarget;
        let value = this.getRoomListFocusTitle() || target.value;
        const arrowIndex = value.indexOf(" \u21D2 ");
        if (arrowIndex >= 0) value = value.slice(arrowIndex + 3);
        if (!/^[a-z0-9-]$/.test(value)) value = (0, import_battle_dex.toID)(value);
        ev.preventDefault();
        ev.stopImmediatePropagation();
        target.value = "";
        this.updateRoomList("");
        import_client_main.PS.join(value);
      }
    };
  }
  static {
    this.id = "rooms";
  }
  static {
    this.routes = ["rooms"];
  }
  static {
    this.Model = RoomsRoom;
  }
  static {
    this.location = "right";
  }
  static {
    this.icon = /* @__PURE__ */ Chat.h("i", { class: "fa fa-plus rooms-plus", "aria-hidden": true });
  }
  static {
    this.title = "Chat Rooms";
  }
  componentDidMount() {
    super.componentDidMount();
    this.subscriptions.push(import_client_main.PS.user.subscribe((update) => {
      if (!update && import_client_main.PS.user.named) import_client_main.PS.send(`/cmd rooms`);
    }));
  }
  componentDidUpdate() {
    const el = this.base?.querySelector("a.blocklink.cur");
    if (!this.roomListFocusIndex) return;
    el?.scrollIntoView({ behavior: "auto", block: "center" });
  }
  updateRoomList(search) {
    if (search) search = (0, import_battle_dex.toID)(search);
    const forceNoAutocomplete = this.search === `${search || ""}-`;
    if (search || this.search) {
      if (search === void 0 || search === this.search) return;
      this.search = search;
      this.roomListFocusIndex = this.search ? 0 : -1;
    }
    this.roomList = this.getRoomList(forceNoAutocomplete);
    for (const [, rooms] of this.roomList) {
      rooms.sort((a, b) => (b.userCount || 0) - (a.userCount || 0));
    }
  }
  getRoomList(forceNoAutocomplete) {
    const searchid = (0, import_battle_dex.toID)(this.search);
    if (!searchid) {
      const roomsCache = import_client_main.PS.mainmenu.roomsCache;
      const officialRooms = [], chatRooms = [], hiddenRooms = [];
      for (const room of roomsCache.chat || []) {
        if (room.section !== this.section && this.section !== "") continue;
        if (room.privacy === "hidden") {
          hiddenRooms.push(room);
        } else if (room.section === "Official") {
          officialRooms.push(room);
        } else {
          chatRooms.push(room);
        }
      }
      return [
        ["Official chat rooms", officialRooms],
        ["Chat rooms", chatRooms],
        ["Hidden rooms", hiddenRooms]
      ];
    }
    let exactMatch = false;
    const rooms = import_client_main.PS.mainmenu.roomsCache;
    let roomList = [...rooms.chat || []];
    for (const room of roomList) {
      if (!room.subRooms) continue;
      for (const title of room.subRooms) {
        roomList.push({
          title,
          desc: `(Subroom of ${room.title})`
        });
      }
    }
    let results = roomList.filter((room) => {
      const titleid = (0, import_battle_dex.toID)(room.title);
      if (titleid === searchid) exactMatch = true;
      return titleid.startsWith(searchid) || (0, import_battle_dex.toID)(room.title.replace(/^The /, "")).startsWith(searchid);
    });
    roomList = roomList.filter((room) => !results.includes(room));
    results = results.concat(roomList.filter(
      (room) => (0, import_battle_dex.toID)(room.title.toLowerCase().replace(/\b([a-z0-9])[a-z0-9]*\b/g, "$1")).startsWith(searchid) || room.title.replace(/[^A-Z0-9]+/g, "").toLowerCase().startsWith(searchid)
    ));
    const hidden = !exactMatch ? [["Possible secret room", [{ title: this.search, desc: "(Private room?)" }]]] : [];
    const autoFill = this.lastKeyCode !== 127 && this.lastKeyCode >= 32;
    if (autoFill && !forceNoAutocomplete) {
      results.sort((a, b) => (b.userCount || 0) - (a.userCount || 0));
      const firstTitle = (results[0] || hidden[0][1][0]).title;
      let firstTitleOffset = 0;
      while (searchid !== (0, import_battle_dex.toID)(firstTitle.slice(0, firstTitleOffset)) && firstTitleOffset < firstTitle.length) {
        firstTitleOffset++;
      }
      let autoFillValue = firstTitle.slice(firstTitleOffset);
      if (!autoFillValue && (0, import_battle_dex.toID)(firstTitle) !== searchid) {
        autoFillValue = " \u21D2 " + firstTitle;
      }
      const oldSearch = this.search;
      const searchElem = this.base.querySelector("input[type=search]");
      if (autoFillValue) {
        searchElem.value = oldSearch + autoFillValue;
        searchElem.setSelectionRange(oldSearch.length, oldSearch.length + autoFillValue.length);
        this.search += "-";
      }
      return [["Search results", results], ...hidden];
    }
    return [...hidden, ["Search results", results]];
  }
  render() {
    if (this.hidden && import_client_main.PS.isVisible(this.props.room)) this.hidden = false;
    if (this.hidden) {
      return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room: this.props.room, scrollable: true }, null);
    }
    const rooms = import_client_main.PS.mainmenu.roomsCache;
    this.updateRoomList();
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room: this.props.room, scrollable: true }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("button", { class: "button", style: "float:right;font-size:10pt;margin-top:3px", onClick: this.hide }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-caret-right", "aria-hidden": true }), " Hide"), /* @__PURE__ */ Chat.h("div", { class: "roomcounters" }, /* @__PURE__ */ Chat.h("a", { class: "button", href: "users", title: "Find an online user" }, /* @__PURE__ */ Chat.h(
      "span",
      {
        class: "pixelated usercount",
        title: "Meloetta is PS's mascot! The Aria forme is about using its voice, and represents our chatrooms."
      }
    ), /* @__PURE__ */ Chat.h("strong", null, rooms.userCount || "-"), " users online"), " ", /* @__PURE__ */ Chat.h("a", { class: "button", href: "battles", title: "Watch an active battle" }, /* @__PURE__ */ Chat.h(
      "span",
      {
        class: "pixelated battlecount",
        title: "Meloetta is PS's mascot! The Pirouette forme is Fighting-type, and represents our battles."
      }
    ), /* @__PURE__ */ Chat.h("strong", null, rooms.battleCount || "-"), " active battles")), /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("select", { name: "sections", class: "button", onChange: this.changeSection }, /* @__PURE__ */ Chat.h("option", { value: "" }, "(All rooms)"), rooms.sectionTitles?.map((title) => {
      return /* @__PURE__ */ Chat.h("option", { value: title }, " ", title, " ");
    })), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "search",
        name: "roomsearch",
        class: "textbox autofocus",
        style: "width: 100%; max-width: 480px",
        placeholder: "Join or search for rooms",
        autocomplete: "off",
        onInput: this.changeSearch,
        onKeyDown: this.keyDownSearch,
        onBlur: this.handleOnBlur
      }
    )), this.renderRoomList()));
  }
  getRoomListFocusTitle() {
    return this.roomList.map(([, rooms]) => rooms).reduce((a, b) => a.concat(b))[this.roomListFocusIndex]?.title;
  }
  renderRoomList() {
    const roomsCache = import_client_main.PS.mainmenu.roomsCache;
    if (roomsCache.userCount === void 0) {
      return /* @__PURE__ */ Chat.h("div", { class: "roomlist" }, /* @__PURE__ */ Chat.h("h2", null, "Official chat rooms"), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("em", null, "Connecting...")));
    }
    if (this.search) {
    } else if (import_client_main.PS.isOffline) {
      return /* @__PURE__ */ Chat.h("div", { class: "roomlist" }, /* @__PURE__ */ Chat.h("h2", null, "Offline"));
    } else if (roomsCache.userCount === void 0) {
      return /* @__PURE__ */ Chat.h("div", { class: "roomlist" }, /* @__PURE__ */ Chat.h("h2", null, "Official chat rooms"), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("em", null, "Connecting...")));
    }
    let nextOffset = 0;
    return this.roomList.map(([title, rooms]) => {
      if (!rooms.length) return null;
      const sortedRooms = rooms.sort((a, b) => (b.userCount || 0) - (a.userCount || 0));
      const offset = nextOffset;
      nextOffset += sortedRooms.length;
      this.roomListLength = nextOffset;
      const index = this.roomListFocusIndex >= offset && this.roomListFocusIndex < nextOffset ? this.roomListFocusIndex - offset : -1;
      return /* @__PURE__ */ Chat.h("div", { class: "roomlist" }, /* @__PURE__ */ Chat.h("h2", null, title), sortedRooms.map((roomInfo, i) => /* @__PURE__ */ Chat.h("div", { key: roomInfo.title }, /* @__PURE__ */ Chat.h("a", { href: `/${(0, import_battle_dex.toID)(roomInfo.title)}`, class: `blocklink${i === index ? " cur" : ""}` }, roomInfo.userCount !== void 0 && /* @__PURE__ */ Chat.h("small", { style: "float:right" }, "(", roomInfo.userCount, " users)"), /* @__PURE__ */ Chat.h("strong", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-comment-o", "aria-hidden": true }), " ", roomInfo.title, /* @__PURE__ */ Chat.h("br", null)), /* @__PURE__ */ Chat.h("small", null, roomInfo.desc || "")), roomInfo.subRooms && /* @__PURE__ */ Chat.h("div", { class: "subrooms" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-level-up fa-rotate-90", "aria-hidden": true }), " Subrooms: ", roomInfo.subRooms.map((roomName) => [/* @__PURE__ */ Chat.h("a", { href: `/${(0, import_battle_dex.toID)(roomName)}`, class: "blocklink" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-comment-o", "aria-hidden": true }), " ", /* @__PURE__ */ Chat.h("strong", null, roomName)), " "])))));
    });
  }
}
import_client_main.PS.addRoomType(RoomsPanel);
//# sourceMappingURL=panel-rooms.js.map
