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
var client_connection_exports = {};
__export(client_connection_exports, {
  Net: () => Net,
  PSConnection: () => PSConnection,
  PSLoginServer: () => PSLoginServer,
  PSStorage: () => PSStorage
});
module.exports = __toCommonJS(client_connection_exports);
var import_client_main = require("./client-main");
/**
 * Connection library
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */
class PSConnection {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.queue = [];
    this.reconnectDelay = 1e3;
    this.reconnectCap = 15e3;
    this.shouldReconnect = true;
    this.reconnectTimer = null;
    this.worker = null;
    const loading = PSStorage.init();
    if (loading) {
      loading.then(() => {
        this.initConnection();
      });
    } else {
      this.initConnection();
    }
  }
  initConnection() {
    if (!this.tryConnectInWorker()) this.directConnect();
  }
  canReconnect() {
    const uptime = Date.now() - import_client_main.PS.startTime;
    if (uptime > 24 * 60 * 60 * 1e3) {
      import_client_main.PS.confirm(`It's been over a day since you first connected. Please refresh.`, {
        okButton: "Refresh"
      }).then((confirmed) => {
        if (confirmed) import_client_main.PS.room?.send(`/refresh`);
      });
      return false;
    }
    return this.shouldReconnect;
  }
  tryConnectInWorker() {
    if (this.socket) return false;
    try {
      const worker = new Worker("/js/client-connection-worker.js");
      this.worker = worker;
      worker.postMessage({ type: "connect", server: import_client_main.PS.server });
      worker.onmessage = (event) => {
        const { type, data } = event.data;
        switch (type) {
          case "connected":
            console.log("\u2705 (CONNECTED via worker)");
            this.connected = true;
            import_client_main.PS.connected = true;
            this.queue.forEach((msg) => worker.postMessage({ type: "send", data: msg }));
            this.queue = [];
            import_client_main.PS.update();
            break;
          case "message":
            import_client_main.PS.receive(data);
            break;
          case "disconnected":
            this.handleDisconnect();
            break;
          case "error":
            console.warn(`Worker connection error: ${data}`);
            this.worker = null;
            this.handleDisconnect();
            break;
        }
      };
      worker.onerror = (e) => {
        console.warn("Worker connection error:", e);
        this.worker = null;
        this.directConnect();
      };
      return true;
    } catch {
      console.warn("Worker connection failed, falling back to regular connection.");
      this.worker = null;
      return false;
    }
  }
  directConnect() {
    if (this.worker) return;
    const server = import_client_main.PS.server;
    const port = server.protocol === "https" ? `:${server.port}` : `:${server.httpport}`;
    const url = `${server.protocol}://${server.host}${port}${server.prefix}`;
    try {
      this.socket = new SockJS(url, [], { timeout: 5 * 60 * 1e3 });
    } catch {
      this.socket = new WebSocket(url.replace("http", "ws") + "/websocket");
    }
    const socket = this.socket;
    socket.onopen = () => {
      console.log("\u2705 (CONNECTED)");
      this.connected = true;
      import_client_main.PS.connected = true;
      this.reconnectDelay = 1e3;
      this.queue.forEach((msg) => socket.send(msg));
      this.queue = [];
      import_client_main.PS.update();
    };
    socket.onmessage = (ev) => {
      import_client_main.PS.receive("" + ev.data);
    };
    socket.onclose = () => {
      console.log("\u274C (DISCONNECTED)");
      this.handleDisconnect();
      console.log("\u2705 (DISCONNECTED)");
      this.connected = false;
      import_client_main.PS.connected = false;
      import_client_main.PS.isOffline = true;
      for (const roomid in import_client_main.PS.rooms) {
        const room = import_client_main.PS.rooms[roomid];
        if (room.connected === true) room.connected = "autoreconnect";
      }
      this.socket = null;
      import_client_main.PS.update();
    };
    socket.onerror = (ev) => {
      import_client_main.PS.connected = false;
      import_client_main.PS.isOffline = true;
      import_client_main.PS.alert(`Connection error`);
      this.retryConnection();
      import_client_main.PS.update();
    };
  }
  handleDisconnect() {
    this.connected = false;
    import_client_main.PS.connected = false;
    import_client_main.PS.isOffline = true;
    this.socket = null;
    for (const roomid in import_client_main.PS.rooms) {
      const room = import_client_main.PS.rooms[roomid];
      if (room.connected === true) room.connected = "autoreconnect";
    }
    this.retryConnection();
    import_client_main.PS.update();
  }
  retryConnection() {
    if (!this.canReconnect()) return;
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.connected && this.canReconnect()) {
        import_client_main.PS.mainmenu.send("/reconnect");
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.reconnectCap);
      }
    }, this.reconnectDelay);
  }
  disconnect() {
    this.shouldReconnect = false;
    this.socket?.close();
    this.worker?.terminate();
    this.worker = null;
    import_client_main.PS.connection = null;
    import_client_main.PS.connected = false;
    import_client_main.PS.isOffline = true;
  }
  reconnectTest() {
    this.socket?.close();
    this.worker?.postMessage({ type: "disconnect" });
    this.worker = null;
    import_client_main.PS.connected = false;
    import_client_main.PS.isOffline = true;
  }
  send(msg) {
    if (!this.connected) {
      this.queue.push(msg);
      return;
    }
    if (this.worker) {
      this.worker.postMessage({ type: "send", data: msg });
    } else if (this.socket) {
      this.socket.send(msg);
    }
  }
  static connect() {
    if (import_client_main.PS.connection?.socket) return;
    import_client_main.PS.isOffline = false;
    if (!import_client_main.PS.connection) {
      import_client_main.PS.connection = new PSConnection();
    } else {
      import_client_main.PS.connection.directConnect();
    }
    import_client_main.PS.prefs.doAutojoin();
  }
}
class PSStorage {
  static {
    this.frame = null;
  }
  static {
    this.requests = null;
  }
  static {
    this.requestCount = 0;
  }
  static {
    this.origin = `https://${import_client_main.Config.routes.client}`;
  }
  static {
    this.loaded = false;
  }
  static init() {
    if (this.loaded) {
      if (this.loaded === true) return;
      return this.loaded;
    }
    if (import_client_main.Config.testclient) {
      return;
    } else if (`${location.protocol}//${location.hostname}` === PSStorage.origin) {
      import_client_main.Config.server ||= import_client_main.Config.defaultserver;
      return;
    }
    if (!("postMessage" in window)) {
      import_client_main.PS.alert("Sorry, psim connections are unsupported by your browser.");
      return;
    }
    window.addEventListener("message", this.onMessage);
    if (document.location.hostname !== import_client_main.Config.routes.client) {
      const iframe = document.createElement("iframe");
      iframe.src = "https://" + import_client_main.Config.routes.client + "/crossdomain.php?host=" + encodeURIComponent(document.location.hostname) + "&path=" + encodeURIComponent(document.location.pathname.substr(1)) + "&protocol=" + encodeURIComponent(document.location.protocol);
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    } else {
      import_client_main.Config.server ||= import_client_main.Config.defaultserver;
      $(
        `<iframe src="https://${import_client_main.Config.routes.client}/crossprotocol.html?v1.2" style="display: none;"></iframe>`
      ).appendTo("body");
      setTimeout(() => {
      }, 2e3);
    }
    this.loaded = new Promise((resolve) => {
      this.loader = resolve;
    });
    return this.loaded;
  }
  static {
    this.onMessage = (e) => {
      if (e.origin !== PSStorage.origin) return;
      this.frame = e.source;
      const data = e.data;
      switch (data.charAt(0)) {
        case "c":
          import_client_main.Config.server = JSON.parse(data.substr(1));
          if (import_client_main.Config.server.registered && import_client_main.Config.server.id !== "showdown" && import_client_main.Config.server.id !== "smogtours") {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `//${import_client_main.Config.routes.client}/customcss.php?server=${encodeURIComponent(import_client_main.Config.server.id)}`;
            document.head.appendChild(link);
          }
          Object.assign(import_client_main.PS.server, import_client_main.Config.server);
          break;
        case "p":
          const newData = JSON.parse(data.substr(1));
          if (newData) import_client_main.PS.prefs.load(newData, true);
          import_client_main.PS.prefs.save = function() {
            const prefData = JSON.stringify(import_client_main.PS.prefs.storage);
            PSStorage.postCrossOriginMessage("P" + prefData);
            try {
              localStorage.setItem("showdown_prefs", prefData);
            } catch {
            }
          };
          import_client_main.PS.prefs.update(null);
          break;
        case "t":
          if (window.nodewebkit) return;
          let oldTeams;
          if (import_client_main.PS.teams.list.length) {
            oldTeams = import_client_main.PS.teams.list;
          }
          import_client_main.PS.teams.unpackAll(data.substr(1));
          import_client_main.PS.teams.save = function() {
            const packedTeams = import_client_main.PS.teams.packAll(import_client_main.PS.teams.list);
            PSStorage.postCrossOriginMessage("T" + packedTeams);
            if (document.location.hostname === import_client_main.Config.routes.client) {
              try {
                localStorage.setItem("showdown_teams_local", packedTeams);
              } catch {
              }
            }
            import_client_main.PS.teams.update("team");
          };
          if (oldTeams) {
            import_client_main.PS.teams.list = import_client_main.PS.teams.list.concat(oldTeams);
            import_client_main.PS.teams.save();
            localStorage.removeItem("showdown_teams");
          }
          if (data === "tnull" && !import_client_main.PS.teams.list.length) {
            import_client_main.PS.teams.unpackAll(localStorage.getItem("showdown_teams_local"));
          }
          break;
        case "a":
          if (data === "a0") {
            import_client_main.PS.alert("Your browser doesn't support third-party cookies. Some things might not work correctly.");
          }
          if (!window.nodewebkit) {
            try {
              PSStorage.frame.postMessage("", PSStorage.origin);
            } catch {
              return;
            }
            PSStorage.requests = {};
          }
          PSStorage.loaded = true;
          PSStorage.loader?.();
          PSStorage.loader = void 0;
          break;
        case "r":
          const reqData = JSON.parse(data.slice(1));
          const idx = reqData[0];
          if (PSStorage.requests[idx]) {
            PSStorage.requests[idx](reqData[1]);
            delete PSStorage.requests[idx];
          }
          break;
      }
    };
  }
  static request(type, uri, data) {
    if (!PSStorage.requests) return;
    const idx = PSStorage.requestCount++;
    return new Promise((resolve) => {
      PSStorage.requests[idx] = resolve;
      PSStorage.postCrossOriginMessage((type === "GET" ? "R" : "S") + JSON.stringify([uri, data, idx, "text"]));
    });
  }
  static {
    this.postCrossOriginMessage = function(data) {
      try {
        return PSStorage.frame.postMessage(data, PSStorage.origin);
      } catch {
      }
      return false;
    };
  }
}
;
PSConnection.connect();
const PSLoginServer = new class {
  rawQuery(act, data) {
    data.act = act;
    let url = "/~~" + import_client_main.PS.server.id + "/action.php";
    if (location.pathname.endsWith(".html")) {
      url = "https://" + import_client_main.Config.routes.client + url;
      if (typeof POKEMON_SHOWDOWN_TESTCLIENT_KEY === "string") {
        data.sid = POKEMON_SHOWDOWN_TESTCLIENT_KEY.replace(/%2C/g, ",");
      }
    }
    return PSStorage.request("POST", url, data) || Net(url).get({ method: "POST", body: data }).then(
      (res) => res ?? null
    ).catch(
      () => null
    );
  }
  query(act, data = {}) {
    return this.rawQuery(act, data).then(
      (res) => res ? JSON.parse(res.slice(1)) : null
    ).catch(
      () => null
    );
  }
}();
class HttpError extends Error {
  constructor(message, statusCode, body) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.body = body;
    try {
      Error.captureStackTrace(this, HttpError);
    } catch {
    }
  }
}
class NetRequest {
  constructor(uri) {
    this.uri = uri;
  }
  /**
   * Makes a basic http/https request to the URI.
   * Returns the response data.
   *
   * Will throw if the response code isn't 200 OK.
   *
   * @param opts request opts
   */
  get(opts = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let uri = this.uri;
      if (opts.query) {
        uri += (uri.includes("?") ? "&" : "?") + Net.encodeQuery(opts.query);
      }
      xhr.open(opts.method || "GET", uri);
      xhr.onreadystatechange = function() {
        const DONE = 4;
        if (xhr.readyState === DONE) {
          if (xhr.status === 200) {
            resolve(xhr.responseText || "");
            return;
          }
          const err = new HttpError(xhr.statusText || "Connection error", xhr.status, xhr.responseText);
          reject(err);
        }
      };
      if (opts.body) {
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send(Net.encodeQuery(opts.body));
      } else {
        xhr.send();
      }
    });
  }
  post(opts = {}, body) {
    if (!body) body = opts.body;
    return this.get({
      ...opts,
      method: "POST",
      body
    });
  }
}
function Net(uri) {
  if (uri.startsWith("/") && !uri.startsWith("//") && Net.defaultRoute) uri = Net.defaultRoute + uri;
  if (uri.startsWith("//") && document.location.protocol === "file:") uri = "https:" + uri;
  return new NetRequest(uri);
}
Net.defaultRoute = "";
Net.encodeQuery = function(data) {
  if (typeof data === "string") return data;
  let urlencodedData = "";
  for (const key in data) {
    if (urlencodedData) urlencodedData += "&";
    let value = data[key];
    if (value === true) value = "on";
    if (value === false || value === null || value === void 0) value = "";
    urlencodedData += encodeURIComponent(key) + "=" + encodeURIComponent(value);
  }
  return urlencodedData;
};
Net.formData = function(form) {
  const elements = form.querySelectorAll("input[name], select[name], textarea[name]");
  const out = {};
  for (const element of elements) {
    if (element.type === "checkbox") {
      out[element.name] = element.getAttribute("value") ? element.checked ? element.value : "" : !!element.checked;
    } else if (element.type !== "radio" || element.checked) {
      out[element.name] = element.value;
    }
  }
  return out;
};
//# sourceMappingURL=client-connection.js.map
