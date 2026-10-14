"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const rules = require("../public/monster-rules");

test("CR snapshots preserve the source's fractional values and its missing average-stat column", () => {
  assert.equal(rules.averages.length, 21);
  assert.deepEqual(rules.averageFor("CR 1"), {
    cr: "1", attackBonus: 5.5, averageSave: 4.75, ac: 15.5, saveDc: 13.5, averageStat: null, sourceRow: 5,
  });
  assert.equal(rules.averageFor("18").attackBonus, 27.5);
  assert.equal(rules.averageFor("18").averageSave, 26);
  assert.equal(rules.averageFor("18").sourceRow, 22);
  assert.equal(rules.averageFor("19"), null); // C23 has a number but no CR label.
  assert.ok(rules.averages.every((entry) => entry.averageStat === null));
  assert.match(rules.sources.averages.note, /no values or formulas/);
});

test("fractional CR input maps only to an actual source row", () => {
  for (const cr of ["1/4", "0.25", 0.25, "¼", "CR 1 / 4"]) assert.equal(rules.createMonster(cr).cr, "1/4");
  for (const cr of ["1/2", "0.5", 0.5, "½"]) assert.equal(rules.createMonster(cr).cr, "1/2");
  assert.throws(() => rules.createMonster(0.75), /source table/);
  assert.throws(() => rules.createMonster(20), /source table/);
});

test("the generator includes every current major and minor skill without inventing missing defaults", () => {
  const monster = rules.createMonster("2");
  assert.equal(rules.skills.filter((skill) => skill.group === "major").length, 11);
  assert.equal(rules.skills.filter((skill) => skill.group === "minor").length, 17);
  assert.equal(Object.keys(monster.skills).length, 28);
  assert.equal(monster.skills["melee weapons"], 6.5);
  assert.equal(monster.skills["ranged weapons"], 6.5);
  assert.equal(monster.skills["dodge"], 6);
  assert.equal(monster.skills["resist condition"], 6);
  assert.equal(monster.skills["resistive willpower"], 6);
  assert.equal(monster.skills["knowledge (biology)"], null);
  assert.equal(monster.skills["health pool"], null);
  assert.equal(monster.hp, null);
  assert.equal(monster.mana, null);
  assert.equal(monster.averageSkillBonus, null);
});

test("a DM baseline fills unspecified skills while retaining skill overrides and intentional blanks", () => {
  const monster = rules.createMonster("3", {
    averageSkillBonus: 7.25,
    skills: { "Knowledge (Lore)": 0, stealth: -2.5, perception: "", "resist pain": null },
  });
  assert.equal(monster.skills["knowledge (lore)"], 0);
  assert.equal(monster.skills.stealth, -2.5);
  assert.equal(monster.skills.perception, null);
  assert.equal(monster.skills["resist pain"], null);
  assert.equal(monster.skills.athletics, 7.25);
  assert.equal(monster.skills["melee weapons"], 7.5);
  assert.equal(monster.skills.dodge, 7.25);
  assert.deepEqual(rules.normalizeMonster(monster), monster);
});

test("normalization rejects malformed numbers and unsupported sizes", () => {
  assert.throws(() => rules.normalizeMonster({ hp: 0 }), /HP/);
  assert.throws(() => rules.normalizeMonster({ mana: -1 }), /Mana/);
  assert.throws(() => rules.normalizeMonster({ averageSkillBonus: false }), /Average skill bonus/);
  assert.throws(() => rules.normalizeMonster({ skills: { strength: "10 feet" } }), /Strength/);
  assert.throws(() => rules.normalizeMonster({ speed: Infinity }), /Speed/);
  assert.throws(() => rules.normalizeMonster({ size: "enormous" }), /Size Categories/);
  assert.equal(rules.normalizeMonster({ skills: null }).skills.strength, null);
  assert.equal(rules.normalizeMonster({ ac: 0, speed: 0, reach: 0, mana: 0 }).mana, 0);
});

test("all nine source size categories preserve their actual footprint and natural reach", () => {
  assert.deepEqual(rules.sizes.map((size) => size.tokenSquares), [0.1, 0.2, 0.5, 1, 1, 2, 3, 4, 6]);
  assert.equal(rules.sizes.find((size) => size.key === "large").reachTallFeet, 10);
  assert.equal(rules.sizes.find((size) => size.key === "large").reachLongFeet, 5);
  assert.equal(rules.sizes.find((size) => size.key === "colossal").spaceFeet, 30);
  assert.equal(rules.canonicalSize("Colossal and Colossal+"), "colossal");
});

