// Optional full-app smoke test. Requires Playwright and a local Chrome install.
// Uses an isolated temporary campaign directory; never loads .env or calls OpenAI.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const express = require("express");
const { Server } = require("socket.io");
const { chromium } = require("playwright");
const { createTabletopSystem } = require("../server/game/tabletop");

(async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "gairos-browser-"));
  let browser, server, io;
  try {
    global.fetch = async () => ({ ok: true, text: async () => "" });
    const app = express();
    app.get("/api/dm/monster-image", (req, res) => res.json({ available: false, model: "test" }));
    app.use(express.static(path.resolve(__dirname, "../public")));
    server = http.createServer(app);
    io = new Server(server);
    const system = createTabletopSystem(io, { dataDirectory: temporary, textureLibraryRoot: temporary });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
    const dm = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    dm.on("pageerror", (error) => errors.push(error.message));
    await dm.goto(`${url}/dm-tabletop.html`);
    await dm.locator("#register-username").fill("BuilderDM");
    await dm.locator("#register-password").fill("test-password");
    await dm.locator('#register-form button').click();
    await dm.waitForFunction(() => document.querySelector("#main-status").textContent.includes("Account created"));
    await dm.locator("#login-username").fill("BuilderDM");
    await dm.locator("#login-password").fill("test-password");
    await dm.locator('#login-form button').click();
    await dm.locator("#logout-button").waitFor({ state: "visible" });
    await dm.locator("#rail-campaigns").click();
    await dm.locator("#campaign-name").fill("Monster test campaign");
    await dm.locator("#campaign-create").click();
    await dm.waitForFunction(() => document.querySelector("#campaign-list").textContent.includes("Monster test campaign"));
    await dm.locator("#rail-character").click();
    await dm.locator(".monster-launch").click();
    await dm.locator('.monster-dialog [name="name"]').fill("Ashwood stalker");
    await dm.locator('.monster-dialog [name="hp"]').fill("42");
    await dm.locator('.monster-dialog [name="creatureType"]').fill("Large beast");
    await dm.locator('.monster-dialog [name="skill:stealth"]').fill("12");
    await dm.locator('.monster-dialog button[type="submit"]').click();
    await dm.locator(".monster-dialog").waitFor({ state: "hidden" });
    const entry = dm.locator("#statblock-list .tt-list-item").filter({ hasText: "Ashwood stalker" });
    await entry.waitFor();
    await entry.getByRole("button", { name: "Edit", exact: true }).click();
    assert.equal(await dm.locator('.monster-dialog [name="hp"]').inputValue(), "42");
    assert.equal(await dm.locator('.monster-dialog [name="skill:stealth"]').inputValue(), "12");
    assert.match(await dm.locator("#monster-size-note").innerText(), /Large/);
    await dm.locator('.monster-dialog [data-action="close"]').first().click();
    await dm.locator("#rail-tokens").click();
    assert.match(await dm.locator("#token-roster").innerText(), /Ashwood stalker/);
    const campaign = system.getState().campaigns.find((item) => item.name === "Monster test campaign");
    assert.equal(campaign.statblocks[0].parsedSheet.tokenSize, "large");
    assert.equal(Object.keys(campaign.statblocks[0].parsedSheet.skills).length, 28);
    const player = await browser.newPage({ viewport: { width: 390, height: 844 } });
    player.on("pageerror", (error) => errors.push(error.message));
    await player.goto(`${url}/tabletop.html`);
    await player.locator("#rail-character").click();
    assert.equal(await player.locator(".monster-launch").isVisible(), false);
    assert.equal(await player.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    console.log("Full app browser smoke passed: DM create/save/reopen, all skills, inferred size, palette, player visibility, mobile layout.");
  } finally {
    if (browser) await browser.close();
    if (io) await new Promise((resolve) => io.close(resolve));
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    const resolved = path.resolve(temporary);
    if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith("gairos-browser-")) fs.rmSync(resolved, { recursive: true, force: true });
  }
})().then(() => process.exit(0), (error) => { console.error(error); process.exit(1); });
