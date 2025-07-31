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
var battle_sound_exports = {};
__export(battle_sound_exports, {
  BattleBGM: () => BattleBGM,
  BattleSound: () => BattleSound
});
module.exports = __toCommonJS(battle_sound_exports);
var import_client_main = require("./client-main");
class BattleBGM {
  constructor(url, loopstart, loopend) {
    this.timer = void 0;
    /**
     * When multiple battles with BGM are open, they will be `isPlaying`, but only the
     * first one will be `isActuallyPlaying`. In addition, muting volume or setting
     * BGM volume to 0 will set `isActuallyPlaying` to false.
     */
    this.isPlaying = false;
    this.isActuallyPlaying = false;
    /**
     * The sound should be rewound when it next plays.
     */
    this.willRewind = true;
    this.url = url;
    this.loopstart = loopstart;
    this.loopend = loopend;
  }
  play() {
    this.willRewind = true;
    this.resume();
  }
  resume() {
    this.isPlaying = true;
    this.actuallyResume();
  }
  pause() {
    this.isPlaying = false;
    this.actuallyPause();
    BattleBGM.update();
  }
  stop() {
    this.pause();
    this.willRewind = true;
  }
  destroy() {
    BattleSound.deleteBgm(this);
    this.pause();
  }
  actuallyResume() {
    if (this !== BattleSound.currentBgm()) return;
    if (this.isActuallyPlaying) return;
    if (!this.sound) this.sound = BattleSound.getSound(this.url);
    if (!this.sound) return;
    if (this.willRewind) this.sound.currentTime = 0;
    this.willRewind = false;
    this.isActuallyPlaying = true;
    this.sound.volume = BattleSound.bgmVolume / 100;
    this.sound.play();
    this.updateTime();
  }
  actuallyPause() {
    if (!this.isActuallyPlaying) return;
    this.isActuallyPlaying = false;
    this.sound.pause();
    this.updateTime();
  }
  /**
   * Handles the hard part of looping the sound
   */
  updateTime() {
    clearTimeout(this.timer);
    this.timer = void 0;
    if (this !== BattleSound.currentBgm()) return;
    if (!this.sound) return;
    const progress = this.sound.currentTime * 1e3;
    if (progress > this.loopend - 1e3) {
      this.sound.currentTime -= (this.loopend - this.loopstart) / 1e3;
    }
    this.timer = setTimeout(() => {
      this.updateTime();
    }, Math.max(this.loopend - progress, 1));
  }
  static update() {
    const current = BattleSound.currentBgm();
    for (const bgm of BattleSound.bgm) {
      if (bgm.isPlaying) {
        if (bgm === current) {
          bgm.actuallyResume();
        } else {
          bgm.actuallyPause();
        }
      }
    }
  }
}
const BattleSound = new class {
  constructor() {
    this.soundCache = {};
    this.bgm = [];
    // options
    this.effectVolume = 50;
    this.bgmVolume = 50;
    this.muted = false;
  }
  getSound(url) {
    if (!window.HTMLAudioElement) return;
    if (this.soundCache[url]) return this.soundCache[url];
    try {
      const sound = document.createElement("audio");
      sound.src = `https://${import_client_main.Config.routes.client}/${url}`;
      sound.volume = this.effectVolume / 100;
      this.soundCache[url] = sound;
      return sound;
    } catch {
    }
  }
  playEffect(url) {
    this.playSound(url, this.muted ? 0 : this.effectVolume);
  }
  playSound(url, volume) {
    if (!volume) return;
    const effect = this.getSound(url);
    if (effect) {
      effect.volume = volume / 100;
      effect.play();
    }
  }
  /** loopstart and loopend are in milliseconds */
  loadBgm(url, loopstart, loopend, replaceBGM) {
    if (replaceBGM) {
      replaceBGM.stop();
      this.deleteBgm(replaceBGM);
    }
    const bgm = new BattleBGM(url, loopstart, loopend);
    this.bgm.push(bgm);
    return bgm;
  }
  deleteBgm(bgm) {
    const soundIndex = BattleSound.bgm.indexOf(bgm);
    if (soundIndex >= 0) BattleSound.bgm.splice(soundIndex, 1);
  }
  currentBgm() {
    if (!this.bgmVolume || this.muted) return false;
    for (const bgm of this.bgm) {
      if (bgm.isPlaying) return bgm;
    }
    return null;
  }
  // setting
  setMute(muted) {
    muted = !!muted;
    if (this.muted === muted) return;
    this.muted = muted;
    BattleBGM.update();
  }
  loudnessPercentToAmplitudePercent(loudnessPercent) {
    let decibels = 10 * Math.log(loudnessPercent / 100) / Math.log(2);
    return 10 ** (decibels / 20) * 100;
  }
  setBgmVolume(bgmVolume) {
    this.bgmVolume = this.loudnessPercentToAmplitudePercent(bgmVolume);
    BattleBGM.update();
  }
  setEffectVolume(effectVolume) {
    this.effectVolume = this.loudnessPercentToAmplitudePercent(effectVolume);
  }
}();
if (typeof import_client_main.PS === "object") {
  import_client_main.PS.prefs.subscribeAndRun((key) => {
    if (!key || key === "musicvolume" || key === "effectvolume" || key === "mute") {
      BattleSound.effectVolume = import_client_main.PS.prefs.effectvolume;
      BattleSound.bgmVolume = import_client_main.PS.prefs.musicvolume;
      BattleSound.muted = import_client_main.PS.prefs.mute;
      BattleBGM.update();
    }
  });
}
//# sourceMappingURL=battle-sound.js.map
