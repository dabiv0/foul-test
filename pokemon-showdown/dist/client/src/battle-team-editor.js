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
var battle_team_editor_exports = {};
__export(battle_team_editor_exports, {
  TeamEditor: () => TeamEditor
});
module.exports = __toCommonJS(battle_team_editor_exports);
var import_preact = __toESM(require("../js/lib/preact"));
var import_panel_teamdropdown = require("./panel-teamdropdown");
var import_battle_dex = require("./battle-dex");
var import_battle_teams = require("./battle-teams");
var import_battle_dex_search = require("./battle-dex-search");
var import_battle_searchresults = require("./battle-searchresults");
var import_battle_dex_data = require("./battle-dex-data");
var import_battle_tooltips = require("./battle-tooltips");
var import_client_core = require("./client-core");
var import_client_connection = require("./client-connection");
/**
 * Teambuilder team editor, extracted from the rest of the Preact
 * client so that it can be used in isolation.
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
class TeamEditorState extends import_client_core.PSModel {
  constructor(team) {
    super();
    this.sets = [];
    this.gen = import_battle_dex.Dex.gen;
    this.dex = import_battle_dex.Dex;
    this.deletedSet = null;
    this.search = new import_battle_dex_search.DexSearch();
    this.format = `gen${this.gen}`;
    this.searchIndex = 0;
    this.originalSpecies = null;
    this.narrow = false;
    this.selectionTypeOrder = [
      "pokemon",
      "ability",
      "item",
      "move",
      "stats",
      "details"
    ];
    this.innerFocus = null;
    this.isLetsGo = false;
    this.isNatDex = false;
    this.isBDSP = false;
    this.formeLegality = "normal";
    this.abilityLegality = "normal";
    this.defaultLevel = 100;
    this.readonly = false;
    this.fetching = false;
    this.ignoreRows = ["header", "sortpokemon", "sortmove", "html"];
    this.team = team;
    this.sets = import_battle_teams.Teams.unpack(team.packedTeam);
    this.setFormat(team.format);
    window.search = this.search;
  }
  setReadonly(readonly) {
    if (!readonly && this.readonly) this.sets = import_battle_teams.Teams.unpack(this.team.packedTeam);
    this.readonly = readonly;
  }
  setFormat(format) {
    const team = this.team;
    const formatid = (0, import_battle_dex.toID)(format);
    this.format = formatid;
    team.format = formatid;
    this.dex = import_battle_dex.Dex.forFormat(formatid);
    this.gen = this.dex.gen;
    format = (0, import_battle_dex.toID)(format).slice(4);
    this.isLetsGo = formatid.includes("letsgo");
    this.isNatDex = formatid.includes("nationaldex") || formatid.includes("natdex");
    this.isBDSP = formatid.includes("bdsp");
    if (formatid.includes("almostanyability") || formatid.includes("aaa")) {
      this.abilityLegality = "hackmons";
    } else {
      this.abilityLegality = "normal";
    }
    if (formatid.includes("hackmons") || formatid.includes("bh")) {
      this.formeLegality = "hackmons";
      this.abilityLegality = "hackmons";
    } else if (formatid.includes("metronome") || formatid.includes("customgame")) {
      this.formeLegality = "custom";
      this.abilityLegality = "hackmons";
    } else {
      this.formeLegality = "normal";
    }
    this.defaultLevel = 100;
    if (formatid.includes("vgc") || formatid.includes("bss") || formatid.includes("ultrasinnohclassic") || formatid.includes("battlespot") || formatid.includes("battlestadium") || formatid.includes("battlefestival")) {
      this.defaultLevel = 50;
    }
    if (formatid.includes("lc")) {
      this.defaultLevel = 5;
    }
  }
  setSearchType(type, i, value) {
    const set = this.sets[i];
    this.search.setType(type, this.format, set);
    this.originalSpecies = null;
    this.search.prependResults = null;
    if (type === "move") {
      this.search.prependResults = this.getSearchMoves(set);
      if (value && this.search.prependResults.some((row) => row[1].split("_")[2] === (0, import_battle_dex.toID)(value))) {
        value = "";
      }
    } else if (value) {
      switch (type) {
        case "pokemon":
          if (this.dex.species.get(value).exists) {
            this.originalSpecies = value;
            this.search.prependResults = [["pokemon", (0, import_battle_dex.toID)(value)]];
            value = "";
          }
          break;
        case "item":
          if ((0, import_battle_dex.toID)(value) === "noitem") value = "";
          if (this.dex.items.get(value).exists) {
            this.search.prependResults = [["item", (0, import_battle_dex.toID)(value)]];
            value = "";
          }
          break;
        case "ability":
          if ((0, import_battle_dex.toID)(value) === "selectability") value = "";
          if ((0, import_battle_dex.toID)(value) === "noability") value = "";
          if (this.dex.abilities.get(value).exists) {
            this.search.prependResults = [["ability", (0, import_battle_dex.toID)(value)]];
            value = "";
          }
          break;
      }
    }
    if (type === "item") (this.search.prependResults ||= []).push(["item", ""]);
    this.search.find(value || "");
    this.searchIndex = this.search.results?.[0]?.[0] === "header" ? 1 : 0;
  }
  updateSearchMoves(set) {
    let oldResultsLength = this.search.prependResults?.length || 0;
    this.search.prependResults = this.getSearchMoves(set);
    this.searchIndex += this.search.prependResults.length - oldResultsLength;
    if (this.searchIndex < 0) this.searchIndex = 0;
    this.search.results = null;
    if (this.search.query) {
      this.setSearchValue("");
    } else {
      this.search.find("");
    }
  }
  getSearchMoves(set) {
    const out = [];
    for (let i = 0; i < Math.max(set.moves.length, 4); i++) {
      out.push(["move", `_${i + 1}_${(0, import_battle_dex.toID)(set.moves[i] || "")}`]);
    }
    return out;
  }
  setSearchValue(value) {
    this.search.find(value);
    this.searchIndex = this.search.results?.[0]?.[0] === "header" ? 1 : 0;
  }
  selectSearchValue() {
    let result = this.search.results?.[this.searchIndex];
    if (result?.[0] === "header") {
      this.searchIndex++;
      result = this.search.results?.[this.searchIndex];
    }
    if (!result) return null;
    if (this.search.addFilter(result)) {
      this.searchIndex = 0;
      return null;
    }
    return this.getResultValue(result);
  }
  changeSpecies(set, speciesName) {
    const species = this.dex.species.get(speciesName);
    if (set.item === this.getDefaultItem(set.species)) set.item = void 0;
    if (set.name === set.species.split("-")[0]) delete set.name;
    set.species = species.name;
    set.ability = this.getDefaultAbility(set);
    set.item = this.getDefaultItem(species.name) ?? set.item;
    if ((0, import_battle_dex.toID)(speciesName) === "Cathy") {
      set.name = "Cathy";
      set.species = "Trevenant";
      set.level = void 0;
      set.gender = "F";
      set.item = "Starf Berry";
      set.ability = "Harvest";
      set.moves = ["Substitute", "Horn Leech", "Earthquake", "Phantom Force"];
      set.evs = { hp: 36, atk: 252, def: 0, spa: 0, spd: 0, spe: 220 };
      set.ivs = void 0;
      set.nature = "Jolly";
    }
  }
  deleteSet(index) {
    if (this.sets.length <= index) return;
    this.deletedSet = {
      set: this.sets[index],
      index
    };
    this.sets.splice(index, 1);
  }
  undeleteSet() {
    if (!this.deletedSet) return;
    this.sets.splice(this.deletedSet.index, 0, this.deletedSet.set);
    this.deletedSet = null;
  }
  downSearchValue() {
    if (!this.search.results || this.searchIndex >= this.search.results.length - 1) return;
    this.searchIndex++;
    if (this.ignoreRows.includes(this.search.results[this.searchIndex]?.[0])) {
      if (this.searchIndex >= this.search.results.length - 1) return;
      this.searchIndex++;
    }
    if (this.ignoreRows.includes(this.search.results[this.searchIndex]?.[0])) {
      if (this.searchIndex >= this.search.results.length - 1) return;
      this.searchIndex++;
    }
  }
  upSearchValue() {
    if (!this.search.results || this.searchIndex <= 0) return;
    if (this.searchIndex <= 1 && this.ignoreRows.includes(this.search.results[0]?.[0])) return;
    this.searchIndex--;
    if (this.ignoreRows.includes(this.search.results[this.searchIndex]?.[0])) {
      if (this.searchIndex <= 0) return;
      this.searchIndex--;
    }
    if (this.ignoreRows.includes(this.search.results[this.searchIndex]?.[0])) {
      if (this.searchIndex <= 0) return;
      this.searchIndex--;
    }
  }
  getResultValue(result) {
    switch (result[0]) {
      case "pokemon":
        return this.dex.species.get(result[1]).name;
      case "item":
        return this.dex.items.get(result[1]).name;
      case "ability":
        return this.dex.abilities.get(result[1]).name;
      case "move":
        if (result[1].startsWith("_")) {
          const [slot, moveid] = result[1].slice(1).split("_");
          return this.dex.moves.get(moveid).name + "|" + slot;
        }
        return this.dex.moves.get(result[1]).name;
      default:
        return result[1];
    }
  }
  canAdd() {
    return this.sets.length < 6 || this.team.isBox;
  }
  getHPType(set) {
    if (set.hpType) return set.hpType;
    const hpMove = set.ivs ? null : this.getHPMove(set);
    if (hpMove) return hpMove;
    const hpTypes = [
      "Fighting",
      "Flying",
      "Poison",
      "Ground",
      "Rock",
      "Bug",
      "Ghost",
      "Steel",
      "Fire",
      "Water",
      "Grass",
      "Electric",
      "Psychic",
      "Ice",
      "Dragon",
      "Dark"
    ];
    if (this.gen <= 2) {
      if (!set.ivs) return "Dark";
      const atkDV = Math.floor(set.ivs.atk / 2);
      const defDV = Math.floor(set.ivs.def / 2);
      return hpTypes[4 * (atkDV % 4) + defDV % 4];
    } else {
      const ivs = set.ivs || this.defaultIVs(set);
      let hpTypeX = 0;
      let i = 1;
      const statOrder = ["hp", "atk", "def", "spe", "spa", "spd"];
      for (const s of statOrder) {
        if (ivs[s] === void 0) ivs[s] = 31;
        hpTypeX += i * (ivs[s] % 2);
        i *= 2;
      }
      return hpTypes[Math.floor(hpTypeX * 15 / 63)];
    }
  }
  hpTypeMatters(set) {
    if (this.gen < 2) return false;
    if (this.gen > 7) return false;
    for (const move of set.moves) {
      const moveid = (0, import_battle_dex.toID)(move);
      if (moveid.startsWith("hiddenpower")) return true;
      if (moveid === "transform") return true;
    }
    if ((0, import_battle_dex.toID)(set.ability) === "imposter") return true;
    return false;
  }
  getHPMove(set) {
    if (set.moves) {
      for (const move of set.moves) {
        const moveid = (0, import_battle_dex.toID)(move);
        if (moveid.startsWith("hiddenpower")) {
          return moveid.charAt(11).toUpperCase() + moveid.slice(12);
        }
      }
    }
    return null;
  }
  getIVs(set) {
    const ivs = this.defaultIVs(set);
    if (set.ivs) Object.assign(ivs, set.ivs);
    return ivs;
  }
  defaultIVs(set, noGuess = !!set.ivs) {
    const useIVs = this.gen > 2;
    const defaultIVs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    if (!useIVs) {
      for (const stat of import_battle_dex.Dex.statNames) defaultIVs[stat] = 15;
    }
    if (noGuess) return defaultIVs;
    const hpType = this.getHPMove(set);
    const hpModulo = useIVs ? 2 : 4;
    const { minAtk, minSpe } = this.prefersMinStats(set);
    if (minAtk) defaultIVs["atk"] = 0;
    if (minSpe) defaultIVs["spe"] = 0;
    if (!useIVs) {
      const hpDVs = hpType ? this.dex.types.get(hpType).HPdvs : null;
      if (hpDVs) {
        for (const stat in hpDVs) defaultIVs[stat] = hpDVs[stat];
      }
    } else {
      const hpIVs = hpType ? this.dex.types.get(hpType).HPivs : null;
      if (hpIVs) {
        if (this.canHyperTrain(set)) {
          if (minSpe) defaultIVs["spe"] = hpIVs["spe"] ?? 31;
          if (minAtk) defaultIVs["atk"] = hpIVs["atk"] ?? 31;
        } else {
          for (const stat in hpIVs) defaultIVs[stat] = hpIVs[stat];
        }
      }
    }
    if (hpType) {
      if (minSpe) defaultIVs["spe"] %= hpModulo;
      if (minAtk) defaultIVs["atk"] %= hpModulo;
    }
    if (minAtk && useIVs) {
      if (["Gouging Fire", "Iron Boulder", "Iron Crown", "Raging Bolt"].includes(set.species)) {
        defaultIVs["atk"] = 20;
      } else if (set.species.startsWith("Terapagos")) {
        defaultIVs["atk"] = 15;
      }
    }
    return defaultIVs;
  }
  defaultHappiness(set) {
    if (set.moves.includes("Return")) return 255;
    if (set.moves.includes("Frustration")) return 0;
    return void 0;
  }
  prefersMinStats(set) {
    let minSpe = !set.evs?.spe && set.moves.includes("Gyro Ball");
    let minAtk = !set.evs?.atk;
    if (set.species.startsWith("Terapagos")) minSpe = false;
    if (this.format === "gen7hiddentype") return { minAtk, minSpe };
    if (this.format.includes("1v1")) return { minAtk, minSpe };
    if (set.ability === "Battle Bond" || ["Koraidon", "Miraidon"].includes(set.species)) {
      minAtk = false;
      return { minAtk, minSpe };
    }
    if (!set.moves.length) minAtk = false;
    for (const moveName of set.moves) {
      if (!moveName) continue;
      const move = this.dex.moves.get(moveName);
      if (move.id === "transform") {
        const hasMoveBesidesTransform = set.moves.length > 1;
        if (!hasMoveBesidesTransform) minAtk = false;
      } else if (move.category === "Physical" && !move.damage && !move.ohko && !["foulplay", "endeavor", "counter", "bodypress", "seismictoss", "bide", "metalburst", "superfang"].includes(move.id) && !(this.gen < 8 && move.id === "rapidspin")) {
        minAtk = false;
      } else if (["metronome", "assist", "copycat", "mefirst", "photongeyser", "shellsidearm", "terablast"].includes(move.id) || this.gen === 5 && move.id === "naturepower") {
        minAtk = false;
      }
    }
    return { minAtk, minSpe };
  }
  getNickname(set) {
    return set.name || this.dex.species.get(set.species).baseSpecies || "";
  }
  canHyperTrain(set) {
    let format = this.format;
    if (this.gen < 7 || format === "gen7hiddentype") return false;
    if ((set.level || this.defaultLevel) === 100) return true;
    if ((set.level || this.defaultLevel) >= 50 && this.defaultLevel === 50) return true;
    return false;
  }
  getHPIVs(hpType) {
    switch (hpType) {
      case "Dark":
        return ["111111"];
      case "Dragon":
        return ["011111", "101111", "110111"];
      case "Ice":
        return ["010111", "100111", "111110"];
      case "Psychic":
        return ["011110", "101110", "110110"];
      case "Electric":
        return ["010110", "100110", "111011"];
      case "Grass":
        return ["011011", "101011", "110011"];
      case "Water":
        return ["100011", "111010"];
      case "Fire":
        return ["101010", "110010"];
      case "Steel":
        return ["100010", "111101"];
      case "Ghost":
        return ["101101", "110101"];
      case "Bug":
        return ["100101", "111100", "101100"];
      case "Rock":
        return ["001100", "110100", "100100"];
      case "Ground":
        return ["000100", "111001", "101001"];
      case "Poison":
        return ["001001", "110001", "100001"];
      case "Flying":
        return ["000001", "111000", "101000"];
      case "Fighting":
        return ["001000", "110000", "100000"];
      default:
        return null;
    }
  }
  getStat(stat, set, ivOverride, evOverride, natureOverride) {
    const team = this.team;
    const supportsEVs = !team.format.includes("letsgo");
    const supportsAVs = !supportsEVs;
    const species = this.dex.species.get(set.species);
    if (!species.exists) return 0;
    const level = set.level || this.defaultLevel;
    const baseStat = species.baseStats[stat];
    const iv = ivOverride;
    const ev = evOverride ?? set.evs?.[stat] ?? (this.gen > 2 ? 0 : 252);
    if (stat === "hp") {
      if (baseStat === 1) return 1;
      if (!supportsEVs) return Math.trunc(Math.trunc(2 * baseStat + iv + 100) * level / 100 + 10) + (supportsAVs ? ev : 0);
      return Math.trunc(Math.trunc(2 * baseStat + iv + Math.trunc(ev / 4) + 100) * level / 100 + 10);
    }
    let val = Math.trunc(Math.trunc(2 * baseStat + iv + Math.trunc(ev / 4)) * level / 100 + 5);
    if (!supportsEVs) {
      val = Math.trunc(Math.trunc(2 * baseStat + iv) * level / 100 + 5);
    }
    if (natureOverride) {
      val *= natureOverride;
    } else if (import_battle_dex_data.BattleNatures[set.nature]?.plus === stat) {
      val *= 1.1;
    } else if (import_battle_dex_data.BattleNatures[set.nature]?.minus === stat) {
      val *= 0.9;
    }
    if (!supportsEVs) {
      const friendshipValue = Math.trunc((70 / 255 / 10 + 1) * 100);
      val = Math.trunc(val) * friendshipValue / 100 + (supportsAVs ? ev : 0);
    }
    return Math.trunc(val);
  }
  export(compat) {
    return import_battle_teams.Teams.export(this.sets, this.dex, !compat);
  }
  import(value) {
    this.sets = import_panel_teamdropdown.PSTeambuilder.importTeam(value);
    this.save();
  }
  getTypeWeakness(type, attackType) {
    const weaknessType = this.dex.types.get(type).damageTaken?.[attackType];
    if (weaknessType === import_battle_dex.Dex.IMMUNE) return 0;
    if (weaknessType === import_battle_dex.Dex.RESIST) return 0.5;
    if (weaknessType === import_battle_dex.Dex.WEAK) return 2;
    return 1;
  }
  getWeakness(types, abilityid, attackType) {
    if (attackType === "Ground" && abilityid === "levitate") return 0;
    if (attackType === "Water" && abilityid === "dryskin") return 0;
    if (attackType === "Fire" && abilityid === "flashfire") return 0;
    if (attackType === "Electric" && abilityid === "lightningrod" && this.gen >= 5) return 0;
    if (attackType === "Grass" && abilityid === "sapsipper") return 0;
    if (attackType === "Electric" && abilityid === "motordrive") return 0;
    if (attackType === "Water" && abilityid === "stormdrain" && this.gen >= 5) return 0;
    if (attackType === "Electric" && abilityid === "voltabsorb") return 0;
    if (attackType === "Water" && abilityid === "waterabsorb") return 0;
    if (attackType === "Ground" && abilityid === "eartheater") return 0;
    if (attackType === "Fire" && abilityid === "wellbakedbody") return 0;
    if (attackType === "Fire" && abilityid === "primordialsea") return 0;
    if (attackType === "Water" && abilityid === "desolateland") return 0;
    if (abilityid === "wonderguard") {
      for (const type of types) {
        if (this.getTypeWeakness(type, attackType) <= 1) return 0;
      }
    }
    let factor = 1;
    if ((attackType === "Fire" || attackType === "Ice") && abilityid === "thickfat") factor *= 0.5;
    if (attackType === "Fire" && abilityid === "waterbubble") factor *= 0.5;
    if (attackType === "Fire" && abilityid === "heatproof") factor *= 0.5;
    if (attackType === "Ghost" && abilityid === "purifyingsalt") factor *= 0.5;
    if (attackType === "Fire" && abilityid === "fluffy") factor *= 2;
    if ((attackType === "Electric" || attackType === "Rock" || attackType === "Ice") && abilityid === "deltastream") {
      factor *= 0.5;
    }
    for (const type of types) {
      factor *= this.getTypeWeakness(type, attackType);
    }
    return factor;
  }
  pokemonDefensiveCoverage(set) {
    const coverage = {};
    const species = this.dex.species.get(set.species);
    const abilityid = (0, import_battle_dex.toID)(set.ability);
    for (const type of this.dex.types.names()) {
      coverage[type] = this.getWeakness(species.types, abilityid, type);
    }
    return coverage;
  }
  teamDefensiveCoverage() {
    const counters = {};
    for (const type of this.dex.types.names()) {
      counters[type] = {
        type,
        resists: 0,
        neutrals: 0,
        weaknesses: 0
      };
    }
    for (const set of this.sets) {
      const coverage = this.pokemonDefensiveCoverage(set);
      for (const [type, value] of Object.entries(coverage)) {
        if (value < 1) {
          counters[type].resists++;
        } else if (value === 1) {
          counters[type].neutrals++;
        } else {
          counters[type].weaknesses++;
        }
      }
    }
    return counters;
  }
  getDefaultAbility(set) {
    if (this.gen < 3 || this.isLetsGo || this.formeLegality === "custom") return set.ability;
    const species = this.dex.species.get(set.species);
    if (this.formeLegality === "hackmons") {
      if (this.gen < 9 || species.baseSpecies !== "Xerneas") return set.ability;
    } else if (this.abilityLegality === "hackmons") {
      if (!species.battleOnly) return set.ability;
      if (species.requiredItems.length || species.baseSpecies === "Meloetta") return set.ability;
      return species.abilities[0];
    }
    const abilities = Object.values(species.abilities);
    if (abilities.length === 1) return abilities[0];
    if (set.ability && abilities.includes(set.ability)) return set.ability;
    return void 0;
  }
  getDefaultItem(speciesName) {
    const species = this.dex.species.get(speciesName);
    let items = species.requiredItems;
    if (this.gen !== 7 && !this.isNatDex) {
      items = items.filter((i) => !i.endsWith("ium Z"));
    }
    if (items.length === 1) {
      if (this.formeLegality === "normal" || this.formeLegality === "hackmons" && this.gen === 9 && species.battleOnly && !species.isMega && !species.isPrimal && species.name !== "Necrozma-Ultra") {
        return items[0];
      }
    }
    return void 0;
  }
  save() {
    this.team.packedTeam = import_battle_teams.Teams.pack(this.sets);
    this.team.iconCache = null;
  }
}
class TeamEditor extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.wizard = true;
    this.setTab = (ev) => {
      const target = ev.currentTarget;
      const wizard = target.value === "wizard";
      this.wizard = wizard;
      this.forceUpdate();
    };
    this.update = () => {
      this.forceUpdate();
    };
  }
  static renderTypeIcon(type, b) {
    if (!type) return null;
    type = import_battle_dex.Dex.types.get(type).name;
    if (!type) type = "???";
    let sanitizedType = type.replace(/\?/g, "%3f");
    return /* @__PURE__ */ Chat.h(
      "img",
      {
        src: `${import_battle_dex.Dex.resourcePrefix}sprites/types/${sanitizedType}.png`,
        alt: type,
        height: "14",
        width: "32",
        class: `pixelated${b ? " b" : ""}`,
        style: "vertical-align:middle"
      }
    );
  }
  static probablyMobile() {
    return document.body.offsetWidth < 500;
  }
  renderDefensiveCoverage() {
    const { editor } = this;
    if (editor.team.isBox) return null;
    if (!editor.sets.length) return null;
    const counters = Object.values(editor.teamDefensiveCoverage());
    import_battle_dex.PSUtils.sortBy(counters, (counter) => [counter.resists, -counter.weaknesses]);
    const good = [], medium = [], bad = [];
    const renderTypeDefensive = (counter) => /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("th", null, counter.type), /* @__PURE__ */ Chat.h("td", null, counter.resists, " ", /* @__PURE__ */ Chat.h("small", { class: "gray" }, "resist")), /* @__PURE__ */ Chat.h("td", null, counter.weaknesses, " ", /* @__PURE__ */ Chat.h("small", { class: "gray" }, "weak")));
    for (const counter of counters) {
      if (counter.resists > 0) {
        good.push(renderTypeDefensive(counter));
      } else if (counter.weaknesses <= 0) {
        medium.push(renderTypeDefensive(counter));
      } else {
        bad.push(renderTypeDefensive(counter));
      }
    }
    return /* @__PURE__ */ Chat.h("details", { class: "details" }, /* @__PURE__ */ Chat.h("summary", null, /* @__PURE__ */ Chat.h("strong", null, "Defensive coverage"), /* @__PURE__ */ Chat.h("table", { class: "details-preview table" }, bad, /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { colSpan: 3 }, /* @__PURE__ */ Chat.h("span", { class: "details-preview ilink" }, /* @__PURE__ */ Chat.h("small", null, "See all")))))), /* @__PURE__ */ Chat.h("table", { class: "table" }, bad, medium, good));
  }
  render() {
    this.editor ||= new TeamEditorState(this.props.team);
    const editor = this.editor;
    editor.setReadonly(!!this.props.readOnly);
    editor.narrow = this.props.narrow ?? document.body.offsetWidth < 500;
    if (this.props.team.format !== editor.format) {
      editor.setFormat(this.props.team.format);
    }
    return /* @__PURE__ */ Chat.h("div", { class: "teameditor" }, /* @__PURE__ */ Chat.h("ul", { class: "tabbar" }, /* @__PURE__ */ Chat.h("li", null, /* @__PURE__ */ Chat.h("button", { onClick: this.setTab, value: "wizard", class: `button${this.wizard ? " cur" : ""}` }, "Wizard")), /* @__PURE__ */ Chat.h("li", null, /* @__PURE__ */ Chat.h("button", { onClick: this.setTab, value: "import", class: `button${!this.wizard ? " cur" : ""}` }, "Import/Export"))), this.wizard ? /* @__PURE__ */ Chat.h(TeamWizard, { editor, onChange: this.props.onChange, onUpdate: this.update }) : /* @__PURE__ */ Chat.h(TeamTextbox, { editor, onChange: this.props.onChange, onUpdate: this.update }), !this.editor.innerFocus && /* @__PURE__ */ Chat.h(Chat.Fragment, null, this.props.children, /* @__PURE__ */ Chat.h("div", { class: "team-resources" }, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("br", null), this.renderDefensiveCoverage(), this.props.resources)));
  }
}
class TeamTextbox extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.setInfo = [];
    this.textbox = null;
    this.heightTester = null;
    this.compat = false;
    /** we changed the set but are delaying updates until the selection form is closed */
    this.setDirty = false;
    this.windowing = true;
    this.selection = null;
    this.innerFocus = null;
    this.input = () => {
      this.updateText();
      this.save();
    };
    this.keyUp = () => this.updateText(true);
    this.contextMenu = (ev) => {
      if (!ev.shiftKey) {
        const hadInnerFocus = this.innerFocus?.range[1];
        this.openInnerFocus();
        if (hadInnerFocus !== this.innerFocus?.range[1]) {
          ev.preventDefault();
          ev.stopImmediatePropagation();
        }
      }
    };
    this.keyDown = (ev) => {
      const editor = this.editor;
      switch (ev.keyCode) {
        case 27:
        // escape
        case 8:
          if (this.innerFocus) {
            const atStart = this.innerFocus.range[0] === this.textbox.selectionStart && this.innerFocus.range[0] === this.textbox.selectionEnd;
            if (ev.keyCode === 27 || atStart) {
              if (editor.search.removeFilter()) {
                editor.setSearchValue(this.getInnerFocusValue());
                this.resetScroll();
                this.forceUpdate();
                ev.stopImmediatePropagation();
                ev.preventDefault();
              } else if (this.closeMenu()) {
                ev.stopImmediatePropagation();
                ev.preventDefault();
              }
            }
          }
          break;
        case 38:
          if (this.innerFocus) {
            editor.upSearchValue();
            const resultsUp = this.base.querySelector(".searchresults");
            if (resultsUp) {
              resultsUp.scrollTop = Math.max(0, editor.searchIndex * 33 - Math.trunc((window.innerHeight - 100) * 0.4));
            }
            this.forceUpdate();
            ev.preventDefault();
          }
          break;
        case 40:
          if (this.innerFocus) {
            editor.downSearchValue();
            const resultsDown = this.base.querySelector(".searchresults");
            if (resultsDown) {
              resultsDown.scrollTop = Math.max(0, editor.searchIndex * 33 - Math.trunc((window.innerHeight - 100) * 0.4));
            }
            this.forceUpdate();
            ev.preventDefault();
          }
          break;
        case 9:
        // tab
        case 13:
          if (ev.keyCode === 13 && ev.shiftKey) return;
          if (ev.altKey || ev.metaKey) return;
          if (!this.innerFocus) {
            if (this.maybeReplaceLine()) {
            } else if (this.textbox.selectionStart === this.textbox.value.length && (this.textbox.value.endsWith("\n\n") || !this.textbox.value)) {
              this.addPokemon();
            } else if (!this.openInnerFocus()) {
              break;
            }
            ev.stopImmediatePropagation();
            ev.preventDefault();
          } else {
            const result = this.editor.selectSearchValue();
            if (result !== null) {
              const [name, moveSlot] = result.split("|");
              this.selectResult(this.innerFocus.type, name, moveSlot);
            } else {
              this.replaceNoFocus("", this.innerFocus.range[0], this.innerFocus.range[1]);
              this.editor.setSearchValue("");
              this.forceUpdate();
            }
            this.resetScroll();
            ev.stopImmediatePropagation();
            ev.preventDefault();
          }
          break;
        case 80:
          if (ev.metaKey) {
            window.PS.alert(editor.export(this.compat));
            ev.stopImmediatePropagation();
            ev.preventDefault();
            break;
          }
      }
    };
    this.maybeReplaceLine = () => {
      if (this.textbox.selectionStart !== this.textbox.selectionEnd) return;
      const current = this.textbox.selectionEnd;
      const lineStart = this.textbox.value.lastIndexOf("\n", current) + 1;
      const value = this.textbox.value.slice(lineStart, current);
      const pokepaste = /^https?:\/\/pokepast.es\/([a-z0-9]+)(?:\/.*)?$/.exec(value)?.[1];
      if (pokepaste) {
        this.editor.fetching = true;
        (0, import_client_connection.Net)(`https://pokepast.es/${pokepaste}/json`).get().then((json) => {
          const paste = JSON.parse(json);
          const pasteTxt = paste.paste.replace(/\r\n/g, "\n");
          if (this.textbox) {
            const valueIndex = this.textbox.value.indexOf(value);
            this.replace(paste.paste.replace(/\r\n/g, "\n"), valueIndex, valueIndex + value.length);
          } else {
            this.editor.import(pasteTxt);
          }
          const notes = paste["notes"];
          if (notes.startsWith("Format: ")) {
            const formatid = (0, import_battle_dex.toID)(notes.slice(8));
            this.editor.setFormat(formatid);
          }
          const title = paste["title"];
          if (title && !title.startsWith("Untitled")) {
            this.editor.team.name = title.replace(/[|\\/]/g, "");
          }
          this.editor.fetching = false;
          this.props.onUpdate?.();
        });
        return true;
      }
      return false;
    };
    this.closeMenu = () => {
      if (this.innerFocus) {
        this.clearInnerFocus();
        if (this.setDirty) {
          this.updateText();
          this.save();
        } else {
          this.forceUpdate();
        }
        this.textbox.focus();
        return true;
      }
      return false;
    };
    this.updateText = (noTextChange, autoSelect) => {
      const textbox = this.textbox;
      let value = textbox.value;
      let selectionStart = textbox.selectionStart || 0;
      let selectionEnd = textbox.selectionEnd || 0;
      if (this.innerFocus) {
        if (!noTextChange) {
          let lineEnd = this.textbox.value.indexOf("\n", this.innerFocus.range[0]);
          if (lineEnd < 0) lineEnd = this.textbox.value.length;
          const line = this.textbox.value.slice(this.innerFocus.range[0], lineEnd);
          if (this.innerFocus.rangeEndChar) {
            const index2 = line.indexOf(this.innerFocus.rangeEndChar);
            if (index2 >= 0) lineEnd = this.innerFocus.range[0] + index2;
          }
          this.innerFocus.range[1] = lineEnd;
        }
        const [start, end] = this.innerFocus.range;
        if (selectionStart >= start && selectionStart <= end && selectionEnd >= start && selectionEnd <= end) {
          if (!noTextChange) {
            this.updateSearch();
            this.setDirty = true;
          }
          return;
        }
        this.clearInnerFocus();
        value = textbox.value;
        selectionStart = textbox.selectionStart || 0;
        selectionEnd = textbox.selectionEnd || 0;
      }
      if (this.setDirty) {
        this.setDirty = false;
        noTextChange = false;
      }
      this.heightTester.style.width = `${textbox.offsetWidth}px`;
      let index = 0;
      let setIndex = null;
      let nextSetIndex = 0;
      if (!noTextChange) this.setInfo = [];
      this.selection = null;
      while (index < value.length) {
        let nlIndex = value.indexOf("\n", index);
        if (nlIndex < 0) nlIndex = value.length;
        const line = value.slice(index, nlIndex);
        if (!line.trim()) {
          setIndex = null;
          index = nlIndex + 1;
          continue;
        }
        if (setIndex === null && index && !noTextChange && this.setInfo.length) {
          this.setInfo[this.setInfo.length - 1].bottomY = this.getYAt(index - 1);
        }
        if (setIndex === null) {
          if (!noTextChange) {
            const atIndex = line.indexOf("@");
            let species = atIndex >= 0 ? line.slice(0, atIndex).trim() : line.trim();
            if (species.endsWith(" (M)") || species.endsWith(" (F)")) {
              species = species.slice(0, -4);
            }
            if (species.endsWith(")")) {
              const parenIndex = species.lastIndexOf(" (");
              if (parenIndex >= 0) {
                species = species.slice(parenIndex + 2, -1);
              }
            }
            this.setInfo.push({
              species,
              bottomY: -1,
              index
            });
          }
          setIndex = nextSetIndex;
          nextSetIndex++;
        }
        const selectionEndCutoff = selectionStart === selectionEnd ? nlIndex : nlIndex + 1;
        let start = index, end = index + line.length;
        if (index <= selectionStart && selectionEnd <= selectionEndCutoff) {
          let type = null;
          const lcLine = line.toLowerCase().trim();
          if (lcLine.startsWith("ability:")) {
            type = "ability";
          } else if (lcLine.startsWith("-")) {
            type = "move";
          } else if (!lcLine || lcLine.startsWith("level:") || lcLine.startsWith("gender:") || (lcLine + ":").startsWith("shiny:") || (lcLine + ":").startsWith("gigantamax:") || lcLine.startsWith("tera type:") || lcLine.startsWith("dynamax level:")) {
            type = "details";
          } else if (lcLine.startsWith("ivs:") || lcLine.startsWith("evs:") || lcLine.endsWith(" nature")) {
            type = "stats";
          } else {
            type = "pokemon";
            const atIndex = line.indexOf("@");
            if (atIndex >= 0) {
              if (selectionStart > index + atIndex) {
                type = "item";
                start = index + atIndex + 1;
              } else {
                end = index + atIndex;
                if (line.charAt(atIndex - 1) === "]" || line.charAt(atIndex - 2) === "]") {
                  type = "ability";
                }
              }
            }
          }
          if (typeof autoSelect === "string") autoSelect = autoSelect === type;
          this.selection = {
            setIndex,
            type,
            lineRange: [start, end],
            typeIndex: 0
          };
          if (autoSelect) this.engageFocus();
        }
        index = nlIndex + 1;
      }
      if (!noTextChange) {
        const end = value.endsWith("\n\n") ? value.length - 1 : value.length;
        const bottomY = this.getYAt(end, true);
        if (this.setInfo.length) {
          this.setInfo[this.setInfo.length - 1].bottomY = bottomY;
        }
        textbox.style.height = `${bottomY + 100}px`;
      }
      this.forceUpdate();
    };
    this.selectResult = (type, name, moveSlot) => {
      if (type === null) {
        this.resetScroll();
        this.forceUpdate();
      } else if (!type) {
        this.changeSet(this.innerFocus.type, "");
      } else {
        this.changeSet(type, name, moveSlot);
      }
    };
    this.changeCompat = (ev) => {
      const checkbox = ev.currentTarget;
      this.compat = checkbox.checked;
      this.editor.import(this.textbox.value);
      this.textbox.value = this.editor.export(this.compat);
      this.updateText();
    };
    this.clickDetails = (ev) => {
      const target = ev.currentTarget;
      const i = parseInt(target.value || "0");
      if (this.innerFocus?.type === target.name) {
        this.innerFocus = null;
        this.forceUpdate();
        return;
      }
      this.engageFocus({
        offsetY: null,
        setIndex: i,
        type: target.name,
        typeIndex: 0,
        range: [0, 0],
        rangeEndChar: ""
      });
    };
    this.addPokemon = () => {
      if (this.textbox.value && !this.textbox.value.endsWith("\n\n")) {
        this.textbox.value += this.textbox.value.endsWith("\n") ? "\n" : "\n\n";
      }
      const end = this.textbox.value === "\n\n" ? 0 : this.textbox.value.length;
      this.textbox.setSelectionRange(end, end);
      this.textbox.focus();
      this.engageFocus({
        offsetY: this.getYAt(end, true),
        setIndex: this.setInfo.length,
        type: "pokemon",
        typeIndex: 0,
        range: [end, end],
        rangeEndChar: "@"
      });
    };
    this.scrollResults = (ev) => {
      if (!ev.currentTarget.scrollTop) return;
      this.windowing = false;
      if (document.documentElement.clientWidth === document.documentElement.scrollWidth) {
        ev.currentTarget.scrollIntoViewIfNeeded?.();
      }
      this.forceUpdate();
    };
    this.handleSetChange = () => {
      if (this.selection) {
        this.replaceSet(this.selection.setIndex);
        this.forceUpdate();
      }
    };
    this.copyAll = (ev) => {
      this.textbox.select();
      document.execCommand("copy");
      const button = ev?.currentTarget;
      if (button) {
        button.innerHTML = '<i class="fa fa-check"></i> Copied';
        button.className += " cur";
      }
    };
  }
  static {
    this.EMPTY_PROMISE = Promise.resolve(null);
  }
  getYAt(index, fullLine) {
    if (index < 0) return 10;
    if (index === 0) return 31;
    const newValue = this.textbox.value.slice(0, index);
    this.heightTester.value = fullLine && !newValue.endsWith("\n") ? newValue + "\n" : newValue;
    return this.heightTester.scrollHeight;
  }
  openInnerFocus() {
    const oldRange = this.selection?.lineRange;
    this.updateText(true, true);
    if (this.selection) {
      if (this.selection.lineRange === oldRange) return !!this.innerFocus;
      if (this.textbox.selectionStart === this.textbox.selectionEnd) {
        const range = this.getSelectionTypeRange();
        if (range) this.textbox.setSelectionRange(range[0], range[1]);
      }
    }
    return !!this.innerFocus;
  }
  getInnerFocusValue() {
    if (!this.innerFocus) return "";
    return this.textbox.value.slice(this.innerFocus.range[0], this.innerFocus.range[1]);
  }
  clearInnerFocus() {
    if (this.innerFocus) {
      if (this.innerFocus.type === "pokemon") {
        const value = this.getInnerFocusValue();
        if (!(0, import_battle_dex.toID)(value)) {
          this.replaceNoFocus(this.editor.originalSpecies || "", this.innerFocus.range[0], this.innerFocus.range[1]);
        }
      }
      this.innerFocus = null;
    }
  }
  engageFocus(focus) {
    if (this.innerFocus && !focus) return;
    const editor = this.editor;
    if (editor.readonly) return;
    if (!focus) {
      if (!this.selection?.type) return;
      const range = this.getSelectionTypeRange();
      if (!range) return;
      const { type, setIndex } = this.selection;
      let rangeEndChar = this.textbox.value.charAt(range[1]);
      if (rangeEndChar === " ") rangeEndChar += this.textbox.value.charAt(range[1] + 1);
      focus = {
        offsetY: this.getYAt(range[0]),
        setIndex,
        type,
        typeIndex: this.selection.typeIndex,
        range,
        rangeEndChar
      };
    }
    this.innerFocus = focus;
    if (focus.type === "details" || focus.type === "stats") {
      this.forceUpdate();
      return;
    }
    const value = this.textbox.value.slice(focus.range[0], focus.range[1]);
    editor.setSearchType(focus.type, focus.setIndex, value);
    this.resetScroll();
    this.textbox.setSelectionRange(focus.range[0], focus.range[1]);
    this.forceUpdate();
  }
  updateSearch() {
    if (!this.innerFocus) return;
    const { range } = this.innerFocus;
    const editor = this.editor;
    const value = this.textbox.value.slice(range[0], range[1]);
    editor.setSearchValue(value);
    this.resetScroll();
    this.forceUpdate();
  }
  getSelectionTypeRange() {
    const selection = this.selection;
    if (!selection?.lineRange) return null;
    let [start, end] = selection.lineRange;
    let lcLine = this.textbox.value.slice(start, end).toLowerCase();
    if (lcLine.endsWith("  ")) {
      end -= 2;
      lcLine = lcLine.slice(0, -2);
    }
    switch (selection.type) {
      case "pokemon": {
        if (lcLine.endsWith(" ")) {
          lcLine = lcLine.slice(0, -1);
          end--;
        }
        if (lcLine.endsWith(" (m)") || lcLine.endsWith(" (f)")) {
          lcLine = lcLine.slice(0, -4);
          end -= 4;
        }
        if (lcLine.endsWith(")")) {
          const parenIndex = lcLine.lastIndexOf(" (");
          if (parenIndex >= 0) {
            start = start + parenIndex + 2;
            end--;
          }
        }
        return [start, end];
      }
      case "item": {
        if (lcLine.startsWith(" ")) start++;
        return [start, end];
      }
      case "ability": {
        if (lcLine.startsWith("[")) {
          start++;
          if (lcLine.endsWith(" ")) {
            end--;
            lcLine = lcLine.slice(0, -1);
          }
          if (lcLine.endsWith("]")) {
            end--;
          }
          return [start, end];
        }
        if (!lcLine.startsWith("ability:")) return null;
        start += lcLine.startsWith("ability: ") ? 9 : 8;
        return [start, end];
      }
      case "move": {
        if (!lcLine.startsWith("-")) return null;
        start += lcLine.startsWith("- ") ? 2 : 1;
        return [start, end];
      }
    }
    return [start, end];
  }
  changeSet(type, name, moveSlot) {
    const focus = this.innerFocus;
    if (!focus) return;
    if (type === focus.type && type !== "pokemon") {
      this.replace(name, focus.range[0], focus.range[1]);
      this.updateText(false, true);
      return;
    }
    switch (type) {
      case "pokemon": {
        const set = this.editor.sets[focus.setIndex] ||= {
          species: "",
          moves: []
        };
        this.editor.changeSpecies(set, name);
        this.replaceSet(focus.setIndex);
        this.updateText(false, true);
        break;
      }
      case "ability": {
        this.editor.sets[focus.setIndex].ability = name;
        this.replaceSet(focus.setIndex);
        this.updateText(false, true);
        break;
      }
    }
  }
  getSetRange(index) {
    if (!this.setInfo[index]) {
      if (this.innerFocus?.setIndex === index) {
        return this.innerFocus.range;
      }
      return [this.textbox.value.length, this.textbox.value.length];
    }
    const start = this.setInfo[index].index;
    const end = this.setInfo[index + 1].index;
    return [start, end];
  }
  replaceSet(index) {
    const editor = this.editor;
    const { team } = editor;
    if (!team) return;
    let newText = import_battle_teams.Teams.exportSet(editor.sets[index], editor.dex, !this.compat);
    const [start, end] = this.getSetRange(index);
    if (start && start === this.textbox.value.length && !this.textbox.value.endsWith("\n\n")) {
      newText = (this.textbox.value.endsWith("\n") ? "\n" : "\n\n") + newText;
    }
    this.replaceNoFocus(newText, start, end, start + newText.length);
    if (!this.setInfo[index]) {
      this.updateText();
      this.save();
    } else {
      if (this.setInfo[index + 1]) {
        this.setInfo[index + 1].index = start + newText.length;
      }
      this.setDirty = true;
    }
  }
  replace(text, start, end, selectionStart = start, selectionEnd = start + text.length) {
    const textbox = this.textbox;
    textbox.focus();
    textbox.setSelectionRange(start, end);
    document.execCommand("insertText", false, text);
    this.save();
  }
  replaceNoFocus(text, start, end, selectionStart = start, selectionEnd = start + text.length) {
    const textbox = this.textbox;
    const value = textbox.value;
    textbox.value = value.slice(0, start) + text + value.slice(end);
    textbox.setSelectionRange(selectionStart, selectionEnd);
    this.save();
  }
  save() {
    this.editor.import(this.textbox.value);
    this.props.onChange?.();
  }
  componentDidMount() {
    this.textbox = this.base.getElementsByClassName("teamtextbox")[0];
    this.heightTester = this.base.getElementsByClassName("heighttester")[0];
    this.editor = this.props.editor;
    const exportedTeam = this.editor.export(this.compat);
    this.textbox.value = exportedTeam;
    this.updateText();
    setTimeout(() => this.updateText());
  }
  componentWillUnmount() {
    this.textbox = null;
    this.heightTester = null;
  }
  resetScroll() {
    this.windowing = true;
    const searchResults = this.base.querySelector(".searchresults");
    if (searchResults) searchResults.scrollTop = 0;
  }
  windowResults() {
    if (this.windowing) {
      return Math.ceil(window.innerHeight / 33);
    }
    return null;
  }
  renderDetails(set, i) {
    const editor = this.editor;
    const species = editor.dex.species.get(set.species);
    const GenderChart = {
      "M": "Male",
      "F": "Female",
      "N": "\u2014"
      // em dash
    };
    const gender = GenderChart[set.gender || species.gender || "N"];
    return /* @__PURE__ */ Chat.h("button", { class: "textbox setdetails", name: "details", value: i, onClick: this.clickDetails }, /* @__PURE__ */ Chat.h("span", { class: "detailcell" }, /* @__PURE__ */ Chat.h("label", null, "Level"), set.level || editor.defaultLevel), /* @__PURE__ */ Chat.h("span", { class: "detailcell" }, /* @__PURE__ */ Chat.h("label", null, "Shiny"), set.shiny ? "Yes" : "\u2014"), editor.gen === 9 ? /* @__PURE__ */ Chat.h("span", { class: "detailcell" }, /* @__PURE__ */ Chat.h("label", null, "Tera"), TeamEditor.renderTypeIcon(set.teraType || species.requiredTeraType || species.types[0])) : editor.hpTypeMatters(set) ? /* @__PURE__ */ Chat.h("span", { class: "detailcell" }, /* @__PURE__ */ Chat.h("label", null, "H. Power"), TeamEditor.renderTypeIcon(editor.getHPType(set))) : /* @__PURE__ */ Chat.h("span", { class: "detailcell" }, /* @__PURE__ */ Chat.h("label", null, "Gender"), gender));
  }
  renderStats(set, i) {
    const editor = this.editor;
    return /* @__PURE__ */ Chat.h("button", { class: "textbox setstats", name: "stats", value: i, onClick: this.clickDetails }, StatForm.renderStatGraph(set, editor));
  }
  bottomY() {
    return this.setInfo[this.setInfo.length - 1]?.bottomY ?? 8;
  }
  render() {
    const editor = this.props.editor;
    const statsDetailsOffset = editor.gen >= 3 ? 18 : -1;
    return /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.copyAll }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-copy", "aria-hidden": true }), " Copy"), " ", /* @__PURE__ */ Chat.h("label", { class: "checkbox inline" }, /* @__PURE__ */ Chat.h("input", { type: "checkbox", name: "compat", onChange: this.changeCompat }), " Old export format")), /* @__PURE__ */ Chat.h("div", { class: "teameditor-text" }, /* @__PURE__ */ Chat.h(
      "textarea",
      {
        class: "textbox teamtextbox",
        style: `padding-left:${editor.narrow ? "50px" : "100px"}`,
        onInput: this.input,
        onContextMenu: this.contextMenu,
        onKeyUp: this.keyUp,
        onKeyDown: this.keyDown,
        onClick: this.keyUp,
        onChange: this.maybeReplaceLine,
        placeholder: " Paste exported teams, pokepaste URLs, or JSON here",
        readOnly: editor.readonly
      }
    ), /* @__PURE__ */ Chat.h(
      "textarea",
      {
        class: "textbox teamtextbox heighttester",
        tabIndex: -1,
        "aria-hidden": true,
        style: `padding-left:${editor.narrow ? "50px" : "100px"};visibility:hidden;left:-15px`
      }
    ), /* @__PURE__ */ Chat.h("div", { class: "teamoverlays" }, this.setInfo.slice(0, -1).map(
      (info) => /* @__PURE__ */ Chat.h("hr", { style: `top:${info.bottomY - 18}px;pointer-events:none` })
    ), editor.canAdd() && !!this.setInfo.length && /* @__PURE__ */ Chat.h("hr", { style: `top:${this.bottomY() - 18}px` }), this.setInfo.map((info, i) => {
      if (!info.species) return null;
      const set = editor.sets[i];
      if (!set) return null;
      const prevOffset = i === 0 ? 8 : this.setInfo[i - 1].bottomY;
      const species = editor.dex.species.get(info.species);
      const num = import_battle_dex.Dex.getPokemonIconNum(species.id);
      if (!num) return null;
      const top = Math.floor(num / 12) * 30;
      const left = num % 12 * 40;
      const iconStyle = `background:transparent url(${import_battle_dex.Dex.resourcePrefix}sprites/pokemonicons-sheet.png) no-repeat scroll -${left}px -${top}px`;
      const itemStyle = set.item && import_battle_dex.Dex.getItemIcon(editor.dex.items.get(set.item));
      if (editor.narrow) {
        return /* @__PURE__ */ Chat.h("div", { style: `top:${prevOffset + 1}px;left:5px;position:absolute;text-align:center;pointer-events:none` }, /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("span", { class: "picon", style: iconStyle })), species.types.map((type) => /* @__PURE__ */ Chat.h("div", null, TeamEditor.renderTypeIcon(type))), /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("span", { class: "itemicon", style: itemStyle })));
      }
      return [/* @__PURE__ */ Chat.h(
        "div",
        {
          style: `top:${prevOffset - 7}px;left:0;position:absolute;text-align:right;width:94px;padding:103px 5px 0 0;min-height:24px;pointer-events:none;` + import_battle_dex.Dex.getTeambuilderSprite(set, editor.dex)
        },
        /* @__PURE__ */ Chat.h("div", null, species.types.map((type) => TeamEditor.renderTypeIcon(type)), /* @__PURE__ */ Chat.h("span", { class: "itemicon", style: itemStyle }))
      ), /* @__PURE__ */ Chat.h("div", { style: `top:${prevOffset + statsDetailsOffset}px;right:9px;position:absolute` }, this.renderStats(set, i)), /* @__PURE__ */ Chat.h("div", { style: `top:${prevOffset + statsDetailsOffset}px;right:145px;position:absolute` }, this.renderDetails(set, i))];
    }), editor.canAdd() && !(this.innerFocus && this.innerFocus.setIndex >= this.setInfo.length) && /* @__PURE__ */ Chat.h("div", { style: `top:${this.bottomY() - 3}px;left:${editor.narrow ? 55 : 105}px;position:absolute` }, /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.addPokemon }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-plus", "aria-hidden": true }), " Add Pok\xE9mon")), this.innerFocus?.offsetY != null && /* @__PURE__ */ Chat.h(
      "div",
      {
        class: `teaminnertextbox teaminnertextbox-${this.innerFocus.type}`,
        style: `top:${this.innerFocus.offsetY - 21}px;left:${editor.narrow ? 46 : 96}px;`
      }
    )), this.innerFocus && /* @__PURE__ */ Chat.h(
      "div",
      {
        class: "searchresults",
        style: `top:${(this.setInfo[this.innerFocus.setIndex]?.bottomY ?? this.bottomY() + 50) - 12}px`,
        onScroll: this.scrollResults
      },
      /* @__PURE__ */ Chat.h("button", { class: "button closesearch", onClick: this.closeMenu }, !editor.narrow && /* @__PURE__ */ Chat.h("kbd", null, "Esc"), " ", /* @__PURE__ */ Chat.h("i", { class: "fa fa-times", "aria-hidden": true }), " Close"),
      this.innerFocus.type === "stats" ? /* @__PURE__ */ Chat.h(StatForm, { editor, set: this.editor.sets[this.innerFocus.setIndex], onChange: this.handleSetChange }) : this.innerFocus.type === "details" ? /* @__PURE__ */ Chat.h(DetailsForm, { editor, set: this.editor.sets[this.innerFocus.setIndex], onChange: this.handleSetChange }) : /* @__PURE__ */ Chat.h(
        import_battle_searchresults.PSSearchResults,
        {
          search: editor.search,
          resultIndex: editor.searchIndex,
          windowing: this.windowResults(),
          onSelect: this.selectResult
        }
      )
    )));
  }
}
class TeamWizard extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.setSearchBox = null;
    this.windowing = true;
    this.setFocus = (ev) => {
      const { editor } = this.props;
      if (editor.readonly) return;
      const target = ev.currentTarget;
      const [rawType, i] = (target.value || "").split("|");
      const setIndex = parseInt(i);
      const type = rawType;
      if (!target.value || editor.innerFocus && editor.innerFocus.setIndex === setIndex && editor.innerFocus.type === type) {
        this.changeFocus(null);
        return;
      }
      this.changeFocus({
        setIndex,
        type
      });
    };
    this.deleteSet = (ev) => {
      const target = ev.currentTarget;
      const i = parseInt(target.value);
      const { editor } = this.props;
      editor.deleteSet(i);
      if (editor.innerFocus) {
        this.changeFocus({
          setIndex: editor.sets.length,
          type: "pokemon"
        });
      }
      this.handleSetChange();
      ev.preventDefault();
    };
    this.undeleteSet = (ev) => {
      const { editor } = this.props;
      const setIndex = editor.deletedSet?.index;
      editor.undeleteSet();
      if (editor.innerFocus && setIndex !== void 0) {
        this.changeFocus({
          setIndex,
          type: "pokemon"
        });
      }
      this.handleSetChange();
      ev.preventDefault();
    };
    this.handleSetChange = () => {
      this.props.editor.save();
      this.props.onChange?.();
      this.forceUpdate();
    };
    this.selectResult = (type, name, slot, reverse) => {
      const { editor } = this.props;
      this.clearSearchBox();
      if (type === null) {
        this.resetScroll();
        this.forceUpdate();
      }
      if (!type) {
        editor.setSearchValue("");
        this.resetScroll();
        this.forceUpdate();
      } else {
        const setIndex = editor.innerFocus.setIndex;
        const set = editor.sets[setIndex] ||= { species: "", moves: [] };
        switch (type) {
          case "pokemon":
            editor.changeSpecies(set, name);
            this.changeFocus({
              setIndex,
              type: reverse ? "details" : "ability"
            });
            break;
          case "ability":
            if (name === "No Ability" && editor.gen <= 2) name = "";
            set.ability = name;
            this.changeFocus({
              setIndex,
              type: reverse ? "pokemon" : "item"
            });
            break;
          case "item":
            set.item = name;
            this.changeFocus({
              setIndex,
              type: reverse ? "ability" : "move"
            });
            break;
          case "move":
            if (slot) {
              const i = parseInt(slot) - 1;
              if (set.moves[i]) {
                set.moves[i] = "";
                if (i === set.moves.length - 1) {
                  while (set.moves.length > 4 && !set.moves[set.moves.length - 1]) {
                    set.moves.pop();
                  }
                }
                if (set.moves.length > 4 && i < set.moves.length - 1) {
                  set.moves[i] = set.moves.pop();
                }
              }
            } else if (set.moves.includes(name)) {
              set.moves.splice(set.moves.indexOf(name), 1);
            } else {
              for (let i = 0; i < set.moves.length + 1; i++) {
                if (!set.moves[i]) {
                  set.moves[i] = name;
                  break;
                }
              }
            }
            if (set.moves.length === 4 && set.moves.every(Boolean)) {
              this.changeFocus({
                setIndex,
                type: reverse ? "item" : "stats"
              });
            } else {
              if (editor.search.query) {
                this.resetScroll();
              }
              editor.updateSearchMoves(set);
            }
            break;
        }
        editor.save();
        this.props.onChange?.();
        this.forceUpdate();
      }
    };
    this.updateSearch = (ev) => {
      const searchBox = ev.currentTarget;
      this.props.editor.setSearchValue(searchBox.value);
      this.resetScroll();
      this.forceUpdate();
    };
    this.handleClickFilters = (ev) => {
      const search = this.props.editor.search;
      let target = ev.target;
      while (target && target.className !== "dexlist") {
        if (target.tagName === "BUTTON") {
          const filter = target.getAttribute("data-filter");
          if (filter) {
            search.removeFilter(filter.split(":"));
            const searchBox = this.base.querySelector("input[name=value]");
            search.find(searchBox?.value || "");
            if (!TeamEditor.probablyMobile()) searchBox?.select();
            this.forceUpdate();
            ev.preventDefault();
            ev.stopPropagation();
            break;
          }
        }
        target = target.parentElement;
      }
    };
    this.keyDownSearch = (ev) => {
      const searchBox = ev.currentTarget;
      const { editor } = this.props;
      switch (ev.keyCode) {
        case 8:
          if (searchBox.selectionStart === 0 && searchBox.selectionEnd === 0) {
            editor.search.removeFilter();
            editor.setSearchValue(searchBox.value);
            this.resetScroll();
            this.forceUpdate();
          }
          break;
        case 38:
          editor.upSearchValue();
          const resultsUp = this.base.querySelector(".wizardsearchresults");
          if (resultsUp) {
            resultsUp.scrollTop = Math.max(0, editor.searchIndex * 33 - Math.trunc((window.innerHeight - 300) / 2));
          }
          this.forceUpdate();
          ev.preventDefault();
          break;
        case 40:
          editor.downSearchValue();
          const resultsDown = this.base.querySelector(".wizardsearchresults");
          if (resultsDown) {
            resultsDown.scrollTop = Math.max(0, editor.searchIndex * 33 - Math.trunc((window.innerHeight - 300) / 2));
          }
          this.forceUpdate();
          ev.preventDefault();
          break;
        case 37:
          ev.stopImmediatePropagation();
          break;
        case 39:
          ev.stopImmediatePropagation();
          break;
        case 13:
        // enter
        case 9:
          const value = editor.selectSearchValue();
          if (editor.innerFocus?.type !== "move") searchBox.value = value || "";
          if (value !== null) {
            if (ev.keyCode === 9 && editor.innerFocus?.type === "move") {
              this.changeFocus({
                setIndex: editor.innerFocus.setIndex,
                type: ev.shiftKey ? "item" : "stats"
              });
            } else {
              const [name, moveSlot] = value.split("|");
              this.selectResult(editor.innerFocus?.type || "", name, moveSlot, ev.keyCode === 9 && ev.shiftKey);
            }
          } else {
            this.clearSearchBox();
            editor.setSearchValue("");
            this.resetScroll();
            this.forceUpdate();
          }
          ev.preventDefault();
          break;
      }
    };
    this.scrollResults = (ev) => {
      if (!ev.currentTarget.scrollTop) return;
      this.windowing = false;
      if (document.documentElement.clientWidth === document.documentElement.scrollWidth) {
        ev.currentTarget.scrollIntoViewIfNeeded?.();
      }
      this.forceUpdate();
    };
  }
  changeFocus(focus) {
    const { editor } = this.props;
    editor.innerFocus = focus;
    if (!focus) {
      this.props.onUpdate();
      return;
    }
    const set = editor.sets[focus.setIndex];
    if (focus.type === "details") {
      this.setSearchBox = set.name || "";
    } else if (focus.type !== "stats") {
      let value;
      if (focus.type === "pokemon") value = set?.species || "";
      else if (focus.type === "item") value = set.item;
      else if (focus.type === "ability") value = set.ability;
      editor.setSearchType(focus.type, focus.setIndex, value);
      this.resetScroll();
      this.setSearchBox = value || "";
    }
    this.props.onUpdate();
  }
  renderSet(set, i) {
    const { editor } = this.props;
    const sprite = import_battle_dex.Dex.getTeambuilderSprite(set, editor.dex);
    if (!set) {
      return /* @__PURE__ */ Chat.h("div", { class: "set-button" }, /* @__PURE__ */ Chat.h("div", { style: "text-align:right" }, editor.deletedSet ? /* @__PURE__ */ Chat.h("button", { onClick: this.undeleteSet, class: "option" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-undo", "aria-hidden": true }), " Undo delete") : /* @__PURE__ */ Chat.h("button", { class: "option", style: "visibility:hidden" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-trash", "aria-hidden": true }), " Delete")), /* @__PURE__ */ Chat.h("table", null, /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { rowSpan: 2, class: "set-pokemon" }, /* @__PURE__ */ Chat.h("div", { class: "border-collapse" }, /* @__PURE__ */ Chat.h("button", { class: "button button-first cur", onClick: this.setFocus, value: `pokemon|${i}` }, /* @__PURE__ */ Chat.h("span", { class: "sprite", style: sprite }, /* @__PURE__ */ Chat.h("span", { class: "sprite-inner" }, /* @__PURE__ */ Chat.h("strong", { class: "label" }, "Pokemon"), " ", /* @__PURE__ */ Chat.h("em", null, "(choose species)")))))), /* @__PURE__ */ Chat.h("td", { colSpan: 2, class: "set-details" }), /* @__PURE__ */ Chat.h("td", { rowSpan: 2, class: "set-moves" }), /* @__PURE__ */ Chat.h("td", { rowSpan: 2, class: "set-stats" })), /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { class: "set-ability" }), /* @__PURE__ */ Chat.h("td", { class: "set-item" }))));
    }
    while (set.moves.length < 4) set.moves.push("");
    const overfull = set.moves.length > 4 ? " overfull" : "";
    const cur = (t) => editor.readonly || editor.innerFocus?.type === t && editor.innerFocus.setIndex === i ? " cur" : "";
    const species = editor.dex.species.get(set.species);
    return /* @__PURE__ */ Chat.h("div", { class: "set-button" }, /* @__PURE__ */ Chat.h("div", { style: "text-align:right" }, /* @__PURE__ */ Chat.h("button", { class: "option", onClick: this.deleteSet, value: i, style: editor.readonly ? "visibility:hidden" : "" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-trash", "aria-hidden": true }), " Delete")), /* @__PURE__ */ Chat.h("table", null, /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { rowSpan: 2, class: "set-pokemon" }, /* @__PURE__ */ Chat.h("div", { class: "border-collapse" }, /* @__PURE__ */ Chat.h("button", { class: `button button-first${cur("pokemon")}`, onClick: this.setFocus, value: `pokemon|${i}` }, /* @__PURE__ */ Chat.h("span", { class: "sprite", style: sprite }, /* @__PURE__ */ Chat.h("span", { class: "sprite-inner" }, /* @__PURE__ */ Chat.h("strong", { class: "label" }, "Pokemon"), " ", set.species))))), /* @__PURE__ */ Chat.h("td", { colSpan: 2, class: "set-details" }, /* @__PURE__ */ Chat.h("div", { class: "border-collapse" }, /* @__PURE__ */ Chat.h("button", { class: `button button-middle${cur("details")}`, onClick: this.setFocus, value: `details|${i}` }, /* @__PURE__ */ Chat.h("span", { class: "detailcell" }, /* @__PURE__ */ Chat.h("strong", { class: "label" }, "Types"), " ", species.types.map((type) => /* @__PURE__ */ Chat.h("div", null, TeamEditor.renderTypeIcon(type)))), /* @__PURE__ */ Chat.h("span", { class: "detailcell" }, /* @__PURE__ */ Chat.h("strong", { class: "label" }, "Level"), " ", set.level || editor.defaultLevel, editor.narrow && set.shiny && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("img", { src: `${import_battle_dex.Dex.resourcePrefix}sprites/misc/shiny.png`, width: 22, height: 22, alt: "Shiny" })), !editor.narrow && set.gender && set.gender !== "N" && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h(
      "img",
      {
        src: `${import_battle_dex.Dex.fxPrefix}gender-${set.gender.toLowerCase()}.png`,
        alt: set.gender,
        width: "7",
        height: "10",
        class: "pixelated"
      }
    ))), !!(!editor.narrow && (set.shiny || editor.gen >= 2)) && /* @__PURE__ */ Chat.h("span", { class: "detailcell" }, /* @__PURE__ */ Chat.h("strong", { class: "label" }, "Shiny"), " ", set.shiny ? /* @__PURE__ */ Chat.h("img", { src: `${import_battle_dex.Dex.resourcePrefix}sprites/misc/shiny.png`, width: 22, height: 22, alt: "Yes" }) : "\u2014"), editor.gen === 9 && /* @__PURE__ */ Chat.h("span", { class: "detailcell" }, /* @__PURE__ */ Chat.h("strong", { class: "label" }, "Tera"), " ", TeamEditor.renderTypeIcon(set.teraType || species.requiredTeraType || species.types[0])), editor.hpTypeMatters(set) && /* @__PURE__ */ Chat.h("span", { class: "detailcell" }, /* @__PURE__ */ Chat.h("strong", { class: "label" }, "H.P."), " ", TeamEditor.renderTypeIcon(editor.getHPType(set)))))), /* @__PURE__ */ Chat.h("td", { rowSpan: 2, class: "set-moves" }, /* @__PURE__ */ Chat.h("div", { class: "border-collapse" }, /* @__PURE__ */ Chat.h("button", { class: `button button-middle${cur("move")}${overfull}`, onClick: this.setFocus, value: `move|${i}` }, /* @__PURE__ */ Chat.h("strong", { class: "label" }, "Moves"), " ", set.moves.map((move, mi) => /* @__PURE__ */ Chat.h("div", null, !editor.narrow && /* @__PURE__ */ Chat.h("small", { class: "gray" }, "\u2022"), mi >= 4 ? /* @__PURE__ */ Chat.h("span", { class: "message-error" }, move || editor.narrow && "-" || "") : move || editor.narrow && "-")), !set.moves.length && /* @__PURE__ */ Chat.h("em", null, "(no moves)")))), /* @__PURE__ */ Chat.h("td", { rowSpan: 2, class: "set-stats" }, /* @__PURE__ */ Chat.h("div", { class: "border-collapse" }, /* @__PURE__ */ Chat.h("button", { class: `button button-last${cur("stats")}`, onClick: this.setFocus, value: `stats|${i}` }, StatForm.renderStatGraph(set, this.props.editor, true))))), /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { class: "set-ability" }, /* @__PURE__ */ Chat.h("div", { class: "border-collapse" }, /* @__PURE__ */ Chat.h("button", { class: `button button-middle${cur("ability")}`, onClick: this.setFocus, value: `ability|${i}` }, (editor.gen >= 3 || set.ability) && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("strong", { class: "label" }, "Ability"), " ", set.ability !== "No Ability" && set.ability || (!set.ability ? /* @__PURE__ */ Chat.h("em", null, "(choose ability)") : /* @__PURE__ */ Chat.h("em", null, "(no ability)")))))), /* @__PURE__ */ Chat.h("td", { class: "set-item" }, /* @__PURE__ */ Chat.h("div", { class: "border-collapse" }, /* @__PURE__ */ Chat.h("button", { class: `button button-middle${cur("item")}`, onClick: this.setFocus, value: `item|${i}` }, (editor.gen >= 2 || set.item) && /* @__PURE__ */ Chat.h(Chat.Fragment, null, set.item && /* @__PURE__ */ Chat.h("span", { class: "itemicon", style: "float:right;" + import_battle_dex.Dex.getItemIcon(set.item) }), /* @__PURE__ */ Chat.h("strong", { class: "label" }, "Item"), " ", set.item || /* @__PURE__ */ Chat.h("em", null, "(no item)"))))))), /* @__PURE__ */ Chat.h("button", { class: `button set-nickname${cur("details")}`, onClick: this.setFocus, value: `details|${i}` }, /* @__PURE__ */ Chat.h("strong", { class: "label" }, "Nickname"), " ", editor.getNickname(set)));
  }
  clearSearchBox() {
    const searchBox = this.base.querySelector("input[name=value]");
    if (searchBox) {
      searchBox.value = "";
      if (!TeamEditor.probablyMobile()) searchBox.focus();
    }
  }
  resetScroll() {
    this.windowing = true;
    const searchResults = this.base.querySelector(".wizardsearchresults");
    if (searchResults) searchResults.scrollTop = 0;
  }
  windowResults() {
    if (this.windowing) {
      return Math.ceil(window.innerHeight / 33);
    }
    return null;
  }
  componentDidUpdate() {
    const searchBox = this.base.querySelector("input[name=value], input[name=nickname]");
    if (this.setSearchBox !== null) {
      if (searchBox) {
        searchBox.value = this.setSearchBox;
        if (!TeamEditor.probablyMobile()) searchBox.select();
      }
      this.setSearchBox = null;
    }
    const filters = this.base.querySelector(".dexlist-filters");
    if (searchBox && searchBox.name === "value") {
      if (filters) {
        const { width } = filters.getBoundingClientRect();
        searchBox.style.paddingLeft = `${width + 5}px`;
      } else {
        searchBox.style.paddingLeft = `3px`;
      }
    }
  }
  renderInnerFocus() {
    const { editor } = this.props;
    if (!editor.innerFocus) return null;
    const { type, setIndex } = editor.innerFocus;
    const set = this.props.editor.sets[setIndex];
    const cur = (i) => setIndex === i ? " cur" : "";
    return /* @__PURE__ */ Chat.h("div", { class: "team-focus-editor" }, /* @__PURE__ */ Chat.h("ul", { class: "tabbar" }, /* @__PURE__ */ Chat.h("li", { class: "home-li" }, /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.setFocus }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-chevron-left", "aria-hidden": true }), " Back")), editor.sets.map((curSet, i) => /* @__PURE__ */ Chat.h("li", null, /* @__PURE__ */ Chat.h(
      "button",
      {
        class: `button picontab${cur(i)}`,
        onClick: this.setFocus,
        value: `${type}|${i}`
      },
      /* @__PURE__ */ Chat.h("span", { class: "picon", style: import_battle_dex.Dex.getPokemonIcon(curSet) }),
      /* @__PURE__ */ Chat.h("br", null),
      editor.getNickname(curSet)
    ))), editor.canAdd() && /* @__PURE__ */ Chat.h("li", null, /* @__PURE__ */ Chat.h(
      "button",
      {
        class: `button picontab${cur(editor.sets.length)}`,
        onClick: this.setFocus,
        value: `pokemon|${editor.sets.length}`
      },
      /* @__PURE__ */ Chat.h("i", { class: "fa fa-plus" })
    ))), /* @__PURE__ */ Chat.h("div", { class: "pad", style: "padding-top:0" }, this.renderSet(set, setIndex)), type === "stats" ? /* @__PURE__ */ Chat.h(StatForm, { editor, set, onChange: this.handleSetChange }) : type === "details" ? /* @__PURE__ */ Chat.h(DetailsForm, { editor, set, onChange: this.handleSetChange }) : /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("div", { class: "searchboxwrapper pad", onClick: this.handleClickFilters }, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "search",
        name: "value",
        class: "textbox",
        placeholder: "Search or filter",
        onInput: this.updateSearch,
        onKeyDown: this.keyDownSearch,
        autocomplete: "off"
      }
    ), import_battle_searchresults.PSSearchResults.renderFilters(editor.search)), /* @__PURE__ */ Chat.h("div", { class: "wizardsearchresults", onScroll: this.scrollResults }, /* @__PURE__ */ Chat.h(
      import_battle_searchresults.PSSearchResults,
      {
        search: editor.search,
        hideFilters: true,
        resultIndex: editor.searchIndex,
        onSelect: this.selectResult,
        windowing: this.windowResults()
      }
    ))));
  }
  render() {
    const { editor } = this.props;
    if (editor.innerFocus) return this.renderInnerFocus();
    if (editor.fetching) {
      return /* @__PURE__ */ Chat.h("div", { class: "teameditor" }, "Fetching Paste...");
    }
    const deletedSet = (i) => editor.deletedSet?.index === i ? /* @__PURE__ */ Chat.h("p", { style: "text-align:right" }, /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.undeleteSet }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-undo", "aria-hidden": true }), " Undo delete")) : null;
    return /* @__PURE__ */ Chat.h("div", { class: "teameditor" }, editor.sets.map((set, i) => [
      deletedSet(i),
      this.renderSet(set, i)
    ]), deletedSet(editor.sets.length), editor.canAdd() && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button big", onClick: this.setFocus, value: `pokemon|${editor.sets.length}` }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-plus", "aria-hidden": true }), " Add Pok\xE9mon")));
  }
}
class StatForm extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.handleGuess = () => {
      const { editor, set } = this.props;
      const team = editor.team;
      const guess = new import_battle_tooltips.BattleStatGuesser(team.format).guess(set);
      set.evs = guess.evs;
      this.plus = guess.plusStat || null;
      this.minus = guess.minusStat || null;
      this.updateNatureFromPlusMinus();
      this.props.onChange();
    };
    this.handleOptimize = () => {
      const { editor, set } = this.props;
      const team = editor.team;
      const optimized = (0, import_battle_tooltips.BattleStatOptimizer)(set, team.format);
      if (!optimized) return;
      set.evs = optimized.evs;
      this.plus = optimized.plus || null;
      this.minus = optimized.minus || null;
      this.props.onChange();
    };
    this.plus = null;
    this.minus = null;
    this.changeEV = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      const statID = target.name.split("-")[1];
      let value = Math.abs(parseInt(target.value));
      if (isNaN(value)) {
        if (set.evs) delete set.evs[statID];
      } else {
        set.evs ||= {};
        set.evs[statID] = value;
      }
      if (target.type === "range") {
        const maxEv = this.maxEVs();
        if (maxEv < 6 * 252) {
          let totalEv = 0;
          for (const curEv of Object.values(set.evs || {})) totalEv += curEv;
          if (totalEv > maxEv && totalEv - value <= maxEv) {
            set.evs[statID] = maxEv - (totalEv - value) - maxEv % 4;
          }
        }
      } else {
        if (target.value.includes("+")) {
          if (statID === "hp") {
            alert("Natures cannot raise or lower HP.");
            return;
          }
          this.plus = statID;
        } else if (this.plus === statID) {
          this.plus = null;
        }
        if (target.value.includes("-")) {
          if (statID === "hp") {
            alert("Natures cannot raise or lower HP.");
            return;
          }
          this.minus = statID;
        } else if (this.minus === statID) {
          this.minus = null;
        }
        this.updateNatureFromPlusMinus();
      }
      this.props.onChange();
    };
    this.updateNatureFromPlusMinus = () => {
      const { set } = this.props;
      if (!this.plus || !this.minus) {
        delete set.nature;
      } else {
        for (const i in import_battle_dex_data.BattleNatures) {
          if (import_battle_dex_data.BattleNatures[i].plus === this.plus && import_battle_dex_data.BattleNatures[i].minus === this.minus) {
            set.nature = i;
            break;
          }
        }
      }
    };
    this.changeIV = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      const statID = target.name.split("-")[1];
      const value = this.dvToIv(target.value);
      if (value === null) {
        if (set.ivs) {
          delete set.ivs[statID];
          if (Object.values(set.ivs).every((iv) => iv === void 0)) {
            set.ivs = void 0;
          }
        }
      } else {
        set.ivs ||= { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
        set.ivs[statID] = value;
      }
      this.props.onChange();
    };
    this.changeNature = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      const nature = target.value;
      if (nature === "Serious") {
        delete set.nature;
      } else {
        set.nature = nature;
      }
      this.props.onChange();
    };
    this.changeIVSpread = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      if (!target.value) return;
      if (target.value === "auto") {
        set.ivs = void 0;
      } else {
        const [hp, atk, def, spa, spd, spe] = target.value.split("/").map(Number);
        set.ivs = { hp, atk, def, spa, spd, spe };
      }
      this.props.onChange();
    };
  }
  static renderStatGraph(set, editor, evs) {
    const defaultEV = editor.gen > 2 ? 0 : 252;
    const ivs = editor.getIVs(set);
    return import_battle_dex.Dex.statNames.map((statID) => {
      if (statID === "spd" && editor.gen === 1) return null;
      const stat = editor.getStat(statID, set, ivs[statID]);
      let ev = set.evs?.[statID] ?? defaultEV;
      let width = stat * 75 / 504;
      if (statID === "hp") width = stat * 75 / 704;
      if (width > 75) width = 75;
      let hue = Math.floor(stat * 180 / 714);
      if (hue > 360) hue = 360;
      const statName = editor.gen === 1 && statID === "spa" ? "Spc" : import_battle_dex_data.BattleStatNames[statID];
      if (evs && !ev && !set.evs && statID === "hp") ev = "EVs";
      return /* @__PURE__ */ Chat.h("span", { class: "statrow" }, /* @__PURE__ */ Chat.h("label", null, statName), " ", /* @__PURE__ */ Chat.h("span", { class: "statgraph" }, /* @__PURE__ */ Chat.h("span", { style: `width:${width}px;background:hsl(${hue},40%,75%);border-color:hsl(${hue},40%,45%)` })), " ", !evs && /* @__PURE__ */ Chat.h("em", null, stat), evs && /* @__PURE__ */ Chat.h("em", null, ev || ""), evs && (import_battle_dex_data.BattleNatures[set.nature]?.plus === statID ? /* @__PURE__ */ Chat.h("small", null, "+") : import_battle_dex_data.BattleNatures[set.nature]?.minus === statID ? /* @__PURE__ */ Chat.h("small", null, "\u2212") : null));
    });
  }
  renderIVMenu() {
    const { editor, set } = this.props;
    if (editor.gen <= 2) return null;
    const hpType = editor.getHPMove(set);
    const hpIVdata = hpType && !editor.canHyperTrain(set) && editor.getHPIVs(hpType) || null;
    const autoSpread = set.ivs && editor.defaultIVs(set, false);
    const autoSpreadValue = autoSpread && Object.values(autoSpread).join("/");
    if (!hpIVdata) {
      return /* @__PURE__ */ Chat.h("select", { name: "ivspread", class: "button", onChange: this.changeIVSpread }, /* @__PURE__ */ Chat.h("option", { value: "", selected: true }, "IV spreads"), autoSpreadValue && /* @__PURE__ */ Chat.h("option", { value: "auto" }, "Auto (", autoSpreadValue, ")"), /* @__PURE__ */ Chat.h("optgroup", { label: "min Atk" }, /* @__PURE__ */ Chat.h("option", { value: "31/0/31/31/31/31" }, "31/0/31/31/31/31")), /* @__PURE__ */ Chat.h("optgroup", { label: "min Atk, min Spe" }, /* @__PURE__ */ Chat.h("option", { value: "31/0/31/31/31/0" }, "31/0/31/31/31/0")), /* @__PURE__ */ Chat.h("optgroup", { label: "max all" }, /* @__PURE__ */ Chat.h("option", { value: "31/31/31/31/31/31" }, "31/31/31/31/31/31")), /* @__PURE__ */ Chat.h("optgroup", { label: "min Spe" }, /* @__PURE__ */ Chat.h("option", { value: "31/31/31/31/31/0" }, "31/31/31/31/31/0")));
    }
    const minStat = editor.gen >= 6 ? 0 : 2;
    const hpIVs = hpIVdata.map((ivs) => ivs.split("").map((iv) => parseInt(iv)));
    return /* @__PURE__ */ Chat.h("select", { name: "ivspread", class: "button", onChange: this.changeIVSpread }, /* @__PURE__ */ Chat.h("option", { value: "", selected: true }, "Hidden Power ", hpType, " IVs"), autoSpreadValue && /* @__PURE__ */ Chat.h("option", { value: "auto" }, "Auto (", autoSpreadValue, ")"), /* @__PURE__ */ Chat.h("optgroup", { label: "min Atk" }, hpIVs.map((ivs) => {
      const spread = ivs.map((iv, i) => (i === 1 ? minStat : 30) + iv).join("/");
      return /* @__PURE__ */ Chat.h("option", { value: spread }, spread);
    })), /* @__PURE__ */ Chat.h("optgroup", { label: "min Atk, min Spe" }, hpIVs.map((ivs) => {
      const spread = ivs.map((iv, i) => (i === 5 || i === 1 ? minStat : 30) + iv).join("/");
      return /* @__PURE__ */ Chat.h("option", { value: spread }, spread);
    })), /* @__PURE__ */ Chat.h("optgroup", { label: "max all" }, hpIVs.map((ivs) => {
      const spread = ivs.map((iv) => 30 + iv).join("/");
      return /* @__PURE__ */ Chat.h("option", { value: spread }, spread);
    })), /* @__PURE__ */ Chat.h("optgroup", { label: "min Spe" }, hpIVs.map((ivs) => {
      const spread = ivs.map((iv, i) => (i === 5 ? minStat : 30) + iv).join("/");
      return /* @__PURE__ */ Chat.h("option", { value: spread }, spread);
    })));
  }
  smogdexLink(s) {
    const { editor } = this.props;
    const species = editor.dex.species.get(s);
    let format = editor.format;
    let smogdexid = (0, import_battle_dex.toID)(species.baseSpecies);
    if (species.id === "meowstic") {
      smogdexid = "meowstic-m";
    } else if (species.forme) {
      switch (species.baseSpecies) {
        case "Alcremie":
        case "Basculin":
        case "Burmy":
        case "Castform":
        case "Cherrim":
        case "Deerling":
        case "Flabebe":
        case "Floette":
        case "Florges":
        case "Furfrou":
        case "Gastrodon":
        case "Genesect":
        case "Keldeo":
        case "Mimikyu":
        case "Minior":
        case "Pikachu":
        case "Polteageist":
        case "Sawsbuck":
        case "Shellos":
        case "Sinistea":
        case "Tatsugiri":
        case "Vivillon":
          break;
        default:
          smogdexid += "-" + (0, import_battle_dex.toID)(species.forme);
          break;
      }
    }
    let generationNumber = 9;
    if (format.startsWith("gen")) {
      let number = parseInt(format.charAt(3), 10);
      if (1 <= number && number <= 8) {
        generationNumber = number;
      }
      format = format.slice(4);
    }
    const generation = ["rb", "gs", "rs", "dp", "bw", "xy", "sm", "ss", "sv"][generationNumber - 1];
    if (format === "battlespotdoubles") {
      smogdexid += "/vgc15";
    } else if (format === "doublesou" || format === "doublesuu") {
      smogdexid += "/doubles";
    } else if (format === "ou" || format === "uu" || format === "ru" || format === "nu" || format === "pu" || format === "lc" || format === "monotype" || format === "mixandmega" || format === "nfe" || format === "nationaldex" || format === "stabmons" || format === "1v1" || format === "almostanyability") {
      smogdexid += "/" + format;
    } else if (format === "balancedhackmons") {
      smogdexid += "/bh";
    } else if (format === "anythinggoes") {
      smogdexid += "/ag";
    } else if (format === "nationaldexag") {
      smogdexid += "/national-dex-ag";
    }
    return `http://smogon.com/dex/${generation}/pokemon/${smogdexid}/`;
  }
  renderSpreadGuesser() {
    const { editor, set } = this.props;
    const team = editor.team;
    if (editor.gen < 3) {
      return /* @__PURE__ */ Chat.h("p", null, "(", /* @__PURE__ */ Chat.h("a", { target: "_blank", href: this.smogdexLink(set.species) }, "Smogon\xA0analysis"), ")");
    }
    const guess = new import_battle_tooltips.BattleStatGuesser(team.format).guess(set);
    const role = guess.role;
    const guessedEVs = guess.evs;
    const guessedPlus = guess.plusStat || null;
    const guessedMinus = guess.minusStat || null;
    return /* @__PURE__ */ Chat.h("p", { class: "suggested" }, /* @__PURE__ */ Chat.h("small", null, "Guessed spread: "), role === "?" ? "(Please choose 4 moves to get a guessed spread)" : /* @__PURE__ */ Chat.h("button", { name: "setStatFormGuesses", class: "button", onClick: this.handleGuess }, role, ": ", import_battle_dex.Dex.statNames.map((statID) => guessedEVs[statID] ? `${guessedEVs[statID]} ${import_battle_dex_data.BattleStatNames[statID]}` : null).filter(Boolean).join(" / "), !!(guessedPlus && guessedMinus) && ` (+${import_battle_dex_data.BattleStatNames[guessedPlus]}, -${import_battle_dex_data.BattleStatNames[guessedMinus]})`), /* @__PURE__ */ Chat.h("small", null, " (", /* @__PURE__ */ Chat.h("a", { target: "_blank", href: this.smogdexLink(set.species) }, "Smogon\xA0analysis"), ")"));
  }
  renderStatOptimizer() {
    const optimized = (0, import_battle_tooltips.BattleStatOptimizer)(this.props.set, this.props.editor.format);
    if (!optimized) return null;
    return /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("small", null, /* @__PURE__ */ Chat.h("em", null, "Protip:"), " Use a different nature to ", optimized.savedEVs ? `save ${optimized.savedEVs} EVs` : "get higher stats", ": "), /* @__PURE__ */ Chat.h("button", { name: "setStatFormOptimization", class: "button", onClick: this.handleOptimize }, import_battle_dex.Dex.statNames.map((statID) => optimized.evs[statID] ? `${optimized.evs[statID]} ${import_battle_dex_data.BattleStatNames[statID]}` : null).filter(Boolean).join(" / "), !!(optimized.plus && optimized.minus) && ` (+${import_battle_dex_data.BattleStatNames[optimized.plus]}, -${import_battle_dex_data.BattleStatNames[optimized.minus]})`));
  }
  setInput(name, value) {
    const evInput = this.base.querySelector(`input[name="${name}"]`);
    if (evInput) evInput.value = value;
  }
  update(init) {
    const { set } = this.props;
    const nature = import_battle_dex_data.BattleNatures[set.nature];
    const skipID = !init ? this.base.querySelector("input:focus")?.name : void 0;
    if (nature?.plus) {
      this.plus = nature?.plus || null;
      this.minus = nature?.minus || null;
    } else if (this.plus && this.minus) {
      this.plus = null;
      this.minus = null;
    }
    for (const statID of import_battle_dex.Dex.statNames) {
      const ev = `${set.evs?.[statID] || ""}`;
      const plusMinus = this.plus === statID ? "+" : this.minus === statID ? "-" : "";
      const iv = this.ivToDv(set.ivs?.[statID]);
      if (skipID !== `ev-${statID}`) this.setInput(`ev-${statID}`, ev + plusMinus);
      if (skipID !== `iv-${statID}`) this.setInput(`iv-${statID}`, iv);
    }
  }
  componentDidMount() {
    this.update(true);
  }
  componentDidUpdate() {
    this.update();
  }
  renderStatbar(stat, statID) {
    let width = stat * 180 / 504;
    if (statID === "hp") width = Math.floor(stat * 180 / 704);
    if (width > 179) width = 179;
    let hue = Math.floor(stat * 180 / 714);
    if (hue > 360) hue = 360;
    return /* @__PURE__ */ Chat.h(
      "span",
      {
        style: `width:${Math.floor(width)}px;background:hsl(${hue},85%,45%);border-color:hsl(${hue},85%,35%)`
      }
    );
  }
  /** Converts DV/IV in a textbox to the value in set. */
  dvToIv(dvOrIvString) {
    const dvOrIv = Number(dvOrIvString);
    if (isNaN(dvOrIv)) return null;
    const useIVs = this.props.editor.gen > 2;
    return useIVs ? dvOrIv : dvOrIv === 15 ? 31 : dvOrIv * 2;
  }
  /** Converts set.iv value to a DV/IV for a text box. */
  ivToDv(iv) {
    if (iv === null || iv === void 0) return "";
    const useIVs = this.props.editor.gen > 2;
    return `${useIVs ? iv : Math.trunc(iv / 2)}`;
  }
  maxEVs() {
    const team = this.props.editor.team;
    const useEVs = !team.format.includes("letsgo");
    return useEVs ? 510 : Infinity;
  }
  render() {
    const { editor, set } = this.props;
    const team = editor.team;
    const species = editor.dex.species.get(set.species);
    const baseStats = species.baseStats;
    const nature = import_battle_dex_data.BattleNatures[set.nature || "Serious"];
    const useEVs = !team.format.includes("letsgo");
    const maxEV = useEVs ? 252 : 200;
    const stepEV = useEVs ? 4 : 1;
    const defaultEV = useEVs && editor.gen <= 2 && !set.evs ? maxEV : 0;
    const useIVs = editor.gen > 2;
    const statNames = {
      hp: "HP",
      atk: "Attack",
      def: "Defense",
      spa: "Sp. Atk.",
      spd: "Sp. Def.",
      spe: "Speed"
    };
    if (editor.gen === 1) statNames.spa = "Special";
    const ivs = editor.getIVs(set);
    const stats = import_battle_dex.Dex.statNames.filter((statID) => editor.gen > 1 || statID !== "spd").map((statID) => [
      statID,
      statNames[statID],
      editor.getStat(statID, set, ivs[statID])
    ]);
    let remaining = null;
    const maxEv = this.maxEVs();
    if (maxEv < 6 * 252) {
      let totalEv = 0;
      for (const ev of Object.values(set.evs || {})) totalEv += ev;
      if (totalEv <= maxEv) {
        remaining = totalEv > maxEv - 2 ? 0 : maxEv - 2 - totalEv;
      } else {
        remaining = maxEv - totalEv;
      }
      remaining ||= null;
    }
    const defaultIVs = editor.defaultIVs(set);
    return /* @__PURE__ */ Chat.h("div", { style: "font-size:10pt", role: "dialog", "aria-label": "Stats" }, /* @__PURE__ */ Chat.h("div", { class: "resultheader" }, /* @__PURE__ */ Chat.h("h3", null, "EVs, IVs, and Nature")), /* @__PURE__ */ Chat.h("div", { class: "pad" }, this.renderSpreadGuesser(), /* @__PURE__ */ Chat.h("table", null, /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("th", null), /* @__PURE__ */ Chat.h("th", null, "Base"), /* @__PURE__ */ Chat.h("th", { class: "setstatbar" }), /* @__PURE__ */ Chat.h("th", null, useEVs ? "EVs" : "AVs"), /* @__PURE__ */ Chat.h("th", null), /* @__PURE__ */ Chat.h("th", null, useIVs ? "IVs" : "DVs"), /* @__PURE__ */ Chat.h("th", null)), stats.map(([statID, statName, stat]) => /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("th", { style: "text-align:right;font-weight:normal" }, statName), /* @__PURE__ */ Chat.h("td", { style: "text-align:right" }, /* @__PURE__ */ Chat.h("strong", null, baseStats[statID])), /* @__PURE__ */ Chat.h("td", { class: "setstatbar" }, this.renderStatbar(stat, statID)), /* @__PURE__ */ Chat.h("td", null, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: `ev-${statID}`,
        placeholder: `${defaultEV || ""}`,
        type: "text",
        inputMode: "numeric",
        class: "textbox default-placeholder",
        style: "width:40px",
        onInput: this.changeEV,
        onChange: this.changeEV
      }
    )), /* @__PURE__ */ Chat.h("td", null, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: `evslider-${statID}`,
        value: set.evs?.[statID] ?? defaultEV,
        min: "0",
        max: maxEV,
        step: stepEV,
        type: "range",
        class: "evslider",
        tabIndex: -1,
        "aria-hidden": true,
        onInput: this.changeEV,
        onChange: this.changeEV
      }
    )), /* @__PURE__ */ Chat.h("td", null, /* @__PURE__ */ Chat.h(
      "input",
      {
        name: `iv-${statID}`,
        min: 0,
        max: useIVs ? 31 : 15,
        placeholder: `${defaultIVs[statID]}`,
        style: "width:40px",
        type: "number",
        inputMode: "numeric",
        class: "textbox default-placeholder",
        onInput: this.changeIV,
        onChange: this.changeIV
      }
    )), /* @__PURE__ */ Chat.h("td", { style: "text-align:right" }, /* @__PURE__ */ Chat.h("strong", null, stat)))), /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { colSpan: 2 }), /* @__PURE__ */ Chat.h("td", { class: "setstatbar", style: "text-align:right" }, remaining !== null ? "Remaining:" : ""), /* @__PURE__ */ Chat.h("td", { style: "text-align:center" }, remaining && remaining < 0 ? /* @__PURE__ */ Chat.h("b", { class: "message-error" }, remaining) : remaining), /* @__PURE__ */ Chat.h("td", { colSpan: 3, style: "text-align:right" }, this.renderIVMenu()))), editor.gen >= 3 && /* @__PURE__ */ Chat.h("p", null, "Nature: ", /* @__PURE__ */ Chat.h("select", { name: "nature", class: "button", onChange: this.changeNature }, Object.entries(import_battle_dex_data.BattleNatures).map(([natureName, curNature]) => /* @__PURE__ */ Chat.h("option", { value: natureName, selected: curNature === nature }, natureName, curNature.plus && ` (+${import_battle_dex_data.BattleStatNames[curNature.plus]}, -${import_battle_dex_data.BattleStatNames[curNature.minus]})`)))), editor.gen >= 3 && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("small", null, /* @__PURE__ */ Chat.h("em", null, "Protip:"), " You can also set natures by typing ", /* @__PURE__ */ Chat.h("kbd", null, "+"), " and ", /* @__PURE__ */ Chat.h("kbd", null, "-"), " in the EV box.")), editor.gen >= 3 && this.renderStatOptimizer()));
  }
}
class DetailsForm extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.changeNickname = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      if (target.value) {
        set.name = target.value.trim();
      } else {
        delete set.name;
      }
      this.props.onChange();
    };
    this.changeTera = (ev) => {
      const target = ev.currentTarget;
      const { editor, set } = this.props;
      const species = editor.dex.species.get(set.species);
      if (!target.value || target.value === (species.requiredTeraType || species.types[0])) {
        delete set.teraType;
      } else {
        set.teraType = target.value.trim();
      }
      this.props.onChange();
    };
    this.changeLevel = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      if (target.value) {
        set.level = parseInt(target.value.trim());
      } else {
        delete set.level;
      }
      this.props.onChange();
    };
    this.changeGender = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      if (target.value) {
        set.gender = target.value.trim();
      } else {
        delete set.gender;
      }
      this.props.onChange();
    };
    this.changeHappiness = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      if (target.value) {
        set.happiness = parseInt(target.value.trim());
      } else {
        delete set.happiness;
      }
      this.props.onChange();
    };
    this.changeShiny = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      if (target.value) {
        set.shiny = true;
      } else {
        delete set.shiny;
      }
      this.props.onChange();
    };
    this.changeDynamaxLevel = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      if (target.value) {
        set.dynamaxLevel = parseInt(target.value.trim());
      } else {
        delete set.dynamaxLevel;
      }
      this.props.onChange();
    };
    this.changeGigantamax = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      if (target.checked) {
        set.gigantamax = true;
      } else {
        delete set.gigantamax;
      }
      this.props.onChange();
    };
    this.changeHPType = (ev) => {
      const target = ev.currentTarget;
      const { set } = this.props;
      if (target.value) {
        set.hpType = target.value;
      } else {
        delete set.hpType;
      }
      this.props.onChange();
    };
  }
  update(init) {
    const { set } = this.props;
    const skipID = !init ? this.base.querySelector("input:focus")?.name : void 0;
    const nickname = this.base.querySelector('input[name="nickname"]');
    if (nickname && skipID !== "nickname") nickname.value = set.name || "";
  }
  componentDidMount() {
    this.update(true);
  }
  componentDidUpdate() {
    this.update();
  }
  renderGender(gender) {
    const genderTable = { "M": "Male", "F": "Female" };
    if (gender === "N") return "Unknown";
    return /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("img", { src: `${import_battle_dex.Dex.fxPrefix}gender-${gender.toLowerCase()}.png`, alt: "", width: "7", height: "10", class: "pixelated" }), " ", genderTable[gender]);
  }
  render() {
    const { editor, set } = this.props;
    const species = editor.dex.species.get(set.species);
    return /* @__PURE__ */ Chat.h("div", { style: "font-size:10pt", role: "dialog", "aria-label": "Details" }, /* @__PURE__ */ Chat.h("div", { class: "resultheader" }, /* @__PURE__ */ Chat.h("h3", null, "Details")), /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Nickname: ", /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "nickname",
        class: "textbox default-placeholder",
        placeholder: species.baseSpecies,
        onInput: this.changeNickname,
        onChange: this.changeNickname
      }
    ))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Level: ", /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "level",
        value: set.level ?? "",
        placeholder: `${editor.defaultLevel}`,
        type: "number",
        inputMode: "numeric",
        min: "1",
        max: "100",
        step: "1",
        class: "textbox inputform numform default-placeholder",
        style: "width: 50px",
        onInput: this.changeLevel,
        onChange: this.changeLevel
      }
    )), /* @__PURE__ */ Chat.h("small", null, "(You probably want to change the team's levels by changing the format, not here)")), editor.gen > 1 && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("div", { class: "label" }, "Shiny: ", /* @__PURE__ */ Chat.h("div", { class: "labeled" }, /* @__PURE__ */ Chat.h("label", { class: "checkbox inline" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "radio",
        name: "shiny",
        value: "true",
        checked: set.shiny,
        onInput: this.changeShiny,
        onChange: this.changeShiny
      }
    ), " ", /* @__PURE__ */ Chat.h("img", { src: `${import_battle_dex.Dex.resourcePrefix}sprites/misc/shiny.png`, width: 22, height: 22, alt: "Shiny" }), " Yes"), /* @__PURE__ */ Chat.h("label", { class: "checkbox inline" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "radio",
        name: "shiny",
        value: "",
        checked: !set.shiny,
        onInput: this.changeShiny,
        onChange: this.changeShiny
      }
    ), " No")))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("div", { class: "label" }, "Gender: ", species.gender ? /* @__PURE__ */ Chat.h("strong", null, this.renderGender(species.gender)) : /* @__PURE__ */ Chat.h("div", { class: "labeled" }, /* @__PURE__ */ Chat.h("label", { class: "checkbox inline" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "radio",
        name: "gender",
        value: "M",
        checked: set.gender === "M",
        onInput: this.changeGender,
        onChange: this.changeGender
      }
    ), " ", this.renderGender("M")), /* @__PURE__ */ Chat.h("label", { class: "checkbox inline" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "radio",
        name: "gender",
        value: "F",
        checked: set.gender === "F",
        onInput: this.changeGender,
        onChange: this.changeGender
      }
    ), " ", this.renderGender("F")), /* @__PURE__ */ Chat.h("label", { class: "checkbox inline" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "radio",
        name: "gender",
        value: "",
        checked: !set.gender || set.gender === "N",
        onInput: this.changeGender,
        onChange: this.changeGender
      }
    ), " Random")))), editor.isLetsGo ? /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Happiness: ", /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "happiness",
        value: "",
        placeholder: "70",
        type: "number",
        inputMode: "numeric",
        class: "textbox inputform numform default-placeholder",
        style: "width: 50px",
        onInput: this.changeHappiness,
        onChange: this.changeHappiness
      }
    ))) : (editor.gen < 8 || editor.isNatDex) && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Happiness: ", /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "happiness",
        value: set.happiness ?? "",
        placeholder: "255",
        type: "number",
        inputMode: "numeric",
        min: "0",
        max: "255",
        step: "1",
        class: "textbox inputform numform default-placeholder",
        style: "width: 50px",
        onInput: this.changeHappiness,
        onChange: this.changeHappiness
      }
    )))), editor.gen === 8 && !editor.isBDSP && !species.cannotDynamax && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label", style: "display:inline" }, "Dynamax Level: ", /* @__PURE__ */ Chat.h(
      "input",
      {
        name: "dynamaxlevel",
        value: set.dynamaxLevel ?? "",
        placeholder: "10",
        type: "number",
        inputMode: "numeric",
        min: "0",
        max: "10",
        step: "1",
        class: "textbox inputform numform default-placeholder",
        onInput: this.changeDynamaxLevel,
        onChange: this.changeDynamaxLevel
      }
    )), " ", species.canGigantamax ? /* @__PURE__ */ Chat.h("label", { class: "checkbox inline" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "checkbox",
        name: "gigantamax",
        value: "true",
        checked: set.gigantamax,
        onInput: this.changeGigantamax,
        onChange: this.changeGigantamax
      }
    ), " Gigantamax") : species.forme === "Gmax" && /* @__PURE__ */ Chat.h("label", { class: "checkbox inline" }, /* @__PURE__ */ Chat.h(
      "input",
      {
        type: "checkbox",
        checked: true,
        disabled: true
      }
    ), " Gigantamax")), (!editor.isLetsGo && editor.gen === 7 || editor.isNatDex || species.baseSpecies === "Unown") && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label" }, "Hidden Power Type: ", /* @__PURE__ */ Chat.h("select", { name: "hptype", class: "button", onChange: this.changeHPType }, import_battle_dex.Dex.types.all().map((type) => type.HPivs && /* @__PURE__ */ Chat.h("option", { value: type.name, selected: editor.getHPType(set) === type.name }, type.name))))), editor.gen === 9 && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("label", { class: "label", title: "Tera Type" }, "Tera Type: ", species.requiredTeraType && editor.formeLegality === "normal" ? /* @__PURE__ */ Chat.h("select", { name: "teratype", class: "button cur", disabled: true }, /* @__PURE__ */ Chat.h("option", null, species.requiredTeraType)) : /* @__PURE__ */ Chat.h("select", { name: "teratype", class: "button", onChange: this.changeTera }, import_battle_dex.Dex.types.all().map((type) => /* @__PURE__ */ Chat.h("option", { value: type.name, selected: (set.teraType || species.requiredTeraType || species.types[0]) === type.name }, type.name))))), species.cosmeticFormes && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { class: "button" }, "Change sprite"))));
  }
}
//# sourceMappingURL=battle-team-editor.js.map
