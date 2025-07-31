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
var battle_dex_exports = {};
__export(battle_dex_exports, {
  Dex: () => Dex,
  ModdedDex: () => ModdedDex,
  PSUtils: () => PSUtils,
  toID: () => toID,
  toName: () => toName,
  toRoomid: () => toRoomid,
  toUserid: () => toUserid
});
module.exports = __toCommonJS(battle_dex_exports);
var import_battle = require("./battle");
var import_battle_dex_data = require("./battle-dex-data");
var import_client_main = require("./client-main");
/**
 * Pokemon Showdown Dex
 *
 * Roughly equivalent to sim/dex.js in a Pokemon Showdown server, but
 * designed for use in browsers rather than in Node.
 *
 * This is a generic utility library for Pokemon Showdown code: any
 * code shared between the replay viewer and the client usually ends up
 * here.
 *
 * Licensing note: PS's client has complicated licensing:
 * - The client as a whole is AGPLv3
 * - The battle replay/animation engine (battle-*.ts) by itself is MIT
 *
 * Compiled into battledata.js which includes all dependencies
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */
if (typeof window === "undefined") {
  global.window = global;
} else {
  window.exports = window;
}
window.nodewebkit = !!(typeof process !== "undefined" && process.versions?.["node-webkit"]);
function toID(text) {
  if (text?.id) {
    text = text.id;
  } else if (text?.userid) {
    text = text.userid;
  }
  if (typeof text !== "string" && typeof text !== "number") return "";
  return `${text}`.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function toUserid(text) {
  return toID(text);
}
const PSUtils = new class {
  /**
   * Like string.split(delimiter), but only recognizes the first `limit`
   * delimiters (default 1).
   *
   * `"1 2 3 4".split(" ", 2) => ["1", "2"]`
   *
   * `splitFirst("1 2 3 4", " ", 1) => ["1", "2 3 4"]`
   *
   * Returns an array of length exactly limit + 1.
   */
  splitFirst(str, delimiter, limit = 1) {
    let splitStr = [];
    while (splitStr.length < limit) {
      let delimiterIndex = str.indexOf(delimiter);
      if (delimiterIndex >= 0) {
        splitStr.push(str.slice(0, delimiterIndex));
        str = str.slice(delimiterIndex + delimiter.length);
      } else {
        splitStr.push(str);
        str = "";
      }
    }
    splitStr.push(str);
    return splitStr;
  }
  /**
   * Compares two variables; intended to be used as a smarter comparator.
   * The two variables must be the same type (TypeScript will not check this).
   *
   * - Numbers are sorted low-to-high, use `-val` to reverse
   * - Strings are sorted A to Z case-semi-insensitively, use `{reverse: val}` to reverse
   * - Booleans are sorted true-first (REVERSE of casting to numbers), use `!val` to reverse
   * - Arrays are sorted lexically in the order of their elements
   *
   * In other words: `[num, str]` will be sorted A to Z, `[num, {reverse: str}]` will be sorted Z to A.
   */
  compare(a, b) {
    if (typeof a === "number") {
      return a - b;
    }
    if (typeof a === "string") {
      return a.localeCompare(b);
    }
    if (typeof a === "boolean") {
      return (a ? 1 : 2) - (b ? 1 : 2);
    }
    if (Array.isArray(a)) {
      for (let i = 0; i < a.length; i++) {
        const comparison = PSUtils.compare(a[i], b[i]);
        if (comparison) return comparison;
      }
      return 0;
    }
    if (a.reverse) {
      return PSUtils.compare(b.reverse, a.reverse);
    }
    throw new Error(`Passed value ${a} is not comparable`);
  }
  sortBy(array, callback) {
    if (!callback) return array.sort(PSUtils.compare);
    return array.sort((a, b) => PSUtils.compare(callback(a), callback(b)));
  }
}();
function toRoomid(roomid) {
  return roomid.replace(/[^a-zA-Z0-9-]+/g, "").toLowerCase();
}
function toName(name) {
  if (typeof name !== "string" && typeof name !== "number") return "";
  name = `${name}`.replace(/[|\s[\],\u202e]+/g, " ").trim();
  if (name.length > 18) name = name.substr(0, 18).trim();
  name = name.replace(
    /[\u0300-\u036f\u0483-\u0489\u0610-\u0615\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06ED\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]{3,}/g,
    ""
  );
  name = name.replace(/[\u239b-\u23b9]/g, "");
  return name;
}
const Dex = new class {
  constructor() {
    this.Ability = import_battle_dex_data.Ability;
    this.Item = import_battle_dex_data.Item;
    this.Move = import_battle_dex_data.Move;
    this.Species = import_battle_dex_data.Species;
    this.gen = 9;
    this.modid = "gen9";
    this.cache = null;
    this.REGULAR = 0;
    this.WEAK = 1;
    this.RESIST = 2;
    this.IMMUNE = 3;
    this.statNames = ["hp", "atk", "def", "spa", "spd", "spe"];
    this.statNamesExceptHP = ["atk", "def", "spa", "spd", "spe"];
    this.pokeballs = null;
    this.resourcePrefix = (() => {
      let prefix = "";
      if (window.document?.location?.protocol !== "http:") prefix = "https:";
      return `${prefix}//${window.Config ? import_client_main.Config.routes.client : "play.pokemonshowdown.com"}/`;
    })();
    this.fxPrefix = (() => {
      const protocol = window.document?.location?.protocol !== "http:" ? "https:" : "";
      return `${protocol}//${window.Config ? import_client_main.Config.routes.client : "play.pokemonshowdown.com"}/fx/`;
    })();
    this.loadedSpriteData = { xy: 1, bw: 0 };
    this.moddedDexes = {};
    this.moves = {
      get: (nameOrMove) => {
        if (nameOrMove && typeof nameOrMove !== "string") {
          return nameOrMove;
        }
        let name = nameOrMove || "";
        let id = toID(nameOrMove);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (!window.BattleMovedex) window.BattleMovedex = {};
        let data = window.BattleMovedex[id];
        if (data && typeof data.exists === "boolean") return data;
        if (!data && id.substr(0, 11) === "hiddenpower" && id.length > 11) {
          let [, hpWithType, hpPower] = /([a-z]*)([0-9]*)/.exec(id);
          data = {
            ...window.BattleMovedex[hpWithType] || {},
            basePower: Number(hpPower) || 60
          };
        }
        if (!data && id.substr(0, 6) === "return" && id.length > 6) {
          data = {
            ...window.BattleMovedex["return"] || {},
            basePower: Number(id.slice(6))
          };
        }
        if (!data && id.substr(0, 11) === "frustration" && id.length > 11) {
          data = {
            ...window.BattleMovedex["frustration"] || {},
            basePower: Number(id.slice(11))
          };
        }
        if (!data) data = { exists: false };
        let move = new import_battle_dex_data.Move(id, name, data);
        window.BattleMovedex[id] = move;
        return move;
      }
    };
    this.items = {
      get: (nameOrItem) => {
        if (nameOrItem && typeof nameOrItem !== "string") {
          return nameOrItem;
        }
        let name = nameOrItem || "";
        let id = toID(nameOrItem);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (!window.BattleItems) window.BattleItems = {};
        let data = window.BattleItems[id];
        if (data && typeof data.exists === "boolean") return data;
        if (!data) data = { exists: false };
        let item = new import_battle_dex_data.Item(id, name, data);
        window.BattleItems[id] = item;
        return item;
      }
    };
    this.abilities = {
      get: (nameOrAbility) => {
        if (nameOrAbility && typeof nameOrAbility !== "string") {
          return nameOrAbility;
        }
        let name = nameOrAbility || "";
        let id = toID(nameOrAbility);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (!window.BattleAbilities) window.BattleAbilities = {};
        let data = window.BattleAbilities[id];
        if (data && typeof data.exists === "boolean") return data;
        if (!data) data = { exists: false };
        let ability = new import_battle_dex_data.Ability(id, name, data);
        window.BattleAbilities[id] = ability;
        return ability;
      }
    };
    this.species = {
      get: (nameOrSpecies) => {
        if (nameOrSpecies && typeof nameOrSpecies !== "string") {
          return nameOrSpecies;
        }
        let name = nameOrSpecies || "";
        let id = toID(nameOrSpecies);
        let formid = id;
        if (!window.BattlePokedexAltForms) window.BattlePokedexAltForms = {};
        if (formid in window.BattlePokedexAltForms) return window.BattlePokedexAltForms[formid];
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        } else if (window.BattlePokedex && !(id in BattlePokedex) && window.BattleBaseSpeciesChart) {
          for (const baseSpeciesId of import_battle_dex_data.BattleBaseSpeciesChart) {
            if (formid.startsWith(baseSpeciesId)) {
              id = baseSpeciesId;
              break;
            }
          }
        }
        if (!window.BattlePokedex) window.BattlePokedex = {};
        let data = window.BattlePokedex[id];
        let species;
        if (data && typeof data.exists === "boolean") {
          species = data;
        } else {
          if (!data) data = { exists: false };
          if (!data.tier && id.endsWith("totem")) {
            data.tier = this.species.get(id.slice(0, -5)).tier;
          }
          if (!data.tier && data.baseSpecies && toID(data.baseSpecies) !== id) {
            data.tier = this.species.get(data.baseSpecies).tier;
          }
          data.nfe = data.id === "dipplin" || !!data.evos?.some((evo) => {
            const evoSpecies = this.species.get(evo);
            return !evoSpecies.isNonstandard || evoSpecies.isNonstandard === data.isNonstandard || // Pokemon with Hisui evolutions
            evoSpecies.isNonstandard === "Unobtainable";
          });
          species = new import_battle_dex_data.Species(id, name, data);
          window.BattlePokedex[id] = species;
        }
        if (species.cosmeticFormes) {
          for (const forme of species.cosmeticFormes) {
            if (toID(forme) === formid) {
              species = new import_battle_dex_data.Species(formid, name, {
                ...species,
                name: forme,
                forme: forme.slice(species.name.length + 1),
                baseForme: "",
                baseSpecies: species.name,
                otherFormes: null
              });
              window.BattlePokedexAltForms[formid] = species;
              break;
            }
          }
        }
        return species;
      }
    };
    this.types = {
      allCache: null,
      namesCache: null,
      get: (type) => {
        if (!type || typeof type === "string") {
          const id = toID(type);
          const name = id.substr(0, 1).toUpperCase() + id.substr(1);
          type = window.BattleTypeChart?.[id] || {};
          if (type.damageTaken) type.exists = true;
          if (!type.id) type.id = id;
          if (!type.name) type.name = name;
          if (!type.effectType) {
            type.effectType = "Type";
          }
        }
        return type;
      },
      all: () => {
        if (this.types.allCache) return this.types.allCache;
        const types = [];
        for (const id in window.BattleTypeChart || {}) {
          types.push(Dex.types.get(id));
        }
        if (types.length) this.types.allCache = types;
        return types;
      },
      names: () => {
        if (this.types.namesCache) return this.types.namesCache;
        const names = this.types.all().map((type) => type.name);
        names.splice(names.indexOf("Stellar"), 1);
        if (names.length) this.types.namesCache = names;
        return names;
      },
      isName: (name) => {
        const id = toID(name);
        if (name !== id.substr(0, 1).toUpperCase() + id.substr(1)) return false;
        return window.BattleTypeChart?.hasOwnProperty(id);
      }
    };
  }
  mod(modid) {
    if (modid === "gen9") return this;
    if (!window.BattleTeambuilderTable) return this;
    if (modid in this.moddedDexes) {
      return this.moddedDexes[modid];
    }
    this.moddedDexes[modid] = new ModdedDex(modid);
    return this.moddedDexes[modid];
  }
  forGen(gen) {
    if (!gen) return this;
    return this.mod(`gen${gen}`);
  }
  formatGen(format) {
    const formatid = toID(format);
    if (!formatid) return Dex.gen;
    if (!formatid.startsWith("gen")) return 6;
    return parseInt(formatid.charAt(3)) || Dex.gen;
  }
  forFormat(format) {
    let dex = Dex.forGen(Dex.formatGen(format));
    const formatid = toID(format).slice(4);
    if (dex.gen === 7 && formatid.includes("letsgo")) {
      dex = Dex.mod("gen7letsgo");
    }
    if (dex.gen === 8 && formatid.includes("bdsp")) {
      dex = Dex.mod("gen8bdsp");
    }
    return dex;
  }
  resolveAvatar(avatar) {
    if (window.BattleAvatarNumbers && avatar in import_battle_dex_data.BattleAvatarNumbers) {
      avatar = import_battle_dex_data.BattleAvatarNumbers[avatar];
    }
    if (avatar.startsWith("#")) {
      return Dex.resourcePrefix + "sprites/trainers-custom/" + toID(avatar.substr(1)) + ".png";
    }
    if (avatar.includes(".") && window.Config?.server?.registered) {
      const protocol = import_client_main.Config.server.port === 443 ? "https" : "http";
      const server = `${protocol}://${import_client_main.Config.server.host}:${import_client_main.Config.server.port}`;
      return `${server}/avatars/${encodeURIComponent(avatar).replace(/%3F/g, "?")}`;
    }
    return Dex.resourcePrefix + "sprites/trainers/" + Dex.sanitizeName(avatar || "unknown") + ".png";
  }
  /**
   * This is used to sanitize strings from data files like `moves.js` and
   * `teambuilder-tables.js`.
   *
   * This makes sure untrusted strings can't wreak havoc if someone forgets to
   * escape it before putting it in HTML.
   *
   * None of these characters belong in these files, anyway. (They can be used
   * in move descriptions, but those are served from `text.js`, which are
   * definitely always treated as unsanitized.)
   */
  sanitizeName(name) {
    if (!name) return "";
    return ("" + name).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").slice(0, 50);
  }
  prefs(prop) {
    return window.Storage?.prefs ? window.Storage.prefs(prop) : window.PS?.prefs?.[prop];
  }
  getShortName(name) {
    let shortName = name.replace(/[^A-Za-z0-9]+$/, "");
    if (shortName.includes("(")) {
      shortName += name.slice(shortName.length).replace(/[^()]+/g, "").replace(/\(\)/g, "");
    }
    return shortName;
  }
  getEffect(name) {
    name = (name || "").trim();
    if (name.substr(0, 5) === "item:") {
      return Dex.items.get(name.substr(5).trim());
    } else if (name.substr(0, 8) === "ability:") {
      return Dex.abilities.get(name.substr(8).trim());
    } else if (name.substr(0, 5) === "move:") {
      return Dex.moves.get(name.substr(5).trim());
    }
    let id = toID(name);
    return new import_battle_dex_data.PureEffect(id, name);
  }
  getGen3Category(type) {
    return [
      "Fire",
      "Water",
      "Grass",
      "Electric",
      "Ice",
      "Psychic",
      "Dark",
      "Dragon"
    ].includes(type) ? "Special" : "Physical";
  }
  hasAbility(species, ability) {
    for (const i in species.abilities) {
      if (ability === species.abilities[i]) return true;
    }
    return false;
  }
  loadSpriteData(gen) {
    if (this.loadedSpriteData[gen]) return;
    this.loadedSpriteData[gen] = 1;
    let path = $('script[src*="pokedex-mini.js"]').attr("src") || "";
    let qs = "?" + (path.split("?")[1] || "");
    path = (/.+?(?=data\/pokedex-mini\.js)/.exec(path) || [])[0] || "";
    let el = document.createElement("script");
    el.src = path + "data/pokedex-mini-bw.js" + qs;
    document.getElementsByTagName("body")[0].appendChild(el);
  }
  getSpriteData(pokemon, isFront, options = { gen: 6 }) {
    const mechanicsGen = options.gen || 6;
    let isDynamax = !!options.dynamax;
    if (pokemon instanceof import_battle.Pokemon) {
      if (pokemon.volatiles.transform) {
        options.shiny = pokemon.volatiles.transform[2];
        options.gender = pokemon.volatiles.transform[3];
      } else {
        options.shiny = pokemon.shiny;
        options.gender = pokemon.gender;
      }
      let isGigantamax = false;
      if (pokemon.volatiles.dynamax) {
        if (pokemon.volatiles.dynamax[1]) {
          isGigantamax = true;
        } else if (options.dynamax !== false) {
          isDynamax = true;
        }
      }
      pokemon = pokemon.getSpeciesForme() + (isGigantamax ? "-Gmax" : "");
    }
    const species = Dex.species.get(pokemon);
    if (species.name.endsWith("-Gmax")) isDynamax = false;
    let spriteData = {
      gen: mechanicsGen,
      w: 96,
      h: 96,
      y: 0,
      url: Dex.resourcePrefix + "sprites/",
      pixelated: true,
      isFrontSprite: false,
      cryurl: "",
      shiny: options.shiny
    };
    let name = species.spriteid;
    let dir;
    let facing;
    if (isFront) {
      spriteData.isFrontSprite = true;
      dir = "";
      facing = "front";
    } else {
      dir = "-back";
      facing = "back";
    }
    let graphicsGen = mechanicsGen;
    if (Dex.prefs("nopastgens")) graphicsGen = 6;
    if (Dex.prefs("bwgfx") && graphicsGen >= 6) graphicsGen = 5;
    spriteData.gen = Math.max(graphicsGen, Math.min(species.gen, 5));
    const baseDir = ["", "gen1", "gen2", "gen3", "gen4", "gen5", "", "", "", ""][spriteData.gen];
    let animationData = null;
    let miscData = null;
    let speciesid = species.id;
    if (species.isTotem) speciesid = toID(name);
    if (baseDir === "" && window.BattlePokemonSprites) {
      animationData = BattlePokemonSprites[speciesid];
    }
    if (baseDir === "gen5" && window.BattlePokemonSpritesBW) {
      animationData = BattlePokemonSpritesBW[speciesid];
    }
    if (window.BattlePokemonSprites) miscData = BattlePokemonSprites[speciesid];
    if (!miscData && window.BattlePokemonSpritesBW) miscData = BattlePokemonSpritesBW[speciesid];
    if (!animationData) animationData = {};
    if (!miscData) miscData = {};
    if (miscData.num !== 0 && miscData.num > -5e3) {
      let baseSpeciesid = toID(species.baseSpecies);
      spriteData.cryurl = "audio/cries/" + baseSpeciesid;
      let formeid = species.formeid;
      if (species.isMega || formeid && (formeid === "-crowned" || formeid === "-eternal" || formeid === "-eternamax" || formeid === "-four" || formeid === "-hangry" || formeid === "-hero" || formeid === "-lowkey" || formeid === "-noice" || formeid === "-primal" || formeid === "-rapidstrike" || formeid === "-roaming" || formeid === "-school" || formeid === "-sky" || formeid === "-starter" || formeid === "-super" || formeid === "-therian" || formeid === "-unbound" || baseSpeciesid === "calyrex" || baseSpeciesid === "kyurem" || baseSpeciesid === "cramorant" || baseSpeciesid === "indeedee" || baseSpeciesid === "lycanroc" || baseSpeciesid === "necrozma" || baseSpeciesid === "oinkologne" || baseSpeciesid === "oricorio" || baseSpeciesid === "slowpoke" || baseSpeciesid === "tatsugiri" || baseSpeciesid === "zygarde")) {
        spriteData.cryurl += formeid;
      }
      spriteData.cryurl += ".mp3";
    }
    if (options.shiny && mechanicsGen > 1) dir += "-shiny";
    if (Dex.afdMode || options.afd) {
      dir = "afd" + dir;
      spriteData.url += dir + "/" + name + ".png";
      if (isDynamax && !options.noScale) {
        spriteData.w *= 0.25;
        spriteData.h *= 0.25;
        spriteData.y += -22;
      } else if (species.isTotem && !options.noScale) {
        spriteData.w *= 0.5;
        spriteData.h *= 0.5;
        spriteData.y += -11;
      }
      return spriteData;
    }
    if (options.mod) {
      spriteData.cryurl = `sprites/${options.mod}/audio/${toID(species.baseSpecies)}`;
      spriteData.cryurl += ".mp3";
    }
    if (animationData[facing + "f"] && options.gender === "F") facing += "f";
    let allowAnim = !Dex.prefs("noanim") && !Dex.prefs("nogif");
    if (allowAnim && spriteData.gen >= 6) spriteData.pixelated = false;
    if (allowAnim && animationData[facing] && spriteData.gen >= 5) {
      if (facing.endsWith("f")) name += "-f";
      dir = baseDir + "ani" + dir;
      spriteData.w = animationData[facing].w;
      spriteData.h = animationData[facing].h;
      spriteData.url += dir + "/" + name + ".gif";
    } else {
      dir = (baseDir || "gen5") + dir;
      if (spriteData.gen >= 4 && miscData["frontf"] && options.gender === "F") {
        name += "-f";
      }
      spriteData.url += dir + "/" + name + ".png";
    }
    if (!options.noScale) {
      if (graphicsGen > 4) {
      } else if (spriteData.isFrontSprite) {
        spriteData.w *= 2;
        spriteData.h *= 2;
        spriteData.y += -16;
      } else {
        spriteData.w *= 2 / 1.5;
        spriteData.h *= 2 / 1.5;
        spriteData.y += -11;
      }
      if (spriteData.gen <= 2) spriteData.y += 2;
    }
    if (isDynamax && !options.noScale) {
      spriteData.w *= 2;
      spriteData.h *= 2;
      spriteData.y += -22;
    } else if (species.isTotem && !options.noScale) {
      spriteData.w *= 1.5;
      spriteData.h *= 1.5;
      spriteData.y += -11;
    }
    return spriteData;
  }
  getPokemonIconNum(id, isFemale, facingLeft) {
    let num = 0;
    if (window.BattlePokemonSprites?.[id]?.num) {
      num = BattlePokemonSprites[id].num;
    } else if (window.BattlePokedex?.[id]?.num) {
      num = BattlePokedex[id].num;
    }
    if (num < 0) num = 0;
    if (num > 1025) num = 0;
    if (window.BattlePokemonIconIndexes?.[id]) {
      num = import_battle_dex_data.BattlePokemonIconIndexes[id];
    }
    if (isFemale) {
      if (["unfezant", "frillish", "jellicent", "meowstic", "pyroar"].includes(id)) {
        num = import_battle_dex_data.BattlePokemonIconIndexes[id + "f"];
      }
    }
    if (facingLeft) {
      if (import_battle_dex_data.BattlePokemonIconIndexesLeft[id]) {
        num = import_battle_dex_data.BattlePokemonIconIndexesLeft[id];
      }
    }
    return num;
  }
  getPokemonIcon(pokemon, facingLeft) {
    if (pokemon === "pokeball") {
      return `background:transparent url(${Dex.resourcePrefix}sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -0px 4px`;
    } else if (pokemon === "pokeball-statused") {
      return `background:transparent url(${Dex.resourcePrefix}sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -40px 4px`;
    } else if (pokemon === "pokeball-fainted") {
      return `background:transparent url(${Dex.resourcePrefix}sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -80px 4px;opacity:.4;filter:contrast(0)`;
    } else if (pokemon === "pokeball-none") {
      return `background:transparent url(${Dex.resourcePrefix}sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -80px 4px`;
    }
    let id = toID(pokemon);
    if (!pokemon || typeof pokemon === "string") pokemon = null;
    if (pokemon?.speciesForme) id = toID(pokemon.speciesForme);
    if (pokemon?.species) id = toID(pokemon.species);
    if (pokemon?.volatiles?.formechange && !pokemon.volatiles.transform) {
      id = toID(pokemon.volatiles.formechange[1]);
    }
    let num = this.getPokemonIconNum(id, pokemon?.gender === "F", facingLeft);
    let top = Math.floor(num / 12) * 30;
    let left = num % 12 * 40;
    let fainted = pokemon?.fainted ? `;opacity:.3;filter:grayscale(100%) brightness(.5)` : ``;
    return `background:transparent url(${Dex.resourcePrefix}sprites/pokemonicons-sheet.png?v18) no-repeat scroll -${left}px -${top}px${fainted}`;
  }
  getTeambuilderSpriteData(pokemon, dex = Dex) {
    let gen = dex.gen;
    let id = toID(pokemon.species || pokemon);
    let species = Dex.species.get(id);
    let spriteid;
    if (typeof pokemon === "string") {
      spriteid = species.spriteid || id;
    } else {
      spriteid = pokemon.spriteid;
      if (pokemon.species && !spriteid) {
        spriteid = species.spriteid || id;
      }
    }
    if (species.exists === false) return { spriteDir: "sprites/gen5", spriteid: "0", x: 10, y: 5 };
    if (Dex.afdMode) {
      return {
        spriteid,
        spriteDir: "sprites/afd",
        shiny: !!pokemon.shiny,
        x: 10,
        y: 5
      };
    }
    const spriteData = {
      spriteid,
      spriteDir: "sprites/dex",
      x: -2,
      y: -3
    };
    if (pokemon.shiny) spriteData.shiny = true;
    if (Dex.prefs("nopastgens")) gen = 9;
    if (Dex.prefs("bwgfx") && gen > 5) gen = 5;
    let homeExists = (!species.isNonstandard || !["CAP", "Custom"].includes(species.isNonstandard) || species.id === "xerneasneutral") && ![
      "floetteeternal",
      "pichuspikyeared",
      "pikachubelle",
      "pikachucosplay",
      "pikachulibre",
      "pikachuphd",
      "pikachupopstar",
      "pikachurockstar"
    ].includes(species.id);
    if ((gen >= 8 || dex.modid === "gen7letsgo") && homeExists) {
      spriteData.spriteDir = "sprites/home-centered";
      spriteData.x = 8;
      spriteData.y = 10;
      spriteData.h = 96;
      return spriteData;
    }
    let xydexExists = !species.isNonstandard || species.isNonstandard === "Past" || species.isNonstandard === "CAP" || [
      "pikachustarter",
      "eeveestarter",
      "meltan",
      "melmetal",
      "pokestarufo",
      "pokestarufo2",
      "pokestarbrycenman",
      "pokestarmt",
      "pokestarmt2",
      "pokestargiant",
      "pokestarhumanoid",
      "pokestarmonster",
      "pokestarf00",
      "pokestarf002",
      "pokestarspirit"
    ].includes(species.id);
    if (species.gen >= 8 && species.isNonstandard !== "CAP") xydexExists = false;
    if (gen >= 6 && xydexExists) {
      if (species.gen >= 7) {
        spriteData.x = -6;
        spriteData.y = -7;
      } else if (id.substr(0, 6) === "arceus") {
        spriteData.x = -2;
        spriteData.y = 7;
      } else if (id === "garchomp") {
        spriteData.x = -2;
        spriteData.y = 2;
      } else if (id === "garchompmega") {
        spriteData.x = -2;
        spriteData.y = 0;
      }
      return spriteData;
    }
    spriteData.spriteDir = "sprites/gen5";
    if (gen <= 1 && species.gen <= 1) spriteData.spriteDir = "sprites/gen1";
    else if (gen <= 2 && species.gen <= 2) spriteData.spriteDir = "sprites/gen2";
    else if (gen <= 3 && species.gen <= 3) spriteData.spriteDir = "sprites/gen3";
    else if (gen <= 4 && species.gen <= 4) spriteData.spriteDir = "sprites/gen4";
    spriteData.x = 10;
    spriteData.y = 5;
    return spriteData;
  }
  getTeambuilderSprite(pokemon, dex, xOffset = 0, yOffset = 0) {
    if (!pokemon) return "";
    const data = this.getTeambuilderSpriteData(pokemon, dex);
    const shiny = data.shiny ? "-shiny" : "";
    const resize = data.h ? `background-size:${data.h}px` : "";
    return `background-image:url(${Dex.resourcePrefix}${data.spriteDir}${shiny}/${data.spriteid}.png);background-position:${data.x + xOffset}px ${data.y + yOffset}px;background-repeat:no-repeat;${resize}`;
  }
  getItemIcon(item) {
    let num = 0;
    if (typeof item === "string" && window.BattleItems) item = window.BattleItems[toID(item)];
    if (item?.spritenum) num = item.spritenum;
    let top = Math.floor(num / 16) * 24;
    let left = num % 16 * 24;
    return `background:transparent url(${Dex.resourcePrefix}sprites/itemicons-sheet.png?v1) no-repeat scroll -${left}px -${top}px`;
  }
  getTypeIcon(type, b) {
    type = this.types.get(type).name;
    if (!type) type = "???";
    let sanitizedType = type.replace(/\?/g, "%3f");
    return `<img src="${Dex.resourcePrefix}sprites/types/${sanitizedType}.png" alt="${type}" height="14" width="32" class="pixelated${b ? " b" : ""}" />`;
  }
  getCategoryIcon(category) {
    const categoryID = toID(category);
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
    return `<img src="${Dex.resourcePrefix}sprites/categories/${sanitizedCategory}.png" alt="${sanitizedCategory}" height="14" width="32" class="pixelated" />`;
  }
  getPokeballs() {
    if (this.pokeballs) return this.pokeballs;
    this.pokeballs = [];
    window.BattleItems ||= {};
    for (const data of Object.values(BattleItems)) {
      if (!data.isPokeball) continue;
      this.pokeballs.push(data.name);
    }
    return this.pokeballs;
  }
}();
class ModdedDex {
  constructor(modid) {
    this.cache = {
      Moves: {},
      Items: {},
      Abilities: {},
      Species: {},
      Types: {}
    };
    this.pokeballs = null;
    this.moves = {
      get: (name) => {
        let id = toID(name);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (this.cache.Moves.hasOwnProperty(id)) return this.cache.Moves[id];
        let data = { ...Dex.moves.get(name) };
        for (let i = Dex.gen - 1; i >= this.gen; i--) {
          const table = window.BattleTeambuilderTable[`gen${i}`];
          if (id in table.overrideMoveData) {
            Object.assign(data, table.overrideMoveData[id]);
          }
        }
        if (this.modid !== `gen${this.gen}`) {
          const table = window.BattleTeambuilderTable[this.modid];
          if (id in table.overrideMoveData) {
            Object.assign(data, table.overrideMoveData[id]);
          }
        }
        if (this.gen <= 3 && data.category !== "Status") {
          data.category = Dex.getGen3Category(data.type);
        }
        const move = new import_battle_dex_data.Move(id, name, data);
        this.cache.Moves[id] = move;
        return move;
      }
    };
    this.items = {
      get: (name) => {
        let id = toID(name);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (this.cache.Items.hasOwnProperty(id)) return this.cache.Items[id];
        let data = { ...Dex.items.get(name) };
        for (let i = Dex.gen - 1; i >= this.gen; i--) {
          const table = window.BattleTeambuilderTable[`gen${i}`];
          if (id in table.overrideItemData) {
            Object.assign(data, table.overrideItemData[id]);
          }
        }
        if (this.modid !== `gen${this.gen}`) {
          const table = window.BattleTeambuilderTable[this.modid];
          if (id in table.overrideItemData) {
            Object.assign(data, table.overrideItemData[id]);
          }
        }
        const item = new import_battle_dex_data.Item(id, name, data);
        this.cache.Items[id] = item;
        return item;
      }
    };
    this.abilities = {
      get: (name) => {
        let id = toID(name);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (this.cache.Abilities.hasOwnProperty(id)) return this.cache.Abilities[id];
        let data = { ...Dex.abilities.get(name) };
        for (let i = Dex.gen - 1; i >= this.gen; i--) {
          const table = window.BattleTeambuilderTable[`gen${i}`];
          if (id in table.overrideAbilityData) {
            Object.assign(data, table.overrideAbilityData[id]);
          }
        }
        if (this.modid !== `gen${this.gen}`) {
          const table = window.BattleTeambuilderTable[this.modid];
          if (id in table.overrideAbilityData) {
            Object.assign(data, table.overrideAbilityData[id]);
          }
        }
        const ability = new import_battle_dex_data.Ability(id, name, data);
        this.cache.Abilities[id] = ability;
        return ability;
      }
    };
    this.species = {
      get: (name) => {
        let id = toID(name);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (this.cache.Species.hasOwnProperty(id)) return this.cache.Species[id];
        let data = { ...Dex.species.get(name) };
        for (let i = Dex.gen - 1; i >= this.gen; i--) {
          const table2 = window.BattleTeambuilderTable[`gen${i}`];
          if (id in table2.overrideSpeciesData) {
            Object.assign(data, table2.overrideSpeciesData[id]);
          }
        }
        if (this.modid !== `gen${this.gen}`) {
          const table2 = window.BattleTeambuilderTable[this.modid];
          if (id in table2.overrideSpeciesData) {
            Object.assign(data, table2.overrideSpeciesData[id]);
          }
        }
        if (this.gen < 3 || this.modid === "gen7letsgo") {
          data.abilities = { 0: "No Ability" };
        }
        const table = window.BattleTeambuilderTable[this.modid];
        if (id in table.overrideTier) data.tier = table.overrideTier[id];
        if (!data.tier && id.endsWith("totem")) {
          data.tier = this.species.get(id.slice(0, -5)).tier;
        }
        if (!data.tier && data.baseSpecies && toID(data.baseSpecies) !== id) {
          data.tier = this.species.get(data.baseSpecies).tier;
        }
        if (data.gen > this.gen) data.tier = "Illegal";
        data.nfe = data.id === "dipplin" || !!data.evos?.some((evo) => {
          const evoSpecies = this.species.get(evo);
          return !evoSpecies.isNonstandard || evoSpecies.isNonstandard === data.isNonstandard || // Pokemon with Hisui evolutions
          evoSpecies.isNonstandard === "Unobtainable";
        });
        const species = new import_battle_dex_data.Species(id, name, data);
        this.cache.Species[id] = species;
        return species;
      }
    };
    this.types = {
      namesCache: null,
      names: () => {
        if (this.types.namesCache) return this.types.namesCache;
        const names = Dex.types.names();
        if (!names.length) return [];
        const curNames = [...names];
        if (this.gen < 6) curNames.splice(curNames.indexOf("Fairy"), 1);
        if (this.gen < 2) curNames.splice(curNames.indexOf("Dark"), 1);
        if (this.gen < 2) curNames.splice(curNames.indexOf("Steel"), 1);
        this.types.namesCache = curNames;
        return curNames;
      },
      get: (name) => {
        const id = toID(name);
        name = id.substr(0, 1).toUpperCase() + id.substr(1);
        if (this.cache.Types.hasOwnProperty(id)) return this.cache.Types[id];
        let data = { ...Dex.types.get(name) };
        for (let i = 7; i >= this.gen; i--) {
          const table = window.BattleTeambuilderTable[`gen${i}`];
          if (id in table.removeType) {
            data.exists = false;
            break;
          }
          if (id in table.overrideTypeChart) {
            data = { ...data, ...table.overrideTypeChart[id] };
          }
        }
        this.cache.Types[id] = data;
        return data;
      }
    };
    this.modid = modid;
    const gen = parseInt(modid.charAt(3), 10);
    if (!modid.startsWith("gen") || !gen) throw new Error("Unsupported modid");
    this.gen = gen;
  }
  getPokeballs() {
    if (this.pokeballs) return this.pokeballs;
    this.pokeballs = [];
    window.BattleItems ||= {};
    for (const data of Object.values(BattleItems)) {
      if (data.gen && data.gen > this.gen) continue;
      if (!data.isPokeball) continue;
      this.pokeballs.push(data.name);
    }
    return this.pokeballs;
  }
}
if (typeof require === "function") {
  global.Dex = Dex;
  global.toID = toID;
}
//# sourceMappingURL=battle-dex.js.map
