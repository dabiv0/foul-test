"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var panel_teambuilder_team_exports = {};
module.exports = __toCommonJS(panel_teambuilder_team_exports);
var import_client_main = require("./client-main");
var import_panels = require("./panels");
var import_battle_dex = require("./battle-dex");
var import_battle_log = require("./battle-log");
var import_battle_team_editor = require("./battle-team-editor");
var import_client_connection = require("./client-connection");
var import_battle_teams = require("./battle-teams");
var import_panel_chat = require("./panel-chat");
/**
 * Teambuilder team panel
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
class TeamRoom extends import_client_main.PSRoom {
  constructor(options) {
    super(options);
    this.forceReload = false;
    this.clientCommands = this.parseClientCommands({
      "validate"(target) {
        if (this.team.format.length <= 4) {
          return this.errorReply(`You must select a format first.`);
        }
        this.send(`/utm ${this.team.packedTeam}`);
        this.send(`/vtm ${this.team.format}`);
      }
    });
    const team = import_client_main.PS.teams.byKey[this.id.slice(5)] || null;
    this.team = team;
    this.title = `[Team] ${this.team?.name || "Error"}`;
    if (team) this.setFormat(team.format);
    this.load();
  }
  setFormat(format) {
    const team = this.team;
    team.format = (0, import_battle_dex.toID)(format);
  }
  load() {
    import_client_main.PS.teams.loadTeam(this.team, true)?.then(() => {
      const team = this.team;
      if (team.uploadedPackedTeam && team.uploadedPackedTeam !== team.packedTeam) {
        if (this.stripNicknames(team.packedTeam) === team.uploadedPackedTeam) {
          team.uploadedPackedTeam = team.packedTeam;
        }
      }
      this.update(null);
    });
  }
  upload(isPrivate) {
    const team = this.team;
    const cmd = team.uploaded ? "update" : "save";
    const buf = [];
    if (team.uploaded) {
      buf.push(team.uploaded.teamid);
    } else if (team.teamid) {
      return import_client_main.PS.alert(`This team is for a different account. Please log into the correct account to update it.`);
    }
    buf.push(team.name, team.format, isPrivate ? 1 : 0);
    const exported = team.packedTeam;
    if (!exported) return import_client_main.PS.alert(`Add a Pokemon to your team before uploading it.`);
    buf.push(exported);
    import_client_main.PS.teams.uploading = team;
    import_client_main.PS.send(`/teams ${cmd} ${buf.join(", ")}`);
    team.uploadedPackedTeam = exported;
    this.update(null);
  }
  stripNicknames(packedTeam) {
    const team = import_battle_teams.Teams.unpack(packedTeam);
    for (const pokemon of team) {
      pokemon.name = "";
    }
    return import_battle_teams.Teams.pack(team);
  }
  save() {
    import_client_main.PS.teams.save();
    const title = `[Team] ${this.team?.name || "Team"}`;
    if (title !== this.title) {
      this.title = title;
      import_client_main.PS.update();
    }
  }
}
class TeamPanel extends import_panels.PSRoomPanel {
  constructor(props) {
    super(props);
    this.handleRename = (ev) => {
      const textbox = ev.currentTarget;
      const room = this.props.room;
      room.team.name = textbox.value.trim();
      room.save();
    };
    this.uploadTeam = (ev) => {
      const room = this.props.room;
      room.upload(room.team.uploaded ? !!room.team.uploaded.private : import_client_main.PS.prefs.uploadprivacy);
    };
    this.restore = (ev) => {
      const room = this.props.room;
      const team = room.team;
      if (!team.uploadedPackedTeam) {
        import_client_main.PS.alert(`Must use on an uploaded team.`);
        return;
      }
      team.packedTeam = team.uploadedPackedTeam;
      room.forceReload = true;
      room.save();
      this.forceUpdate();
    };
    this.compare = (ev) => {
      const team = this.props.room.team;
      if (!team.uploadedPackedTeam) {
        import_client_main.PS.alert(`Must use on an uploaded team.`);
        return;
      }
      const uploadedTeam = import_battle_teams.Teams.export(import_battle_teams.Teams.unpack(team.uploadedPackedTeam));
      const localTeam = import_battle_teams.Teams.export(import_battle_teams.Teams.unpack(team.packedTeam));
      import_client_main.PS.alert(import_battle_log.BattleLog.html`|html|<table class="table" style="width:100%;font-size:14px"><tr><th>Local</th><th>Uploaded</th></tr><tr><td>${localTeam}</td><td>${uploadedTeam}</td></tr></table>`, { width: 720 });
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
    this.changePrivacyPref = (ev) => {
      import_client_main.PS.prefs.uploadprivacy = !ev.currentTarget.checked;
      import_client_main.PS.prefs.save();
      this.forceUpdate();
    };
    this.handleChangeFormat = (ev) => {
      const dropdown = ev.currentTarget;
      const room = this.props.room;
      room.setFormat(dropdown.value);
      room.save();
      this.forceUpdate();
      TeamPanel.getFormatResources(room.team.format).then(() => {
        this.forceUpdate();
      });
    };
    this.save = () => {
      this.props.room.save();
      this.forceUpdate();
    };
    const room = this.props.room;
    if (room.team) {
      TeamPanel.getFormatResources(room.team.format).then(() => {
        this.forceUpdate();
      });
    }
  }
  static {
    this.id = "team";
  }
  static {
    this.routes = ["team-*"];
  }
  static {
    this.Model = TeamRoom;
  }
  static {
    this.title = "Team";
  }
  static {
    this.formatResources = {};
  }
  static getFormatResources(format) {
    if (format in this.formatResources) return Promise.resolve(this.formatResources[format]);
    return (0, import_client_connection.Net)("https://www.smogon.com/dex/api/formats/by-ps-name/" + format).get().then((result) => {
      this.formatResources[format] = JSON.parse(result);
      return this.formatResources[format];
    }).catch((err) => {
      this.formatResources[format] = null;
      return this.formatResources[format];
    });
  }
  renderResources() {
    const { room } = this.props;
    const team = room.team;
    const info = TeamPanel.formatResources[team.format];
    const formatName = import_battle_log.BattleLog.formatName(team.format);
    return info && (info.resources.length || info.url) ? /* @__PURE__ */ Chat.h("details", { class: "details", open: true }, /* @__PURE__ */ Chat.h("summary", null, /* @__PURE__ */ Chat.h("strong", null, "Teambuilding resources for ", formatName)), /* @__PURE__ */ Chat.h("div", { style: "margin-left:5px" }, /* @__PURE__ */ Chat.h("ul", null, info.resources.map((resource) => /* @__PURE__ */ Chat.h("li", null, /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("a", { href: resource.url, target: "_blank" }, resource.resource_name))))), /* @__PURE__ */ Chat.h("p", null, "Find ", info.resources.length ? "more " : "", "helpful resources for ", formatName, " on ", /* @__PURE__ */ Chat.h("a", { href: info.url, target: "_blank" }, "the Smogon Dex"), "."))) : null;
  }
  componentDidUpdate() {
    const room = this.props.room;
    room.load();
  }
  render() {
    const { room } = this.props;
    const team = room.team;
    if (!team || room.forceReload) {
      if (room.forceReload) {
        room.forceReload = false;
        room.update(null);
      }
      return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room }, /* @__PURE__ */ Chat.h("a", { class: "button", href: "teambuilder", "data-target": "replace" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-chevron-left", "aria-hidden": true }), " List"), /* @__PURE__ */ Chat.h("p", { class: "error" }, "Team doesn't exist"));
    }
    const unsaved = team.uploaded && team.uploadedPackedTeam ? team.uploadedPackedTeam !== team.packedTeam : false;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, scrollable: true }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("a", { class: "button", href: "teambuilder", "data-target": "replace" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-chevron-left", "aria-hidden": true }), " Teams"), " ", team.uploaded ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("button", { class: `button${unsaved ? " button-first" : ""}`, "data-href": `teamstorage-${team.key}` }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-globe" }), " Account ", team.uploaded.private ? "" : "(public)"), unsaved && /* @__PURE__ */ Chat.h("button", { class: "button button-last", onClick: this.uploadTeam }, /* @__PURE__ */ Chat.h("strong", null, "Upload changes"))) : team.teamid ? /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": `teamstorage-${team.key}` }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-plug" }), " Disconnected (wrong account?)") : /* @__PURE__ */ Chat.h("button", { class: "button", "data-href": `teamstorage-${team.key}` }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-laptop" }), " Local"), /* @__PURE__ */ Chat.h("div", { style: "float:right" }, /* @__PURE__ */ Chat.h(
      "button",
      {
        name: "format",
        value: team.format,
        "data-selecttype": "teambuilder",
        class: "button",
        "data-href": "/formatdropdown",
        onChange: this.handleChangeFormat
      },
      /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-o" }),
      " ",
      import_battle_log.BattleLog.formatName(team.format),
      " ",
      team.format.length <= 4 && /* @__PURE__ */ Chat.h("em", null, "(uncategorized)"),
      " ",
      /* @__PURE__ */ Chat.h("i", { class: "fa fa-caret-down" })
    )), /* @__PURE__ */ Chat.h("label", { class: "label teamname" }, "Team name:", /* @__PURE__ */ Chat.h(
      "input",
      {
        class: "textbox",
        type: "text",
        value: team.name,
        onInput: this.handleRename,
        onChange: this.handleRename,
        onKeyUp: this.handleRename
      }
    )), /* @__PURE__ */ Chat.h(
      import_battle_team_editor.TeamEditor,
      {
        team,
        onChange: this.save,
        readOnly: !!team.teamid && !team.uploadedPackedTeam,
        resources: this.renderResources()
      },
      !!(team.packedTeam && team.format.length > 4) && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { "data-cmd": "/validate", class: "button" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-check" }), " Validate")),
      !!(team.packedTeam || team.uploaded) && /* @__PURE__ */ Chat.h("p", { class: "infobox", style: "padding: 5px 8px" }, team.uploadedPackedTeam && !team.uploaded ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, "Uploading...") : team.uploaded ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("small", null, "Share URL:"), " ", /* @__PURE__ */ Chat.h(
        import_panel_chat.CopyableURLBox,
        {
          url: `https://psim.us/t/${team.uploaded.teamid}${team.uploaded.private ? "-" + team.uploaded.private : ""}`
        }
      ), " ", unsaved && /* @__PURE__ */ Chat.h("div", { style: "padding-top:5px" }, /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.uploadTeam }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-upload" }), " ", /* @__PURE__ */ Chat.h("strong", null, "Upload changes")), " ", /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.restore }, "Revert to uploaded version"), " ", /* @__PURE__ */ Chat.h("button", { class: "button", onClick: this.compare }, "Compare"))) : !team.teamid ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("label", { class: "checkbox inline" }, /* @__PURE__ */ Chat.h(
        "input",
        {
          name: "teamprivacy",
          checked: !import_client_main.PS.prefs.uploadprivacy,
          type: "checkbox",
          onChange: this.changePrivacyPref
        }
      ), " Public"), /* @__PURE__ */ Chat.h("button", { class: "button exportbutton", onClick: this.uploadTeam }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-upload" }), " Upload for", import_client_main.PS.prefs.uploadprivacy ? " shareable URL" : " shareable/searchable URL")) : /* @__PURE__ */ Chat.h(Chat.Fragment, null, "This is a disconnected team. This could be because you uploaded it on a different account, or because you deleted or un-uploaded it on a different computer. For safety, you can't edit this team. You can, however, delete it, or make a copy (which will be editable)."))
    )));
  }
}
class ViewTeamPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.teamData = null;
  }
  static {
    this.id = "viewteam";
  }
  static {
    this.routes = ["viewteam-*"];
  }
  static {
    this.Model = TeamRoom;
  }
  static {
    this.title = "Loading...";
  }
  componentDidMount() {
    super.componentDidMount();
    const roomid = this.props.room.id;
    const [teamid, password] = roomid.slice(9).split("-");
    import_client_connection.PSLoginServer.query("getteam", {
      teamid,
      password,
      full: true
    }).then((untypedData) => {
      const data = untypedData;
      if (!data) {
        this.team = null;
        return;
      }
      this.team = {
        name: data.title,
        format: data.format,
        folder: "",
        packedTeam: data.team,
        iconCache: null,
        key: "",
        isBox: false,
        teamid: parseInt(teamid)
      };
      for (const localTeam of import_client_main.PS.teams.list) {
        if (localTeam.teamid === this.team.teamid) {
          this.team.key = localTeam.key;
          break;
        }
      }
      this.props.room.title = `[Team] ${this.team.name || "Untitled team"}`;
      this.teamData = data;
      import_client_main.PS.update();
    });
  }
  render() {
    const { room } = this.props;
    const team = this.team;
    const teamData = this.teamData;
    if (!team) {
      return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room }, team === null ? /* @__PURE__ */ Chat.h("p", { class: "error" }, "Team doesn't exist") : /* @__PURE__ */ Chat.h("p", null, "Loading..."));
    }
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, scrollable: true }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("h1", null, team.name || "Untitled team"), /* @__PURE__ */ Chat.h(
      import_panel_chat.CopyableURLBox,
      {
        url: `https://psim.us/t/${team.teamid}${teamData.private ? "-" + teamData.private : ""}`
      }
    ), " ", /* @__PURE__ */ Chat.h("p", null, "Uploaded by: ", /* @__PURE__ */ Chat.h("strong", null, teamData.ownerid)), /* @__PURE__ */ Chat.h("p", null, "Format: ", /* @__PURE__ */ Chat.h("strong", null, teamData.format)), /* @__PURE__ */ Chat.h("p", null, "Views: ", /* @__PURE__ */ Chat.h("strong", null, teamData.views)), team.key && /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("a", { class: "button", href: `team-${team.key}` }, "Edit")), /* @__PURE__ */ Chat.h(import_battle_team_editor.TeamEditor, { team, readOnly: true })));
  }
}
class TeamStoragePanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.chooseOption = (ev) => {
      const storage = ev.currentTarget.value;
      const room = this.props.room;
      const team = this.team();
      if (storage === "local" && team.uploaded) {
        import_client_main.PS.send(`/teams delete ${team.uploaded.teamid}`);
        team.uploaded = void 0;
        team.teamid = void 0;
        team.uploadedPackedTeam = void 0;
        import_client_main.PS.teams.save();
        room.getParent().update(null);
      } else if (storage === "public" && team.uploaded?.private) {
        import_client_main.PS.send(`/teams setprivacy ${team.uploaded.teamid},no`);
      } else if (storage === "account" && team.uploaded?.private === null) {
        import_client_main.PS.send(`/teams setprivacy ${team.uploaded.teamid},yes`);
      } else if (storage === "public" && !team.teamid) {
        room.getParent().upload(false);
      } else if (storage === "account" && !team.teamid) {
        room.getParent().upload(true);
      }
      ev.stopImmediatePropagation();
      ev.preventDefault();
      this.close();
    };
  }
  static {
    this.id = "teamstorage";
  }
  static {
    this.routes = ["teamstorage-*"];
  }
  static {
    this.location = "semimodal-popup";
  }
  static {
    this.noURL = true;
  }
  team() {
    const teamKey = this.props.room.id.slice(12);
    const team = import_client_main.PS.teams.byKey[teamKey];
    return team;
  }
  render() {
    const room = this.props.room;
    const team = this.team();
    const storage = team.uploaded?.private ? "account" : team.uploaded ? "public" : team.teamid ? "disconnected" : "local";
    if (storage === "disconnected") {
      return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 280 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("button", { class: "option cur", "data-cmd": "/close" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-plug" }), " ", /* @__PURE__ */ Chat.h("strong", null, "Disconnected"), /* @__PURE__ */ Chat.h("br", null), "Not found in the Teams database. Maybe you uploaded it on a different account?"))));
    }
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room, width: 280 }, /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("button", { class: `option${storage === "local" ? " cur" : ""}`, onClick: this.chooseOption, value: "local" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-laptop" }), " ", /* @__PURE__ */ Chat.h("strong", null, "Local"), /* @__PURE__ */ Chat.h("br", null), "Stored in cookies on your computer. Warning: Your browser might delete these. Make sure to use backups.")), /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("button", { class: `option${storage === "account" ? " cur" : ""}`, onClick: this.chooseOption, value: "account" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-cloud" }), " ", /* @__PURE__ */ Chat.h("strong", null, "Account"), /* @__PURE__ */ Chat.h("br", null), "Uploaded to the Teams database. You can share with the URL.")), /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("button", { class: `option${storage === "public" ? " cur" : ""}`, onClick: this.chooseOption, value: "public" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-globe" }), " ", /* @__PURE__ */ Chat.h("strong", null, "Account (public)"), /* @__PURE__ */ Chat.h("br", null), "Uploaded to the Teams database publicly. Share with the URL or people can find it by searching."))));
  }
}
import_client_main.PS.addRoomType(TeamPanel, TeamStoragePanel, ViewTeamPanel);
//# sourceMappingURL=panel-teambuilder-team.js.map
