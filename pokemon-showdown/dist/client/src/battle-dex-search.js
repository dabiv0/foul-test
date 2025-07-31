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
var battle_dex_search_exports = {};
__export(battle_dex_search_exports, {
  DexSearch: () => DexSearch
});
module.exports = __toCommonJS(battle_dex_search_exports);
var import_battle_dex = require("./battle-dex");
/**
 * Search
 *
 * Code for searching for dex information, used by the Dex and
 * Teambuilder.
 *
 * Dependencies: battledata, search-index
 * Optional dependencies: pokedex, moves, items, abilities
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */
class DexSearch {
  constructor(searchType = "", formatid = "", species = "") {
    this.query = "";
    /**
     * Dex for the mod/generation to search.
     */
    this.dex = import_battle_dex.Dex;
    this.typedSearch = null;
    this.results = null;
    this.prependResults = null;
    this.exactMatch = false;
    this.firstPokemonColumn = "Number";
    /**
     * Column to sort by. Default is `null`, a smart sort determined by how good
     * things are according to the base filters, falling back to dex number (for
     * Pokemon) and name (for everything else).
     */
    this.sortCol = null;
    this.reverseSort = false;
    /**
     * Filters for the search result. Does not include the two base filters
     * (format and species).
     */
    this.filters = null;
    this.setType(searchType, formatid, species);
  }
  static {
    this.typeTable = {
      pokemon: 1,
      type: 2,
      tier: 3,
      move: 4,
      item: 5,
      ability: 6,
      egggroup: 7,
      category: 8,
      article: 9
    };
  }
  static {
    this.typeName = {
      pokemon: "Pok\xE9mon",
      type: "Type",
      tier: "Tiers",
      move: "Moves",
      item: "Items",
      ability: "Abilities",
      egggroup: "Egg group",
      category: "Category",
      article: "Article"
    };
  }
  getTypedSearch(searchType, format = "", speciesOrSet = "") {
    if (!searchType) return null;
    switch (searchType) {
      case "pokemon":
        return new BattlePokemonSearch("pokemon", format, speciesOrSet);
      case "item":
        return new BattleItemSearch("item", format, speciesOrSet);
      case "move":
        return new BattleMoveSearch("move", format, speciesOrSet);
      case "ability":
        return new BattleAbilitySearch("ability", format, speciesOrSet);
      case "type":
        return new BattleTypeSearch("type", format, speciesOrSet);
      case "category":
        return new BattleCategorySearch("category", format, speciesOrSet);
    }
    return null;
  }
  find(query) {
    query = (0, import_battle_dex.toID)(query);
    if (this.query === query && this.results) {
      return false;
    }
    this.query = query;
    if (!query) {
      this.results = this.typedSearch?.getResults(this.filters, this.sortCol, this.reverseSort) || [];
      if (!this.filters && !this.sortCol && this.prependResults) {
        this.results = [...this.prependResults, ...this.results];
      }
    } else {
      this.results = this.textSearch(query);
    }
    return true;
  }
  setType(searchType, format = "", speciesOrSet = "") {
    this.results = null;
    if (searchType !== this.typedSearch?.searchType) {
      this.filters = null;
      this.sortCol = null;
    }
    this.typedSearch = this.getTypedSearch(searchType, format, speciesOrSet);
    if (this.typedSearch) this.dex = this.typedSearch.dex;
  }
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  addFilter(entry) {
    if (!this.typedSearch) return false;
    let [type] = entry;
    if (this.typedSearch.searchType === "pokemon") {
      if (type === this.sortCol) this.sortCol = null;
      if (!["type", "move", "ability", "egggroup", "tier"].includes(type)) return false;
      if (type === "type") entry[1] = this.capitalizeFirst(entry[1]);
      if (type === "move") entry[1] = (0, import_battle_dex.toID)(entry[1]);
      if (type === "ability") entry[1] = this.dex.abilities.get(entry[1]).name;
      if (type === "tier") {
        const tierTable = {
          uber: "Uber",
          caplc: "CAP LC",
          capnfe: "CAP NFE"
        };
        entry[1] = (0, import_battle_dex.toID)(entry[1]);
        entry[1] = tierTable[entry[1]] || entry[1].toUpperCase();
      }
      if (!this.filters) this.filters = [];
      this.results = null;
      for (const filter of this.filters) {
        if (filter[0] === type && filter[1] === entry[1]) {
          return true;
        }
      }
      this.filters.push(entry.slice(0, 2));
      return true;
    } else if (this.typedSearch.searchType === "move") {
      if (type === this.sortCol) this.sortCol = null;
      if (!["type", "category", "pokemon"].includes(type)) return false;
      if (type === "type") entry[1] = this.capitalizeFirst(entry[1]);
      if (type === "category") entry[1] = this.capitalizeFirst(entry[1]);
      if (type === "pokemon") entry[1] = (0, import_battle_dex.toID)(entry[1]);
      if (!this.filters) this.filters = [];
      this.filters.push(entry.slice(0, 2));
      this.results = null;
      return true;
    }
    return false;
  }
  removeFilter(entry) {
    if (!this.filters) return false;
    if (entry) {
      const filterid = entry.join(":");
      let deleted = null;
      for (let i = 0; i < this.filters.length; i++) {
        if (filterid === this.filters[i].join(":")) {
          deleted = this.filters[i];
          this.filters.splice(i, 1);
          break;
        }
      }
      if (!deleted) return false;
    } else {
      this.filters.pop();
    }
    if (!this.filters.length) this.filters = null;
    this.results = null;
    return true;
  }
  toggleSort(sortCol) {
    if (this.sortCol === sortCol) {
      if (!this.reverseSort) {
        this.reverseSort = true;
      } else {
        this.sortCol = null;
        this.reverseSort = false;
      }
    } else {
      this.sortCol = sortCol;
      this.reverseSort = false;
    }
    this.results = null;
  }
  filterLabel(filterType) {
    if (this.typedSearch && this.typedSearch.searchType !== filterType) {
      return "Filter";
    }
    return null;
  }
  illegalLabel(id) {
    return this.typedSearch?.illegalReasons?.[id] || null;
  }
  getTier(species) {
    return this.typedSearch?.getTier(species) || "";
  }
  textSearch(query) {
    query = (0, import_battle_dex.toID)(query);
    this.exactMatch = false;
    let searchType = this.typedSearch?.searchType || "";
    let searchTypeIndex = searchType ? DexSearch.typeTable[searchType] : -1;
    let qFilterType = "";
    if (query.endsWith("type")) {
      if (query.slice(0, -4) in window.BattleTypeChart) {
        query = query.slice(0, -4);
        qFilterType = "type";
      }
    }
    let i = DexSearch.getClosest(query);
    this.exactMatch = BattleSearchIndex[i][0] === query;
    let passType = "";
    let searchPasses = [["normal", i, query]];
    if (query.length > 1) searchPasses.push(["alias", i, query]);
    let queryAlias;
    if (query in BattleAliases) {
      if (["sub", "tr"].includes(query) || !(0, import_battle_dex.toID)(BattleAliases[query]).startsWith(query)) {
        queryAlias = (0, import_battle_dex.toID)(BattleAliases[query]);
        let aliasPassType = queryAlias === "hiddenpower" ? "exact" : "normal";
        searchPasses.unshift([aliasPassType, DexSearch.getClosest(queryAlias), queryAlias]);
      }
      this.exactMatch = true;
    }
    if (!this.exactMatch && BattleSearchIndex[i][0].substr(0, query.length) !== query) {
      let matchLength = query.length - 1;
      if (!i) i++;
      while (matchLength && BattleSearchIndex[i][0].substr(0, matchLength) !== query.substr(0, matchLength) && BattleSearchIndex[i - 1][0].substr(0, matchLength) !== query.substr(0, matchLength)) {
        matchLength--;
      }
      let matchQuery = query.substr(0, matchLength);
      while (i >= 1 && BattleSearchIndex[i - 1][0].substr(0, matchLength) === matchQuery) i--;
      searchPasses.push(["fuzzy", i, ""]);
    }
    let bufs = [[], [], [], [], [], [], [], [], [], []];
    let topbufIndex = -1;
    let count = 0;
    let nearMatch = false;
    let instafilter = null;
    let instafilterSort = [0, 1, 2, 5, 4, 3, 6, 7, 8];
    let illegal = this.typedSearch?.illegalReasons;
    for (i = 0; i < BattleSearchIndex.length; i++) {
      if (!passType) {
        let searchPass = searchPasses.shift();
        if (!searchPass) break;
        passType = searchPass[0];
        i = searchPass[1];
        query = searchPass[2];
      }
      let entry = BattleSearchIndex[i];
      let id = entry[0];
      let type = entry[1];
      if (!id) break;
      if (passType === "fuzzy") {
        if (count >= 2) {
          passType = "";
          continue;
        }
        nearMatch = true;
      } else if (passType === "exact") {
        if (count >= 1) {
          passType = "";
          continue;
        }
      } else if (id.substr(0, query.length) !== query) {
        passType = "";
        continue;
      }
      if (entry.length > 2) {
        if (passType !== "alias") continue;
      } else {
        if (passType === "alias") continue;
      }
      let typeIndex = DexSearch.typeTable[type];
      if (query.length === 1 && typeIndex !== (searchType ? searchTypeIndex : 1)) continue;
      if (searchType === "pokemon" && (typeIndex === 5 || typeIndex > 7)) continue;
      if (searchType === "move" && (typeIndex !== 8 && typeIndex > 4 || typeIndex === 3)) continue;
      if (searchType === "move" && illegal && typeIndex === 1) continue;
      if ((searchType === "ability" || searchType === "item") && typeIndex !== searchTypeIndex) continue;
      if (qFilterType === "type" && typeIndex !== 2) continue;
      if ((id === "megax" || id === "megay") && "mega".startsWith(query)) continue;
      let matchStart = 0;
      let matchEnd = 0;
      if (passType === "alias") {
        matchStart = entry[3];
        let originalIndex = entry[2];
        if (matchStart) {
          matchEnd = matchStart + query.length;
          matchStart += (BattleSearchIndexOffset[originalIndex][matchStart] || "0").charCodeAt(0) - 48;
          matchEnd += (BattleSearchIndexOffset[originalIndex][matchEnd - 1] || "0").charCodeAt(0) - 48;
        }
        id = BattleSearchIndex[originalIndex][0];
      } else {
        matchEnd = query.length;
        if (matchEnd) matchEnd += (BattleSearchIndexOffset[i][matchEnd - 1] || "0").charCodeAt(0) - 48;
      }
      if (queryAlias === id && query !== id) continue;
      if (searchType && searchTypeIndex !== typeIndex) {
        if (!instafilter || instafilterSort[typeIndex] < instafilterSort[instafilter[2]]) {
          instafilter = [type, id, typeIndex];
        }
      }
      if (topbufIndex < 0 && searchTypeIndex < 2 && passType === "alias" && !bufs[1].length && bufs[2].length) {
        topbufIndex = 2;
      }
      if (illegal && typeIndex === searchTypeIndex) {
        if (!bufs[typeIndex].length && !bufs[0].length) {
          bufs[0] = [["header", DexSearch.typeName[type]]];
        }
        if (!(id in illegal)) typeIndex = 0;
      } else {
        if (!bufs[typeIndex].length) {
          bufs[typeIndex] = [["header", DexSearch.typeName[type]]];
        }
      }
      let curBufLength = passType === "alias" && bufs[typeIndex].length;
      if (curBufLength && bufs[typeIndex][curBufLength - 1][1] === id) continue;
      bufs[typeIndex].push([type, id, matchStart, matchEnd]);
      count++;
    }
    let topbuf = [];
    if (nearMatch) {
      topbuf = [["html", `<em>No exact match found. The closest matches alphabetically are:</em>`]];
    }
    if (topbufIndex >= 0) {
      topbuf = topbuf.concat(bufs[topbufIndex]);
      bufs[topbufIndex] = [];
    }
    if (searchTypeIndex >= 0) {
      topbuf = topbuf.concat(bufs[0]);
      topbuf = topbuf.concat(bufs[searchTypeIndex]);
      bufs[searchTypeIndex] = [];
      bufs[0] = [];
    }
    if (instafilter && count < 20) {
      bufs.push(this.instafilter(searchType, instafilter[0], instafilter[1]));
    }
    this.results = Array.prototype.concat.apply(topbuf, bufs);
    return this.results;
  }
  instafilter(searchType, fType, fId) {
    let buf = [];
    let illegalBuf = [];
    let illegal = this.typedSearch?.illegalReasons;
    if (searchType === "pokemon") {
      switch (fType) {
        case "type":
          let type = fId.charAt(0).toUpperCase() + fId.slice(1);
          buf.push(["header", `${type}-type Pok\xE9mon`]);
          for (let id in BattlePokedex) {
            if (!BattlePokedex[id].types) continue;
            if (this.dex.species.get(id).types.includes(type)) {
              (illegal && id in illegal ? illegalBuf : buf).push(["pokemon", id]);
            }
          }
          break;
        case "ability":
          let ability = import_battle_dex.Dex.abilities.get(fId).name;
          buf.push(["header", `${ability} Pok\xE9mon`]);
          for (let id in BattlePokedex) {
            if (!BattlePokedex[id].abilities) continue;
            if (import_battle_dex.Dex.hasAbility(this.dex.species.get(id), ability)) {
              (illegal && id in illegal ? illegalBuf : buf).push(["pokemon", id]);
            }
          }
          break;
      }
    } else if (searchType === "move") {
      switch (fType) {
        case "type":
          let type = fId.charAt(0).toUpperCase() + fId.slice(1);
          buf.push(["header", `${type}-type moves`]);
          for (let id in BattleMovedex) {
            if (BattleMovedex[id].type === type) {
              (illegal && id in illegal ? illegalBuf : buf).push(["move", id]);
            }
          }
          break;
        case "category":
          let category = fId.charAt(0).toUpperCase() + fId.slice(1);
          buf.push(["header", `${category} moves`]);
          for (let id in BattleMovedex) {
            if (BattleMovedex[id].category === category) {
              (illegal && id in illegal ? illegalBuf : buf).push(["move", id]);
            }
          }
          break;
      }
    }
    return [...buf, ...illegalBuf];
  }
  static getClosest(query) {
    let left = 0;
    let right = BattleSearchIndex.length - 1;
    while (right > left) {
      let mid = Math.floor((right - left) / 2 + left);
      if (BattleSearchIndex[mid][0] === query && (mid === 0 || BattleSearchIndex[mid - 1][0] !== query)) {
        return mid;
      } else if (BattleSearchIndex[mid][0] < query) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    if (left >= BattleSearchIndex.length - 1) left = BattleSearchIndex.length - 1;
    else if (BattleSearchIndex[left + 1][0] && BattleSearchIndex[left][0] < query) left++;
    if (left && BattleSearchIndex[left - 1][0] === query) left--;
    return left;
  }
}
class BattleTypedSearch {
  constructor(searchType, format = "", speciesOrSet = "") {
    /**
     * Dex for the mod/generation to search.
     */
    this.dex = import_battle_dex.Dex;
    /**
     * Format is the first of two base filters. It constrains results to things
     * legal in the format, and affects the default sort.
     *
     * This string specifically normalizes out generation number and the words
     * "Doubles" and "Let's Go" from the name.
     */
    this.format = "";
    /**
     * `species` is the second of two base filters. It constrains results to
     * things that species can use, and affects the default sort.
     */
    this.species = "";
    /**
     * `set` is a pseudo-base filter; it has minor effects on move sorting.
     * (Abilities/items can affect what moves are sorted as usable.)
     */
    this.set = null;
    this.formatType = null;
    /**
     * Cached copy of what the results list would be with only base filters
     * (i.e. with an empty `query` and `filters`)
     */
    this.baseResults = null;
    /**
     * Cached copy of all results not in `baseResults` - mostly in case a user
     * is wondering why a specific result isn't showing up.
     */
    this.baseIllegalResults = null;
    this.illegalReasons = null;
    this.results = null;
    this.sortRow = null;
    this.searchType = searchType;
    this.baseResults = null;
    this.baseIllegalResults = null;
    if (format.startsWith("gen")) {
      const gen = Number(format.charAt(3)) || 6;
      format = format.slice(4) || "customgame";
      this.dex = import_battle_dex.Dex.forGen(gen);
    } else if (!format) {
      this.dex = import_battle_dex.Dex;
    }
    if (format.startsWith("dlc1") && this.dex.gen === 8) {
      if (format.includes("doubles")) {
        this.formatType = "ssdlc1doubles";
      } else {
        this.formatType = "ssdlc1";
      }
      format = format.slice(4);
    }
    if (format.startsWith("predlc")) {
      if (format.includes("doubles") && !format.includes("nationaldex")) {
        this.formatType = "predlcdoubles";
      } else if (format.includes("nationaldex")) {
        this.formatType = "predlcnatdex";
      } else {
        this.formatType = "predlc";
      }
      format = format.slice(6);
    }
    if (format.startsWith("dlc1") && this.dex.gen === 9) {
      if (format.includes("doubles") && !format.includes("nationaldex")) {
        this.formatType = "svdlc1doubles";
      } else if (format.includes("nationaldex")) {
        this.formatType = "svdlc1natdex";
      } else {
        this.formatType = "svdlc1";
      }
      format = format.slice(4);
    }
    if (format.startsWith("stadium")) {
      this.formatType = "stadium";
      format = format.slice(7);
      if (!format) format = "ou";
    }
    if (format.startsWith("vgc")) this.formatType = "doubles";
    if (format === "vgc2020") this.formatType = "ssdlc1doubles";
    if (format === "vgc2023regulationd") this.formatType = "predlcdoubles";
    if (format === "vgc2023regulatione") this.formatType = "svdlc1doubles";
    if (format.includes("bdsp")) {
      if (format.includes("doubles")) {
        this.formatType = "bdspdoubles";
      } else {
        this.formatType = "bdsp";
      }
      format = format.slice(4);
      this.dex = import_battle_dex.Dex.mod("gen8bdsp");
    }
    if (format.includes("bw1")) {
      this.formatType = "bw1";
      this.dex = import_battle_dex.Dex.mod("gen5bw1");
    }
    if (format.includes("adv200")) {
      this.formatType = "rs";
      this.dex = import_battle_dex.Dex.mod("gen3rs");
    }
    if (format === "partnersincrime") this.formatType = "doubles";
    if (format.startsWith("ffa") || format === "freeforall") this.formatType = "doubles";
    if (format.includes("letsgo")) {
      this.formatType = "letsgo";
      this.dex = import_battle_dex.Dex.mod("gen7letsgo");
    }
    if (format.includes("nationaldex") || format.startsWith("nd") || format.includes("natdex")) {
      format = format.startsWith("nd") ? format.slice(2) : format.includes("natdex") ? format.slice(6) : format.slice(11);
      this.formatType = "natdex";
      if (!format) format = "ou";
    }
    if (format.includes("doubles") && this.dex.gen > 4 && !this.formatType) this.formatType = "doubles";
    if (this.formatType === "letsgo") format = format.slice(6);
    if (format.includes("metronome")) {
      this.formatType = "metronome";
    }
    if (format.endsWith("nfe")) {
      format = format.slice(3);
      this.formatType = "nfe";
      if (!format) format = "ou";
    }
    if ((format.endsWith("lc") || format.startsWith("lc")) && format !== "caplc" && !this.formatType) {
      this.formatType = "lc";
      format = "lc";
    }
    if (format.endsWith("draft")) format = format.slice(0, -5);
    this.format = format;
    this.species = "";
    this.set = null;
    if (typeof speciesOrSet === "string") {
      if (speciesOrSet) this.species = speciesOrSet;
    } else {
      this.set = speciesOrSet;
      this.species = (0, import_battle_dex.toID)(this.set.species);
    }
  }
  getResults(filters, sortCol, reverseSort) {
    if (sortCol === "type") {
      return [this.sortRow, ...BattleTypeSearch.prototype.getDefaultResults.call(this, reverseSort)];
    } else if (sortCol === "category") {
      return [this.sortRow, ...BattleCategorySearch.prototype.getDefaultResults.call(this, reverseSort)];
    } else if (sortCol === "ability") {
      return [this.sortRow, ...BattleAbilitySearch.prototype.getDefaultResults.call(this, reverseSort)];
    }
    if (!this.baseResults) {
      this.baseResults = this.getBaseResults();
    }
    if (!this.baseIllegalResults) {
      const legalityFilter = {};
      for (const [resultType, value] of this.baseResults) {
        if (resultType === this.searchType) legalityFilter[value] = 1;
      }
      this.baseIllegalResults = [];
      this.illegalReasons = {};
      for (const id in this.getTable()) {
        if (!(id in legalityFilter)) {
          this.baseIllegalResults.push([this.searchType, id]);
          this.illegalReasons[id] = "Illegal";
        }
      }
    }
    let results;
    let illegalResults;
    if (filters) {
      results = [];
      illegalResults = [];
      for (const result of this.baseResults) {
        if (this.filter(result, filters)) {
          if (results.length && result[0] === "header" && results[results.length - 1][0] === "header") {
            results[results.length - 1] = result;
          } else {
            results.push(result);
          }
        }
      }
      if (results.length && results[results.length - 1][0] === "header") {
        results.pop();
      }
      for (const result of this.baseIllegalResults) {
        if (this.filter(result, filters)) {
          illegalResults.push(result);
        }
      }
    } else {
      results = [...this.baseResults];
      illegalResults = null;
    }
    if (this.defaultFilter) {
      results = this.defaultFilter(results);
    }
    if (sortCol) {
      results = results.filter(([rowType]) => rowType === this.searchType);
      results = this.sort(results, sortCol, reverseSort);
      if (illegalResults) {
        illegalResults = illegalResults.filter(([rowType]) => rowType === this.searchType);
        illegalResults = this.sort(illegalResults, sortCol, reverseSort);
      }
    }
    if (this.sortRow) {
      results = [this.sortRow, ...results];
    }
    if (illegalResults?.length) {
      results = [...results, ["header", "Illegal results"], ...illegalResults];
    }
    return results;
  }
  firstLearnsetid(speciesid) {
    let table = BattleTeambuilderTable;
    if (this.formatType?.startsWith("bdsp")) table = table["gen8bdsp"];
    if (this.formatType === "letsgo") table = table["gen7letsgo"];
    if (this.formatType === "bw1") table = table["gen5bw1"];
    if (this.formatType === "rs") table = table["gen3rs"];
    if (speciesid in table.learnsets) return speciesid;
    const species = this.dex.species.get(speciesid);
    if (!species.exists) return "";
    let baseLearnsetid = (0, import_battle_dex.toID)(species.baseSpecies);
    if (typeof species.battleOnly === "string" && species.battleOnly !== species.baseSpecies) {
      baseLearnsetid = (0, import_battle_dex.toID)(species.battleOnly);
    }
    if (baseLearnsetid in table.learnsets) return baseLearnsetid;
    return "";
  }
  nextLearnsetid(learnsetid, speciesid, checkingMoves = false) {
    if (learnsetid === "lycanrocdusk" || speciesid === "rockruff" && learnsetid === "rockruff") {
      return "rockruffdusk";
    }
    const lsetSpecies = this.dex.species.get(learnsetid);
    if (!lsetSpecies.exists) return "";
    if (lsetSpecies.id === "gastrodoneast") return "gastrodon";
    if (lsetSpecies.id === "pumpkaboosuper") return "pumpkaboo";
    if (lsetSpecies.id === "sinisteaantique") return "sinistea";
    if (lsetSpecies.id === "tatsugiristretchy") return "tatsugiri";
    const next = lsetSpecies.battleOnly || lsetSpecies.changesFrom || lsetSpecies.prevo;
    if (next) return (0, import_battle_dex.toID)(next);
    if (checkingMoves && !lsetSpecies.prevo && lsetSpecies.baseSpecies && this.dex.species.get(lsetSpecies.baseSpecies).prevo) {
      let baseEvo = this.dex.species.get(lsetSpecies.baseSpecies);
      while (baseEvo.prevo) {
        baseEvo = this.dex.species.get(baseEvo.prevo);
      }
      return (0, import_battle_dex.toID)(baseEvo);
    }
    return "";
  }
  canLearn(speciesid, moveid) {
    const move = this.dex.moves.get(moveid);
    if (this.formatType === "natdex" && move.isNonstandard && move.isNonstandard !== "Past") {
      return false;
    }
    const gen = this.dex.gen;
    let genChar = `${gen}`;
    if (this.format.startsWith("vgc") || this.format.startsWith("bss") || this.format.startsWith("battlespot") || this.format.startsWith("battlestadium") || this.format.startsWith("battlefestival") || this.dex.gen === 9 && this.formatType !== "natdex") {
      if (gen === 9) {
        genChar = "a";
      } else if (gen === 8) {
        genChar = "g";
      } else if (gen === 7) {
        genChar = "q";
      } else if (gen === 6) {
        genChar = "p";
      }
    }
    let learnsetid = this.firstLearnsetid(speciesid);
    while (learnsetid) {
      let table = BattleTeambuilderTable;
      if (this.formatType?.startsWith("bdsp")) table = table["gen8bdsp"];
      if (this.formatType === "letsgo") table = table["gen7letsgo"];
      if (this.formatType === "bw1") table = table["gen5bw1"];
      if (this.formatType === "rs") table = table["gen3rs"];
      let learnset = table.learnsets[learnsetid];
      const eggMovesOnly = this.eggMovesOnly(learnsetid, speciesid);
      if (learnset && moveid in learnset && (!this.format.startsWith("tradebacks") ? learnset[moveid].includes(genChar) : learnset[moveid].includes(genChar) || learnset[moveid].includes(`${gen + 1}`) && move.gen === gen) && (!eggMovesOnly || learnset[moveid].includes("e") && this.dex.gen === 9)) {
        return true;
      }
      learnsetid = this.nextLearnsetid(learnsetid, speciesid, true);
    }
    return false;
  }
  getTier(pokemon) {
    if (this.formatType === "metronome") {
      return pokemon.num >= 0 ? String(pokemon.num) : pokemon.tier;
    }
    let table = window.BattleTeambuilderTable;
    const gen = this.dex.gen;
    const tableKey = this.formatType === "doubles" ? `gen${gen}doubles` : this.formatType === "letsgo" ? "gen7letsgo" : this.formatType === "bdsp" ? "gen8bdsp" : this.formatType === "bdspdoubles" ? "gen8bdspdoubles" : this.formatType === "bw1" ? "gen5bw1" : this.formatType === "rs" ? "gen3rs" : this.formatType === "nfe" ? `gen${gen}nfe` : this.formatType === "lc" ? `gen${gen}lc` : this.formatType === "ssdlc1" ? "gen8dlc1" : this.formatType === "ssdlc1doubles" ? "gen8dlc1doubles" : this.formatType === "predlc" ? "gen9predlc" : this.formatType === "predlcdoubles" ? "gen9predlcdoubles" : this.formatType === "predlcnatdex" ? "gen9predlcnatdex" : this.formatType === "svdlc1" ? "gen9dlc1" : this.formatType === "svdlc1doubles" ? "gen9dlc1doubles" : this.formatType === "svdlc1natdex" ? "gen9dlc1natdex" : this.formatType === "natdex" ? `gen${gen}natdex` : this.formatType === "stadium" ? `gen${gen}stadium${gen > 1 ? gen : ""}` : `gen${gen}`;
    if (table?.[tableKey]) {
      table = table[tableKey];
    }
    if (!table) return pokemon.tier;
    let id = pokemon.id;
    if (id in table.overrideTier) {
      return table.overrideTier[id];
    }
    if (id.endsWith("totem") && id.slice(0, -5) in table.overrideTier) {
      return table.overrideTier[id.slice(0, -5)];
    }
    id = (0, import_battle_dex.toID)(pokemon.baseSpecies);
    if (id in table.overrideTier) {
      return table.overrideTier[id];
    }
    return pokemon.tier;
  }
  eggMovesOnly(child, father) {
    if (this.dex.species.get(child).baseSpecies === this.dex.species.get(father).baseSpecies) return false;
    const baseSpecies = father;
    while (father) {
      if (child === father) return false;
      father = this.nextLearnsetid(father, baseSpecies);
    }
    return true;
  }
}
class BattlePokemonSearch extends BattleTypedSearch {
  constructor() {
    super(...arguments);
    this.sortRow = ["sortpokemon", ""];
  }
  getTable() {
    return BattlePokedex;
  }
  getDefaultResults() {
    let results = [];
    for (let id in BattlePokedex) {
      switch (id) {
        case "bulbasaur":
          results.push(["header", "Generation 1"]);
          break;
        case "chikorita":
          results.push(["header", "Generation 2"]);
          break;
        case "treecko":
          results.push(["header", "Generation 3"]);
          break;
        case "turtwig":
          results.push(["header", "Generation 4"]);
          break;
        case "victini":
          results.push(["header", "Generation 5"]);
          break;
        case "chespin":
          results.push(["header", "Generation 6"]);
          break;
        case "rowlet":
          results.push(["header", "Generation 7"]);
          break;
        case "grookey":
          results.push(["header", "Generation 8"]);
          break;
        case "sprigatito":
          results.push(["header", "Generation 9"]);
          break;
        case "missingno":
          results.push(["header", "Glitch"]);
          break;
        case "syclar":
          results.push(["header", "CAP"]);
          break;
        case "pikachucosplay":
          continue;
      }
      results.push(["pokemon", id]);
    }
    return results;
  }
  getBaseResults() {
    const format = this.format;
    if (!format) return this.getDefaultResults();
    const isVGCOrBS = format.startsWith("battlespot") || format.startsWith("bss") || format.startsWith("battlestadium") || format.startsWith("vgc");
    const isHackmons = format.includes("hackmons") || format.endsWith("bh");
    let isDoublesOrBS = isVGCOrBS || this.formatType?.includes("doubles");
    const dex = this.dex;
    let table = BattleTeambuilderTable;
    if ((format.endsWith("cap") || format.endsWith("caplc")) && dex.gen < 9) {
      table = table[`gen${dex.gen}`];
    } else if (isVGCOrBS) {
      table = table[`gen${dex.gen}vgc`];
    } else if (dex.gen === 9 && isHackmons && !this.formatType) {
      table = table["bh"];
    } else if (table[`gen${dex.gen}doubles`] && dex.gen > 4 && this.formatType !== "letsgo" && this.formatType !== "bdspdoubles" && this.formatType !== "ssdlc1doubles" && this.formatType !== "predlcdoubles" && this.formatType !== "svdlc1doubles" && !this.formatType?.includes("natdex") && (format.includes("doubles") || format.includes("triples") || format === "freeforall" || format.startsWith("ffa") || format === "partnersincrime")) {
      table = table[`gen${dex.gen}doubles`];
      isDoublesOrBS = true;
    } else if (dex.gen < 9 && !this.formatType) {
      table = table[`gen${dex.gen}`];
    } else if (this.formatType?.startsWith("bdsp")) {
      table = table["gen8" + this.formatType];
    } else if (this.formatType === "letsgo") {
      table = table["gen7letsgo"];
    } else if (this.formatType === "bw1") {
      table = table["gen5bw1"];
    } else if (this.formatType === "rs") {
      table = table["gen3rs"];
    } else if (this.formatType === "natdex") {
      table = table[`gen${dex.gen}natdex`];
    } else if (this.formatType === "metronome") {
      table = table[`gen${dex.gen}metronome`];
    } else if (this.formatType === "nfe") {
      table = table[`gen${dex.gen}nfe`];
    } else if (this.formatType === "lc") {
      table = table[`gen${dex.gen}lc`];
    } else if (this.formatType?.startsWith("ssdlc1")) {
      if (this.formatType.includes("doubles")) {
        table = table["gen8dlc1doubles"];
      } else {
        table = table["gen8dlc1"];
      }
    } else if (this.formatType?.startsWith("predlc")) {
      if (this.formatType.includes("doubles")) {
        table = table["gen9predlcdoubles"];
      } else if (this.formatType.includes("natdex")) {
        table = table["gen9predlcnatdex"];
      } else {
        table = table["gen9predlc"];
      }
    } else if (this.formatType?.startsWith("svdlc1")) {
      if (this.formatType.includes("doubles")) {
        table = table["gen9dlc1doubles"];
      } else if (this.formatType.includes("natdex")) {
        table = table["gen9dlc1natdex"];
      } else {
        table = table["gen9dlc1"];
      }
    } else if (this.formatType === "stadium") {
      table = table[`gen${dex.gen}stadium${dex.gen > 1 ? dex.gen : ""}`];
    }
    if (!table.tierSet) {
      table.tierSet = table.tiers.map((r) => {
        if (typeof r === "string") return ["pokemon", r];
        return [r[0], r[1]];
      });
      table.tiers = null;
    }
    let tierSet = table.tierSet;
    let slices = table.formatSlices;
    if (format === "ubers" || format === "uber" || format === "ubersuu" || format === "nationaldexdoubles") {
      tierSet = tierSet.slice(slices.Uber);
    } else if (isVGCOrBS || isHackmons && dex.gen === 9 && !this.formatType) {
      if (format.endsWith("series13") || isHackmons) {
      } else if (format === "vgc2010" || format === "vgc2016" || format.startsWith("vgc2019") || format === "vgc2022" || format.endsWith("regg") || format.endsWith("regi")) {
        tierSet = tierSet.slice(slices["Restricted Legendary"]);
      } else {
        tierSet = tierSet.slice(slices.Regular);
      }
      if (format.endsWith("regh")) {
        tierSet = tierSet.filter(([type, id]) => {
          const tags = import_battle_dex.Dex.species.get(import_battle_dex.Dex.species.get(id).baseSpecies).tags;
          return !tags.includes("Sub-Legendary") && !tags.includes("Paradox") && // The game does not classify these as Paradox Pokemon (Booster Energy can be knocked off)
          !["gougingfire", "ironboulder", "ironcrown", "ragingbolt"].includes(id);
        });
      }
    } else if (format === "ou") tierSet = tierSet.slice(slices.OU);
    else if (format === "uubl") tierSet = tierSet.slice(slices.UUBL);
    else if (format === "uu") tierSet = tierSet.slice(slices.UU);
    else if (format === "ru") tierSet = tierSet.slice(slices.RU || slices.UU);
    else if (format === "nu") tierSet = tierSet.slice(slices.NU || slices.RU || slices.UU);
    else if (format === "pu") tierSet = tierSet.slice(slices.PU || slices.NU);
    else if (format === "zu" && dex.gen === 5) tierSet = tierSet.slice(slices.PU || slices.NU);
    else if (format === "zu") tierSet = tierSet.slice(slices.ZU || slices.PU || slices.NU);
    else if (format === "lc" || format === "lcuu" || format.startsWith("lc") || format !== "caplc" && format.endsWith("lc")) tierSet = tierSet.slice(slices.LC);
    else if (format === "cap" || format.endsWith("cap")) {
      tierSet = tierSet.slice(0, slices.AG || slices.Uber).concat(tierSet.slice(slices.OU));
    } else if (format === "caplc") {
      tierSet = tierSet.slice(slices["CAP LC"], slices.AG || slices.Uber).concat(tierSet.slice(slices.LC));
    } else if (format === "anythinggoes" || format.endsWith("ag") || format.startsWith("ag")) {
      tierSet = tierSet.slice(slices.AG);
    } else if (isHackmons && (dex.gen < 9 || this.formatType === "natdex")) {
      tierSet = tierSet.slice(slices.AG || slices.Uber);
    } else if (format === "monotype" || format.startsWith("monothreat")) tierSet = tierSet.slice(slices.Uber);
    else if (format === "doublesubers") tierSet = tierSet.slice(slices.DUber);
    else if (format === "doublesou" && dex.gen > 4) tierSet = tierSet.slice(slices.DOU);
    else if (format === "doublesuu") tierSet = tierSet.slice(slices.DUU);
    else if (format === "doublesnu") tierSet = tierSet.slice(slices.DNU || slices.DUU);
    else if (this.formatType?.startsWith("bdsp") || this.formatType === "letsgo" || this.formatType === "stadium") {
      tierSet = tierSet.slice(slices.Uber);
    } else if (this.formatType === "rs") {
      tierSet = tierSet.slice(slices.Regular);
    } else if (!isDoublesOrBS) {
      tierSet = [
        ...tierSet.slice(slices.OU, slices.UU),
        ...tierSet.slice(slices.AG, slices.Uber),
        ...tierSet.slice(slices.Uber, slices.OU),
        ...tierSet.slice(slices.UU)
      ];
    } else {
      tierSet = [
        ...tierSet.slice(slices.DOU, slices.DUU),
        ...tierSet.slice(slices.DUber, slices.DOU),
        ...tierSet.slice(slices.DUU)
      ];
    }
    if (format === "ubersuu" && table.ubersUUBans) {
      tierSet = tierSet.filter(([type, id]) => {
        if (id in table.ubersUUBans) return false;
        return true;
      });
    }
    if (format === "doubles" && this.formatType === "natdex" && table.ndDoublesBans) {
      tierSet = tierSet.filter(([type, id]) => {
        if (id in table.ndDoublesBans) return false;
        return true;
      });
    }
    if (format === "35pokes" && table.thirtyfivePokes) {
      tierSet = tierSet.filter(([type, id]) => {
        if (id in table.thirtyfivePokes) return true;
        return false;
      });
    }
    if (dex.gen >= 5) {
      if ((format === "monotype" || format.startsWith("monothreat")) && table.monotypeBans) {
        tierSet = tierSet.filter(([type, id]) => {
          if (id in table.monotypeBans) return false;
          return true;
        });
      }
    }
    if (format === "zu" && dex.gen === 5 && table.gen5zuBans) {
      tierSet = tierSet.filter(([type, id]) => {
        if (id in table.gen5zuBans) return false;
        return true;
      });
    }
    if (!(/^(battlestadium|vgc|doublesubers)/g.test(format) || format === "doubles" && this.formatType === "natdex")) {
      tierSet = tierSet.filter(([type, id]) => {
        if (type === "header" && id === "DUber by technicality") return false;
        if (type === "header" && id === "Uber by technicality") return false;
        if (type === "pokemon") return !id.endsWith("gmax");
        return true;
      });
    }
    return tierSet;
  }
  filter(row, filters) {
    if (!filters) return true;
    if (row[0] !== "pokemon") return true;
    const species = this.dex.species.get(row[1]);
    for (const [filterType, value] of filters) {
      switch (filterType) {
        case "type":
          if (species.types[0] !== value && species.types[1] !== value) return false;
          break;
        case "egggroup":
          if (species.eggGroups[0] !== value && species.eggGroups[1] !== value) return false;
          break;
        case "tier":
          if (this.getTier(species) !== value) return false;
          break;
        case "ability":
          if (!import_battle_dex.Dex.hasAbility(species, value)) return false;
          break;
        case "move":
          if (!this.canLearn(species.id, value)) return false;
      }
    }
    return true;
  }
  sort(results, sortCol, reverseSort) {
    const sortOrder = reverseSort ? -1 : 1;
    if (["hp", "atk", "def", "spa", "spd", "spe"].includes(sortCol)) {
      return results.sort(([rowType1, id1], [rowType2, id2]) => {
        const stat1 = this.dex.species.get(id1).baseStats[sortCol];
        const stat2 = this.dex.species.get(id2).baseStats[sortCol];
        return (stat2 - stat1) * sortOrder;
      });
    } else if (sortCol === "bst") {
      return results.sort(([rowType1, id1], [rowType2, id2]) => {
        const base1 = this.dex.species.get(id1).baseStats;
        const base2 = this.dex.species.get(id2).baseStats;
        let bst1 = base1.hp + base1.atk + base1.def + base1.spa + base1.spd + base1.spe;
        let bst2 = base2.hp + base2.atk + base2.def + base2.spa + base2.spd + base2.spe;
        if (this.dex.gen === 1) {
          bst1 -= base1.spd;
          bst2 -= base2.spd;
        }
        return (bst2 - bst1) * sortOrder;
      });
    } else if (sortCol === "name") {
      return results.sort(([rowType1, id1], [rowType2, id2]) => {
        const name1 = id1;
        const name2 = id2;
        return (name1 < name2 ? -1 : name1 > name2 ? 1 : 0) * sortOrder;
      });
    }
    throw new Error("invalid sortcol");
  }
}
class BattleAbilitySearch extends BattleTypedSearch {
  getTable() {
    return BattleAbilities;
  }
  getDefaultResults(reverseSort) {
    const results = [];
    for (let id in BattleAbilities) {
      results.push(["ability", id]);
    }
    if (reverseSort) results.reverse();
    return results;
  }
  getBaseResults() {
    if (!this.species) return this.getDefaultResults();
    const format = this.format;
    const isHackmons = format.includes("hackmons") || format.endsWith("bh");
    const isAAA = format === "almostanyability" || format.includes("aaa");
    const dex = this.dex;
    let species = dex.species.get(this.species);
    let abilitySet = [["header", "Abilities"]];
    if (species.isMega) {
      abilitySet.unshift(["html", `Will be <strong>${species.abilities["0"]}</strong> after Mega Evolving.`]);
      species = dex.species.get(species.baseSpecies);
    }
    abilitySet.push(["ability", (0, import_battle_dex.toID)(species.abilities["0"])]);
    if (species.abilities["1"]) {
      abilitySet.push(["ability", (0, import_battle_dex.toID)(species.abilities["1"])]);
    }
    if (species.abilities["H"]) {
      abilitySet.push(["header", "Hidden Ability"]);
      abilitySet.push(["ability", (0, import_battle_dex.toID)(species.abilities["H"])]);
    }
    if (species.abilities["S"]) {
      abilitySet.push(["header", "Special Event Ability"]);
      abilitySet.push(["ability", (0, import_battle_dex.toID)(species.abilities["S"])]);
    }
    if (isAAA || format.includes("metronomebattle") || isHackmons) {
      let abilities = [];
      for (let i in this.getTable()) {
        const ability = dex.abilities.get(i);
        if (ability.isNonstandard) continue;
        if (ability.gen > dex.gen) continue;
        abilities.push(ability.id);
      }
      let goodAbilities = [["header", "Abilities"]];
      let poorAbilities = [["header", "Situational Abilities"]];
      let badAbilities = [["header", "Unviable Abilities"]];
      for (const ability of abilities.sort().map((abil) => dex.abilities.get(abil))) {
        let rating = ability.rating;
        if (ability.id === "normalize") rating = 3;
        if (rating >= 3) {
          goodAbilities.push(["ability", ability.id]);
        } else if (rating >= 2) {
          poorAbilities.push(["ability", ability.id]);
        } else {
          badAbilities.push(["ability", ability.id]);
        }
      }
      abilitySet = [...goodAbilities, ...poorAbilities, ...badAbilities];
      if (species.isMega) {
        if (isAAA) {
          abilitySet.unshift(["html", `Will be <strong>${species.abilities["0"]}</strong> after Mega Evolving.`]);
        }
      }
    }
    return abilitySet;
  }
  filter(row, filters) {
    if (!filters) return true;
    if (row[0] !== "ability") return true;
    const ability = this.dex.abilities.get(row[1]);
    for (const [filterType, value] of filters) {
      switch (filterType) {
        case "pokemon":
          if (!import_battle_dex.Dex.hasAbility(this.dex.species.get(value), ability.name)) return false;
          break;
      }
    }
    return true;
  }
  sort(results, sortCol, reverseSort) {
    throw new Error("invalid sortcol");
  }
}
class BattleItemSearch extends BattleTypedSearch {
  getTable() {
    return BattleItems;
  }
  getDefaultResults() {
    let table = BattleTeambuilderTable;
    if (this.formatType?.startsWith("bdsp")) {
      table = table["gen8bdsp"];
    } else if (this.formatType === "bw1") {
      table = table["gen5bw1"];
    } else if (this.formatType === "rs") {
      table = table["gen3rs"];
    } else if (this.formatType === "natdex") {
      table = table[`gen${this.dex.gen}natdex`];
    } else if (this.formatType?.endsWith("doubles")) {
      table = table[`gen${this.dex.gen}doubles`];
    } else if (this.formatType === "metronome") {
      table = table[`gen${this.dex.gen}metronome`];
    } else if (this.dex.gen < 9) {
      table = table[`gen${this.dex.gen}`];
    }
    if (!table.itemSet) {
      table.itemSet = table.items.map((r) => {
        if (typeof r === "string") {
          return ["item", r];
        }
        return [r[0], r[1]];
      });
      table.items = null;
    }
    return table.itemSet;
  }
  getBaseResults() {
    if (!this.species) return this.getDefaultResults();
    const speciesName = this.dex.species.get(this.species).name;
    const results = this.getDefaultResults();
    const speciesSpecific = [];
    const abilitySpecific = [];
    const abilityItem = {
      protosynthesis: "boosterenergy",
      quarkdrive: "boosterenergy"
      // poisonheal: 'toxicorb',
      // toxicboost: 'toxicorb',
      // flareboost: 'flameorb',
    }[(0, import_battle_dex.toID)(this.set?.ability)];
    for (const row of results) {
      if (row[0] !== "item") continue;
      const item = this.dex.items.get(row[1]);
      if (item.itemUser?.includes(speciesName)) speciesSpecific.push(row);
      if (abilityItem === item.id) abilitySpecific.push(row);
    }
    if (speciesSpecific.length) {
      return [
        ["header", "Specific to " + speciesName],
        ...speciesSpecific,
        ...results
      ];
    }
    if (abilitySpecific.length) {
      return [
        ["header", `Specific to ${this.set.ability}`],
        ...abilitySpecific,
        ...results
      ];
    }
    return results;
  }
  defaultFilter(results) {
    if (this.species && !this.dex.species.get(this.species).nfe) {
      results.splice(results.findIndex((row) => row[1] === "eviolite"), 1);
      return results;
    }
    return results;
  }
  filter(row, filters) {
    return true;
  }
  sort(results, sortCol, reverseSort) {
    throw new Error("invalid sortcol");
  }
}
class BattleMoveSearch extends BattleTypedSearch {
  constructor() {
    super(...arguments);
    this.sortRow = ["sortmove", ""];
  }
  getTable() {
    return BattleMovedex;
  }
  getDefaultResults() {
    let results = [];
    results.push(["header", "Moves"]);
    for (let id in BattleMovedex) {
      switch (id) {
        case "paleowave":
          results.push(["header", "CAP moves"]);
          break;
        case "magikarpsrevenge":
          continue;
      }
      results.push(["move", id]);
    }
    return results;
  }
  moveIsNotUseless(id, species, moves, set) {
    const dex = this.dex;
    let abilityid = set ? (0, import_battle_dex.toID)(set.ability) : "";
    const itemid = set ? (0, import_battle_dex.toID)(set.item) : "";
    if (dex.gen === 1) {
      if ([
        "acidarmor",
        "amnesia",
        "barrier",
        "bind",
        "blizzard",
        "clamp",
        "confuseray",
        "counter",
        "firespin",
        "growth",
        "headbutt",
        "hyperbeam",
        "mirrormove",
        "pinmissile",
        "razorleaf",
        "sing",
        "slash",
        "sludge",
        "twineedle",
        "wrap"
      ].includes(id)) {
        return true;
      }
      if ([
        "disable",
        "haze",
        "leechseed",
        "quickattack",
        "roar",
        "thunder",
        "toxic",
        "triattack",
        "waterfall",
        "whirlwind"
      ].includes(id)) {
        return false;
      }
      switch (id) {
        case "bubblebeam":
          return !moves.includes("surf") && !moves.includes("blizzard");
        case "doubleedge":
          return !moves.includes("bodyslam");
        case "doublekick":
          return !moves.includes("submission");
        case "firepunch":
          return !moves.includes("fireblast");
        case "megadrain":
          return !moves.includes("razorleaf") && !moves.includes("surf");
        case "megakick":
          return !moves.includes("hyperbeam");
        case "reflect":
          return !moves.includes("barrier") && !moves.includes("acidarmor");
        case "stomp":
          return !moves.includes("headbutt");
        case "submission":
          return !moves.includes("highjumpkick");
        case "thunderpunch":
          return !moves.includes("thunderbolt");
        case "triattack":
          return !moves.includes("bodyslam");
      }
      if (this.formatType === "stadium") {
        if (["doubleedge", "focusenergy", "haze"].includes(id)) return true;
        if (["hyperbeam", "sing", "hypnosis"].includes(id)) return false;
        switch (id) {
          case "fly":
            return !moves.includes("drillpeck");
          case "dig":
            return !moves.includes("earthquake");
        }
      }
    }
    if (this.formatType === "letsgo") {
      if (["megadrain", "teleport"].includes(id)) return true;
    }
    if (this.formatType === "metronome") {
      if (id === "metronome") return true;
    }
    if (itemid === "pidgeotite") abilityid = "noguard";
    if (itemid === "blastoisinite") abilityid = "megalauncher";
    if (itemid === "aerodactylite") abilityid = "toughclaws";
    if (itemid === "glalitite") abilityid = "refrigerate";
    switch (id) {
      case "fakeout":
      case "flamecharge":
      case "nuzzle":
      case "poweruppunch":
      case "trailblaze":
        return abilityid !== "sheerforce";
      case "solarbeam":
      case "solarblade":
        return ["desolateland", "drought", "chlorophyll", "orichalcumpulse"].includes(abilityid) || itemid === "powerherb";
      case "dynamicpunch":
      case "grasswhistle":
      case "inferno":
      case "sing":
        return abilityid === "noguard";
      case "heatcrash":
      case "heavyslam":
        return species.weightkg >= (species.evos ? 75 : 130);
      case "aerialace":
        return ["technician", "toughclaws"].includes(abilityid) && !moves.includes("bravebird");
      case "ancientpower":
        return ["serenegrace", "technician"].includes(abilityid) || !moves.includes("powergem");
      case "aquajet":
        return !moves.includes("jetpunch");
      case "aurawheel":
        return species.baseSpecies === "Morpeko";
      case "axekick":
        return !moves.includes("highjumpkick");
      case "bellydrum":
        return moves.includes("aquajet") || moves.includes("jetpunch") || moves.includes("extremespeed") || ["iceface", "unburden"].includes(abilityid);
      case "bulletseed":
        return ["skilllink", "technician"].includes(abilityid);
      case "chillingwater":
        return !moves.includes("scald");
      case "counter":
        return species.baseStats.hp >= 65;
      case "dazzlinggleam":
        return !moves.includes("alluringvoice") || this.formatType?.includes("doubles");
      case "darkvoid":
        return dex.gen < 7;
      case "dualwingbeat":
        return abilityid === "technician" || !moves.includes("drillpeck");
      case "electroshot":
        return true;
      case "feint":
        return abilityid === "refrigerate";
      case "futuresight":
        return dex.gen > 5;
      case "grassyglide":
        return abilityid === "grassysurge";
      case "gyroball":
        return species.baseStats.spe <= 60;
      case "headbutt":
        return abilityid === "serenegrace";
      case "hex":
        return !moves.includes("infernalparade");
      case "hiddenpowerelectric":
        return dex.gen < 4 && !moves.includes("thunderpunch") && !moves.includes("thunderbolt");
      case "hiddenpowerfighting":
        return dex.gen < 4 && !moves.includes("brickbreak") && !moves.includes("aurasphere") && !moves.includes("focusblast");
      case "hiddenpowerfire":
        return dex.gen < 4 && !moves.includes("firepunch") && !moves.includes("flamethrower") && !moves.includes("mysticalfire") && !moves.includes("burningjealousy");
      case "hiddenpowergrass":
        return dex.gen < 4 && !moves.includes("leafblade") || dex.gen > 3 && !moves.includes("energyball") && !moves.includes("grassknot") && !moves.includes("gigadrain");
      case "hiddenpowerice":
        return !moves.includes("icebeam") && (dex.gen < 4 && !moves.includes("icepunch")) || dex.gen > 5 && !moves.includes("aurorabeam") && !moves.includes("glaciate");
      case "hiddenpowerflying":
        return dex.gen < 4 && !moves.includes("drillpeck");
      case "hiddenpowerbug":
        return dex.gen < 4 && !moves.includes("megahorn");
      case "hiddenpowerpsychic":
        return species.baseSpecies === "Unown";
      case "hyperspacefury":
        return species.id === "hoopaunbound";
      case "hypnosis":
        return dex.gen < 4 && !moves.includes("sleeppowder") || dex.gen > 6 && abilityid === "baddreams";
      case "icepunch":
        return !moves.includes("icespinner") || ["sheerforce", "ironfist"].includes(abilityid) || itemid === "punchingglove";
      case "iciclecrash":
        return !moves.includes("mountaingale");
      case "iciclespear":
        return dex.gen > 3;
      case "icywind":
        return species.baseSpecies === "Keldeo" || this.formatType === "doubles";
      case "infestation":
        return moves.includes("stickyweb");
      case "irondefense":
        return !moves.includes("acidarmor");
      case "irontail":
        return dex.gen > 5 && !moves.includes("ironhead") && !moves.includes("gunkshot") && !moves.includes("poisonjab");
      case "jumpkick":
        return !moves.includes("highjumpkick") && !moves.includes("axekick");
      case "lastresort":
        return set && set.moves.length < 3;
      case "leafblade":
        return dex.gen < 4;
      case "leechlife":
        return dex.gen > 6;
      case "magiccoat":
        return dex.gen > 3;
      case "meteorbeam":
        return true;
      case "mysticalfire":
        return dex.gen > 6 && !moves.includes("flamethrower");
      case "naturepower":
        return dex.gen === 5;
      case "needlearm":
        return dex.gen < 4;
      case "nightslash":
        return !moves.includes("crunch") && !(moves.includes("knockoff") && dex.gen >= 6);
      case "outrage":
        return dex.gen > 3 && !moves.includes("glaiverush");
      case "petaldance":
        return abilityid === "owntempo";
      case "phantomforce":
        return !moves.includes("poltergeist") && !moves.includes("shadowclaw") || this.formatType === "doubles";
      case "poisonfang":
        return species.types.includes("Poison") && !moves.includes("gunkshot") && !moves.includes("poisonjab");
      case "raindance":
        return dex.gen < 4;
      case "relicsong":
        return species.id === "meloetta";
      case "refresh":
        return !moves.includes("aromatherapy") && !moves.includes("healbell");
      case "risingvoltage":
        return abilityid === "electricsurge" || abilityid === "hadronengine";
      case "rocktomb":
        return abilityid === "technician";
      case "selfdestruct":
        return dex.gen < 5 && !moves.includes("explosion");
      case "shadowpunch":
        return abilityid === "ironfist" && !moves.includes("ragefist");
      case "shelter":
        return !moves.includes("acidarmor") && !moves.includes("irondefense");
      case "skyuppercut":
        return dex.gen < 4;
      case "smackdown":
        return species.types.includes("Ground");
      case "smartstrike":
        return species.types.includes("Steel") && !moves.includes("ironhead");
      case "soak":
        return abilityid === "unaware";
      case "steelwing":
        return !moves.includes("ironhead");
      case "stompingtantrum":
        return !moves.includes("earthquake") && !moves.includes("drillrun") || this.formatType === "doubles";
      case "stunspore":
        return !moves.includes("thunderwave");
      case "sunnyday":
        return dex.gen < 4;
      case "technoblast":
        return dex.gen > 5 && itemid.endsWith("drive") || itemid === "dousedrive";
      case "teleport":
        return dex.gen > 7;
      case "temperflare":
        return !moves.includes("flareblitz") && !moves.includes("pyroball") && !moves.includes("sacredfire") && !moves.includes("bitterblade") && !moves.includes("firepunch") || this.formatType === "doubles";
      case "terrainpulse":
      case "waterpulse":
        return ["megalauncher", "technician"].includes(abilityid) && !moves.includes("originpulse");
      case "thief":
        return dex.gen === 2;
      case "toxicspikes":
        return abilityid !== "toxicdebris";
      case "triattack":
        return dex.gen > 3;
      case "trickroom":
        return species.baseStats.spe <= 100;
      case "wildcharge":
        return !moves.includes("supercellslam");
      case "zapcannon":
        return abilityid === "noguard" || dex.gen < 4 && !moves.includes("thunderwave");
    }
    if (this.formatType === "doubles" && BattleMoveSearch.GOOD_DOUBLES_MOVES.includes(id)) {
      return true;
    }
    const move = dex.moves.get(id);
    if (!move.exists) return true;
    if ((move.status === "slp" || id === "yawn") && dex.gen === 9 && !this.formatType) {
      return false;
    }
    if (move.category === "Status") {
      return BattleMoveSearch.GOOD_STATUS_MOVES.includes(id);
    }
    if (move.basePower < 75) {
      return BattleMoveSearch.GOOD_WEAK_MOVES.includes(id);
    }
    if (id === "skydrop") return true;
    if (move.flags["charge"]) {
      return itemid === "powerherb";
    }
    if (move.flags["recharge"]) {
      return false;
    }
    if (move.flags["slicing"] && abilityid === "sharpness") {
      return true;
    }
    return !BattleMoveSearch.BAD_STRONG_MOVES.includes(id);
  }
  static {
    this.GOOD_STATUS_MOVES = [
      "acidarmor",
      "agility",
      "aromatherapy",
      "auroraveil",
      "autotomize",
      "banefulbunker",
      "batonpass",
      "bellydrum",
      "bulkup",
      "burningbulwark",
      "calmmind",
      "chillyreception",
      "clangoroussoul",
      "coil",
      "cottonguard",
      "courtchange",
      "curse",
      "defog",
      "destinybond",
      "detect",
      "disable",
      "dragondance",
      "encore",
      "extremeevoboost",
      "filletaway",
      "geomancy",
      "glare",
      "haze",
      "healbell",
      "healingwish",
      "healorder",
      "heartswap",
      "honeclaws",
      "kingsshield",
      "leechseed",
      "lightscreen",
      "lovelykiss",
      "lunardance",
      "magiccoat",
      "maxguard",
      "memento",
      "milkdrink",
      "moonlight",
      "morningsun",
      "nastyplot",
      "naturesmadness",
      "noretreat",
      "obstruct",
      "painsplit",
      "partingshot",
      "perishsong",
      "protect",
      "quiverdance",
      "recover",
      "reflect",
      "reflecttype",
      "rest",
      "revivalblessing",
      "roar",
      "rockpolish",
      "roost",
      "shedtail",
      "shellsmash",
      "shiftgear",
      "shoreup",
      "silktrap",
      "slackoff",
      "sleeppowder",
      "sleeptalk",
      "softboiled",
      "spikes",
      "spikyshield",
      "spore",
      "stealthrock",
      "stickyweb",
      "strengthsap",
      "substitute",
      "switcheroo",
      "swordsdance",
      "synthesis",
      "tailglow",
      "tailwind",
      "taunt",
      "thunderwave",
      "tidyup",
      "toxic",
      "transform",
      "trick",
      "victorydance",
      "whirlwind",
      "willowisp",
      "wish",
      "yawn"
    ];
  }
  static {
    this.GOOD_WEAK_MOVES = [
      "accelerock",
      "acrobatics",
      "aquacutter",
      "avalanche",
      "barbbarrage",
      "bonemerang",
      "bouncybubble",
      "bulletpunch",
      "buzzybuzz",
      "ceaselessedge",
      "circlethrow",
      "clearsmog",
      "doubleironbash",
      "dragondarts",
      "dragontail",
      "drainingkiss",
      "endeavor",
      "facade",
      "firefang",
      "flipturn",
      "flowertrick",
      "freezedry",
      "frustration",
      "geargrind",
      "gigadrain",
      "grassknot",
      "gyroball",
      "icefang",
      "iceshard",
      "iciclespear",
      "infernalparade",
      "knockoff",
      "lastrespects",
      "lowkick",
      "machpunch",
      "mortalspin",
      "mysticalpower",
      "naturesmadness",
      "nightshade",
      "nuzzle",
      "pikapapow",
      "populationbomb",
      "psychocut",
      "psyshieldbash",
      "pursuit",
      "quickattack",
      "ragefist",
      "rapidspin",
      "return",
      "rockblast",
      "ruination",
      "saltcure",
      "scorchingsands",
      "seismictoss",
      "shadowclaw",
      "shadowsneak",
      "sizzlyslide",
      "stoneaxe",
      "storedpower",
      "stormthrow",
      "suckerpunch",
      "superfang",
      "surgingstrikes",
      "tachyoncutter",
      "tailslap",
      "thunderclap",
      "tripleaxel",
      "tripledive",
      "twinbeam",
      "uturn",
      "veeveevolley",
      "voltswitch",
      "watershuriken",
      "weatherball"
    ];
  }
  static {
    this.BAD_STRONG_MOVES = [
      "belch",
      "burnup",
      "crushclaw",
      "dragonrush",
      "dreameater",
      "eggbomb",
      "firepledge",
      "flyingpress",
      "futuresight",
      "grasspledge",
      "hyperbeam",
      "hyperfang",
      "hyperspacehole",
      "jawlock",
      "landswrath",
      "megakick",
      "megapunch",
      "mistyexplosion",
      "muddywater",
      "nightdaze",
      "pollenpuff",
      "rockclimb",
      "selfdestruct",
      "shelltrap",
      "skyuppercut",
      "slam",
      "strength",
      "submission",
      "synchronoise",
      "takedown",
      "thrash",
      "uproar",
      "waterpledge"
    ];
  }
  static {
    this.GOOD_DOUBLES_MOVES = [
      "allyswitch",
      "bulldoze",
      "coaching",
      "electroweb",
      "faketears",
      "fling",
      "followme",
      "healpulse",
      "helpinghand",
      "junglehealing",
      "lifedew",
      "lunarblessing",
      "muddywater",
      "pollenpuff",
      "psychup",
      "ragepowder",
      "safeguard",
      "skillswap",
      "snipeshot",
      "wideguard"
    ];
  }
  getBaseResults() {
    if (!this.species) return this.getDefaultResults();
    const dex = this.dex;
    let species = dex.species.get(this.species);
    const format = this.format;
    const isHackmons = format.includes("hackmons") || format.endsWith("bh");
    const isSTABmons = format.includes("stabmons") || format === "staaabmons";
    const isTradebacks = format.includes("tradebacks");
    const regionBornLegality = dex.gen >= 6 && (/^battle(spot|stadium|festival)/.test(format) || format.startsWith("bss") || format.startsWith("vgc") || dex.gen === 9 && this.formatType !== "natdex");
    let learnsetid = this.firstLearnsetid(species.id);
    let moves = [];
    let sketchMoves = [];
    let sketch = false;
    let gen = `${dex.gen}`;
    let lsetTable = BattleTeambuilderTable;
    if (this.formatType?.startsWith("bdsp")) lsetTable = lsetTable["gen8bdsp"];
    if (this.formatType === "letsgo") lsetTable = lsetTable["gen7letsgo"];
    if (this.formatType === "bw1") lsetTable = lsetTable["gen5bw1"];
    if (this.formatType === "rs") lsetTable = lsetTable["gen3rs"];
    if (this.formatType?.startsWith("ssdlc1")) lsetTable = lsetTable["gen8dlc1"];
    if (this.formatType?.startsWith("predlc")) lsetTable = lsetTable["gen9predlc"];
    if (this.formatType?.startsWith("svdlc1")) lsetTable = lsetTable["gen9dlc1"];
    while (learnsetid) {
      let learnset = lsetTable.learnsets[learnsetid];
      if (learnset) {
        for (let moveid in learnset) {
          let learnsetEntry = learnset[moveid];
          const move = dex.moves.get(moveid);
          const minGenCode = { 6: "p", 7: "q", 8: "g", 9: "a" };
          if (regionBornLegality && !learnsetEntry.includes(minGenCode[dex.gen])) {
            continue;
          }
          if (this.eggMovesOnly(learnsetid, species.id) && (!learnsetEntry.includes("e") || dex.gen !== 9)) {
            continue;
          }
          if (!learnsetEntry.includes(gen) && (!isTradebacks ? true : !(move.gen <= dex.gen && learnsetEntry.includes(`${dex.gen + 1}`)))) {
            continue;
          }
          if (this.formatType !== "natdex" && move.isNonstandard === "Past") {
            continue;
          }
          if (this.formatType?.startsWith("dlc1") && BattleTeambuilderTable["gen8dlc1"]?.nonstandardMoves.includes(moveid)) {
            continue;
          }
          if (this.formatType?.includes("predlc") && this.formatType !== "predlcnatdex" && BattleTeambuilderTable["gen9predlc"]?.nonstandardMoves.includes(moveid)) {
            continue;
          }
          if (this.formatType?.includes("svdlc1") && this.formatType !== "svdlc1natdex" && BattleTeambuilderTable["gen9dlc1"]?.nonstandardMoves.includes(moveid)) {
            continue;
          }
          if (moves.includes(moveid)) continue;
          moves.push(moveid);
          if (moveid === "sketch") sketch = true;
          if (moveid === "hiddenpower") {
            moves.push(
              "hiddenpowerbug",
              "hiddenpowerdark",
              "hiddenpowerdragon",
              "hiddenpowerelectric",
              "hiddenpowerfighting",
              "hiddenpowerfire",
              "hiddenpowerflying",
              "hiddenpowerghost",
              "hiddenpowergrass",
              "hiddenpowerground",
              "hiddenpowerice",
              "hiddenpowerpoison",
              "hiddenpowerpsychic",
              "hiddenpowerrock",
              "hiddenpowersteel",
              "hiddenpowerwater"
            );
          }
        }
      }
      learnsetid = this.nextLearnsetid(learnsetid, species.id, true);
    }
    if (sketch || isHackmons) {
      if (isHackmons) moves = [];
      for (let id in BattleMovedex) {
        if (!format.startsWith("cap") && (id === "paleowave" || id === "shadowstrike")) continue;
        const move = dex.moves.get(id);
        if (move.gen > dex.gen) continue;
        if (sketch) {
          if (move.flags["nosketch"] || move.isMax || move.isZ) continue;
          if (move.isNonstandard && move.isNonstandard !== "Past") continue;
          if (move.isNonstandard === "Past" && this.formatType !== "natdex") continue;
          sketchMoves.push(move.id);
        } else {
          if (!(dex.gen < 8 || this.formatType === "natdex") && move.isZ) continue;
          if (typeof move.isMax === "string") continue;
          if (move.isMax && dex.gen > 8) continue;
          if (move.isNonstandard === "Past" && this.formatType !== "natdex") continue;
          if (move.isNonstandard === "LGPE" && this.formatType !== "letsgo") continue;
          moves.push(move.id);
        }
      }
    }
    if (this.formatType === "metronome") moves = ["metronome"];
    if (isSTABmons) {
      for (let id in this.getTable()) {
        const move = dex.moves.get(id);
        if (moves.includes(move.id)) continue;
        if (move.gen > dex.gen) continue;
        if (move.isZ || move.isMax || move.isNonstandard && move.isNonstandard !== "Unobtainable") continue;
        const speciesTypes = [];
        const moveTypes = [];
        for (let i = dex.gen; i >= species.gen && i >= move.gen; i--) {
          const genDex = import_battle_dex.Dex.forGen(i);
          moveTypes.push(genDex.moves.get(move.name).type);
          const pokemon = genDex.species.get(species.name);
          let baseSpecies = genDex.species.get(pokemon.changesFrom || pokemon.name);
          if (!pokemon.battleOnly) speciesTypes.push(...pokemon.types);
          let prevo = pokemon.prevo;
          while (prevo) {
            const prevoSpecies = genDex.species.get(prevo);
            speciesTypes.push(...prevoSpecies.types);
            prevo = prevoSpecies.prevo;
          }
          if (pokemon.battleOnly && typeof pokemon.battleOnly === "string") {
            species = dex.species.get(pokemon.battleOnly);
          }
          const excludedForme = (s) => [
            "Alola",
            "Alola-Totem",
            "Galar",
            "Galar-Zen",
            "Hisui",
            "Paldea",
            "Paldea-Combat",
            "Paldea-Blaze",
            "Paldea-Aqua"
          ].includes(s.forme);
          if (baseSpecies.otherFormes && !["Wormadam", "Urshifu"].includes(baseSpecies.baseSpecies)) {
            if (!excludedForme(species)) speciesTypes.push(...baseSpecies.types);
            for (const formeName of baseSpecies.otherFormes) {
              const forme = dex.species.get(formeName);
              if (!forme.battleOnly && !excludedForme(forme)) speciesTypes.push(...forme.types);
            }
          }
        }
        let valid = false;
        for (let type of moveTypes) {
          if (speciesTypes.includes(type)) {
            valid = true;
            break;
          }
        }
        if (valid) moves.push(id);
      }
    }
    moves.sort();
    sketchMoves.sort();
    let usableMoves = [];
    let uselessMoves = [];
    for (const id of moves) {
      const isUsable = this.moveIsNotUseless(id, species, moves, this.set);
      if (isUsable) {
        if (!usableMoves.length) usableMoves.push(["header", "Moves"]);
        usableMoves.push(["move", id]);
      } else {
        if (!uselessMoves.length) uselessMoves.push(["header", "Usually useless moves"]);
        uselessMoves.push(["move", id]);
      }
    }
    if (sketchMoves.length) {
      usableMoves.push(["header", "Sketched moves"]);
      uselessMoves.push(["header", "Useless sketched moves"]);
    }
    for (const id of sketchMoves) {
      const isUsable = this.moveIsNotUseless(id, species, sketchMoves, this.set);
      if (isUsable) {
        usableMoves.push(["move", id]);
      } else {
        uselessMoves.push(["move", id]);
      }
    }
    return [...usableMoves, ...uselessMoves];
  }
  filter(row, filters) {
    if (!filters) return true;
    if (row[0] !== "move") return true;
    const move = this.dex.moves.get(row[1]);
    for (const [filterType, value] of filters) {
      switch (filterType) {
        case "type":
          if (move.type !== value) return false;
          break;
        case "category":
          if (move.category !== value) return false;
          break;
        case "pokemon":
          if (!this.canLearn(value, move.id)) return false;
          break;
      }
    }
    return true;
  }
  sort(results, sortCol, reverseSort) {
    const sortOrder = reverseSort ? -1 : 1;
    switch (sortCol) {
      case "power":
        let powerTable = {
          return: 102,
          frustration: 102,
          spitup: 300,
          trumpcard: 200,
          naturalgift: 80,
          grassknot: 120,
          lowkick: 120,
          gyroball: 150,
          electroball: 150,
          flail: 200,
          reversal: 200,
          present: 120,
          wringout: 120,
          crushgrip: 120,
          heatcrash: 120,
          heavyslam: 120,
          fling: 130,
          magnitude: 150,
          beatup: 24,
          punishment: 1020,
          psywave: 1250,
          nightshade: 1200,
          seismictoss: 1200,
          dragonrage: 1140,
          sonicboom: 1120,
          superfang: 1350,
          endeavor: 1399,
          sheercold: 1501,
          fissure: 1500,
          horndrill: 1500,
          guillotine: 1500
        };
        return results.sort(([rowType1, id1], [rowType2, id2]) => {
          let move1 = this.dex.moves.get(id1);
          let move2 = this.dex.moves.get(id2);
          let pow1 = move1.basePower || powerTable[id1] || (move1.category === "Status" ? -1 : 1400);
          let pow2 = move2.basePower || powerTable[id2] || (move2.category === "Status" ? -1 : 1400);
          return (pow2 - pow1) * sortOrder;
        });
      case "accuracy":
        return results.sort(([rowType1, id1], [rowType2, id2]) => {
          let accuracy1 = this.dex.moves.get(id1).accuracy || 0;
          let accuracy2 = this.dex.moves.get(id2).accuracy || 0;
          if (accuracy1 === true) accuracy1 = 101;
          if (accuracy2 === true) accuracy2 = 101;
          return (accuracy2 - accuracy1) * sortOrder;
        });
      case "pp":
        return results.sort(([rowType1, id1], [rowType2, id2]) => {
          let pp1 = this.dex.moves.get(id1).pp || 0;
          let pp2 = this.dex.moves.get(id2).pp || 0;
          return (pp2 - pp1) * sortOrder;
        });
      case "name":
        return results.sort(([rowType1, id1], [rowType2, id2]) => {
          const name1 = id1;
          const name2 = id2;
          return (name1 < name2 ? -1 : name1 > name2 ? 1 : 0) * sortOrder;
        });
    }
    throw new Error("invalid sortcol");
  }
}
class BattleCategorySearch extends BattleTypedSearch {
  getTable() {
    return { physical: 1, special: 1, status: 1 };
  }
  getDefaultResults(reverseSort) {
    const results = [
      ["category", "physical"],
      ["category", "special"],
      ["category", "status"]
    ];
    if (reverseSort) results.reverse();
    return results;
  }
  getBaseResults() {
    return this.getDefaultResults();
  }
  filter(row, filters) {
    throw new Error("invalid filter");
  }
  sort(results, sortCol, reverseSort) {
    throw new Error("invalid sortcol");
  }
}
class BattleTypeSearch extends BattleTypedSearch {
  getTable() {
    return window.BattleTypeChart;
  }
  getDefaultResults(reverseSort) {
    const results = [];
    for (let id in window.BattleTypeChart) {
      results.push(["type", id]);
    }
    if (reverseSort) results.reverse();
    return results;
  }
  getBaseResults() {
    return this.getDefaultResults();
  }
  filter(row, filters) {
    throw new Error("invalid filter");
  }
  sort(results, sortCol, reverseSort) {
    throw new Error("invalid sortcol");
  }
}
//# sourceMappingURL=battle-dex-search.js.map
