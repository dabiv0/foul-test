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
var battle_scene_stub_exports = {};
__export(battle_scene_stub_exports, {
  BattleSceneStub: () => BattleSceneStub
});
module.exports = __toCommonJS(battle_scene_stub_exports);
class BattleSceneStub {
  constructor() {
    this.animating = false;
    this.acceleration = NaN;
    this.gen = NaN;
    this.activeCount = NaN;
    this.numericId = NaN;
    this.timeOffset = NaN;
    this.interruptionCount = NaN;
    this.messagebarOpen = false;
    this.log = { add: (args, kwargs) => {
    } };
  }
  abilityActivateAnim(pokemon, result) {
  }
  addPokemonSprite(pokemon) {
    return null;
  }
  addSideCondition(siden, id, instant) {
  }
  animationOff() {
  }
  animationOn() {
  }
  maybeCloseMessagebar(args, kwArgs) {
    return false;
  }
  closeMessagebar() {
    return false;
  }
  damageAnim(pokemon, damage) {
  }
  destroy() {
  }
  finishAnimations() {
    return void 0;
  }
  healAnim(pokemon, damage) {
  }
  hideJoinButtons() {
  }
  incrementTurn() {
  }
  updateAcceleration() {
  }
  message(message, hiddenMessage) {
  }
  pause() {
  }
  setMute(muted) {
  }
  preemptCatchup() {
  }
  removeSideCondition(siden, id) {
  }
  reset() {
  }
  resetBgm() {
  }
  updateBgm() {
  }
  resultAnim(pokemon, result, type) {
  }
  typeAnim(pokemon, types) {
  }
  resume() {
  }
  runMoveAnim(moveid, participants) {
  }
  runOtherAnim(moveid, participants) {
  }
  runPrepareAnim(moveid, attacker, defender) {
  }
  runResidualAnim(moveid, pokemon) {
  }
  runStatusAnim(moveid, participants) {
  }
  startAnimations() {
  }
  teamPreview() {
  }
  resetSides() {
  }
  updateGen() {
  }
  updateSidebar(side) {
  }
  updateSidebars() {
  }
  updateStatbars() {
  }
  updateWeather(instant) {
  }
  upkeepWeather() {
  }
  wait(time) {
  }
  setFrameHTML(html) {
  }
  setControlsHTML(html) {
  }
  removeEffect(pokemon, id, instant) {
  }
  addEffect(pokemon, id, instant) {
  }
  animSummon(pokemon, slot, instant) {
  }
  animUnsummon(pokemon, instant) {
  }
  animDragIn(pokemon, slot) {
  }
  animDragOut(pokemon) {
  }
  resetStatbar(pokemon, startHidden) {
  }
  updateStatbar(pokemon, updatePrevhp, updateHp) {
  }
  updateStatbarIfExists(pokemon, updatePrevhp, updateHp) {
  }
  animTransform(pokemon, useSpeciesAnim, isPermanent) {
  }
  clearEffects(pokemon) {
  }
  removeTransform(pokemon) {
  }
  animFaint(pokemon) {
  }
  animReset(pokemon) {
  }
  anim(pokemon, end, transition) {
  }
  beforeMove(pokemon) {
  }
  afterMove(pokemon) {
  }
}
if (typeof require === "function") {
  global.BattleSceneStub = BattleSceneStub;
}
//# sourceMappingURL=battle-scene-stub.js.map
