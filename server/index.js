const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { createTabletopSystem } = require("./game/tabletop");

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const DM_PASSWORD = String(process.env.GAIROS_DM_PASSWORD || "python");
const DM_COOKIE_NAME = "gairos-dm-auth";
const TERRAIN_TEXTURE_ROOT =
  process.env.GAIROS_TEXTURE_LIBRARY || "/mnt/d/Dropbox/TabletopRPGs/textures";

function normalizeAddress(address) {
  if (!address) {
    return "";
  }
  if (address.startsWith("::ffff:")) {
    return address.slice(7);
  }
  return address;
}

function isPrivateAddress(address) {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return false;
  }
  if (normalized === "127.0.0.1" || normalized === "::1") {
    return true;
  }
  if (normalized.includes(":")) {
    const lower = normalized.toLowerCase();
    if (lower.startsWith("fc") || lower.startsWith("fd")) {
      return true;
    }
    if (
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb")
    ) {
      return true;
    }
    return false;
  }

  const parts = normalized.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 127) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  return false;
}

function privateOnly(req, res, next) {
  const address = req.socket.remoteAddress;
  if (isPrivateAddress(address)) {
    return next();
  }
  res.status(403).send("Access limited to local networks.");
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const entries = header.split(";").map((part) => part.trim()).filter(Boolean);
  return entries.reduce((acc, entry) => {
    const [key, ...rest] = entry.split("=");
    if (!key) {
      return acc;
    }
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

const app = express();
app.set("trust proxy", false);
app.use(privateOnly);
app.use(express.urlencoded({ extended: false }));

function serveDmPage(req, res, filename) {
  const cookies = parseCookies(req);
  if (cookies[DM_COOKIE_NAME] === DM_PASSWORD) {
    res.sendFile(path.join(__dirname, "..", "public", filename));
    return;
  }
  res.status(401).send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>DM Access</title>
        <style>
          body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#120f0b;color:#f4e8cf;font-family:"Cinzel","Garamond",serif;}
          form{background:rgba(12,9,6,0.85);border:1px solid rgba(255,255,255,0.12);padding:24px 28px;border-radius:14px;box-shadow:0 12px 24px rgba(0,0,0,0.45);min-width:280px;}
          label{display:block;margin-bottom:8px;letter-spacing:0.12em;text-transform:uppercase;font-size:0.75rem;color:#c9b48b;}
          input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:#0b0906;color:#f4e8cf;font-size:1rem;}
          button{margin-top:14px;width:100%;padding:10px 12px;border-radius:10px;border:none;background:#b31212;color:#fbe7e2;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;}
        </style>
      </head>
      <body>
        <form method="post" action="/dm-auth">
          <label for="dm-password">DM Password</label>
          <input id="dm-password" name="password" type="password" autocomplete="current-password" />
          <button type="submit">Enter</button>
        </form>
      </body>
    </html>
  `);
}

app.get("/dm.html", (req, res) => {
  serveDmPage(req, res, "dm-tabletop.html");
});

app.get("/dm-tabletop.html", (req, res) => {
  serveDmPage(req, res, "dm-tabletop.html");
});

app.post("/dm-auth", (req, res) => {
  const password = String(req.body && req.body.password ? req.body.password : "");
  if (password !== DM_PASSWORD) {
    res.status(401).send("Incorrect password.");
    return;
  }
  res.setHeader("Set-Cookie", `${DM_COOKIE_NAME}=${encodeURIComponent(DM_PASSWORD)}; Path=/; SameSite=Lax`);
  res.redirect("/dm-tabletop.html");
});

app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/texture-library", express.static(path.join(TERRAIN_TEXTURE_ROOT, "extracted")));

const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 12 * 1024 * 1024,
  cors: {
    origin: false,
  },
});

io.use((socket, next) => {
  const address = socket.handshake.address;
  if (isPrivateAddress(address)) {
    return next();
  }
  return next(new Error("Access limited to local networks."));
});

createTabletopSystem(io, {
  dataDirectory: path.join(__dirname, "..", "generated", "tabletop"),
  dmPassword: DM_PASSWORD,
  textureLibraryRoot: TERRAIN_TEXTURE_ROOT,
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Gairos tabletop listening on http://${HOST}:${PORT}`);
});
