"use strict";
var import_client_main = require("./client-main");
var import_panels = require("./panels");
var import_panel_teamdropdown = require("./panel-teamdropdown");
var import_battle_dex = require("./battle-dex");
var import_battle_teams = require("./battle-teams");
/**
 * Teambuilder panel
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
class TeambuilderRoom extends import_client_main.PSRoom {
  constructor() {
    super(...arguments);
    this.DEFAULT_FORMAT = `gen${import_battle_dex.Dex.gen}`;
    /**
     * - `""` - all
     * - `"gen[NUMBER][ID]"` - format folder
     * - `"gen[NUMBER]"` - uncategorized gen folder
     * - `"[ID]/"` - folder
     * - `"/"` - not in folder
     */
    this.curFolder = "";
    this.curFolderKeep = "";
    this.clientCommands = this.parseClientCommands({
      "newteam"(target) {
        const isBox = ` ${target} `.includes(" box ");
        if (` ${target} `.includes(" bottom ")) {
          import_client_main.PS.teams.push(this.createTeam(null, isBox));
        } else {
          import_client_main.PS.teams.unshift(this.createTeam(null, isBox));
        }
        this.update(null);
      },
      "deleteteam"(target) {
        const team = import_client_main.PS.teams.byKey[target];
        if (team) import_client_main.PS.teams.delete(team);
        this.update(null);
      },
      "undeleteteam"() {
        import_client_main.PS.teams.undelete();
        this.update(null);
      }
    });
  }
  sendDirect(msg) {
    import_client_main.PS.alert(`Unrecognized command: ${msg}`);
  }
  createTeam(copyFrom, isBox = false) {
    if (copyFrom) {
      return {
        name: `Copy of ${copyFrom.name}`,
        format: copyFrom.format,
        folder: copyFrom.folder,
        packedTeam: copyFrom.packedTeam,
        iconCache: null,
        isBox: copyFrom.isBox,
        key: ""
      };
    } else {
      const format = this.curFolder && !this.curFolder.endsWith("/") ? this.curFolder : this.DEFAULT_FORMAT;
      const folder = this.curFolder.endsWith("/") ? this.curFolder.slice(0, -1) : "";
      return {
        name: `${isBox ? "Box" : "Untitled"} ${import_client_main.PS.teams.list.length + 1}`,
        format,
        folder,
        packedTeam: "",
        iconCache: null,
        isBox,
        key: ""
      };
    }
  }
}
class TeambuilderPanel extends import_panels.PSRoomPanel {
  constructor() {
    super(...arguments);
    this.selectFolder = (e) => {
      const room = this.props.room;
      let elem = e.target;
      let folder = null;
      while (elem) {
        if (elem.getAttribute("data-href")) {
          return;
        }
        if (elem.className === "selectFolder") {
          folder = elem.getAttribute("data-value") || "";
          break;
        }
        if (elem.className === "folderlist") {
          return;
        }
        elem = elem.parentElement;
      }
      if (folder === null) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (folder === "++") {
        import_client_main.PS.prompt("Folder name?", "", { parentElem: elem, okButton: "Create" }).then((name) => {
          if (!name) return;
          room.curFolderKeep = `${name}/`;
          room.curFolder = `${name}/`;
          this.forceUpdate();
        });
        return;
      }
      room.curFolder = folder;
      this.forceUpdate();
    };
    this.addFormatFolder = (ev) => {
      const room = this.props.room;
      const button = ev.currentTarget;
      const folder = (0, import_battle_dex.toID)(button.value);
      room.curFolderKeep = folder;
      room.curFolder = folder;
      button.value = "";
      this.forceUpdate();
    };
    this.dragEnterTeam = (ev) => {
      const draggedTeam = this.getDraggedTeam(ev);
      if (draggedTeam === null) return;
      const value = ev.currentTarget?.getAttribute("data-teamkey");
      const team = value ? import_client_main.PS.teams.byKey[value] : null;
      if (!team || team === draggedTeam) return;
      const iOver = import_client_main.PS.teams.list.indexOf(team);
      if (typeof draggedTeam === "number") {
        if (iOver >= draggedTeam) import_client_main.PS.dragging.team = iOver + 1;
        import_client_main.PS.dragging.team = iOver;
        this.forceUpdate();
        return;
      }
      const iDragged = import_client_main.PS.teams.list.indexOf(draggedTeam);
      if (iDragged < 0 || iOver < 0) return;
      import_client_main.PS.teams.list.splice(iDragged, 1);
      import_client_main.PS.teams.list.splice(iOver, 0, draggedTeam);
      this.forceUpdate();
    };
    this.dragEnterFolder = (ev) => {
      const value = ev.currentTarget?.getAttribute("data-value") || null;
      if (value === null || import_client_main.PS.dragging?.type !== "team") return;
      if (value === "++" || value === "") return;
      import_client_main.PS.dragging.folder = value;
      this.forceUpdate();
    };
    this.dragLeaveFolder = (ev) => {
      const value = ev.currentTarget?.getAttribute("data-value") || null;
      if (value === null || import_client_main.PS.dragging?.type !== "team") return;
      if (value === "++" || value === "") return;
      if (import_client_main.PS.dragging.folder === value) import_client_main.PS.dragging.folder = null;
      this.forceUpdate();
    };
    this.dropFolder = (ev) => {
      const value = ev.currentTarget?.getAttribute("data-value") || null;
      if (value === null || import_client_main.PS.dragging?.type !== "team") return;
      if (value === "++" || value === "") return;
      import_client_main.PS.dragging.folder = null;
      let team = import_client_main.PS.dragging.team;
      if (typeof team === "number") {
        return this.addDraggedTeam(ev, value);
      }
      if (value.endsWith("/")) {
        team.folder = value.slice(0, -1);
      } else {
        team.format = value;
      }
      import_client_main.PS.teams.save();
      ev.stopImmediatePropagation();
      this.forceUpdate();
    };
    this.dropPanel = (ev) => {
      if (import_client_main.PS.dragging?.type !== "team") return;
      let team = import_client_main.PS.dragging.team;
      if (typeof team === "number") {
        return this.addDraggedTeam(ev, this.props.room.curFolder);
      }
    };
  }
  static {
    this.id = "teambuilder";
  }
  static {
    this.routes = ["teambuilder"];
  }
  static {
    this.Model = TeambuilderRoom;
  }
  static {
    this.icon = /* @__PURE__ */ Chat.h("i", { class: "fa fa-pencil-square-o", "aria-hidden": true });
  }
  static {
    this.title = "Teambuilder";
  }
  /** undefined: not dragging, null: dragging a new team */
  getDraggedTeam(ev) {
    if (import_client_main.PS.dragging?.type === "team") return import_client_main.PS.dragging.team;
    const dataTransfer = ev.dataTransfer;
    if (!dataTransfer) return null;
    import_client_main.PS.dragging = { type: "?" };
    console.log(`dragging: ${dataTransfer.types} | ${[...dataTransfer.files]?.map((file) => file.name)}`);
    if (!dataTransfer.types.includes?.("Files")) return null;
    if (dataTransfer.files[0] && !dataTransfer.files[0].name.endsWith(".txt")) return null;
    import_client_main.PS.dragging = {
      type: "team",
      team: 0,
      folder: null
    };
    return import_client_main.PS.dragging.team;
  }
  extractDraggedTeam(ev) {
    const file = ev.dataTransfer?.files?.[0];
    if (!file) return Promise.resolve(null);
    let name = file.name;
    if (name.slice(-4).toLowerCase() !== ".txt") {
      import_client_main.PS.alert(`Your file "${file.name}" is not a valid team. Team files are ".txt" files.`);
      return Promise.resolve(null);
    }
    name = name.slice(0, -4);
    return file.text?.()?.then((result) => {
      let sets;
      try {
        sets = import_panel_teamdropdown.PSTeambuilder.importTeam(result);
      } catch {
        import_client_main.PS.alert(`Your file "${file.name}" is not a valid team.`);
        return null;
      }
      let format = "";
      const bracketIndex = name.indexOf("]");
      let isBox = false;
      if (bracketIndex >= 0) {
        format = name.slice(1, bracketIndex);
        if (!format.startsWith("gen")) format = "gen6" + format;
        if (format.endsWith("-box")) {
          format = format.slice(0, -4);
          isBox = true;
        }
        name = $.trim(name.substr(bracketIndex + 1));
      }
      return {
        name,
        format,
        folder: "",
        packedTeam: import_battle_teams.Teams.pack(sets),
        iconCache: null,
        key: "",
        isBox
      };
    });
  }
  addDraggedTeam(ev, folder) {
    let index = import_client_main.PS.dragging?.team;
    if (typeof index !== "number") index = 0;
    this.extractDraggedTeam(ev).then((team) => {
      if (!team) {
        return;
      }
      if (folder?.endsWith("/")) {
        team.folder = folder.slice(0, -1);
      } else if (folder) {
        team.format = folder;
      }
      import_client_main.PS.teams.push(team);
      import_client_main.PS.teams.list.pop();
      import_client_main.PS.teams.list.splice(index, 0, team);
      import_client_main.PS.teams.save();
      this.forceUpdate();
    });
  }
  renderFolder(value) {
    const { room } = this.props;
    const cur = room.curFolder === value;
    let children;
    const folderOpenIcon = cur ? "fa-folder-open" : "fa-folder";
    if (value.endsWith("/")) {
      children = [
        /* @__PURE__ */ Chat.h("i", { class: `fa ${folderOpenIcon}${value === "/" ? "-o" : ""}` }),
        value.slice(0, -1) || "(uncategorized)"
      ];
    } else if (value === "") {
      children = [
        /* @__PURE__ */ Chat.h("em", null, "(all)")
      ];
    } else if (value === "++") {
      children = [
        /* @__PURE__ */ Chat.h("i", { class: "fa fa-plus", "aria-hidden": true }),
        /* @__PURE__ */ Chat.h("em", null, "(add folder)")
      ];
    } else {
      children = [
        /* @__PURE__ */ Chat.h("i", { class: `fa ${folderOpenIcon}-o` }),
        value.slice(4) || "(uncategorized)"
      ];
    }
    const active = import_client_main.PS.dragging?.folder === value ? " active" : "";
    if (cur) {
      return /* @__PURE__ */ Chat.h(
        "div",
        {
          class: "folder cur",
          "data-value": value,
          onDragEnter: this.dragEnterFolder,
          onDragLeave: this.dragLeaveFolder,
          onDrop: this.dropFolder
        },
        /* @__PURE__ */ Chat.h("div", { class: "folderhack3" }, /* @__PURE__ */ Chat.h("div", { class: "folderhack1" }), /* @__PURE__ */ Chat.h("div", { class: "folderhack2" }), /* @__PURE__ */ Chat.h("button", { class: `selectFolder${active}`, "data-value": value }, children))
      );
    }
    return /* @__PURE__ */ Chat.h(
      "div",
      {
        class: "folder",
        "data-value": value,
        onDragEnter: this.dragEnterFolder,
        onDragLeave: this.dragLeaveFolder,
        onDrop: this.dropFolder
      },
      /* @__PURE__ */ Chat.h("button", { class: `selectFolder${active}`, "data-value": value }, children)
    );
  }
  renderFolderList() {
    const room = this.props.room;
    const folderTable = { "": 1 };
    const folders = [];
    for (const team of import_client_main.PS.teams.list) {
      const folder = team.folder;
      if (folder && !(`${folder}/` in folderTable)) {
        folders.push(`${folder}/`);
        folderTable[`${folder}/`] = 1;
        if (!("/" in folderTable)) {
          folders.push("/");
          folderTable["/"] = 1;
        }
      }
      const format = team.format || room.DEFAULT_FORMAT;
      if (!(format in folderTable)) {
        folders.push(format);
        folderTable[format] = 1;
      }
    }
    if (room.curFolderKeep.endsWith("/") || room.curFolder.endsWith("/")) {
      if (!("/" in folderTable)) {
        folders.push("/");
        folderTable["/"] = 1;
      }
    }
    if (!(room.curFolderKeep in folderTable)) {
      folderTable[room.curFolderKeep] = 1;
      folders.push(room.curFolderKeep);
    }
    if (!(room.curFolder in folderTable)) {
      folderTable[room.curFolder] = 1;
      folders.push(room.curFolder);
    }
    import_battle_dex.PSUtils.sortBy(folders, (folder) => [
      folder.endsWith("/") ? 10 : -parseInt(folder.charAt(3), 10),
      folder
    ]);
    let renderedFormatFolders = [
      /* @__PURE__ */ Chat.h("div", { class: "foldersep" }),
      /* @__PURE__ */ Chat.h("div", { class: "folder" }, /* @__PURE__ */ Chat.h(
        "button",
        {
          name: "format",
          value: "",
          "data-selecttype": "teambuilder",
          class: "selectFolder",
          "data-href": "/formatdropdown",
          onChange: this.addFormatFolder
        },
        /* @__PURE__ */ Chat.h("i", { class: "fa fa-plus", "aria-hidden": true }),
        /* @__PURE__ */ Chat.h("em", null, "(add format folder)")
      ))
    ];
    let renderedFolders = [];
    let gen = -1;
    for (let format of folders) {
      const newGen = format.endsWith("/") ? 0 : parseInt(format.charAt(3), 10);
      if (gen !== newGen) {
        gen = newGen;
        if (gen === 0) {
          renderedFolders.push(...renderedFormatFolders);
          renderedFormatFolders = [];
          renderedFolders.push(/* @__PURE__ */ Chat.h("div", { class: "foldersep" }));
          renderedFolders.push(/* @__PURE__ */ Chat.h("div", { class: "folder" }, /* @__PURE__ */ Chat.h("h3", null, "Folders")));
        } else {
          renderedFolders.push(/* @__PURE__ */ Chat.h("div", { class: "folder" }, /* @__PURE__ */ Chat.h("h3", null, "Gen ", gen)));
        }
      }
      renderedFolders.push(this.renderFolder(format));
    }
    renderedFolders.push(...renderedFormatFolders);
    return /* @__PURE__ */ Chat.h("div", { class: "folderlist", onClick: this.selectFolder }, /* @__PURE__ */ Chat.h("div", { class: "folderlistbefore" }), this.renderFolder(""), renderedFolders, /* @__PURE__ */ Chat.h("div", { class: "foldersep" }), this.renderFolder("++"), /* @__PURE__ */ Chat.h("div", { class: "folderlistafter" }));
  }
  render() {
    const room = this.props.room;
    let teams = import_client_main.PS.teams.list.slice();
    let isDragging = false;
    if (import_client_main.PS.dragging?.type === "team" && typeof import_client_main.PS.dragging.team === "number") {
      teams.splice(import_client_main.PS.dragging.team, 0, null);
      isDragging = true;
    } else if (import_client_main.PS.teams.deletedTeams.length) {
      const undeleteIndex = import_client_main.PS.teams.deletedTeams[import_client_main.PS.teams.deletedTeams.length - 1][1];
      teams.splice(undeleteIndex, 0, null);
    }
    let filterFolder = null;
    let filterFormat = null;
    if (room.curFolder) {
      if (room.curFolder.endsWith("/")) {
        filterFolder = room.curFolder.slice(0, -1);
        teams = teams.filter((team) => !team || team.folder === filterFolder);
      } else {
        filterFormat = room.curFolder;
        teams = teams.filter((team) => !team || team.format === filterFormat);
      }
    }
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room }, /* @__PURE__ */ Chat.h("div", { class: "folderpane" }, this.renderFolderList()), /* @__PURE__ */ Chat.h("div", { class: "teampane", onDrop: this.dropPanel }, filterFolder ? /* @__PURE__ */ Chat.h("h2", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-open", "aria-hidden": true }), " ", filterFolder, " ", /* @__PURE__ */ Chat.h("button", { class: "button small", style: "margin-left:5px", name: "renameFolder" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-pencil", "aria-hidden": true }), " Rename"), " ", /* @__PURE__ */ Chat.h("button", { class: "button small", style: "margin-left:5px", name: "promptDeleteFolder" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-times", "aria-hidden": true }), " Remove")) : filterFolder === "" ? /* @__PURE__ */ Chat.h("h2", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-open-o", "aria-hidden": true }), " Teams not in any folders") : filterFormat ? /* @__PURE__ */ Chat.h("h2", null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-folder-open-o", "aria-hidden": true }), " ", filterFormat, " ", /* @__PURE__ */ Chat.h("small", null, "(", teams.length, ")")) : /* @__PURE__ */ Chat.h("h2", null, "All Teams ", /* @__PURE__ */ Chat.h("small", null, "(", teams.length, ")")), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { "data-cmd": "/newteam", class: "button big" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-plus-circle", "aria-hidden": true }), " New Team"), " ", /* @__PURE__ */ Chat.h("button", { "data-cmd": "/newteam box", class: "button" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-archive", "aria-hidden": true }), " New Box")), /* @__PURE__ */ Chat.h("ul", { class: "teamlist" }, teams.map((team) => team ? /* @__PURE__ */ Chat.h("li", { key: team.key, onDragEnter: this.dragEnterTeam, "data-teamkey": team.key }, /* @__PURE__ */ Chat.h(import_panel_teamdropdown.TeamBox, { team }), " ", !team.uploaded && /* @__PURE__ */ Chat.h("button", { "data-cmd": `/deleteteam ${team.key}`, class: "option" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-trash", "aria-hidden": true }), " Delete"), " ", team.uploaded?.private ? /* @__PURE__ */ Chat.h("i", { class: "fa fa-cloud gray" }) : team.uploaded ? /* @__PURE__ */ Chat.h("i", { class: "fa fa-globe gray" }) : team.teamid ? /* @__PURE__ */ Chat.h("i", { class: "fa fa-plug gray" }) : null) : isDragging ? /* @__PURE__ */ Chat.h("li", { key: "dragging" }, /* @__PURE__ */ Chat.h("div", { class: "team" })) : /* @__PURE__ */ Chat.h("li", { key: "undelete" }, /* @__PURE__ */ Chat.h("button", { "data-cmd": "/undeleteteam", class: "option" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-undo", "aria-hidden": true }), " Undo delete")))), /* @__PURE__ */ Chat.h("p", null, /* @__PURE__ */ Chat.h("button", { "data-cmd": "/newteam bottom", class: "button" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-plus-circle", "aria-hidden": true }), " New Team"), " ", /* @__PURE__ */ Chat.h("button", { "data-cmd": "/newteam box bottom", class: "button" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-archive", "aria-hidden": true }), " New Box"))));
  }
}
import_client_main.PS.addRoomType(TeambuilderPanel);
//# sourceMappingURL=panel-teambuilder.js.map
