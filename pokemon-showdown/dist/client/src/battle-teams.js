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
var battle_teams_exports = {};
__export(battle_teams_exports, {
  Teams: () => Teams
});
module.exports = __toCommonJS(battle_teams_exports);
var import_battle_dex = require("./battle-dex");
var import_battle_dex_data = require("./battle-dex-data");
const Teams = new class {
  pack(team) {
    if (!team) return "";
    function getIv(ivs, s) {
      return ivs[s] === 31 || ivs[s] === void 0 ? "" : ivs[s].toString();
    }
    let buf = "";
    for (const set of team) {
      if (buf) buf += "]";
      buf += set.name || set.species;
      const speciesid = this.packName(set.species || set.name);
      buf += `|${this.packName(set.name || set.species) === speciesid ? "" : speciesid}`;
      buf += `|${this.packName(set.item)}`;
      buf += `|${this.packName(set.ability)}`;
      buf += "|" + set.moves.map(this.packName).join(",");
      buf += `|${set.nature || ""}`;
      let evs = "|";
      if (set.evs) {
        evs = `|${set.evs["hp"] || ""},${set.evs["atk"] || ""},${set.evs["def"] || ""},${set.evs["spa"] || ""},${set.evs["spd"] || ""},${set.evs["spe"] || ""}`;
      }
      if (evs === "|,,,,,") {
        buf += "|";
      } else {
        buf += evs;
      }
      if (set.gender) {
        buf += `|${set.gender}`;
      } else {
        buf += "|";
      }
      let ivs = "|";
      if (set.ivs) {
        ivs = `|${getIv(set.ivs, "hp")},${getIv(set.ivs, "atk")},${getIv(set.ivs, "def")},${getIv(set.ivs, "spa")},${getIv(set.ivs, "spd")},${getIv(set.ivs, "spe")}`;
      }
      if (ivs === "|,,,,,") {
        buf += "|";
      } else {
        buf += ivs;
      }
      if (set.shiny) {
        buf += "|S";
      } else {
        buf += "|";
      }
      if (set.level && set.level !== 100) {
        buf += `|${set.level}`;
      } else {
        buf += "|";
      }
      if (set.happiness !== void 0 && set.happiness !== 255) {
        buf += `|${set.happiness}`;
      } else {
        buf += "|";
      }
      if (set.pokeball || set.hpType || set.gigantamax || set.dynamaxLevel !== void 0 && set.dynamaxLevel !== 10 || set.teraType) {
        buf += `,${set.hpType || ""}`;
        buf += `,${this.packName(set.pokeball || "")}`;
        buf += `,${set.gigantamax ? "G" : ""}`;
        buf += `,${set.dynamaxLevel !== void 0 && set.dynamaxLevel !== 10 ? set.dynamaxLevel : ""}`;
        buf += `,${set.teraType || ""}`;
      }
    }
    return buf;
  }
  /** Very similar to toID but without the lowercase conversion */
  packName(name) {
    if (!name) return "";
    return name.replace(/[^A-Za-z0-9]+/g, "");
  }
  unpack(buf) {
    if (!buf) return [];
    const team = [];
    let i = 0;
    let j = 0;
    while (true) {
      const set = {};
      team.push(set);
      j = buf.indexOf("|", i);
      const name = buf.substring(i, j);
      i = j + 1;
      j = buf.indexOf("|", i);
      const species = import_battle_dex.Dex.species.get(buf.substring(i, j) || name);
      set.species = species.name;
      if (species.baseSpecies !== name) set.name = name;
      i = j + 1;
      j = buf.indexOf("|", i);
      set.item = import_battle_dex.Dex.items.get(buf.substring(i, j)).name;
      i = j + 1;
      j = buf.indexOf("|", i);
      const ability = import_battle_dex.Dex.abilities.get(buf.substring(i, j)).name;
      set.ability = species.abilities && ["", "0", "1", "H", "S"].includes(ability) ? species.abilities[ability || "0"] : ability;
      i = j + 1;
      j = buf.indexOf("|", i);
      set.moves = buf.substring(i, j).split(",").map(
        (moveid) => import_battle_dex.Dex.moves.get(moveid).name
      );
      i = j + 1;
      j = buf.indexOf("|", i);
      set.nature = buf.substring(i, j);
      if (set.nature === "undefined") delete set.nature;
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j !== i) {
        const evstring = buf.substring(i, j);
        if (evstring.length > 5) {
          const evs = evstring.split(",");
          set.evs = {
            hp: Number(evs[0]) || 0,
            atk: Number(evs[1]) || 0,
            def: Number(evs[2]) || 0,
            spa: Number(evs[3]) || 0,
            spd: Number(evs[4]) || 0,
            spe: Number(evs[5]) || 0
          };
        } else if (evstring === "0") {
          set.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        }
      }
      i = j + 1;
      j = buf.indexOf("|", i);
      if (i !== j) set.gender = buf.substring(i, j);
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j !== i) {
        const ivs = buf.substring(i, j).split(",");
        set.ivs = {
          hp: ivs[0] === "" ? 31 : Number(ivs[0]),
          atk: ivs[1] === "" ? 31 : Number(ivs[1]),
          def: ivs[2] === "" ? 31 : Number(ivs[2]),
          spa: ivs[3] === "" ? 31 : Number(ivs[3]),
          spd: ivs[4] === "" ? 31 : Number(ivs[4]),
          spe: ivs[5] === "" ? 31 : Number(ivs[5])
        };
      }
      i = j + 1;
      j = buf.indexOf("|", i);
      if (i !== j) set.shiny = true;
      i = j + 1;
      j = buf.indexOf("|", i);
      if (i !== j) set.level = parseInt(buf.substring(i, j), 10);
      i = j + 1;
      j = buf.indexOf("]", i);
      let misc;
      if (j < 0) {
        if (i < buf.length) misc = buf.substring(i).split(",", 6);
      } else {
        if (i !== j) misc = buf.substring(i, j).split(",", 6);
      }
      if (misc) {
        set.happiness = misc[0] ? Number(misc[0]) : void 0;
        set.hpType = misc[1] || void 0;
        set.pokeball = misc[2] || void 0;
        set.gigantamax = !!misc[3] || void 0;
        set.dynamaxLevel = misc[4] ? Number(misc[4]) : void 0;
        set.teraType = misc[5] || void 0;
      }
      if (j < 0) break;
      i = j + 1;
    }
    return team;
  }
  unpackSpeciesOnly(buf) {
    if (!buf) return [];
    const team = [];
    let i = 0;
    while (true) {
      const name = buf.slice(i, buf.indexOf("|", i));
      i = buf.indexOf("|", i) + 1;
      team.push(buf.slice(i, buf.indexOf("|", i)) || name);
      for (let k = 0; k < 9; k++) {
        i = buf.indexOf("|", i) + 1;
      }
      i = buf.indexOf("]", i) + 1;
      if (i < 1) break;
    }
    return team;
  }
  /**
   * (You may wish to manually add two spaces to the end of every line so
   * linebreaks are preserved in Markdown; I assume mostly for Reddit.)
   */
  exportSet(set, dex = import_battle_dex.Dex, newFormat) {
    let text = "";
    if (set.name && set.name !== set.species) {
      text += `${set.name} (${set.species})`;
    } else {
      text += `${set.species}`;
    }
    if (set.gender === "M") text += ` (M)`;
    if (set.gender === "F") text += ` (F)`;
    if (!newFormat && set.item) {
      text += ` @ ${set.item}`;
    }
    text += `
`;
    if ((set.item || set.ability || dex.gen >= 2) && newFormat) {
      if (set.ability || dex.gen >= 3) text += `[${set.ability || "(select ability)"}]`;
      if (set.item || dex.gen >= 2) text += ` @ ${set.item || "(no item)"}`;
      text += `
`;
    } else if (set.ability && set.ability !== "No Ability") {
      text += `Ability: ${set.ability}
`;
    }
    if (newFormat) {
      if (set.moves) {
        for (let move of set.moves) {
          if (move.startsWith("Hidden Power ")) {
            const hpType = move.slice(13);
            move = move.slice(0, 13);
            move = `${move}[${hpType}]`;
          }
          text += `- ${move || ""}
`;
        }
      }
      for (let i = set.moves?.length || 0; i < 4; i++) {
        text += `- 
`;
      }
    }
    let first = true;
    if (set.evs || set.nature) {
      const nature = newFormat ? import_battle_dex_data.BattleNatures[set.nature] : null;
      for (const stat of import_battle_dex.Dex.statNames) {
        const plusMinus = !newFormat ? "" : nature?.plus === stat ? "+" : nature?.minus === stat ? "-" : "";
        const ev = set.evs?.[stat] || "";
        if (ev === "" && !plusMinus) continue;
        text += first ? `EVs: ` : ` / `;
        first = false;
        text += `${ev}${plusMinus} ${import_battle_dex_data.BattleStatNames[stat]}`;
      }
    }
    if (!first) {
      if (set.nature && newFormat) text += ` (${set.nature})`;
      text += `
`;
    }
    if (set.nature && !newFormat) {
      text += `${set.nature} Nature
`;
    } else if (["Hardy", "Docile", "Serious", "Bashful", "Quirky"].includes(set.nature)) {
      text += `${set.nature} Nature
`;
    }
    first = true;
    if (set.ivs) {
      for (const stat of import_battle_dex.Dex.statNames) {
        if (set.ivs[stat] === void 0 || isNaN(set.ivs[stat]) || set.ivs[stat] === 31) continue;
        if (first) {
          text += `IVs: `;
          first = false;
        } else {
          text += ` / `;
        }
        text += `${set.ivs[stat]} ${import_battle_dex_data.BattleStatNames[stat]}`;
      }
    }
    if (!first) {
      text += `
`;
    }
    if (set.level && set.level !== 100) {
      text += `Level: ${set.level}
`;
    }
    if (set.shiny) {
      text += !newFormat ? `Shiny: Yes
` : `Shiny
`;
    }
    if (typeof set.happiness === "number" && set.happiness !== 255 && !isNaN(set.happiness)) {
      text += `Happiness: ${set.happiness}
`;
    }
    if (typeof set.dynamaxLevel === "number" && set.dynamaxLevel !== 255 && !isNaN(set.dynamaxLevel)) {
      text += `Dynamax Level: ${set.dynamaxLevel}
`;
    }
    if (set.gigantamax) {
      text += !newFormat ? `Gigantamax: Yes
` : `Gigantamax
`;
    }
    if (set.teraType) {
      text += `Tera Type: ${set.teraType}
`;
    }
    if (!newFormat) {
      for (let move of set.moves || []) {
        if (move.startsWith("Hidden Power ")) {
          const hpType = move.slice(13);
          move = move.slice(0, 13);
          move = !newFormat ? `${move}[${hpType}]` : `${move}${hpType}`;
        }
        text += `- ${move}
`;
      }
      for (let i = set.moves?.length || 0; i < 4; i++) {
        text += `- 
`;
      }
    }
    text += `
`;
    return text;
  }
  // TODO: finish this impl
  // getFullSet(set: Teams.PokemonSet, dex: ModdedDex): Teams.FullPokemonSet {
  // 	//
  // }
  export(sets, dex, newFormat) {
    let text = "";
    for (const set of sets) {
      text += Teams.exportSet(set, dex, newFormat);
    }
    return text;
  }
}();
//# sourceMappingURL=battle-teams.js.map
