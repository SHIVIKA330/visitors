const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = 3000;
const VISITORS_LOG = path.join(__dirname, "visitors.log");
const BACKUP_LOG = path.join(__dirname, "backup.log");


if (!fs.existsSync(VISITORS_LOG)) {
  fs.writeFileSync(VISITORS_LOG, "", "utf-8");
}


function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d} day(s), ${h} hour(s), ${m} minute(s), ${s} second(s)`;
}

function formatBytes(bytes) {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(2)} ${units[i]}`;
}


function handleUpdateUser(req, res) {
  const timestamp = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "medium",
  });
  const entry = `Visitor logged at: ${timestamp}\n`;

  fs.appendFile(VISITORS_LOG, entry, "utf-8", (err) => {
    if (err) {
      return jsonResponse(res, 500, { status: "error", message: "Failed to log visitor." });
    }
    jsonResponse(res, 200, {
      status: "success",
      message: "Visitor entry added!",
      timestamp,
    });
  });
}

function handleSaveLog(req, res) {
  fs.readFile(VISITORS_LOG, "utf-8", (err, data) => {
    if (err) {
      return jsonResponse(res, 500, { status: "error", message: "Failed to read visitors.log." });
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(data || "(visitors.log is empty)");
  });
}

function handleBackup(req, res) {
  fs.readFile(VISITORS_LOG, "utf-8", (err, data) => {
    if (err) {
      return jsonResponse(res, 500, { status: "error", message: "Failed to read visitors.log." });
    }
    fs.writeFile(BACKUP_LOG, data, "utf-8", (writeErr) => {
      if (writeErr) {
        return jsonResponse(res, 500, { status: "error", message: "Failed to create backup." });
      }
      jsonResponse(res, 200, {
        status: "success",
        message: "Backup created successfully!",
        file: "backup.log",
      });
    });
  });
}

function handleClearLog(req, res) {
  fs.writeFile(VISITORS_LOG, "", "utf-8", (err) => {
    if (err) {
      return jsonResponse(res, 500, { status: "error", message: "Failed to clear visitors.log." });
    }
    jsonResponse(res, 200, {
      status: "success",
      message: "visitors.log has been cleared!",
    });
  });
}

function handleServerInfo(req, res) {
  const cpus = os.cpus();
  const info = {
    status: "success",
    server: {
      "Hostname": os.hostname(),
      "Platform": `${os.type()} (${os.platform()})`,
      "Architecture": os.arch(),
      "OS Release": os.release(),
      "Server Uptime": formatUptime(os.uptime()),
      "Node.js Version": process.version,
    },
    memory: {
      "Total Memory": formatBytes(os.totalmem()),
      "Free Memory": formatBytes(os.freemem()),
      "Used Memory": formatBytes(os.totalmem() - os.freemem()),
      "Usage Percentage": ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1) + "%",
    },
    cpu: {
      "Model": cpus[0]?.model || "Unknown",
      "Cores": cpus.length,
      "Speed": `${cpus[0]?.speed || 0} MHz`,
    },
    network: {
      "Home Directory": os.homedir(),
      "Temp Directory": os.tmpdir(),
    },
    currentTime: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "medium",
    }),
  };

  jsonResponse(res, 200, info);
}

const server = http.createServer((req, res) => {
  const { method, url } = req;
  const parsedUrl = new URL(url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  console.log(`[${new Date().toISOString()}]  ${method}  ${pathname}`);

  // Route matching
  if (method === "GET" && pathname === "/updateUser") {
    return handleUpdateUser(req, res);
  }
  if (method === "GET" && pathname === "/saveLog") {
    return handleSaveLog(req, res);
  }
  if (method === "POST" && pathname === "/backup") {
    return handleBackup(req, res);
  }
  if (method === "GET" && pathname === "/clearLog") {
    return handleClearLog(req, res);
  }
  if (method === "GET" && pathname === "/serverInfo") {
    return handleServerInfo(req, res);
  }

  jsonResponse(res, 404, {
    status: "error",
    message: `Route not found: ${method} ${pathname}`,
    availableRoutes: [
      "GET  /updateUser  — Log a new visitor",
      "GET  /saveLog     — View visitors.log",
      "POST /backup      — Backup visitors.log → backup.log",
      "GET  /clearLog    — Clear visitors.log",
      "GET  /serverInfo  — System information",
    ],
  });
});

server.listen(PORT, () => {
  console.log(`\n  Server running at http://localhost:${PORT}`);
  console.log(`\n   Available routes:`);
  console.log(`   GET  /updateUser  — Log a new visitor`);
  console.log(`   GET  /saveLog     — View visitors.log`);
  console.log(`   POST /backup      — Backup visitors.log → backup.log`);
  console.log(`   GET  /clearLog    — Clear visitors.log`);
  console.log(`   GET  /serverInfo  — System information\n`);
});

