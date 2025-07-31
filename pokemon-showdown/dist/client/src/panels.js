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
var panels_exports = {};
__export(panels_exports, {
  NARROW_MODE_HEADER_WIDTH: () => NARROW_MODE_HEADER_WIDTH,
  PSIcon: () => PSIcon,
  PSPanelWrapper: () => PSPanelWrapper,
  PSRoomPanel: () => PSRoomPanel,
  PSRouter: () => PSRouter,
  PSView: () => PSView,
  VERTICAL_HEADER_WIDTH: () => VERTICAL_HEADER_WIDTH
});
module.exports = __toCommonJS(panels_exports);
var import_preact = __toESM(require("../js/lib/preact"));
var import_battle_dex = require("./battle-dex");
var import_battle_tooltips = require("./battle-tooltips");
var import_client_connection = require("./client-connection");
var import_client_main = require("./client-main");
var import_panel_topbar = require("./panel-topbar");
/**
 * Panels
 *
 * Main view - sets up the frame, and the generic panels.
 *
 * Also sets up most global event listeners.
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
const VERTICAL_HEADER_WIDTH = 240;
const NARROW_MODE_HEADER_WIDTH = 280;
class PSRouter {
  constructor() {
    this.roomid = "";
    this.panelState = "";
    const currentRoomid = location.pathname.slice(1);
    if (/^[a-z0-9-]*$/.test(currentRoomid)) {
      this.subscribeHistory();
    } else if (location.pathname.endsWith(".html")) {
      this.subscribeHash();
    }
  }
  extractRoomID(url) {
    if (!url) return null;
    if (url.startsWith(document.location.origin)) {
      url = url.slice(document.location.origin.length);
    } else {
      if (url.startsWith("http://")) {
        url = url.slice(7);
      } else if (url.startsWith("https://")) {
        url = url.slice(8);
      }
      if (url.startsWith("psim.us/t/")) {
        url = `viewteam-${url.slice(10)}`;
      }
      if (url.startsWith("teams.pokemonshowdown.com/view/") && /[0-9]/.test(url.charAt(31))) {
        url = `viewteam-${url.slice(31)}`;
      }
      if (url.startsWith("psim.us/r/")) {
        url = `battle-${url.slice(10)}`;
      }
      if (url.startsWith("replay.pokemonshowdown.com/") && /[a-z]/.test(url.charAt(27))) {
        url = `battle-${url.slice(27)}`;
      }
      if (url.startsWith(document.location.host)) {
        url = url.slice(document.location.host.length);
      } else if (import_client_main.PS.server.id === "showdown" && url.startsWith("play.pokemonshowdown.com")) {
        url = url.slice(24);
      } else if (import_client_main.PS.server.id === "showdown" && url.startsWith("psim.us")) {
        url = url.slice(7);
      } else if (url.startsWith("replay.pokemonshowdown.com")) {
        url = url.slice(26).replace("/", "/battle-");
      }
    }
    if (url.startsWith("/")) url = url.slice(1);
    if (url === ".") url = "";
    if (!/^[a-z0-9-]*$/.test(url)) return null;
    const redirects = /^(appeals?|rooms?suggestions?|suggestions?|adminrequests?|bugs?|bugreports?|rules?|faq|credits?|privacy|contact|dex|insecure)$/;
    if (redirects.test(url)) return null;
    if (url.startsWith("view-teams-view-")) {
      const teamid = url.slice(16);
      url = `viewteam-${teamid}`;
    }
    return url;
  }
  /** true: roomid changed, false: panelState changed, null: neither changed */
  updatePanelState() {
    let room = import_client_main.PS.room;
    if (room.noURL) room = import_client_main.PS.rooms[import_client_main.PS.popups[import_client_main.PS.popups.length - 2]] || import_client_main.PS.panel;
    if (room.noURL) room = import_client_main.PS.panel;
    if (room.id === "news" && room.location === "mini-window") room = import_client_main.PS.mainmenu;
    if (room.id === "" && import_client_main.PS.leftPanelWidth && import_client_main.PS.rightPanel) {
      room = import_client_main.PS.rightPanel;
    }
    if (room.id === "rooms") room = import_client_main.PS.leftPanel;
    let roomid = room.id;
    const panelState = import_client_main.PS.leftPanelWidth && room === import_client_main.PS.panel ? import_client_main.PS.leftPanel.id + ".." + import_client_main.PS.rightPanel.id : room.id;
    const newTitle = roomid === "" ? "Showdown!" : `${room.title} - Showdown!`;
    let changed = roomid !== this.roomid;
    this.roomid = roomid;
    if (this.panelState === panelState) changed = null;
    this.panelState = panelState;
    return { roomid, changed, newTitle };
  }
  subscribeHash() {
    if (location.hash) {
      const currentRoomid = location.hash.slice(1);
      if (/^[a-z0-9-]+$/.test(currentRoomid)) {
        import_client_main.PS.join(currentRoomid);
      }
    }
    {
      const { newTitle } = this.updatePanelState();
      document.title = newTitle;
    }
    import_client_main.PS.subscribe(() => {
      const { roomid, changed, newTitle } = this.updatePanelState();
      if (changed) location.hash = roomid ? `#${roomid}` : "";
      document.title = newTitle;
    });
    window.addEventListener("hashchange", (e) => {
      if (import_client_main.PS.popups.length && import_client_main.PS.rooms[import_client_main.PS.popups[import_client_main.PS.popups.length - 1]]?.noURL) return;
      const possibleRoomid = location.hash.slice(1);
      let currentRoomid = null;
      if (/^[a-z0-9-]*$/.test(possibleRoomid)) {
        currentRoomid = possibleRoomid;
      }
      if (currentRoomid !== null) {
        if (currentRoomid === import_client_main.PS.room.id) return;
        this.roomid = currentRoomid;
        import_client_main.PS.join(currentRoomid);
      }
    });
  }
  subscribeHistory() {
    const currentRoomid = location.pathname.slice(1);
    if (/^[a-z0-9-]+$/.test(currentRoomid)) {
      if (currentRoomid !== "preactalpha" && currentRoomid !== "preactbeta" && currentRoomid !== "beta") {
        import_client_main.PS.join(currentRoomid);
      }
    }
    if (!window.history) return;
    {
      const { roomid, newTitle } = this.updatePanelState();
      history.replaceState(this.panelState, "", `/${roomid}`);
      document.title = newTitle;
    }
    import_client_main.PS.subscribe(() => {
      const { roomid, changed, newTitle } = this.updatePanelState();
      if (changed) {
        history.pushState(this.panelState, "", `/${roomid}`);
      } else if (changed !== null) {
        history.replaceState(this.panelState, "", `/${roomid}`);
      }
      document.title = newTitle;
    });
    window.addEventListener("popstate", (e) => {
      const possibleRoomid = location.pathname.slice(1);
      let roomid = null;
      if (/^[a-z0-9-]*$/.test(possibleRoomid)) {
        roomid = possibleRoomid;
      }
      if (typeof e.state === "string") {
        const [leftRoomid, rightRoomid] = e.state.split("..");
        if (rightRoomid) {
          import_client_main.PS.addRoom({ id: leftRoomid, location: "left" }, true);
          import_client_main.PS.addRoom({ id: rightRoomid, location: "right" }, true);
          import_client_main.PS.leftPanel = import_client_main.PS.rooms[leftRoomid] || import_client_main.PS.leftPanel;
          import_client_main.PS.rightPanel = import_client_main.PS.rooms[rightRoomid] || import_client_main.PS.rightPanel;
        }
      }
      if (roomid !== null) {
        this.roomid = roomid;
        import_client_main.PS.join(roomid);
      }
    });
  }
}
import_client_main.PS.router = new PSRouter();
class PSRoomPanel extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.subscriptions = [];
    this.justUpdatedDimensions = false;
  }
  subscribeTo(model, callback = () => {
    this.forceUpdate();
  }) {
    const subscription = model.subscribe(callback);
    this.subscriptions.push(subscription);
    return subscription;
  }
  componentDidMount() {
    this.props.room.onParentEvent = (id, e) => {
      if (id === "focus") this.focus();
    };
    this.subscriptions.push(this.props.room.subscribe((args) => {
      if (!args) this.forceUpdate();
      else this.receiveLine(args);
    }));
    this.componentDidUpdate();
  }
  updateDimensions() {
    const justUpdated = this.justUpdatedDimensions;
    this.justUpdatedDimensions = false;
    const room = this.props.room;
    const newWidth = this.base.offsetWidth;
    const newHeight = this.base.offsetHeight;
    if (room.width === newWidth && room.height === newHeight) {
      return;
    }
    room.width = newWidth;
    room.height = newHeight;
    if (justUpdated) return;
    this.justUpdatedDimensions = true;
    this.forceUpdate();
  }
  componentDidUpdate() {
    const room = this.props.room;
    const currentlyHidden = !room.width && room.parentElem && ["popup", "semimodal-popup"].includes(room.location);
    this.updateDimensions();
    if (currentlyHidden) return;
    if (room.focusNextUpdate) {
      room.focusNextUpdate = false;
      this.focus();
    }
  }
  componentWillUnmount() {
    this.props.room.onParentEvent = null;
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions = [];
  }
  close() {
    import_client_main.PS.leave(this.props.room.id);
  }
  componentDidCatch(err) {
    this.props.room.caughtError = err.stack || err.message;
    this.setState({});
  }
  receiveLine(args) {
  }
  /**
   * PS has "fake select menus", buttons that act like <select> dropdowns.
   * This function is used by the popups they open to change the button
   * values.
   */
  chooseParentValue(value) {
    const dropdownButton = this.props.room.parentElem;
    dropdownButton.value = value;
    const changeEvent = new Event("change");
    dropdownButton.dispatchEvent(changeEvent);
    import_client_main.PS.closePopup();
  }
  focus() {
    if (PSView.hasTapped) return;
    const autofocus = this.base?.querySelector(".autofocus");
    autofocus?.focus();
    autofocus?.select?.();
  }
  render() {
    return /* @__PURE__ */ Chat.h(PSPanelWrapper, { room: this.props.room }, /* @__PURE__ */ Chat.h("div", { class: "mainmessage" }, /* @__PURE__ */ Chat.h("p", null, "Loading...")));
  }
}
function PSPanelWrapper(props) {
  const room = props.room;
  if (room.location === "mini-window") {
    const size = props.fullSize ? " mini-window-flex" : "";
    return /* @__PURE__ */ Chat.h(
      "div",
      {
        id: `room-${room.id}`,
        class: `mini-window-contents tiny-layout ps-room-light${props.scrollable === true ? " scrollable" : ""}${size}`,
        onClick: props.focusClick ? PSView.focusIfNoSelection : void 0,
        onDragEnter: props.onDragEnter
      },
      props.children
    );
  }
  if (import_client_main.PS.isPopup(room)) {
    const style2 = PSView.getPopupStyle(room, props.width, props.fullSize);
    return /* @__PURE__ */ Chat.h("div", { class: "ps-popup", id: `room-${room.id}`, style: style2, onDragEnter: props.onDragEnter }, props.children);
  }
  const style = PSView.posStyle(room);
  if (props.scrollable === "hidden") style.overflow = "hidden";
  const tinyLayout = room.width < 620 ? " tiny-layout" : "";
  return /* @__PURE__ */ Chat.h(
    "div",
    {
      class: `ps-room${room.id === "" ? "" : " ps-room-light"}${props.scrollable === true ? " scrollable" : ""}${tinyLayout}`,
      id: `room-${room.id}`,
      role: "tabpanel",
      "aria-labelledby": `roomtab-${room.id}`,
      style,
      onClick: props.focusClick ? PSView.focusIfNoSelection : void 0,
      onDragEnter: props.onDragEnter
    },
    room.caughtError ? /* @__PURE__ */ Chat.h("div", { class: "broadcast broadcast-red" }, /* @__PURE__ */ Chat.h("pre", null, room.caughtError)) : props.children
  );
}
class PSView extends import_preact.default.Component {
  constructor() {
    super();
    this.handleClickOverlay = (ev) => {
      if (ev.target?.className === "ps-overlay") {
        import_client_main.PS.closePopup();
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    };
    import_client_main.PS.subscribe(() => this.forceUpdate());
    if (PSView.isSafari) {
      document.querySelector("meta[name=viewport]")?.setAttribute("content", "width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0");
    }
    window.onbeforeunload = (ev) => {
      return import_client_main.PS.prefs.refreshprompt ? "Are you sure you want to leave?" : null;
    };
    window.addEventListener("submit", (ev) => {
      const elem = ev.target;
      if (elem?.getAttribute("data-submitsend")) {
        const inputs = import_client_connection.Net.formData(elem);
        let cmd = elem.getAttribute("data-submitsend");
        for (const [name, value] of Object.entries(inputs)) {
          cmd = cmd.replace(`{${name}}`, value === true ? "on" : value === false ? "off" : value);
        }
        cmd = cmd.replace(/\{[a-z0-9-]+\}/g, "");
        const room = import_client_main.PS.getRoom(elem) || import_client_main.PS.mainmenu;
        room.sendDirect(cmd);
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    });
    window.addEventListener("pointerdown", (ev) => {
      PSView.hasTapped = ev.pointerType === "touch" || ev.pointerType === "pen";
    });
    window.addEventListener("click", (ev) => {
      let elem = ev.target;
      const clickedRoom = import_client_main.PS.getRoom(elem);
      while (elem) {
        if (elem.className === "spoiler") {
          elem.className = "spoiler-shown";
        } else if (elem.className === "spoiler-shown") {
          elem.className = "spoiler";
        }
        if (` ${elem.className} `.includes(" username ")) {
          const name = elem.getAttribute("data-name") || elem.innerText;
          const userid = (0, import_battle_dex.toID)(name);
          const roomid = `${` ${elem.className} `.includes(" no-interact ") ? "viewuser" : "user"}-${userid}`;
          import_client_main.PS.join(roomid, {
            parentElem: elem,
            rightPopup: elem.className === "userbutton username",
            args: { username: name }
          });
          ev.preventDefault();
          ev.stopImmediatePropagation();
          return;
        }
        if (elem.tagName === "A" || elem.getAttribute("data-href")) {
          if (ev.ctrlKey || ev.metaKey || ev.shiftKey) break;
          const href = elem.getAttribute("data-href") || elem.getAttribute("href");
          let roomid = import_client_main.PS.router.extractRoomID(href);
          const shortLinks = /^(rooms?suggestions?|suggestions?|adminrequests?|forgotpassword|bugs?(reports?)?|formatsuggestions|rules?|faq|credits?|privacy|contact|dex|(damage)?calc|insecure|replays?|devdiscord|smogdex|smogcord|forums?|trustworthy-dlc-link)$/;
          if (roomid === "appeal" || roomid === "appeals") roomid = "view-help-request--appeal";
          if (roomid === "report") roomid = "view-help-request--report";
          if (roomid === "requesthelp") roomid = "view-help-request--other";
          if (roomid !== null && elem.className !== "no-panel-intercept" && !shortLinks.test(roomid)) {
            let location2 = null;
            if (elem.getAttribute("data-target") === "replace") {
              const room = import_client_main.PS.getRoom(elem);
              if (room) {
                import_client_main.PS.leave(room.id);
                location2 = room.location;
              }
            }
            import_client_main.PS.join(roomid, {
              parentElem: elem,
              location: location2
            });
            if (!import_client_main.PS.isPopup(import_client_main.PS.rooms[roomid])) {
              import_client_main.PS.closeAllPopups();
            }
            ev.preventDefault();
            ev.stopImmediatePropagation();
          }
          return;
        }
        if (elem.getAttribute("data-cmd")) {
          const cmd = elem.getAttribute("data-cmd");
          const room = import_client_main.PS.getRoom(elem) || import_client_main.PS.mainmenu;
          room.send(cmd, elem);
          ev.preventDefault();
          ev.stopImmediatePropagation();
          return;
        }
        if (elem.getAttribute("data-sendraw")) {
          const cmd = elem.getAttribute("data-sendraw");
          const room = import_client_main.PS.getRoom(elem) || import_client_main.PS.mainmenu;
          room.sendDirect(cmd);
          ev.preventDefault();
          ev.stopImmediatePropagation();
          return;
        }
        if (elem.tagName === "BUTTON") {
          if (this.handleButtonClick(elem)) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            return;
          } else if (!elem.getAttribute("type")) {
            elem.setAttribute("type", "button");
          }
        }
        if (elem.id.startsWith("room-")) {
          break;
        }
        elem = elem.parentElement;
      }
      if (import_client_main.PS.room !== clickedRoom) {
        if (clickedRoom) import_client_main.PS.room = clickedRoom;
        import_client_main.PS.closePopupsAbove(clickedRoom);
        import_client_main.PS.update();
      }
      if (clickedRoom && !import_client_main.PS.isPopup(clickedRoom)) {
        PSView.scrollToRoom();
      }
    });
    window.addEventListener("keydown", (ev) => {
      let elem = ev.target;
      let isTextInput = false;
      let isNonEmptyTextInput = false;
      if (elem) {
        isTextInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
        if (isTextInput && ["button", "radio", "checkbox", "file"].includes(elem.type)) {
          isTextInput = false;
        }
        if (isTextInput && elem.value) {
          isNonEmptyTextInput = true;
        }
        if (elem.contentEditable === "true") {
          isTextInput = true;
          if (elem.textContent && elem.textContent !== "\n") {
            isNonEmptyTextInput = true;
          }
        }
      }
      if (!isNonEmptyTextInput) {
        if (import_client_main.PS.room.onParentEvent?.("keydown", ev) === false) {
          ev.stopImmediatePropagation();
          ev.preventDefault();
          return;
        }
      }
      const modifierKey = ev.ctrlKey || ev.altKey || ev.metaKey || ev.shiftKey;
      const altKey = !ev.ctrlKey && ev.altKey && !ev.metaKey && !ev.shiftKey;
      if (altKey && ev.keyCode === 38) {
        import_client_main.PS.arrowKeysUsed = true;
        import_client_main.PS.focusUpRoom();
      } else if (altKey && ev.keyCode === 40) {
        import_client_main.PS.arrowKeysUsed = true;
        import_client_main.PS.focusDownRoom();
      } else if (ev.keyCode === 27) {
        if (import_client_main.PS.popups.length) {
          ev.stopImmediatePropagation();
          ev.preventDefault();
          import_client_main.PS.closePopup();
          import_client_main.PS.focusRoom(import_client_main.PS.room.id);
        } else if (import_client_main.PS.room.id === "rooms") {
          import_client_main.PS.hideRightRoom();
        }
      }
      if (isNonEmptyTextInput) return;
      if (altKey && ev.keyCode === 37) {
        import_client_main.PS.arrowKeysUsed = true;
        import_client_main.PS.focusLeftRoom();
      } else if (altKey && ev.keyCode === 39) {
        import_client_main.PS.arrowKeysUsed = true;
        import_client_main.PS.focusRightRoom();
      }
      if (modifierKey) return;
      if (ev.keyCode === 37) {
        import_client_main.PS.arrowKeysUsed = true;
        import_client_main.PS.focusLeftRoom();
      } else if (ev.keyCode === 39) {
        import_client_main.PS.arrowKeysUsed = true;
        import_client_main.PS.focusRightRoom();
      } else if (ev.keyCode === 191 && !isTextInput && import_client_main.PS.room === import_client_main.PS.mainmenu) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
        import_client_main.PS.join("dm---");
      }
    });
    window.addEventListener("dragend", (ev) => {
      import_client_main.PS.dragging = null;
      ev.preventDefault();
    });
    const colorSchemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (colorSchemeQuery?.media !== "not all") {
      colorSchemeQuery.addEventListener("change", (cs) => {
        if (import_client_main.PS.prefs.theme === "system") document.body.className = cs.matches ? "dark" : "";
      });
    }
    import_client_main.PS.prefs.subscribeAndRun((key) => {
      if (!key || key === "theme") {
        const dark = import_client_main.PS.prefs.theme === "dark" || import_client_main.PS.prefs.theme === "system" && colorSchemeQuery?.matches;
        document.body.className = dark ? "dark" : "";
      }
    });
  }
  static {
    this.isIOS = [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod"
    ].includes(navigator.platform);
  }
  static {
    this.isChrome = navigator.userAgent.includes(" Chrome/");
  }
  static {
    this.isSafari = !this.isChrome && navigator.userAgent.includes(" Safari/");
  }
  static {
    this.isFirefox = navigator.userAgent.includes(" Firefox/");
  }
  static {
    this.isMac = navigator.platform?.startsWith("Mac");
  }
  static {
    this.textboxFocused = false;
  }
  static {
    this.dragend = null;
  }
  static {
    /** was the last click event a tap? heristic for mobile/desktop */
    this.hasTapped = false;
  }
  static {
    /** mode where the tabbar is opened rather than always being there */
    this.narrowMode = false;
  }
  static {
    this.verticalHeaderWidth = VERTICAL_HEADER_WIDTH;
  }
  static setTextboxFocused(focused) {
    if (!PSView.narrowMode) return;
    if (!PSView.isChrome && !PSView.isSafari) return;
    this.textboxFocused = focused;
    if (focused) {
      document.documentElement.classList.remove("scroll-snap-enabled");
      PSView.scrollToRoom();
    } else {
      document.documentElement.classList.add("scroll-snap-enabled");
    }
  }
  static focusPreview(room) {
    if (room !== import_client_main.PS.room) return "";
    const verticalBuf = this.verticalFocusPreview();
    if (verticalBuf) return verticalBuf;
    const isMiniRoom = import_client_main.PS.room.location === "mini-window";
    const { rooms, index } = import_client_main.PS.horizontalNav();
    if (index === -1) return "";
    let buf = " ";
    const leftRoom = import_client_main.PS.rooms[rooms[index - 1]];
    if (leftRoom) buf += `\u2190 ${leftRoom.title}`;
    buf += import_client_main.PS.arrowKeysUsed || isMiniRoom ? " | " : " (use arrow keys) ";
    const rightRoom = import_client_main.PS.rooms[rooms[index + 1]];
    if (rightRoom) buf += `${rightRoom.title} \u2192`;
    return buf;
  }
  static verticalFocusPreview() {
    const { rooms, index } = import_client_main.PS.verticalNav();
    if (index === -1) return "";
    const upRoom = import_client_main.PS.rooms[rooms[index - 1]];
    let downRoom = import_client_main.PS.rooms[rooms[index + 1]];
    if (index === rooms.length - 2 && rooms[index + 1] === "news") downRoom = void 0;
    if (!upRoom && !downRoom) return "";
    let buf = " ";
    const altLabel = PSView.isMac ? "\u1D0F\u1D18\u1D1B" : "\u1D00\u029F\u1D1B";
    if (upRoom) buf += `${altLabel}\u2191 ${upRoom.title}`;
    buf += " | ";
    if (downRoom) buf += `${altLabel}\u2193 ${downRoom.title}`;
    return buf;
  }
  static scrollToHeader() {
    if (PSView.narrowMode && window.scrollX > 0) {
      if (PSView.isSafari || PSView.isFirefox) {
        document.documentElement.classList.remove("scroll-snap-enabled");
        window.scrollTo(0, 0);
        setTimeout(() => {
          if (!PSView.textboxFocused) document.documentElement.classList.add("scroll-snap-enabled");
        }, 1);
      } else {
        window.scrollTo(0, 0);
      }
    }
  }
  static scrollToRoom() {
    if (PSView.narrowMode && window.scrollX === 0) {
      if (PSView.isSafari || PSView.isFirefox) {
        document.documentElement.classList.remove("scroll-snap-enabled");
        window.scrollTo(NARROW_MODE_HEADER_WIDTH, 0);
        setTimeout(() => {
          if (!PSView.textboxFocused) document.documentElement.classList.add("scroll-snap-enabled");
        }, 1);
      } else {
        window.scrollTo(NARROW_MODE_HEADER_WIDTH, 0);
      }
    }
  }
  static {
    this.focusIfNoSelection = (ev) => {
      const room = import_client_main.PS.getRoom(ev.target, true);
      if (!room) return;
      if (window.getSelection?.()?.type === "Range") return;
      room.autoDismissNotifications();
      import_client_main.PS.setFocus(room);
    };
  }
  handleButtonClick(elem) {
    switch (elem.name) {
      case "closeRoom": {
        const roomid = elem.value || import_client_main.PS.getRoom(elem)?.id || "";
        import_client_main.PS.rooms[roomid]?.send("/close", elem);
        return true;
      }
      case "joinRoom":
        import_client_main.PS.join(elem.value, {
          parentElem: elem
        });
        return true;
      case "register":
        import_client_main.PS.join("register", {
          parentElem: elem
        });
        return true;
      case "showOtherFormats": {
        const table = elem.closest("table");
        const room2 = import_client_main.PS.getRoom(elem);
        if (table) {
          for (const row of table.querySelectorAll("tr.hidden")) {
            row.style.display = "table-row";
          }
          for (const row of table.querySelectorAll("tr.no-matches")) {
            row.style.display = "none";
          }
          elem.closest("tr").style.display = "none";
          room2.log?.updateScroll();
        }
        return true;
      }
      case "copyText":
        const dummyInput = document.createElement("input");
        dummyInput.id = "dummyInput";
        dummyInput.value = elem.value || elem.href || "";
        dummyInput.style.position = "absolute";
        elem.appendChild(dummyInput);
        dummyInput.select();
        document.execCommand("copy");
        elem.removeChild(dummyInput);
        elem.innerText = "Copied!";
        return true;
      case "send":
      case "cmd":
        const room = import_client_main.PS.getRoom(elem) || import_client_main.PS.mainmenu;
        if (elem.name === "send") {
          room.sendDirect(elem.value);
        } else {
          room.send(elem.value);
        }
        return true;
    }
    return false;
  }
  componentDidCatch(err) {
    import_client_main.PS.mainmenu.caughtError = err.stack || err.message;
    this.setState({});
  }
  static containingRoomid(elem) {
    let curElem = elem;
    while (curElem) {
      if (curElem.id.startsWith("room-")) {
        return curElem.id.slice(5);
      }
      curElem = curElem.parentElement;
    }
    return null;
  }
  static isEmptyClick(e) {
    try {
      const selection = window.getSelection();
      if (selection.type === "Range") return false;
    } catch {
    }
    import_battle_tooltips.BattleTooltips.hideTooltip();
  }
  static posStyle(room) {
    if (import_client_main.PS.leftPanelWidth === null) {
      if (room === import_client_main.PS.panel) {
        return { top: "30px", left: `${PSView.verticalHeaderWidth}px`, minWidth: `none` };
      }
    } else if (import_client_main.PS.leftPanelWidth === 0) {
      if (room === import_client_main.PS.panel) return {};
    } else {
      if (room === import_client_main.PS.leftPanel) return { width: `${import_client_main.PS.leftPanelWidth}px`, right: "auto" };
      if (room === import_client_main.PS.rightPanel) return { top: 56, left: import_client_main.PS.leftPanelWidth + 1 };
    }
    return { display: "none" };
  }
  static getPopupStyle(room, width, fullSize) {
    if (fullSize) {
      return { width: "90%", maxHeight: "90%", maxWidth: "none", position: "relative", margin: "5vh auto 0" };
    }
    const source = room.parentElem?.getBoundingClientRect();
    if (source && !source.width && !source.height && !source.top && !source.left) {
      room.parentElem = null;
      import_client_main.PS.update();
    }
    if (room.location === "modal-popup" || !room.parentElem || !source) {
      return { maxWidth: width || 480 };
    }
    if (!room.width || !room.height) {
      room.focusNextUpdate = true;
      return {
        position: "absolute",
        visibility: "hidden",
        margin: 0,
        top: 0,
        left: 0
      };
    }
    let style = {
      position: "absolute",
      margin: 0
    };
    const isFixed = room.location !== "popup";
    const offsetLeft = isFixed ? 0 : window.scrollX;
    const offsetTop = isFixed ? 0 : window.scrollY;
    const availableWidth = document.documentElement.clientWidth + offsetLeft;
    const availableHeight = document.documentElement.clientHeight;
    const sourceWidth = source.width;
    const sourceHeight = source.height;
    const sourceTop = source.top + offsetTop;
    const sourceLeft = source.left + offsetLeft;
    const height = room.height;
    width = width || room.width;
    if (room.rightPopup) {
      if (availableHeight > sourceTop + height + 5 && (sourceTop < availableHeight * 2 / 3 || sourceTop + 200 < availableHeight)) {
        style.top = sourceTop;
      } else if (sourceTop + sourceHeight >= height) {
        style.bottom = Math.max(availableHeight - sourceTop - sourceHeight, 0);
      } else {
        style.top = Math.max(0, availableHeight - height);
      }
      const popupLeft = sourceLeft + sourceWidth;
      if (width !== "auto" && popupLeft + width > availableWidth) {
        style = {
          position: "absolute",
          margin: 0
        };
      } else {
        style.left = popupLeft;
      }
    }
    if (style.left === void 0) {
      if (availableHeight > sourceTop + sourceHeight + height + 5 && (sourceTop + sourceHeight < availableHeight * 2 / 3 || sourceTop + sourceHeight + 200 < availableHeight)) {
        style.top = sourceTop + sourceHeight;
      } else if (height + 30 <= sourceTop) {
        style.bottom = Math.max(availableHeight - sourceTop, 0);
      } else if (height + 35 < availableHeight) {
        style.bottom = 5;
      } else {
        style.top = 25;
      }
      const availableAlignedWidth = availableWidth - sourceLeft;
      if (width !== "auto" && availableAlignedWidth < width + 10) {
        style.left = Math.max(availableWidth - width - 10, offsetLeft);
      } else {
        style.left = sourceLeft;
      }
    }
    if (width) style.maxWidth = width;
    return style;
  }
  renderRoom(room) {
    const RoomType = import_client_main.PS.roomTypes[room.type];
    const Panel = RoomType && !room.isPlaceholder && !room.caughtError ? RoomType : PSRoomPanel;
    return /* @__PURE__ */ Chat.h(Panel, { key: room.id, room });
  }
  renderPopup(room) {
    const RoomType = import_client_main.PS.roomTypes[room.type];
    const Panel = RoomType && !room.isPlaceholder && !room.caughtError ? RoomType : PSRoomPanel;
    if (room.location === "popup" && room.parentElem) {
      return /* @__PURE__ */ Chat.h(Panel, { key: room.id, room });
    }
    return /* @__PURE__ */ Chat.h("div", { key: room.id, class: "ps-overlay", onClick: this.handleClickOverlay, role: "dialog" }, /* @__PURE__ */ Chat.h(Panel, { room }));
  }
  render() {
    let rooms = [];
    for (const roomid in import_client_main.PS.rooms) {
      const room = import_client_main.PS.rooms[roomid];
      if (import_client_main.PS.isNormalRoom(room)) {
        rooms.push(this.renderRoom(room));
      }
    }
    return /* @__PURE__ */ Chat.h("div", { class: "ps-frame", role: "none" }, /* @__PURE__ */ Chat.h(import_panel_topbar.PSHeader, null), /* @__PURE__ */ Chat.h(import_panel_topbar.PSMiniHeader, null), rooms, import_client_main.PS.popups.map((roomid) => this.renderPopup(import_client_main.PS.rooms[roomid])));
  }
}
function PSIcon(props) {
  if ("pokemon" in props) {
    return /* @__PURE__ */ Chat.h("span", { class: "picon", style: import_battle_dex.Dex.getPokemonIcon(props.pokemon) });
  }
  if ("item" in props) {
    return /* @__PURE__ */ Chat.h("span", { class: "itemicon", style: import_battle_dex.Dex.getItemIcon(props.item) });
  }
  if ("type" in props) {
    let type = import_battle_dex.Dex.types.get(props.type).name;
    if (!type) type = "???";
    let sanitizedType = type.replace(/\?/g, "%3f");
    return /* @__PURE__ */ Chat.h(
      "img",
      {
        src: `${import_battle_dex.Dex.resourcePrefix}sprites/types/${sanitizedType}.png`,
        alt: type,
        height: "14",
        width: "32",
        class: `pixelated${props.b ? " b" : ""}`
      }
    );
  }
  if ("category" in props) {
    const categoryID = (0, import_battle_dex.toID)(props.category);
    let sanitizedCategory = "";
    switch (categoryID) {
      case "physical":
      case "special":
      case "status":
        sanitizedCategory = categoryID.charAt(0).toUpperCase() + categoryID.slice(1);
        break;
      default:
        sanitizedCategory = "undefined";
        break;
    }
    return /* @__PURE__ */ Chat.h(
      "img",
      {
        src: `${import_battle_dex.Dex.resourcePrefix}sprites/categories/${sanitizedCategory}.png`,
        alt: sanitizedCategory,
        height: "14",
        width: "32",
        class: "pixelated"
      }
    );
  }
  return null;
}
//# sourceMappingURL=panels.js.map
