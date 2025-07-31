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
var client_main_exports = {};
__export(client_main_exports, {
  PS: () => PS,
  PSRoom: () => PSRoom,
  makeLoadTracker: () => makeLoadTracker
});
module.exports = __toCommonJS(client_main_exports);
var import_client_connection = require("./client-connection");
var import_client_core = require("./client-core");
var import_panel_chat = require("./panel-chat");
var import_battle_dex = require("./battle-dex");
var import_battle_text_parser = require("./battle-text-parser");
var import_battle_teams = require("./battle-teams");
/**
 * Client main
 *
 * Dependencies: client-core
 *
 * Sets up the main client models: Prefs, Teams, User, and PS.
 *
 * @author Guangcong Luo <guancongluo@gmail.com>
 * @license AGPLv3
 */
const PSPrefsDefaults = {};
class PSPrefs extends import_client_core.PSStreamModel {
  constructor() {
    super();
    // PREFS START HERE
    /**
     * The theme to use. "system" matches the theme of the system accessing the client.
     */
    this.theme = "light";
    /**
     * Disables animated GIFs, but keeps other animations enabled.
     * Workaround for a Chrome 64 bug with GIFs.
     * true - Disable GIFs, will be automatically re-enabled if you
     *   switch away from Chrome 64.
     * false - Enable GIFs all the time.
     * null - Enable GIFs only on Chrome 64.
     */
    this.nogif = null;
    /* Graphics Preferences */
    this.noanim = null;
    this.bwgfx = null;
    this.nopastgens = null;
    /* Chat Preferences */
    this.blockPMs = null;
    this.blockChallenges = null;
    this.inchatpm = null;
    this.noselfhighlight = null;
    this.temporarynotifications = null;
    this.leavePopupRoom = null;
    this.refreshprompt = null;
    this.language = "english";
    this.chatformatting = {
      hidegreentext: false,
      hideme: false,
      hidespoiler: false,
      hidelinks: false,
      hideinterstice: true
    };
    this.nounlink = null;
    /* Battle preferences */
    this.ignorenicks = null;
    this.ignorespects = null;
    this.ignoreopp = null;
    this.autotimer = null;
    this.rightpanelbattles = null;
    this.disallowspectators = null;
    this.starredformats = null;
    /**
     * Show "User joined" and "User left" messages. serverid:roomid
     * table. Uses 1 and 0 instead of true/false for JSON packing
     * reasons.
     */
    this.showjoins = null;
    this.showdebug = null;
    this.showbattles = true;
    /**
     * Comma-separated lists of room titles to autojoin. Single
     * string is for Main.
     */
    this.autojoin = null;
    /**
     * List of users whose messages should be ignored. userid table.
     * Uses 1 and 0 instead of true/false for JSON packing reasons.
     */
    this.ignore = null;
    /**
     * hide = hide regular display, notify = notify on new tours, null = notify on joined tours.
     */
    this.tournaments = null;
    /**
     * true = one panel, false = two panels, left and right
     */
    this.onepanel = false;
    this.timestamps = {};
    this.mute = false;
    this.effectvolume = 50;
    this.musicvolume = 50;
    this.notifvolume = 50;
    this.uploadprivacy = false;
    this.afd = false;
    this.highlights = null;
    this.logtimes = null;
    // PREFS END HERE
    this.storageEngine = "";
    this.storage = {};
    this.origin = `https://${Config.routes.client}`;
    for (const key in this) {
      const value = this[key];
      if (["storage", "subscriptions", "origin", "storageEngine", "updates"].includes(key)) continue;
      if (typeof value === "function") continue;
      PSPrefsDefaults[key] = value;
    }
    try {
      if (window.localStorage) {
        this.storageEngine = "localStorage";
        this.load(JSON.parse(localStorage.getItem("showdown_prefs")) || {}, true);
      }
    } catch {
    }
  }
  /**
   * Change a preference.
   */
  set(key, value) {
    if (value === null) {
      delete this.storage[key];
      this[key] = PSPrefsDefaults[key];
    } else {
      this.storage[key] = value;
      this[key] = value;
    }
    this.update(key);
    this.save();
  }
  load(newPrefs, noSave) {
    this.fixPrefs(newPrefs);
    Object.assign(this, PSPrefsDefaults);
    this.storage = newPrefs;
    for (const key in PSPrefsDefaults) {
      if (key in newPrefs) this[key] = newPrefs[key];
    }
    this.setAFD();
    this.update(null);
    if (!noSave) this.save();
  }
  save() {
    switch (this.storageEngine) {
      case "localStorage":
        localStorage.setItem("showdown_prefs", JSON.stringify(this.storage));
    }
  }
  fixPrefs(newPrefs) {
    const oldShowjoins = newPrefs["showjoins"];
    if (oldShowjoins !== void 0 && typeof oldShowjoins !== "object") {
      const showjoins = {};
      const serverShowjoins = { global: oldShowjoins ? 1 : 0 };
      const showroomjoins = newPrefs["showroomjoins"];
      for (const roomid in showroomjoins) {
        serverShowjoins[roomid] = showroomjoins[roomid] ? 1 : 0;
      }
      delete newPrefs["showroomjoins"];
      showjoins[Config.server.id] = serverShowjoins;
      newPrefs["showjoins"] = showjoins;
    }
    const isChrome64 = navigator.userAgent.includes(" Chrome/64.");
    if (newPrefs["nogif"] !== void 0) {
      if (!isChrome64) {
        delete newPrefs["nogif"];
      }
    } else if (isChrome64) {
      newPrefs["nogif"] = true;
      PS.alert('Your version of Chrome has a bug that makes animated GIFs freeze games sometimes, so certain animations have been disabled. Only some people have the problem, so you can experiment and enable them in the Options menu setting "Disable GIFs for Chrome 64 bug".');
    }
    const colorSchemeQuerySupported = window.matchMedia?.("(prefers-color-scheme: dark)").media !== "not all";
    if (newPrefs["theme"] === "system" && !colorSchemeQuerySupported) {
      newPrefs["theme"] = "light";
    }
    if (newPrefs["dark"] !== void 0) {
      if (newPrefs["dark"]) {
        newPrefs["theme"] = "dark";
      }
      delete newPrefs["dark"];
    }
  }
  setAFD(mode) {
    if (mode === void 0) {
      if (typeof BattleTextAFD !== "undefined") {
        for (const id in BattleTextNotAFD) {
          if (!BattleTextAFD[id]) {
            BattleTextAFD[id] = BattleTextNotAFD[id];
          } else {
            BattleTextAFD[id] = { ...BattleTextNotAFD[id], ...BattleTextAFD[id] };
          }
        }
      }
      if (Config.server?.afd) {
        mode = true;
      } else if (this.afd !== void 0) {
        mode = this.afd;
      } else {
      }
    }
    import_battle_dex.Dex.afdMode = mode;
    if (typeof BattleTextAFD !== "undefined") {
      if (mode === true) {
        BattleText = BattleTextAFD;
      } else {
        BattleText = BattleTextNotAFD;
      }
    }
  }
  doAutojoin() {
    let autojoin = PS.prefs.autojoin;
    if (autojoin) {
      if (typeof autojoin === "string") {
        autojoin = { showdown: autojoin };
      }
      let rooms = autojoin[PS.server.id] || "";
      for (let title of rooms.split(",")) {
        PS.addRoom({ id: (0, import_battle_dex.toID)(title), title, connected: true }, true);
      }
      ;
      const cmd = `/autojoin ${rooms}`;
      if (PS.connection?.queue.includes(cmd)) {
        return;
      }
      PS.send(cmd);
    }
  }
}
if (!window.BattleFormats) window.BattleFormats = {};
class PSTeams extends import_client_core.PSStreamModel {
  constructor() {
    super();
    /** false if it uses the ladder in the website */
    this.usesLocalLadder = false;
    this.list = [];
    this.byKey = {};
    this.deletedTeams = [];
    this.uploading = null;
    try {
      this.unpackAll(localStorage.getItem("showdown_teams"));
    } catch {
    }
  }
  teambuilderFormat(format) {
    const ruleSepIndex = format.indexOf("@@@");
    if (ruleSepIndex >= 0) format = format.slice(0, ruleSepIndex);
    const formatid = (0, import_battle_dex.toID)(format);
    if (!window.BattleFormats) return formatid;
    const formatEntry = BattleFormats[formatid];
    return formatEntry?.teambuilderFormat || formatid;
  }
  getKey(name) {
    const baseKey = (0, import_battle_dex.toID)(name) || "0";
    let key = baseKey;
    let i = 1;
    while (key in this.byKey) {
      i++;
      key = `${baseKey}-${i}`;
    }
    return key;
  }
  unpackAll(buffer) {
    if (!buffer) {
      this.list = [];
      return;
    }
    if (buffer.startsWith("[") && !buffer.trim().includes("\n")) {
      this.unpackOldBuffer(buffer);
      return;
    }
    this.list = [];
    for (const line of buffer.split("\n")) {
      const team = this.unpackLine(line);
      if (team) this.push(team);
    }
    this.update("team");
  }
  push(team) {
    team.key = this.getKey(team.name);
    this.list.push(team);
    this.byKey[team.key] = team;
  }
  unshift(team) {
    team.key = this.getKey(team.name);
    this.list.unshift(team);
    this.byKey[team.key] = team;
  }
  delete(team) {
    const teamIndex = this.list.indexOf(team);
    if (teamIndex < 0) return false;
    this.deletedTeams.push([team, teamIndex]);
    this.list.splice(teamIndex, 1);
    delete this.byKey[team.key];
  }
  undelete() {
    if (!this.deletedTeams.length) return;
    const [team, teamIndex] = this.deletedTeams.pop();
    this.list.splice(teamIndex, 0, team);
    if (this.byKey[team.key]) team.key = this.getKey(team.name);
    this.byKey[team.key] = team;
  }
  unpackOldBuffer(buffer) {
    PS.alert(`Your team storage format is too old for PS. You'll need to upgrade it at https://${Config.routes.client}/recoverteams.html`);
    this.list = [];
  }
  packAll(teams) {
    return teams.map((team) => (team.teamid ? `${team.teamid}[` : "") + (team.format || team.isBox ? `${team.format || ""}${team.isBox ? "-box" : ""}]` : ``) + (team.folder ? `${team.folder}/` : ``) + team.name + `|` + team.packedTeam).join("\n");
  }
  save() {
    try {
      localStorage.setItem("showdown_teams", this.packAll(this.list));
    } catch {
    }
    this.update("team");
  }
  unpackLine(line) {
    const pipeIndex = line.indexOf("|");
    if (pipeIndex < 0) return null;
    let bracketIndex = line.indexOf("]");
    if (bracketIndex > pipeIndex) bracketIndex = -1;
    let leftBracketIndex = line.indexOf("[");
    if (leftBracketIndex < 0) leftBracketIndex = 0;
    const isBox = line.slice(0, bracketIndex).endsWith("-box");
    let slashIndex = line.lastIndexOf("/", pipeIndex);
    if (slashIndex < 0) slashIndex = bracketIndex;
    let format = bracketIndex > 0 ? line.slice(
      leftBracketIndex ? leftBracketIndex + 1 : 0,
      isBox ? bracketIndex - 4 : bracketIndex
    ) : "gen9";
    if (!format.startsWith("gen")) format = "gen6" + format;
    const name = line.slice(slashIndex + 1, pipeIndex);
    const teamid = leftBracketIndex > 0 ? Number(line.slice(0, leftBracketIndex)) : void 0;
    return {
      name,
      format,
      folder: line.slice(bracketIndex + 1, slashIndex > 0 ? slashIndex : bracketIndex + 1),
      packedTeam: line.slice(pipeIndex + 1),
      iconCache: null,
      key: "",
      isBox,
      teamid
    };
  }
  loadRemoteTeams() {
    import_client_connection.PSLoginServer.query("getteams").then((data) => {
      if (!data) return;
      if (data.actionerror) {
        return PS.alert("Error loading uploaded teams: " + data.actionerror);
      }
      const teams = {};
      for (const team of data.teams) {
        teams[team.teamid] = team;
      }
      for (const localTeam of this.list) {
        if (localTeam.teamid) {
          const team = teams[localTeam.teamid];
          if (!team) {
            continue;
          }
          localTeam.uploaded = {
            teamid: team.teamid,
            notLoaded: false,
            private: team.private
          };
          delete teams[localTeam.teamid];
        }
      }
      for (const team of Object.values(teams)) {
        let matched = false;
        for (const localTeam of this.list) {
          if (localTeam.teamid) continue;
          const compare = this.compareTeams(team, localTeam);
          if (compare === "rename") {
            if (!localTeam.name.endsWith(" (local version)")) localTeam.name += " (local version)";
          } else if (compare) {
            matched = true;
            localTeam.teamid = team.teamid;
            localTeam.uploaded = {
              teamid: team.teamid,
              notLoaded: false,
              private: team.private
            };
            break;
          }
        }
        if (!matched) {
          const mons = team.team.split(",").map((m) => ({ species: m, moves: [] }));
          const newTeam = {
            name: team.name,
            format: team.format,
            folder: "",
            packedTeam: import_battle_teams.Teams.pack(mons),
            iconCache: null,
            isBox: false,
            key: this.getKey(team.name),
            uploaded: {
              teamid: team.teamid,
              notLoaded: true,
              private: team.private
            }
          };
          this.push(newTeam);
        }
      }
    });
  }
  loadTeam(team, ifNeeded) {
    if (!team?.uploaded || team.uploadedPackedTeam) return ifNeeded ? void 0 : Promise.resolve();
    if (team.uploaded.notLoaded && team.uploaded.notLoaded !== true) return team.uploaded.notLoaded;
    const notLoaded = team.uploaded.notLoaded;
    return team.uploaded.notLoaded = import_client_connection.PSLoginServer.query("getteam", {
      teamid: team.uploaded.teamid
    }).then((data) => {
      if (!team.uploaded) return;
      if (!data?.team) {
        PS.alert(`Failed to load team: ${data?.actionerror || "Error unknown. Try again later."}`);
        return;
      }
      team.uploaded.notLoaded = false;
      team.uploadedPackedTeam = data.team;
      if (notLoaded) {
        team.packedTeam = data.team;
        PS.teams.save();
      }
    });
  }
  compareTeams(serverTeam, localTeam) {
    let sanitize = (name) => (name || "").replace(/\s+\(server version\)/g, "").trim();
    const nameMatches = sanitize(serverTeam.name) === sanitize(localTeam.name);
    if (!(nameMatches && serverTeam.format === localTeam.format)) {
      return false;
    }
    const mons = serverTeam.team.split(",").map(import_battle_dex.toID).sort().join(",");
    const otherMons = import_battle_teams.Teams.unpackSpeciesOnly(localTeam.packedTeam).map(import_battle_dex.toID).sort().join(",");
    if (mons !== otherMons) return "rename";
    return true;
  }
}
class PSUser extends import_client_core.PSStreamModel {
  constructor() {
    super(...arguments);
    this.name = "";
    this.group = "";
    this.userid = "";
    this.named = false;
    this.registered = null;
    this.avatar = "lucas";
    this.challstr = "";
    this.loggingIn = null;
    this.initializing = true;
    this.gapiLoaded = false;
    this.nameRegExp = null;
  }
  setName(fullName, named, avatar) {
    const loggingIn = !this.named && named;
    const { name, group } = import_battle_text_parser.BattleTextParser.parseNameParts(fullName);
    this.name = name;
    this.group = group;
    this.userid = (0, import_battle_dex.toID)(name);
    this.named = named;
    this.avatar = avatar;
    this.update(null);
    if (loggingIn) {
      for (const roomid in PS.rooms) {
        const room = PS.rooms[roomid];
        if (room.connectWhenLoggedIn) room.connect();
      }
    }
    this.updateRegExp();
  }
  validateName(name) {
    name = name.replace(/[|,;]+/g, "");
    const replaceList = {
      "A": "\uFF21\u2C6F\u023A",
      "B": "\uFF22\u0182\u0181\u0243",
      "C": "\uFF23\uA73E\u023B",
      "D": "\uFF24\u0110\u018B\u018A\u0189\uA779",
      "E": "\uFF25\u0190\u018E",
      "F": "\uFF26\u0191\uA77B",
      "G": "\uFF27\uA7A0\uA77D\uA77E",
      "H": "\uFF28\u0126\u2C67\u2C75\uA78D",
      "I": "\uFF29\u0197",
      "J": "\uFF2A\u0248",
      "K": "\uFF2B\uA7A2",
      "L": "\uFF2C\uA746\uA780",
      "M": "\uFF2D\u2C6E\u019C",
      "N": "\uFF2E\u0220\u019D\uA790\uA7A4",
      "O": "\uFF2F\u01EA\u01EC\xD8\u01FE\u0186\u019F\uA74A\uA74C",
      "P": "\uFF30\u01A4\u2C63\uA750\uA752\uA754",
      "Q": "\uFF31\uA756\uA758\u024A",
      "R": "\uFF32\u024C\u2C64\uA75A\uA7A6\uA782",
      "S": "\uFF33\u1E9E\uA7A8\uA784",
      "T": "\uFF34\u0166\u01AC\u01AE\u023E\uA786",
      "U": "\uFF35\u0244",
      "V": "\uFF36\u01B2\uA75E\u0245",
      "W": "\uFF37\u2C72",
      "X": "\uFF38",
      "Y": "\uFF39\u024E\u1EFE",
      "Z": "\uFF3A\u01B5\u0224\u2C7F\u2C6B\uA762",
      "a": "\uFF41\u0105\u2C65\u0250",
      "b": "\uFF42\u0180\u0183\u0253",
      "c": "\uFF43\u023C\uA73F\u2184",
      "d": "\uFF44\u0111\u018C\u0256\u0257\uA77A",
      "e": "\uFF45\u0247\u025B\u01DD",
      "f": "\uFF46\u1E1F\u0192\uA77C",
      "g": "\uFF47\u0260\uA7A1\u1D79\uA77F",
      "h": "\uFF48\u0127\u2C68\u2C76\u0265",
      "i": "\uFF49\u0268\u0131",
      "j": "\uFF4A\u0249",
      "k": "\uFF4B\u0199\u2C6A\uA741\uA743\uA745\uA7A3",
      "l": "\uFF4C\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747",
      "m": "\uFF4D\u0271\u026F",
      "n": "\uFF4E\u019E\u0272\u0149\uA791\uA7A5",
      "o": "\uFF4F\u01EB\u01ED\xF8\u01FF\u0254\uA74B\uA74D\u0275",
      "p": "\uFF50\u01A5\u1D7D\uA751\uA753\uA755",
      "q": "\uFF51\u024B\uA757\uA759",
      "r": "\uFF52\u024D\u027D\uA75B\uA7A7\uA783",
      "s": "\uFF53\uA7A9\uA785\u1E9B",
      "t": "\uFF54\u0167\u01AD\u0288\u2C66\uA787",
      "u": "\uFF55\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u0173\u1E77\u1E75\u0289",
      "v": "\uFF56\u028B\uA75F\u028C",
      "w": "\uFF57\u2C73",
      "x": "\uFF58",
      "y": "\uFF59\u024F\u1EFF",
      "z": "\uFF5A\u01B6\u0225\u0240\u2C6C\uA763",
      "AA": "\uA732",
      "AE": "\xC6\u01FC\u01E2",
      "AO": "\uA734",
      "AU": "\uA736",
      "AV": "\uA738\uA73A",
      "AY": "\uA73C",
      "DZ": "\u01F1\u01C4",
      "Dz": "\u01F2\u01C5",
      "LJ": "\u01C7",
      "Lj": "\u01C8",
      "NJ": "\u01CA",
      "Nj": "\u01CB",
      "OI": "\u01A2",
      "OO": "\uA74E",
      "OU": "\u0222",
      "TZ": "\uA728",
      "VY": "\uA760",
      "aa": "\uA733",
      "ae": "\xE6\u01FD\u01E3",
      "ao": "\uA735",
      "au": "\uA737",
      "av": "\uA739\uA73B",
      "ay": "\uA73D",
      "dz": "\u01F3\u01C6",
      "hv": "\u0195",
      "lj": "\u01C9",
      "nj": "\u01CC",
      "oi": "\u01A3",
      "ou": "\u0223",
      "oo": "\uA74F",
      "ss": "\xDF",
      "tz": "\uA729",
      "vy": "\uA761"
    };
    const normalizeList = {
      "A": "\xC0\xC1\xC2\u1EA6\u1EA4\u1EAA\u1EA8\xC3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\xC4\u01DE\u1EA2\xC5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104",
      "B": "\u1E02\u1E04\u1E06",
      "C": "\u0106\u0108\u010A\u010C\xC7\u1E08\u0187",
      "D": "\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E",
      "E": "\xC8\xC9\xCA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\xCB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A",
      "F": "\u1E1E",
      "G": "\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193",
      "H": "\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A",
      "I": "\xCC\xCD\xCE\u0128\u012A\u012C\u0130\xCF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C",
      "J": "\u0134",
      "K": "\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744",
      "L": "\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748",
      "M": "\u1E3E\u1E40\u1E42",
      "N": "\u01F8\u0143\xD1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48",
      "O": "\xD2\xD3\xD4\u1ED2\u1ED0\u1ED6\u1ED4\xD5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\xD6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8",
      "P": "\u1E54\u1E56",
      "Q": "",
      "R": "\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E",
      "S": "\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E",
      "T": "\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E",
      "U": "\xD9\xDA\xDB\u0168\u1E78\u016A\u1E7A\u016C\xDC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74",
      "V": "\u1E7C\u1E7E",
      "W": "\u1E80\u1E82\u0174\u1E86\u1E84\u1E88",
      "X": "\u1E8A\u1E8C",
      "Y": "\u1EF2\xDD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3",
      "Z": "\u0179\u1E90\u017B\u017D\u1E92\u1E94",
      "a": "\u1E9A\xE0\xE1\xE2\u1EA7\u1EA5\u1EAB\u1EA9\xE3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\xE4\u01DF\u1EA3\xE5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01",
      "b": "\u1E03\u1E05\u1E07",
      "c": "\u0107\u0109\u010B\u010D\xE7\u1E09\u0188",
      "d": "\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F",
      "e": "\xE8\xE9\xEA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\xEB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B",
      "f": "",
      "g": "\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5",
      "h": "\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96",
      "i": "\xEC\xED\xEE\u0129\u012B\u012D\xEF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D",
      "j": "\u0135\u01F0",
      "k": "\u1E31\u01E9\u1E33\u0137\u1E35",
      "l": "\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B",
      "m": "\u1E3F\u1E41\u1E43",
      "n": "\u01F9\u0144\xF1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49",
      "o": "\xF2\xF3\xF4\u1ED3\u1ED1\u1ED7\u1ED5\xF5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\xF6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9",
      "p": "\u1E55\u1E57",
      "q": "",
      "r": "\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F",
      "s": "\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F",
      "t": "\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F",
      "u": "\xF9\xFA\xFB\u0169\u1E79\u016B\u1E7B\u016D\xFC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u1EE5\u1E73",
      "v": "\u1E7D\u1E7F",
      "w": "\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89",
      "x": "\u1E8B\u1E8D",
      "y": "\u1EF3\xFD\u0177\u1EF9\u0233\u1E8F\xFF\u1EF7\u1E99\u1EF5\u01B4",
      "z": "\u017A\u1E91\u017C\u017E\u1E93\u1E95"
    };
    const replaceRegexes = [];
    for (const i in replaceList) {
      replaceRegexes.push([new RegExp("[" + replaceList[i] + "]", "g"), i]);
    }
    const normalizeRegexes = [];
    for (const i in normalizeList) {
      normalizeRegexes.push([new RegExp("[" + normalizeList[i] + "]", "g"), i]);
    }
    for (const [regex, replacement] of replaceRegexes) {
      name = name.replace(regex, replacement);
    }
    for (const [regex, replacement] of normalizeRegexes) {
      name = name.replace(regex, replacement);
    }
    return name.trim();
  }
  changeName(name) {
    name = this.validateName(name);
    const userid = (0, import_battle_dex.toID)(name);
    if (!userid) {
      this.updateLogin({ name, error: "Usernames must contain at least one letter." });
      return;
    }
    if (userid === this.userid) {
      PS.send(`/trn ${name}`);
      this.update({ success: true });
      return;
    }
    this.loggingIn = name;
    this.update(null);
    import_client_connection.PSLoginServer.rawQuery(
      "getassertion",
      { userid, challstr: this.challstr }
    ).then((res) => {
      this.handleAssertion(name, res);
      this.updateRegExp();
    });
  }
  changeNameWithPassword(name, password, special = { needsPassword: true }) {
    this.loggingIn = name;
    if (!password && !special) {
      this.updateLogin({
        name,
        error: "Password can't be empty.",
        ...special
      });
    }
    this.update(null);
    import_client_connection.PSLoginServer.query(
      "login",
      { name, pass: password, challstr: this.challstr }
    ).then((data) => {
      this.loggingIn = null;
      if (data?.curuser?.loggedin) {
        const username = data.curuser.loggedin.username;
        this.registered = { name: username, userid: (0, import_battle_dex.toID)(username) };
        this.handleAssertion(name, data.assertion);
      } else {
        if (special.needsGoogle) {
          try {
            gapi.auth2.getAuthInstance().signOut();
          } catch {
          }
        }
        this.updateLogin({
          name,
          error: data?.error || "Wrong password.",
          ...special
        });
      }
    });
  }
  updateLogin(update) {
    this.update(update);
    if (!PS.rooms["login"]) {
      PS.join("login", { args: update });
    }
  }
  handleAssertion(name, assertion) {
    if (!assertion) {
      PS.alert("Error logging in.");
      return;
    }
    this.loggingIn = null;
    if (assertion.slice(0, 14).toLowerCase() === "<!doctype html") {
      const endIndex = assertion.indexOf(">");
      if (endIndex > 0) assertion = assertion.slice(endIndex + 1);
    }
    if (assertion.startsWith("\r")) assertion = assertion.slice(1);
    if (assertion.startsWith("\n")) assertion = assertion.slice(1);
    if (assertion.includes("<")) {
      PS.alert("Something is interfering with our connection to the login server. Most likely, your internet provider needs you to re-log-in, or your internet provider is blocking Pok\xE9mon Showdown.");
      return;
    }
    if (assertion === ";") {
      this.updateLogin({ name, needsPassword: true });
    } else if (assertion === ";;@gmail") {
      this.updateLogin({ name, needsGoogle: true });
    } else if (assertion.startsWith(";;")) {
      this.updateLogin({ error: assertion.slice(2) });
    } else if (assertion.includes("\n") || !assertion) {
      PS.alert("Something is interfering with our connection to the login server.");
    } else {
      PS.send(`/trn ${name},0,${assertion}`);
      this.update({ success: true });
    }
  }
  logOut() {
    import_client_connection.PSLoginServer.query(
      "logout",
      { userid: this.userid }
    );
    PS.send(`/logout`);
    PS.connection?.disconnect();
    PS.alert("You have been logged out and disconnected.\n\nIf you wanted to change your name while staying connected, use the 'Change Name' button or the '/nick' command.");
    this.name = "";
    this.group = "";
    this.userid = "";
    this.named = false;
    this.registered = null;
    this.update(null);
  }
  updateRegExp() {
    if (!this.named) {
      this.nameRegExp = null;
    } else {
      let escaped = this.name.replace(/[^A-Za-z0-9]+$/, "");
      for (let i = escaped.length - 1; i > 0; i--) {
        if (/[^ -~]/.test(escaped[i])) {
          escaped = escaped.slice(0, i) + "," + escaped.slice(i + 1);
        }
      }
      escaped = escaped.replace(/[[\]/{}()*+?.\\^$|-]/g, "\\$&");
      escaped = escaped.replace(/,/g, "[^A-Za-z0-9]?");
      this.nameRegExp = new RegExp("(?:\\b|(?!\\w))" + escaped + "(?:\\b|\\B(?!\\w))", "i");
    }
  }
}
class PSServer {
  constructor() {
    this.id = Config.defaultserver.id;
    this.host = Config.defaultserver.host;
    this.port = Config.defaultserver.port;
    this.httpport = Config.defaultserver.httpport;
    this.altport = Config.defaultserver.altport;
    this.registered = Config.defaultserver.registered;
    this.prefix = "/showdown";
    this.protocol = Config.defaultserver.httpport ? "https" : "http";
    this.groups = {
      "#": {
        name: "Room Owner (#)",
        type: "leadership",
        order: 101
      },
      "~": {
        name: "Administrator (~)",
        type: "leadership",
        order: 102
      },
      "&": {
        name: "Administrator (&)",
        type: "leadership",
        order: 103
      },
      "\u2605": {
        name: "Host (\u2605)",
        type: "staff",
        order: 104
      },
      "@": {
        name: "Moderator (@)",
        type: "staff",
        order: 105
      },
      "%": {
        name: "Driver (%)",
        type: "staff",
        order: 106
      },
      // by default, unrecognized ranks go here, between driver and bot
      "*": {
        name: "Bot (*)",
        order: 109
      },
      "\u2606": {
        name: "Player (\u2606)",
        order: 110
      },
      "+": {
        name: "Voice (+)",
        order: 200
      },
      " ": {
        order: 201
      },
      "!": {
        name: "Muted (!)",
        type: "punishment",
        order: 301
      },
      "\u2716": {
        name: "Namelocked (\u2716)",
        type: "punishment",
        order: 302
      },
      "\u203D": {
        name: "Locked (\u203D)",
        type: "punishment",
        order: 303
      }
    };
    this.defaultGroup = {
      order: 108
    };
  }
  getGroup(symbol) {
    return this.groups[(symbol || " ").charAt(0)] || this.defaultGroup;
  }
}
function makeLoadTracker() {
  let resolver;
  const tracker = new Promise((resolve) => {
    resolver = resolve;
  });
  tracker.loaded = () => {
    resolver();
  };
  return tracker;
}
class PSRoom extends import_client_core.PSStreamModel {
  constructor(options) {
    super();
    this.title = "";
    this.type = "";
    this.isPlaceholder = false;
    this.classType = "";
    this.location = "left";
    this.closable = true;
    /**
     * Whether the room is connected to the server. This is _eager_,
     * we set it to `true` when we send `/join`, not when the server
     * tells us we're connected. That's because it tracks whether we
     * still need to send `/join` or `/leave`.
     *
     * Only connected to server when `=== true`. String options mean
     * the room isn't connected to the game server but to something
     * else.
     *
     * `true` for DMs for historical reasons (TODO: fix)
     */
    this.connected = false;
    /**
     * Can this room even be connected to at all?
     * `true` = pass messages from the server to subscribers
     * `false` = throw an error if we receive messages from the server
     */
    this.canConnect = false;
    this.connectWhenLoggedIn = false;
    this.onParentEvent = null;
    this.width = 0;
    this.height = 0;
    /**
     * Preact means that the DOM state lags behind the app state. This means
     * rooms frequently have `display: none` at the time we want to focus them.
     * And popups sometimes initialize hidden, to calculate their position from
     * their width/height without flickering. But hidden HTML elements can't be
     * focused, so this is a note-to-self to focus the next time they can be.
     */
    this.focusNextUpdate = false;
    this.parentElem = null;
    this.parentRoomid = null;
    this.rightPopup = false;
    this.notifications = [];
    this.isSubtleNotifying = false;
    /** only affects mini-windows */
    this.minimized = false;
    this.globalClientCommands = this.parseClientCommands({
      "j,join"(target, cmd, elem) {
        target = PS.router.extractRoomID(target) || target;
        const roomid = /[^a-z0-9-]/.test(target) ? (0, import_battle_dex.toID)(target) : target;
        PS.join(roomid, { parentElem: elem });
      },
      "part,leave,close"(target, cmd, elem) {
        const roomid = (/[^a-z0-9-]/.test(target) ? (0, import_battle_dex.toID)(target) : target) || this.id;
        const room = PS.rooms[roomid];
        const battle = room?.battle;
        if (room?.type === "battle" && !battle.ended && battle.mySide.id === PS.user.userid) {
          PS.join("forfeitbattle", { parentElem: elem });
          return;
        }
        if (room?.type === "chat" && room.connected === true && PS.prefs.leavePopupRoom && !target) {
          PS.join("confirmleaveroom", { parentElem: elem });
          return;
        }
        PS.leave(roomid);
      },
      "closeand"(target) {
        this.send(target);
        PS.leave(this.id);
      },
      "receivepopup"(target) {
        PS.alert(target);
      },
      "inopener,inparent"(target) {
        let room = this.getParent();
        if (room && PS.isPopup(room)) room = room.getParent();
        room.send(target);
      },
      "maximize"(target) {
        const roomid = /[^a-z0-9-]/.test(target) ? (0, import_battle_dex.toID)(target) : target;
        const targetRoom = roomid ? PS.rooms[roomid] : this;
        if (!targetRoom) return this.errorReply(`Room '${roomid}' not found.`);
        if (PS.isNormalRoom(targetRoom)) {
          this.errorReply(`'${roomid}' is already maximized.`);
        } else if (!PS.isPopup(targetRoom)) {
          PS.moveRoom(targetRoom, "left", false, 0);
          PS.update();
        } else {
          this.errorReply(`'${roomid}' is a popup and can't be maximized.`);
        }
      },
      "logout"() {
        PS.user.logOut();
      },
      "reconnect"() {
        if (!PS.isOffline) {
          return this.add(`|error|You are already connected.`);
        }
        const uptime = Date.now() - PS.startTime;
        if (uptime > 24 * 60 * 60 * 1e3) {
          PS.confirm(`It's been over a day since you first connected. Please refresh.`, {
            okButton: "Refresh"
          }).then((confirmed) => {
            if (confirmed) this.send(`/refresh`);
          });
          return;
        }
        import_client_connection.PSConnection.connect();
      },
      "refresh"() {
        document.location.reload();
      },
      "workoffline"() {
        if (PS.isOffline) {
          return this.add(`|error|You are already offline.`);
        }
        PS.connection?.disconnect();
        this.add(`||You are now offline.`);
      },
      "connect"() {
        if (this.connected && this.connected !== "autoreconnect") {
          return this.errorReply(`You are already connected.`);
        }
        try {
          this.connect();
        } catch (err) {
          this.errorReply(err.message);
        }
      },
      "cancelsearch"() {
        if (PS.mainmenu.cancelSearch()) {
          this.add(`||Search cancelled.`, true);
        } else {
          this.errorReply(`You're not currently searching.`);
        }
      },
      "disallowspectators"(target) {
        PS.prefs.set("disallowspectators", target !== "off");
      },
      "star"(target) {
        const id = (0, import_battle_dex.toID)(target);
        if (!window.BattleFormats[id] && !/^gen[1-9]$/.test(id)) {
          this.errorReply(`Format ${id} does not exist`);
          return;
        }
        let starred = PS.prefs.starredformats || {};
        starred[id] = true;
        PS.prefs.set("starredformats", starred);
        this.add(`||Added format ${id} to favourites`);
        this.update(null);
      },
      "unstar"(target) {
        const id = (0, import_battle_dex.toID)(target);
        if (!window.BattleFormats[id] && !/^gen[1-9]$/.test(id)) {
          this.errorReply(`Format ${id} does not exist`);
          return;
        }
        let starred = PS.prefs.starredformats || {};
        if (!starred[id]) {
          this.errorReply(`${id} is not in your favourites!`);
          return;
        }
        delete starred[id];
        PS.prefs.set("starredformats", starred);
        this.add(`||Removed format ${id} from favourites`);
        this.update(null);
      },
      "nick"(target, cmd, element) {
        const noNameChange = PS.user.userid === (0, import_battle_dex.toID)(target);
        if (!noNameChange) PS.join("login", { parentElem: element });
        if (target) {
          PS.user.changeName(target);
        }
      },
      "avatar"(target) {
        target = target.toLowerCase();
        if (/[^a-z0-9-]/.test(target)) target = (0, import_battle_dex.toID)(target);
        const avatar = window.BattleAvatarNumbers?.[target] || target;
        PS.user.avatar = avatar;
        if (this.type !== "chat" && this.type !== "battle") {
          PS.send(`/avatar ${avatar}`);
        } else {
          this.sendDirect(`/avatar ${avatar}`);
        }
      },
      "open,user"(target) {
        let roomid = `user-${(0, import_battle_dex.toID)(target)}`;
        PS.join(roomid, {
          args: { username: target }
        });
      },
      "ignore"(target) {
        const ignore = PS.prefs.ignore || {};
        if (!target) return true;
        if ((0, import_battle_dex.toID)(target) === PS.user.userid) {
          this.add(`||You are not able to ignore yourself.`);
        } else if (ignore[(0, import_battle_dex.toID)(target)]) {
          this.add(`||User '${target}' is already on your ignore list. (Moderator messages will not be ignored.)`);
        } else {
          ignore[(0, import_battle_dex.toID)(target)] = 1;
          this.add(`||User '${target}' ignored. (Moderator messages will not be ignored.)`);
          PS.prefs.set("ignore", ignore);
        }
      },
      "unignore"(target) {
        const ignore = PS.prefs.ignore || {};
        if (!target) return false;
        if (!ignore[(0, import_battle_dex.toID)(target)]) {
          this.add(`||User '${target}' isn't on your ignore list.`);
        } else {
          ignore[(0, import_battle_dex.toID)(target)] = 0;
          this.add(`||User '${target}' no longer ignored.`);
          PS.prefs.set("ignore", ignore);
        }
      },
      "clearignore"(target) {
        if ((0, import_battle_dex.toID)(target) !== "confirm") {
          this.add("||Are you sure you want to clear your ignore list?");
          this.add("|html|If you're sure, use <code>/clearignore confirm</code>");
          return false;
        }
        let ignoreList = PS.prefs.ignore || {};
        if (!Object.keys(ignoreList).length) return this.add("You have no ignored users.");
        PS.prefs.set("ignore", null);
        this.add("||Your ignore list was cleared.");
      },
      "ignorelist"(target) {
        let ignoreList = Object.keys(PS.prefs.ignore || {});
        if (ignoreList.length === 0) {
          this.add("||You are currently not ignoring anyone.");
        } else {
          let ignoring = [];
          for (const key in PS.prefs.ignore) {
            if (PS.prefs.ignore[key] === 1) ignoring.push(key);
          }
          if (!ignoring.length) return this.add("||You are currently not ignoring anyone.");
          this.add(`||You are currently ignoring: ${ignoring.join(", ")}`);
        }
      },
      "showjoins"(target) {
        let showjoins = PS.prefs.showjoins || {};
        let serverShowjoins = showjoins[PS.server.id] || {};
        if (target) {
          let room = (0, import_battle_dex.toID)(target);
          if (serverShowjoins["global"]) {
            delete serverShowjoins[room];
          } else {
            serverShowjoins[room] = 1;
          }
          this.add(`||Join/leave messages in room ${room}: ALWAYS ON`);
        } else {
          serverShowjoins = { global: 1 };
          this.add(`||Join/leave messages: ALWAYS ON`);
        }
        showjoins[PS.server.id] = serverShowjoins;
        PS.prefs.set("showjoins", showjoins);
      },
      "hidejoins"(target) {
        let showjoins = PS.prefs.showjoins || {};
        let serverShowjoins = showjoins[PS.server.id] || {};
        if (target) {
          let room = (0, import_battle_dex.toID)(target);
          if (!serverShowjoins["global"]) {
            delete serverShowjoins[room];
          } else {
            serverShowjoins[room] = 0;
          }
          this.add(`||Join/leave messages on room ${room}: OFF`);
        } else {
          serverShowjoins = { global: 0 };
          this.add(`||Join/leave messages: OFF`);
        }
        showjoins[PS.server.id] = serverShowjoins;
        PS.prefs.set("showjoins", showjoins);
      },
      "showdebug"() {
        PS.prefs.set("showdebug", true);
        this.add("||Debug battle messages: ON");
        let onCSS = ".debug {display: block;}";
        let style = document.querySelector("style[id=debugstyle]");
        if (style) {
          style.innerHTML = onCSS;
        } else {
          style = document.createElement("style");
          style.id = "debugstyle";
          style.innerHTML = onCSS;
          document.querySelector("head")?.append(style);
        }
      },
      "hidedebug"() {
        PS.prefs.set("showdebug", true);
        this.add("||Debug battle messages: OFF");
        let onCSS = ".debug {display: none;}";
        let style = document.querySelector("style[id=debugstyle]");
        if (style) {
          style.innerHTML = onCSS;
        } else {
          style = document.createElement("style");
          style.id = "debugstyle";
          style.innerHTML = onCSS;
          document.querySelector("head")?.append(style);
        }
      },
      "showbattles"() {
        PS.prefs.set("showbattles", true);
        this.add("||Battle Messages: ON");
      },
      "hidebattles"() {
        PS.prefs.set("showbattles", false);
        this.add("||Battle Messages: HIDDEN");
      },
      "afd"(target) {
        if (!target) return this.send("/help afd");
        let mode = (0, import_battle_dex.toID)(target);
        if (mode === "sprites") {
          PS.prefs.set("afd", "sprites");
          PS.prefs.setAFD("sprites");
          this.add("||April Fools' Day mode set to SPRITES.");
        } else if (mode === "off") {
          PS.prefs.set("afd", null);
          PS.prefs.setAFD();
          this.add("||April Fools' Day mode set to OFF temporarily.");
          this.add("||Trying to turn it off permanently? Use /afd never");
        } else if (mode === "default") {
          PS.prefs.setAFD();
          PS.prefs.set("afd", null);
          this.add("||April Fools' Day mode set to DEFAULT (Currently " + (import_battle_dex.Dex.afdMode ? "FULL" : "OFF") + ").");
        } else if (mode === "full") {
          PS.prefs.set("afd", true);
          PS.prefs.setAFD(true);
          this.add("||April Fools' Day mode set to FULL.");
        } else if (target === "never") {
          PS.prefs.set("afd", false);
          PS.prefs.setAFD(false);
          this.add("||April Fools' Day mode set to NEVER.");
          if (Config.server?.afd) {
            this.add("||You're using the AFD URL, which will still override this setting and enable AFD mode on refresh.");
          }
        } else {
          if (target) this.add('||AFD option "' + target + '" not recognized');
          let curMode = PS.prefs.afd;
          if (curMode === true) curMode = "FULL";
          if (curMode === false) curMode = "NEVER";
          if (curMode) curMode = curMode.toUpperCase();
          if (!curMode) curMode = "DEFAULT (currently " + (import_battle_dex.Dex.afdMode ? "FULL" : "OFF") + ")";
          this.add("||AFD is currently set to " + mode);
          this.send("/help afd");
        }
        for (let roomid in PS.rooms) {
          let battle = PS.rooms[roomid] && PS.rooms[roomid].battle;
          if (!battle) continue;
          battle.resetToCurrentTurn();
        }
      },
      "clearpms"() {
        let rooms = PS.miniRoomList.filter((roomid) => roomid.startsWith("dm-"));
        if (!rooms.length) return this.add("||You do not have any PM windows open.");
        for (const roomid of rooms) {
          PS.leave(roomid);
        }
        this.add("||All PM windows cleared and closed.");
      },
      "unpackhidden"() {
        PS.prefs.set("nounlink", true);
        this.add("||Locked/banned users' chat messages: ON");
      },
      "packhidden"() {
        PS.prefs.set("nounlink", false);
        this.add("||Locked/banned users' chat messages: HIDDEN");
      },
      "hl,highlight"(target) {
        let highlights = PS.prefs.highlights || {};
        if (target.includes(" ")) {
          let targets = target.split(" ");
          let subCmd = targets[0];
          targets = targets.slice(1).join(" ").match(/([^,]+?({\d*,\d*})?)+/g);
          for (let i = 0, len = targets.length; i < len; i++) {
            targets[i] = targets[i].replace(/\n/g, "").trim();
          }
          switch (subCmd) {
            case "add":
            case "roomadd": {
              let key = subCmd === "roomadd" ? PS.server.id + "#" + this.id : "global";
              let highlightList = highlights[key] || [];
              for (let i = 0, len = targets.length; i < len; i++) {
                if (!targets[i]) continue;
                if (/[\\^$*+?()|{}[\]]/.test(targets[i])) {
                  try {
                    new RegExp(targets[i]);
                  } catch (e) {
                    return this.add(`|error|${e.message.substr(0, 28) === "Invalid regular expression: " ? e.message : "Invalid regular expression: /" + targets[i] + "/: " + e.message}`);
                  }
                }
                if (highlightList.includes(targets[i])) {
                  return this.add(`|error|${targets[i]} is already on your highlights list.`);
                }
              }
              highlights[key] = highlightList.concat(targets);
              this.add(`||Now highlighting on ${key === "global" ? "(everywhere): " : "(in " + key + "): "} ${highlights[key].join(", ")}`);
              import_panel_chat.ChatRoom.updateHighlightRegExp(highlights);
              break;
            }
            case "delete":
            case "roomdelete": {
              let key = subCmd === "roomdelete" ? PS.server.id + "#" + this.id : "global";
              let highlightList = highlights[key] || [];
              let newHls = [];
              for (let i = 0, len = highlightList.length; i < len; i++) {
                if (!targets.includes(highlightList[i])) {
                  newHls.push(highlightList[i]);
                }
              }
              highlights[key] = newHls;
              this.add(`||Now highlighting on ${key === "global" ? "(everywhere): " : "(in " + key + "): "} ${highlights[key].join(", ")}`);
              import_panel_chat.ChatRoom.updateHighlightRegExp(highlights);
              break;
            }
            default:
              this.errorReply("Invalid /highlight command.");
              this.handleSend("/help highlight");
              return;
          }
          PS.prefs.set("highlights", highlights);
        } else {
          if (["clear", "roomclear", "clearall"].includes(target)) {
            let key = target === "roomclear" ? PS.server.id + "#" + this.id : target === "clearall" ? "" : "global";
            if (key) {
              highlights[key] = [];
              this.add(`||All highlights (${key === "global" ? "everywhere" : "in " + key}) cleared.`);
              import_panel_chat.ChatRoom.updateHighlightRegExp(highlights);
            } else {
              PS.prefs.set("highlights", null);
              this.add("||All highlights (in all rooms and globally) cleared.");
              import_panel_chat.ChatRoom.updateHighlightRegExp({});
            }
          } else if (["show", "list", "roomshow", "roomlist"].includes(target)) {
            let key = target.startsWith("room") ? PS.server.id + "#" + this.id : "global";
            if (highlights[key] && highlights[key].length > 0) {
              this.add(`||Current highlight list ${key === "global" ? "(everywhere): " : "(in " + key + "): "}${highlights[key].join(", ")}`);
            } else {
              this.add(`||Your highlight list${key === "global" ? "" : " in " + key} is empty.`);
            }
          } else {
            this.errorReply("Invalid /highlight command.");
            this.handleSend("/help highlight");
          }
        }
      },
      "senddirect"(target) {
        this.sendDirect(target);
      },
      "h,help"(target) {
        switch ((0, import_battle_dex.toID)(target)) {
          case "chal":
          case "chall":
          case "challenge":
            this.add("||/challenge - Open a prompt to challenge a user to a battle.");
            this.add("||/challenge [user] - Challenge the user [user] to a battle.");
            this.add("||/challenge [user], [format] - Challenge the user [user] to a battle in the specified [format].");
            this.add("||/challenge [user], [format] @@@ [rules] - Challenge the user [user] to a battle with custom rules.");
            this.add("||[rules] can be a comma-separated list of: [added rule], ![removed rule], -[banned thing], *[restricted thing], +[unbanned/unrestricted thing]");
            this.add("||/battlerules - Detailed information on what can go in [rules].");
            return;
          case "accept":
            this.add("||/accept - Accept a challenge if only one is pending.");
            this.add("||/accept [user] - Accept a challenge from the specified user.");
            return;
          case "reject":
            this.add("||/reject - Reject a challenge if only one is pending.");
            this.add("||/reject [user] - Reject a challenge from the specified user.");
            return;
          case "user":
          case "open":
            this.add("||/user [user] - Open a popup containing the user [user]'s avatar, name, rank, and chatroom list.");
            return;
          case "news":
            this.add("||/news - Opens a popup containing the news.");
            return;
          case "ignore":
          case "unignore":
            this.add("||/ignore [user] - Ignore all messages from the user [user].");
            this.add("||/unignore [user] - Remove the user [user] from your ignore list.");
            this.add("||/ignorelist - List all the users that you currently ignore.");
            this.add("||/clearignore - Remove all users on your ignore list.");
            this.add("||Note that staff messages cannot be ignored.");
            return;
          case "nick":
            this.add("||/nick [new username] - Change your username.");
            return;
          case "clear":
            this.add("||/clear - Clear the room's chat log.");
            return;
          case "showdebug":
          case "hidedebug":
            this.add("||/showdebug - Receive debug messages from battle events.");
            this.add("||/hidedebug - Ignore debug messages from battle events.");
            return;
          case "showjoins":
          case "hidejoins":
            this.add("||/showjoins [room] - Receive users' join/leave messages. Optionally for only specified room.");
            this.add("||/hidejoins [room] - Ignore users' join/leave messages. Optionally for only specified room.");
            return;
          case "showbattles":
          case "hidebattles":
            this.add("||/showbattles - Receive links to new battles in Lobby.");
            this.add("||/hidebattles - Ignore links to new battles in Lobby.");
            return;
          case "unpackhidden":
          case "packhidden":
            this.add("||/unpackhidden - Suppress hiding locked or banned users' chat messages after the fact.");
            this.add("||/packhidden - Hide locked or banned users' chat messages after the fact.");
            this.add("||Hidden messages from a user can be restored by clicking the button underneath their lock/ban reason.");
            return;
          case "timestamps":
            this.add("||Set your timestamps preference:");
            this.add("||/timestamps [all|lobby|pms], [minutes|seconds|off]");
            this.add("||all - Change all timestamps preferences, lobby - Change only lobby chat preferences, pms - Change only PM preferences.");
            this.add("||off - Set timestamps off, minutes - Show timestamps of the form [hh:mm], seconds - Show timestamps of the form [hh:mm:ss].");
            return;
          case "highlight":
          case "hl":
            this.add("||Set up highlights:");
            this.add("||/highlight add [word 1], [word 2], [...] - Add the provided list of words to your highlight list.");
            this.add("||/highlight roomadd [word 1], [word 2], [...] - Add the provided list of words to the highlight list of whichever room you used the command in.");
            this.add("||/highlight list - List all words that currently highlight you.");
            this.add("||/highlight roomlist - List all words that currently highlight you in whichever room you used the command in.");
            this.add("||/highlight delete [word 1], [word 2], [...] - Delete the provided list of words from your entire highlight list.");
            this.add("||/highlight roomdelete [word 1], [word 2], [...] - Delete the provided list of words from the highlight list of whichever room you used the command in.");
            this.add("||/highlight clear - Clear your global highlight list.");
            this.add("||/highlight roomclear - Clear the highlight list of whichever room you used the command in.");
            this.add("||/highlight clearall - Clear your entire highlight list (all rooms and globally).");
            return;
          case "rank":
          case "ranking":
          case "rating":
          case "ladder":
            this.add("||/rating - Get your own rating.");
            this.add("||/rating [username] - Get user [username]'s rating.");
            return;
          case "afd":
            this.add("||/afd full - Enable all April Fools' Day jokes.");
            this.add("||/afd sprites - Enable April Fools' Day sprites.");
            this.add("||/afd default - Set April Fools' Day to default (full on April 1st, off otherwise).");
            this.add("||/afd off - Disable April Fools' Day jokes until the next refresh, and set /afd default.");
            this.add("||/afd never - Disable April Fools' Day jokes permanently.");
            return;
          default:
            return true;
        }
      },
      "autojoin,cmd,crq,query"() {
        this.errorReply(`This is a PS system command; do not use it.`);
      }
    });
    this.clientCommands = null;
    this.currentElement = null;
    this.id = options.id;
    this.title = options.title || this.title || this.id;
    if (options.type) this.type = options.type;
    if (options.location) this.location = options.location;
    if (options.parentElem) this.parentElem = options.parentElem;
    if (options.parentRoomid) this.parentRoomid = options.parentRoomid;
    if (this.location !== "popup" && this.location !== "semimodal-popup") this.parentElem = null;
    if (options.rightPopup) this.rightPopup = true;
    if (options.connected) this.connected = options.connected;
    if (options.backlog) this.backlog = options.backlog;
    this.noURL = options.noURL || false;
    this.args = options.args || null;
  }
  getParent() {
    if (this.parentRoomid) return PS.rooms[this.parentRoomid] || null;
    return null;
  }
  notify(options) {
    let desktopNotification = null;
    const roomIsFocused = document.hasFocus?.() && PS.isVisible(this);
    if (roomIsFocused && !options.noAutoDismiss) return;
    if (!roomIsFocused) {
      PS.playNotificationSound();
      try {
        desktopNotification = new Notification(options.title, { body: options.body });
        if (desktopNotification) {
          desktopNotification.onclick = () => {
            window.focus();
            PS.focusRoom(this.id);
          };
          if (PS.prefs.temporarynotifications) {
            setTimeout(() => {
              desktopNotification?.close();
            }, 5e3);
          }
        }
      } catch {
      }
    }
    if (options.noAutoDismiss && !options.id) {
      throw new Error(`Must specify id for manual dismissing`);
    }
    if (options.id) {
      this.notifications = this.notifications.filter((notification) => notification.id !== options.id);
    }
    this.notifications.push({
      title: options.title,
      body: options.body,
      id: options.id || "",
      noAutoDismiss: options.noAutoDismiss || false,
      notification: desktopNotification
    });
    PS.update();
  }
  subtleNotify() {
    if (PS.isVisible(this)) return;
    this.isSubtleNotifying = true;
    PS.update();
  }
  dismissNotification(id) {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      try {
        this.notifications[index].notification?.close();
      } catch {
      }
      this.notifications.splice(index, 1);
    }
    PS.update();
  }
  autoDismissNotifications() {
    let room = PS.rooms[this.id];
    if (room.lastMessageTime) {
      let lastMessageDates = PS.prefs.logtimes || {};
      if (!lastMessageDates[PS.server.id]) lastMessageDates[PS.server.id] = {};
      lastMessageDates[PS.server.id][room.id] = room.lastMessageTime || 0;
      PS.prefs.set("logtimes", lastMessageDates);
    }
    this.notifications = this.notifications.filter((notification) => notification.noAutoDismiss);
    this.isSubtleNotifying = false;
  }
  connect() {
    throw new Error(`This room is not designed to connect to a server room`);
  }
  /**
   * By default, a reconnected room will receive the init message as a bunch
   * of `receiveLine`s as normal. Before that happens, handleReconnect is
   * called, and you can return true to stop that behavior. You could also
   * prep for a bunch of `receiveLine`s and then not return anything.
   */
  handleReconnect(msg) {
  }
  receiveLine(args) {
    switch (args[0]) {
      case "title": {
        this.title = args[1];
        PS.update();
        break;
      }
      case "tempnotify": {
        const [, id, title, body, toHighlight] = args;
        this.notify({ title, body, id });
        break;
      }
      case "tempnotifyoff": {
        const [, id] = args;
        this.dismissNotification(id);
        break;
      }
      default: {
        if (this.canConnect) {
          this.update(args);
        } else {
          throw new Error(`This room is not designed to receive messages`);
        }
      }
    }
  }
  /**
   * Used only by commands; messages from the server go directly from
   * `PS.receive` to `room.receiveLine`
   */
  add(line, ifChat) {
    if (this.type !== "chat" && this.type !== "battle") {
      if (!ifChat) {
        PS.mainmenu.handlePM(PS.user.userid, PS.user.userid);
        PS.rooms["dm-"]?.receiveLine(import_battle_text_parser.BattleTextParser.parseLine(line));
      }
    } else {
      this.receiveLine(import_battle_text_parser.BattleTextParser.parseLine(line));
    }
  }
  errorReply(message, element = this.currentElement) {
    if (element?.tagName === "BUTTON") {
      PS.alert(message, { parentElem: element });
    } else {
      this.add(`|error|${message}`);
    }
  }
  parseClientCommands(commands) {
    const parsedCommands = {};
    for (const cmd in commands) {
      const names = cmd.split(",").map((name) => name.trim());
      for (const name of names) {
        if (name.includes(" ")) throw new Error(`Client command names cannot contain spaces: ${name}`);
        parsedCommands[name] = commands[cmd];
      }
    }
    return parsedCommands;
  }
  /**
   * Handles outgoing messages, like `/logout`. Return `true` to prevent
   * the line from being sent to servers.
   */
  handleSend(line, element = this.currentElement) {
    if (!line.startsWith("/") || line.startsWith("//")) return line;
    const spaceIndex = line.indexOf(" ");
    const cmd = spaceIndex >= 0 ? line.slice(1, spaceIndex) : line.slice(1);
    const target = spaceIndex >= 0 ? line.slice(spaceIndex + 1).trim() : "";
    const cmdHandler = this.globalClientCommands[cmd] || this.clientCommands?.[cmd];
    if (!cmdHandler) return line;
    const previousElement = this.currentElement;
    this.currentElement = element;
    const cmdResult = cmdHandler.call(this, target, cmd, element);
    this.currentElement = previousElement;
    if (cmdResult === true) return line;
    return cmdResult || null;
  }
  send(msg, element) {
    if (!msg) return;
    msg = this.handleSend(msg, element);
    if (!msg) return;
    this.sendDirect(msg);
  }
  sendDirect(msg) {
    PS.send(msg, this.id);
  }
  destroy() {
    if (this.connected === true) {
      this.sendDirect(`/noreply /leave ${this.id}`);
      this.connected = false;
    }
  }
}
class PlaceholderRoom extends PSRoom {
  constructor(options) {
    super(options);
    this.classType = "placeholder";
    this.isPlaceholder = true;
  }
  receiveLine(args) {
    (this.backlog ||= []).push(args);
  }
}
const PS = new class extends import_client_core.PSModel {
  constructor() {
    super();
    this.down = false;
    this.prefs = new PSPrefs();
    this.teams = new PSTeams();
    this.user = new PSUser();
    this.server = new PSServer();
    this.connection = null;
    this.connected = false;
    /**
     * While PS is technically disconnected while it's trying to connect,
     * it still shows UI like it's connected, so you can click buttons
     * before the server connection is established.
     *
     * `isOffline` is only set if PS is neither connected nor trying to
     * connect.
     */
    this.isOffline = false;
    this.startTime = Date.now();
    this.router = null;
    this.rooms = {};
    this.roomTypes = {};
    /**
     * If a route starts with `*`, it's a cached room location for the room placeholder.
     * Otherwise, it's a RoomType ID.
     *
     * Routes are filled in by `PS.updateRoomTypes()` and do not need to be manually
     * filled.
     */
    this.routes = Object.assign(/* @__PURE__ */ Object.create(null), {
      // locations cached here because it needs to be guessed before roomTypes is filled in
      // this cache is optional, but prevents some flickering during loading
      // to update:
      // console.log('\t\t' + JSON.stringify(Object.fromEntries(Object.entries(PS.routes).filter(([k, v]) => k !== 'dm-*').map(([k, v]) => [k, '*' + (PS.roomTypes[v].location || '')]))).replaceAll(',', ',\n\t\t').replaceAll('":"', '": "').slice(1, -1) + ',')
      "teambuilder": "*",
      "news": "*mini-window",
      "": "*",
      "rooms": "*right",
      "user-*": "*popup",
      "viewuser-*": "*popup",
      "volume": "*popup",
      "options": "*popup",
      "*": "*right",
      "battle-*": "*",
      "battles": "*right",
      "teamdropdown": "*semimodal-popup",
      "formatdropdown": "*semimodal-popup",
      "team-*": "*",
      "ladder": "*",
      "ladder-*": "*",
      "view-*": "*",
      "login": "*semimodal-popup"
    });
    /** List of rooms on the left side of the top tabbar */
    this.leftRoomList = [];
    /** List of rooms on the right side of the top tabbar */
    this.rightRoomList = [];
    /** List of mini-rooms in the Main Menu */
    this.miniRoomList = [];
    /** Currently active popups, in stack order (bottom to top) */
    this.popups = [];
    /**
     * The currently focused room. Should always be the topmost popup
     * if it exists. If no popups are open, it should be
     * `PS.panel`.
     *
     * Determines which room receives keyboard shortcuts.
     *
     * Clicking inside a panel will focus it, in two-panel mode.
     */
    this.room = null;
    /**
     * The currently active panel. Should always be either `PS.leftPanel`
     * or `PS.leftPanel`. If no popups are open, should be `PS.room`.
     *
     * In one-panel mode, determines whether the left or right panel is
     * visible. Otherwise, it just tracks which panel will be in focus
     * after all popups are closed.
     */
    this.panel = null;
    /**
     * Currently active left room.
     *
     * In two-panel mode, this will be the visible left panel.
     *
     * In one-panel mode, this is the visible room only if it is
     * `PS.panel`. Still tracked when not visible, so we know which
     * panels to display if PS is resized to two-panel mode.
     */
    this.leftPanel = null;
    /**
     * Currently active right room.
     *
     * In two-panel mode, this will be the visible right panel.
     *
     * In one-panel mode, this is the visible room only if it is
     * `PS.panel`. Still tracked when not visible, so we know which
     * panels to display if PS is resized to two-panel mode.
     */
    this.rightPanel = null;
    /**
     * * 0 = only one panel visible
     * * null = vertical nav layout
     * n.b. PS will only update if the left room width changes. Resizes
     * that don't change the left room width will not trigger an update.
     */
    this.leftPanelWidth = 0;
    this.mainmenu = null;
    /**
     * The drag-and-drop API is incredibly dumb and doesn't let us know
     * what's being dragged until the `drop` event, so we track it here.
     *
     * Note that `PS.dragging` will be null if the drag was initiated
     * outside PS (e.g. dragging a team from File Explorer to PS), and
     * for security reasons it's impossible to know what they are until
     * they're dropped.
     */
    this.dragging = null;
    this.lastMessageTime = "";
    /** Tracks whether or not to display the "Use arrow keys" hint */
    this.arrowKeysUsed = false;
    this.newsHTML = document.querySelector("#room-news .readable-bg")?.innerHTML || "";
    this.libsLoaded = makeLoadTracker();
    this.mainmenu = this.addRoom({
      id: "",
      title: "Home"
    });
    this.addRoom({
      id: "rooms",
      title: "Rooms"
    }, true);
    this.rightPanel = this.rooms["rooms"];
    if (this.newsHTML) {
      this.addRoom({
        id: "news",
        title: "News"
      }, true);
    }
    let autojoin = this.prefs.autojoin;
    if (autojoin) {
      if (typeof autojoin === "string") {
        autojoin = { showdown: autojoin };
      }
      let rooms = autojoin[this.server.id] || "";
      for (let title of rooms.split(",")) {
        this.addRoom({ id: (0, import_battle_dex.toID)(title), title, connected: true }, true);
      }
    }
    if (window.webkitNotification) {
      window.Notification ||= window.webkitNotification;
    }
    this.updateLayout();
    window.addEventListener("resize", () => {
      if (this.updateLayout()) super.update();
    });
  }
  // Panel layout
  ///////////////
  /**
   * "minWidth" and "maxWidth" are a bit deceptive here - to be clear,
   * all PS rooms are expected to responsively support any width from
   * 320px up, when in single panel mode. These metrics are used purely
   * to calculate the location of the separator in two-panel mode.
   *
   * - `minWidth` - minimum width as a right-panel
   * - `width` - preferred width, minimum width as a left-panel
   * - `maxWidth` - maximum width as a left-panel
   *
   * PS will only show two panels if it can fit `width` in the left, and
   * `minWidth` in the right. Extra space will be given to to right panel
   * until it reaches `width`, then evenly distributed until both panels
   * reach `maxWidth`, and extra space above that will be given to the
   * right panel.
   */
  getWidthFor(room) {
    switch (room.type) {
      case "mainmenu":
        return {
          minWidth: 340,
          width: 628,
          maxWidth: 628,
          isMainMenu: true
        };
      case "chat":
      case "rooms":
      case "battles":
        return {
          minWidth: 320,
          width: 570,
          maxWidth: 640
        };
      case "team":
        return {
          minWidth: 660,
          width: 660,
          maxWidth: 660
        };
      case "battle":
        return {
          minWidth: 320,
          width: 956,
          maxWidth: 1180
        };
    }
    return {
      minWidth: 640,
      width: 640,
      maxWidth: 640
    };
  }
  /** @returns changed */
  updateLayout() {
    const leftPanelWidth = this.calculateLeftPanelWidth();
    const totalWidth = document.body.offsetWidth;
    const totalHeight = document.body.offsetHeight;
    const roomHeight = totalHeight - 56;
    if (leftPanelWidth === null) {
      this.panel.width = totalWidth - 200;
      this.panel.height = totalHeight;
    } else if (leftPanelWidth) {
      this.leftPanel.width = leftPanelWidth;
      this.leftPanel.height = roomHeight;
      this.rightPanel.width = totalWidth + 1 - leftPanelWidth;
      this.rightPanel.height = roomHeight;
    } else {
      this.panel.width = totalWidth;
      this.panel.height = roomHeight;
    }
    if (this.leftPanelWidth !== leftPanelWidth) {
      this.leftPanelWidth = leftPanelWidth;
      return true;
    }
    return false;
  }
  getRoom(elem, skipClickable) {
    let curElem = elem;
    if (curElem?.name === "closeRoom" && curElem.value) {
      return PS.rooms[curElem.value] || null;
    }
    while (curElem) {
      if (curElem.id.startsWith("room-")) {
        return PS.rooms[curElem.id.slice(5)] || null;
      }
      if (curElem.getAttribute("data-roomid")) {
        return PS.rooms[curElem.getAttribute("data-roomid")] || null;
      }
      if (skipClickable && (curElem.tagName === "A" || curElem.tagName === "BUTTON" || curElem.tagName === "INPUT" || curElem.tagName === "SELECT" || curElem.tagName === "TEXTAREA" || curElem.tagName === "LABEL" || curElem.classList?.contains("textbox") || curElem.classList?.contains("username"))) {
        return null;
      }
      curElem = curElem.parentElement;
    }
    return null;
  }
  dragOnto(fromRoom, toLocation, toIndex) {
    if (fromRoom.id === "" || fromRoom.id === "rooms") return;
    const onHome = toLocation === "left" && toIndex === 0;
    PS.moveRoom(fromRoom, toLocation, onHome, toIndex);
    PS.update();
  }
  update() {
    this.updateLayout();
    super.update();
  }
  receive(msg) {
    msg = msg.endsWith("\n") ? msg.slice(0, -1) : msg;
    let roomid = "";
    if (msg.startsWith(">")) {
      const nlIndex = msg.indexOf("\n");
      roomid = msg.slice(1, nlIndex);
      msg = msg.slice(nlIndex + 1);
    }
    const roomid2 = roomid || "lobby";
    let room = PS.rooms[roomid];
    console.log("\u2705 " + (roomid ? "[" + roomid + "] " : "") + "%c" + msg, "color: #007700");
    let isInit = false;
    for (const line of msg.split("\n")) {
      const args = import_battle_text_parser.BattleTextParser.parseLine(line);
      switch (args[0]) {
        case "init": {
          isInit = true;
          room = PS.rooms[roomid2];
          const [, type] = args;
          if (!room) {
            room = this.addRoom({
              id: roomid2,
              type,
              connected: true
            }, roomid === "staff" || roomid === "upperstaff");
          } else {
            room.type = type;
            this.updateRoomTypes();
          }
          if (room) {
            if (room.connected === "autoreconnect") {
              room.connected = true;
              if (room.handleReconnect(msg)) return;
            }
            room.connected = true;
          }
          this.updateAutojoin();
          this.update();
          continue;
        }
        case "deinit": {
          room = PS.rooms[roomid2];
          if (room) {
            room.connected = false;
            this.removeRoom(room);
          }
          this.updateAutojoin();
          this.update();
          continue;
        }
        case "noinit": {
          room = PS.rooms[roomid2];
          if (room) {
            room.connected = false;
            if (args[1] === "namerequired") {
              room.connectWhenLoggedIn = true;
              if (!PS.user.initializing) {
                room.receiveLine(["error", args[2]]);
              }
            } else if (args[1] === "nonexistent") {
              if (room.type === "chat" || room.type === "battle") room.receiveLine(args);
            } else if (args[1] === "rename") {
              room.connected = true;
              room.title = args[3] || room.title;
              this.renameRoom(room, args[2]);
            }
          }
          this.update();
          continue;
        }
      }
      room?.receiveLine(args);
    }
    room?.update(isInit ? [`initdone`] : null);
  }
  send(msg, roomid) {
    const bracketRoomid = roomid ? `[${roomid}] ` : "";
    console.log(`\u25B6\uFE0F ${bracketRoomid}%c${msg}`, "color: #776677");
    if (!this.connection) {
      PS.alert(`You are not connected and cannot send ${msg}.`);
      return;
    }
    this.connection.send(`${roomid || ""}|${msg}`);
  }
  isVisible(room) {
    if (!this.leftPanelWidth) {
      return room === this.panel || room === this.room;
    } else {
      return room === this.rightPanel || room === this.leftPanel || room === this.room;
    }
  }
  calculateLeftPanelWidth() {
    const available = document.body.offsetWidth;
    if (document.documentElement.clientWidth < 800 || this.prefs.onepanel === "vertical") {
      return null;
    }
    if (!this.leftPanel || !this.rightPanel || this.prefs.onepanel) {
      return 0;
    }
    const left = this.getWidthFor(this.leftPanel);
    const right = this.getWidthFor(this.rightPanel);
    let excess = available - (left.width + right.width);
    if (excess >= 0) {
      const leftStretch = left.maxWidth - left.width;
      if (!leftStretch) return left.width;
      const rightStretch = right.maxWidth - right.width;
      if (leftStretch + rightStretch >= excess) return left.maxWidth;
      return left.width + Math.floor(excess * leftStretch / (leftStretch + rightStretch));
    }
    if (left.isMainMenu) {
      if (available >= left.minWidth + right.width) {
        return left.minWidth;
      }
      return 0;
    }
    if (available >= left.width + right.minWidth) {
      return left.width;
    }
    return 0;
  }
  createRoom(options) {
    options.location ||= this.getRouteLocation(options.id);
    options.type ||= this.getRoute(options.id) || "";
    const RoomType = this.roomTypes[options.type];
    options.noURL ??= RoomType?.noURL;
    if (RoomType?.title) options.title = RoomType.title;
    const Model = RoomType ? RoomType.Model || PSRoom : PlaceholderRoom;
    return new Model(options);
  }
  getRouteInfo(roomid) {
    if (this.routes[roomid]) return this.routes[roomid];
    const hyphenIndex = roomid.indexOf("-");
    if (hyphenIndex < 0) return this.routes["*"] || null;
    roomid = roomid.slice(0, hyphenIndex) + "-*";
    if (this.routes[roomid]) return this.routes[roomid];
    return null;
  }
  getRouteLocation(roomid) {
    if (roomid.startsWith("dm-")) {
      if (document.documentElement.clientWidth <= 818) {
        return "left";
      }
      return "mini-window";
    }
    const routeInfo = this.getRouteInfo(roomid);
    if (!routeInfo) return "left";
    if (routeInfo.startsWith("*")) return routeInfo.slice(1);
    return PS.roomTypes[routeInfo].location || "left";
  }
  getRoute(roomid) {
    const routeInfo = this.getRouteInfo(roomid);
    return routeInfo?.startsWith("*") ? null : routeInfo || null;
  }
  addRoomType(...types) {
    for (const RoomType of types) {
      this.roomTypes[RoomType.id] = RoomType;
      for (const route of RoomType.routes) {
        this.routes[route] = RoomType.id;
      }
    }
    this.updateRoomTypes();
  }
  updateRoomTypes() {
    let updated = false;
    for (const roomid in this.rooms) {
      const room = this.rooms[roomid];
      const typeIsGuessed = room.type === this.routes["*"] && !roomid.includes("-");
      if (!room.isPlaceholder && !typeIsGuessed) continue;
      let type = !typeIsGuessed && room.type || this.getRoute(roomid) || room.type || "";
      if (!room.isPlaceholder && type === room.type) continue;
      const RoomType = type && this.roomTypes[type];
      if (!RoomType) continue;
      const options = room;
      if (RoomType.title) options.title = RoomType.title;
      options.type = type;
      const Model = RoomType.Model || PSRoom;
      const newRoom = new Model(options);
      this.rooms[roomid] = newRoom;
      if (this.leftPanel === room) this.leftPanel = newRoom;
      if (this.rightPanel === room) this.rightPanel = newRoom;
      if (this.panel === room) this.panel = newRoom;
      if (roomid === "") this.mainmenu = newRoom;
      if (this.room === room) {
        this.room = newRoom;
        newRoom.focusNextUpdate = true;
      }
      updated = true;
    }
    if (updated) this.update();
  }
  setFocus(room) {
    room.onParentEvent?.("focus");
  }
  focusRoom(roomid) {
    const room = this.rooms[roomid];
    if (!room) return false;
    if (this.room === room) {
      this.setFocus(room);
      return true;
    }
    this.closePopupsAbove(room, true);
    if (!this.isVisible(room)) {
      room.focusNextUpdate = true;
    }
    if (PS.isNormalRoom(room)) {
      if (room.location === "right") {
        this.rightPanel = room;
      } else {
        this.leftPanel = room;
      }
      this.panel = this.room = room;
    } else {
      if (room.location === "mini-window") {
        this.leftPanel = this.panel = PS.mainmenu;
      }
      this.room = room;
    }
    this.room.autoDismissNotifications();
    this.update();
    this.setFocus(room);
    return true;
  }
  horizontalNav(room = this.room) {
    if (this.leftPanelWidth === null) {
      return { rooms: [], index: -1 };
    }
    const rooms = this.leftRoomList.concat(this.rightRoomList);
    const miniRoom = this.miniRoomList[0] !== "news" ? this.miniRoomList[0] : null;
    if (miniRoom) rooms.splice(1, 0, miniRoom);
    const roomid = room.location === "mini-window" && miniRoom || room.id;
    const index = rooms.indexOf(roomid);
    return { rooms, index };
  }
  verticalNav(room = this.room) {
    if (this.leftPanelWidth === null) {
      const rooms2 = ["", ...this.miniRoomList, ...this.leftRoomList.slice(1), ...this.rightRoomList];
      const index2 = rooms2.indexOf(room.id);
      return { rooms: rooms2, index: index2 };
    }
    if (room.location !== "mini-window") {
      return { rooms: [], index: -1 };
    }
    const rooms = this.miniRoomList;
    const index = rooms.indexOf(room.id);
    return { rooms, index };
  }
  focusLeftRoom() {
    const { rooms, index } = this.horizontalNav();
    if (index === -1) return;
    if (index === 0) {
      return this.focusRoom(rooms[rooms.length - 1]);
    }
    return this.focusRoom(rooms[index - 1]);
  }
  focusRightRoom() {
    const { rooms, index } = this.horizontalNav();
    if (index === -1) return;
    if (index === rooms.length - 1) {
      return this.focusRoom(rooms[0]);
    }
    return this.focusRoom(rooms[index + 1]);
  }
  focusUpRoom() {
    const { rooms, index } = this.verticalNav();
    if (index === -1) return;
    if (index === 0) {
      return this.focusRoom(rooms[rooms.length - 1]);
    }
    return this.focusRoom(rooms[index - 1]);
  }
  focusDownRoom() {
    const { rooms, index } = this.verticalNav();
    if (index === -1) return;
    if (index === rooms.length - 1) {
      return this.focusRoom(rooms[0]);
    }
    return this.focusRoom(rooms[index + 1]);
  }
  alert(message, opts = {}) {
    this.join(`popup-${this.popups.length}`, {
      args: { message, ...opts, parentElem: null },
      parentElem: opts.parentElem
    });
  }
  confirm(message, opts = {}) {
    opts.cancelButton ??= "Cancel";
    return new Promise((resolve) => {
      this.join(`popup-${this.popups.length}`, {
        args: { message, okValue: true, cancelValue: false, callback: resolve, ...opts }
      });
    });
  }
  prompt(message, defaultValue = "", opts = {}) {
    opts.cancelButton ??= "Cancel";
    return new Promise((resolve) => {
      this.join(`popup-${this.popups.length}`, {
        args: { message, value: defaultValue, okValue: true, cancelValue: false, callback: resolve, ...opts, parentElem: null },
        parentElem: opts.parentElem
      });
    });
  }
  getPMRoom(userid) {
    const myUserid = PS.user.userid;
    const roomid = `dm-${[userid, myUserid].sort().join("-")}`;
    if (this.rooms[roomid]) return this.rooms[roomid];
    this.join(roomid);
    return this.rooms[roomid];
  }
  /**
   * Low-level add room. You usually want `join`.
   */
  addRoom(options, noFocus = false) {
    if (options.id.startsWith("challenge-")) {
      this.requestNotifications();
      options.id = `dm-${options.id.slice(10)}`;
      options.args = { challengeMenuOpen: true };
    }
    if (options.id.startsWith("dm-")) {
      this.requestNotifications();
      if (options.id.length >= 5 && options.id.endsWith("--")) {
        options.id = options.id.slice(0, -2);
        options.args = { initialSlash: true };
      }
    }
    if (options.id.startsWith("battle-") && PS.prefs.rightpanelbattles) options.location = "right";
    options.parentRoomid ??= this.getRoom(options.parentElem)?.id;
    const parentRoom = options.parentRoomid ? this.rooms[options.parentRoomid] : null;
    let preexistingRoom = this.rooms[options.id];
    if (preexistingRoom && this.isPopup(preexistingRoom)) {
      const sameOpener = preexistingRoom.parentElem === options.parentElem;
      this.closePopupsAbove(parentRoom, true);
      if (sameOpener) return;
      preexistingRoom = this.rooms[options.id];
    }
    if (preexistingRoom) {
      if (!noFocus) {
        if (options.args?.challengeMenuOpen) {
          preexistingRoom.openChallenge();
        }
        this.focusRoom(preexistingRoom.id);
      }
      return preexistingRoom;
    }
    if (!noFocus) {
      let parentPopup = parentRoom;
      if (options.parentElem?.name === "closeRoom") {
        parentPopup = PS.rooms["roomtablist"] || parentPopup;
      }
      this.closePopupsAbove(parentPopup, true);
    }
    const room = this.createRoom(options);
    this.rooms[room.id] = room;
    const location = room.location;
    room.location = null;
    this.moveRoom(room, location, noFocus);
    if (options.backlog) {
      for (const args of options.backlog) {
        room.receiveLine(args);
      }
    }
    if (!noFocus) room.focusNextUpdate = true;
    return room;
  }
  hideRightRoom() {
    if (PS.rightPanel) {
      if (PS.panel === PS.rightPanel) PS.panel = PS.leftPanel;
      if (PS.room === PS.rightPanel) PS.room = PS.leftPanel;
      PS.rightPanel = null;
      PS.update();
      PS.focusRoom(PS.leftPanel.id);
    }
  }
  roomVisible(room) {
    if (PS.isNormalRoom(room)) {
      return !this.leftPanelWidth ? room === this.panel : room === this.leftPanel || room === this.rightPanel;
    }
    if (room.location === "mini-window") {
      return !this.leftPanelWidth ? this.mainmenu === this.panel : this.mainmenu === this.leftPanel;
    }
    return true;
  }
  renameRoom(room, id) {
    if (this.rooms[id]) this.removeRoom(this.rooms[id]);
    const oldid = room.id;
    room.id = id;
    this.rooms[id] = room;
    delete this.rooms[oldid];
    const popupIndex = this.popups.indexOf(oldid);
    if (popupIndex >= 0) this.popups[popupIndex] = id;
    const leftRoomIndex = this.leftRoomList.indexOf(oldid);
    if (leftRoomIndex >= 0) this.leftRoomList[leftRoomIndex] = id;
    const rightRoomIndex = this.rightRoomList.indexOf(oldid);
    if (rightRoomIndex >= 0) this.rightRoomList[rightRoomIndex] = id;
    const miniRoomIndex = this.miniRoomList.indexOf(oldid);
    if (miniRoomIndex >= 0) this.miniRoomList[miniRoomIndex] = id;
    this.update();
  }
  isPopup(room) {
    if (!room) return false;
    return room.location === "popup" || room.location === "semimodal-popup" || room.location === "modal-popup";
  }
  isNormalRoom(room) {
    if (!room) return false;
    return room.location === "left" || room.location === "right";
  }
  moveRoom(room, location, background, index) {
    if (room.location === location && index === void 0) {
      if (background === true) {
        if (room === this.leftPanel) {
          this.leftPanel = this.mainmenu;
          this.panel = this.mainmenu;
        } else if (room === this.rightPanel) {
          this.rightPanel = this.rooms["rooms"] || null;
          this.panel = this.rightPanel || this.leftPanel;
        }
      } else if (background === false) {
        this.focusRoom(room.id);
      }
      return;
    }
    const POPUPS = ["popup", "semimodal-popup", "modal-popup"];
    if (this.isPopup(room) && POPUPS.includes(location)) {
      room.location = location;
      return;
    }
    background ??= !this.roomVisible(room);
    if (room.location === "mini-window") {
      const miniRoomIndex = this.miniRoomList.indexOf(room.id);
      if (miniRoomIndex >= 0) {
        this.miniRoomList.splice(miniRoomIndex, 1);
      }
      if (this.room === room) this.room = this.panel;
    } else if (POPUPS.includes(room.location)) {
      const popupIndex = this.popups.indexOf(room.id);
      if (popupIndex >= 0) {
        this.popups.splice(popupIndex, 1);
      }
      if (this.room === room) this.room = this.panel;
    } else if (room.location === "left") {
      const leftRoomIndex = this.leftRoomList.indexOf(room.id);
      if (leftRoomIndex >= 0) {
        this.leftRoomList.splice(leftRoomIndex, 1);
      }
      if (this.room === room) this.room = this.mainmenu;
      if (this.panel === room) this.panel = this.mainmenu;
      if (this.leftPanel === room) this.leftPanel = this.mainmenu;
    } else if (room.location === "right") {
      const rightRoomIndex = this.rightRoomList.indexOf(room.id);
      if (rightRoomIndex >= 0) {
        this.rightRoomList.splice(rightRoomIndex, 1);
      }
      if (this.room === room) this.room = this.rooms["rooms"] || this.leftPanel;
      if (this.panel === room) this.panel = this.rooms["rooms"] || this.leftPanel;
      if (this.rightPanel === room) this.rightPanel = this.rooms["rooms"] || null;
    }
    room.location = location;
    switch (location) {
      case "left":
        this.leftRoomList.splice(Math.max(index ?? Infinity, 1), 0, room.id);
        break;
      case "right":
        this.rightRoomList.splice(Math.min(index ?? -1, this.rightRoomList.length - 1), 0, room.id);
        break;
      case "mini-window":
        this.miniRoomList.splice(index ?? 0, 0, room.id);
        break;
      case "popup":
      case "semimodal-popup":
      case "modal-popup":
        this.popups.push(room.id);
        this.room = room;
        break;
      default:
        throw new Error(`Invalid room location: ${location}`);
    }
    if (!background) {
      if (location === "left") this.leftPanel = this.panel = room;
      if (location === "right") this.rightPanel = this.panel = room;
      if (location === "mini-window") this.leftPanel = this.panel = this.mainmenu;
      this.room = room;
    }
  }
  removeRoom(room) {
    const wasFocused = this.room === room;
    room.destroy();
    delete PS.rooms[room.id];
    const leftRoomIndex = PS.leftRoomList.indexOf(room.id);
    if (leftRoomIndex >= 0) {
      PS.leftRoomList.splice(leftRoomIndex, 1);
    }
    if (PS.leftPanel === room) {
      PS.leftPanel = this.mainmenu;
      if (PS.panel === room) PS.panel = this.mainmenu;
      if (PS.room === room) PS.room = this.mainmenu;
    }
    const rightRoomIndex = PS.rightRoomList.indexOf(room.id);
    if (rightRoomIndex >= 0) {
      PS.rightRoomList.splice(rightRoomIndex, 1);
    }
    if (PS.rightPanel === room) {
      let newRightRoomid = PS.rightRoomList[rightRoomIndex] || PS.rightRoomList[rightRoomIndex - 1];
      PS.rightPanel = newRightRoomid ? PS.rooms[newRightRoomid] : null;
      if (PS.panel === room) PS.panel = PS.rightPanel || PS.leftPanel;
      if (PS.room === room) PS.room = PS.panel;
    }
    if (room.location === "mini-window") {
      const miniRoomIndex = PS.miniRoomList.indexOf(room.id);
      if (miniRoomIndex >= 0) {
        PS.miniRoomList.splice(miniRoomIndex, 1);
      }
      if (PS.room === room) {
        PS.room = PS.rooms[PS.miniRoomList[miniRoomIndex]] || PS.rooms[PS.miniRoomList[miniRoomIndex - 1]] || PS.mainmenu;
      }
    }
    if (this.popups.length && room.id === this.popups[this.popups.length - 1]) {
      this.popups.pop();
      PS.room = this.popups.length ? PS.rooms[this.popups[this.popups.length - 1]] : PS.rooms[room.parentRoomid ?? PS.panel.id] || PS.panel;
    }
    if (wasFocused) {
      this.room.focusNextUpdate = true;
    }
  }
  /** do NOT use this in a while loop: see `closePopupsUntil */
  closePopup(skipUpdate) {
    if (!this.popups.length) return;
    this.leave(this.popups[this.popups.length - 1]);
    if (!skipUpdate) this.update();
  }
  closeAllPopups(skipUpdate) {
    this.closePopupsAbove(null, skipUpdate);
  }
  closePopupsAbove(room, skipUpdate) {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      if (room && this.popups[i] === room.id) break;
      this.removeRoom(PS.rooms[this.popups[i]]);
    }
    if (!skipUpdate) this.update();
  }
  /** Focus a room, creating it if it doesn't already exist. */
  join(roomid, options) {
    if (PS.rooms[roomid] && !PS.isPopup(PS.rooms[roomid])) {
      if (this.room.id === roomid) return;
      this.focusRoom(roomid);
      return;
    }
    this.addRoom({ id: roomid, ...options });
    this.update();
  }
  leave(roomid) {
    if (!roomid || roomid === "rooms") return;
    const room = PS.rooms[roomid];
    if (room) {
      this.removeRoom(room);
      this.update();
    }
  }
  updateAutojoin() {
    if (!PS.server.registered) return;
    let autojoins = [];
    let autojoinCount = 0;
    let rooms = this.rightRoomList;
    for (let roomid of rooms) {
      let room = PS.rooms[roomid];
      if (!room) return;
      if (room.type !== "chat" || room.pmTarget) continue;
      autojoins.push(room.id.includes("-") ? room.id : room.title || room.id);
      if (room.id === "staff" || room.id === "upperstaff" || PS.server.id !== "showdown" && room.id === "lobby") continue;
      autojoinCount++;
      if (autojoinCount >= 15) break;
    }
    const thisAutojoin = autojoins.join(",") || null;
    let autojoin = this.prefs.autojoin || null;
    if (this.server.id === "showdown" && typeof autojoin !== "object") {
      if (autojoin === thisAutojoin) return;
      this.prefs.set("autojoin", thisAutojoin || null);
    } else {
      autojoin = typeof autojoin === "string" ? { showdown: autojoin } : autojoin || {};
      if (autojoin[this.server.id] === thisAutojoin) return;
      autojoin[this.server.id] = thisAutojoin || "";
      this.prefs.set("autojoin", autojoin);
    }
  }
  requestNotifications() {
    try {
      if (window.webkitNotifications?.requestPermission) {
        window.webkitNotifications.requestPermission();
      } else if (window.Notification) {
        Notification.requestPermission?.((permission) => {
        });
      }
    } catch {
    }
  }
  playNotificationSound() {
    if (window.BattleSound && !this.prefs.mute) {
      window.BattleSound.playSound("audio/notification.wav", this.prefs.notifvolume);
    }
  }
}();
//# sourceMappingURL=client-main.js.map
