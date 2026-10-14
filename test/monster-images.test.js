const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { once } = require("node:events");
const { test } = require("node:test");
const express = require("express");
const {
  MONSTER_IMAGE_MODEL,
  createMonsterImageService,
  createMonsterImageRouter,
  loadLocalEnv,
} = require("../server/game/monster-images");

const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6D8sAAAAASUVORK5CYII=";
const success = () => ({ ok: true, json: async () => ({ data: [{ b64_json: png }] }) });

async function withApi(service, run) {
  const app = express();
  app.use("/api/dm/monster-image", createMonsterImageRouter({
    isDm: (req) => req.headers.cookie === "gairos-dm-auth=test-password",
    service,
  }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${server.address().port}/api/dm/monster-image`;
  const headers = { Cookie: "gairos-dm-auth=test-password", "Content-Type": "application/json" };
  try {
    await run(url, headers);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("one image request uses the server key and returns transparent PNG artwork", async () => {
  const calls = [];
  const service = createMonsterImageService({
    apiKey: "test-secret",
    fetchImpl: async (...args) => { calls.push(args); return success(); },
  });
  const image = await service.generate({ name: "Swamp drake", description: "Green scales, broad horns", statblock: { size: "Large" } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "https://api.openai.com/v1/images/generations");
  assert.equal(calls[0][1].headers.Authorization, "Bearer test-secret");
  const request = JSON.parse(calls[0][1].body);
  assert.equal(request.model, MONSTER_IMAGE_MODEL);
  assert.equal(request.n, 1);
  assert.equal(request.background, "transparent");
  assert.equal(request.output_format, "png");
  assert.equal(request.size, "1024x1024");
  assert.match(request.prompt, /Swamp drake/);
  assert.match(request.prompt, /Green scales/);
  assert.doesNotMatch(request.prompt, /test-secret/);
  assert.deepEqual(image, { imageDataUrl: `data:image/png;base64,${png}`, model: MONSTER_IMAGE_MODEL });
  assert.deepEqual(service.configuration(), { available: true, model: MONSTER_IMAGE_MODEL });
});

test("DM authentication gates both configuration and paid generation", async () => {
  let calls = 0;
  const service = createMonsterImageService({ apiKey: "test-secret", fetchImpl: async () => { calls += 1; return success(); } });
  await withApi(service, async (url, headers) => {
    for (const method of ["GET", "POST"]) {
      const unauthorized = await fetch(url, { method });
      assert.equal(unauthorized.status, 401);
      assert.equal((await unauthorized.json()).code, "dm_required");
    }
    assert.equal(calls, 0);
    const config = await fetch(url, { headers });
    assert.equal(config.status, 200);
    assert.equal(config.headers.get("cache-control"), "no-store");
    assert.deepEqual(await config.json(), { available: true, model: MONSTER_IMAGE_MODEL });
    const image = await fetch(url, { method: "POST", headers, body: JSON.stringify({ name: "Wolf" }) });
    assert.equal(image.status, 200);
    assert.equal((await image.json()).imageDataUrl, `data:image/png;base64,${png}`);
    assert.equal(calls, 1);
  });
});

test("cross-origin requests and invalid bodies cannot trigger generation", async () => {
  let calls = 0;
  const service = createMonsterImageService({ apiKey: "test-secret", fetchImpl: async () => { calls += 1; return success(); } });
  await withApi(service, async (url, headers) => {
    const cases = [
      { headers: { ...headers, Origin: "https://other.example" }, body: '{"name":"Wolf"}', status: 403 },
      { headers: { ...headers, "Content-Type": "text/plain" }, body: '{"name":"Wolf"}', status: 415 },
      { headers, body: "{", status: 400 },
      { headers, body: JSON.stringify({ name: 42 }), status: 400 },
      { headers, body: JSON.stringify({}), status: 400 },
      { headers, body: JSON.stringify({ name: "Wolf", description: "x".repeat(4001) }), status: 400 },
      { headers, body: JSON.stringify({ name: "Wolf", statblock: "x".repeat(8001) }), status: 400 },
      { headers, body: JSON.stringify({ name: "Wolf", description: "x".repeat(17000) }), status: 413 },
    ];
    for (const entry of cases) {
      const response = await fetch(url, { method: "POST", headers: entry.headers, body: entry.body });
      assert.equal(response.status, entry.status);
      assert.equal(typeof (await response.json()).error, "string");
    }
    assert.equal(calls, 0);
  });
});

test("missing API configuration never calls OpenAI", async () => {
  const service = createMonsterImageService({ apiKey: "", fetchImpl: () => assert.fail("Unexpected paid request") });
  assert.equal(service.configuration().available, false);
  await assert.rejects(service.generate({ name: "Wolf" }), (error) => error.status === 503 && error.code === "not_configured");
});

test("an in-flight generation blocks a second request and releases after completion", async () => {
  let finish;
  let calls = 0;
  const service = createMonsterImageService({
    apiKey: "test-secret",
    fetchImpl: () => { calls += 1; return new Promise((resolve) => { finish = resolve; }); },
  });
  const first = service.generate({ name: "Wolf" });
  await assert.rejects(service.generate({ name: "Dragon" }), (error) => error.status === 429 && error.code === "generation_busy");
  assert.equal(calls, 1);
  finish(success());
  await first;
  const next = service.generate({ name: "Dragon" });
  finish(success());
  await next;
  assert.equal(calls, 2);
});

test("provider and network failures are sanitized and never automatically retried", async () => {
  for (const status of [400, 401, 403, 429, 500]) {
    let calls = 0;
    const service = createMonsterImageService({
      apiKey: "test-secret",
      fetchImpl: async () => {
        calls += 1;
        return { ok: false, status, json: async () => ({ error: { message: "test-secret private diagnostics" } }) };
      },
    });
    await assert.rejects(service.generate({ name: "Wolf" }), (error) => {
      assert.doesNotMatch(error.message, /test-secret|private diagnostics/);
      return error.status >= 400;
    });
    assert.equal(calls, 1);
  }
  let calls = 0;
  const service = createMonsterImageService({
    apiKey: "test-secret",
    fetchImpl: async () => { calls += 1; if (calls === 1) throw new Error("test-secret network failure"); return success(); },
  });
  await assert.rejects(service.generate({ name: "Wolf" }), (error) => error.code === "generation_failed" && !error.message.includes("test-secret"));
  assert.equal(calls, 1);
  await service.generate({ name: "Wolf" });
  assert.equal(calls, 2);
});

test("timeout aborts a single request and permits another explicit generation", async () => {
  let calls = 0;
  const service = createMonsterImageService({
    apiKey: "test-secret",
    timeoutMs: 10,
    fetchImpl: async (url, options) => {
      calls += 1;
      if (calls > 1) return success();
      return new Promise((resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
    },
  });
  await assert.rejects(service.generate({ name: "Wolf" }), (error) => error.status === 504 && error.code === "generation_timeout");
  assert.equal(calls, 1);
  await service.generate({ name: "Wolf" });
  assert.equal(calls, 2);
});

test("missing and non-PNG image results are rejected without retrying", async () => {
  for (const body of [{}, { data: [{ b64_json: Buffer.from("<svg></svg>").toString("base64") }] }]) {
    let calls = 0;
    const service = createMonsterImageService({
      apiKey: "test-secret",
      fetchImpl: async () => { calls += 1; return { ok: true, json: async () => body }; },
    });
    await assert.rejects(service.generate({ name: "Wolf" }), (error) => error.code === "invalid_image");
    assert.equal(calls, 1);
  }
});

test("local .env loading preserves process values and only consumes the API key", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "gairos-env-test-"));
  const filename = path.join(directory, ".env");
  try {
    fs.writeFileSync(filename, "OTHER_SECRET=not-loaded\nexport OPENAI_API_KEY = 'test-file-key' # comment\n");
    const environment = {};
    loadLocalEnv(filename, environment);
    assert.deepEqual(environment, { OPENAI_API_KEY: "test-file-key" });
    const overridden = { OPENAI_API_KEY: "test-process-key" };
    loadLocalEnv(filename, overridden);
    assert.deepEqual(overridden, { OPENAI_API_KEY: "test-process-key" });
    fs.writeFileSync(filename, "OPENAI_API_KEY=\nOTHER_SECRET=never-use-this\n");
    const empty = {};
    loadLocalEnv(filename, empty);
    assert.deepEqual(empty, { OPENAI_API_KEY: "" });
    assert.doesNotThrow(() => loadLocalEnv(path.join(directory, "missing.env"), {}));
  } finally {
    fs.unlinkSync(filename);
    fs.rmdirSync(directory);
  }
});
