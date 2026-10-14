// Optional browser integration check: install Playwright or expose it with NODE_PATH.
// Uses mocked HTTP and a save callback; it does not touch campaign data or call OpenAI.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const root = path.resolve(__dirname, "../public");
  await page.route("https://gairos.test/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/") return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/tabletop.css"><link rel="stylesheet" href="/monster-builder.css"></head><body><button id="launch">Open builder</button><script src="/monster-rules.js"></script><script src="/monster-token.js"></script><script src="/monster-builder.js"></script></body></html>` });
    const type = pathname.endsWith('.css') ? 'text/css' : pathname.endsWith('.html') ? 'text/html' : pathname.endsWith('.svg') ? 'image/svg+xml' : 'application/javascript';
    return route.fulfill({ contentType: `${type}; charset=utf-8`, body: fs.readFileSync(path.join(root, pathname)) });
  });
  await page.goto("https://gairos.test/");
  await page.evaluate(() => {
    window.testState = { dm: true, saves: [], imageRequests: 0, saveRequests: 0, failImage: false, failSave: false, holdSave: false };
    const image = document.createElement("canvas");
    image.width = 300; image.height = 200;
    const ctx = image.getContext("2d");
    ctx.fillStyle = "#ff0000"; ctx.fillRect(170, 20, 80, 150);
    window.testState.artwork = image.toDataURL("image/png");
    window.fetch = async (_url, options = {}) => {
      if (options.method === "POST") {
        window.testState.imageRequests += 1;
        window.testState.lastImageBody = JSON.parse(options.body);
        if (window.testState.failImage) return { ok: false, json: async () => ({ error: "Mock image service unavailable" }) };
        return { ok: true, json: async () => ({ imageDataUrl: window.testState.artwork }) };
      }
      return { ok: true, json: async () => ({ available: true, model: "test-image-model" }) };
    };
    GairosMonsterBuilder.configure({ isDm: () => window.testState.dm, onSave: async (value) => {
      window.testState.saveRequests += 1;
      if (window.testState.failSave) throw new Error("Mock save failed");
      if (window.testState.holdSave) await new Promise((resolve) => { window.testState.resolveSave = resolve; });
      window.testState.saves.push(value);
    } });
  });
  const open = (saved) => page.evaluate((value) => GairosMonsterBuilder.open(value), saved);
  const field = (name) => page.locator(`[name="${name}"]`);
  const action = (name) => page.locator(`[data-action="${name}"]`).first();
  await open();
  assert.equal(await page.locator('#monster-skill-inputs input').count(), 28);
  assert.equal(await page.locator('.monster-skill-preview > div').count(), 28);
  assert.equal(await field("ac").inputValue(), "15.5");
  assert.equal(await field("attackBonus").inputValue(), "5.5");
  assert.equal(await field("skill:athletics").getAttribute("placeholder"), "4.75");
  await page.evaluate(() => {
    MonsterRules.skills.forEach((skill, index) => {
      const input = document.querySelector(`[name="skill:${skill.key}"]`);
      input.value = 20 + index;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
  const editedSkills = await page.locator('.monster-skill-preview dd').allTextContents();
  assert.deepEqual(editedSkills, Array.from({length: 28}, (_, index) => `+${20 + index}`));
  await field("name").fill("Ashwood stalker <test>");
  await field("hp").fill("45");
  await field("averageSkillBonus").fill("7");
  await field("skill:perception").fill("19");
  assert.equal(await field("skill:athletics").getAttribute("placeholder"), "7");
  await field("description").fill("A huge beast with a tall antlered head.");
  assert.match(await page.locator('#monster-size-note').innerText(), /Huge/);
  assert.match(await page.locator('.monster-statblock h3').innerText(), /<test>/);
  assert.equal(await page.locator('.monster-statblock test').count(), 0);
  await field("cr").selectOption("3");
  await action("baseline").click();
  assert.equal(await field("ac").inputValue(), "17.5");
  assert.equal(await field("name").inputValue(), "Ashwood stalker <test>");
  assert.equal(await field("hp").inputValue(), "45");
  await field("averageSkillBonus").fill("7");
  await field("skill:perception").fill("19");
  await action("generate").click();
  await page.waitForFunction(() => document.querySelector('.monster-status').textContent.startsWith('Token ready'));
  assert.equal(await page.evaluate(() => testState.imageRequests), 1);
  assert.match(await page.evaluate(() => testState.lastImageBody.statblock), /Perception: 19/);
  const pixels = await page.locator(".monster-token-display canvas").evaluate((canvas) => {
    const ctx = canvas.getContext("2d");
    return { corner: Array.from(ctx.getImageData(0, 0, 1, 1).data), center: Array.from(ctx.getImageData(256, 256, 1, 1).data) };
  });
  assert.equal(pixels.corner[3], 0, "Token corners should be transparent");
  assert(pixels.center[0] > 240 && pixels.center[1] < 20, "Off-center artwork should be centered in the token");
  await page.evaluate(() => { testState.holdSave = true; });
  await page.locator('.monster-workshop button[type="submit"]').click();
  await page.locator('.monster-workshop').evaluate(form => form.requestSubmit());
  assert.equal(await page.evaluate(() => testState.saveRequests), 1, "Repeated submit should not duplicate a pending save");
  await page.evaluate(() => { testState.holdSave = false; testState.resolveSave(); });
  await page.waitForFunction(() => !document.querySelector("dialog").open);
  const saved = await page.evaluate(() => testState.saves[0]);
  assert.equal(saved.mode, "generated");
  assert.equal(Object.keys(saved.monster.skills).length, 28);
  assert.equal(saved.monster.skills.perception, 19);
  assert.equal(saved.monster.skills.athletics, 7);
  assert.equal(saved.monster.skills["melee weapons"], 7.5);
  assert.match(saved.tokenImage, /^data:image\/png;base64,/);
  await open({ ...saved, id: "saved-monster" });
  assert.equal(await field("name").inputValue(), "Ashwood stalker <test>");
  assert.equal(await field("skill:perception").inputValue(), "19");
  assert.equal(await field("skill:athletics").inputValue(), "", "Inherited skill should remain editable through the default after reopening");
  await field("averageSkillBonus").fill("9");
  assert.equal(await field("skill:athletics").getAttribute("placeholder"), "9");
  await field("description").fill("");
  await field("heightFeet").fill("12");
  assert.match(await page.locator('#monster-size-note').innerText(), /Large/);
  await field("spaceFeet").fill("15");
  assert.match(await page.locator('#monster-size-note').innerText(), /Huge/);
  await field("size").selectOption("small");
  assert.match(await page.locator('#monster-size-note').innerText(), /Small/);
  await field("size").selectOption("auto");
  assert.equal(await page.locator('.monster-saved-token').isVisible(), true);
  await page.evaluate(() => { testState.failSave = true; });
  await page.locator('.monster-workshop button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('.monster-status').textContent === 'Mock save failed');
  assert.equal(await page.locator("dialog").evaluate((dialog) => dialog.open), true);
  await page.evaluate(() => { testState.failImage = true; });
  await action("generate").click();
  await page.waitForFunction(() => document.querySelector('.monster-status').textContent === 'Mock image service unavailable');
  assert.equal(await action("generate").isEnabled(), true);
  await field("ac").fill("-1");
  assert.match(await page.locator('.monster-status').innerText(), /AC must be/);
  await field("ac").fill("17.5");
  assert.equal(await page.locator('.monster-status').innerText(), "", "Corrected validation errors should clear");
  for (const [width, height] of [[1280,900],[768,1024],[390,844],[320,640]]) {
    await page.setViewportSize({width, height});
    const overflow = await page.locator("dialog").evaluate((dialog) => ({ width: dialog.clientWidth, scroll: dialog.scrollWidth }));
    assert(overflow.scroll <= overflow.width + 1, `Dialog overflow at ${width}px: ${JSON.stringify(overflow)}`);
  }
  if (process.env.GAIROS_TEST_ARTWORK) {
    await field("artwork").setInputFiles(path.resolve(process.env.GAIROS_TEST_ARTWORK));
    await page.waitForFunction(() => document.querySelector('.monster-status').textContent.startsWith('Artwork centered'));
    if (process.env.GAIROS_TEST_OUTPUT_DIR) {
      const output = path.resolve(process.env.GAIROS_TEST_OUTPUT_DIR);
      fs.mkdirSync(output, {recursive: true});
      const token = await page.locator('.monster-token-display canvas').evaluate(canvas => canvas.toDataURL('image/png'));
      fs.writeFileSync(path.join(output, 'monster-live-token.png'), Buffer.from(token.split(',')[1], 'base64'));
      await page.setViewportSize({width: 1280, height: 1000});
      await field('name').fill('Silver-antler owl');
      await field('creatureType').fill('Beast');
      await field('size').selectOption('small');
      await page.locator('dialog').evaluate(dialog => { dialog.scrollTop = 0; });
      await page.screenshot({path: path.join(output, 'monster-builder.png')});
    }
  }
  await page.evaluate(() => { testState.dm = false; GairosMonsterBuilder.syncRole(); });
  assert.equal(await page.locator("dialog").evaluate((dialog) => dialog.open), false);
  await open();
  assert.equal(await page.locator("dialog").evaluate((dialog) => dialog.open), false);
  await page.evaluate(() => {
    testState.dm = true;
    testState.configResponses = [];
    window.fetch = () => new Promise(resolve => testState.configResponses.push(resolve));
    GairosMonsterBuilder.open();
  });
  assert.equal(await action('generate').isDisabled(), true, 'Generate waits for availability');
  await action('close').click();
  await page.evaluate(() => { GairosMonsterBuilder.open(); });
  await page.evaluate(() => {
    testState.configResponses[1]({ok: true, json: async()=>({available: false, model: 'latest-config'})});
  });
  await page.waitForFunction(() => document.querySelector('#monster-image-note').textContent.includes('Set OPENAI_API_KEY'));
  await page.evaluate(() => {
    testState.configResponses[0]({ok: true, json: async()=>({available: true, model: 'stale-config'})});
  });
  assert.equal(await action('generate').isDisabled(), true, 'A stale configuration must not enable generation in a new dialog');
  assert.deepEqual(errors, [], "No uncaught browser errors");
  console.log("Monster builder browser checks passed: baseline, 28 skills, preview, size, image/canvas, save/reopen, failures, role guard, responsive layout.");
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
