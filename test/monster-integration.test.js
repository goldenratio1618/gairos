const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { test } = require("node:test");
const MonsterRules = require("../public/monster-rules");

const serverFile = path.resolve(__dirname, "../server/game/tabletop.js");
const sheetUrl = "https://docs.google.com/spreadsheets/d/test-character-sheet-123456789/edit";
const jsonCopy = (value) => JSON.parse(JSON.stringify(value));

// Execute the production socket handlers, parsers, and file persistence with
// an in-memory transport. The VM replaces only network access and background
// timers: no live Google/OpenAI calls, shared environment, or game data is used.
function createHarness(directory) {
  const requests = [];
  let connectHandler;
  const namespace = {
    sockets: new Map(),
    on(event, handler) {
      assert.equal(event, "connection");
      connectHandler = handler;
    },
  };
  const compiled = { exports: {} };
  vm.runInNewContext(fs.readFileSync(serverFile, "utf8"), {
    require: createRequire(serverFile),
    module: compiled,
    exports: compiled.exports,
    __dirname: path.dirname(serverFile),
    __filename: serverFile,
    process: { env: {} },
    Buffer,
    URL,
    console,
    setTimeout: () => ({}),
    clearTimeout: () => {},
    setInterval: () => ({}),
    fetch: async (address) => {
      const url = new URL(address);
      requests.push(url.href);
      if (url.pathname.includes("/test-character-sheet-123456789/")) {
        const tab = url.searchParams.get("sheet");
        if (tab === "Stats 🗡️") {
          return {
            ok: true,
            text: async () => [
              "Level,5,,,,Skills,Bonus",
              "HP,31,,19,,Melee Weapons,8.5",
              "Speed,40,,,,Initiative,4",
              "Size,Medium,,,,Strength,3",
            ].join("\n"),
          };
        }
        if (tab === "Feats ⭐") return { ok: true, text: async () => "Feat Name\nTough\n" };
      }
      // Initial rule-table refreshes fail harmlessly and cannot access the web.
      return { ok: false, status: 503, text: async () => "Offline test fixture" };
    },
  }, { filename: serverFile });
  const system = compiled.exports.createTabletopSystem({
    of(name) { assert.equal(name, "/tabletop"); return namespace; },
  }, { dataDirectory: directory, textureLibraryRoot: path.join(directory, "absent-textures") });

  function connect(id) {
    const handlers = new Map();
    const events = [];
    const socket = {
      id,
      data: {},
      on(event, handler) { handlers.set(event, handler); },
      emit(event, payload) { events.push({ event, payload: jsonCopy(payload) }); },
      async send(event, payload) {
        assert.ok(handlers.has(event), `Missing socket handler: ${event}`);
        let acknowledged;
        await handlers.get(event)(jsonCopy(payload), (reply) => { acknowledged = jsonCopy(reply); });
        return acknowledged;
      },
      snapshot() {
        const state = events.filter((entry) => entry.event === "tabletop:state").at(-1);
        assert.ok(state, "The server should send a campaign snapshot");
        return state.payload;
      },
    };
    namespace.sockets.set(id, socket);
    connectHandler(socket);
    return socket;
  }

  return { system, connect, requests };
}

async function login(socket, username, register = true) {
  if (register) await socket.send("auth:register", { username, password: "test-password" });
  await socket.send("auth:login", { username, password: "test-password" });
  assert.equal(socket.snapshot().auth.user.username, username);
}

async function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "gairos-monster-integration-"));
  t.after(() => {
    fs.unlinkSync(path.join(directory, "state.json"));
    fs.rmdirSync(directory);
  });
  const harness = createHarness(directory);
  const dm = harness.connect("dm");
  await login(dm, "Test DM");
  await dm.send("campaign:create", { name: "Monster regression campaign" });
  assert.equal(dm.snapshot().auth.campaignRole, "dm");
  return { ...harness, directory, dm, campaignId: dm.snapshot().auth.campaignId };
}

