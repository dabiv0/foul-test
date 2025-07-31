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
var panel_popups_exports = {};
__export(panel_popups_exports, {
  UserRoom: () => UserRoom
});
module.exports = __toCommonJS(panel_popups_exports);
var import_preact = __toESM(require("../js/lib/preact"));
var import_battle_dex = require("./battle-dex");
var import_battle_log = require("./battle-log");
var import_client_connection = require("./client-connection");
var import_client_core = require("./client-core");
var import_client_main = require("./client-main");
var import_panel_chat = require("./panel-chat");
var import_panels = require("./panels");
var import_panel_topbar = require("./panel-topbar");
class UserRoom extends import_client_main.PSRoom {
  constructor(options) {
    super(options);
    this.classType = "user";
    const userid = this.id.split("-")[1] || "";
    this.setName(options.args?.username || userid);
  }
  setName(name) {
    this.name = name;
    this.userid = (0, import_battle_dex.toID)(name);
    this.isSelf = this.userid === import_client_main.PS.user.userid;
    if (/[a-zA-Z0-9]/.test(this.name.charAt(0))) this.name = " " + this.name;
    this.update(null);
    if (this.userid) import_client_main.PS.send(`/cmd userdetails ${this.userid}`);
  }
}
class UserPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.lookup = (ev) => {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const room = this.props.room;
      const username = this.base.querySelector("input[name=username]")?.value;
      room.setName(username || "");
    };
    this.maybeReset = (ev) => {
      const room = this.props.room;
      const username = this.base.querySelector("input[name=username]")?.value;
      if ((0, import_battle_dex.toID)(username) !== room.userid) {
        room.setName("");
      }
    };
  }
  static {
    this.id = "user";
  }
  static {
    this.routes = ["user-*", "viewuser-*", "users"];
  }
  static {
    this.Model = UserRoom;
  }
  static {
    this.location = "popup";
  }
  renderUser() {
    const room = this.props.room;
    if (!room.userid) return null;
    const user = import_client_main.PS.mainmenu.userdetailsCache[room.userid] || {
      userid: room.userid,
      name: room.name.slice(1),
      avatar: "[loading]"
    };
    if (!user.avatar) {
      user.name = room.name;
    }
    const hideInteraction = room.id.startsWith("viewuser-");
    const group = import_client_main.PS.server.getGroup(room.name);
    let groupName = group.name || null;
    if (group.type === "punishment") {
      groupName = /* @__PURE__ */ Chat.h("span", { style: "color:#777777" }, groupName);
    }
    const globalGroup = import_client_main.PS.server.getGroup(user.group);
    let globalGroupName = globalGroup.name && `Global ${globalGroup.name}` || null;
    if (globalGroup.type === "punishment") {
      globalGroupName = /* @__PURE__ */ Chat.h("span", { style: "color:#777777" }, globalGroupName);
    }
    if (globalGroup.name === group.name) groupName = null;
    let roomsList = null;
    if (user.rooms) {
      let battlebuf = [];
      let chatbuf = [];
      let privatebuf = [];
      for (let roomid in user.rooms) {
        if (roomid === "global") continue;
        const curRoom = user.rooms[roomid];
        let roomrank = null;
        if (!/[A-Za-z0-9]/.test(roomid.charAt(0))) {
          roomrank = /* @__PURE__ */ Chat.h("small", { style: "color: #888; font-size: 100%" }, roomid.charAt(0));
        }
        roomid = (0, import_battle_dex.toRoomid)(roomid);
        if (roomid.substr(0, 7) === "battle-") {
          const p1 = curRoom.p1.substr(1);
          const p2 = curRoom.p2.substr(1);
          const ownBattle = import_client_main.PS.user.userid === (0, import_battle_dex.toUserid)(p1) || import_client_main.PS.user.userid === (0, import_battle_dex.toUserid)(p2);
          const roomLink = /* @__PURE__ */ Chat.h(
            "a",
            {
              href: `/${roomid}`,
              class: "ilink" + (ownBattle || roomid in import_client_main.PS.rooms ? " yours" : ""),
              title: `${p1 || "?"} v. ${p2 || "?"}`
            },
            roomrank,
            roomid.substr(7)
          );
          if (curRoom.isPrivate) {
            if (privatebuf.length) privatebuf.push(", ");
            privatebuf.push(roomLink);
          } else {
            if (battlebuf.length) battlebuf.push(", ");
            battlebuf.push(roomLink);
          }
        } else {
          const roomLink = /* @__PURE__ */ Chat.h("a", { href: `/${roomid}`, class: "ilink" + (roomid in import_client_main.PS.rooms ? " yours" : "") }, roomrank, roomid);
          if (curRoom.isPrivate) {
            if (privatebuf.length) privatebuf.push(", ");
            privatebuf.push(roomLink);
          } else {
            if (chatbuf.length) chatbuf.push(", ");
            chatbuf.push(roomLink);
          }
        }
      }
      if (battlebuf.length) battlebuf.unshift(/* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("em", null, "Battles:"), " ");
      if (chatbuf.length) chatbuf.unshift(/* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("em", null, "Chatrooms:"), " ");
      if (privatebuf.length) privatebuf.unshift(/* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("em", null, "Private rooms:"), " ");
      if (battlebuf.length || chatbuf.length || privatebuf.length) {
        roomsList = /* @__PURE__ */ Chat.h("small", { class: "rooms" }, battlebuf, chatbuf, privatebuf);
      }
    } else if (user.rooms === false) {
      roomsList = /* @__PURE__ */ Chat.h("strong", { class: "offline" }, "OFFLINE");
    }
    const isSelf = user.userid === import_client_main.PS.user.userid;
    let away = false;
    let status = null;
    if (user.status) {
      away = user.status.startsWith("!");
      status = away ? user.status.slice(1) : user.status;
    }
    const buttonbar = [];
    if (!hideInteraction) {
      buttonbar.push(isSelf ? /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { class: "button", disabled: true }, "Challenge"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": "dm-" }, "Chat Self")) : !import_client_main.PS.user.named ? /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { class: "button", disabled: true }, "Challenge"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", disabled: true }, "Chat"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", disabled: true }, "\u2026")) : /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": `challenge-${user.userid}` }, "Challenge"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": `dm-${user.userid}` }, "Chat"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": `useroptions-${user.userid}-${room.parentRoomid || ""}` }, "\u2026")));
      if (isSelf) {
        buttonbar.push(
          /* @__PURE__ */ Chat.h("hr", null),
          /* @__PURE__ */ Chat.h("p", { class: "buttonbar", style: "text-align: right" }, /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": "login" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-pencil", "aria-hidden": true }), " Change name"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/logout" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-power-off", "aria-hidden": true }), " Log out"))
        );
      }
    }
    const avatar = user.avatar !== "[loading]" ? import_battle_dex.Dex.resolveAvatar(`${user.avatar || "unknown"}`) : null;
    return [/* @__PURE__ */ Chat.h("div", { class: "userdetails" }, avatar && (room.isSelf ? /* @__PURE__ */ Chat.h("img", { src: avatar, class: "trainersprite yours", "data-href": "avatars" }) : /* @__PURE__ */ Chat.h("img", { src: avatar, class: "trainersprite" })), /* @__PURE__ */ Chat.h("strong", null, /* @__PURE__ */ Chat.h(
      "a",
      {
        href: `//${import_client_main.Config.routes.users}/${user.userid}`,
        target: "_blank",
        style: `color: ${away ? "#888888" : import_battle_log.BattleLog.usernameColor(user.userid)}`
      },
      user.name
    )), /* @__PURE__ */ Chat.h("br", null), status && /* @__PURE__ */ Chat.h("div", { class: "userstatus" }, status), groupName && /* @__PURE__ */ Chat.h("div", { class: "usergroup roomgroup" }, groupName), globalGroupName && /* @__PURE__ */ Chat.h("div", { class: "usergroup globalgroup" }, globalGroupName), user.customgroup && /* @__PURE__ */ Chat.h("div", { class: "usergroup globalgroup" }, user.customgroup), !hideInteraction && roomsList), buttonbar];
  }
  render() {
    const room = this.props.room;
    const showLookup = room.id === "users";
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, showLookup && /* @__PURE__ */ Chat.h("form", { onSubmit: this.lookup, style: { minWidth: "278px" } }, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Username: ", /* @__PURE__ */ Chat.h("input", { type: "search", name: "username", class: "textbox autofocus", onInput: this.maybeReset, onChange: this.maybeReset })), !room.userid && /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { type: "submit", class: "button" }, /* @__PURE__ */ Chat.h("strong", null, "Look up")), " ", /* @__PURE__ */ Chat.h("button", { name: "closeRoom", class: "button" }, "Close")), !!room.userid && /* @__PURE__ */ Chat.h("hr", null)), this.renderUser()));
  }
}
class UserOptionsPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.handleMute = (ev) => {
      this.setState({ showMuteInput: true, showBanInput: false, showLockInput: false });
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
    this.handleBan = (ev) => {
      this.setState({ showBanInput: true, showMuteInput: false, showLockInput: false });
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
    this.handleLock = (ev) => {
      this.setState({ showLockInput: true, showMuteInput: false, showBanInput: false });
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
    this.handleCancel = (ev) => {
      this.setState({ showBanInput: false, showMuteInput: false, showLockInput: false, showConfirm: false });
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
    this.handleConfirm = (ev) => {
      const data = this.state.data;
      if (!data) return;
      const { targetUser, targetRoom } = this.getTargets();
      let cmd = "";
      if (data.action === "Mute") {
        cmd += data.duration === "1 hour" ? "/hourmute " : "/mute ";
      } else if (data.action === "Ban") {
        cmd += data.duration === "1 week" ? "/weekban " : "/ban ";
      } else if (data.action === "Lock") {
        cmd += data.duration === "1 week" ? "/weeklock " : "/lock ";
      } else if (data.action === "Namelock") {
        cmd += "/namelock ";
      } else {
        return;
      }
      cmd += `${targetUser} ${data.reason ? "," + data.reason : ""}`;
      targetRoom?.send(cmd);
      this.close();
    };
    this.handleAddFriend = (ev) => {
      const { targetUser, targetRoom } = this.getTargets();
      targetRoom?.send(`/friend add ${targetUser}`);
      this.setState({ requestSent: true });
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
    this.handleIgnore = () => {
      const { targetUser, targetRoom } = this.getTargets();
      targetRoom?.send(`/ignore ${targetUser}`);
      this.close();
    };
    this.handleUnignore = () => {
      const { targetUser, targetRoom } = this.getTargets();
      targetRoom?.send(`/unignore ${targetUser}`);
      this.close();
    };
    this.muteUser = (ev) => {
      this.setState({ showMuteInput: false });
      const hrMute = ev.currentTarget.value === "1hr";
      const reason = this.base?.querySelector("input[name=mutereason]")?.value;
      const data = {
        action: "Mute",
        reason,
        duration: hrMute ? "1 hour" : "7 minutes"
      };
      this.setState({ data, showConfirm: true });
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
    this.banUser = (ev) => {
      this.setState({ showBanInput: false });
      const weekBan = ev.currentTarget.value === "1wk";
      const reason = this.base?.querySelector("input[name=banreason]")?.value;
      const data = {
        action: "Ban",
        reason,
        duration: weekBan ? "1 week" : "2 days"
      };
      this.setState({ data, showConfirm: true });
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
    this.lockUser = (ev) => {
      this.setState({ showLockInput: false });
      const weekLock = ev.currentTarget.value === "1wk";
      const isNamelock = ev.currentTarget.value === "nmlk";
      const reason = this.base?.querySelector("input[name=lockreason]")?.value;
      const data = {
        action: isNamelock ? "Namelock" : "Lock",
        reason,
        duration: weekLock ? "1 week" : "2 days"
      };
      this.setState({ data, showConfirm: true });
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
    this.isIgnoringUser = (userid) => {
      const ignoring = import_client_main.PS.prefs.ignore || {};
      if (ignoring[userid] === 1) return true;
      return false;
    };
  }
  static {
    this.id = "useroptions";
  }
  static {
    this.routes = ["useroptions-*"];
  }
  static {
    this.location = "popup";
  }
  static {
    this.noURL = true;
  }
  getTargets() {
    const [, targetUser, targetRoomid] = this.props.room.id.split("-");
    let targetRoom = import_client_main.PS.rooms[targetRoomid] || null;
    if (targetRoom?.type !== "chat") targetRoom = targetRoom?.getParent();
    if (targetRoom?.type !== "chat") targetRoom = targetRoom?.getParent();
    if (targetRoom?.type !== "chat") targetRoom = null;
    return { targetUser, targetRoomid, targetRoom };
  }
  render() {
    const room = this.props.room;
    const banPerms = ["@", "#", "~"];
    const mutePerms = ["%", ...banPerms];
    const { targetUser, targetRoom } = this.getTargets();
    const userRoomGroup = targetRoom?.users[import_client_main.PS.user.userid].charAt(0) || "";
    const canMute = mutePerms.includes(userRoomGroup);
    const canBan = banPerms.includes(userRoomGroup);
    const canLock = mutePerms.includes(import_client_main.PS.user.group);
    const isVisible = (actionName) => {
      if (actionName === "mute") {
        return canMute && !this.state.showLockInput && !this.state.showBanInput && !this.state.showConfirm;
      }
      if (actionName === "ban") {
        return canBan && !this.state.showLockInput && !this.state.showMuteInput && !this.state.showConfirm;
      }
      if (actionName === "lock") {
        return canLock && !this.state.showBanInput && !this.state.showMuteInput && !this.state.showConfirm;
      }
    };
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 280 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("p", null, this.isIgnoringUser(targetUser) ? /* @__PURE__ */ Chat.h("button", { onClick: this.handleUnignore, class: "button" }, "Unignore") : /* @__PURE__ */ Chat.h("button", { onClick: this.handleIgnore, class: "button" }, "Ignore")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { "data-href": `view-help-request-report-user-${targetUser}`, class: "button" }, "Report")), /* @__PURE__ */ Chat.h("p", null, this.state.requestSent ? /* @__PURE__ */ Chat.h("button", { class: "button disabled" }, "Sent request") : /* @__PURE__ */ Chat.h("button", { onClick: this.handleAddFriend, class: "button" }, "Add friend")), (canMute || canBan || canLock) && /* @__PURE__ */ Chat.h("hr", null), this.state.showConfirm && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("small", null, this.state.data?.action, " ", /* @__PURE__ */ Chat.h("b", null, targetUser), " ", !this.state.data?.action.endsWith("ock") ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, "from ", /* @__PURE__ */ Chat.h("b", null, targetRoom?.title)) : "", " for ", this.state.data?.duration, "?"), /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.handleConfirm }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-confirm", "aria-hidden": true }), " Confirm"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.handleCancel }, "Cancel"))), /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, isVisible("mute") && (this.state.showMuteInput ? /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Reason: ", /* @__PURE__ */ Chat.h("input", { name: "mutereason", class: "textbox autofocus", placeholder: "Mute reason (optional)" })), " ", " ", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.muteUser, value: "7min" }, "For 7 Mins"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.muteUser, value: "1hr" }, "For 1 Hour"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.handleCancel }, " Cancel")) : /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.handleMute }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-hourglass-half", "aria-hidden": true }), " Mute")), " ", isVisible("ban") && (this.state.showBanInput ? /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Reason: ", /* @__PURE__ */ Chat.h("input", { name: "banreason", class: "textbox autofocus", placeholder: "Ban reason (optional)" })), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.banUser, value: "2d" }, "For 2 Days"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.banUser, value: "1wk" }, "For 1 Week"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.handleCancel }, "Cancel")) : /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.handleBan }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-gavel", "aria-hidden": true }), " Ban")), " ", isVisible("lock") && (this.state.showLockInput ? /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Reason: ", /* @__PURE__ */ Chat.h("input", { name: "lockreason", class: "textbox autofocus", placeholder: "Lock reason (optional)" })), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.lockUser, value: "2d" }, "For 2 Days"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.lockUser, value: "1wk" }, "For 1 Week"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.lockUser, value: "nmlk" }, "Namelock"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.handleCancel }, "Cancel")) : /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.handleLock }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-lock", "aria-hidden": true }), " Lock/Namelock")))));
  }
}
class UserListPanel extends import_panels.PSRoomPanel {
  static {
    this.id = "userlist";
  }
  static {
    this.routes = ["userlist"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  render() {
    const room = this.props.room;
    const parentRoom = room.getParent();
    if (parentRoom.type !== "chat" && parentRoom.type !== "battle") {
      throw new Error(`UserListPanel: ${room.id} is not a chat room`);
    }
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 280 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h(import_panel_chat.ChatUserList, { room: parentRoom, static: true })));
  }
}
class VolumePanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.setVolume = (e) => {
      const slider = e.currentTarget;
      import_client_main.PS.prefs.set(slider.name, Number(slider.value));
      this.forceUpdate();
    };
    this.setMute = (e) => {
      const checkbox = e.currentTarget;
      import_client_main.PS.prefs.set("mute", !!checkbox.checked);
      import_client_main.PS.update();
    };
  }
  static {
    this.id = "volume";
  }
  static {
    this.routes = ["volume"];
  }
  static {
    this.location = "popup";
  }
  componentDidMount() {
    super.componentDidMount();
    this.subscriptions.push(import_client_main.PS.prefs.subscribe(() => {
      this.forceUpdate();
    }));
  }
  render() {
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("h3", null, "Volume"), /* @__PURE__ */ Chat.h("p", { class: "volume" }, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, "Effects: ", /* @__PURE__ */ Chat.h("span", { class: "value" }, !import_client_main.PS.prefs.mute && import_client_main.PS.prefs.effectvolume ? `${import_client_main.PS.prefs.effectvolume}%` : `-`)), import_client_main.PS.prefs.mute ? /* @__PURE__ */ Chat.h("em", null, "(muted)") : /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "range",
        min: "0",
        max: "100",
        step: "1",
        name: "effectvolume",
        value: import_client_main.PS.prefs.effectvolume,
        onChange: this.setVolume,
        onInput: this.setVolume,
        onKeyUp: this.setVolume
      }
    )), /* @__PURE__ */ Chat.h("p", { class: "volume" }, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, "Music: ", /* @__PURE__ */ Chat.h("span", { class: "value" }, !import_client_main.PS.prefs.mute && import_client_main.PS.prefs.musicvolume ? `${import_client_main.PS.prefs.musicvolume}%` : `-`)), import_client_main.PS.prefs.mute ? /* @__PURE__ */ Chat.h("em", null, "(muted)") : /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "range",
        min: "0",
        max: "100",
        step: "1",
        name: "musicvolume",
        value: import_client_main.PS.prefs.musicvolume,
        onChange: this.setVolume,
        onInput: this.setVolume,
        onKeyUp: this.setVolume
      }
    )), /* @__PURE__ */ Chat.h("p", { class: "volume" }, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, "Notifications: ", /* @__PURE__ */ Chat.h("span", { class: "value" }, !import_client_main.PS.prefs.mute && import_client_main.PS.prefs.notifvolume ? `${import_client_main.PS.prefs.notifvolume}%` : `-`)), import_client_main.PS.prefs.mute ? /* @__PURE__ */ Chat.h("em", null, "(muted)") : /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "range",
        min: "0",
        max: "100",
        step: "1",
        name: "notifvolume",
        value: import_client_main.PS.prefs.notifvolume,
        onChange: this.setVolume,
        onInput: this.setVolume,
        onKeyUp: this.setVolume
      }
    )), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h("input", { type: "checkbox", name: "mute", checked: import_client_main.PS.prefs.mute, onChange: this.setMute }), " Mute all"))));
  }
}
class OptionsPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.setTheme = (e) => {
      const theme = e.currentTarget.value;
      import_client_main.PS.prefs.set("theme", theme);
      this.forceUpdate();
    };
    this.setLayout = (e) => {
      const layout = e.currentTarget.value;
      switch (layout) {
        case "":
          import_client_main.PS.prefs.set("onepanel", null);
          import_client_main.PS.rightPanel ||= import_client_main.PS.rooms["rooms"] || null;
          break;
        case "onepanel":
          import_client_main.PS.prefs.set("onepanel", true);
          break;
        case "vertical":
          import_client_main.PS.prefs.set("onepanel", "vertical");
          break;
      }
      import_client_main.PS.update();
    };
    this.setChatroomTimestamp = (ev) => {
      const timestamp = ev.currentTarget.value;
      import_client_main.PS.prefs.set("timestamps", { ...import_client_main.PS.prefs.timestamps, chatrooms: timestamp || void 0 });
    };
    this.setPMsTimestamp = (ev) => {
      const timestamp = ev.currentTarget.value;
      import_client_main.PS.prefs.set("timestamps", { ...import_client_main.PS.prefs.timestamps, pms: timestamp || void 0 });
    };
    this.handleShowStatusInput = (ev) => {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.setState({ showStatusInput: !this.state.showStatusInput });
    };
    this.handleOnChange = (ev) => {
      let elem = ev.currentTarget;
      let setting = elem.name;
      let value = elem.checked;
      switch (setting) {
        case "blockPMs": {
          import_client_main.PS.prefs.set("blockPMs", value);
          import_client_main.PS.send(value ? "/blockpms" : "/unblockpms");
          break;
        }
        case "blockChallenges": {
          import_client_main.PS.prefs.set("blockChallenges", value);
          import_client_main.PS.send(value ? "/blockchallenges" : "/unblockchallenges");
          break;
        }
        case "bwgfx": {
          import_client_main.PS.prefs.set("bwgfx", value);
          import_battle_dex.Dex.loadSpriteData(value || import_client_main.PS.prefs.noanim ? "bw" : "xy");
          break;
        }
        case "language": {
          import_client_main.PS.prefs.set(setting, elem.value);
          import_client_main.PS.send(`/language ${elem.value}`);
          break;
        }
        case "tournaments": {
          import_client_main.PS.prefs.set(setting, !elem.value ? null : elem.value);
          break;
        }
        case "refreshprompt":
        case "noanim":
        case "nopastgens":
        case "noselfhighlight":
        case "leavePopupRoom":
        case "inchatpm":
          import_client_main.PS.prefs.set(setting, value);
          break;
      }
    };
    this.editStatus = (ev) => {
      const statusInput = this.base.querySelector("input[name=statustext]");
      import_client_main.PS.send(statusInput?.value?.length ? `/status ${statusInput.value}` : `/clearstatus`);
      this.setState({ showStatusUpdated: true, showStatusInput: false });
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
  }
  static {
    this.id = "options";
  }
  static {
    this.routes = ["options"];
  }
  static {
    this.location = "semimodal-popup";
  }
  componentDidMount() {
    super.componentDidMount();
    this.subscribeTo(import_client_main.PS.user);
  }
  render() {
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h(
      "img",
      {
        class: "trainersprite yours",
        width: "40",
        height: "40",
        style: { verticalAlign: "middle" },
        src: import_battle_dex.Dex.resolveAvatar(`${import_client_main.PS.user.avatar}`),
        "data-href": "avatars"
      }
    ), " ", /* @__PURE__ */ Chat.h("strong", null, import_client_main.PS.user.name)), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": "avatars" }, " Avatar...")), this.state.showStatusInput ? /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("input", { name: "statustext" }), /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.editStatus }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-pencil", "aria-hidden": true }))) : /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.handleShowStatusInput, disabled: this.state.showStatusUpdated }, this.state.showStatusUpdated ? "Status Updated" : "Status...")), import_client_main.PS.user.named && (import_client_main.PS.user.registered?.userid === import_client_main.PS.user.userid ? /* @__PURE__ */ Chat.h("button", { className: "button", "data-href": "changepassword" }, "Password...") : /* @__PURE__ */ Chat.h("button", { className: "button", "data-href": "register" }, "Register")), /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("h3", null, "Graphics"), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, "Theme: ", /* @__PURE__ */ Chat.h("select", { name: "theme", class: "button", onChange: this.setTheme }, /* @__PURE__ */ Chat.h("option", { value: "light", selected: import_client_main.PS.prefs.theme === "light" }, "Light"), /* @__PURE__ */ Chat.h("option", { value: "dark", selected: import_client_main.PS.prefs.theme === "dark" }, "Dark"), /* @__PURE__ */ Chat.h("option", { value: "system", selected: import_client_main.PS.prefs.theme === "system" }, "Match system theme")))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, "Layout: ", /* @__PURE__ */ Chat.h("select", { name: "layout", class: "button", onChange: this.setLayout }, /* @__PURE__ */ Chat.h("option", { value: "", selected: !import_client_main.PS.prefs.onepanel }, "Two panels (if wide enough)"), /* @__PURE__ */ Chat.h("option", { value: "onepanel", selected: import_client_main.PS.prefs.onepanel === true }, "Single panel"), /* @__PURE__ */ Chat.h("option", { value: "vertical", selected: import_client_main.PS.prefs.onepanel === "vertical" }, "Vertical tabs")))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, "Background: ", /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": "changebackground" }, "Change Background"))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, " ", /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "noanim",
        checked: import_client_main.PS.prefs.noanim || false,
        type: "checkbox",
        onChange: this.handleOnChange
      }
    ), " Disable animations")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "bwgfx",
        checked: import_client_main.PS.prefs.bwgfx || false,
        type: "checkbox",
        onChange: this.handleOnChange
      }
    ), "  Use 2D sprites instead of 3D models")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "nopastgens",
        checked: import_client_main.PS.prefs.nopastgens || false,
        type: "checkbox",
        onChange: this.handleOnChange
      }
    ), " Use modern sprites for past generations")), /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("h3", null, "Chat"), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "blockPMs",
        checked: import_client_main.PS.prefs.blockPMs || false,
        type: "checkbox",
        onChange: this.handleOnChange
      }
    ), " Block PMs")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "blockChallenges",
        checked: import_client_main.PS.prefs.blockChallenges || false,
        type: "checkbox",
        onChange: this.handleOnChange
      }
    ), " Block challenges")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "inchatpm",
        checked: import_client_main.PS.prefs.inchatpm || false,
        type: "checkbox",
        onChange: this.handleOnChange
      }
    ), " Show PMs in chatrooms")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "noselfhighlight",
        checked: import_client_main.PS.prefs.noselfhighlight || false,
        type: "checkbox",
        onChange: this.handleOnChange
      }
    ), " Do not highlight when your name is said in chat")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "leavePopupRoom",
        checked: import_client_main.PS.prefs.leavePopupRoom || false,
        type: "checkbox",
        onChange: this.handleOnChange
      }
    ), " Confirm before leaving a room")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "refreshprompt",
        checked: import_client_main.PS.prefs.refreshprompt || false,
        type: "checkbox",
        onChange: this.handleOnChange
      }
    ), " Confirm before refreshing")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, "Language: ", /* @__PURE__ */ Chat.h("select", { name: "language", onChange: this.handleOnChange, class: "button" }, /* @__PURE__ */ Chat.h("option", { value: "german", selected: import_client_main.PS.prefs.language === "german" }, "Deutsch"), /* @__PURE__ */ Chat.h("option", { value: "english", selected: import_client_main.PS.prefs.language === "english" }, "English"), /* @__PURE__ */ Chat.h("option", { value: "spanish", selected: import_client_main.PS.prefs.language === "spanish" }, "Espa\xF1ol"), /* @__PURE__ */ Chat.h("option", { value: "french", selected: import_client_main.PS.prefs.language === "french" }, "Fran\xE7ais"), /* @__PURE__ */ Chat.h("option", { value: "italian", selected: import_client_main.PS.prefs.language === "italian" }, "Italiano"), /* @__PURE__ */ Chat.h("option", { value: "dutch", selected: import_client_main.PS.prefs.language === "dutch" }, "Nederlands"), /* @__PURE__ */ Chat.h("option", { value: "portuguese", selected: import_client_main.PS.prefs.language === "portuguese" }, "Portugu\xEAs"), /* @__PURE__ */ Chat.h("option", { value: "turkish", selected: import_client_main.PS.prefs.language === "turkish" }, "T\xFCrk\xE7e"), /* @__PURE__ */ Chat.h("option", { value: "hindi", selected: import_client_main.PS.prefs.language === "hindi" }, "\u0939\u093F\u0902\u0926\u0940"), /* @__PURE__ */ Chat.h("option", { value: "japanese", selected: import_client_main.PS.prefs.language === "japanese" }, "\u65E5\u672C\u8A9E"), /* @__PURE__ */ Chat.h("option", { value: "simplifiedchinese", selected: import_client_main.PS.prefs.language === "simplifiedchinese" }, "\u7B80\u4F53\u4E2D\u6587"), /* @__PURE__ */ Chat.h("option", { value: "traditionalchinese", selected: import_client_main.PS.prefs.language === "traditionalchinese" }, "\u4E2D\u6587")))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, "Tournaments: ", /* @__PURE__ */ Chat.h("select", { name: "tournaments", class: "button", onChange: this.handleOnChange }, /* @__PURE__ */ Chat.h("option", { value: "", selected: !import_client_main.PS.prefs.tournaments }, "Notify when joined"), /* @__PURE__ */ Chat.h("option", { value: "notify", selected: import_client_main.PS.prefs.tournaments === "notify" }, "Always notify"), /* @__PURE__ */ Chat.h("option", { value: "hide", selected: import_client_main.PS.prefs.tournaments === "hide" }, "Hide")))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, "Timestamps: ", /* @__PURE__ */ Chat.h("select", { name: "layout", class: "button", onChange: this.setChatroomTimestamp }, /* @__PURE__ */ Chat.h("option", { value: "", selected: !import_client_main.PS.prefs.timestamps.chatrooms }, "Off"), /* @__PURE__ */ Chat.h("option", { value: "minutes", selected: import_client_main.PS.prefs.timestamps.chatrooms === "minutes" }, "[HH:MM]"), /* @__PURE__ */ Chat.h("option", { value: "seconds", selected: import_client_main.PS.prefs.timestamps.chatrooms === "seconds" }, "[HH:MM:SS]")))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, "Timestamps in DMs: ", /* @__PURE__ */ Chat.h("select", { name: "layout", class: "button", onChange: this.setPMsTimestamp }, /* @__PURE__ */ Chat.h("option", { value: "", selected: !import_client_main.PS.prefs.timestamps.pms }, "Off"), /* @__PURE__ */ Chat.h("option", { value: "minutes", selected: import_client_main.PS.prefs.timestamps.pms === "minutes" }, "[HH:MM]"), /* @__PURE__ */ Chat.h("option", { value: "seconds", selected: import_client_main.PS.prefs.timestamps.pms === "seconds" }, "[HH:MM:SS]")))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, "Chat preferences: ", /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": "chatformatting" }, "Text formatting..."))), /* @__PURE__ */ Chat.h("hr", null), import_client_main.PS.user.named ? /* @__PURE__ */ Chat.h("p", { class: "buttonbar", style: "text-align: right" }, /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": "login" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-pencil", "aria-hidden": true }), " Change name"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/logout" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-power-off", "aria-hidden": true }), " Log out")) : /* @__PURE__ */ Chat.h("p", { class: "buttonbar", style: "text-align: right" }, /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": "login" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-pencil", "aria-hidden": true }), " Choose name"))));
  }
}
class GooglePasswordBox extends import_preact.default.Component {
  componentDidMount() {
    window.gapiCallback = (response) => {
      import_client_main.PS.user.changeNameWithPassword(this.props.name, response.credential, { needsGoogle: true });
    };
    import_client_main.PS.user.gapiLoaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://accounts.google.com/gsi/client";
    document.getElementsByTagName("head")[0].appendChild(script);
  }
  render() {
    return /* @__PURE__ */ Chat.h("div", { class: "google-password-box" }, /* @__PURE__ */ Chat.h(
      "div",
      {
        id: "g_id_onload",
        "data-client_id": "912270888098-jjnre816lsuhc5clj3vbcn4o2q7p4qvk.apps.googleusercontent.com",
        "data-context": "signin",
        "data-ux_mode": "popup",
        "data-callback": "gapiCallback",
        "data-auto_prompt": "false"
      }
    ), /* @__PURE__ */ Chat.h(
      "div",
      {
        class: "g_id_signin",
        "data-type": "standard",
        "data-shape": "pill",
        "data-theme": "filled_blue",
        "data-text": "continue_with",
        "data-size": "large",
        "data-logo_alignment": "left",
        "data-auto_select": "true",
        "data-itp_support": "true",
        style: "width:fit-content;margin:0 auto"
      },
      "[loading Google log-in button]"
    ));
  }
}
class LoginPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.handleSubmit = (ev) => {
      ev.preventDefault();
      const passwordBox = this.base.querySelector("input[name=password]");
      if (passwordBox) {
        import_client_main.PS.user.changeNameWithPassword(this.getUsername(), passwordBox.value);
      } else {
        import_client_main.PS.user.changeName(this.getUsername());
      }
    };
    this.update = () => {
      this.forceUpdate();
    };
    this.reset = (ev) => {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.props.room.args = null;
      this.forceUpdate();
    };
    this.handleShowPassword = (ev) => {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.setState({ passwordShown: !this.state.passwordShown });
    };
  }
  static {
    this.id = "login";
  }
  static {
    this.routes = ["login"];
  }
  static {
    this.location = "semimodal-popup";
  }
  componentDidMount() {
    super.componentDidMount();
    this.subscriptions.push(import_client_main.PS.user.subscribe((args) => {
      if (args) {
        if (args.success) {
          this.close();
          return;
        }
        this.props.room.args = args;
        setTimeout(() => this.focus(), 1);
      }
      this.forceUpdate();
    }));
  }
  getUsername() {
    const loginName = import_client_main.PS.user.loggingIn || this.props.room.args?.name;
    if (loginName) return loginName;
    const input = this.base?.querySelector("input[name=username]");
    if (input && !input.disabled) {
      return input.value;
    }
    return import_client_main.PS.user.named ? import_client_main.PS.user.name : "";
  }
  focus() {
    const passwordBox = this.base.querySelector("input[name=password]");
    const usernameBox = this.base.querySelector("input[name=username]");
    (passwordBox || usernameBox)?.select();
  }
  render() {
    const room = this.props.room;
    const loginState = room.args;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 280 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("h3", null, "Log in"), /* @__PURE__ */ Chat.h("form", { onSubmit: this.handleSubmit }, loginState?.error && /* @__PURE__ */ Chat.h("p", { class: "error" }, loginState.error), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Username: ", /* @__PURE__ */ Chat.h("small", { class: "preview", style: `color:${import_battle_log.BattleLog.usernameColor((0, import_battle_dex.toID)(this.getUsername()))}` }, "(color)"), /* @__PURE__ */ Chat.h(
      "input",
      {
        class: "textbox",
        type: "text",
        name: "username",
        onInput: this.update,
        onChange: this.update,
        autocomplete: "username",
        value: this.getUsername(),
        disabled: !!import_client_main.PS.user.loggingIn || !!loginState?.name
      }
    ))), import_client_main.PS.user.named && !loginState && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("small", null, '(Others will be able to see your name change. To change name privately, use "Log out")')), loginState?.needsPassword && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-level-up fa-rotate-90", "aria-hidden": true }), " ", /* @__PURE__ */ Chat.h("strong", null, "if you registered this name:"), /* @__PURE__ */ Chat.h("label", { class: "label" }, "Password: ", /* @__PURE__ */ Chat.h(
      "input",
      {
        class: "textbox",
        type: this.state.passwordShown ? "text" : "password",
        name: "password",
        autocomplete: "current-password",
        style: "width:173px"
      }
    ), /* @__PURE__ */ Chat.h(
      "button",
      {
        type: "button",
        onClick: this.handleShowPassword,
        "aria-label": "Show password",
        class: "button",
        style: "float:right;margin:-21px 0 10px;padding: 2px 6px"
      },
      /* @__PURE__ */ Chat.h("i", { class: "fa fa-eye", "aria-hidden": true })
    ))), loginState?.needsGoogle && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-level-up fa-rotate-90", "aria-hidden": true }), " ", /* @__PURE__ */ Chat.h("strong", null, "if you registered this name:")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h(GooglePasswordBox, { name: this.getUsername() }))), /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, import_client_main.PS.user.loggingIn ? /* @__PURE__ */ Chat.h("button", { disabled: true, class: "cur" }, "Logging in...") : loginState?.needsPassword ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("button", { type: "submit", class: "button" }, /* @__PURE__ */ Chat.h("strong", null, "Log in")), " ", /* @__PURE__ */ Chat.h("button", { type: "button", onClick: this.reset, class: "button" }, "Cancel")) : loginState?.needsGoogle ? /* @__PURE__ */ Chat.h("button", { type: "button", onClick: this.reset, class: "button" }, "Cancel") : /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("button", { type: "submit", class: "button" }, /* @__PURE__ */ Chat.h("strong", null, "Choose name")), " ", /* @__PURE__ */ Chat.h("button", { type: "button", name: "closeRoom", class: "button" }, "Cancel")), " "), loginState?.name && /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-level-up fa-rotate-90", "aria-hidden": true }), " ", /* @__PURE__ */ Chat.h("strong", null, "if not:")), /* @__PURE__ */ Chat.h("p", { style: { maxWidth: "210px", margin: "0 auto" } }, "This is someone else's account. Sorry."), /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.reset }, "Try another name"))))));
  }
}
class AvatarsPanel extends import_panels.PSRoomPanel {
  static {
    this.id = "avatars";
  }
  static {
    this.routes = ["avatars"];
  }
  static {
    this.location = "semimodal-popup";
  }
  render() {
    const room = this.props.room;
    const avatars = [];
    for (let i = 1; i <= 293; i++) {
      if (i === 162 || i === 168) continue;
      avatars.push([i, window.BattleAvatarNumbers?.[i] || `${i}`]);
    }
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 1210 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("label", { class: "optlabel" }, /* @__PURE__ */ Chat.h("strong", null, "Choose an avatar or "), /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/close" }, " Cancel")), /* @__PURE__ */ Chat.h("div", { class: "avatarlist" }, avatars.map(([i, avatar]) => /* @__PURE__ */ Chat.h(
      "button",
      {
        "data-cmd": `/closeand /avatar ${avatar}`,
        title: `/avatar ${avatar}`,
        class: `option pixelated${avatar === import_client_main.PS.user.avatar ? " cur" : ""}`,
        style: `background-position: -${(i - 1) % 16 * 80 + 1}px -${Math.floor((i - 1) / 16) * 80 + 1}px`
      }
    ))), /* @__PURE__ */ Chat.h("div", { style: "clear:left" }), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/close" }, "Cancel"))));
  }
}
class BattleForfeitPanel extends import_panels.PSRoomPanel {
  static {
    this.id = "forfeit";
  }
  static {
    this.routes = ["forfeitbattle"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  render() {
    const room = this.props.room;
    const battleRoom = room.getParent();
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 480 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("p", null, "Forfeiting makes you lose the battle. Are you sure?"), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { "data-cmd": "/closeand /inopener /closeand /forfeit", class: "button" }, /* @__PURE__ */ Chat.h("strong", null, "Forfeit and close")), " ", /* @__PURE__ */ Chat.h("button", { "data-cmd": "/closeand /inopener /forfeit", class: "button" }, "Just forfeit"), " ", !battleRoom.battle.rated && /* @__PURE__ */ Chat.h("button", { type: "button", "data-href": "replaceplayer", class: "button" }, "Replace player"), " ", /* @__PURE__ */ Chat.h("button", { type: "button", "data-cmd": "/close", class: "button" }, "Cancel"))));
  }
}
class ReplacePlayerPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.handleReplacePlayer = (ev) => {
      const room = this.props.room;
      const battleRoom = room.getParent()?.getParent();
      const newPlayer = this.base?.querySelector("input[name=newplayer]")?.value;
      if (!newPlayer?.length) return battleRoom.add("|error|Enter player's name");
      if (battleRoom.battle.ended) return battleRoom.add("|error|Cannot replace player, battle has already ended.");
      let playerSlot = battleRoom.battle.p1.id === import_client_main.PS.user.userid ? "p1" : "p2";
      battleRoom.send("/leavebattle");
      battleRoom.send(`/addplayer ${newPlayer}, ${playerSlot}`);
      this.close();
      ev.preventDefault();
    };
  }
  static {
    this.id = "replaceplayer";
  }
  static {
    this.routes = ["replaceplayer"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  render() {
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 480 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("form", { onSubmit: this.handleReplacePlayer }, /* @__PURE__ */ Chat.h("p", null, "Replacement player's name:"), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("input", { name: "newplayer", class: "textbox autofocus" })), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { type: "submit", class: "button" }, /* @__PURE__ */ Chat.h("strong", null, "Replace")), " ", /* @__PURE__ */ Chat.h("button", { type: "button", "data-cmd": "/close", class: "button" }, "Cancel")))));
  }
}
class ChangePasswordPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.handleChangePassword = (ev) => {
      ev.preventDefault();
      let oldpassword = this.base?.querySelector("input[name=oldpassword]")?.value;
      let password = this.base?.querySelector("input[name=password]")?.value;
      let cpassword = this.base?.querySelector("input[name=cpassword]")?.value;
      if (!oldpassword?.length || !password?.length || !cpassword?.length) return this.setState({ errorMsg: "All fields are required" });
      if (password !== cpassword) return this.setState({ errorMsg: "Passwords do not match" });
      import_client_connection.PSLoginServer.query("changepassword", {
        oldpassword,
        password,
        cpassword
      }).then((data) => {
        if (data?.actionerror) return this.setState({ errorMsg: data?.actionerror });
        import_client_main.PS.alert("Your password was successfully changed!");
      }).catch((err) => {
        console.error(err);
        this.setState({ errorMsg: err.message });
      });
      this.setState({ errorMsg: "" });
    };
  }
  static {
    this.id = "changepassword";
  }
  static {
    this.routes = ["changepassword"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  render() {
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 280 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("form", { onSubmit: this.handleChangePassword }, !!this.state.errorMsg?.length && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("b", { class: "message-error" }, " ", this.state.errorMsg)), /* @__PURE__ */ Chat.h("p", null, "Change your password:"), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Username: ", /* @__PURE__ */ Chat.h("input", { name: "username", value: import_client_main.PS.user.name, readOnly: true, autocomplete: "username", class: "textbox disabled" }))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Old password: ", /* @__PURE__ */ Chat.h("input", { name: "oldpassword", type: "password", autocomplete: "current-password", class: "textbox autofocus" }))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "New password: ", /* @__PURE__ */ Chat.h("input", { name: "password", type: "password", autocomplete: "new-password", class: "textbox" }))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "New password (confirm): ", /* @__PURE__ */ Chat.h("input", { name: "cpassword", type: "password", autocomplete: "new-password", class: "textbox" }))), /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { type: "submit", class: "button" }, /* @__PURE__ */ Chat.h("strong", null, "Change password")), " ", /* @__PURE__ */ Chat.h("button", { type: "button", "data-cmd": "/close", class: "button" }, "Cancel")))));
  }
}
class RegisterPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.handleRegisterUser = (ev) => {
      ev.preventDefault();
      let captcha = this.base?.querySelector("input[name=captcha]")?.value;
      let password = this.base?.querySelector("input[name=password]")?.value;
      let cpassword = this.base?.querySelector("input[name=cpassword]")?.value;
      if (!captcha?.length || !password?.length || !cpassword?.length) return this.setState({ errorMsg: "All fields are required" });
      if (password !== cpassword) return this.setState({ errorMsg: "Passwords do not match" });
      import_client_connection.PSLoginServer.query("register", {
        captcha,
        password,
        cpassword,
        username: import_client_main.PS.user.name,
        challstr: import_client_main.PS.user.challstr
      }).then((data) => {
        if (data?.actionerror) this.setState({ errorMsg: data?.actionerror });
        if (data?.curuser?.loggedin) {
          let name = data.curuser.username;
          import_client_main.PS.user.registered = { name, userid: (0, import_battle_dex.toID)(name) };
          if (data?.assertion) import_client_main.PS.user.handleAssertion(name, data?.assertion);
          this.close();
          import_client_main.PS.alert("You have been successfully registered.");
        }
      }).catch((err) => {
        console.error(err);
        this.setState({ errorMsg: err.message });
      });
      this.setState({ errorMsg: "" });
    };
  }
  static {
    this.id = "register";
  }
  static {
    this.routes = ["register"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  static {
    this.rightPopup = true;
  }
  render() {
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 280 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("form", { onSubmit: this.handleRegisterUser }, !!this.state.errorMsg?.length && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("b", { class: "message-error" }, " ", this.state.errorMsg)), /* @__PURE__ */ Chat.h("p", null, "Register your account:"), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Username: ", /* @__PURE__ */ Chat.h("input", { name: "name", value: import_client_main.PS.user.name, readOnly: true, autocomplete: "username", class: "textbox disabled" }))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Password: ", /* @__PURE__ */ Chat.h("input", { name: "password", type: "password", autocomplete: "new-password", class: "textbox autofocus" }))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Password (confirm): ", /* @__PURE__ */ Chat.h("input", { name: "cpassword", type: "password", autocomplete: "new-password", class: "textbox" }))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, /* @__PURE__ */ Chat.h(
      "img",
      {
        src: "https://play.pokemonshowdown.com/sprites/gen5ani/pikachu.gif",
        alt: "An Electric-type mouse that is the mascot of the Pok\xE9mon franchise."
      }
    ))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "What is this pokemon? ", /* @__PURE__ */ Chat.h("input", { name: "captcha", class: "textbox" }))), /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { type: "submit", class: "button" }, /* @__PURE__ */ Chat.h("strong", null, "Register")), " ", /* @__PURE__ */ Chat.h("button", { type: "button", "data-cmd": "/close", class: "button" }, "Cancel")))));
  }
}
class BackgroundListPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.setBg = (ev) => {
      let curtarget = ev.currentTarget;
      let bg = curtarget.value;
      import_client_core.PSBackground.set("", bg);
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.forceUpdate();
    };
    this.uploadBg = (ev) => {
      this.setState({ status: void 0 });
      const input = this.base?.querySelector("input[name=bgfile]");
      if (!input?.files?.[0]) return;
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = reader.result;
        import_client_core.PSBackground.set(base64Image, "custom");
        this.forceUpdate();
      };
      reader.onerror = () => {
        this.setState({ status: "Failed to load background image." });
      };
      reader.readAsDataURL(file);
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
  }
  static {
    this.id = "changebackground";
  }
  static {
    this.routes = ["changebackground"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  render() {
    const room = this.props.room;
    const option = (val) => val === import_client_core.PSBackground.id ? "option cur" : "option";
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 480 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("strong", null, "Default")), /* @__PURE__ */ Chat.h("div", { class: "bglist" }, /* @__PURE__ */ Chat.h("button", { onClick: this.setBg, value: "", class: option("") }, /* @__PURE__ */ Chat.h(
      "strong",
      {
        style: "\r\n						background: #888888;\r\n						color: white;\r\n						padding: 16px 18px;\r\n						display: block;\r\n						font-size: 12pt;\r\n					"
      },
      "Random"
    ))), /* @__PURE__ */ Chat.h("div", { style: "clear: left" }), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("strong", null, "Official")), /* @__PURE__ */ Chat.h("div", { class: "bglist" }, /* @__PURE__ */ Chat.h("button", { onClick: this.setBg, value: "charizards", class: option("charizards") }, /* @__PURE__ */ Chat.h("span", { class: "bg", style: "background-position: 0 -0px" }), "Charizards"), /* @__PURE__ */ Chat.h("button", { onClick: this.setBg, value: "horizon", class: option("horizon") }, /* @__PURE__ */ Chat.h("span", { class: "bg", style: "background-position: 0 -90px" }), "Horizon"), /* @__PURE__ */ Chat.h("button", { onClick: this.setBg, value: "waterfall", class: option("waterfall") }, /* @__PURE__ */ Chat.h("span", { class: "bg", style: "background-position: 0 -180px" }), "Waterfall"), /* @__PURE__ */ Chat.h("button", { onClick: this.setBg, value: "ocean", class: option("ocean") }, /* @__PURE__ */ Chat.h("span", { class: "bg", style: "background-position: 0 -270px" }), "Ocean"), /* @__PURE__ */ Chat.h("button", { onClick: this.setBg, value: "shaymin", class: option("shaymin") }, /* @__PURE__ */ Chat.h("span", { class: "bg", style: "background-position: 0 -360px" }), "Shaymin"), /* @__PURE__ */ Chat.h("button", { onClick: this.setBg, value: "solidblue", class: option("solidblue") }, /* @__PURE__ */ Chat.h("span", { class: "bg", style: "background: #344b6c" }), "Solid blue")), /* @__PURE__ */ Chat.h("div", { style: "clear: left" }), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("strong", null, "Custom")), /* @__PURE__ */ Chat.h("p", null, "Upload:"), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("input", { type: "file", accept: "image/*", name: "bgfile", onChange: this.uploadBg })), !!this.state.status && /* @__PURE__ */ Chat.h("p", { class: "error" }, this.state.status), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { "data-cmd": "/close", class: "button" }, /* @__PURE__ */ Chat.h("strong", null, "Done")))));
  }
}
class ChatFormattingPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.handleOnChange = (ev) => {
      const setting = "hide" + ev.currentTarget.name;
      const value = ev.currentTarget.checked;
      let curPref = import_client_main.PS.prefs.chatformatting;
      curPref[setting] = value;
      import_client_main.PS.prefs.set("chatformatting", curPref);
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
  }
  static {
    this.id = "chatformatting";
  }
  static {
    this.routes = ["chatformatting"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  render() {
    const room = this.props.room;
    const ctrl = import_panels.PSView.isMac ? "Cmd" : "Ctrl";
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 480 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("p", null, "Usable formatting:"), /* @__PURE__ */ Chat.h("p", null, "**", /* @__PURE__ */ Chat.h("strong", null, "bold"), "** (", /* @__PURE__ */ Chat.h("kbd", null, ctrl), "+", /* @__PURE__ */ Chat.h("kbd", null, "B"), ")"), /* @__PURE__ */ Chat.h("p", null, "__", /* @__PURE__ */ Chat.h("em", null, "italics"), "__ (", /* @__PURE__ */ Chat.h("kbd", null, ctrl), "+", /* @__PURE__ */ Chat.h("kbd", null, "I"), ")"), /* @__PURE__ */ Chat.h("p", null, "``", /* @__PURE__ */ Chat.h("code", null, "code formatting"), "`` (", /* @__PURE__ */ Chat.h("kbd", null, "Ctrl"), "+", /* @__PURE__ */ Chat.h("kbd", null, "`"), ")"), /* @__PURE__ */ Chat.h("p", null, "~~", /* @__PURE__ */ Chat.h("s", null, "strikethrough"), "~~"), /* @__PURE__ */ Chat.h("p", null, "^^", /* @__PURE__ */ Chat.h("sup", null, "superscript"), "^^"), /* @__PURE__ */ Chat.h("p", null, "\\\\", /* @__PURE__ */ Chat.h("sub", null, "subscript"), "\\\\"), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        onChange: this.handleOnChange,
        type: "checkbox",
        name: "greentext",
        checked: import_client_main.PS.prefs.chatformatting.hidegreentext
      }
    ), " Suppress ", /* @__PURE__ */ Chat.h("span", { class: "greentext" }, ">greentext"))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        onChange: this.handleOnChange,
        type: "checkbox",
        name: "me",
        checked: import_client_main.PS.prefs.chatformatting.hideme
      }
    ), " Suppress ", /* @__PURE__ */ Chat.h("code", null, "/me"), " ", /* @__PURE__ */ Chat.h("em", null, "action formatting"))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        onChange: this.handleOnChange,
        type: "checkbox",
        name: "spoiler",
        checked: import_client_main.PS.prefs.chatformatting.hidespoiler
      }
    ), " Auto-show spoilers: ", /* @__PURE__ */ Chat.h("span", { class: "spoiler" }, "these things"))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        onChange: this.handleOnChange,
        type: "checkbox",
        name: "links",
        checked: import_client_main.PS.prefs.chatformatting.hidelinks
      }
    ), " Make [[clickable links]] unclickable")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        onChange: this.handleOnChange,
        type: "checkbox",
        name: "interstice",
        checked: import_client_main.PS.prefs.chatformatting.hideinterstice
      }
    ), " Don't warn for untrusted links")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { "data-cmd": "/close", class: "button" }, "Done"))));
  }
}
class LeaveRoomPanel extends import_panels.PSRoomPanel {
  static {
    this.id = "confirmleaveroom";
  }
  static {
    this.routes = ["confirmleaveroom"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  render() {
    const room = this.props.room;
    const parentRoomid = room.parentRoomid;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 480 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("p", null, "Close ", /* @__PURE__ */ Chat.h("code", null, parentRoomid || "ERROR"), "?"), /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { "data-cmd": `/closeand /close ${parentRoomid}`, class: "button autofocus" }, /* @__PURE__ */ Chat.h("strong", null, "Close Room")), " ", /* @__PURE__ */ Chat.h("button", { "data-cmd": "/close", class: "button" }, "Cancel"))));
  }
}
class BattleOptionsPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.handleHardcoreMode = (ev) => {
      const mode = ev.currentTarget.checked;
      const room = this.getBattleRoom();
      if (!room) return this.close();
      room.battle.setHardcoreMode(mode);
      if (mode) {
        room.add(`||Hardcore mode ON: Information not available in-game is now hidden.`);
      } else {
        room.add(`||Hardcore mode OFF: Information not available in-game is now shown.`);
      }
      room.update(null);
    };
    this.handleIgnoreSpectators = (ev) => {
      const value = typeof ev === "object" ? ev.currentTarget.checked : ev;
      const room = this.getBattleRoom();
      if (!room) return this.close();
      room.battle.ignoreSpects = value;
      room.add(`||Spectators ${room.battle.ignoreSpects ? "" : "no longer "}ignored.`);
      const chats = document.querySelectorAll(".battle-log .chat");
      const displaySetting = room.battle.ignoreSpects ? "none" : "";
      for (const chat of chats) {
        const small = chat.querySelector("small");
        if (!small) continue;
        const text = small.innerText;
        const isPlayerChat = text.includes("\u2606") || text.includes("\u2605");
        if (!isPlayerChat) {
          chat.style.display = displaySetting;
        }
      }
      room.battle.scene.log.updateScroll();
    };
    this.handleIgnoreOpponent = (ev) => {
      const value = typeof ev === "object" ? ev.currentTarget.checked : ev;
      const room = this.getBattleRoom();
      if (!room) return this.close();
      room.battle.ignoreOpponent = value;
      room.battle.resetToCurrentTurn();
    };
    this.handleIgnoreNicks = (ev) => {
      const value = typeof ev === "object" ? ev.currentTarget.checked : ev;
      const room = this.getBattleRoom();
      if (!room) return this.close();
      room.battle.ignoreNicks = value;
      room.battle.resetToCurrentTurn();
    };
    this.handleAllSettings = (ev) => {
      const setting = ev.currentTarget.name;
      const value = ev.currentTarget.checked;
      const room = this.getBattleRoom();
      switch (setting) {
        case "autotimer": {
          import_client_main.PS.prefs.set("autotimer", value);
          if (value) {
            room?.send("/timer on");
          }
          break;
        }
        case "ignoreopp": {
          import_client_main.PS.prefs.set("ignoreopp", value);
          this.handleIgnoreOpponent(value);
          break;
        }
        case "ignorespects": {
          import_client_main.PS.prefs.set("ignorespects", value);
          this.handleIgnoreSpectators(value);
          break;
        }
        case "ignorenicks": {
          import_client_main.PS.prefs.set("ignorenicks", value);
          this.handleIgnoreNicks(value);
          break;
        }
        case "rightpanel": {
          import_client_main.PS.prefs.set("rightpanelbattles", value);
          break;
        }
        case "disallowspectators": {
          import_client_main.PS.prefs.set("disallowspectators", value);
          import_client_main.PS.mainmenu.disallowSpectators = value;
          break;
        }
      }
    };
  }
  static {
    this.id = "battleoptions";
  }
  static {
    this.routes = ["battleoptions"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  getBattleRoom() {
    const battleRoom = this.props.room.getParent();
    return battleRoom?.battle ? battleRoom : null;
  }
  render() {
    const room = this.props.room;
    const battleRoom = this.getBattleRoom();
    const isPlayer = !!battleRoom?.battle.myPokemon;
    const canOfferTie = battleRoom && (battleRoom.battle.turn >= 100 && isPlayer || import_client_main.PS.user.group === "~");
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 380 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, battleRoom && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("strong", null, "In this battle")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        checked: battleRoom.battle.hardcoreMode,
        type: "checkbox",
        onChange: this.handleHardcoreMode
      }
    ), " Hardcore mode (hide info not shown in-game)")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        checked: battleRoom.battle.ignoreSpects,
        type: "checkbox",
        onChange: this.handleIgnoreSpectators
      }
    ), " Ignore spectators")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        checked: battleRoom.battle.ignoreOpponent,
        type: "checkbox",
        onChange: this.handleIgnoreOpponent
      }
    ), " Ignore opponent")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        checked: battleRoom.battle?.ignoreNicks,
        type: "checkbox",
        onChange: this.handleIgnoreNicks
      }
    ), " Ignore nicknames"))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("strong", null, "All battles")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "disallowspectators",
        checked: import_client_main.PS.prefs.disallowspectators || false,
        type: "checkbox",
        onChange: this.handleAllSettings
      }
    ), " ", /* @__PURE__ */ Chat.h("abbr", { title: "You can still invite spectators by giving them the URL or using the /invite command" }, "Invite only (hide from Battles list)"))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "ignorenicks",
        checked: import_client_main.PS.prefs.ignorenicks || false,
        type: "checkbox",
        onChange: this.handleAllSettings
      }
    ), " Ignore Pok\xE9mon nicknames")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "ignorespects",
        checked: import_client_main.PS.prefs.ignorespects || false,
        type: "checkbox",
        onChange: this.handleAllSettings
      }
    ), " Ignore spectators")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "ignoreopp",
        checked: import_client_main.PS.prefs.ignoreopp || false,
        type: "checkbox",
        onChange: this.handleAllSettings
      }
    ), " Ignore opponent")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "autotimer",
        checked: import_client_main.PS.prefs.autotimer || false,
        type: "checkbox",
        onChange: this.handleAllSettings
      }
    ), " Automatically start timer")), !import_client_main.PS.prefs.onepanel && document.body.offsetWidth >= 800 && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "rightpanel",
        checked: import_client_main.PS.prefs.rightpanelbattles || false,
        type: "checkbox",
        onChange: this.handleAllSettings
      }
    ), " Open new battles in the right-side panel")), /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { "data-cmd": "/close", class: "button" }, "Done"), " ", battleRoom && /* @__PURE__ */ Chat.h("button", { "data-cmd": "/closeand /inopener /offertie", class: "button", disabled: !canOfferTie }, "Offer Tie"))));
  }
}
class PopupRoom extends import_client_main.PSRoom {
  constructor() {
    super(...arguments);
    this.returnValue = this.args?.cancelValue;
  }
  destroy() {
    this.args?.callback?.(this.returnValue);
    super.destroy();
  }
}
class PopupPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.handleSubmit = (ev) => {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const room = this.props.room;
      room.returnValue = room.args?.okValue;
      const textbox = this.base.querySelector("input[name=value]");
      if (textbox) {
        room.returnValue = textbox.value;
      }
      this.close();
    };
  }
  static {
    this.id = "popup";
  }
  static {
    this.routes = ["popup-*"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  static {
    this.Model = PopupRoom;
  }
  componentDidMount() {
    super.componentDidMount();
    const textbox = this.base.querySelector("input[name=value]");
    if (!textbox) return;
    textbox.value = this.props.room.args?.value || "";
  }
  parseMessage(message) {
    if (message.startsWith("|html|")) {
      return import_battle_log.BattleLog.sanitizeHTML(message.slice(6));
    }
    return import_battle_log.BattleLog.parseMessage(message);
  }
  render() {
    const room = this.props.room;
    const okButton = room.args?.okButton || "OK";
    const cancelButton = room.args?.cancelButton;
    const otherButtons = room.args?.otherButtons;
    const value = room.args?.value;
    const type = room.args?.type || (typeof value === "string" ? "text" : null);
    const message = room.args?.message;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: room.args?.width || 480 }, /* @__PURE__ */ Chat.h("form", { class: "pad", onSubmit: this.handleSubmit }, message && /* @__PURE__ */ Chat.h(
      "p",
      {
        style: "white-space:pre-wrap;word-wrap:break-word",
        dangerouslySetInnerHTML: { __html: this.parseMessage(message || "") }
      }
    ), !!type && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("input", { name: "value", type, class: "textbox autofocus", style: "width:100%;box-sizing:border-box" })), /* @__PURE__ */ Chat.h("p", { class: "buttonbar" }, /* @__PURE__ */ Chat.h("button", { class: `button${!type ? " autofocus" : ""}`, type: "submit", style: "min-width:50px" }, /* @__PURE__ */ Chat.h("strong", null, okButton)), " ", otherButtons, " ", !!cancelButton && /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/close", type: "button" }, cancelButton))));
  }
}
class RoomTabListPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.startingLayout = import_client_main.PS.prefs.onepanel;
    this.handleLayoutChange = (ev) => {
      const checkbox = ev.currentTarget;
      import_client_main.PS.prefs.onepanel = checkbox.checked ? "vertical" : this.startingLayout;
      import_client_main.PS.update();
    };
  }
  static {
    this.id = "roomtablist";
  }
  static {
    this.routes = ["roomtablist"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  render() {
    const verticalTabs = import_client_main.PS.prefs.onepanel === "vertical";
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room: this.props.room }, /* @__PURE__ */ Chat.h("div", { class: "tablist" }, /* @__PURE__ */ Chat.h("ul", null, import_client_main.PS.leftRoomList.map((roomid) => import_panel_topbar.PSHeader.renderRoomTab(roomid, true))), /* @__PURE__ */ Chat.h("ul", null, import_client_main.PS.rightRoomList.map((roomid) => import_panel_topbar.PSHeader.renderRoomTab(roomid, true))), /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("label", { class: "checkbox" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "checkbox",
        checked: verticalTabs,
        onChange: this.handleLayoutChange
      }
    ), " Try vertical tabs"))));
  }
}
class BattleTimerPanel extends import_panels.PSRoomPanel {
  static {
    this.id = "battletimer";
  }
  static {
    this.routes = ["battletimer"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  render() {
    const room = this.props.room.getParent();
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room: this.props.room }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, room.battle.kickingInactive ? /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/closeand /inopener /timer stop" }, "Stop Timer") : /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/closeand /inopener /timer start" }, "Start Timer")));
  }
}
import_client_main.PS.addRoomType(
  UserPanel,
  UserOptionsPanel,
  UserListPanel,
  VolumePanel,
  OptionsPanel,
  LoginPanel,
  AvatarsPanel,
  ChangePasswordPanel,
  RegisterPanel,
  BattleForfeitPanel,
  ReplacePlayerPanel,
  BackgroundListPanel,
  LeaveRoomPanel,
  ChatFormattingPanel,
  PopupPanel,
  RoomTabListPanel,
  BattleOptionsPanel,
  BattleTimerPanel
);
//# sourceMappingURL=panel-popups.js.map
