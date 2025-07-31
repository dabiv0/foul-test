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
var battle_choices_exports = {};
__export(battle_choices_exports, {
  BattleChoiceBuilder: () => BattleChoiceBuilder
});
module.exports = __toCommonJS(battle_choices_exports);
var import_battle_dex = require("./battle-dex");
/**
 * Battle choices
 *
 * PS will send requests "what do you do this turn?", and you send back
 * choices "I switch Pikachu for Caterpie, and Squirtle uses Water Gun"
 *
 * This file contains classes for handling requests and choices.
 *
 * Dependencies: battle-dex
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */
class BattleChoiceBuilder {
  constructor(request) {
    /** Completed choices in string form */
    this.choices = [];
    /** Currently active partial move choice - not used for other choices, which don't have partial states */
    this.current = {
      choiceType: "move",
      /** if nonzero, show target screen; if zero, show move screen */
      move: 0,
      targetLoc: 0,
      // should always be 0: is not partial if `targetLoc` is known
      mega: false,
      megax: false,
      megay: false,
      ultra: false,
      z: false,
      max: false,
      tera: false
    };
    this.alreadySwitchingIn = [];
    this.alreadyMega = false;
    this.alreadyMax = false;
    this.alreadyZ = false;
    this.alreadyTera = false;
    this.request = request;
    this.noCancel = request.noCancel || request.requestType === "wait";
    this.fillPasses();
  }
  toString() {
    let choices = this.choices;
    if (this.current.move) choices = choices.concat(this.stringChoice(this.current));
    return choices.join(", ").replace(/, team /g, ", ");
  }
  isDone() {
    return this.choices.length >= this.requestLength();
  }
  isEmpty() {
    for (const choice of this.choices) {
      if (choice !== "pass") return false;
    }
    if (this.current.move) return false;
    return true;
  }
  /** Index of the current Pokémon to make choices for */
  index() {
    return this.choices.length;
  }
  /** How many choices is the server expecting? */
  requestLength() {
    const request = this.request;
    switch (request.requestType) {
      case "move":
        return request.active.length;
      case "switch":
        return request.forceSwitch.length;
      case "team":
        return request.chosenTeamSize || 1;
      case "wait":
        return 0;
    }
  }
  currentMoveRequest(index = this.index()) {
    if (this.request.requestType !== "move") return null;
    return this.request.active[index];
  }
  noMoreSwitchChoices() {
    if (this.request.requestType !== "switch") return false;
    for (let i = this.requestLength(); i < this.request.side.pokemon.length; i++) {
      const pokemon = this.request.side.pokemon[i];
      if (!pokemon.fainted && !this.alreadySwitchingIn.includes(i + 1)) {
        return false;
      }
    }
    return true;
  }
  addChoice(choiceString) {
    let choice;
    try {
      choice = this.parseChoice(choiceString);
    } catch (err) {
      return err.message;
    }
    if (!choice) {
      return "You do not need to manually choose to pass; the client handles it for you automatically";
    }
    const isLastChoice = this.choices.length + 1 >= this.requestLength();
    if (choice.choiceType === "move") {
      if (!choice.targetLoc && this.request.targetable) {
        const choosableTargets = ["normal", "any", "adjacentAlly", "adjacentAllyOrSelf", "adjacentFoe"];
        if (choosableTargets.includes(this.currentMove(choice)?.target)) {
          this.current = choice;
          return null;
        }
      }
      if (this.currentMoveRequest()?.maybeDisabled && isLastChoice) {
        this.noCancel = true;
      }
      if (choice.mega || choice.megax || choice.megay) this.alreadyMega = true;
      if (choice.z) this.alreadyZ = true;
      if (choice.max) this.alreadyMax = true;
      if (choice.tera) this.alreadyTera = true;
      this.current = {
        choiceType: "move",
        move: 0,
        targetLoc: 0,
        mega: false,
        megax: false,
        megay: false,
        ultra: false,
        z: false,
        max: false,
        tera: false
      };
    } else if (choice.choiceType === "switch" || choice.choiceType === "team") {
      if (this.currentMoveRequest()?.trapped) {
        return "You are trapped and cannot switch out";
      }
      if (this.alreadySwitchingIn.includes(choice.targetPokemon)) {
        if (choice.choiceType === "switch") {
          return "You've already chosen to switch that Pok\xE9mon in";
        }
        for (let i = 0; i < this.alreadySwitchingIn.length; i++) {
          if (this.alreadySwitchingIn[i] === choice.targetPokemon) {
            this.alreadySwitchingIn.splice(i, 1);
            this.choices.splice(i, 1);
            return null;
          }
        }
        return "Unexpected bug, please report this";
      }
      if (this.currentMoveRequest()?.maybeTrapped && isLastChoice) {
        this.noCancel = true;
      }
      this.alreadySwitchingIn.push(choice.targetPokemon);
    } else if (choice.choiceType === "testfight") {
      if (isLastChoice) {
        this.noCancel = true;
      }
    } else if (choice.choiceType === "shift") {
      if (this.index() === 1) {
        return "Only Pok\xE9mon not already in the center can shift to the center";
      }
    }
    this.choices.push(this.stringChoice(choice));
    this.fillPasses();
    return null;
  }
  /**
   * Move and switch requests will often skip over some active Pokémon (mainly
   * fainted Pokémon). This will fill them in automatically, so we don't need
   * to ask a user for them.
   */
  fillPasses() {
    const request = this.request;
    switch (request.requestType) {
      case "move":
        while (this.choices.length < request.active.length && !request.active[this.choices.length]) {
          this.choices.push("pass");
        }
        break;
      case "switch":
        const noMoreSwitchChoices = this.noMoreSwitchChoices();
        while (this.choices.length < request.forceSwitch.length) {
          if (!request.forceSwitch[this.choices.length] || noMoreSwitchChoices) {
            this.choices.push("pass");
          } else {
            break;
          }
        }
    }
  }
  currentMove(choice = this.current, index = this.index()) {
    const moveIndex = choice.move - 1;
    return this.currentMoveList(index, choice)?.[moveIndex] || null;
  }
  currentMoveList(index = this.index(), current = this.current) {
    const moveRequest = this.currentMoveRequest(index);
    if (!moveRequest) return null;
    if (current.max || moveRequest.maxMoves && !moveRequest.canDynamax) {
      return moveRequest.maxMoves || null;
    }
    if (current.z) {
      return moveRequest.zMoves || null;
    }
    return moveRequest.moves;
  }
  /**
   * Parses a choice from string form to BattleChoice form
   */
  parseChoice(choice, index = this.choices.length) {
    const request = this.request;
    if (request.requestType === "wait") throw new Error(`It's not your turn to choose anything`);
    if (choice === "shift" || choice === "testfight") {
      if (request.requestType !== "move") {
        throw new Error(`You must switch in a Pok\xE9mon, not move.`);
      }
      return { choiceType: choice };
    }
    if (choice.startsWith("move ")) {
      if (request.requestType !== "move") {
        throw new Error(`You must switch in a Pok\xE9mon, not move.`);
      }
      const moveRequest = request.active[index];
      choice = choice.slice(5);
      let current = {
        choiceType: "move",
        move: 0,
        targetLoc: 0,
        mega: false,
        megax: false,
        megay: false,
        ultra: false,
        z: false,
        max: false,
        tera: false
      };
      while (true) {
        if (/\s(?:-|\+)?[1-3]$/.test(choice) && (0, import_battle_dex.toID)(choice) !== "conversion2") {
          if (current.targetLoc) throw new Error(`Move choice has multiple targets`);
          current.targetLoc = parseInt(choice.slice(-2), 10);
          choice = choice.slice(0, -2).trim();
        } else if (choice.endsWith(" mega")) {
          current.mega = true;
          choice = choice.slice(0, -5);
        } else if (choice.endsWith(" megax")) {
          current.megax = true;
          choice = choice.slice(0, -6);
        } else if (choice.endsWith(" megay")) {
          current.megay = true;
          choice = choice.slice(0, -6);
        } else if (choice.endsWith(" zmove")) {
          current.z = true;
          choice = choice.slice(0, -6);
        } else if (choice.endsWith(" ultra")) {
          current.ultra = true;
          choice = choice.slice(0, -6);
        } else if (choice.endsWith(" dynamax")) {
          current.max = true;
          choice = choice.slice(0, -8);
        } else if (choice.endsWith(" max")) {
          current.max = true;
          choice = choice.slice(0, -4);
        } else if (choice.endsWith(" terastallize")) {
          current.tera = true;
          choice = choice.slice(0, -13);
        } else if (choice.endsWith(" terastal")) {
          current.tera = true;
          choice = choice.slice(0, -9);
        } else {
          break;
        }
      }
      if (/^[0-9]+$/.test(choice)) {
        current.move = parseInt(choice, 10);
      } else {
        let moveid = (0, import_battle_dex.toID)(choice);
        if (moveid.startsWith("hiddenpower")) moveid = "hiddenpower";
        for (let i = 0; i < moveRequest.moves.length; i++) {
          if (moveid === moveRequest.moves[i].id) {
            current.move = i + 1;
            if (moveRequest.moves[i].disabled) {
              throw new Error(`Move "${moveRequest.moves[i].name}" is disabled`);
            }
            break;
          }
        }
        if (!current.move && moveRequest.zMoves) {
          for (let i = 0; i < moveRequest.zMoves.length; i++) {
            if (!moveRequest.zMoves[i]) continue;
            if (moveid === moveRequest.zMoves[i].id) {
              current.move = i + 1;
              current.z = true;
              break;
            }
          }
        }
        if (!current.move && moveRequest.maxMoves) {
          for (let i = 0; i < moveRequest.maxMoves.length; i++) {
            if (moveid === moveRequest.maxMoves[i].id) {
              if (moveRequest.maxMoves[i].disabled) {
                throw new Error(`Move "${moveRequest.maxMoves[i].name}" is disabled`);
              }
              current.move = i + 1;
              current.max = true;
              break;
            }
          }
        }
      }
      if (current.max && !moveRequest.canDynamax) current.max = false;
      const move = this.currentMove(current, index);
      if (!move || move.disabled) {
        throw new Error(`Move ${move?.name ?? current.move} is disabled`);
      }
      return current;
    }
    if (choice.startsWith("switch ") || choice.startsWith("team ")) {
      choice = choice.slice(choice.startsWith("team ") ? 5 : 7);
      const isTeamPreview = request.requestType === "team";
      let current = {
        choiceType: isTeamPreview ? "team" : "switch",
        targetPokemon: 0
      };
      if (/^[0-9]+$/.test(choice)) {
        current.targetPokemon = parseInt(choice, 10);
      } else {
        const lowerChoice = choice.toLowerCase();
        const choiceid = (0, import_battle_dex.toID)(choice);
        let matchLevel = 0;
        let match = 0;
        for (let i = 0; i < request.side.pokemon.length; i++) {
          const serverPokemon = request.side.pokemon[i];
          let curMatchLevel = 0;
          if (choice === serverPokemon.name) {
            curMatchLevel = 10;
          } else if (lowerChoice === serverPokemon.name.toLowerCase()) {
            curMatchLevel = 9;
          } else if (choiceid === (0, import_battle_dex.toID)(serverPokemon.name)) {
            curMatchLevel = 8;
          } else if (choiceid === (0, import_battle_dex.toID)(serverPokemon.speciesForme)) {
            curMatchLevel = 7;
          } else if (choiceid === (0, import_battle_dex.toID)(import_battle_dex.Dex.species.get(serverPokemon.speciesForme).baseSpecies)) {
            curMatchLevel = 6;
          }
          if (curMatchLevel > matchLevel) {
            match = i + 1;
            matchLevel = curMatchLevel;
          }
        }
        if (!match) {
          throw new Error(`Couldn't find Pok\xE9mon "${choice}" to switch to`);
        }
        current.targetPokemon = match;
      }
      if (!isTeamPreview && current.targetPokemon - 1 < this.requestLength()) {
        throw new Error(`That Pok\xE9mon is already in battle!`);
      }
      const target = request.side.pokemon[current.targetPokemon - 1];
      if (!target) {
        throw new Error(`Couldn't find Pok\xE9mon "${choice}" to switch to!`);
      }
      if (target.fainted) {
        throw new Error(`${target.name} is fainted and cannot battle!`);
      }
      return current;
    }
    if (choice === "pass") return null;
    throw new Error(`Unrecognized choice "${choice}"`);
  }
  /**
   * Converts a choice from `BattleChoice` into string form
   */
  stringChoice(choice) {
    if (!choice) return `pass`;
    switch (choice.choiceType) {
      case "move":
        const target = choice.targetLoc ? ` ${choice.targetLoc > 0 ? "+" : ""}${choice.targetLoc}` : ``;
        return `move ${choice.move}${this.moveSpecial(choice)}${target}`;
      case "switch":
      case "team":
        return `${choice.choiceType} ${choice.targetPokemon}`;
      case "shift":
      case "testfight":
        return choice.choiceType;
    }
  }
  moveSpecial(choice) {
    return (choice.max ? " max" : "") + (choice.mega ? " mega" : "") + (choice.megax ? " megax" : "") + (choice.megay ? " megay" : "") + (choice.z ? " zmove" : "") + (choice.tera ? " terastallize" : "");
  }
  /**
   * The request sent from the server is actually really gross, but we'll have
   * to wait until we transition to the new client before fixing it in the
   * protocol, in the interests of not needing to fix it twice (or needing to
   * fix it without TypeScript).
   *
   * In the meantime, this function converts a request from a shitty request
   * to a request that makes sense.
   *
   * I'm sorry for literally all of this.
   */
  static fixRequest(request, battle) {
    if (!request.requestType) {
      request.requestType = "move";
      if (request.forceSwitch) {
        request.requestType = "switch";
      } else if (request.teamPreview) {
        request.requestType = "team";
      } else if (request.wait) {
        request.requestType = "wait";
      }
    }
    if (request.requestType === "wait") request.noCancel = true;
    if (request.side) {
      for (const serverPokemon of request.side.pokemon) {
        battle.parseDetails(serverPokemon.ident.substr(4), serverPokemon.ident, serverPokemon.details, serverPokemon);
        battle.parseHealth(serverPokemon.condition, serverPokemon);
      }
    }
    if (request.requestType === "team" && !request.chosenTeamSize) {
      request.chosenTeamSize = 1;
      if (battle.gameType === "doubles") {
        request.chosenTeamSize = 2;
      }
      if (battle.gameType === "triples" || battle.gameType === "rotation") {
        request.chosenTeamSize = 3;
      }
      for (const switchable of request.side.pokemon) {
        if ((0, import_battle_dex.toID)(switchable.baseAbility) === "illusion") {
          request.chosenTeamSize = request.side.pokemon.length;
        }
      }
      if (request.maxChosenTeamSize) {
        request.chosenTeamSize = request.maxChosenTeamSize;
      }
      if (battle.teamPreviewCount) {
        const chosenTeamSize = battle.teamPreviewCount;
        if (chosenTeamSize > 0 && chosenTeamSize <= request.side.pokemon.length) {
          request.chosenTeamSize = chosenTeamSize;
        }
      }
    }
    request.targetable ||= battle.mySide.active.length > 1;
    if (request.active) {
      request.active = request.active.map(
        (active, i) => request.side.pokemon[i].fainted ? null : active
      );
      for (const active of request.active) {
        if (!active) continue;
        for (const move of active.moves) {
          if (move.move) move.name = move.move;
          move.id = (0, import_battle_dex.toID)(move.name);
        }
        if (active.maxMoves) {
          if (active.maxMoves.maxMoves) {
            active.gigantamax = active.maxMoves.gigantamax;
            active.maxMoves = active.maxMoves.maxMoves;
          }
          for (const move of active.maxMoves) {
            if (move.move) move.name = import_battle_dex.Dex.moves.get(move.move).name;
            move.id = (0, import_battle_dex.toID)(move.name);
          }
        }
        if (active.canZMove) {
          active.zMoves = active.canZMove;
          for (const move of active.zMoves) {
            if (!move) continue;
            if (move.move) move.name = move.move;
            move.id = (0, import_battle_dex.toID)(move.name);
          }
        }
      }
    }
  }
}
//# sourceMappingURL=battle-choices.js.map
