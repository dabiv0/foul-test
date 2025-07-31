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
var miniedit_exports = {};
__export(miniedit_exports, {
  MiniEdit: () => MiniEdit,
  MiniEditPastePlugin: () => MiniEditPastePlugin,
  MiniEditUndoPlugin: () => MiniEditUndoPlugin
});
module.exports = __toCommonJS(miniedit_exports);
const MAX_UNDO_HISTORY = 100;
class MiniEdit {
  constructor(el, options) {
    this.onKeyDown = (ev) => {
      if (ev.keyCode === 13) {
        this.replaceSelection("\n");
        ev.preventDefault();
      }
    };
    this.element = el;
    this._setContent = options.setContent;
    this.onKeyDown = options.onKeyDown || this.onKeyDown;
    this.element.setAttribute("contentEditable", "true");
    this.element.setAttribute("autoComplete", "off");
    this.element.setAttribute("spellCheck", "false");
    this.element.addEventListener("input", () => {
      this.reformat();
    });
    this.element.addEventListener("keydown", this.onKeyDown);
    for (const Plugin of MiniEdit.plugins) new Plugin(this);
  }
  static {
    this.plugins = [];
  }
  /** return true from callback for an early return */
  traverseText(node, callback) {
    if (node.nodeType === 3) {
      if (callback(node)) return true;
    } else {
      for (let i = 0, len = node.childNodes.length; i < len; ++i) {
        if (this.traverseText(node.childNodes[i], callback)) return true;
      }
    }
    return false;
  }
  setValue(text, selection = this.getSelection()) {
    this._setContent(text);
    this.setSelection(selection);
    this.pushHistory?.(text, selection);
  }
  getValue() {
    const text = this.element.textContent || "";
    if (text.endsWith("\n")) return text.slice(0, -1);
    return text;
  }
  reformat(selection) {
    this.setValue(this.getValue(), selection);
  }
  replaceSelection(text) {
    const selection = this.getSelection();
    const oldContent = this.getValue();
    const newText = oldContent.slice(0, selection.start) + text + oldContent.slice(selection.end);
    this.setValue(newText, { start: selection.start + text.length, end: selection.start + text.length });
  }
  getSelection() {
    const sel = window.getSelection();
    let offset = 0;
    let start = null;
    let end = null;
    if (sel.rangeCount) {
      const range = sel.getRangeAt(0);
      this.traverseText(this.element, (node) => {
        if (start === null && node === range.startContainer) {
          start = offset + range.startOffset;
        }
        if (start !== null && node === range.endContainer) {
          end = offset + range.endOffset;
          return true;
        }
        offset += node.length;
        return false;
      });
    }
    return start === null || end === null ? null : { start, end };
  }
  setSelection(sel) {
    if (sel === null) return;
    const range = document.createRange();
    let offset = 0;
    let found = false;
    range.collapse(true);
    if (this.traverseText(this.element, (n) => {
      const nextOffset = offset + n.length;
      if (!found && sel.start >= offset && sel.start <= nextOffset) {
        range.setStart(n, sel.start - offset);
        found = true;
      }
      if (found && sel.end >= offset && sel.end <= nextOffset) {
        range.setEnd(n, sel.end - offset);
        return true;
      }
      offset = nextOffset;
      return false;
    })) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  select() {
    this.setSelection({ start: 0, end: this.getValue().length });
  }
}
class MiniEditPastePlugin {
  constructor(editor) {
    editor.element.addEventListener("paste", (e) => {
      const text = e.clipboardData.getData("text/plain");
      editor.replaceSelection(text);
      e.preventDefault();
    });
  }
}
MiniEdit.plugins.push(MiniEditPastePlugin);
class MiniEditUndoPlugin {
  constructor(editor) {
    this.undoIndex = null;
    this.ignoreInput = false;
    this.history = [];
    this.onPushHistory = (text, selection) => {
      if (this.ignoreInput) {
        this.ignoreInput = false;
        return;
      }
      if (this.undoIndex !== null) {
        this.history.splice(this.undoIndex + 1);
        this.undoIndex = null;
      }
      this.history.push({ text, selection });
      if (this.history.length > MAX_UNDO_HISTORY) this.history.shift();
    };
    this.onKeyDown = (e) => {
      const undoPressed = e.ctrlKey && e.keyCode === 90 || e.metaKey && !e.shiftKey && e.keyCode === 90;
      const redoPressed = e.ctrlKey && e.keyCode === 89 || e.metaKey && e.shiftKey && e.keyCode === 90;
      if (undoPressed) {
        this.undoIndex ??= this.history.length - 1;
        this.undoIndex--;
        if (this.undoIndex < 0) {
          this.undoIndex = 0;
          return;
        }
      } else if (redoPressed && this.undoIndex !== null) {
        this.undoIndex++;
        if (this.undoIndex > this.history.length - 1) {
          this.undoIndex = null;
          return;
        }
      } else {
        return;
      }
      const { text, selection } = this.history[this.undoIndex];
      this.ignoreInput = true;
      this.editor.setValue(text, selection);
    };
    this.editor = editor;
    this.history.push({ text: editor.getValue(), selection: { start: 0, end: 0 } });
    this.editor.pushHistory = this.onPushHistory;
    editor.element.addEventListener("keydown", this.onKeyDown);
  }
}
MiniEdit.plugins.push(MiniEditUndoPlugin);
//# sourceMappingURL=miniedit.js.map