function monster(overrides = {}) {
  return MonsterRules.createMonster("2", {
    name: "Marsh Watcher", description: "A Large beast with antlers and mossy fur.",
    averageSkillBonus: 3.25, hp: 42, mana: 0, speed: 40,
    skills: { stealth: -1.5, perception: 0 }, ...overrides,
  });
}

test("generated monsters retain all skills, source defaults and inferred size through save and restart", async (t) => {
  const { directory, system, dm, campaignId, requests } = await setup(t);
  const supplied = monster();
  const requestCount = requests.length;
  const reply = await dm.send("statblock:save", { mode: "generated", monster: supplied, tokenImage: "data:image/png;base64,dGVzdA==" });
  assert.equal(reply.ok, true);
  const saved = dm.snapshot().statblocks.find((entry) => entry.id === reply.id);
  assert.equal(saved.mode, "generated");
  assert.equal(saved.name, "Marsh Watcher");
  assert.equal(Object.keys(saved.monster.skills).length, 28);
  assert.equal(Object.keys(saved.parsedSheet.skills).length, 28);
  for (const skill of MonsterRules.skills) {
    assert.equal(saved.parsedSheet.skills[skill.key], supplied.skills[skill.key], skill.label);
  }
  assert.equal(saved.monster.attackBonus, 6.5);
  assert.equal(saved.monster.ac, 16.5);
  assert.equal(saved.parsedSheet.skills["melee weapons"], 6.5);
  assert.equal(saved.parsedSheet.skills["resist condition"], 6);
  assert.equal(saved.parsedSheet.skills["knowledge (biology)"], 3.25);
  assert.equal(saved.parsedSheet.skills.stealth, -1.5);
  assert.equal(saved.parsedSheet.skills.perception, 0);
  assert.equal(saved.parsedSheet.currentValues.mana, 0);
  assert.equal(saved.monster.size, "auto");
  assert.equal(saved.parsedSheet.tokenSize, "large");
  assert.equal(saved.parsedSheet.maxHp, 42);
  assert.equal(requests.length, requestCount, "Generated monsters should not fetch a character sheet");

  system.forceSave();
  const disk = JSON.parse(fs.readFileSync(path.join(directory, "state.json"), "utf8"));
  assert.deepEqual(disk.campaigns.find((entry) => entry.id === campaignId).statblocks[0].monster, supplied);
  const reopened = createHarness(directory);
  const returningDm = reopened.connect("returning-dm");
  await login(returningDm, "Test DM", false);
  await returningDm.send("campaign:join", { campaignId });
  const restored = returningDm.snapshot().statblocks.find((entry) => entry.id === reply.id);
  assert.deepEqual(restored.monster, supplied);
  assert.equal(restored.parsedSheet.tokenSize, "large");
  assert.equal(restored.tokenImage, saved.tokenImage);
  const updated = { ...restored.monster, name: "Marsh Watcher Elder", hp: 56 };
  const editReply = await returningDm.send("statblock:save", { id: restored.id, mode: "generated", monster: updated, tokenImage: restored.tokenImage });
  assert.deepEqual(editReply, { ok: true, id: restored.id });
  assert.equal(returningDm.snapshot().statblocks.length, 1);
  assert.equal(returningDm.snapshot().statblocks[0].parsedSheet.maxHp, 56);
});

test("placing a generated token uses its size, full HP and movement, then preserves damage after restart", async (t) => {
  const { directory, system, dm, campaignId } = await setup(t);
  const reply = await dm.send("statblock:save", { mode: "generated", monster: monster() });
  await dm.send("token:place", { sourceType: "statblock", sourceId: reply.id, x: 4, y: 5 });
  const token = dm.snapshot().scene.map.tokens[0];
  assert.equal(token.name, "Marsh Watcher");
  assert.equal(token.tokenSize, "large");
  assert.equal(token.movementMax, 40);
  assert.equal(token.hp.max, 42);
  assert.equal(token.hp.current, 42);
  await dm.send("token:updateHp", { tokenId: token.id, current: 17 });
  assert.equal(dm.snapshot().scene.map.tokens[0].hp.current, 17);
  system.forceSave();
  const reopened = createHarness(directory);
  const returningDm = reopened.connect("returning-dm");
  await login(returningDm, "Test DM", false);
  await returningDm.send("campaign:join", { campaignId });
  const restored = returningDm.snapshot().scene.map.tokens[0];
  assert.equal(restored.tokenSize, "large");
  assert.equal(restored.hp.max, 42);
  assert.equal(restored.hp.current, 17);
});

