(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MonsterRules = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Live Google Sheets/Docs snapshot. CR is challenge rating, not character level.
  const sources = Object.freeze({
    verifiedOn: "2026-09-22",
    averages: {
      url: "https://docs.google.com/spreadsheets/d/10GuHLF5ahpTPmeSO8W-WKBzrmMJzi0_R8HiatYer-TA/edit?gid=1701149677#gid=1701149677",
      sheet: "CR Balancer", range: "A1:F22",
      note: "Column F, average stat, has no values or formulas below its heading. HP and mana are not specified. The unlabeled C23 value is excluded.",
    },
    sizes: {
      url: "https://docs.google.com/spreadsheets/d/1yFldXsbHSVkHgLh_E7lBuO8bL44gJix9i20mQx1tTdw/edit?gid=1181816666#gid=1181816666",
      sheet: "Size Categories", range: "A1:I11",
    },
    skills: {
      url: "https://docs.google.com/spreadsheets/d/1X788whOXnhaSJG3l6LUphfR77ei5I0dv46cuC6LBvrA/edit?gid=1872892897#gid=1872892897",
      sheet: "Stats 🗡️", range: "F25:F55",
    },
    rules: {
      url: "https://docs.google.com/document/d/1ObjqZs9bvV_NW0lxCkRVeDBYIdK74dwUwKbzmdnjMi0/edit?tab=t.0",
      note: "Default movement is 30 feet. Dodge, Resist Condition and Resistive Willpower are the ordinary Dexterity/Constitution/Wisdom save equivalents.",
    },
    examples: {
      url: "https://docs.google.com/spreadsheets/d/1PqFindP85hw19csIMmNExOYHRAIbhqBuSYqM85fEybI/edit?gid=0#gid=0",
      sheet: "Augmented beasts", range: "A1:D32",
    },
  });

  const skillLabels = [
    "Melee Weapons", "Ranged Weapons", "Dodge", "Health Pool", "Mana Pool",
    "Resist Condition", "Resist Damage", "Resistive Willpower", "Evoke Runes",
    "Initiative", "Beseech the Gods", "Strength", "Athletics", "Stealth",
    "Endurance", "Resist Pain", "Assertive Willpower", "Problem Solving",
    "Craft Magic Item", "Knowledge (Lore)", "Knowledge (Magic)", "Knowledge (Biology)",
    "Perception", "Charisma", "Perform", "Sense Motive", "Deception", "Interact with Nature",
  ];
  const skills = Object.freeze(skillLabels.map(function (label, index) {
    return Object.freeze({ key: label.toLowerCase(), label: label, group: index < 11 ? "major" : "minor" });
  }));
  // Values are copied as evaluated from the source, including fractional bonuses.
  const averageRows = [
    ["0", 3, 3, 13, 11], ["1/4", 4, 3, 14, 12], ["1/2", 5, 3.5, 15, 13],
    ["1", 5.5, 4.75, 15.5, 13.5], ["2", 6.5, 6, 16.5, 14.5],
    ["3", 7.5, 7.25, 17.5, 15.5], ["4", 9.5, 8.5, 18.5, 17.5],
    ["5", 10.5, 9.75, 19.5, 18.5], ["6", 11.5, 11, 20.5, 19.5],
    ["7", 12.5, 12.25, 21.5, 20.5], ["8", 14.5, 13.5, 22.5, 22.5],
    ["9", 15.5, 14.75, 23.5, 23.5], ["10", 16.5, 16, 24.5, 24.5],
    ["11", 17.5, 17.25, 25.5, 25.5], ["12", 19.5, 18.5, 26.5, 27.5],
    ["13", 20.5, 19.75, 27.5, 28.5], ["14", 21.5, 21, 28.5, 29.5],
    ["15", 22.5, 22.25, 29.5, 30.5], ["16", 24.5, 23.5, 30.5, 32.5],
    ["17", 25.5, 24.75, 31.5, 33.5], ["18", 27.5, 26, 32.5, 35.5],
  ];
  const averages = Object.freeze(averageRows.map(function (row, index) {
    return Object.freeze({ cr: row[0], attackBonus: row[1], averageSave: row[2], ac: row[3], saveDc: row[4], averageStat: null, sourceRow: index + 2 });
  }));

  // Space is measured in feet; tokenSquares is the side length on a 5-foot grid.
  const sizeRows = [
    ["fine", "Fine", 0.5, 8, -16, 16, 0, 0.5, 0, 0],
    ["diminutive", "Diminutive", 1, 4, -12, 12, 0.5, 1, 0, 0],
    ["tiny", "Tiny", 2.5, 2, -8, 8, 1, 2, 0, 0],
    ["small", "Small", 5, 1, -4, 4, 2, 4, 5, 5],
    ["medium", "Medium", 5, 0, 0, 0, 4, 8, 5, 5],
    ["large", "Large", 10, -1, 4, -4, 8, 16, 10, 5],
    ["huge", "Huge", 15, -2, 8, -8, 16, 32, 15, 10],
    ["gargantuan", "Gargantuan", 20, -4, 12, -12, 32, 64, 20, 15],
    ["colossal", "Colossal", 30, -8, 16, -16, 64, null, 30, 20],
  ];
  const sizes = Object.freeze(sizeRows.map(function (row) {
    return Object.freeze({ key: row[0], label: row[1], spaceFeet: row[2], tokenSquares: row[2] / 5,
      acModifier: row[3], strengthModifier: row[4], stealthModifier: row[5],
      heightMinFeet: row[6], heightMaxFeet: row[7], reachTallFeet: row[8], reachLongFeet: row[9] });
  }));

  function normalizeKey(value) { return String(value == null ? "" : value).trim().toLowerCase().replace(/\s+/g, " "); }
  function canonicalSize(value) {
    const key = normalizeKey(value).replace(/^size\s*:\s*/, "");
    if (/^colossal(?:\+| and colossal\+)?$/.test(key)) return "colossal";
    const found = sizes.find(function (size) { return size.key === key; });
    return found ? found.key : null;
  }
  function normalizeCr(value) {
    const key = normalizeKey(value).replace(/^cr\s*/, "").replace(/\s/g, "");
    if (key === "0.25" || key === "¼") return "1/4";
    if (key === "0.5" || key === "½") return "1/2";
    return key;
  }
  function averageFor(cr) {
    const key = normalizeCr(cr);
    return averages.find(function (entry) { return entry.cr === key; }) || null;
  }
  function numeric(value, fallback, label, min, max) {
    if (value === undefined) return fallback;
    if (value === null || value === "" || (typeof value === "string" && !value.trim())) return null;
    const number = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
    if (!Number.isFinite(number) || number < min || number > max) throw new Error(label + " must be a number between " + min + " and " + max + ".");
    return number;
  }
  function textValue(value, limit) { return String(value == null ? "" : value).trim().slice(0, limit); }
  function lookup(record, keys) {
    if (!record || typeof record !== "object") return undefined;
    for (const key of Object.keys(record)) {
      if (keys.indexOf(normalizeKey(key)) >= 0 && record[key] !== undefined && record[key] !== null && record[key] !== "") return record[key];
    }
    return undefined;
  }
  function rawFields(value) {
    if (typeof value !== "string") return value && typeof value === "object" ? value : {};
    const result = {};
    value.split(/\r?\n/).forEach(function (line) {
      const colon = line.indexOf(":");
      if (colon >= 0) result[normalizeKey(line.slice(0, colon))] = line.slice(colon + 1).trim();
    });
    if (!Object.keys(result).length) result.description = value;
    return result;
  }
  function dimensionFeet(value) {
    if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
    const match = String(value || "").trim().match(/^(\d+(?:\.\d+)?)\s*(ft\.?|feet|foot|'|in\.?|inch(?:es)?|")?(?:\s*(?:tall|long|high|wide|square))?$/i);
    if (!match) return null;
    const feet = Number(match[1]) / (/^(?:in|inch|")/i.test(match[2] || "") ? 12 : 1);
    return feet > 0 ? feet : null;
  }
  function sizeResult(key, reason, inferred, needsReview) {
    const size = sizes.find(function (candidate) { return candidate.key === key; });
    return { size: size.key, label: size.label, tokenSquares: size.tokenSquares, spaceFeet: size.spaceFeet,
      reason: reason, inferred: inferred, needsReview: Boolean(needsReview) };
  }

  function inferSize(statblock) {
    const block = rawFields(statblock);
    const records = [block, block.currentValues, block.parsedSheet, block.parsedSheet && block.parsedSheet.currentValues, block.stats, block.stats && block.stats.currentValues].filter(Boolean);
    let ambiguousSpace = null;
    for (const record of records) {
      const value = lookup(record, ["size", "size category", "sizecategory", "creature size"]);
      const size = canonicalSize(value);
      if (size) return sizeResult(size, "Explicit size in the statblock.", false, false);
    }
    const description = records.map(function (record) {
      return [lookup(record, ["creaturetype", "creature type", "type"]), lookup(record, ["description", "appearance"])].filter(Boolean).join("\n");
    }).join("\n");
    const typeMatch = description.match(/\b(fine|diminutive|tiny|small|medium|large|huge|gargantuan|colossal\+?)\s+(?:[\w-]+\s+)?(?:aberration|beast|celestial|construct|dragon|elemental|fey|fiend|giant|humanoid|monstrosity|ooze|plant|undead|creature|monster)\b/i);
    if (typeMatch) return sizeResult(canonicalSize(typeMatch[1]), "Size stated in the creature type or description.", true, false);
    for (const record of records) {
      const space = dimensionFeet(lookup(record, ["space", "spacefeet", "space feet", "occupied space"]));
      if (space !== null) {
        const matches = sizes.filter(function (size) { return size.spaceFeet === space; });
        if (matches.length === 1) return sizeResult(matches[0].key, "The statblock's " + space + " ft. space matches the Size Categories table.", true, false);
        if (matches.length > 1) ambiguousSpace = sizeResult("medium", "A 5 ft. space fits both Small and Medium; using Medium until a size is specified.", true, true);
      }
      const dimension = dimensionFeet(lookup(record, ["height", "heightfeet", "height feet", "length", "lengthfeet", "length feet", "height or length"]));
      if (dimension !== null) {
        const matches = sizes.filter(function (size) { return dimension >= size.heightMinFeet && (size.heightMaxFeet === null || dimension <= size.heightMaxFeet); });
        if (matches.length === 1) return sizeResult(matches[0].key, "The statblock's " + dimension + " ft. height or length matches the Size Categories table.", true, false);
        if (matches.length > 1) return sizeResult(matches[0].key, "Height or length is on the " + matches.map(function (size) { return size.label; }).join(" / ") + " boundary; review the size.", true, true);
      }
    }
    return ambiguousSpace || sizeResult("medium", "No unambiguous size or dimensions found; using Medium. CR and Strength do not determine size.", true, true);
  }

  function normalizeMonster(input) {
    const value = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const baseline = averageFor(value.cr === undefined ? "1" : value.cr);
    if (!baseline) throw new Error("Choose a CR from the source table (0, 1/4, 1/2, or 1–18).");
    const averageSkillBonus = numeric(value.averageSkillBonus, null, "Average skill bonus", -1000, 1000);
    const sizeInput = normalizeKey(value.size);
    const size = !sizeInput || sizeInput === "auto" ? "auto" : canonicalSize(sizeInput);
    if (!size) throw new Error("Choose a size from the Size Categories table or Auto.");
    const result = {
      name: textValue(value.name, 120), cr: baseline.cr, creatureType: textValue(value.creatureType, 200), size: size,
      description: textValue(value.description, 4000),
      hp: numeric(value.hp, null, "HP", 1, 1000000), mana: numeric(value.mana, null, "Mana", 0, 1000000),
      ac: numeric(value.ac, baseline.ac, "AC", 0, 10000),
      speed: numeric(value.speed, 30, "Speed", 0, 10000),
      attackBonus: numeric(value.attackBonus, baseline.attackBonus, "Attack bonus", -1000, 1000),
      saveDc: numeric(value.saveDc, baseline.saveDc, "Save DC", 0, 10000),
      averageSkillBonus: averageSkillBonus,
      skills: {}, attacks: textValue(value.attacks, 8000), traits: textValue(value.traits, 8000),
      senses: textValue(value.senses, 1000), damageResistances: textValue(value.damageResistances, 2000),
      conditionImmunities: textValue(value.conditionImmunities, 2000),
      height: textValue(value.height, 100), length: textValue(value.length, 100), space: textValue(value.space, 100),
    };
    const resolvedSize = inferSize(result);
    // Default reach uses the table's tall column, and remains editable for long creatures.
    const sizeRule = sizes.find(function (entry) { return entry.key === resolvedSize.size; });
    result.reach = numeric(value.reach, sizeRule.reachTallFeet, "Reach", 0, 10000);
    const suppliedSkills = value.skills && typeof value.skills === "object" && !Array.isArray(value.skills) ? value.skills : {};
    skills.forEach(function (skill) {
      let fallback = averageSkillBonus;
      if (skill.key === "melee weapons" || skill.key === "ranged weapons") fallback = result.attackBonus;
      if (["dodge", "resist condition", "resistive willpower"].indexOf(skill.key) >= 0) fallback = baseline.averageSave;
      const supplied = lookup(suppliedSkills, [skill.key]);
      // Explicit blanks stay blank; they do not silently become zero or a baseline.
      const originalKey = Object.keys(suppliedSkills).find(function (key) { return normalizeKey(key) === skill.key; });
      result.skills[skill.key] = numeric(originalKey === undefined ? supplied : suppliedSkills[originalKey], fallback, skill.label, -1000, 1000);
    });
    return result;
  }

  function createMonster(cr, overrides) {
    return normalizeMonster(Object.assign({}, overrides || {}, { cr: cr === undefined ? "1" : cr }));
  }
  function toManualText(input) {
    const monster = normalizeMonster(input);
    const size = inferSize(monster);
    const entries = [
      ["Name", monster.name], ["Creature Type", monster.creatureType], ["CR", monster.cr], ["Size", size.label],
      ["HP", monster.hp], ["Mana", monster.mana], ["AC", monster.ac], ["Speed", monster.speed],
      ["Reach", monster.reach], ["Attack Bonus", monster.attackBonus], ["Save DC", monster.saveDc],
    ];
    skills.forEach(function (skill) { entries.push([skill.label, monster.skills[skill.key]]); });
    entries.push(["Special Attacks", monster.attacks], ["Special Abilities", monster.traits], ["Special Senses", monster.senses],
      ["Damage Resistances / Immunities / Vulnerabilities", monster.damageResistances], ["Condition Resistances / Immunities", monster.conditionImmunities],
      ["Description", monster.description], ["Height", monster.height], ["Length", monster.length], ["Space", monster.space]);
    // Keep one physical line per key so text fields cannot inject numeric rows into the legacy parser.
    return entries.filter(function (entry) { return entry[1] !== null && entry[1] !== undefined && entry[1] !== ""; })
      .map(function (entry) { return entry[0] + ": " + String(entry[1]).replace(/[\r\n]+/g, " · "); }).join("\n");
  }

  return Object.freeze({ sources: sources, skills: skills, averages: averages, sizes: sizes,
    averageFor: averageFor, canonicalSize: canonicalSize, createMonster: createMonster,
    normalizeMonster: normalizeMonster, inferSize: inferSize, toManualText: toManualText });
});
