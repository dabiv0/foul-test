"use strict";
var import_client_main = require("./client-main");
var import_panels = require("./panels");
/**
 * Example Panel
 *
 * Just an example panel for creating new panels/popups
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */
class ExampleRoom extends import_client_main.PSRoom {
  // eslint-disable-next-line no-useless-constructor
  constructor(options) {
    super(options);
    this.classType = "example";
  }
}
class ExamplePanel extends import_panels.PSRoomPanel {
  static {
    // This is the ID of the panel type. It can be whatever you want, but
    // it must not be the same as any other panel ID.
    this.id = "exampleview";
  }
  static {
    // This is a list of panel IDs. This would make <<exampleview>> and
    // <<examples-anything>> open this panel.
    this.routes = ["exampleview", "examples-*"];
  }
  static {
    this.Model = ExampleRoom;
  }
  static {
    // The default title (shown on the tab list). You can edit
    // `ExampleRoom`'s `title` property to change it.
    this.title = "Example View";
  }
  render() {
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room }, /* @__PURE__ */ Chat.h("div", { class: "mainmessage" }, /* @__PURE__ */ Chat.h("p", null, "Hello World!")));
  }
}
import_client_main.PS.addRoomType(ExamplePanel);
class ExampleViewPanel extends import_panels.PSRoomPanel {
  static {
    this.id = "examplevie2";
  }
  static {
    this.routes = ["exampleview2"];
  }
  static {
    this.title = "Example View";
  }
  render() {
    const room = this.props.room;
    return /* @__PURE__ */ Chat.h(import_panels.PSPanelWrapper, { room }, /* @__PURE__ */ Chat.h("div", { class: "mainmessage" }, /* @__PURE__ */ Chat.h("p", null, "Hello World!")));
  }
}
import_client_main.PS.addRoomType(ExampleViewPanel);
//# sourceMappingURL=panel-example.js.map