test("players cannot create or overwrite generated monsters and invalid DM drafts leave saved data intact", async (t) => {
  const { connect, dm, campaignId } = await setup(t);
  const saved = await dm.send("statblock:save", { mode: "generated", monster: monster() });
  const player = connect("player");
  await login(player, "Test Player");
  await player.send("campaign:join", { campaignId });
  assert.equal(player.snapshot().auth.campaignRole, "player");
  const before = dm.snapshot().statblocks;
  for (const id of [undefined, saved.id]) {
    const rejected = await player.send("statblock:save", { id, mode: "generated", monster: monster({ name: "Unauthorized" }) });
    assert.equal(rejected.ok, false);
    assert.match(rejected.error, /DM/);
  }
  for (const invalid of [
    { ...monster(), hp: null },
    { ...monster(), skills: { ...monster().skills, perception: null } },
    { ...monster(), name: "" },
  ]) {
    const rejected = await dm.send("statblock:save", { id: saved.id, mode: "generated", monster: invalid });
    assert.equal(rejected.ok, false);
  }
  assert.deepEqual(dm.snapshot().statblocks, before);
});

test("manual statblocks and PC-style spreadsheet characters remain separate from generated monsters", async (t) => {
  const { dm, connect, campaignId, requests } = await setup(t);
  const manualText = "HP: 25\nSize: Small\nSpeed: 25\nStrength: -2\nInitiative: 3.5\n";
  const manualReply = await dm.send("statblock:save", { mode: "manual", name: "Manual creature", manualText });
  assert.equal(manualReply.ok, true);
  const importedReply = await dm.send("statblock:save", { mode: "sheet", name: "Sheet creature", sheetUrl });
  assert.equal(importedReply.ok, true);
  const manual = dm.snapshot().statblocks.find((entry) => entry.id === manualReply.id);
  const imported = dm.snapshot().statblocks.find((entry) => entry.id === importedReply.id);
  assert.equal(manual.mode, "manual");
  assert.equal(manual.monster, undefined);
  assert.equal(manual.manualText, manualText);
  assert.equal(manual.parsedSheet.maxHp, 25);
  assert.equal(manual.parsedSheet.tokenSize, "small");
  assert.equal(manual.parsedSheet.skills.strength, -2);
  assert.equal(imported.mode, "sheet");
  assert.equal(imported.monster, undefined);
  assert.equal(imported.sheetUrl, sheetUrl);
  assert.equal(imported.sheetError, null);
  assert.equal(imported.parsedSheet.maxHp, 31);
  assert.equal(imported.parsedSheet.skills["melee weapons"], 8.5);

  const player = connect("pc-player");
  await login(player, "PC Player");
  await player.send("campaign:join", { campaignId });
  await player.send("character:save", { name: "Spreadsheet hero", sheetUrl });
  const pc = player.snapshot().characters.find((entry) => entry.name === "Spreadsheet hero");
  assert.equal(pc.sheetUrl, sheetUrl);
  assert.equal(pc.parsedSheet.maxHp, 31);
  assert.equal(pc.parsedSheet.currentValueMeta.hp.currentValue, 19);
  assert.equal(pc.parsedSheet.skills["melee weapons"], 8.5);
  assert.deepEqual(pc.parsedSheet.feats, ["Tough"]);
  await dm.send("statblock:save", { mode: "generated", monster: monster() });
  assert.deepEqual(player.snapshot().characters.find((entry) => entry.id === pc.id), pc);
  assert.equal(player.snapshot().statblocks.length, 3);
  assert.ok(requests.some((url) => url.includes("test-character-sheet-123456789")), "Existing sheet parsers should use the offline CSV fixture");
});
