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
var panel_battle_exports = {};
__export(panel_battle_exports, {
  BattleRoom: () => BattleRoom,
  BattlesRoom: () => BattlesRoom
});
module.exports = __toCommonJS(panel_battle_exports);
var import_preact = __toESM(require("../js/lib/preact"));
var import_client_main = require("./client-main");
var import_panels = require("./panels");
var import_panel_chat = require("./panel-chat");
var import_panel_mainmenu = require("./panel-mainmenu");
var import_battle = require("./battle");
var import_battle_animations = require("./battle-animations");
var import_battle_dex = require("./battle-dex");
var import_battle_choices = require("./battle-choices");
var import_battle_tooltips = require("./battle-tooltips");
var import_client_connection = require("./client-connection");
/**
 * Battle panel
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
class BattlesRoom extends import_client_main.PSRoom {
  constructor(options) {
    super(options);
    this.classType = "battles";
    /** null means still loading */
    this.format = "";
    this.battles = null;
    this.refresh();
    if (import_client_main.PS.prefs.bwgfx) {
      import_battle_dex.Dex.loadSpriteData("bw");
    }
  }
  setFormat(format) {
    if (format === this.format) return this.refresh();
    this.battles = null;
    this.format = format;
    this.update(null);
    this.refresh();
  }
  refresh() {
    import_client_main.PS.send(`/cmd roomlist ${(0, import_battle_dex.toID)(this.format)}`);
  }
}
class BattlesPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.refresh = () => {
      this.props.room.refresh();
    };
    this.changeFormat = (e) => {
      const value = e.target.value;
      this.props.room.setFormat(value);
    };
  }
  static {
    this.id = "battles";
  }
  static {
    this.routes = ["battles"];
  }
  static {
    this.Model = BattlesRoom;
  }
  static {
    this.location = "right";
  }
  static {
    this.icon = /* @__PURE__ */ Chat.h("i", { class: "fa fa-caret-square-o-right", "aria-hidden": true });
  }
  static {
    this.title = "Battles";
  }
  renderBattleLink(battle) {
    const format = battle.id.split("-")[1];
    const minEloMessage = typeof battle.minElo === "number" ? `rated ${battle.minElo}` : battle.minElo;
    return /* @__PURE__ */ Chat.h("div", { key: battle.id }, /* @__PURE__ */ Chat.h("a", { href: `/${battle.id}`, class: "blocklink" }, minEloMessage && /* @__PURE__ */ Chat.h("small", { style: "float:right" }, "(", minEloMessage, ")"), /* @__PURE__ */ Chat.h("small", null, "[", format, "]"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("em", { class: "p1" }, battle.p1), " ", /* @__PURE__ */ Chat.h("small", { class: "vs" }, "vs."), " ", /* @__PURE__ */ Chat.h("em", { class: "p2" }, battle.p2)));
  }
  render() {
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, scrollable: true }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("button", { class: "button", style: "float:right;font-size:10pt;margin-top:3px", name: "closeRoom" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-times", "aria-hidden": true }), " Close"), /* @__PURE__ */ Chat.h("div", { class: "roomlist" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button", name: "refresh", onClick: this.refresh }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-refresh", "aria-hidden": true }), " Refresh"), " ", /* @__PURE__ */ Chat.h(
      "span",
      {
        style: import_battle_dex.Dex.getPokemonIcon("meloetta-pirouette") + ";display:inline-block;vertical-align:middle",
        class: "picon",
        title: "Meloetta is PS's mascot! The Pirouette forme is Fighting-type, and represents our battles."
      }
    )), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Format:"), /* @__PURE__ */ Chat.h(import_panel_mainmenu.FormatDropdown, { onChange: this.changeFormat, placeholder: "(All formats)" })), /* @__PURE__ */ Chat.h("div", { class: "list" }, !room.battles ? /* @__PURE__ */ Chat.h("p", null, "Loading...") : !room.battles.length ? /* @__PURE__ */ Chat.h("p", null, "No battles are going on") : room.battles.map((battle) => this.renderBattleLink(battle))))));
  }
}
class BattleRoom extends import_panel_chat.ChatRoom {
  constructor() {
    super(...arguments);
    this.classType = "battle";
    this.battle = null;
    /** null if spectator, otherwise current player's info */
    this.side = null;
    this.request = null;
    this.choices = null;
    this.autoTimerActivated = null;
  }
  loadReplay() {
    const replayid = this.id.slice(7);
    (0, import_client_connection.Net)(`https://replay.pokemonshowdown.com/${replayid}.json`).get().catch().then((data) => {
      try {
        const replay = JSON.parse(data);
        this.title = `[${replay.format}] ${replay.players.join(" vs. ")}`;
        this.battle.stepQueue = replay.log.split("\n");
        this.battle.atQueueEnd = false;
        this.battle.pause();
        this.battle.seekTurn(0);
        this.connected = "client-only";
        this.update(null);
      } catch {
        this.receiveLine(["error", "Battle not found"]);
      }
    });
  }
}
class BattleDiv extends import_preact.default.Component {
  shouldComponentUpdate() {
    return false;
  }
  componentDidMount() {
    const room = this.props.room;
    if (room.battle) {
      this.base.replaceChild(room.battle.scene.$frame[0], this.base.firstChild);
    }
  }
  render() {
    return /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("div", { class: "battle" }));
  }
}
class TimerButton extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.timerInterval = null;
  }
  componentWillUnmount() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
  secondsToTime(seconds) {
    if (seconds === true) return "-:--";
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }
  render() {
    let time = "Timer";
    const room = this.props.room;
    if (!this.timerInterval && room.battle.kickingInactive) {
      this.timerInterval = setInterval(() => {
        if (typeof room.battle.kickingInactive === "number" && room.battle.kickingInactive > 1) {
          room.battle.kickingInactive--;
          if (room.battle.graceTimeLeft) room.battle.graceTimeLeft--;
          else if (room.battle.totalTimeLeft) room.battle.totalTimeLeft--;
        }
        this.forceUpdate();
      }, 1e3);
    } else if (this.timerInterval && !room.battle.kickingInactive) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    let timerTicking = room.battle.kickingInactive && room.request && room.request.requestType !== "wait" && (room.choices && !room.choices.isDone()) ? " timerbutton-on" : "";
    if (room.battle.kickingInactive) {
      const secondsLeft = room.battle.kickingInactive;
      time = this.secondsToTime(secondsLeft);
      if (secondsLeft !== true) {
        if (secondsLeft <= 10 && timerTicking) {
          timerTicking = " timerbutton-critical";
        }
        if (room.battle.totalTimeLeft) {
          const totalTime = this.secondsToTime(room.battle.totalTimeLeft);
          time += ` |  ${totalTime} total`;
        }
      }
    }
    return /* @__PURE__ */ Chat.h(
      "button",
      {
        style: { position: "absolute", right: "10px" },
        "data-href": "battletimer",
        class: `button${timerTicking}`,
        role: "timer"
      },
      /* @__PURE__ */ Chat.h("i", { class: "fa fa-hourglass-start", "aria-hidden": true }),
      " ",
      time
    );
  }
}
;
class BattlePanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    /** last displayed team. will not show the most recent request until the last one is gone. */
    this.team = null;
    this.send = (text, elem) => {
      this.props.room.send(text, elem);
    };
    this.focusIfNoSelection = () => {
      if (window.getSelection?.()?.type === "Range") return;
      this.focus();
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
    this.toggleBoostedMove = (e) => {
      const checkbox = e.currentTarget;
      const choices = this.props.room.choices;
      if (!choices) return;
      switch (checkbox.name) {
        case "mega":
          choices.current.mega = checkbox.checked;
          break;
        case "megax":
          choices.current.megax = checkbox.checked;
          choices.current.megay = false;
          break;
        case "megay":
          choices.current.megay = checkbox.checked;
          choices.current.megax = false;
          break;
        case "ultra":
          choices.current.ultra = checkbox.checked;
          break;
        case "z":
          choices.current.z = checkbox.checked;
          break;
        case "max":
          choices.current.max = checkbox.checked;
          break;
        case "tera":
          choices.current.tera = checkbox.checked;
          break;
      }
      this.props.room.update(null);
    };
    this.battleHeight = 360;
    this.handleDownloadReplay = (e) => {
      let room = this.props.room;
      const target = e.currentTarget;
      let filename = (room.battle.tier || "Battle").replace(/[^A-Za-z0-9]/g, "");
      let date = /* @__PURE__ */ new Date();
      filename += `-${date.getFullYear()}`;
      filename += `-${date.getMonth() >= 9 ? "" : "0"}${date.getMonth() + 1}`;
      filename += `-${date.getDate() >= 10 ? "" : "0"}${date.getDate()}`;
      filename += "-" + (0, import_battle_dex.toID)(room.battle.p1.name);
      filename += "-" + (0, import_battle_dex.toID)(room.battle.p2.name);
      target.href = window.BattleLog.createReplayFileHref(room);
      target.download = filename + ".html";
      e.stopPropagation();
    };
  }
  static {
    this.id = "battle";
  }
  static {
    this.routes = ["battle-*"];
  }
  static {
    this.Model = BattleRoom;
  }
  componentDidMount() {
    const room = this.props.room;
    const $elem = $(this.base);
    const battle = room.battle ||= new import_battle.Battle({
      id: room.id,
      $frame: $elem.find(".battle"),
      $logFrame: $elem.find(".battle-log"),
      log: room.backlog?.map((args) => "|" + args.join("|"))
    });
    const scene = battle.scene;
    room.backlog = null;
    room.log ||= scene.log;
    room.log.getHighlight = room.handleHighlight;
    scene.tooltips.listen($elem.find(".battle-controls-container"));
    scene.tooltips.listen(scene.log.elem);
    super.componentDidMount();
    battle.seekTurn(Infinity);
    battle.subscribe(() => this.forceUpdate());
  }
  updateLayout() {
    if (!this.base) return;
    const room = this.props.room;
    const width = this.base.offsetWidth;
    if (width && width < 640) {
      const scale = width / 640;
      room.battle?.scene.$frame.css("transform", `scale(${scale})`);
      this.battleHeight = Math.round(360 * scale);
    } else {
      room.battle?.scene.$frame.css("transform", "none");
      this.battleHeight = 360;
    }
  }
  receiveLine(args) {
    const room = this.props.room;
    switch (args[0]) {
      case "initdone":
        room.battle.seekTurn(Infinity);
        return;
      case "request":
        this.receiveRequest(args[1] ? JSON.parse(args[1]) : null);
        return;
      case "win":
      case "tie":
        this.receiveRequest(null);
        break;
      case "c":
      case "c:":
      case "chat":
      case "chatmsg":
      case "inactive":
        room.battle.instantAdd("|" + args.join("|"));
        return;
      case "error":
        if (args[1].startsWith("[Invalid choice]") && room.request) {
          room.choices = new import_battle_choices.BattleChoiceBuilder(room.request);
          room.update(null);
        }
        break;
    }
    room.battle.add("|" + args.join("|"));
    if (import_client_main.PS.prefs.noanim) this.props.room.battle.seekTurn(Infinity);
  }
  receiveRequest(request) {
    const room = this.props.room;
    if (!request) {
      room.request = null;
      room.choices = null;
      return;
    }
    if (import_client_main.PS.prefs.autotimer && !room.battle.kickingInactive && !room.autoTimerActivated) {
      this.send("/timer on");
      room.autoTimerActivated = true;
    }
    import_battle_choices.BattleChoiceBuilder.fixRequest(request, room.battle);
    if (request.side) {
      room.battle.myPokemon = request.side.pokemon;
      room.battle.setViewpoint(request.side.id);
      room.side = request.side;
    }
    room.request = request;
    room.choices = new import_battle_choices.BattleChoiceBuilder(request);
    this.notifyRequest();
    room.update(null);
  }
  notifyRequest() {
    const room = this.props.room;
    let oName = room.battle.farSide.name;
    if (oName) oName = " against " + oName;
    switch (room.request?.requestType) {
      case "move":
        room.notify({ title: "Your move!", body: "Move in your battle" + oName });
        break;
      case "switch":
        room.notify({ title: "Your switch!", body: "Switch in your battle" + oName });
        break;
      case "team":
        room.notify({ title: "Team preview!", body: "Choose your team order in your battle" + oName });
        break;
    }
  }
  renderControls() {
    const room = this.props.room;
    if (!room.battle) return null;
    if (room.battle.ended) return this.renderAfterBattleControls();
    if (room.side && room.request) {
      return this.renderPlayerControls(room.request);
    }
    const atStart = !room.battle.started;
    const atEnd = room.battle.atQueueEnd;
    return /* @__PURE__ */ Chat.h("div", { class: "controls" }, /* @__PURE__ */ Chat.h("p", null, atEnd ? /* @__PURE__ */ Chat.h("button", { class: "button disabled", "aria-disabled": true, "data-cmd": "/play", style: "min-width:4.5em" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-play", "aria-hidden": true }), /* @__PURE__ */ Chat.h("br", null), "Play") : room.battle.paused ? /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/play", style: "min-width:4.5em" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-play", "aria-hidden": true }), /* @__PURE__ */ Chat.h("br", null), "Play") : /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/pause", style: "min-width:4.5em" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-pause", "aria-hidden": true }), /* @__PURE__ */ Chat.h("br", null), "Pause"), " ", /* @__PURE__ */ Chat.h("button", { class: "button button-first" + (atStart ? " disabled" : ""), "data-cmd": "/ffto 0", style: "margin-right:2px" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-undo", "aria-hidden": true }), /* @__PURE__ */ Chat.h("br", null), "First turn"), /* @__PURE__ */ Chat.h("button", { class: "button button-first" + (atStart ? " disabled" : ""), "data-cmd": "/ffto -1" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-step-backward", "aria-hidden": true }), /* @__PURE__ */ Chat.h("br", null), "Prev turn"), /* @__PURE__ */ Chat.h("button", { class: "button button-last" + (atEnd ? " disabled" : ""), "data-cmd": "/ffto +1", style: "margin-right:2px" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-step-forward", "aria-hidden": true }), /* @__PURE__ */ Chat.h("br", null), "Skip turn"), /* @__PURE__ */ Chat.h("button", { class: "button button-last" + (atEnd ? " disabled" : ""), "data-cmd": "/ffto end" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-fast-forward", "aria-hidden": true }), /* @__PURE__ */ Chat.h("br", null), "Skip to end")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/switchsides" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-random", "aria-hidden": true }), " Switch viewpoint")));
  }
  renderMoveButton(props) {
    if (!props) {
      return /* @__PURE__ */ Chat.h("button", { class: "movebutton", disabled: true }, "\xA0");
    }
    const pp = props.moveData.maxpp ? `${props.moveData.pp}/${props.moveData.maxpp}` : "\u2014";
    return /* @__PURE__ */ Chat.h(
      "button",
      {
        "data-cmd": props.cmd,
        "data-tooltip": props.tooltip,
        class: `movebutton has-tooltip ${props.moveData.disabled ? "disabled" : `type-${props.type}`}`,
        "aria-disabled": props.moveData.disabled
      },
      props.name,
      /* @__PURE__ */ Chat.h("br", null),
      /* @__PURE__ */ Chat.h("small", { class: "type" }, props.type),
      " ",
      /* @__PURE__ */ Chat.h("small", { class: "pp" }, pp),
      "\xA0"
    );
  }
  renderPokemonButton(props) {
    const pokemon = props.pokemon;
    if (!pokemon) {
      return /* @__PURE__ */ Chat.h(
        "button",
        {
          "data-cmd": props.cmd,
          class: `${props.disabled ? "disabled " : ""}has-tooltip`,
          "aria-disabled": props.disabled,
          style: props.disabled === "fade" ? "opacity: 0.5" : "",
          "data-tooltip": props.tooltip
        },
        "(empty slot)"
      );
    }
    let hpColorClass;
    switch (import_battle_animations.BattleScene.getHPColor(pokemon)) {
      case "y":
        hpColorClass = "hpbar hpbar-yellow";
        break;
      case "r":
        hpColorClass = "hpbar hpbar-red";
        break;
      default:
        hpColorClass = "hpbar";
        break;
    }
    return /* @__PURE__ */ Chat.h(
      "button",
      {
        "data-cmd": props.cmd,
        class: `${props.disabled ? "disabled " : ""}has-tooltip`,
        "aria-disabled": props.disabled,
        style: props.disabled === "fade" ? "opacity: 0.5" : "",
        "data-tooltip": props.tooltip
      },
      (0, import_panels.PSIcon)({ pokemon }),
      pokemon.name,
      !props.noHPBar && !pokemon.fainted && /* @__PURE__ */ Chat.h("span", { class: hpColorClass }, /* @__PURE__ */ Chat.h("span", { style: { width: Math.round(pokemon.hp * 92 / pokemon.maxhp) || 1 } })),
      !props.noHPBar && pokemon.status && /* @__PURE__ */ Chat.h("span", { class: `status ${pokemon.status}` })
    );
  }
  renderMoveMenu(choices) {
    const moveRequest = choices.currentMoveRequest();
    const canDynamax = moveRequest.canDynamax && !choices.alreadyMax;
    const canMegaEvo = moveRequest.canMegaEvo && !choices.alreadyMega;
    const canMegaEvoX = moveRequest.canMegaEvoX && !choices.alreadyMega;
    const canMegaEvoY = moveRequest.canMegaEvoY && !choices.alreadyMega;
    const canZMove = moveRequest.zMoves && !choices.alreadyZ;
    const canUltraBurst = moveRequest.canUltraBurst;
    const canTerastallize = moveRequest.canTerastallize;
    const maybeDisabled = moveRequest.maybeDisabled;
    const maybeLocked = moveRequest.maybeLocked;
    return /* @__PURE__ */ Chat.h("div", { class: "movemenu" }, maybeDisabled && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("em", { class: "movewarning" }, "You ", /* @__PURE__ */ Chat.h("strong", null, "might"), " have some moves disabled, so you won't be able to cancel an attack!")), maybeLocked && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("em", { class: "movewarning" }, "You ", /* @__PURE__ */ Chat.h("strong", null, "might"), " be locked into a move. ", /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/choose testfight" }, "Try Fight button"), " ", "(prevents switching if you're locked)")), this.renderMoveControls(moveRequest, choices), /* @__PURE__ */ Chat.h("div", { class: "megaevo-box" }, canDynamax && /* @__PURE__ */ Chat.h("label", { class: `megaevo${choices.current.max ? " cur" : ""}` }, /* @__PURE__ */ Chat.h("input", { type: "checkbox", name: "max", checked: choices.current.max, onChange: this.toggleBoostedMove }), " ", moveRequest.gigantamax ? "Gigantamax" : "Dynamax"), canMegaEvo && /* @__PURE__ */ Chat.h("label", { class: `megaevo${choices.current.mega ? " cur" : ""}` }, /* @__PURE__ */ Chat.h("input", { type: "checkbox", name: "mega", checked: choices.current.mega, onChange: this.toggleBoostedMove }), " ", "Mega Evolution"), canMegaEvoX && /* @__PURE__ */ Chat.h("label", { class: `megaevo${choices.current.mega ? " cur" : ""}` }, /* @__PURE__ */ Chat.h("input", { type: "checkbox", name: "megax", checked: choices.current.megax, onChange: this.toggleBoostedMove }), " ", "Mega Evolution X"), canMegaEvoY && /* @__PURE__ */ Chat.h("label", { class: `megaevo${choices.current.mega ? " cur" : ""}` }, /* @__PURE__ */ Chat.h("input", { type: "checkbox", name: "megay", checked: choices.current.megay, onChange: this.toggleBoostedMove }), " ", "Mega Evolution Y"), canUltraBurst && /* @__PURE__ */ Chat.h("label", { class: `megaevo${choices.current.ultra ? " cur" : ""}` }, /* @__PURE__ */ Chat.h("input", { type: "checkbox", name: "ultra", checked: choices.current.ultra, onChange: this.toggleBoostedMove }), " ", "Ultra Burst"), canZMove && /* @__PURE__ */ Chat.h("label", { class: `megaevo${choices.current.z ? " cur" : ""}` }, /* @__PURE__ */ Chat.h("input", { type: "checkbox", name: "z", checked: choices.current.z, onChange: this.toggleBoostedMove }), " ", "Z-Power"), canTerastallize && /* @__PURE__ */ Chat.h("label", { class: `megaevo${choices.current.tera ? " cur" : ""}` }, /* @__PURE__ */ Chat.h("input", { type: "checkbox", name: "tera", checked: choices.current.tera, onChange: this.toggleBoostedMove }), " ", "Terastallize", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("span", { dangerouslySetInnerHTML: { __html: import_battle_dex.Dex.getTypeIcon(canTerastallize) } }))));
  }
  renderMoveControls(active, choices) {
    const battle = this.props.room.battle;
    const dex = battle.dex;
    const pokemonIndex = choices.index();
    const activeIndex = battle.mySide.n > 1 ? pokemonIndex + battle.pokemonControlled : pokemonIndex;
    const serverPokemon = choices.request.side.pokemon[pokemonIndex];
    const valueTracker = new import_battle_tooltips.ModifiableValue(battle, battle.nearSide.active[activeIndex], serverPokemon);
    const tooltips = battle.scene.tooltips;
    if (choices.current.max || active.maxMoves && !active.canDynamax) {
      if (!active.maxMoves) {
        return /* @__PURE__ */ Chat.h("div", { class: "message-error" }, "Maxed with no max moves");
      }
      const gmax = active.gigantamax && dex.moves.get(active.gigantamax);
      return active.moves.map((moveData, i) => {
        const move = dex.moves.get(moveData.name);
        const moveType = tooltips.getMoveType(move, valueTracker, gmax || true)[0];
        let maxMoveData = active.maxMoves[i];
        if (maxMoveData.name !== "Max Guard") {
          maxMoveData = tooltips.getMaxMoveFromType(moveType, gmax);
        }
        const gmaxTooltip = maxMoveData.id.startsWith("gmax") ? `|${maxMoveData.id}` : ``;
        const tooltip = `maxmove|${moveData.name}|${pokemonIndex}${gmaxTooltip}`;
        return this.renderMoveButton({
          name: maxMoveData.name,
          cmd: `/move ${i + 1} max`,
          type: moveType,
          tooltip,
          moveData
        });
      });
    }
    if (choices.current.z) {
      if (!active.zMoves) {
        return /* @__PURE__ */ Chat.h("div", { class: "message-error" }, "No Z moves");
      }
      return active.moves.map((moveData, i) => {
        const zMoveData = active.zMoves[i];
        if (!zMoveData) {
          return this.renderMoveButton(null);
        }
        const specialMove = dex.moves.get(zMoveData.name);
        const move = specialMove.exists ? specialMove : dex.moves.get(moveData.name);
        const moveType = tooltips.getMoveType(move, valueTracker)[0];
        const tooltip = `zmove|${moveData.name}|${pokemonIndex}`;
        return this.renderMoveButton({
          name: zMoveData.name,
          cmd: `/move ${i + 1} zmove`,
          type: moveType,
          tooltip,
          moveData: { pp: 1, maxpp: 1 }
        });
      });
    }
    const special = choices.moveSpecial(choices.current);
    return active.moves.map((moveData, i) => {
      const move = dex.moves.get(moveData.name);
      const moveType = tooltips.getMoveType(move, valueTracker)[0];
      const tooltip = `move|${moveData.name}|${pokemonIndex}`;
      return this.renderMoveButton({
        name: move.name,
        cmd: `/move ${i + 1}${special}`,
        type: moveType,
        tooltip,
        moveData
      });
    });
  }
  renderMoveTargetControls(request, choices) {
    const battle = this.props.room.battle;
    let moveTarget = choices.currentMove()?.target;
    if ((moveTarget === "adjacentAlly" || moveTarget === "adjacentFoe") && battle.gameType === "freeforall") {
      moveTarget = "normal";
    }
    const moveChoice = choices.stringChoice(choices.current);
    const userSlot = choices.index() + Math.floor(battle.mySide.n / 2) * battle.pokemonControlled;
    const userSlotCross = battle.farSide.active.length - 1 - userSlot;
    return [
      battle.farSide.active.map((pokemon, i) => {
        let disabled = false;
        if (moveTarget === "adjacentAlly" || moveTarget === "adjacentAllyOrSelf") {
          disabled = true;
        } else if (moveTarget === "normal" || moveTarget === "adjacentFoe") {
          if (Math.abs(userSlotCross - i) > 1) disabled = true;
        }
        if (pokemon?.fainted) pokemon = null;
        return this.renderPokemonButton({
          pokemon,
          cmd: disabled ? `` : `/${moveChoice} +${i + 1}`,
          disabled: disabled && "fade",
          tooltip: `activepokemon|1|${i}`
        });
      }).reverse(),
      /* @__PURE__ */ Chat.h("div", { style: "clear: left" }),
      battle.nearSide.active.map((pokemon, i) => {
        let disabled = false;
        if (moveTarget === "adjacentFoe") {
          disabled = true;
        } else if (moveTarget === "normal" || moveTarget === "adjacentAlly" || moveTarget === "adjacentAllyOrSelf") {
          if (Math.abs(userSlot - i) > 1) disabled = true;
        }
        if (moveTarget !== "adjacentAllyOrSelf" && userSlot === i) disabled = true;
        if (pokemon?.fainted) pokemon = null;
        return this.renderPokemonButton({
          pokemon,
          cmd: disabled ? `` : `/${moveChoice} -${i + 1}`,
          disabled: disabled && "fade",
          tooltip: `activepokemon|0|${i}`
        });
      })
    ];
  }
  renderSwitchMenu(request, choices, ignoreTrapping) {
    const numActive = choices.requestLength();
    const maybeTrapped = !ignoreTrapping && choices.currentMoveRequest()?.maybeTrapped;
    const trapped = !ignoreTrapping && !maybeTrapped && choices.currentMoveRequest()?.trapped;
    return /* @__PURE__ */ Chat.h("div", { class: "switchmenu" }, maybeTrapped && /* @__PURE__ */ Chat.h("em", { class: "movewarning" }, "You ", /* @__PURE__ */ Chat.h("strong", null, "might"), " be trapped, so you won't be able to cancel a switch!", /* @__PURE__ */ Chat.h("br", null)), trapped && /* @__PURE__ */ Chat.h("em", { class: "movewarning" }, "You're ", /* @__PURE__ */ Chat.h("strong", null, "trapped"), " and cannot switch!", /* @__PURE__ */ Chat.h("br", null)), request.side.pokemon.map((serverPokemon, i) => {
      const cantSwitch = trapped || i < numActive || choices.alreadySwitchingIn.includes(i + 1) || serverPokemon.fainted;
      return this.renderPokemonButton({
        pokemon: serverPokemon,
        cmd: `/switch ${i + 1}`,
        disabled: cantSwitch,
        tooltip: `switchpokemon|${i}`
      });
    }));
  }
  renderTeamPreviewChooser(request, choices) {
    return request.side.pokemon.map((serverPokemon, i) => {
      const cantSwitch = choices.alreadySwitchingIn.includes(i + 1);
      return this.renderPokemonButton({
        pokemon: serverPokemon,
        cmd: `/switch ${i + 1}`,
        disabled: cantSwitch && "fade",
        tooltip: `switchpokemon|${i}`
      });
    });
  }
  renderTeamList() {
    const team = this.team;
    if (!team) return;
    return /* @__PURE__ */ Chat.h("div", { class: "switchcontrols" }, /* @__PURE__ */ Chat.h("h3", { class: "switchselect" }, "Team"), /* @__PURE__ */ Chat.h("div", { class: "switchmenu" }, team.map((serverPokemon, i) => {
      return this.renderPokemonButton({
        pokemon: serverPokemon,
        cmd: "",
        disabled: true,
        tooltip: `switchpokemon|${i}`
      });
    })));
  }
  renderChosenTeam(request, choices) {
    return choices.alreadySwitchingIn.map((slot) => {
      const serverPokemon = request.side.pokemon[slot - 1];
      return this.renderPokemonButton({
        pokemon: serverPokemon,
        cmd: `/switch ${slot}`,
        disabled: true,
        tooltip: `switchpokemon|${slot - 1}`
      });
    });
  }
  renderOldChoices(request, choices) {
    if (!choices) return null;
    if (request.requestType !== "move" && request.requestType !== "switch" && request.requestType !== "team") return;
    if (choices.isEmpty()) return null;
    let buf = [
      /* @__PURE__ */ Chat.h("button", { "data-cmd": "/cancel", class: "button" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-chevron-left", "aria-hidden": true }), " Back"),
      " "
    ];
    if (choices.isDone() && choices.noCancel) {
      buf = ["Waiting for opponent...", /* @__PURE__ */ Chat.h("br", null)];
    } else if (choices.isDone() && choices.choices.length <= 1) {
      buf = [];
    }
    const battle = this.props.room.battle;
    for (let i = 0; i < choices.choices.length; i++) {
      const choiceString = choices.choices[i];
      if (choiceString === "testfight") {
        buf.push(`${request.side.pokemon[i].name} is locked into a move.`);
        return buf;
      }
      let choice;
      try {
        choice = choices.parseChoice(choiceString, i);
      } catch (err) {
        buf.push(/* @__PURE__ */ Chat.h("span", { class: "message-error" }, err.message));
      }
      if (!choice) continue;
      const pokemon = request.side.pokemon[i];
      const active = request.requestType === "move" ? request.active[i] : null;
      if (choice.choiceType === "move") {
        buf.push(`${pokemon.name} will `);
        if (choice.mega) buf.push(/* @__PURE__ */ Chat.h("strong", null, "Mega"), ` Evolve and `);
        if (choice.megax) buf.push(/* @__PURE__ */ Chat.h("strong", null, "Mega"), ` Evolve (X) and `);
        if (choice.megay) buf.push(/* @__PURE__ */ Chat.h("strong", null, "Mega"), ` Evolve (Y) and `);
        if (choice.ultra) buf.push(/* @__PURE__ */ Chat.h("strong", null, "Ultra"), ` Burst and `);
        if (choice.tera) buf.push(`Terastallize (`, /* @__PURE__ */ Chat.h("strong", null, active?.canTerastallize || "???"), `) and `);
        if (choice.max && active?.canDynamax) buf.push(active?.gigantamax ? `Gigantamax and ` : `Dynamax and `);
        buf.push(`use `, /* @__PURE__ */ Chat.h("strong", null, choices.currentMove(choice, i)?.name));
        if (choice.targetLoc > 0) {
          const target = battle.farSide.active[choice.targetLoc - 1];
          if (!target) {
            buf.push(` at slot ${choice.targetLoc}`);
          } else {
            buf.push(` at ${target.name}`);
          }
        } else if (choice.targetLoc < 0) {
          const target = battle.nearSide.active[-choice.targetLoc - 1];
          if (!target) {
            buf.push(` at ally slot ${choice.targetLoc}`);
          } else {
            buf.push(` at ally ${target.name}`);
          }
        }
      } else if (choice.choiceType === "switch") {
        const target = request.side.pokemon[choice.targetPokemon - 1];
        buf.push(`${pokemon.name} will switch to `, /* @__PURE__ */ Chat.h("strong", null, target.name));
      } else if (choice.choiceType === "shift") {
        buf.push(`${pokemon.name} will `, /* @__PURE__ */ Chat.h("strong", null, "shift"), ` to the center`);
      } else if (choice.choiceType === "team") {
        const target = request.side.pokemon[choice.targetPokemon - 1];
        buf.push(`You picked `, /* @__PURE__ */ Chat.h("strong", null, target.name));
      }
      buf.push(/* @__PURE__ */ Chat.h("br", null));
    }
    return buf;
  }
  renderPlayerWaitingControls() {
    return /* @__PURE__ */ Chat.h("div", { class: "controls" }, /* @__PURE__ */ Chat.h("div", { class: "whatdo" }, /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/ffto end" }, "Skip animation ", /* @__PURE__ */ Chat.h("i", { class: "fa fa-fast-forward", "aria-hidden": true }))), this.renderTeamList());
  }
  renderPlayerControls(request) {
    const room = this.props.room;
    const atEnd = room.battle.atQueueEnd;
    if (!atEnd) return this.renderPlayerWaitingControls();
    let choices = room.choices;
    if (!choices) return "Error: Missing BattleChoiceBuilder";
    if (choices.request !== request) {
      choices = new import_battle_choices.BattleChoiceBuilder(request);
      room.choices = choices;
    }
    if (choices.isDone()) {
      return /* @__PURE__ */ Chat.h("div", { class: "controls" }, /* @__PURE__ */ Chat.h("div", { class: "whatdo" }, this.renderOldChoices(request, choices)), /* @__PURE__ */ Chat.h("div", { class: "pad" }, choices.noCancel ? null : /* @__PURE__ */ Chat.h("button", { "data-cmd": "/cancel", class: "button" }, "Cancel")), this.renderTeamList());
    }
    if (request.side) {
      room.battle.myPokemon = request.side.pokemon;
      this.team = request.side.pokemon;
    }
    switch (request.requestType) {
      case "move": {
        const index = choices.index();
        const pokemon = request.side.pokemon[index];
        if (choices.current.move) {
          const moveName = choices.currentMove()?.name;
          return /* @__PURE__ */ Chat.h("div", { class: "controls" }, /* @__PURE__ */ Chat.h("div", { class: "whatdo" }, this.renderOldChoices(request, choices), pokemon.name, " should use ", /* @__PURE__ */ Chat.h("strong", null, moveName), " at where? "), /* @__PURE__ */ Chat.h("div", { class: "switchcontrols" }, /* @__PURE__ */ Chat.h("div", { class: "switchmenu" }, this.renderMoveTargetControls(request, choices))));
        }
        const canShift = room.battle.gameType === "triples" && index !== 1;
        return /* @__PURE__ */ Chat.h("div", { class: "controls" }, /* @__PURE__ */ Chat.h("div", { class: "whatdo" }, this.renderOldChoices(request, choices), "What will ", /* @__PURE__ */ Chat.h("strong", null, pokemon.name), " do?"), /* @__PURE__ */ Chat.h("div", { class: "movecontrols" }, /* @__PURE__ */ Chat.h("h3", { class: "moveselect" }, "Attack"), this.renderMoveMenu(choices)), /* @__PURE__ */ Chat.h("div", { class: "switchcontrols" }, canShift && [
          /* @__PURE__ */ Chat.h("h3", { class: "shiftselect" }, "Shift"),
          /* @__PURE__ */ Chat.h("button", { "data-cmd": "/shift" }, "Move to center")
        ], /* @__PURE__ */ Chat.h("h3", { class: "switchselect" }, "Switch"), this.renderSwitchMenu(request, choices)));
      }
      case "switch": {
        const pokemon = request.side.pokemon[choices.index()];
        return /* @__PURE__ */ Chat.h("div", { class: "controls" }, /* @__PURE__ */ Chat.h("div", { class: "whatdo" }, this.renderOldChoices(request, choices), "What will ", /* @__PURE__ */ Chat.h("strong", null, pokemon.name), " do?"), /* @__PURE__ */ Chat.h("div", { class: "switchcontrols" }, /* @__PURE__ */ Chat.h("h3", { class: "switchselect" }, "Switch"), this.renderSwitchMenu(request, choices, true)));
      }
      case "team": {
        return /* @__PURE__ */ Chat.h("div", { class: "controls" }, /* @__PURE__ */ Chat.h("div", { class: "whatdo" }, choices.alreadySwitchingIn.length > 0 ? [
          /* @__PURE__ */ Chat.h("button", { "data-cmd": "/cancel", class: "button" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-chevron-left", "aria-hidden": true }), " Back"),
          " What about the rest of your team? "
        ] : "How will you start the battle? "), /* @__PURE__ */ Chat.h("div", { class: "switchcontrols" }, /* @__PURE__ */ Chat.h("h3", { class: "switchselect" }, "Choose ", choices.alreadySwitchingIn.length <= 0 ? `lead` : `slot ${choices.alreadySwitchingIn.length + 1}`), /* @__PURE__ */ Chat.h("div", { class: "switchmenu" }, this.renderTeamPreviewChooser(request, choices), /* @__PURE__ */ Chat.h("div", { style: "clear:left" }))), /* @__PURE__ */ Chat.h("div", { class: "switchcontrols" }, choices.alreadySwitchingIn.length > 0 && /* @__PURE__ */ Chat.h("h3", { class: "switchselect" }, "Team so far"), /* @__PURE__ */ Chat.h("div", { class: "switchmenu" }, this.renderChosenTeam(request, choices))));
      }
    }
    return null;
  }
  renderAfterBattleControls() {
    const room = this.props.room;
    const isNotTiny = room.width > 700;
    return /* @__PURE__ */ Chat.h("div", { class: "controls" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("span", { style: "float: right" }, /* @__PURE__ */ Chat.h(
      "a",
      {
        onClick: this.handleDownloadReplay,
        href: `//${import_client_main.Config.routes.replays}/download`,
        class: "button replayDownloadButton"
      },
      /* @__PURE__ */ Chat.h("i", { class: "fa fa-download", "aria-hidden": true }),
      " Download replay"
    ), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/savereplay" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-upload", "aria-hidden": true }), " Upload and share replay")), /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/play", style: "min-width:4.5em" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-undo", "aria-hidden": true }), /* @__PURE__ */ Chat.h("br", null), "Replay"), " ", isNotTiny && /* @__PURE__ */ Chat.h("button", { class: "button button-first", "data-cmd": "/ffto 0", style: "margin-right:2px" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-undo", "aria-hidden": true }), /* @__PURE__ */ Chat.h("br", null), "First turn"), isNotTiny && /* @__PURE__ */ Chat.h("button", { class: "button button-first", "data-cmd": "/ffto -1" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-step-backward", "aria-hidden": true }), /* @__PURE__ */ Chat.h("br", null), "Prev turn")), room.side ? /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/close" }, /* @__PURE__ */ Chat.h("strong", null, "Main menu"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("small", null, "(closes this battle)")), " ", /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": `/closeand /challenge ${room.battle.farSide.id},${room.battle.tier}` }, /* @__PURE__ */ Chat.h("strong", null, "Rematch"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("small", null, "(closes this battle)"))) : /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button", "data-cmd": "/switchsides" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-random", "aria-hidden": true }), " Switch viewpoint")));
  }
  render() {
    const room = this.props.room;
    this.updateLayout();
    const id = `room-${room.id}`;
    const hardcoreStyle = room.battle?.hardcoreMode ? /* @__PURE__ */ Chat.h(
      "style",
      {
        dangerouslySetInnerHTML: { __html: `#${id} .battle .turn, #${id} .battle-history { display: none !important; }` }
      }
    ) : null;
    if (room.width < 700) {
      return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, focusClick: true, scrollable: "hidden" }, hardcoreStyle, /* @__PURE__ */ Chat.h(BattleDiv, { room }), /* @__PURE__ */ Chat.h(
        import_panel_chat.ChatLog,
        {
          class: "battle-log hasuserlist",
          room,
          top: this.battleHeight,
          noSubscription: true
        },
        /* @__PURE__ */ Chat.h("div", { class: "battle-controls", role: "complementary", "aria-label": "Battle Controls" }, this.renderControls())
      ), /* @__PURE__ */ Chat.h(import_panel_chat.ChatTextEntry, { room, onMessage: this.send, onKey: this.onKey, left: 0 }), /* @__PURE__ */ Chat.h(import_panel_chat.ChatUserList, { room, top: this.battleHeight, minimized: true }), /* @__PURE__ */ Chat.h(
        "button",
        {
          "data-href": "battleoptions",
          class: "button",
          style: { position: "absolute", right: "75px", top: this.battleHeight }
        },
        "Battle options"
      ), room.battle && !room.battle.ended && room.request && room.battle.mySide.id === import_client_main.PS.user.userid && /* @__PURE__ */ Chat.h(TimerButton, { room }), /* @__PURE__ */ Chat.h("div", { class: "battle-controls-container" }));
    }
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, focusClick: true, scrollable: "hidden" }, hardcoreStyle, /* @__PURE__ */ Chat.h(BattleDiv, { room }), /* @__PURE__ */ Chat.h(
      import_panel_chat.ChatLog,
      {
        class: "battle-log hasuserlist",
        room,
        left: 640,
        noSubscription: true
      }
    ), /* @__PURE__ */ Chat.h(import_panel_chat.ChatTextEntry, { room, onMessage: this.send, onKey: this.onKey, left: 640 }), /* @__PURE__ */ Chat.h(import_panel_chat.ChatUserList, { room, left: 640, minimized: true }), /* @__PURE__ */ Chat.h(
      "button",
      {
        "data-href": "battleoptions",
        class: "button",
        style: { position: "absolute", right: "15px" }
      },
      "Battle options"
    ), /* @__PURE__ */ Chat.h("div", { class: "battle-controls-container" }, /* @__PURE__ */ Chat.h("div", { class: "battle-controls", role: "complementary", "aria-label": "Battle Controls", style: "top: 370px;" }, room.battle && !room.battle.ended && room.request && room.battle.mySide.id === import_client_main.PS.user.userid && /* @__PURE__ */ Chat.h(TimerButton, { room }), this.renderControls())));
  }
}
import_client_main.PS.addRoomType(BattlePanel, BattlesPanel);
//# sourceMappingURL=panel-battle.js.map