test("size inference prioritizes the explicit statblock size over descriptive text", () => {
  const size = rules.inferSize({ size: "Tiny", description: "A huge dragon", space: "15 ft" });
  assert.equal(size.size, "tiny");
  assert.equal(size.tokenSquares, 0.5);
  assert.equal(size.needsReview, false);
  assert.equal(size.inferred, false);
  assert.equal(rules.inferSize("Name: Hyena\nSize: large\nHP: 45").size, "large");
  assert.equal(rules.inferSize({ parsedSheet: { currentValues: { size: "gargantuan" } } }).size, "gargantuan");
});

test("automatic size can come from a creature description, space, height or length", () => {
  assert.equal(rules.inferSize({ creatureType: "Large Phyrexian Monstrosity" }).size, "large");
  assert.equal(rules.inferSize({ description: "A diminutive construct made of bronze." }).size, "diminutive");
  assert.equal(rules.inferSize({ space: "15 ft." }).size, "huge");
  assert.equal(rules.inferSize({ height: "12 feet" }).size, "large");
  assert.equal(rules.inferSize({ length: "18 in." }).size, "tiny");
  assert.equal(rules.inferSize({ height: "70 ft" }).size, "colossal");
  assert.equal(rules.inferSize({ space: "5 ft", height: "3 ft" }).size, "small");
});

test("ambiguous dimensions and absent size evidence remain visible for DM review", () => {
  assert.equal(rules.inferSize({ space: "5 ft" }).needsReview, true);
  const boundary = rules.inferSize({ height: "8 ft" });
  assert.equal(boundary.needsReview, true);
  assert.match(boundary.reason, /Medium \/ Large boundary/);
  const unknown = rules.inferSize({ cr: 18, skills: { strength: 100 }, reach: 30, name: "Giant Spider" });
  assert.equal(unknown.size, "medium");
  assert.equal(unknown.needsReview, true);
  assert.match(unknown.reason, /CR and Strength do not determine size/);
  assert.equal(rules.inferSize({ description: "Has a huge appetite and small eyes" }).needsReview, true);
});

test("generated reach follows size while explicit zero or other reach remains editable", () => {
  assert.equal(rules.createMonster(3, { size: "large" }).reach, 10);
  assert.equal(rules.createMonster(3, { size: "tiny" }).reach, 0);
  assert.equal(rules.createMonster(3, { size: "large", reach: 5 }).reach, 5);
  assert.equal(rules.createMonster(3, { description: "A Huge beast" }).reach, 15);
});

test("manual serialization preserves all supplied skills, fractional stats and zero without adding missing HP", () => {
  const monster = rules.createMonster(1, { averageSkillBonus: 0, size: "small", mana: 0, skills: { stealth: -1.5 } });
  const text = rules.toManualText(monster);
  for (const skill of rules.skills) assert.ok(text.includes(skill.label + ": "), "Missing " + skill.label);
  assert.ok(text.includes("AC: 15.5\n"));
  assert.ok(text.includes("Mana: 0\n"));
  assert.ok(text.includes("Stealth: -1.5\n"));
  assert.ok(text.includes("Size: Small\n"));
  assert.ok(!/^HP:/m.test(text));
});

test("multiline prose cannot inject stats into the manual parser", () => {
  const text = rules.toManualText(rules.createMonster(1, {
    hp: 20, name: "Monster\nHP: 100", description: "A creature\nSize: Colossal", traits: "Regenerates\r\nAC: 999",
  }));
  assert.deepEqual(text.match(/^HP:.*$/gm), ["HP: 20"]);
  assert.deepEqual(text.match(/^AC:.*$/gm), ["AC: 15.5"]);
  assert.deepEqual(text.match(/^Size:.*$/gm), ["Size: Medium"]);
});

test("each generated statblock owns its editable skills independently", () => {
  const first = rules.createMonster(1, { averageSkillBonus: 3 });
  const second = rules.createMonster(1, { averageSkillBonus: 3 });
  first.skills.strength = 55;
  assert.equal(second.skills.strength, 3);
  assert.equal(rules.averageFor(1).attackBonus, 5.5);
});

test("the same source rules load in a browser without CommonJS or a DOM", () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../public/monster-rules.js"), "utf8"), context);
  assert.equal(context.MonsterRules.createMonster("1/4").ac, 14);
  assert.equal(context.MonsterRules.inferSize({ size: "Fine" }).tokenSquares, 0.1);
});
