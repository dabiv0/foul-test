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
var battle_searchresults_exports = {};
__export(battle_searchresults_exports, {
  PSSearchResults: () => PSSearchResults
});
module.exports = __toCommonJS(battle_searchresults_exports);
var import_preact = __toESM(require("../js/lib/preact"));
var import_battle_dex = require("./battle-dex");
var import_client_main = require("./client-main");
/**
 * Search Results
 *
 * Code for displaying sesrch results from battle-dex-search.ts
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
class PSSearchResults extends import_preact.default.Component {
  constructor() {
    super(...arguments);
    this.URL_ROOT = `//${import_client_main.Config.routes.dex}/`;
    this.speciesId = "";
    this.itemId = "";
    this.abilityId = "";
    this.moveIds = [];
    this.resultIndex = -1;
    this.handleClick = (ev) => {
      const search = this.props.search;
      let target = ev.target;
      while (target && target.className !== "dexlist") {
        if (target.tagName === "A") {
          const entry = target.getAttribute("data-entry");
          if (entry) {
            const [type, name, slot] = entry.split("|");
            if (search.addFilter([type, name])) {
              if (this.props.onSelect) {
                this.props.onSelect?.("", "");
              } else if (search.query) {
                search.find("");
                this.forceUpdate();
              }
            } else {
              this.props.onSelect?.(type, name, slot);
            }
            ev.preventDefault();
            ev.stopImmediatePropagation();
            break;
          }
        }
        if (target.tagName === "BUTTON") {
          const filter = target.getAttribute("data-filter");
          if (filter) {
            search.removeFilter(filter.split(":"));
            search.find("");
            ev.preventDefault();
            ev.stopPropagation();
            this.props.onSelect?.(null, "");
            break;
          }
          const sort = target.getAttribute("data-sort");
          if (sort) {
            search.toggleSort(sort);
            search.find("");
            ev.preventDefault();
            ev.stopPropagation();
            this.props.onSelect?.(null, "");
            break;
          }
        }
        target = target.parentElement;
      }
    };
  }
  renderPokemonSortRow() {
    const search = this.props.search;
    const sortCol = search.sortCol;
    return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h("div", { class: "sortrow" }, /* @__PURE__ */ Chat.h("button", { class: `sortcol numsortcol${!sortCol ? " cur" : ""}` }, !sortCol ? "Sort: " : search.firstPokemonColumn), /* @__PURE__ */ Chat.h("button", { class: `sortcol pnamesortcol${sortCol === "name" ? " cur" : ""}`, "data-sort": "name" }, "Name"), /* @__PURE__ */ Chat.h("button", { class: `sortcol typesortcol${sortCol === "type" ? " cur" : ""}`, "data-sort": "type" }, "Types"), /* @__PURE__ */ Chat.h("button", { class: `sortcol abilitysortcol${sortCol === "ability" ? " cur" : ""}`, "data-sort": "ability" }, "Abilities"), /* @__PURE__ */ Chat.h("button", { class: `sortcol statsortcol${sortCol === "hp" ? " cur" : ""}`, "data-sort": "hp" }, "HP"), /* @__PURE__ */ Chat.h("button", { class: `sortcol statsortcol${sortCol === "atk" ? " cur" : ""}`, "data-sort": "atk" }, "Atk"), /* @__PURE__ */ Chat.h("button", { class: `sortcol statsortcol${sortCol === "def" ? " cur" : ""}`, "data-sort": "def" }, "Def"), /* @__PURE__ */ Chat.h("button", { class: `sortcol statsortcol${sortCol === "spa" ? " cur" : ""}`, "data-sort": "spa" }, "SpA"), /* @__PURE__ */ Chat.h("button", { class: `sortcol statsortcol${sortCol === "spd" ? " cur" : ""}`, "data-sort": "spd" }, "SpD"), /* @__PURE__ */ Chat.h("button", { class: `sortcol statsortcol${sortCol === "spe" ? " cur" : ""}`, "data-sort": "spe" }, "Spe"), /* @__PURE__ */ Chat.h("button", { class: `sortcol statsortcol${sortCol === "bst" ? " cur" : ""}`, "data-sort": "bst" }, "BST")));
  }
  renderMoveSortRow() {
    const sortCol = this.props.search.sortCol;
    return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h("div", { class: "sortrow" }, /* @__PURE__ */ Chat.h("button", { class: `sortcol movenamesortcol${sortCol === "name" ? " cur" : ""}`, "data-sort": "name" }, "Name"), /* @__PURE__ */ Chat.h("button", { class: `sortcol movetypesortcol${sortCol === "type" ? " cur" : ""}`, "data-sort": "type" }, "Type"), /* @__PURE__ */ Chat.h("button", { class: `sortcol movetypesortcol${sortCol === "category" ? " cur" : ""}`, "data-sort": "category" }, "Cat"), /* @__PURE__ */ Chat.h("button", { class: `sortcol powersortcol${sortCol === "power" ? " cur" : ""}`, "data-sort": "power" }, "Pow"), /* @__PURE__ */ Chat.h("button", { class: `sortcol accuracysortcol${sortCol === "accuracy" ? " cur" : ""}`, "data-sort": "accuracy" }, "Acc"), /* @__PURE__ */ Chat.h("button", { class: `sortcol ppsortcol${sortCol === "pp" ? " cur" : ""}`, "data-sort": "pp" }, "PP")));
  }
  renderPokemonRow(id, matchStart, matchEnd, errorMessage) {
    const search = this.props.search;
    const pokemon = search.dex.species.get(id);
    if (!pokemon) return /* @__PURE__ */ Chat.h("li", { class: "result" }, "Unrecognized pokemon");
    let tagStart = pokemon.forme ? pokemon.name.length - pokemon.forme.length - 1 : 0;
    const stats = pokemon.baseStats;
    let bst = 0;
    for (const stat of Object.values(stats)) bst += stat;
    if (search.dex.gen < 2) bst -= stats["spd"];
    if (errorMessage) {
      return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h(
        "a",
        {
          href: `${this.URL_ROOT}pokemon/${id}`,
          class: id === this.speciesId ? "cur" : "",
          "data-target": "push",
          "data-entry": `pokemon|${pokemon.name}`
        },
        /* @__PURE__ */ Chat.h("span", { class: "col numcol" }, search.getTier(pokemon)),
        /* @__PURE__ */ Chat.h("span", { class: "col iconcol" }, /* @__PURE__ */ Chat.h("span", { class: "pixelated", style: import_battle_dex.Dex.getPokemonIcon(pokemon.id) })),
        /* @__PURE__ */ Chat.h("span", { class: "col pokemonnamecol" }, this.renderName(pokemon.name, matchStart, matchEnd, tagStart)),
        errorMessage
      ));
    }
    return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h(
      "a",
      {
        href: `${this.URL_ROOT}pokemon/${id}`,
        class: id === this.speciesId ? "cur" : "",
        "data-target": "push",
        "data-entry": `pokemon|${pokemon.name}`
      },
      /* @__PURE__ */ Chat.h("span", { class: "col numcol" }, search.getTier(pokemon)),
      /* @__PURE__ */ Chat.h("span", { class: "col iconcol" }, /* @__PURE__ */ Chat.h("span", { class: "pixelated", style: import_battle_dex.Dex.getPokemonIcon(pokemon.id) })),
      /* @__PURE__ */ Chat.h("span", { class: "col pokemonnamecol" }, this.renderName(pokemon.name, matchStart, matchEnd, tagStart)),
      /* @__PURE__ */ Chat.h("span", { class: "col typecol" }, pokemon.types.map(
        (type) => /* @__PURE__ */ Chat.h("img", { src: `${import_battle_dex.Dex.resourcePrefix}sprites/types/${type}.png`, alt: type, height: "14", width: "32", class: "pixelated" })
      )),
      search.dex.gen >= 3 && (pokemon.abilities["1"] ? /* @__PURE__ */ Chat.h("span", { class: "col twoabilitycol" }, pokemon.abilities["0"], /* @__PURE__ */ Chat.h("br", null), pokemon.abilities["1"]) : /* @__PURE__ */ Chat.h("span", { class: "col abilitycol" }, pokemon.abilities["0"])),
      search.dex.gen >= 5 && (pokemon.abilities["S"] ? /* @__PURE__ */ Chat.h("span", { class: `col twoabilitycol${pokemon.unreleasedHidden ? " unreleasedhacol" : ""}` }, pokemon.abilities["H"] || "", /* @__PURE__ */ Chat.h("br", null), pokemon.abilities["S"]) : pokemon.abilities["H"] ? /* @__PURE__ */ Chat.h("span", { class: `col abilitycol${pokemon.unreleasedHidden ? " unreleasedhacol" : ""}` }, pokemon.abilities["H"]) : /* @__PURE__ */ Chat.h("span", { class: "col abilitycol" })),
      /* @__PURE__ */ Chat.h("span", { class: "col statcol" }, /* @__PURE__ */ Chat.h("em", null, "HP"), /* @__PURE__ */ Chat.h("br", null), stats.hp),
      /* @__PURE__ */ Chat.h("span", { class: "col statcol" }, /* @__PURE__ */ Chat.h("em", null, "Atk"), /* @__PURE__ */ Chat.h("br", null), stats.atk),
      /* @__PURE__ */ Chat.h("span", { class: "col statcol" }, /* @__PURE__ */ Chat.h("em", null, "Def"), /* @__PURE__ */ Chat.h("br", null), stats.def),
      search.dex.gen > 2 && /* @__PURE__ */ Chat.h("span", { class: "col statcol" }, /* @__PURE__ */ Chat.h("em", null, "SpA"), /* @__PURE__ */ Chat.h("br", null), stats.spa),
      search.dex.gen > 2 && /* @__PURE__ */ Chat.h("span", { class: "col statcol" }, /* @__PURE__ */ Chat.h("em", null, "SpD"), /* @__PURE__ */ Chat.h("br", null), stats.spd),
      search.dex.gen < 2 && /* @__PURE__ */ Chat.h("span", { class: "col statcol" }, /* @__PURE__ */ Chat.h("em", null, "Spc"), /* @__PURE__ */ Chat.h("br", null), stats.spa),
      /* @__PURE__ */ Chat.h("span", { class: "col statcol" }, /* @__PURE__ */ Chat.h("em", null, "Spe"), /* @__PURE__ */ Chat.h("br", null), stats.spe),
      /* @__PURE__ */ Chat.h("span", { class: "col bstcol" }, /* @__PURE__ */ Chat.h("em", null, "BST", /* @__PURE__ */ Chat.h("br", null), bst))
    ));
  }
  renderName(name, matchStart, matchEnd, tagStart) {
    if (name === "No Ability") return /* @__PURE__ */ Chat.h("i", null, "(no ability)");
    if (!matchEnd) {
      if (!tagStart) return name;
      return [
        name.slice(0, tagStart),
        /* @__PURE__ */ Chat.h("small", null, name.slice(tagStart))
      ];
    }
    let output = [
      name.slice(0, matchStart),
      /* @__PURE__ */ Chat.h("b", null, name.slice(matchStart, matchEnd)),
      name.slice(matchEnd, tagStart || name.length)
    ];
    if (!tagStart) return output;
    if (matchEnd && matchEnd > tagStart) {
      if (matchStart < tagStart) {
        matchStart = tagStart;
      }
      output.push(
        /* @__PURE__ */ Chat.h("small", null, name.slice(matchEnd))
      );
    } else {
      output.push(/* @__PURE__ */ Chat.h("small", null, name.slice(tagStart)));
    }
    return output;
  }
  renderItemRow(id, matchStart, matchEnd, errorMessage) {
    const search = this.props.search;
    const item = search.dex.items.get(id);
    if (!item) return /* @__PURE__ */ Chat.h("li", { class: "result" }, "Unrecognized item");
    return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h(
      "a",
      {
        href: `${this.URL_ROOT}items/${id}`,
        class: id === this.itemId ? "cur" : "",
        "data-target": "push",
        "data-entry": `item|${item.name}`
      },
      /* @__PURE__ */ Chat.h("span", { class: "col itemiconcol" }, /* @__PURE__ */ Chat.h("span", { class: "pixelated", style: import_battle_dex.Dex.getItemIcon(item) })),
      /* @__PURE__ */ Chat.h("span", { class: "col namecol" }, id ? this.renderName(item.name, matchStart, matchEnd) : /* @__PURE__ */ Chat.h("i", null, "(no item)")),
      !!id && errorMessage,
      !errorMessage && /* @__PURE__ */ Chat.h("span", { class: "col itemdesccol" }, item.shortDesc)
    ));
  }
  renderAbilityRow(id, matchStart, matchEnd, errorMessage) {
    const search = this.props.search;
    const ability = search.dex.abilities.get(id);
    if (!ability) return /* @__PURE__ */ Chat.h("li", { class: "result" }, "Unrecognized ability");
    return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h(
      "a",
      {
        href: `${this.URL_ROOT}abilities/${id}`,
        class: id === this.abilityId ? "cur" : "",
        "data-target": "push",
        "data-entry": `ability|${ability.name}`
      },
      /* @__PURE__ */ Chat.h("span", { class: "col namecol" }, id ? this.renderName(ability.name, matchStart, matchEnd) : /* @__PURE__ */ Chat.h("i", null, "(no ability)")),
      errorMessage,
      !errorMessage && /* @__PURE__ */ Chat.h("span", { class: "col abilitydesccol" }, ability.shortDesc)
    ));
  }
  renderMoveRow(id, matchStart, matchEnd, errorMessage) {
    let slot = null;
    if (id.startsWith("_")) {
      [slot, id] = id.slice(1).split("_");
      if (!id) {
        return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h(
          "a",
          {
            href: `${this.URL_ROOT}moves/`,
            class: "cur",
            "data-target": "push",
            "data-entry": `move||${slot}`
          },
          /* @__PURE__ */ Chat.h("span", { class: "col movenamecol" }, /* @__PURE__ */ Chat.h("i", null, "(slot ", slot, " empty)"))
        ));
      }
    }
    const search = this.props.search;
    const move = search.dex.moves.get(id);
    const entry = slot ? `move|${move.name}|${slot}` : `move|${move.name}`;
    if (!move) return /* @__PURE__ */ Chat.h("li", { class: "result" }, "Unrecognized move");
    const tagStart = move.name.startsWith("Hidden Power") ? 12 : 0;
    if (errorMessage) {
      return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h(
        "a",
        {
          href: `${this.URL_ROOT}moves/${id}`,
          class: this.moveIds.includes(id) ? "cur" : "",
          "data-target": "push",
          "data-entry": entry
        },
        /* @__PURE__ */ Chat.h("span", { class: "col movenamecol" }, this.renderName(move.name, matchStart, matchEnd, tagStart)),
        errorMessage
      ));
    }
    let pp = move.pp === 1 || move.noPPBoosts ? move.pp : move.pp * 8 / 5;
    if (search.dex.gen < 3) pp = Math.min(61, pp);
    return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h(
      "a",
      {
        href: `${this.URL_ROOT}moves/${id}`,
        class: this.moveIds.includes(id) ? "cur" : "",
        "data-target": "push",
        "data-entry": entry
      },
      /* @__PURE__ */ Chat.h("span", { class: "col movenamecol" }, this.renderName(move.name, matchStart, matchEnd, tagStart)),
      /* @__PURE__ */ Chat.h("span", { class: "col typecol" }, /* @__PURE__ */ Chat.h(
        "img",
        {
          src: `${import_battle_dex.Dex.resourcePrefix}sprites/types/${encodeURIComponent(move.type)}.png`,
          alt: move.type,
          height: "14",
          width: "32",
          class: "pixelated"
        }
      ), /* @__PURE__ */ Chat.h(
        "img",
        {
          src: `${import_battle_dex.Dex.resourcePrefix}sprites/categories/${move.category}.png`,
          alt: move.category,
          height: "14",
          width: "32",
          class: "pixelated"
        }
      )),
      /* @__PURE__ */ Chat.h("span", { class: "col labelcol" }, move.category !== "Status" ? [/* @__PURE__ */ Chat.h("em", null, "Power"), /* @__PURE__ */ Chat.h("br", null), move.basePower || "\u2014"] : ""),
      /* @__PURE__ */ Chat.h("span", { class: "col widelabelcol" }, /* @__PURE__ */ Chat.h("em", null, "Accuracy"), /* @__PURE__ */ Chat.h("br", null), move.accuracy && move.accuracy !== true ? `${move.accuracy}%` : "\u2014"),
      /* @__PURE__ */ Chat.h("span", { class: "col pplabelcol" }, /* @__PURE__ */ Chat.h("em", null, "PP"), /* @__PURE__ */ Chat.h("br", null), pp),
      /* @__PURE__ */ Chat.h("span", { class: "col movedesccol" }, move.shortDesc)
    ));
  }
  renderTypeRow(id, matchStart, matchEnd, errorMessage) {
    const name = id.charAt(0).toUpperCase() + id.slice(1);
    return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h("a", { href: `${this.URL_ROOT}types/${id}`, "data-target": "push", "data-entry": `type|${name}` }, /* @__PURE__ */ Chat.h("span", { class: "col namecol" }, this.renderName(name, matchStart, matchEnd)), /* @__PURE__ */ Chat.h("span", { class: "col typecol" }, /* @__PURE__ */ Chat.h(
      "img",
      {
        src: `${import_battle_dex.Dex.resourcePrefix}sprites/types/${encodeURIComponent(name)}.png`,
        alt: name,
        height: "14",
        width: "32",
        class: "pixelated"
      }
    )), errorMessage));
  }
  renderCategoryRow(id, matchStart, matchEnd, errorMessage) {
    const name = id.charAt(0).toUpperCase() + id.slice(1);
    return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h("a", { href: `${this.URL_ROOT}categories/${id}`, "data-target": "push", "data-entry": `category|${name}` }, /* @__PURE__ */ Chat.h("span", { class: "col namecol" }, this.renderName(name, matchStart, matchEnd)), /* @__PURE__ */ Chat.h("span", { class: "col typecol" }, /* @__PURE__ */ Chat.h("img", { src: `${import_battle_dex.Dex.resourcePrefix}sprites/categories/${name}.png`, alt: name, height: "14", width: "32", class: "pixelated" })), errorMessage));
  }
  renderArticleRow(id, matchStart, matchEnd, errorMessage) {
    const isSearchType = id === "pokemon" || id === "moves";
    const name = window.BattleArticleTitles?.[id] || id.charAt(0).toUpperCase() + id.substr(1);
    return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h("a", { href: `${this.URL_ROOT}articles/${id}`, "data-target": "push", "data-entry": `article|${name}` }, /* @__PURE__ */ Chat.h("span", { class: "col namecol" }, this.renderName(name, matchStart, matchEnd)), /* @__PURE__ */ Chat.h("span", { class: "col movedesccol" }, isSearchType ? "(search type)" : "(article)"), errorMessage));
  }
  renderEggGroupRow(id, matchStart, matchEnd, errorMessage) {
    let name;
    if (id === "humanlike") name = "Human-Like";
    else if (id === "water1") name = "Water 1";
    else if (id === "water2") name = "Water 2";
    else if (id === "water3") name = "Water 3";
    if (name) {
      if (matchEnd > 5) matchEnd++;
    } else {
      name = id.charAt(0).toUpperCase() + id.slice(1);
    }
    return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h("a", { href: `${this.URL_ROOT}egggroups/${id}`, "data-target": "push", "data-entry": `egggroup|${name}` }, /* @__PURE__ */ Chat.h("span", { class: "col namecol" }, this.renderName(name, matchStart, matchEnd)), /* @__PURE__ */ Chat.h("span", { class: "col movedesccol" }, "(egg group)"), errorMessage));
  }
  renderTierRow(id, matchStart, matchEnd, errorMessage) {
    const tierTable = {
      uber: "Uber",
      caplc: "CAP LC",
      capnfe: "CAP NFE"
    };
    const name = tierTable[id] || id.toUpperCase();
    return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h("a", { href: `${this.URL_ROOT}tiers/${id}`, "data-target": "push", "data-entry": `tier|${name}` }, /* @__PURE__ */ Chat.h("span", { class: "col namecol" }, this.renderName(name, matchStart, matchEnd)), /* @__PURE__ */ Chat.h("span", { class: "col movedesccol" }, "(tier)"), errorMessage));
  }
  renderRow(row) {
    const search = this.props.search;
    const [type, id] = row;
    let matchStart = 0;
    let matchEnd = 0;
    if (row.length > 3) {
      matchStart = row[2];
      matchEnd = row[3];
    }
    let errorMessage = null;
    let label;
    if (label = search.filterLabel(type)) {
      errorMessage = /* @__PURE__ */ Chat.h("span", { class: "col filtercol" }, /* @__PURE__ */ Chat.h("em", null, label));
    } else if (label = search.illegalLabel(id)) {
      errorMessage = /* @__PURE__ */ Chat.h("span", { class: "col illegalcol" }, /* @__PURE__ */ Chat.h("em", null, label));
    }
    switch (type) {
      case "html":
        const sanitizedHTML = id.replace(/</g, "&lt;").replace(/&lt;em>/g, "<em>").replace(/&lt;\/em>/g, "</em>").replace(/&lt;strong>/g, "<strong>").replace(/&lt;\/strong>/g, "</strong>");
        return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h("p", { dangerouslySetInnerHTML: { __html: sanitizedHTML } }));
      case "header":
        return /* @__PURE__ */ Chat.h("li", { class: "result" }, /* @__PURE__ */ Chat.h("h3", null, id));
      case "sortpokemon":
        return this.renderPokemonSortRow();
      case "sortmove":
        return this.renderMoveSortRow();
      case "pokemon":
        return this.renderPokemonRow(id, matchStart, matchEnd, errorMessage);
      case "move":
        return this.renderMoveRow(id, matchStart, matchEnd, errorMessage);
      case "item":
        return this.renderItemRow(id, matchStart, matchEnd, errorMessage);
      case "ability":
        return this.renderAbilityRow(id, matchStart, matchEnd, errorMessage);
      case "type":
        return this.renderTypeRow(id, matchStart, matchEnd, errorMessage);
      case "egggroup":
        return this.renderEggGroupRow(id, matchStart, matchEnd, errorMessage);
      case "tier":
        return this.renderTierRow(id, matchStart, matchEnd, errorMessage);
      case "category":
        return this.renderCategoryRow(id, matchStart, matchEnd, errorMessage);
      case "article":
        return this.renderArticleRow(id, matchStart, matchEnd, errorMessage);
    }
    return /* @__PURE__ */ Chat.h("li", null, "Error: not found");
  }
  static renderFilters(search, showHints) {
    return search.filters && /* @__PURE__ */ Chat.h("li", { class: "dexlist-filters" }, showHints && "Filters: ", search.filters.map(
      ([type, name]) => /* @__PURE__ */ Chat.h("button", { class: "filter", "data-filter": `${type}:${name}` }, name, " ", /* @__PURE__ */ Chat.h("i", { class: "fa fa-times-circle", "aria-hidden": true }))
    ), !search.query && showHints && /* @__PURE__ */ Chat.h("small", { style: "color: #888" }, "(backspace = delete filter)"));
  }
  componentDidUpdate() {
    if (this.props.resultIndex !== void 0) {
      this.base.children[this.resultIndex + 1]?.children[0]?.classList.remove("hover");
      this.resultIndex = this.props.resultIndex;
      this.base.children[this.resultIndex + 1]?.children[0]?.classList.add("hover");
    }
  }
  componentDidMount() {
    this.componentDidUpdate();
  }
  render() {
    const search = this.props.search;
    const set = search.typedSearch?.set;
    if (set) {
      this.speciesId = (0, import_battle_dex.toID)(set.species);
      this.itemId = (0, import_battle_dex.toID)(set.item);
      this.abilityId = (0, import_battle_dex.toID)(set.ability);
      this.moveIds = set.moves.map(import_battle_dex.toID);
    }
    let results = search.results;
    if (this.props.windowing) results = results?.slice(0, this.props.windowing) || null;
    return /* @__PURE__ */ Chat.h(
      "ul",
      {
        class: "dexlist",
        style: `min-height: ${(1 + (search.results?.length || 1)) * 33}px;`,
        onClick: this.handleClick
      },
      !this.props.hideFilters && PSSearchResults.renderFilters(search, true) || /* @__PURE__ */ Chat.h("li", null),
      results?.map((result) => this.renderRow(result))
    );
  }
}
//# sourceMappingURL=battle-searchresults.js.map
