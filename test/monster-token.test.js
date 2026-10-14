const assert = require("node:assert/strict");
const { subjectFrame } = require("../public/monster-token");
const pixels = new Uint8ClampedArray(100 * 100 * 4);
for (let y = 5; y < 45; y++) for (let x = 65; x < 95; x++) pixels[(y * 100 + x) * 4 + 3] = 255;
const frame = subjectFrame(pixels, 100, 100);
assert.deepEqual(frame, { x: 80, y: 25, radius: 25 });
// An off-center subject's extremities remain inside the safe circle.
assert.ok(Math.hypot(65 - frame.x, 5 - frame.y) <= frame.radius);
pixels.fill(255);
assert.equal(subjectFrame(pixels, 100, 100).radius, Math.hypot(100, 100) / 2);
pixels.fill(0);
assert.ok(Number.isFinite(subjectFrame(pixels, 100, 100).radius));
console.log("Monster token framing tests passed.");
