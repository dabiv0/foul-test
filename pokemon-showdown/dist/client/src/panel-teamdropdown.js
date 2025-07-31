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
var panel_teamdropdown_exports = {};
__export(panel_teamdropdown_exports, {
  PSTeambuilder: () => PSTeambuilder,
  TeamBox: () => TeamBox
});
module.exports = __toCommonJS(panel_teamdropdown_exports);
var import_client_main = require("./client-main");
var import_panels = require("./panels");
var import_battle_dex = require("./battle-dex");
var import_battle_dex_data = require("./battle-dex-data");
var import_battle_teams = require("./battle-teams");
/**
 * Team Selector Panel
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
class PSTeambuilder {
  static exportPackedTeam(team, newFormat) {
    const sets = import_battle_teams.Teams.unpack(team.packedTeam);
    const dex = import_battle_dex.Dex.forFormat(team.format);
    return import_battle_teams.Teams.export(sets, dex, newFormat);
  }
  static splitPrefix(buffer, delimiter, prefixOffset = 0) {
    const delimIndex = buffer.indexOf(delimiter);
    if (delimIndex < 0) return ["", buffer];
    return [buffer.slice(prefixOffset, delimIndex), buffer.slice(delimIndex + delimiter.length)];
  }
  static splitLast(buffer, delimiter) {
    const delimIndex = buffer.lastIndexOf(delimiter);
    if (delimIndex < 0) return [buffer, ""];
    return [buffer.slice(0, delimIndex), buffer.slice(delimIndex + delimiter.length)];
  }
  static parseExportedTeamLine(line, isFirstLine, set) {
    if (isFirstLine || line.startsWith("[")) {
      let item;
      [line, item] = line.split("@");
      line = line.trim();
      item = item?.trim();
      if (item) {
        set.item = item;
        if ((0, import_battle_dex.toID)(set.item) === "noitem") set.item = "";
      }
      if (line.endsWith(" (M)")) {
        set.gender = "M";
        line = line.slice(0, -4);
      }
      if (line.endsWith(" (F)")) {
        set.gender = "F";
        line = line.slice(0, -4);
      }
      if (line.startsWith("[") && line.endsWith("]")) {
        set.ability = line.slice(1, -1);
        if ((0, import_battle_dex.toID)(set.ability) === "selectability") {
          set.ability = "";
        }
      } else if (line) {
        const parenIndex = line.lastIndexOf(" (");
        if (line.endsWith(")") && parenIndex !== -1) {
          set.species = import_battle_dex.Dex.species.get(line.slice(parenIndex + 2, -1)).name;
          set.name = line.slice(0, parenIndex);
        } else {
          set.species = import_battle_dex.Dex.species.get(line).name;
          set.name = "";
        }
      }
    } else if (line.startsWith("Trait: ")) {
      set.ability = line.slice(7);
    } else if (line.startsWith("Ability: ")) {
      set.ability = line.slice(9);
    } else if (line.startsWith("Item: ")) {
      set.item = line.slice(6);
    } else if (line.startsWith("Nickname: ")) {
      set.name = line.slice(10);
    } else if (line.startsWith("Species: ")) {
      set.species = line.slice(9);
    } else if (line === "Shiny: Yes" || line === "Shiny") {
      set.shiny = true;
    } else if (line.startsWith("Level: ")) {
      set.level = +line.slice(7);
    } else if (line.startsWith("Happiness: ")) {
      set.happiness = +line.slice(11);
    } else if (line.startsWith("Pokeball: ")) {
      set.pokeball = line.slice(10);
    } else if (line.startsWith("Hidden Power: ")) {
      set.hpType = line.slice(14);
    } else if (line.startsWith("Dynamax Level: ")) {
      set.dynamaxLevel = +line.slice(15);
    } else if (line === "Gigantamax: Yes" || line === "Gigantamax") {
      set.gigantamax = true;
    } else if (line.startsWith("Tera Type: ")) {
      set.teraType = line.slice(11);
    } else if (line.startsWith("EVs: ")) {
      const evLines = line.slice(5).split("(")[0].split("/");
      set.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      let plus = "", minus = "";
      for (let evLine of evLines) {
        evLine = evLine.trim();
        const spaceIndex = evLine.indexOf(" ");
        if (spaceIndex === -1) continue;
        const statid = import_battle_dex_data.BattleStatIDs[evLine.slice(spaceIndex + 1)];
        if (!statid) continue;
        if (evLine.charAt(spaceIndex - 1) === "+") plus = statid;
        if (evLine.charAt(spaceIndex - 1) === "-") minus = statid;
        set.evs[statid] = parseInt(evLine.slice(0, spaceIndex), 10) || 0;
      }
      const nature = this.getNature(plus, minus);
      if (nature !== "Serious") {
        set.nature = nature;
      }
    } else if (line.startsWith("IVs: ")) {
      const ivLines = line.slice(5).split(" / ");
      set.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
      for (let ivLine of ivLines) {
        ivLine = ivLine.trim();
        const spaceIndex = ivLine.indexOf(" ");
        if (spaceIndex === -1) continue;
        const statid = import_battle_dex_data.BattleStatIDs[ivLine.slice(spaceIndex + 1)];
        if (!statid) continue;
        let statval = parseInt(ivLine.slice(0, spaceIndex), 10);
        if (isNaN(statval)) statval = 31;
        set.ivs[statid] = statval;
      }
    } else if (/^[A-Za-z]+ (N|n)ature/.exec(line)) {
      let natureIndex = line.indexOf(" Nature");
      if (natureIndex === -1) natureIndex = line.indexOf(" nature");
      if (natureIndex === -1) return;
      line = line.slice(0, natureIndex);
      if (line !== "undefined") set.nature = line;
    } else if (line.startsWith("-") || line.startsWith("~") || line.startsWith("Move:")) {
      if (line.startsWith("Move:")) line = line.slice(4);
      line = line.slice(line.charAt(1) === " " ? 2 : 1);
      if (line.startsWith("Hidden Power [")) {
        const hpType = line.slice(14, -1);
        line = "Hidden Power " + hpType;
        set.hpType = hpType;
      }
      if (line === "Frustration" && set.happiness === void 0) {
        set.happiness = 0;
      }
      set.moves.push(line);
    }
  }
  static getNature(plus, minus) {
    if (!plus || !minus) {
      return "Serious";
    }
    for (const i in import_battle_dex_data.BattleNatures) {
      if (import_battle_dex_data.BattleNatures[i].plus === plus && import_battle_dex_data.BattleNatures[i].minus === minus) {
        return i;
      }
    }
    return "Serious";
  }
  static importTeam(buffer) {
    const lines = buffer.split("\n");
    const sets = [];
    let curSet = null;
    while (lines.length && !lines[0]) lines.shift();
    while (lines.length && !lines[lines.length - 1]) lines.pop();
    if (lines.length === 1 && lines[0].includes("|")) {
      return import_battle_teams.Teams.unpack(lines[0]);
    }
    for (let line of lines) {
      line = line.trim();
      if (line === "" || line === "---") {
        curSet = null;
      } else if (line.startsWith("===")) {
      } else if (line.includes("|")) {
        const team = import_client_main.PS.teams.unpackLine(line);
        if (!team) continue;
        return import_battle_teams.Teams.unpack(team.packedTeam);
      } else if (!curSet) {
        curSet = {
          name: "",
          species: "",
          gender: "",
          moves: []
        };
        sets.push(curSet);
        this.parseExportedTeamLine(line, true, curSet);
      } else {
        this.parseExportedTeamLine(line, false, curSet);
      }
    }
    return sets;
  }
  static importTeamBackup(buffer) {
    const teams = [];
    const lines = buffer.split("\n");
    let curTeam = null;
    let sets = null;
    let curSet = null;
    while (lines.length && !lines[0]) lines.shift();
    while (lines.length && !lines[lines.length - 1]) lines.pop();
    for (let line of lines) {
      line = line.trim();
      if (line === "" || line === "---") {
        curSet = null;
      } else if (line.startsWith("===")) {
        if (curTeam) {
          curTeam.packedTeam = import_battle_teams.Teams.pack(sets);
          teams.push(curTeam);
        }
        curTeam = {
          name: "",
          format: "",
          packedTeam: "",
          folder: "",
          key: "",
          iconCache: "",
          isBox: false
        };
        sets = [];
        line = line.slice(3, -3).trim();
        [curTeam.format, line] = this.splitPrefix(line, "]", 1);
        if (!curTeam.format) curTeam.format = "gen8";
        else if (!curTeam.format.startsWith("gen")) curTeam.format = `gen6${curTeam.format}`;
        [curTeam.folder, curTeam.name] = this.splitPrefix(line, "/");
      } else if (line.includes("|")) {
        if (curTeam) {
          curTeam.packedTeam = import_battle_teams.Teams.pack(sets);
          teams.push(curTeam);
        }
        curTeam = null;
        curSet = null;
        const team = import_client_main.PS.teams.unpackLine(line);
        if (team) teams.push(team);
      } else if (!curSet) {
        if (!sets) continue;
        curSet = {
          name: "",
          species: "",
          gender: "",
          moves: []
        };
        sets.push(curSet);
        this.parseExportedTeamLine(line, true, curSet);
      } else {
        this.parseExportedTeamLine(line, false, curSet);
      }
    }
    if (curTeam) {
      curTeam.packedTeam = import_battle_teams.Teams.pack(sets);
      teams.push(curTeam);
    }
    return teams;
  }
  static {
    this.draggedTeam = null;
  }
  static dragStart(ev) {
    const href = ev.currentTarget?.getAttribute("href");
    const team = href ? import_client_main.PS.teams.byKey[href.slice(5)] : null;
    if (!team) return;
    const dataTransfer = ev.dataTransfer;
    if (dataTransfer) {
      dataTransfer.effectAllowed = "copyMove";
      dataTransfer.setData("text/plain", "[Team] " + team.name);
      let filename = team.name;
      if (team.format) filename = "[" + team.format + "] " + filename;
      filename = $.trim(filename).replace(/[\\/]+/g, "") + ".txt";
      const urlprefix = "data:text/plain;base64,";
      const contents = PSTeambuilder.exportPackedTeam(team).replace(/\n/g, "\r\n");
      const downloadurl = "text/plain:" + filename + ":" + urlprefix + encodeURIComponent(window.btoa(unescape(encodeURIComponent(contents))));
      console.log(downloadurl);
      dataTransfer.setData("DownloadURL", downloadurl);
    }
    import_client_main.PS.dragging = { type: "team", team, folder: null };
  }
}
function TeamBox(props) {
  const team = props.team;
  let contents;
  if (team) {
    team.iconCache ||= team.packedTeam ? import_battle_teams.Teams.unpackSpeciesOnly(team.packedTeam).map(
      // can't use <PSIcon>, weird interaction with iconCache
      // don't try this at home; I'm a trained professional
      (pokemon) => (0, import_panels.PSIcon)({ pokemon })
    ) : /* @__PURE__ */ Chat.h("em", null, "(empty ", team.isBox ? "box" : "team", ")");
    let format = team.format;
    if (format.startsWith(`gen${import_battle_dex.Dex.gen}`)) format = format.slice(4);
    format = (format ? `[${format}] ` : ``) + (team.folder ? `${team.folder}/` : ``);
    contents = [
      /* @__PURE__ */ Chat.h("strong", null, team.isBox && /* @__PURE__ */ Chat.h("i", { class: "fa fa-archive" }), " ", format && /* @__PURE__ */ Chat.h("span", null, format), team.name),
      /* @__PURE__ */ Chat.h("small", null, team.iconCache)
    ];
  } else {
    contents = [
      /* @__PURE__ */ Chat.h("em", null, "Select a team")
    ];
  }
  const className = `team${team?.isBox ? " pc-box" : ""}`;
  if (props.button) {
    return /* @__PURE__ */ Chat.h("button", { class: className, value: team ? team.key : "" }, contents);
  }
  if (props.noLink) {
    return /* @__PURE__ */ Chat.h("div", { class: className }, contents);
  }
  return /* @__PURE__ */ Chat.h("a", { href: `team-${team ? team.key : ""}`, class: className, draggable: true, onDragStart: PSTeambuilder.dragStart }, contents);
}
class TeamDropdownPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.gen = "";
    this.format = null;
    this.setFormat = (ev) => {
      const target = ev.currentTarget;
      this.format = target.name === "format" && target.value || "";
      this.gen = target.name === "gen" && target.value || "";
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.forceUpdate();
    };
    this.click = (e) => {
      let curTarget = e.target;
      let target;
      while (curTarget && curTarget !== e.currentTarget) {
        if (curTarget.tagName === "BUTTON") {
          target = curTarget;
        }
        curTarget = curTarget.parentElement;
      }
      if (!target) return;
      import_client_main.PS.teams.loadTeam(import_client_main.PS.teams.byKey[target.value], true);
      this.chooseParentValue(target.value);
    };
  }
  static {
    this.id = "teamdropdown";
  }
  static {
    this.routes = ["teamdropdown"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  getTeams() {
    if (!this.format && !this.gen) return import_client_main.PS.teams.list;
    return import_client_main.PS.teams.list.filter((team) => {
      if (this.gen && !team.format.startsWith(this.gen)) return false;
      if (this.format && team.format !== this.format) return false;
      return true;
    });
  }
  render() {
    const room = this.props.room;
    if (!room.parentElem) {
      return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room }, /* @__PURE__ */ Chat.h("p", null, "Error: You tried to open a team selector, but you have nothing to select a team for."));
    }
    const baseFormat = room.parentElem.getAttribute("data-format") || import_battle_dex.Dex.modid;
    let isFirstLoad = this.format === null;
    if (isFirstLoad) {
      this.format = baseFormat;
    }
    let teams = this.getTeams();
    if (!teams.length && this.format && isFirstLoad) {
      this.gen = this.format.slice(0, 4);
      this.format = "";
      teams = this.getTeams();
    }
    if (!teams.length && this.gen && isFirstLoad) {
      this.gen = "";
      teams = this.getTeams();
    }
    let availableWidth = document.body.offsetWidth;
    let width = 307;
    if (availableWidth > 636) width = 613;
    if (availableWidth > 945) width = 919;
    let teamBuckets = {};
    for (const team of teams) {
      const list = teamBuckets[team.folder] || (teamBuckets[team.folder] = []);
      list.push(team);
    }
    let teamList = [];
    const baseGen = baseFormat.slice(0, 4);
    let genList = [];
    for (const team of import_client_main.PS.teams.list) {
      const gen = team.format.slice(0, 4);
      if (gen && !genList.includes(gen)) genList.push(gen);
    }
    const hasOtherGens = genList.length > 1 || genList[0] !== baseGen;
    teamList.push(/* @__PURE__ */ Chat.h("p", null, baseFormat.length > 4 && /* @__PURE__ */ Chat.h(
      "button",
      {
        class: "button" + (baseFormat === this.format ? " disabled" : ""),
        onClick: this.setFormat,
        name: "format",
        value: baseFormat
      },
      /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-o", "aria-hidden": true }),
      " [",
      baseFormat.slice(0, 4),
      "] ",
      baseFormat.slice(4)
    ), " ", /* @__PURE__ */ Chat.h(
      "button",
      {
        class: "button" + (baseGen === this.format ? " disabled" : ""),
        onClick: this.setFormat,
        name: "format",
        value: baseGen
      },
      /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-o", "aria-hidden": true }),
      " [",
      baseGen,
      "] ",
      /* @__PURE__ */ Chat.h("em", null, "(uncategorized)")
    ), " ", /* @__PURE__ */ Chat.h(
      "button",
      {
        class: "button" + (baseGen === this.gen ? " disabled" : ""),
        onClick: this.setFormat,
        name: "gen",
        value: baseGen
      },
      /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-o", "aria-hidden": true }),
      " [",
      baseGen,
      "] ",
      /* @__PURE__ */ Chat.h("em", null, "(all)")
    ), " ", hasOtherGens && !this.gen && /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.setFormat, name: "gen", value: baseGen }, "Other gens")));
    if (hasOtherGens && this.gen) {
      teamList.push(/* @__PURE__ */ Chat.h("h2", null, "Other gens"));
      teamList.push(/* @__PURE__ */ Chat.h("p", null, genList.sort().map((gen) => [
        /* @__PURE__ */ Chat.h("button", { class: "button" + (gen === this.gen ? " disabled" : ""), onClick: this.setFormat, name: "gen", value: gen }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-o", "aria-hidden": true }), " [", gen, "] ", /* @__PURE__ */ Chat.h("em", null, "(all)")),
        " "
      ])));
    }
    let isEmpty = true;
    for (let folder in teamBuckets) {
      if (folder && (this.gen || this.format)) {
        teamList.push(/* @__PURE__ */ Chat.h("h2", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-open", "aria-hidden": true }), " ", folder, " + ", /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-open-o", "aria-hidden": true }), " ", this.format || this.gen));
      } else if (folder) {
        teamList.push(/* @__PURE__ */ Chat.h("h2", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-open", "aria-hidden": true }), " ", folder));
      } else if (this.gen || this.format) {
        teamList.push(/* @__PURE__ */ Chat.h("h2", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-open-o", "aria-hidden": true }), " ", this.format || this.gen));
      } else {
        teamList.push(/* @__PURE__ */ Chat.h("h2", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-open-o", "aria-hidden": true }), " Teams not in any folders"));
      }
      teamList.push(/* @__PURE__ */ Chat.h("ul", { class: "teamdropdown", onClick: this.click }, teamBuckets[folder].map((team) => /* @__PURE__ */ Chat.h("li", { key: team.key, style: { display: "inline-block" } }, /* @__PURE__ */ Chat.h(TeamBox, { team, button: true })))));
      isEmpty = false;
    }
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, teamList, isEmpty && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("em", null, "No teams found"))));
  }
}
class FormatDropdownPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.gen = "";
    this.format = null;
    this.search = "";
    this.click = (e) => {
      let curTarget = e.target;
      let target;
      if (curTarget?.tagName === "I") return;
      while (curTarget && curTarget !== e.currentTarget) {
        if (curTarget.tagName === "BUTTON") {
          target = curTarget;
        }
        curTarget = curTarget.parentElement;
      }
      if (!target) return;
      this.chooseParentValue(target.value);
    };
    this.updateSearch = (ev) => {
      this.search = ev.currentTarget.value;
      this.forceUpdate();
    };
    this.toggleGen = (ev) => {
      const target = ev.currentTarget;
      this.gen = this.gen === target.value ? "" : target.value;
      this.forceUpdate();
    };
  }
  static {
    this.id = "formatdropdown";
  }
  static {
    this.routes = ["formatdropdown"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  render() {
    const room = this.props.room;
    if (!room.parentElem) {
      return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room }, /* @__PURE__ */ Chat.h("p", null, "Error: You tried to open a format selector, but you have nothing to select a format for."));
    }
    let formatsLoaded = !!window.BattleFormats;
    if (formatsLoaded) {
      formatsLoaded = false;
      for (let i in window.BattleFormats) {
        formatsLoaded = true;
        break;
      }
    }
    const curGen = (gen) => this.gen === gen ? " cur" : "";
    const searchBar = /* @__PURE__ */ Chat.h("div", { style: "margin-bottom: 0.5em" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "search",
        name: "search",
        placeholder: "Search formats",
        class: "textbox autofocus",
        autocomplete: "off",
        onInput: this.updateSearch,
        onChange: this.updateSearch
      }
    ), " ", /* @__PURE__ */ Chat.h("button", { onClick: this.toggleGen, value: "gen9", class: `button button-first${curGen("gen9")}` }, "Gen 9"), /* @__PURE__ */ Chat.h("button", { onClick: this.toggleGen, value: "gen8", class: `button button-middle${curGen("gen8")}` }, "8"), /* @__PURE__ */ Chat.h("button", { onClick: this.toggleGen, value: "gen7", class: `button button-middle${curGen("gen7")}` }, "7"), /* @__PURE__ */ Chat.h("button", { onClick: this.toggleGen, value: "gen6", class: `button button-middle${curGen("gen6")}` }, "6"), /* @__PURE__ */ Chat.h("button", { onClick: this.toggleGen, value: "gen5", class: `button button-middle${curGen("gen5")}` }, "5"), /* @__PURE__ */ Chat.h("button", { onClick: this.toggleGen, value: "gen4", class: `button button-middle${curGen("gen4")}` }, "4"), /* @__PURE__ */ Chat.h("button", { onClick: this.toggleGen, value: "gen3", class: `button button-middle${curGen("gen3")}` }, "3"), /* @__PURE__ */ Chat.h("button", { onClick: this.toggleGen, value: "gen2", class: `button button-middle${curGen("gen2")}` }, "2"), /* @__PURE__ */ Chat.h("button", { onClick: this.toggleGen, value: "gen1", class: `button button-last${curGen("gen1")}` }, "1"));
    if (!formatsLoaded) {
      return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, searchBar, /* @__PURE__ */ Chat.h("p", null, "Loading...")));
    }
    const selectType = room.parentElem.getAttribute("data-selecttype") || "challenge";
    const curFormat = (0, import_battle_dex.toID)(room.parentElem.value);
    const formats = Object.values(BattleFormats).filter((format) => {
      if (selectType === "challenge" && format.challengeShow === false) return false;
      if (selectType === "search" && format.searchShow === false) return false;
      if (selectType === "tournament" && format.tournamentShow === false) return false;
      if (selectType === "teambuilder" && format.team) return false;
      return true;
    });
    let curSection = "";
    let curColumnNum = 0;
    let curColumn = [];
    const columns = [curColumn];
    const searchID = (0, import_battle_dex.toID)(this.search);
    for (const format of formats) {
      if (searchID && !(0, import_battle_dex.toID)(format.name).includes(searchID)) {
        continue;
      }
      if (this.gen && !format.id.startsWith(this.gen)) continue;
      if (format.column !== curColumnNum) {
        if (curColumn.length) {
          curColumn = [];
          columns.push(curColumn);
        }
        curColumnNum = format.column;
      }
      if (format.section !== curSection) {
        curSection = format.section;
        if (curSection) {
          curColumn.push({ id: null, section: curSection });
        }
      }
      curColumn.push(format);
    }
    if (this.gen && selectType === "teambuilder") {
      columns[0].unshift({
        id: this.gen,
        name: `[Gen ${this.gen.slice(3)}]`,
        section: "No Format"
      });
    }
    const width = Math.max(columns.length, 2.1) * 225 + 30;
    const noResults = curColumn.length === 0;
    const starredPrefs = import_client_main.PS.prefs.starredformats || {};
    const starred = Object.keys(starredPrefs).filter((id) => starredPrefs[id] === true).reverse();
    let starredDone = false;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, searchBar, columns.map((column) => /* @__PURE__ */ Chat.h("ul", { class: "options", onClick: this.click }, !starredDone && starred?.map((id, i) => {
      if (this.gen && !id.startsWith(this.gen)) return null;
      let format = BattleFormats[id];
      if (/^gen[1-9]$/.test(id)) {
        format ||= {
          id,
          name: `[Gen ${id.slice(3)}]`,
          section: "No Format",
          challengeShow: false,
          searchShow: false
        };
      }
      if (!format) return null;
      if (i === starred.length - 1) starredDone = true;
      if (selectType === "challenge" && format.challengeShow === false) return null;
      if (selectType === "search" && format.searchShow === false) return null;
      if (selectType === "teambuilder" && format.team) return null;
      return /* @__PURE__ */ Chat.h("li", null, /* @__PURE__ */ Chat.h("button", { value: format.name, class: `option${curFormat === format.id ? " cur" : ""}` }, format.name.replace("[Gen 8 ", "[").replace("[Gen 9] ", "").replace("[Gen 7 ", "["), format.section === "No Format" && /* @__PURE__ */ Chat.h("em", null, " (uncategorized)"), /* @__PURE__ */ Chat.h("i", { class: "star fa fa-star cur", "data-cmd": `/unstar ${format.id}` })));
    }), column.map((format) => {
      if (starred.includes(format.id || "")) return "";
      if (format.id) {
        return /* @__PURE__ */ Chat.h("li", null, /* @__PURE__ */ Chat.h(
          "button",
          {
            value: format.name,
            class: `option${curFormat === format.id ? " cur" : ""}`
          },
          format.name.replace("[Gen 8 ", "[").replace("[Gen 9] ", "").replace("[Gen 7 ", "["),
          format.section === "No Format" && /* @__PURE__ */ Chat.h("em", null, " (uncategorized)"),
          /* @__PURE__ */ Chat.h("i", { class: "star fa fa-star-o", "data-cmd": `/star ${format.id}` })
        ));
      } else {
        return /* @__PURE__ */ Chat.h("li", null, /* @__PURE__ */ Chat.h("h3", null, format.section));
      }
    }))), noResults && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("em", null, "No formats", !!searchID && ` matching "${searchID}"`, " found")), /* @__PURE__ */ Chat.h("div", { style: "float: left" })));
  }
}
import_client_main.PS.addRoomType(TeamDropdownPanel, FormatDropdownPanel);
//# sourceMappingURL=panel-teamdropdown.js.map
