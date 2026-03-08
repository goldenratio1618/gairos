const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
  DEFAULT_TERRAIN_TEXTURE_ROOT,
  applyTerrainOps,
  buildResolvedTextureDefaults,
  buildTextureCatalog,
  cloneVisibleMapForRole,
  createLayerOnMap,
  deleteLayerFromMap,
  ensureTerrainLayers,
  findDoorComponentAt,
  getTerrainLayerById,
  getTopTerrainComponent,
  importBackgroundIntoLayer,
  isTileBlockingMovement,
  normalizeCampaignTerrainDefaults,
  normalizeTextureDefaults,
  reorderLayersOnMap,
  resizeTerrainForMap,
  serializeTextureCatalogForClient,
} = require("./terrain");

const TABLETOP_NAMESPACE = "/tabletop";
const DEFAULT_GRID_ROWS = 20;
const DEFAULT_GRID_COLS = 30;
const HERB_SHEET_ID = "1_ly4-3ykWpQ47oDLyF2hDewntCJ4QR6hImODhmwNlYg";
const HERB_SHEET_NAME = "RULES_HERBS";
const DEFAULT_GM_TOKEN_OPACITY = 0.55;
let activeTextureCatalog = buildTextureCatalog(DEFAULT_TERRAIN_TEXTURE_ROOT);

const ROLL_MODIFIER_CATALOG = {
  guidance: {
    id: "guidance",
    featNames: ["Giver of Guidance"],
    phase: "post",
    appliesTo: ["minor_skill"],
    description: "Add 1d4 to the roll.",
    grantsTo: "ally",
    requiresApproval: true,
  },
  master_guidance: {
    id: "master_guidance",
    featNames: ["Master of Guidance"],
    phase: "post",
    appliesTo: ["minor_skill", "major_skill", "attack"],
    description: "Add 1d6 to the roll.",
    grantsTo: "ally",
    requiresApproval: true,
  },
  inspiring_singing: {
    id: "inspiring_singing",
    featNames: ["Inspiring Singing"],
    phase: "post",
    appliesTo: ["minor_skill"],
    description: "Add 1d8 after seeing the roll.",
    grantsTo: "ally",
    requiresApproval: true,
  },
  inspiring_singing_ii: {
    id: "inspiring_singing_ii",
    featNames: ["Inspiring Singing II"],
    phase: "post",
    appliesTo: ["minor_skill", "major_skill", "attack", "constitution_check", "resistive_willpower"],
    description: "Add 1d10 (or roll 2d10 keep highest on listed checks).",
    grantsTo: "ally",
    requiresApproval: true,
  },
  in_tune_with_the_gods: {
    id: "in_tune_with_the_gods",
    featNames: ["In Tune With The Gods"],
    phase: "passive",
    appliesTo: ["prepared_prayer"],
    description: "When a prepared prayer d20 is below 6, reroll that die once.",
    grantsTo: "self",
    requiresApproval: false,
  },
  luck_of_the_devout: {
    id: "luck_of_the_devout",
    featNames: ["Luck of the Devout"],
    phase: "pre",
    appliesTo: ["beseech_the_gods", "prepared_prayer"],
    description: "Roll with advantage.",
    grantsTo: "self",
    requiresApproval: false,
  },
  bottled_luck: {
    id: "bottled_luck",
    featNames: ["Bottled Luck"],
    phase: "pre",
    appliesTo: ["minor_skill", "major_skill", "attack", "saving_throw", "any"],
    description: "Take disadvantage now to store advantage on next check of same skill/attack.",
    grantsTo: "self",
    requiresApproval: false,
  },
  fortune_over_finesse: {
    id: "fortune_over_finesse",
    featNames: ["Fortune over Finesse"],
    phase: "pre",
    appliesTo: ["minor_skill", "major_skill", "any_skill", "beseech_the_gods", "prepared_prayer"],
    description: "For each +10 bonus sacrificed, roll one additional d20.",
    grantsTo: "self",
    requiresApproval: false,
  },
  miracle_worker: {
    id: "miracle_worker",
    featNames: ["Miracle Worker"],
    phase: "post",
    appliesTo: ["minor_skill", "major_skill", "any_skill"],
    description: "After rolling a 20 on a d20, optionally take -10 to add another d20.",
    grantsTo: "self",
    requiresApproval: false,
  },
  inspired_by_the_gods: {
    id: "inspired_by_the_gods",
    featNames: ["Inspired by the Gods"],
    phase: "post",
    appliesTo: ["any"],
    description: "Reroll one chosen die from any roll.",
    grantsTo: "any",
    requiresApproval: true,
  },
  small_fortunes: {
    id: "small_fortunes",
    featNames: ["Small Fortunes"],
    phase: "passive",
    appliesTo: ["any"],
    description: "Reroll d20 results of 1.",
    grantsTo: "self_or_any",
    requiresApproval: true,
  },
  shifting_fortunes: {
    id: "shifting_fortunes",
    featNames: ["Shifting Fortunes"],
    phase: "post",
    appliesTo: ["any"],
    description: "When rerolling, add or subtract 1d6 from the new result.",
    grantsTo: "self_or_any",
    requiresApproval: true,
  },
  portent: {
    id: "portent",
    featNames: ["Portent"],
    phase: "pre",
    appliesTo: ["any"],
    description: "Replace a d20 with a stored Portent die.",
    grantsTo: "any",
    requiresApproval: true,
  },
  master_of_deceit: {
    id: "master_of_deceit",
    featNames: ["Master of Deceit"],
    phase: "passive",
    appliesTo: ["deception", "sense motive"],
    description: "Treat a d20 roll of 7 or less as an 8.",
    grantsTo: "self",
    requiresApproval: false,
  },
};

const CLERIC_DICE_MODIFIER_IDS = new Set([
  "guidance",
  "master_guidance",
  "in_tune_with_the_gods",
  "luck_of_the_devout",
  "bottled_luck",
  "fortune_over_finesse",
  "miracle_worker",
  "inspired_by_the_gods",
  "small_fortunes",
  "shifting_fortunes",
  "portent",
]);

const ITALICIZED_SKILLS = new Set(["dodge", "stealth", "evoke runes"]);

const INJURY_TABLES = {
  minor: [
    "Blood Loss",
    "Bruising",
    "Open Wound",
    "Blurred Vision",
    "Ringing Ears",
    "Limp",
    "Pulled Bicep",
    "Pulled Thigh",
    "Nausea",
    "Minor Mental Trauma",
    "Mild Concussion 1",
    "Mild Concussion 2",
    "Mild Concussion 3",
    "Mild Concussion 4",
    "Mild Concussion 5",
    "Winded",
    "Cracked Tooth",
    "Charlie Horse",
    "Sprain",
    "Minor Scar",
  ],
  moderate: [
    "Severe Blood Loss",
    "Horrible Scar",
    "Festering Wound",
    "Broken Rib",
    "Punctured Lung",
    "Ruptured Liver",
    "Ruptured Intestines",
    "Busted Kidney",
    "Broken Arm or Hand",
    "Broken Foot or Leg",
    "Break a Finger",
    "Magical Backlash",
    "Mental Trauma",
    "Concussion 1",
    "Concussion 2",
    "Concussion 3",
    "Concussion 4",
    "Concussion 5",
    "Deep Laceration",
    "Bone Fracture",
  ],
  major: [
    "Coma",
    "Internal Damage 1",
    "Internal Damage 2",
    "Internal Damage 3",
    "Internal Damage 4",
    "Brain Damage 1",
    "Brain Damage 2",
    "Broken Spine",
    "Lose an Eye",
    "Lose an Arm or Hand",
    "Lose a Foot or Leg",
    "Lose a Finger (thumb)",
    "Lose an Ear",
    "Teeth Knocked Out",
    "Lose a Nose",
    "Major Magical Backlash",
    "Severe Mental Trauma",
    "Severe Concussion 1",
    "Severe Concussion 2",
    "Lose a Finger (not thumb)",
  ],
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSkillName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeFeatName(name) {
  return normalizeSkillName(name).replace(/\s+/g, " ");
}

function normalizeFeatSet(feats) {
  const source = Array.isArray(feats) ? feats : [];
  return new Set(source.map((feat) => normalizeFeatName(feat)).filter(Boolean));
}

function normalizeEntityName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function hasEntityNameCollision(entries, wantedName, ignoreId = null) {
  const wanted = normalizeEntityName(wantedName);
  if (!wanted) {
    return false;
  }
  return (Array.isArray(entries) ? entries : []).some((entry) => {
    if (!entry || (ignoreId && entry.id === ignoreId)) {
      return false;
    }
    return normalizeEntityName(entry.name) === wanted;
  });
}

function nextUniqueEntityName(entries, prefix) {
  const safePrefix = String(prefix || "New").trim() || "New";
  let index = 1;
  while (index < 5000) {
    const wanted = `${safePrefix} ${index}`;
    if (!hasEntityNameCollision(entries, wanted)) {
      return wanted;
    }
    index += 1;
  }
  return `${safePrefix} ${Date.now()}`;
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function parseJsonFile(filePath, fallbackValue) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    return fallbackValue;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollDice(count, sides) {
  const safeCount = clamp(Number.parseInt(count, 10) || 1, 1, 100);
  const safeSides = clamp(Number.parseInt(sides, 10) || 20, 2, 1000);
  const dice = [];
  for (let i = 0; i < safeCount; i += 1) {
    dice.push(randomInt(1, safeSides));
  }
  return {
    count: safeCount,
    sides: safeSides,
    dice,
    sum: dice.reduce((acc, value) => acc + value, 0),
    max: Math.max(...dice),
    min: Math.min(...dice),
  };
}

function parseRollCommand(text) {
  const trimmed = String(text || "").trim();
  const match = trimmed.match(/^\/r\s*(?:(\d*)d(\d+)(k1|kl1)?)\s*(?:([+-])\s*(\d+))?\s*$/i);
  if (!match) {
    return null;
  }
  const diceCount = match[1] ? Number.parseInt(match[1], 10) : 1;
  const sides = Number.parseInt(match[2], 10);
  const mode = match[3] ? match[3].toLowerCase() : "sum";
  const sign = match[4] || "+";
  const scalar = match[5] ? Number.parseInt(match[5], 10) : 0;
  const roll = rollDice(diceCount, sides);
  let chosen = roll.sum;
  if (mode === "k1") {
    chosen = roll.max;
  } else if (mode === "kl1") {
    chosen = roll.min;
  }
  const offset = sign === "-" ? -scalar : scalar;
  return {
    ok: true,
    notation: trimmed,
    diceCount: roll.count,
    sides: roll.sides,
    mode,
    dice: roll.dice,
    chosen,
    offset,
    total: chosen + offset,
  };
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function parseSheetIdFromUrl(sheetUrl) {
  const raw = String(sheetUrl || "").trim();
  const direct = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (direct && direct[1]) {
    return direct[1];
  }
  if (/^[a-zA-Z0-9-_]{20,}$/.test(raw)) {
    return raw;
  }
  return null;
}

async function fetchCsvFromSheet(sheetId, sheetName) {
  const encodedSheet = encodeURIComponent(sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodedSheet}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "user-agent": "gairos-tabletop/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Could not fetch sheet tab ${sheetName}.`);
  }
  return response.text();
}

function normalizeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSheetCellText(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function parseSheetCellValue(value) {
  const text = normalizeSheetCellText(value);
  if (!text) {
    return "";
  }
  const parsed = Number.parseFloat(text.replace(/[^0-9.+-]/g, ""));
  if (Number.isFinite(parsed) && /[0-9]/.test(text)) {
    return parsed;
  }
  return text;
}

function parseCharacterFromSheetRows(statsRows, featRows) {
  const result = {
    parsedAt: nowIso(),
    skills: {},
    feats: [],
    currentValues: {},
    currentValueMeta: {},
    italicizedSkillDc: 0,
    strengthModifier: 0,
    speed: 30,
    maxHp: 1,
    resistDamageBonus: 0,
    initiativeBonus: 0,
    beseechBonus: 0,
  };

  const levelB1Raw = normalizeSheetCellText(statsRows && statsRows[0] ? statsRows[0][1] : "");
  const levelB1Value = parseSheetCellValue(levelB1Raw);
  const headerLikeLabels = new Set([
    "expanded stats",
    "attributes, skills",
    "attributes skills",
    "current value",
    "max value",
  ]);

  let inExpandedStats = true;

  for (let i = 0; i < statsRows.length; i += 1) {
    const row = statsRows[i] || [];
    const label = normalizeSkillName(row[0]);
    if (headerLikeLabels.has(label)) {
      continue;
    }
    const rowNumber = i + 1;
    const baseRaw = normalizeSheetCellText(row[1]);
    const currentRaw = normalizeSheetCellText(row[3]);
    const baseValue = parseSheetCellValue(baseRaw);
    const currentValue = parseSheetCellValue(currentRaw);

    if (label === "attributes") {
      inExpandedStats = false;
    }

    if (inExpandedStats && label) {
      let displayValue = baseRaw;
      if (label !== "level" && baseRaw && currentRaw) {
        displayValue = `${currentRaw} / ${baseRaw}`;
      }
      if (displayValue !== "") {
        result.currentValues[label] = displayValue;
      }
      result.currentValueMeta[label] = {
        key: label,
        rowNumber,
        baseRaw,
        currentRaw,
        baseValue,
        currentValue,
        displayValue: displayValue || "",
        hasCurrent: currentRaw !== "",
        hasBase: baseRaw !== "",
        bCell: `B${rowNumber}`,
        dCell: `D${rowNumber}`,
      };
      if (label === "hp") {
        result.currentValues["current hp"] = displayValue || "";
        result.currentValueMeta["current hp"] = result.currentValueMeta[label];
      } else if (label === "mana") {
        result.currentValues["current mana"] = displayValue || "";
        result.currentValueMeta["current mana"] = result.currentValueMeta[label];
      }

    }

    if (label === "italicized skill dc") {
      result.italicizedSkillDc = normalizeNumber(row[1], 0);
    }
    if (label === "speed") {
      result.speed = normalizeNumber(row[1], 30);
    }
    if (label === "hp" || label === "max hp") {
      result.maxHp = Math.max(1, normalizeNumber(row[1], 1));
    }

    const skillName = String(row[5] || "").trim();
    const normalizedSkill = normalizeSkillName(skillName);
    if (skillName && !headerLikeLabels.has(normalizedSkill) && normalizedSkill !== "skills") {
      const bonus = normalizeNumber(row[6], 0);
      result.skills[normalizedSkill] = bonus;
      if (normalizedSkill === "strength") {
        result.strengthModifier = bonus;
      }
      if (normalizedSkill === "resist damage") {
        result.resistDamageBonus = bonus;
      }
      if (normalizedSkill === "initiative") {
        result.initiativeBonus = bonus;
      }
      if (normalizedSkill === "beseech the gods") {
        result.beseechBonus = bonus;
      }
    }
  }

  const seenFeats = new Set();
  let foundAnyFeat = false;
  for (let i = 1; i < featRows.length; i += 1) {
    const row = featRows[i] || [];
    const featName = String(row[0] || "").trim();
    if (!featName) {
      if (foundAnyFeat) {
        break;
      }
      continue;
    }
    foundAnyFeat = true;
    const token = normalizeCounterToken(featName);
    if (!token || seenFeats.has(token)) {
      continue;
    }
    seenFeats.add(token);
    result.feats.push(featName);
  }

  if (result.currentValues.speed === undefined) {
    result.currentValues.speed = result.speed;
    result.currentValueMeta.speed = {
      key: "speed",
      rowNumber: null,
      baseRaw: String(result.speed),
      currentRaw: "",
      baseValue: result.speed,
      currentValue: "",
      displayValue: String(result.speed),
      hasCurrent: false,
      hasBase: true,
      bCell: null,
      dCell: null,
    };
  }
  if (result.currentValues["max hp"] === undefined) {
    result.currentValues["max hp"] = result.maxHp;
    result.currentValueMeta["max hp"] = {
      key: "max hp",
      rowNumber: null,
      baseRaw: String(result.maxHp),
      currentRaw: "",
      baseValue: result.maxHp,
      currentValue: "",
      displayValue: String(result.maxHp),
      hasCurrent: false,
      hasBase: true,
      bCell: null,
      dCell: null,
    };
  }
  if (result.currentValues["strength mod"] === undefined) {
    result.currentValues["strength mod"] = result.strengthModifier;
    result.currentValueMeta["strength mod"] = {
      key: "strength mod",
      rowNumber: null,
      baseRaw: String(result.strengthModifier),
      currentRaw: "",
      baseValue: result.strengthModifier,
      currentValue: "",
      displayValue: String(result.strengthModifier),
      hasCurrent: false,
      hasBase: true,
      bCell: null,
      dCell: null,
    };
  }
  if (result.currentValues.isdc === undefined) {
    result.currentValues.isdc = result.italicizedSkillDc;
    result.currentValueMeta.isdc = {
      key: "isdc",
      rowNumber: null,
      baseRaw: String(result.italicizedSkillDc),
      currentRaw: "",
      baseValue: result.italicizedSkillDc,
      currentValue: "",
      displayValue: String(result.italicizedSkillDc),
      hasCurrent: false,
      hasBase: true,
      bCell: null,
      dCell: null,
    };
  }

  if (
    levelB1Raw &&
    normalizeSkillName(levelB1Raw) !== "current value" &&
    normalizeSkillName(levelB1Raw) !== "max value"
  ) {
    result.currentValues.level = levelB1Value;
    result.currentValueMeta.level = {
      key: "level",
      rowNumber: 1,
      baseRaw: levelB1Raw,
      currentRaw: "",
      baseValue: levelB1Value,
      currentValue: "",
      displayValue: String(levelB1Value),
      hasCurrent: false,
      hasBase: true,
      bCell: "B1",
      dCell: "D1",
    };
  }

  return result;
}

async function parseCharacterSheet(sheetUrl) {
  const sheetId = parseSheetIdFromUrl(sheetUrl);
  if (!sheetId) {
    throw new Error("Invalid sheet URL.");
  }
  const [statsCsv, featsCsv] = await Promise.all([
    fetchCsvFromSheet(sheetId, "Stats 🗡️"),
    fetchCsvFromSheet(sheetId, "Feats ⭐"),
  ]);
  const statsRows = parseCsv(statsCsv);
  const featRows = parseCsv(featsCsv);
  return parseCharacterFromSheetRows(statsRows, featRows);
}

function normalizeCounterToken(text) {
  return normalizeSkillName(text).replace(/[^a-z0-9]/g, "");
}

function findUsageCounterForModifier(parsedSheet, modifierId, definition) {
  const meta = parsedSheet && parsedSheet.currentValueMeta && typeof parsedSheet.currentValueMeta === "object"
    ? parsedSheet.currentValueMeta
    : null;
  if (!meta) {
    return null;
  }

  const candidates = [];
  if (definition && Array.isArray(definition.featNames)) {
    candidates.push(...definition.featNames);
  }
  candidates.push(modifierId);
  candidates.push(String(modifierId || "").replace(/_/g, " "));

  const wantedTokens = candidates
    .map((name) => normalizeCounterToken(name))
    .filter(Boolean);

  if (wantedTokens.length === 0) {
    return null;
  }

  for (const [key, details] of Object.entries(meta)) {
    const keyToken = normalizeCounterToken(key);
    if (!keyToken) {
      continue;
    }
    if (!details || !details.hasCurrent || !details.dCell) {
      continue;
    }
    const matches = wantedTokens.some(
      (token) => token === keyToken || token.includes(keyToken) || keyToken.includes(token)
    );
    if (!matches) {
      continue;
    }
    const remainingNumeric = Number(details.currentValue);
    if (!Number.isFinite(remainingNumeric)) {
      continue;
    }
    return {
      key,
      rowNumber: details.rowNumber || null,
      remainingNumeric,
      dCell: details.dCell || null,
      bCell: details.bCell || null,
      hasCurrent: Boolean(details.hasCurrent),
    };
  }

  return null;
}

function parseStatblockColumn(rows, columnName) {
  const header = rows[0] || [];
  let index = -1;
  const needle = normalizeSkillName(columnName);
  for (let i = 0; i < header.length; i += 1) {
    const candidate = normalizeSkillName(header[i]);
    if (!candidate) {
      continue;
    }
    if (candidate === needle || candidate.includes(needle) || needle.includes(candidate)) {
      index = i;
      break;
    }
  }
  if (index < 0) {
    throw new Error("Could not find the requested statblock column.");
  }

  const byName = {};
  rows.forEach((row) => {
    const key = normalizeSkillName(row[0]);
    const value = row[index];
    if (key) {
      byName[key] = value;
    }
  });

  const skills = {};
  [
    "melee weapons",
    "ranged weapons",
    "dodge",
    "resist condition",
    "resist will",
    "resistive willpower",
    "initiative",
    "resist damage",
    "strength",
    "athletics",
    "stealth",
    "endurance",
    "resist pain",
    "perception",
    "beseech the gods",
  ].forEach((name) => {
    if (byName[name] !== undefined) {
      skills[name] = normalizeNumber(byName[name], 0);
    }
  });

  const displayName = String(rows[0][index] || columnName).replace(/^Name Creature Type\s*/i, "").trim();
  return {
    name: displayName || columnName,
    stats: {
      skills,
      strengthModifier: normalizeNumber(byName.strength, 0),
      resistDamageBonus: normalizeNumber(byName["resist damage"], 0),
      initiativeBonus: normalizeNumber(byName.initiative, 0),
      speed: normalizeNumber(byName.speed, 30),
      maxHp: Math.max(1, normalizeNumber(byName.hp, 1)),
      italicizedSkillDc: 0,
      feats: [],
      currentValues: {
        speed: normalizeNumber(byName.speed, 30),
        "max hp": Math.max(1, normalizeNumber(byName.hp, 1)),
      },
      currentValueMeta: {},
      parsedAt: nowIso(),
    },
  };
}

async function parseStatblockFromSheet(sheetUrl, sheetName, columnName) {
  const sheetId = parseSheetIdFromUrl(sheetUrl);
  if (!sheetId) {
    throw new Error("Invalid sheet URL.");
  }
  const csv = await fetchCsvFromSheet(sheetId, sheetName || "Augmented beasts");
  const rows = parseCsv(csv);
  return parseStatblockColumn(rows, columnName);
}

async function loadHerbDatabase() {
  const csv = await fetchCsvFromSheet(HERB_SHEET_ID, HERB_SHEET_NAME);
  const rows = parseCsv(csv);
  const herbs = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || !row[0] || !row[3] || !row[6]) {
      continue;
    }
    const name = String(row[0]).trim();
    const rarityRaw = String(row[3]).trim().toLowerCase();
    if (!name || !rarityRaw) {
      continue;
    }
    let rarity = rarityRaw;
    if (rarity === "very rare") {
      rarity = "very_rare";
    }
    if (!["common", "uncommon", "rare", "very_rare"].includes(rarity)) {
      continue;
    }
    const environment = String(row[6])
      .split(",")
      .map((part) => normalizeSkillName(part))
      .filter(Boolean)
      .map((part) => (part === "all" ? "all" : part));
    herbs.push({
      name,
      rarity,
      environment,
      effect: String(row[2] || "").trim(),
    });
  }
  return herbs;
}

function resizeMapInPlace(map, rows, cols, textureCatalog = activeTextureCatalog) {
  if (!map) {
    return;
  }
  const nextRows = clamp(Number.parseInt(rows, 10) || map.rows || DEFAULT_GRID_ROWS, 5, 80);
  const nextCols = clamp(Number.parseInt(cols, 10) || map.cols || DEFAULT_GRID_COLS, 5, 80);
  if (map.rows === nextRows && map.cols === nextCols) {
    return;
  }
  resizeTerrainForMap(map, nextRows, nextCols, textureCatalog, createId);
  map.rows = nextRows;
  map.cols = nextCols;
  if (Array.isArray(map.tokens)) {
    map.tokens.forEach((token) => {
      token.x = clamp(Number.parseInt(token.x, 10) || 0, 0, nextCols - 1);
      token.y = clamp(Number.parseInt(token.y, 10) || 0, 0, nextRows - 1);
    });
  }
}

function createMap({ name, rows, cols, feetPerCell = 5, textureCatalog = activeTextureCatalog }) {
  const safeRows = clamp(Number.parseInt(rows, 10) || DEFAULT_GRID_ROWS, 5, 80);
  const safeCols = clamp(Number.parseInt(cols, 10) || DEFAULT_GRID_COLS, 5, 80);
  const safeFeetPerCell = clamp(Number.parseFloat(feetPerCell) || 5, 1, 200);
  const map = {
    id: createId("map"),
    name: String(name || "New Map").slice(0, 120),
    rows: safeRows,
    cols: safeCols,
    feetPerCell: safeFeetPerCell,
    gmTokenOpacity: DEFAULT_GM_TOKEN_OPACITY,
    scenarioType: "standard",
    background: {
      imageDataUrl: "",
    },
    terrainVersion: 2,
    terrainLayers: [],
    tokens: [],
    drawings: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  ensureTerrainLayers(map, textureCatalog, createId);
  return map;
}

function normalizeUserUsername(username) {
  return String(username || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 48);
}

function hashPassword(password, salt) {
  return crypto
    .createHash("sha256")
    .update(`${salt}:${password}`)
    .digest("hex");
}

function createStoredUser({ username, password }) {
  const salt = crypto.randomBytes(12).toString("hex");
  return {
    id: createId("user"),
    username,
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: nowIso(),
  };
}

function verifyPassword(user, password) {
  const expected = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(user.passwordHash));
}

function getTerrainCell(map, x, y) {
  return getTopTerrainComponent(map, x, y);
}

function findTokenById(map, tokenId) {
  if (!map || !Array.isArray(map.tokens)) {
    return null;
  }
  return map.tokens.find((token) => token.id === tokenId) || null;
}

function getTokenAtPosition(map, x, y, excludeTokenId = null) {
  if (!map || !Array.isArray(map.tokens)) {
    return null;
  }
  return (
    map.tokens.find(
      (token) => token.id !== excludeTokenId && token.layer === "tokens" && token.x === x && token.y === y
    ) || null
  );
}

function coordKey(x, y) {
  return `${x},${y}`;
}

function neighbors4(x, y) {
  return [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ];
}

function computePathAndCost(map, token, targetX, targetY) {
  const startX = token.x;
  const startY = token.y;
  const maxNodes = map.rows * map.cols;
  const dist = new Map();
  const prev = new Map();
  const queue = [];

  dist.set(coordKey(startX, startY), 0);
  queue.push({ x: startX, y: startY, cost: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    const currentKey = coordKey(current.x, current.y);

    if (current.x === targetX && current.y === targetY) {
      break;
    }

    if (dist.get(currentKey) !== current.cost) {
      continue;
    }

    for (const [nx, ny] of neighbors4(current.x, current.y)) {
      if (nx < 0 || ny < 0 || nx >= map.cols || ny >= map.rows) {
        continue;
      }
      const cell = getTerrainCell(map, nx, ny);
      if (isTileBlockingMovement(cell)) {
        continue;
      }

      let stepCost = 5;
      if (getTokenAtPosition(map, nx, ny, token.id)) {
        stepCost *= 2;
      }

      const nextCost = current.cost + stepCost;
      const nextKey = coordKey(nx, ny);
      if (!dist.has(nextKey) || nextCost < dist.get(nextKey)) {
        dist.set(nextKey, nextCost);
        prev.set(nextKey, currentKey);
        queue.push({ x: nx, y: ny, cost: nextCost });
        if (queue.length > maxNodes * 4) {
          queue.length = maxNodes * 4;
        }
      }
    }
  }

  const targetKey = coordKey(targetX, targetY);
  if (!dist.has(targetKey)) {
    return null;
  }

  const path = [];
  let cursor = targetKey;
  while (cursor) {
    const [xRaw, yRaw] = cursor.split(",");
    path.push({ x: Number.parseInt(xRaw, 10), y: Number.parseInt(yRaw, 10) });
    cursor = prev.get(cursor) || null;
  }
  path.reverse();

  return {
    path,
    cost: dist.get(targetKey),
  };
}

function computeAvailableModifiers(characterLike) {
  const feats = normalizeFeatSet(characterLike && characterLike.parsedSheet && characterLike.parsedSheet.feats);
  const available = [];
  Object.values(ROLL_MODIFIER_CATALOG).forEach((modifier) => {
    if (modifier.featNames.some((name) => feats.has(normalizeFeatName(name)))) {
      available.push(modifier.id);
    }
  });
  return available;
}

function rollD20WithAdvantageLevel(advantageLevel, extraDice = 0) {
  const advLevel = clamp(Number.parseInt(advantageLevel, 10) || 0, -5, 5);
  const baseCount = 1 + Math.abs(advLevel) + Math.max(0, Number.parseInt(extraDice, 10) || 0);
  const dice = [];
  for (let i = 0; i < baseCount; i += 1) {
    dice.push(randomInt(1, 20));
  }

  let selectedIndex = 0;
  if (advLevel > 0) {
    let best = dice[0];
    for (let i = 1; i < dice.length; i += 1) {
      if (dice[i] > best) {
        best = dice[i];
        selectedIndex = i;
      }
    }
  } else if (advLevel < 0) {
    let lowest = dice[0];
    for (let i = 1; i < dice.length; i += 1) {
      if (dice[i] < lowest) {
        lowest = dice[i];
        selectedIndex = i;
      }
    }
  }

  return {
    advantageLevel: advLevel,
    dice,
    selectedIndex,
    selected: dice[selectedIndex],
  };
}

function recomputeSelectedD20(d20Roll) {
  if (!d20Roll || !Array.isArray(d20Roll.dice) || d20Roll.dice.length === 0) {
    return;
  }
  d20Roll.selectedIndex = 0;
  if (d20Roll.advantageLevel > 0) {
    let best = d20Roll.dice[0];
    for (let i = 1; i < d20Roll.dice.length; i += 1) {
      if (d20Roll.dice[i] > best) {
        best = d20Roll.dice[i];
        d20Roll.selectedIndex = i;
      }
    }
  } else if (d20Roll.advantageLevel < 0) {
    let low = d20Roll.dice[0];
    for (let i = 1; i < d20Roll.dice.length; i += 1) {
      if (d20Roll.dice[i] < low) {
        low = d20Roll.dice[i];
        d20Roll.selectedIndex = i;
      }
    }
  }
  d20Roll.selected = d20Roll.dice[d20Roll.selectedIndex];
}

function chooseRarityFromD20(d20) {
  if (d20 <= 12) {
    return "common";
  }
  if (d20 <= 17) {
    return "uncommon";
  }
  if (d20 <= 19) {
    return "rare";
  }
  return "very_rare";
}

function resolveInjuryTier(failureBy) {
  if (failureBy <= 10) {
    return "minor";
  }
  if (failureBy <= 20) {
    return "moderate";
  }
  return "major";
}

function parseManualStatblockText(text) {
  const rows = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const byKey = {};
  rows.forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      return;
    }
    const key = normalizeSkillName(line.slice(0, separatorIndex));
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      byKey[key] = value;
    }
  });

  const stats = {
    skills: {},
    feats: [],
    currentValues: {},
    currentValueMeta: {},
    parsedAt: nowIso(),
    italicizedSkillDc: normalizeNumber(byKey["italicized skill dc"], 0),
    strengthModifier: normalizeNumber(byKey.strength, 0),
    resistDamageBonus: normalizeNumber(byKey["resist damage"], 0),
    initiativeBonus: normalizeNumber(byKey.initiative, 0),
    speed: normalizeNumber(byKey.speed, 30),
    maxHp: Math.max(1, normalizeNumber(byKey.hp, 1)),
  };

  [
    "melee weapons",
    "ranged weapons",
    "dodge",
    "health pool",
    "mana pool",
    "resist condition",
    "resist damage",
    "resistive willpower",
    "evoke runes",
    "initiative",
    "beseech the gods",
    "strength",
    "athletics",
    "stealth",
    "endurance",
    "resist pain",
    "assertive willpower",
    "problem solving",
    "craft magic item",
    "knowledge (lore)",
    "knowledge (magic)",
    "knowledge (biology)",
    "perception",
    "charisma",
    "perform",
    "sense motive",
    "deception",
    "interact with nature",
  ].forEach((skill) => {
    if (byKey[skill] !== undefined) {
      stats.skills[skill] = normalizeNumber(byKey[skill], 0);
    }
  });

  Object.keys(byKey).forEach((key) => {
    stats.currentValues[key] = parseSheetCellValue(byKey[key]);
    stats.currentValueMeta[key] = {
      key,
      rowNumber: null,
      baseRaw: String(byKey[key]),
      currentRaw: "",
      baseValue: parseSheetCellValue(byKey[key]),
      currentValue: "",
      displayValue: String(parseSheetCellValue(byKey[key])),
      hasCurrent: false,
      hasBase: String(byKey[key]).trim() !== "",
      bCell: null,
      dCell: null,
    };
  });
  if (stats.currentValues.speed === undefined) {
    stats.currentValues.speed = stats.speed;
  }
  if (stats.currentValues["max hp"] === undefined) {
    stats.currentValues["max hp"] = stats.maxHp;
  }
  if (stats.currentValues["strength mod"] === undefined) {
    stats.currentValues["strength mod"] = stats.strengthModifier;
  }
  if (stats.currentValues.isdc === undefined) {
    stats.currentValues.isdc = stats.italicizedSkillDc;
  }

  return stats;
}

function sortInitiativeEntries(entries) {
  return entries
    .slice()
    .sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      return b.roll - a.roll;
    });
}

function createDefaultInitiativeState() {
  return {
    active: false,
    order: [],
    currentIndex: 0,
    round: 1,
    movementSpentByToken: {},
  };
}

function createDefaultScene(activeMapId) {
  return {
    activeMapId: activeMapId || null,
    selectedDmCharacterId: null,
    initiative: createDefaultInitiativeState(),
  };
}

function normalizeMapShape(map) {
  if (!map || typeof map !== "object") {
    return null;
  }
  map.id = map.id || createId("map");
  map.name = String(map.name || "Map").slice(0, 120);
  map.rows = clamp(Number.parseInt(map.rows, 10) || DEFAULT_GRID_ROWS, 5, 80);
  map.cols = clamp(Number.parseInt(map.cols, 10) || DEFAULT_GRID_COLS, 5, 80);
  map.createdAt = map.createdAt || nowIso();
  map.updatedAt = map.updatedAt || nowIso();
  map.scenarioType = "standard";
  if (!Number.isFinite(map.feetPerCell) || Number(map.feetPerCell) <= 0) {
    map.feetPerCell = 5;
  }
  map.gmTokenOpacity = clamp(Number.parseFloat(map.gmTokenOpacity), 0.1, 1);
  if (!Number.isFinite(map.gmTokenOpacity)) {
    map.gmTokenOpacity = DEFAULT_GM_TOKEN_OPACITY;
  }
  if (!map.background || typeof map.background !== "object") {
    map.background = { imageDataUrl: "" };
  }
  if (typeof map.background.imageDataUrl !== "string") {
    map.background.imageDataUrl = "";
  }
  ensureTerrainLayers(map, activeTextureCatalog, createId);
  if (!Array.isArray(map.tokens)) {
    map.tokens = [];
  }
  if (!Array.isArray(map.drawings)) {
    map.drawings = [];
  } else {
    map.drawings = map.drawings
      .filter((drawing) => drawing && typeof drawing === "object")
      .map((drawing) => ({
        ...drawing,
        layer: drawing.layer === "gm" ? "gm" : "tokens",
      }));
  }
  return map;
}

function createCampaign({
  name,
  dmUserId = null,
  createdByUserId = null,
  characters = [],
  statblocks = [],
  maps = null,
  scene = null,
  logs = [],
  terrainTextureDefaults = {},
}) {
  const baseMapList = Array.isArray(maps) && maps.length > 0
    ? maps.map((map) => normalizeMapShape(map)).filter(Boolean)
    : [createMap({ name: "Default Tabletop Map", rows: DEFAULT_GRID_ROWS, cols: DEFAULT_GRID_COLS })];
  const firstMap = baseMapList[0] || null;
  const normalizedScene = scene && typeof scene === "object"
    ? {
      ...createDefaultScene(firstMap ? firstMap.id : null),
      ...scene,
    }
    : createDefaultScene(firstMap ? firstMap.id : null);
  if (
    !normalizedScene.activeMapId ||
    !baseMapList.some((map) => map.id === normalizedScene.activeMapId)
  ) {
    normalizedScene.activeMapId = firstMap ? firstMap.id : null;
  }
  if (!normalizedScene.initiative || typeof normalizedScene.initiative !== "object") {
    normalizedScene.initiative = createDefaultInitiativeState();
  } else {
    normalizedScene.initiative = {
      ...createDefaultInitiativeState(),
      ...normalizedScene.initiative,
    };
  }

  return {
    id: createId("campaign"),
    name: String(name || "New Campaign").slice(0, 120),
    dmUserId: dmUserId || null,
    createdByUserId: createdByUserId || dmUserId || null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    characters: Array.isArray(characters) ? characters : [],
    statblocks: Array.isArray(statblocks) ? statblocks : [],
    maps: baseMapList,
    scene: normalizedScene,
    logs: Array.isArray(logs) ? logs : [],
    terrainTextureDefaults: normalizeTextureDefaults(terrainTextureDefaults, activeTextureCatalog),
  };
}

function normalizeCampaignShape(campaign) {
  if (!campaign || typeof campaign !== "object") {
    return createCampaign({ name: "Campaign" });
  }
  campaign.id = campaign.id || createId("campaign");
  campaign.name = String(campaign.name || "Campaign").slice(0, 120);
  campaign.dmUserId = campaign.dmUserId || null;
  campaign.createdByUserId = campaign.createdByUserId || campaign.dmUserId || null;
  campaign.createdAt = campaign.createdAt || nowIso();
  campaign.updatedAt = campaign.updatedAt || nowIso();
  campaign.characters = Array.isArray(campaign.characters) ? campaign.characters : [];
  campaign.statblocks = Array.isArray(campaign.statblocks) ? campaign.statblocks : [];
  normalizeCampaignTerrainDefaults(campaign, activeTextureCatalog);
  campaign.maps = (Array.isArray(campaign.maps) ? campaign.maps : [])
    .map((map) => normalizeMapShape(map))
    .filter(Boolean);
  if (campaign.maps.length === 0) {
    campaign.maps.push(createMap({ name: "Default Tabletop Map", rows: DEFAULT_GRID_ROWS, cols: DEFAULT_GRID_COLS }));
  }
  campaign.scene = campaign.scene && typeof campaign.scene === "object"
    ? {
      ...createDefaultScene(campaign.maps[0].id),
      ...campaign.scene,
    }
    : createDefaultScene(campaign.maps[0].id);
  if (!campaign.scene.initiative || typeof campaign.scene.initiative !== "object") {
    campaign.scene.initiative = createDefaultInitiativeState();
  } else {
    campaign.scene.initiative = {
      ...createDefaultInitiativeState(),
      ...campaign.scene.initiative,
    };
  }
  if (!campaign.maps.some((map) => map.id === campaign.scene.activeMapId)) {
    campaign.scene.activeMapId = campaign.maps[0].id;
  }
  campaign.logs = Array.isArray(campaign.logs) ? campaign.logs : [];
  return campaign;
}

function migrateStateShape(rawState) {
  const state = rawState && typeof rawState === "object" ? rawState : {};
  state.users = Array.isArray(state.users) ? state.users : [];
  const legacyDmUserId =
    (state.users.find((user) => user && user.role === "dm") || {}).id ||
    (state.users[0] && state.users[0].id) ||
    null;
  state.users.forEach((user) => {
    if (user && typeof user === "object" && user.role) {
      delete user.role;
    }
  });

  if (Array.isArray(state.campaigns) && state.campaigns.length > 0) {
    state.campaigns = state.campaigns.map((campaign) => normalizeCampaignShape(campaign));
  } else {
    const legacyMaps = Array.isArray(state.maps) ? state.maps.map((map) => deepClone(map)) : [];
    const legacyCharacters = Array.isArray(state.characters) ? state.characters : [];
    const legacyStatblocks = Array.isArray(state.statblocks) ? state.statblocks : [];
    const legacyScene = state.scene && typeof state.scene === "object" ? deepClone(state.scene) : null;
    const legacyLogs = Array.isArray(state.logs) ? state.logs : [];
    const dmUserId = legacyDmUserId;

    state.campaigns = [
      createCampaign({
        name: "Campaign 1",
        dmUserId,
        createdByUserId: dmUserId,
        characters: legacyCharacters,
        statblocks: legacyStatblocks,
        maps: legacyMaps.length > 0 ? legacyMaps : null,
        scene: legacyScene,
        logs: legacyLogs,
        terrainTextureDefaults: {},
      }),
    ];
  }

  delete state.characters;
  delete state.statblocks;
  delete state.maps;
  delete state.scene;
  delete state.logs;

  state.meta = state.meta || {};
  state.meta.createdAt = state.meta.createdAt || nowIso();
  state.meta.updatedAt = state.meta.updatedAt || nowIso();
  state.meta.terrainTextureDefaultsGlobal = normalizeTextureDefaults(
    state.meta.terrainTextureDefaultsGlobal,
    activeTextureCatalog
  );
  return state;
}

function buildDefaultState() {
  return migrateStateShape({
    users: [],
    campaigns: [createCampaign({ name: "Campaign 1" })],
    meta: {
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  });
}

function createPersistence(dataDirectory) {
  const dir = dataDirectory || path.join(__dirname, "..", "..", "generated", "tabletop");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "state.json");

  let state = parseJsonFile(filePath, null);
  if (!state || typeof state !== "object") {
    state = buildDefaultState();
    writeJsonFile(filePath, state);
  } else {
    state = migrateStateShape(state);
    writeJsonFile(filePath, state);
  }

  let saveTimer = null;
  function scheduleSave() {
    if (saveTimer) {
      return;
    }
    saveTimer = setTimeout(() => {
      saveTimer = null;
      state.meta = state.meta || {};
      state.meta.updatedAt = nowIso();
      writeJsonFile(filePath, state);
    }, 80);
  }

  return {
    getState() {
      return state;
    },
    saveSoon: scheduleSave,
    forceSave() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      state.meta = state.meta || {};
      state.meta.updatedAt = nowIso();
      writeJsonFile(filePath, state);
    },
  };
}

function createLogEntry({ type, actor, message, details }) {
  return {
    id: createId("log"),
    timestamp: nowIso(),
    type,
    actor: actor || null,
    message: String(message || ""),
    details: details || null,
  };
}

function activeMapFromCampaign(campaign) {
  if (!campaign || !Array.isArray(campaign.maps)) {
    return null;
  }
  return campaign.maps.find((map) => map.id === campaign.scene.activeMapId) || campaign.maps[0] || null;
}

function sanitizedMapForRole(map, role) {
  if (!map) {
    return null;
  }
  const cloned = cloneVisibleMapForRole(map, role);
  if (role !== "dm") {
    cloned.tokens = cloned.tokens.filter((token) => token.layer !== "gm");
    cloned.drawings = (Array.isArray(cloned.drawings) ? cloned.drawings : []).filter(
      (drawing) => drawing.layer !== "gm"
    );
  }
  return cloned;
}

function sanitizeUserForClient(user) {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    username: user.username,
  };
}

function sanitizeCharacterForClient(character, role, userId) {
  if (!character) {
    return null;
  }
  const base = {
    id: character.id,
    ownerUserId: character.ownerUserId,
    name: character.name,
    tokenImage: character.tokenImage || "",
    sheetUrl: character.sheetUrl || "",
    parsedSheet: character.parsedSheet || null,
    updatedAt: character.updatedAt,
  };
  if (role === "dm" || character.ownerUserId === userId) {
    return base;
  }
  return {
    ...base,
    sheetUrl: "",
  };
}

function sanitizeStatblockForClient(statblock, role) {
  if (!statblock) {
    return null;
  }
  if (role === "dm") {
    return statblock;
  }
  return {
    id: statblock.id,
    ownerUserId: statblock.ownerUserId || null,
    name: statblock.name,
    tokenImage: statblock.tokenImage || "",
    parsedSheet: statblock.parsedSheet || null,
    updatedAt: statblock.updatedAt,
  };
}

function createTabletopSystem(io, options = {}) {
  activeTextureCatalog = buildTextureCatalog(options.textureLibraryRoot || DEFAULT_TERRAIN_TEXTURE_ROOT);
  const persistence = createPersistence(options.dataDirectory);
  const state = persistence.getState();

  state.campaigns.forEach((campaign) => {
    normalizeCampaignShape(campaign);
  });

  const sessions = new Map();
  const socketToSession = new Map();
  const approvalRequests = new Map();
  const storedBottledLuck = new Map();
  const herbsState = {
    loadedAt: null,
    herbs: [],
    error: null,
  };

  function getSheetsAccessToken() {
    return String(options.googleSheetsAccessToken || process.env.GOOGLE_SHEETS_ACCESS_TOKEN || "").trim();
  }

  async function updateSheetCellValue(sheetId, range, value) {
    const token = getSheetsAccessToken();
    if (!token) {
      throw new Error("GOOGLE_SHEETS_ACCESS_TOKEN is not configured.");
    }
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        range,
        majorDimension: "ROWS",
        values: [[String(value)]],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Sheet update failed (${response.status}): ${body.slice(0, 180)}`);
    }
  }

  async function consumeCharacterUsageCounters(character, usageCounters) {
    if (!character || !Array.isArray(usageCounters) || usageCounters.length === 0) {
      return;
    }
    const sheetId = parseSheetIdFromUrl(character.sheetUrl);
    if (!sheetId) {
      throw new Error("Character sheet URL is invalid for usage updates.");
    }

    const consumable = usageCounters.filter(
      (counter) => counter && counter.hasCurrent && counter.dCell && Number.isFinite(counter.remainingNumeric)
    );
    if (consumable.length === 0) {
      return;
    }

    for (const counter of consumable) {
      const nextValue = Math.max(0, Number(counter.remainingNumeric) - 1);
      const range = `'Stats 🗡️'!${counter.dCell}`;
      await updateSheetCellValue(sheetId, range, nextValue);
    }

    character.parsedSheet = await parseCharacterSheet(character.sheetUrl);
    character.availableModifiers = computeAvailableModifiers(character);
    character.updatedAt = nowIso();
    character.sheetError = null;
  }

  function findCampaignById(campaignId) {
    if (!campaignId) {
      return null;
    }
    return state.campaigns.find((campaign) => campaign.id === campaignId) || null;
  }

  function firstCampaign() {
    return state.campaigns[0] || null;
  }

  function roleForUserInCampaign(user, campaign) {
    if (!user || !campaign) {
      return "guest";
    }
    return campaign.dmUserId && campaign.dmUserId === user.id ? "dm" : "player";
  }

  function campaignForSocket(socket) {
    const byId = findCampaignById(socket && socket.data ? socket.data.campaignId : null);
    if (byId) {
      return byId;
    }
    return firstCampaign();
  }

  function ensureSocketCampaign(socket) {
    const campaign = campaignForSocket(socket);
    if (socket && socket.data) {
      socket.data.campaignId = campaign ? campaign.id : null;
      socket.data.role = roleForUserInCampaign(socket.data.user || null, campaign);
    }
    return campaign;
  }

  function appendLog(campaign, entry) {
    if (!campaign) {
      return;
    }
    campaign.logs.push(entry);
    if (campaign.logs.length > 5000) {
      campaign.logs.splice(0, campaign.logs.length - 5000);
    }
    campaign.updatedAt = nowIso();
    persistence.saveSoon();
  }

  function getConnectedUsers(campaignId) {
    const map = new Map();
    for (const socket of namespace.sockets.values()) {
      if (socket.data && socket.data.user && socket.data.user.id && socket.data.campaignId === campaignId) {
        const campaign = findCampaignById(campaignId);
        map.set(socket.data.user.id, {
          id: socket.data.user.id,
          username: socket.data.user.username,
          role: roleForUserInCampaign(socket.data.user, campaign),
        });
      }
    }
    return Array.from(map.values());
  }

  function sessionForSocket(socket) {
    const token = socketToSession.get(socket.id);
    if (!token) {
      return null;
    }
    return sessions.get(token) || null;
  }

  function authenticateSocket(socket, sessionToken) {
    const session = sessions.get(sessionToken);
    if (!session) {
      return false;
    }
    const user = state.users.find((candidate) => candidate.id === session.userId);
    if (!user) {
      return false;
    }
    socket.data.user = user;
    socket.data.campaignId = findCampaignById(session.campaignId) ? session.campaignId : null;
    ensureSocketCampaign(socket);
    socketToSession.set(socket.id, sessionToken);
    session.lastSeenAt = Date.now();
    return true;
  }

  function makeSnapshot(socket) {
    const user = socket.data.user || null;
    const campaign = ensureSocketCampaign(socket);
    const role = roleForUserInCampaign(user, campaign);
    const map = activeMapFromCampaign(campaign);
    const selectedDmCharacterId = campaign && campaign.scene ? campaign.scene.selectedDmCharacterId : null;
    const campaignList = state.campaigns.map((entry) => {
      const dmUser = state.users.find((candidate) => candidate.id === entry.dmUserId) || null;
      return {
        id: entry.id,
        name: entry.name,
        dmUserId: entry.dmUserId || null,
        dmUsername: dmUser ? dmUser.username : null,
        updatedAt: entry.updatedAt || null,
        isDm: Boolean(user && entry.dmUserId === user.id),
      };
    });

    return {
      auth: {
        user: sanitizeUserForClient(user),
        sessionToken: sessionForSocket(socket) ? sessionForSocket(socket).token : null,
        campaignId: campaign ? campaign.id : null,
        campaignRole: role,
      },
      campaigns: campaignList,
      config: {
        modifierCatalog: ROLL_MODIFIER_CATALOG,
        italicizedSkills: Array.from(ITALICIZED_SKILLS),
      },
      terrain: {
        campaignTextureDefaults:
          campaign && campaign.terrainTextureDefaults ? campaign.terrainTextureDefaults : {},
        globalTextureDefaults: state.meta && state.meta.terrainTextureDefaultsGlobal
          ? state.meta.terrainTextureDefaultsGlobal
          : {},
        resolvedTextureDefaults: buildResolvedTextureDefaults(
          activeTextureCatalog,
          campaign && campaign.terrainTextureDefaults ? campaign.terrainTextureDefaults : {},
          state.meta && state.meta.terrainTextureDefaultsGlobal
            ? state.meta.terrainTextureDefaultsGlobal
            : {}
        ),
      },
      scene: {
        activeMapId: map ? map.id : null,
        map: sanitizedMapForRole(map, role),
        selectedDmCharacterId,
        initiative: campaign && campaign.scene ? campaign.scene.initiative : createDefaultInitiativeState(),
      },
      maps: (campaign && Array.isArray(campaign.maps) ? campaign.maps : []).map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        rows: candidate.rows,
        cols: candidate.cols,
        feetPerCell: Number(candidate.feetPerCell) || 5,
        gmTokenOpacity: Number.isFinite(Number(candidate.gmTokenOpacity))
          ? clamp(Number(candidate.gmTokenOpacity), 0.1, 1)
          : DEFAULT_GM_TOKEN_OPACITY,
        scenarioType: candidate.scenarioType || "standard",
        updatedAt: candidate.updatedAt,
      })),
      characters: (campaign && Array.isArray(campaign.characters) ? campaign.characters : [])
        .map((character) => sanitizeCharacterForClient(character, role, user ? user.id : null))
        .filter(Boolean),
      statblocks: (campaign && Array.isArray(campaign.statblocks) ? campaign.statblocks : [])
        .map((statblock) => sanitizeStatblockForClient(statblock, role))
        .filter(Boolean),
      logs: campaign && Array.isArray(campaign.logs) ? campaign.logs.slice(-500) : [],
      herbs: {
        loadedAt: herbsState.loadedAt,
        count: herbsState.herbs.length,
        error: herbsState.error,
      },
      connectedUsers: getConnectedUsers(campaign ? campaign.id : null),
    };
  }

  function emitSnapshot(socket) {
    socket.emit("tabletop:state", makeSnapshot(socket));
  }

  function emitTerrainCatalog(socket) {
    socket.emit("terrain:catalog", serializeTextureCatalogForClient(activeTextureCatalog));
  }

  function broadcastSnapshots() {
    for (const socket of namespace.sockets.values()) {
      emitSnapshot(socket);
    }
  }

  function requireAuth(socket) {
    if (!socket.data.user) {
      socket.emit("tabletop:error", { message: "You must be logged in." });
      return false;
    }
    return true;
  }

  function requireDm(socket) {
    if (!requireAuth(socket)) {
      return false;
    }
    const campaign = ensureSocketCampaign(socket);
    if (!campaign) {
      socket.emit("tabletop:error", { message: "No campaign selected." });
      return false;
    }
    if (roleForUserInCampaign(socket.data.user, campaign) !== "dm") {
      socket.emit("tabletop:error", { message: "DM privileges required." });
      return false;
    }
    return true;
  }

  function userOwnsCharacter(campaign, userId, characterId) {
    if (!campaign) {
      return false;
    }
    return campaign.characters.some(
      (character) => character.id === characterId && character.ownerUserId === userId
    );
  }

  function canControlToken(socket, campaign, token) {
    if (!token || !socket.data.user) {
      return false;
    }
    if (roleForUserInCampaign(socket.data.user, campaign) === "dm") {
      return true;
    }
    const userId = socket.data.user.id;
    if (token.sourceType === "character") {
      return userOwnsCharacter(campaign, userId, token.sourceId);
    }
    if (token.ownerUserId === userId) {
      return true;
    }
    return false;
  }

  function appendSystemLog(campaign, actorSocket, message, details) {
    appendLog(
      campaign,
      createLogEntry({
        type: "system",
        actor: actorSocket && actorSocket.data && actorSocket.data.user
          ? actorSocket.data.user.username
          : "system",
        message,
        details,
      })
    );
  }

  function getEntityByToken(campaign, token) {
    if (!token) {
      return null;
    }
    if (token.sourceType === "character") {
      return campaign.characters.find((character) => character.id === token.sourceId) || null;
    }
    if (token.sourceType === "statblock") {
      return campaign.statblocks.find((statblock) => statblock.id === token.sourceId) || null;
    }
    return null;
  }

  function resolveTokenMovementMax(campaign, token) {
    const entity = getEntityByToken(campaign, token);
    if (entity && entity.parsedSheet && Number.isFinite(entity.parsedSheet.speed)) {
      return Math.max(0, Number(entity.parsedSheet.speed));
    }
    return Math.max(0, Number(token.movementMax || 30));
  }

  function applyScenarioTileEffects(campaign, map, token, targetCell) {
    void campaign;
    void map;
    void token;
    void targetCell;
  }

  function ensureTokenInitiativeInfo(campaign, token) {
    if (!token.movementInfo) {
      token.movementInfo = {
        spent: 0,
        max: resolveTokenMovementMax(campaign, token),
        overLimit: false,
      };
    }
  }

  function updateMovementTracking(campaign, map, token, movementCost) {
    const initiative = campaign.scene.initiative;
    if (!initiative || !initiative.active) {
      return;
    }
    if (!initiative.order[initiative.currentIndex]) {
      return;
    }
    const currentEntry = initiative.order[initiative.currentIndex];
    if (currentEntry.tokenId !== token.id) {
      return;
    }

    const spentByToken = initiative.movementSpentByToken;
    const previous = Number(spentByToken[token.id] || 0);
    const next = previous + movementCost;
    spentByToken[token.id] = next;

    ensureTokenInitiativeInfo(campaign, token);
    const movementMax = resolveTokenMovementMax(campaign, token);
    token.movementInfo = {
      spent: next,
      max: movementMax,
      overLimit: next > movementMax,
    };
  }

  function maybeConsumeBottledLuck(userId, skillName, rollType, advantageLevel) {
    const key = `${userId}:${normalizeSkillName(skillName)}:${normalizeSkillName(rollType)}`;
    const stored = storedBottledLuck.get(key);
    if (!stored) {
      return advantageLevel;
    }
    if (Date.now() - Number(stored.createdAt || 0) > 60_000) {
      storedBottledLuck.delete(key);
      return advantageLevel;
    }
    storedBottledLuck.delete(key);
    return Number(advantageLevel || 0) + 1;
  }

  function applyPassiveD20Modifiers(d20Roll, payload, actorEntity, externalModifiersUsed) {
    const skillNameNormalized = normalizeSkillName(payload.skillName);
    const rollTypeNormalized = normalizeSkillName(payload.rollType);
    const blockClericDiceFeats = skillNameNormalized === "craft magic item";

    const feats = normalizeFeatSet(actorEntity && actorEntity.parsedSheet && actorEntity.parsedSheet.feats);

    if (
      !blockClericDiceFeats &&
      feats.has(normalizeFeatName("In Tune With The Gods")) &&
      (rollTypeNormalized === "prepared_prayer" || rollTypeNormalized === "beseech_the_gods")
    ) {
      for (let i = 0; i < d20Roll.dice.length; i += 1) {
        let guard = 0;
        while (Number(d20Roll.dice[i]) < 6 && guard < 40) {
          d20Roll.dice[i] = randomInt(1, 20);
          guard += 1;
        }
      }
    }

    if (!blockClericDiceFeats && feats.has(normalizeFeatName("Small Fortunes"))) {
      for (let i = 0; i < d20Roll.dice.length; i += 1) {
        let guard = 0;
        while (d20Roll.dice[i] === 1 && guard < 40) {
          d20Roll.dice[i] = randomInt(1, 20);
          guard += 1;
        }
      }
    }

    if (!blockClericDiceFeats && externalModifiersUsed.includes("small_fortunes")) {
      for (let i = 0; i < d20Roll.dice.length; i += 1) {
        if (d20Roll.dice[i] === 1) {
          d20Roll.dice[i] = randomInt(1, 20);
        }
      }
    }

    if (
      feats.has(normalizeFeatName("Master of Deceit")) &&
      ["deception", "sense motive"].includes(skillNameNormalized)
    ) {
      for (let i = 0; i < d20Roll.dice.length; i += 1) {
        if (d20Roll.dice[i] <= 7) {
          d20Roll.dice[i] = 8;
        }
      }
    }

    recomputeSelectedD20(d20Roll);
  }

  function resolveRoll(socket, campaign, payload) {
    const actorUser = socket.data.user;
    const actorRole = roleForUserInCampaign(actorUser, campaign);

    const skillName = String(payload.skillName || "").trim();
    const rollType = String(payload.rollType || "minor_skill").trim().toLowerCase();
    const bonusOverride = Number.isFinite(payload.bonusOverride)
      ? Number(payload.bonusOverride)
      : null;

    let actorEntity = null;
    if (payload.characterId) {
      actorEntity = campaign.characters.find((character) => character.id === payload.characterId) || null;
      if (!actorEntity) {
        return { ok: false, error: "Unknown character." };
      }
      if (actorRole !== "dm" && actorEntity.ownerUserId !== actorUser.id) {
        return { ok: false, error: "You can only roll for your own character." };
      }
    } else if (payload.statblockId) {
      actorEntity = campaign.statblocks.find((statblock) => statblock.id === payload.statblockId) || null;
      if (!actorEntity) {
        return { ok: false, error: "Unknown statblock." };
      }
      if (actorRole !== "dm") {
        return { ok: false, error: "Only DMs can roll for statblocks." };
      }
    }

    if (!actorEntity) {
      return { ok: false, error: "Select a character or statblock first." };
    }

    const parsed = actorEntity.parsedSheet || { skills: {}, feats: [] };
    const normalizedSkill = normalizeSkillName(skillName);
    const blockClericDiceFeats = normalizedSkill === "craft magic item";

    let baseBonus = bonusOverride;
    if (baseBonus === null) {
      baseBonus = Number(parsed.skills && parsed.skills[normalizedSkill]);
      if (!Number.isFinite(baseBonus)) {
        baseBonus = 0;
      }
    }

    const requestedModifiers = Array.isArray(payload.modifiers) ? payload.modifiers : [];
    const approvedIds = Array.isArray(payload.approvalIds) ? payload.approvalIds : [];
    const externalModifiersUsed = [];

    for (const approvalId of approvedIds) {
      const approval = approvalRequests.get(approvalId);
      if (!approval) {
        return { ok: false, error: "A modifier approval expired or is invalid." };
      }
      if (!approval.approved || approval.used) {
        return { ok: false, error: "A modifier approval was already used." };
      }
      if (approval.requesterUserId !== actorUser.id) {
        return { ok: false, error: "A modifier approval belongs to a different player." };
      }
      if (Date.now() > approval.expiresAt) {
        approvalRequests.delete(approvalId);
        return { ok: false, error: "A modifier approval expired." };
      }
      approval.used = true;
      externalModifiersUsed.push(approval.modifierId);
    }

    let advantageLevel = Number.parseInt(payload.advantageLevel, 10) || 0;

    if (!blockClericDiceFeats) {
      advantageLevel = maybeConsumeBottledLuck(actorUser.id, normalizedSkill, rollType, advantageLevel);
    }

    const actorFeats = normalizeFeatSet(parsed.feats || []);
    const definitionById = new Map(
      Object.values(ROLL_MODIFIER_CATALOG).map((definition) => [definition.id, definition])
    );
    const usageCountersByKey = new Map();

    let bonusPenalty = 0;
    let guidingDice = [];
    let postDieAdjustments = [];
    let forcedDieValue = null;
    let fortuneOverFinesseEnabled = false;

    for (const modifier of requestedModifiers) {
      if (!modifier || !modifier.id) {
        continue;
      }
      const modifierId = String(modifier.id);
      const isExternal = Boolean(modifier.external);
      if (isExternal && !externalModifiersUsed.includes(modifierId)) {
        return { ok: false, error: `Modifier ${modifierId} requires approval.` };
      }
      if (blockClericDiceFeats && CLERIC_DICE_MODIFIER_IDS.has(modifierId)) {
        continue;
      }

      if (!isExternal) {
        const definition = definitionById.get(modifierId);
        if (definition && definition.featNames.length > 0) {
          const hasFeat = definition.featNames.some((feat) => actorFeats.has(normalizeFeatName(feat)));
          if (!hasFeat) {
            continue;
          }
        }

        const usageCounter = findUsageCounterForModifier(parsed, modifierId, definition || null);
        if (usageCounter) {
          if (usageCounter.remainingNumeric <= 0) {
            const featLabel = definition && definition.featNames && definition.featNames[0]
              ? definition.featNames[0]
              : modifierId;
            return {
              ok: false,
              error: `${featLabel} has 0 uses remaining.`,
            };
          }
          if (!usageCountersByKey.has(usageCounter.key)) {
            usageCountersByKey.set(usageCounter.key, {
              ...usageCounter,
              modifierId,
            });
          }
        }
      }

      if (modifierId === "luck_of_the_devout") {
        advantageLevel += 1;
      }

      if (modifierId === "bottled_luck") {
        if (!payload.consumeBottledLuckOnly) {
          advantageLevel -= 1;
          const key = `${actorUser.id}:${normalizedSkill}:${normalizeSkillName(rollType)}`;
          storedBottledLuck.set(key, {
            createdAt: Date.now(),
          });
        }
      }

      if (modifierId === "fortune_over_finesse") {
        fortuneOverFinesseEnabled = true;
      }

      if (modifierId === "portent") {
        const value = Number.parseInt(modifier.portentValue, 10);
        if (Number.isFinite(value) && value >= 1 && value <= 20) {
          forcedDieValue = value;
        }
      }

      if (modifierId === "guidance") {
        guidingDice.push({ type: "d4", roll: rollDice(1, 4).sum, source: modifierId });
      }

      if (modifierId === "master_guidance") {
        guidingDice.push({ type: "d6", roll: rollDice(1, 6).sum, source: modifierId });
      }

      if (modifierId === "inspiring_singing") {
        guidingDice.push({ type: "d8", roll: rollDice(1, 8).sum, source: modifierId });
      }

      if (modifierId === "inspiring_singing_ii") {
        if (["constitution_check", "resistive_willpower"].includes(rollType)) {
          const a = rollDice(1, 10).sum;
          const b = rollDice(1, 10).sum;
          guidingDice.push({ type: "2d10k1", roll: Math.max(a, b), source: modifierId, dice: [a, b] });
        } else {
          guidingDice.push({ type: "d10", roll: rollDice(1, 10).sum, source: modifierId });
        }
      }

      if (modifierId === "miracle_worker") {
        postDieAdjustments.push({ kind: "miracle_worker" });
      }

      if (modifierId === "inspired_by_the_gods") {
        postDieAdjustments.push({ kind: "reroll_one_d20" });
      }

      if (modifierId === "shifting_fortunes") {
        postDieAdjustments.push({ kind: "shift_with_d6" });
      }

      if (modifierId === "small_fortunes") {
        postDieAdjustments.push({ kind: "small_fortunes_external" });
      }
    }

    const baseBonusRaw = Number(baseBonus) || 0;
    const maxFofGroups = clamp(Math.floor(Math.max(0, baseBonusRaw) / 10), 0, 12);
    const requestedFofGroups = clamp(Number.parseInt(payload.fortuneOverFinesseGroups, 10) || 0, 0, 12);
    const fofExtraGroups = fortuneOverFinesseEnabled
      ? clamp(requestedFofGroups || maxFofGroups, 0, maxFofGroups)
      : 0;
    const fofBonusSubtracted = fofExtraGroups * 10;
    const effectiveBaseBonus = baseBonusRaw - fofBonusSubtracted;

    const d20Groups = [];
    for (let i = 0; i < 1 + fofExtraGroups; i += 1) {
      d20Groups.push(rollD20WithAdvantageLevel(advantageLevel, 0));
    }

    if (forcedDieValue !== null && d20Groups.length > 0) {
      d20Groups[0].dice[d20Groups[0].selectedIndex] = forcedDieValue;
      recomputeSelectedD20(d20Groups[0]);
    }

    d20Groups.forEach((group) => {
      applyPassiveD20Modifiers(group, payload, actorEntity, externalModifiersUsed);
    });

    function flattenD20Entries() {
      const entries = [];
      d20Groups.forEach((group, groupIndex) => {
        group.dice.forEach((value, dieIndex) => {
          entries.push({
            group,
            groupIndex,
            dieIndex,
            value,
          });
        });
      });
      return entries;
    }

    function resolveTargetEntry(rawIndex, fallbackToSelected = true) {
      const entries = flattenD20Entries();
      if (entries.length === 0) {
        return null;
      }
      const fallbackIndex = fallbackToSelected
        ? entries.findIndex(
          (entry) => entry.dieIndex === entry.group.selectedIndex && entry.groupIndex === 0
        )
        : 0;
      const safeFallback = fallbackIndex >= 0 ? fallbackIndex : 0;
      const targetIndex = clamp(
        Number.parseInt(rawIndex, 10) || safeFallback,
        0,
        entries.length - 1
      );
      return entries[targetIndex];
    }

    let rerollHappened = false;

    if (postDieAdjustments.some((entry) => entry.kind === "reroll_one_d20")) {
      const target = resolveTargetEntry(payload.targetDieIndexForReroll);
      if (target) {
        target.group.dice[target.dieIndex] = randomInt(1, 20);
        recomputeSelectedD20(target.group);
        rerollHappened = true;
      }
    }

    if (postDieAdjustments.some((entry) => entry.kind === "small_fortunes_external")) {
      const target = resolveTargetEntry(payload.targetDieIndexForSmallFortunes);
      if (target && target.group.dice[target.dieIndex] === 1) {
        target.group.dice[target.dieIndex] = randomInt(1, 20);
        rerollHappened = true;
      }
      if (target) {
        recomputeSelectedD20(target.group);
      }
    }

    if (postDieAdjustments.some((entry) => entry.kind === "miracle_worker")) {
      const hasTwenty = flattenD20Entries().some((entry) => entry.value === 20);
      if (hasTwenty && payload.useMiracleWorkerPenalty && d20Groups.length > 0) {
        bonusPenalty -= 10;
        d20Groups.push(rollD20WithAdvantageLevel(advantageLevel, 0));
        rerollHappened = true;
      }
    }

    let postShift = 0;
    if (rerollHappened && postDieAdjustments.some((entry) => entry.kind === "shift_with_d6")) {
      const d6 = randomInt(1, 6);
      const mode = payload.shiftingFortunesMode === "subtract" ? -1 : 1;
      postShift = d6 * mode;
    }

    const guidingTotal = guidingDice.reduce((acc, item) => acc + item.roll, 0);
    const d20SelectedTotal = d20Groups.reduce((acc, group) => acc + Number(group.selected || 0), 0);
    const flatD20Dice = d20Groups.flatMap((group) => group.dice);
    const d20Roll = {
      advantageLevel,
      dice: flatD20Dice,
      selectedIndex: d20Groups[0] ? d20Groups[0].selectedIndex : 0,
      selected: d20SelectedTotal,
      selectedTotal: d20SelectedTotal,
      groups: d20Groups.map((group) => ({
        dice: group.dice.slice(),
        selectedIndex: group.selectedIndex,
        selected: group.selected,
      })),
      fortuneOverFinesse: {
        enabled: fortuneOverFinesseEnabled,
        extraGroups: fofExtraGroups,
        bonusSubtracted: fofBonusSubtracted,
      },
    };

    const total =
      Number(d20SelectedTotal) +
      Number(effectiveBaseBonus) +
      Number(payload.flatModifier || 0) +
      bonusPenalty +
      guidingTotal +
      postShift;

    const isItalicized = ITALICIZED_SKILLS.has(normalizedSkill);
    const italicizedSkillDc = Number(parsed.italicizedSkillDc || 0);
    const strengthModifier = Number(parsed.strengthModifier || 0);

    let isdcCheck = null;
    if (isItalicized && italicizedSkillDc > strengthModifier + 1) {
      const isdcRoll = rollD20WithAdvantageLevel(
        Number.parseInt(payload.isdcAdvantageLevel, 10) || 0,
        0
      );
      const isdcTotal = isdcRoll.selected + strengthModifier + Number(payload.isdcFlatModifier || 0);
      isdcCheck = {
        required: true,
        dc: italicizedSkillDc,
        strengthModifier,
        d20: isdcRoll,
        total: isdcTotal,
        passed: isdcTotal >= italicizedSkillDc,
      };
    }

    return {
      ok: true,
      actorEntity,
      roll: {
        skillName,
        normalizedSkill,
        rollType,
        baseBonus: effectiveBaseBonus,
        baseBonusRaw,
        flatModifier: Number(payload.flatModifier || 0),
        advantageLevel,
        d20: d20Roll,
        guidingDice,
        bonusPenalty,
        fortuneOverFinesse: {
          enabled: fortuneOverFinesseEnabled,
          extraGroups: fofExtraGroups,
          bonusSubtracted: fofBonusSubtracted,
        },
        postShift,
        total,
        modifiersApplied: requestedModifiers,
        externalModifiersUsed,
        isdcCheck,
      },
      usageCountersToConsume: Array.from(usageCountersByKey.values()),
      logText: `${actorEntity.name} rolled ${skillName} (${rollType}) = ${total}`,
    };
  }

  const namespace = io.of(TABLETOP_NAMESPACE);

  async function refreshHerbs() {
    try {
      const herbs = await loadHerbDatabase();
      herbsState.herbs = herbs;
      herbsState.loadedAt = nowIso();
      herbsState.error = null;
      broadcastSnapshots();
    } catch (error) {
      herbsState.error = error.message;
    }
  }

  refreshHerbs();

  namespace.on("connection", (socket) => {
    socket.data.role = "guest";
    socket.data.user = null;
    socket.data.campaignId = firstCampaign() ? firstCampaign().id : null;

    emitTerrainCatalog(socket);
    emitSnapshot(socket);

    socket.on("auth:resume", (payload) => {
      const token = payload && payload.sessionToken ? String(payload.sessionToken) : "";
      if (!token || !authenticateSocket(socket, token)) {
        socket.emit("tabletop:error", { message: "Session expired. Please log in again." });
        emitSnapshot(socket);
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      appendSystemLog(campaign, socket, `${socket.data.user.username} resumed session.`);
      broadcastSnapshots();
    });

    socket.on("auth:register", (payload) => {
      const username = normalizeUserUsername(payload && payload.username);
      const password = String((payload && payload.password) || "");

      if (!username || username.length < 2) {
        socket.emit("tabletop:error", { message: "Username must be at least 2 characters." });
        return;
      }
      if (password.length < 4) {
        socket.emit("tabletop:error", { message: "Password must be at least 4 characters." });
        return;
      }
      if (
        state.users.some(
          (candidate) => normalizeUserUsername(candidate.username).toLowerCase() === username.toLowerCase()
        )
      ) {
        socket.emit("tabletop:error", { message: "That username is already taken." });
        return;
      }

      const user = createStoredUser({ username, password });
      state.users.push(user);
      persistence.saveSoon();

      socket.emit("tabletop:notice", { message: "Account created. You can now log in." });
      broadcastSnapshots();
    });

    socket.on("auth:login", (payload) => {
      const username = normalizeUserUsername(payload && payload.username);
      const password = String((payload && payload.password) || "");
      const user = state.users.find(
        (candidate) => normalizeUserUsername(candidate.username).toLowerCase() === username.toLowerCase()
      );

      if (!user || !verifyPassword(user, password)) {
        socket.emit("tabletop:error", { message: "Invalid username or password." });
        return;
      }

      const token = createId("session");
      const session = {
        token,
        userId: user.id,
        campaignId: firstCampaign() ? firstCampaign().id : null,
        createdAt: Date.now(),
        lastSeenAt: Date.now(),
      };
      sessions.set(token, session);

      socket.data.user = user;
      socket.data.campaignId = session.campaignId;
      ensureSocketCampaign(socket);
      socketToSession.set(socket.id, token);

      const campaign = ensureSocketCampaign(socket);
      appendSystemLog(campaign, socket, `${user.username} logged in.`);
      broadcastSnapshots();
    });

    socket.on("auth:logout", () => {
      const token = socketToSession.get(socket.id);
      if (token) {
        sessions.delete(token);
        socketToSession.delete(socket.id);
      }
      socket.data.user = null;
      socket.data.role = "guest";
      socket.data.campaignId = null;
      emitSnapshot(socket);
      broadcastSnapshots();
    });

    socket.on("campaign:create", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const name = String((payload && payload.name) || "").trim().slice(0, 120) || "New Campaign";
      const campaign = createCampaign({
        name,
        dmUserId: socket.data.user.id,
        createdByUserId: socket.data.user.id,
      });
      state.campaigns.push(campaign);
      socket.data.campaignId = campaign.id;
      ensureSocketCampaign(socket);
      const session = sessionForSocket(socket);
      if (session) {
        session.campaignId = campaign.id;
      }
      appendSystemLog(campaign, socket, `${socket.data.user.username} created campaign ${campaign.name}.`);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("campaign:join", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaignId = String((payload && payload.campaignId) || "");
      const campaign = findCampaignById(campaignId);
      if (!campaign) {
        socket.emit("tabletop:error", { message: "Campaign not found." });
        return;
      }
      socket.data.campaignId = campaign.id;
      ensureSocketCampaign(socket);
      const session = sessionForSocket(socket);
      if (session) {
        session.campaignId = campaign.id;
      }
      appendSystemLog(campaign, socket, `${socket.data.user.username} joined ${campaign.name}.`);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("campaign:delete", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaignId = String((payload && payload.campaignId) || "");
      const campaign = findCampaignById(campaignId);
      if (!campaign) {
        socket.emit("tabletop:error", { message: "Campaign not found." });
        return;
      }
      if (!campaign.dmUserId || campaign.dmUserId !== socket.data.user.id) {
        socket.emit("tabletop:error", { message: "Only the DM can delete this campaign." });
        return;
      }
      if (state.campaigns.length <= 1) {
        socket.emit("tabletop:error", { message: "At least one campaign must remain." });
        return;
      }

      const index = state.campaigns.findIndex((entry) => entry.id === campaignId);
      if (index < 0) {
        socket.emit("tabletop:error", { message: "Campaign not found." });
        return;
      }

      const [deletedCampaign] = state.campaigns.splice(index, 1);
      const fallbackCampaign = state.campaigns[0] || null;

      for (const connected of namespace.sockets.values()) {
        if (!connected.data || connected.data.campaignId !== campaignId) {
          continue;
        }
        connected.data.campaignId = fallbackCampaign ? fallbackCampaign.id : null;
        ensureSocketCampaign(connected);
        const session = sessionForSocket(connected);
        if (session) {
          session.campaignId = connected.data.campaignId;
        }
      }

      if (fallbackCampaign) {
        appendSystemLog(
          fallbackCampaign,
          socket,
          `${socket.data.user.username} deleted campaign ${deletedCampaign.name}.`
        );
      }
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("character:save", async (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      if (!campaign) {
        socket.emit("tabletop:error", { message: "No campaign selected." });
        return;
      }
      const user = socket.data.user;
      const existing = campaign.characters.find((candidate) => candidate.id === payload.id) || null;
      if (existing && existing.ownerUserId !== user.id && roleForUserInCampaign(user, campaign) !== "dm") {
        socket.emit("tabletop:error", { message: "You cannot edit this character." });
        return;
      }

      let requestedName = String((payload && payload.name) || "")
        .trim()
        .slice(0, 120);
      if (!requestedName) {
        requestedName = nextUniqueEntityName(campaign.characters, "New Character");
      }
      const existingId = existing ? existing.id : null;
      if (hasEntityNameCollision(campaign.characters, requestedName, existingId)) {
        socket.emit("tabletop:error", { message: "Character name already exists in this campaign." });
        return;
      }

      const target = existing || {
        id: createId("character"),
        ownerUserId: user.id,
        createdAt: nowIso(),
      };

      target.ownerUserId = existing ? existing.ownerUserId : user.id;
      const oldName = String(target.name || "").trim();
      target.name = requestedName;
      target.tokenImage = String(payload.tokenImage || "");
      const previousSheetUrl = String(target.sheetUrl || "").trim();
      target.sheetUrl = String(payload.sheetUrl || "").trim();
      target.updatedAt = nowIso();
      const shouldParseSheet = Boolean(target.sheetUrl) && (
        !existing ||
        !target.parsedSheet ||
        previousSheetUrl !== target.sheetUrl
      );

      if (target.sheetUrl && shouldParseSheet) {
        try {
          target.parsedSheet = await parseCharacterSheet(target.sheetUrl);
          target.sheetError = null;
        } catch (error) {
          target.sheetError = error.message;
          if (!target.parsedSheet) {
            const speed = Number.parseInt(payload.speedOverride, 10) || 30;
            const maxHp = Number.parseInt(payload.maxHpOverride, 10) || 1;
            const strengthModifier = Number.parseInt(payload.strengthModifier, 10) || 0;
            const italicizedSkillDc = Number.parseInt(payload.italicizedSkillDc, 10) || 0;
            target.parsedSheet = {
              skills: {},
              feats: [],
              currentValues: {
                speed,
                "max hp": maxHp,
                "strength mod": strengthModifier,
                isdc: italicizedSkillDc,
              },
              italicizedSkillDc,
              strengthModifier,
              speed,
              maxHp,
              resistDamageBonus: Number.parseInt(payload.resistDamageOverride, 10) || 0,
              initiativeBonus: Number.parseInt(payload.initiativeOverride, 10) || 0,
            };
          }
        }
      } else if (!target.sheetUrl) {
        const italicizedSkillDc = Number.parseInt(payload.italicizedSkillDc, 10) || 0;
        const strengthModifier = Number.parseInt(payload.strengthModifier, 10) || 0;
        const speed = Number.parseInt(payload.speedOverride, 10) || 30;
        const maxHp = Number.parseInt(payload.maxHpOverride, 10) || 1;
        target.parsedSheet = {
          skills: {},
          feats: [],
          currentValues: {
            speed,
            "max hp": maxHp,
            "strength mod": strengthModifier,
            isdc: italicizedSkillDc,
          },
          italicizedSkillDc,
          strengthModifier,
          speed,
          maxHp,
          resistDamageBonus: Number.parseInt(payload.resistDamageOverride, 10) || 0,
          initiativeBonus: Number.parseInt(payload.initiativeOverride, 10) || 0,
          feats: String(payload.featsText || "")
            .split(/\r?\n|,/)
            .map((line) => line.trim())
            .filter(Boolean),
        };
        target.sheetError = null;
      }

      target.availableModifiers = computeAvailableModifiers(target);

      if (!existing) {
        campaign.characters.push(target);
        appendSystemLog(campaign, socket, `${user.username} created character ${target.name}.`);
      } else if (normalizeEntityName(oldName) !== normalizeEntityName(target.name)) {
        appendSystemLog(campaign, socket, `${user.username} renamed ${oldName || "character"} to ${target.name}.`);
      }
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("character:refresh", async (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      if (!campaign) {
        socket.emit("tabletop:error", { message: "No campaign selected." });
        return;
      }
      const characterId = String((payload && payload.id) || "");
      const target = campaign.characters.find((candidate) => candidate.id === characterId) || null;
      if (!target) {
        socket.emit("tabletop:error", { message: "Character not found." });
        return;
      }
      if (roleForUserInCampaign(socket.data.user, campaign) !== "dm" && target.ownerUserId !== socket.data.user.id) {
        socket.emit("tabletop:error", { message: "You cannot refresh this character." });
        return;
      }
      if (!target.sheetUrl) {
        socket.emit("tabletop:error", { message: "This character does not have a sheet URL." });
        return;
      }

      try {
        target.parsedSheet = await parseCharacterSheet(target.sheetUrl);
        target.sheetError = null;
        target.updatedAt = nowIso();
        target.availableModifiers = computeAvailableModifiers(target);
        socket.emit("tabletop:notice", { message: `Refreshed ${target.name}.` });
        appendSystemLog(campaign, socket, `${socket.data.user.username} refreshed ${target.name} from sheet.`);
        persistence.saveSoon();
        broadcastSnapshots();
      } catch (error) {
        target.sheetError = error.message;
        persistence.saveSoon();
        broadcastSnapshots();
        socket.emit("tabletop:error", { message: `Refresh failed: ${error.message}` });
      }
    });

    socket.on("character:delete", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      if (!campaign) {
        socket.emit("tabletop:error", { message: "No campaign selected." });
        return;
      }
      const id = String((payload && payload.id) || "");
      const index = campaign.characters.findIndex((candidate) => candidate.id === id);
      if (index < 0) {
        return;
      }
      const character = campaign.characters[index];
      if (roleForUserInCampaign(socket.data.user, campaign) !== "dm" && character.ownerUserId !== socket.data.user.id) {
        socket.emit("tabletop:error", { message: "You cannot delete this character." });
        return;
      }

      campaign.characters.splice(index, 1);
      const map = activeMapFromCampaign(campaign);
      if (map) {
        map.tokens = map.tokens.filter((token) => !(token.sourceType === "character" && token.sourceId === id));
      }
      appendSystemLog(campaign, socket, `Character ${character.name} deleted.`);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("statblock:save", async (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const existing = campaign.statblocks.find((candidate) => candidate.id === payload.id) || null;
      const target = existing || {
        id: createId("statblock"),
        ownerUserId: socket.data.user.id,
        createdAt: nowIso(),
      };

      target.ownerUserId = existing ? existing.ownerUserId : socket.data.user.id;
      target.name = String(payload.name || "Unnamed Statblock").slice(0, 120);
      target.tokenImage = String(payload.tokenImage || "");
      target.sheetUrl = String(payload.sheetUrl || "").trim();
      target.sheetName = String(payload.sheetName || "Augmented beasts").trim() || "Augmented beasts";
      target.columnName = String(payload.columnName || "").trim();
      target.mode = payload.mode === "column" ? "column" : payload.mode === "sheet" ? "sheet" : "manual";
      target.manualText = String(payload.manualText || "");
      target.updatedAt = nowIso();

      try {
        if (target.mode === "sheet") {
          target.parsedSheet = await parseCharacterSheet(target.sheetUrl);
        } else if (target.mode === "column") {
          const parsedColumn = await parseStatblockFromSheet(
            target.sheetUrl,
            target.sheetName,
            target.columnName
          );
          target.name = parsedColumn.name || target.name;
          target.parsedSheet = parsedColumn.stats;
        } else {
          target.parsedSheet = parseManualStatblockText(target.manualText);
        }
        target.sheetError = null;
      } catch (error) {
        target.sheetError = error.message;
        if (!target.parsedSheet) {
          target.parsedSheet = parseManualStatblockText(target.manualText);
        }
      }

      target.availableModifiers = computeAvailableModifiers(target);

      if (!existing) {
        campaign.statblocks.push(target);
      }

      appendSystemLog(campaign, socket, `DM saved statblock ${target.name}.`);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("statblock:delete", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const id = String((payload && payload.id) || "");
      const index = campaign.statblocks.findIndex((candidate) => candidate.id === id);
      if (index < 0) {
        return;
      }
      const statblock = campaign.statblocks[index];
      campaign.statblocks.splice(index, 1);
      const map = activeMapFromCampaign(campaign);
      if (map) {
        map.tokens = map.tokens.filter((token) => !(token.sourceType === "statblock" && token.sourceId === id));
      }
      appendSystemLog(campaign, socket, `Statblock ${statblock.name} deleted.`);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("map:create", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      let requestedName = String((payload && payload.name) || "")
        .trim()
        .slice(0, 120);
      if (!requestedName) {
        requestedName = nextUniqueEntityName(campaign.maps, "New Map");
      }
      if (hasEntityNameCollision(campaign.maps, requestedName)) {
        socket.emit("tabletop:error", { message: "Map name already exists in this campaign." });
        return;
      }
      const map = createMap({
        name: requestedName,
        rows: payload && payload.rows,
        cols: payload && payload.cols,
        feetPerCell: payload && payload.feetPerCell,
      });
      campaign.maps.push(map);
      campaign.scene.activeMapId = map.id;
      appendSystemLog(campaign, socket, `Created map ${map.name}.`);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("map:delete", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const id = String((payload && payload.id) || "");
      const index = campaign.maps.findIndex((candidate) => candidate.id === id);
      if (index < 0) {
        return;
      }
      if (campaign.maps.length === 1) {
        socket.emit("tabletop:error", { message: "You must keep at least one map." });
        return;
      }
      const deleted = campaign.maps[index];
      campaign.maps.splice(index, 1);
      if (campaign.scene.activeMapId === id) {
        campaign.scene.activeMapId = campaign.maps[0].id;
      }
      appendSystemLog(campaign, socket, `Deleted map ${deleted.name}.`);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("map:load", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const id = String((payload && payload.id) || "");
      const map = campaign.maps.find((candidate) => candidate.id === id);
      if (!map) {
        socket.emit("tabletop:error", { message: "Map not found." });
        return;
      }
      campaign.scene.activeMapId = id;
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("map:update", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      if (!campaign) {
        return;
      }
      const requestedMapId = String((payload && payload.id) || campaign.scene.activeMapId || "");
      const map = campaign.maps.find((candidate) => candidate.id === requestedMapId) || activeMapFromCampaign(campaign);
      if (!map) {
        socket.emit("tabletop:error", { message: "Map not found." });
        return;
      }

      if (payload && payload.name !== undefined) {
        const wantedName = String(payload.name || "").trim().slice(0, 120);
        if (!wantedName) {
          socket.emit("tabletop:error", { message: "Map name cannot be empty." });
          return;
        }
        if (hasEntityNameCollision(campaign.maps, wantedName, map.id)) {
          socket.emit("tabletop:error", { message: "Map name already exists in this campaign." });
          return;
        }
        map.name = wantedName;
      }
      if (payload && (payload.rows !== undefined || payload.cols !== undefined)) {
        resizeMapInPlace(map, payload.rows !== undefined ? payload.rows : map.rows, payload.cols !== undefined ? payload.cols : map.cols);
      }
      if (payload && payload.feetPerCell !== undefined) {
        map.feetPerCell = clamp(Number.parseFloat(payload.feetPerCell) || map.feetPerCell || 5, 1, 200);
      }
      if (payload && payload.gmTokenOpacity !== undefined) {
        map.gmTokenOpacity = clamp(Number.parseFloat(payload.gmTokenOpacity) || DEFAULT_GM_TOKEN_OPACITY, 0.1, 1);
      }
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("map:setBackground", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const backgroundLayer = map.terrainLayers.find((layer) => layer.type === "background") || null;
      const result = importBackgroundIntoLayer(backgroundLayer, String((payload && payload.imageDataUrl) || ""));
      if (!result.ok) {
        socket.emit("tabletop:error", { message: result.reason || "Could not update background." });
        return;
      }
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      appendSystemLog(campaign, socket, `Updated background for ${map.name}.`);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("map:setScale", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      map.feetPerCell = clamp(Number.parseFloat(payload && payload.feetPerCell) || 5, 1, 200);
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("map:addDrawing", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const type = String((payload && payload.type) || "").trim().toLowerCase();
      const allowedTypes = new Set(["distance", "cone", "circle", "rectangle", "polyline"]);
      if (!allowedTypes.has(type)) {
        socket.emit("tabletop:error", { message: "Unknown drawing type." });
        return;
      }
      const color = String((payload && payload.color) || "#f3c56e").slice(0, 32);
      const data = payload && payload.data && typeof payload.data === "object" ? deepClone(payload.data) : {};
      const role = roleForUserInCampaign(socket.data.user, campaign);
      const layer = payload && payload.layer === "gm" && role === "dm" ? "gm" : "tokens";
      const drawing = {
        id: createId("drawing"),
        ownerUserId: socket.data.user.id,
        type,
        layer,
        color,
        data,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      map.drawings.push(drawing);
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("map:deleteDrawing", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const drawingId = String((payload && payload.drawingId) || "");
      const index = map.drawings.findIndex((drawing) => drawing.id === drawingId);
      if (index < 0) {
        return;
      }
      const drawing = map.drawings[index];
      const isDm = roleForUserInCampaign(socket.data.user, campaign) === "dm";
      if (!isDm && drawing.ownerUserId !== socket.data.user.id) {
        socket.emit("tabletop:error", { message: "You cannot delete this drawing." });
        return;
      }
      map.drawings.splice(index, 1);
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("terrain:setTextureDefault", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      if (!campaign) {
        return;
      }
      const categoryId = String((payload && payload.categoryId) || "").trim();
      const textureId = String((payload && payload.textureId) || "").trim();
      const asset = activeTextureCatalog.assetsById[textureId];
      if (!categoryId || !asset || asset.categoryId !== categoryId) {
        return;
      }
      campaign.terrainTextureDefaults = campaign.terrainTextureDefaults || {};
      campaign.terrainTextureDefaults[categoryId] = textureId;
      if (payload && payload.applyToAllCampaigns) {
        state.meta.terrainTextureDefaultsGlobal = state.meta.terrainTextureDefaultsGlobal || {};
        state.meta.terrainTextureDefaultsGlobal[categoryId] = textureId;
      }
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("terrain:layerCreate", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const layerType = payload && payload.type === "foreground" ? "foreground" : "background";
      createLayerOnMap(map, layerType, createId, activeTextureCatalog);
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("terrain:layerUpdate", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const layer = getTerrainLayerById(map, payload && payload.layerId);
      if (!layer) {
        return;
      }
      if (payload && payload.visible !== undefined) {
        layer.visible = Boolean(payload.visible);
      }
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("terrain:layerDelete", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const result = deleteLayerFromMap(map, payload && payload.layerId);
      if (!result.ok) {
        socket.emit("tabletop:error", { message: result.reason || "Could not delete layer." });
        return;
      }
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("terrain:layerReorder", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const ok = reorderLayersOnMap(map, payload && payload.orderedLayerIds);
      if (!ok) {
        return;
      }
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("terrain:importBackground", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const layer = getTerrainLayerById(map, payload && payload.layerId);
      const result = importBackgroundIntoLayer(layer, String((payload && payload.imageDataUrl) || ""));
      if (!result.ok) {
        socket.emit("tabletop:error", { message: result.reason || "Could not import background." });
        return;
      }
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("terrain:applyOps", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const result = applyTerrainOps(
        map,
        payload && payload.layerId,
        payload && payload.ops,
        activeTextureCatalog
      );
      if (!result.ok) {
        socket.emit("tabletop:error", { message: result.reason || "Could not apply terrain edits." });
        return;
      }
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("map:interactDoor", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const x = Number.parseInt(payload && payload.x, 10);
      const y = Number.parseInt(payload && payload.y, 10);
      const door = findDoorComponentAt(map, x, y);
      if (!door) {
        return;
      }
      const role = roleForUserInCampaign(socket.data.user, campaign);
      if (door.tile.doorLocked && role !== "dm") {
        socket.emit("tabletop:error", { message: "That door is locked." });
        socket.emit("terrain:doorInteractionResult", { x, y, locked: true });
        return;
      }
      if (role === "dm" && payload && payload.forceState) {
        if (payload.forceState === "open") {
          door.tile.doorOpen = true;
        }
        if (payload.forceState === "closed") {
          door.tile.doorOpen = false;
        }
      } else if (!door.tile.doorLocked) {
        door.tile.doorOpen = !door.tile.doorOpen;
      }
      map.updatedAt = nowIso();
      campaign.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("token:place", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const x = clamp(Number.parseInt(payload && payload.x, 10) || 0, 0, map.cols - 1);
      const y = clamp(Number.parseInt(payload && payload.y, 10) || 0, 0, map.rows - 1);

      const token = {
        id: createId("token"),
        name: String(payload && payload.name ? payload.name : "Token").slice(0, 120),
        sourceType: String((payload && payload.sourceType) || "custom"),
        sourceId: String((payload && payload.sourceId) || ""),
        ownerUserId: null,
        tokenImage: String((payload && payload.tokenImage) || ""),
        layer: payload && payload.layer === "gm" ? "gm" : "tokens",
        x,
        y,
        movementMax: Number.parseInt(payload && payload.movementMax, 10) || 30,
        initiativeMod: Number.parseInt(payload && payload.initiativeMod, 10) || 0,
        autoMove: Boolean(payload && payload.autoMove),
        autoMoveType: String((payload && payload.autoMoveType) || "wander"),
      };

      if (token.sourceType === "character") {
        const character = campaign.characters.find((candidate) => candidate.id === token.sourceId);
        if (character) {
          token.name = character.name;
          token.tokenImage = character.tokenImage || token.tokenImage;
          token.ownerUserId = character.ownerUserId;
          token.movementMax = Number(character.parsedSheet && character.parsedSheet.speed) || token.movementMax;
          token.initiativeMod =
            Number(character.parsedSheet && character.parsedSheet.initiativeBonus) || token.initiativeMod;
        }
      }

      if (token.sourceType === "statblock") {
        const statblock = campaign.statblocks.find((candidate) => candidate.id === token.sourceId);
        if (statblock) {
          token.name = statblock.name;
          token.tokenImage = statblock.tokenImage || token.tokenImage;
          token.movementMax = Number(statblock.parsedSheet && statblock.parsedSheet.speed) || token.movementMax;
          token.initiativeMod =
            Number(statblock.parsedSheet && statblock.parsedSheet.initiativeBonus) || token.initiativeMod;
        }
      }

      map.tokens.push(token);
      map.updatedAt = nowIso();
      appendSystemLog(campaign, socket, `Placed token ${token.name}.`);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("token:update", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const token = findTokenById(map, payload && payload.tokenId);
      if (!token) {
        return;
      }
      if (payload.name !== undefined) {
        token.name = String(payload.name || "Token").slice(0, 120);
      }
      if (payload.tokenImage !== undefined) {
        token.tokenImage = String(payload.tokenImage || "");
      }
      if (payload.autoMove !== undefined) {
        token.autoMove = Boolean(payload.autoMove);
      }
      if (payload.autoMoveType !== undefined) {
        token.autoMoveType = String(payload.autoMoveType || "wander");
      }
      if (payload.movementMax !== undefined) {
        token.movementMax = Math.max(0, Number.parseInt(payload.movementMax, 10) || 0);
      }
      if (payload.initiativeMod !== undefined) {
        token.initiativeMod = Number.parseInt(payload.initiativeMod, 10) || 0;
      }
      map.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("token:setLayer", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const token = findTokenById(map, payload && payload.tokenId);
      if (!token) {
        return;
      }
      token.layer = payload && payload.layer === "gm" ? "gm" : "tokens";
      map.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("token:delete", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const tokenId = String((payload && payload.tokenId) || "");
      const index = map.tokens.findIndex((token) => token.id === tokenId);
      if (index < 0) {
        return;
      }
      const [removed] = map.tokens.splice(index, 1);
      appendSystemLog(campaign, socket, `Removed token ${removed.name}.`);
      map.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("token:move", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const token = findTokenById(map, payload && payload.tokenId);
      if (!token) {
        return;
      }
      if (!canControlToken(socket, campaign, token)) {
        socket.emit("tabletop:error", { message: "You cannot move this token." });
        return;
      }

      const targetX = Number.parseInt(payload && payload.x, 10);
      const targetY = Number.parseInt(payload && payload.y, 10);
      if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) {
        return;
      }
      if (targetX < 0 || targetX >= map.cols || targetY < 0 || targetY >= map.rows) {
        return;
      }

      const targetCell = getTerrainCell(map, targetX, targetY);
      if (isTileBlockingMovement(targetCell)) {
        socket.emit("tabletop:error", { message: "That tile blocks movement." });
        return;
      }

      const path = computePathAndCost(map, token, targetX, targetY);
      if (!path) {
        socket.emit("tabletop:error", { message: "No path to that tile." });
        return;
      }

      token.x = targetX;
      token.y = targetY;
      updateMovementTracking(campaign, map, token, path.cost);
      applyScenarioTileEffects(campaign, map, token, targetCell);
      map.updatedAt = nowIso();
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("dm:setRollCharacter", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const characterId = String((payload && payload.characterId) || "");
      const exists = campaign.characters.some((character) => character.id === characterId);
      if (!exists && characterId) {
        socket.emit("tabletop:error", { message: "Character not found." });
        return;
      }
      campaign.scene.selectedDmCharacterId = characterId || null;
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("initiative:start", () => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      if (!map) {
        return;
      }
      const entries = map.tokens
        .filter((token) => token.layer === "tokens")
        .map((token) => {
          const roll = randomInt(1, 20);
          const total = roll + (Number(token.initiativeMod) || 0);
          return {
            tokenId: token.id,
            name: token.name,
            roll,
            initiativeMod: Number(token.initiativeMod) || 0,
            total,
          };
        });

      campaign.scene.initiative = {
        active: true,
        order: sortInitiativeEntries(entries),
        currentIndex: 0,
        round: 1,
        movementSpentByToken: {},
      };

      const current = campaign.scene.initiative.order[0];
      if (current) {
        const token = findTokenById(map, current.tokenId);
        if (token) {
          token.movementInfo = {
            spent: 0,
            max: resolveTokenMovementMax(campaign, token),
            overLimit: false,
          };
        }
      }

      appendSystemLog(campaign, socket, "Initiative started.", {
        order: campaign.scene.initiative.order,
      });
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("initiative:updateEntry", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const map = activeMapFromCampaign(campaign);
      const initiative = campaign.scene.initiative;
      if (!initiative || !initiative.active || !Array.isArray(initiative.order) || initiative.order.length === 0) {
        return;
      }
      const tokenId = String((payload && payload.tokenId) || "");
      const entry = initiative.order.find((candidate) => candidate.tokenId === tokenId);
      if (!entry) {
        return;
      }
      if (payload && payload.roll !== undefined) {
        entry.roll = clamp(Number.parseInt(payload.roll, 10) || entry.roll || 0, 1, 20);
      }
      if (payload && payload.initiativeMod !== undefined) {
        entry.initiativeMod = Number.parseInt(payload.initiativeMod, 10) || 0;
      }
      if (payload && payload.total !== undefined) {
        entry.total = Number.parseInt(payload.total, 10) || 0;
      } else {
        entry.total = Number(entry.roll || 0) + (Number(entry.initiativeMod) || 0);
      }

      const token = map ? findTokenById(map, tokenId) : null;
      if (token && payload && payload.initiativeMod !== undefined) {
        token.initiativeMod = Number(entry.initiativeMod) || 0;
      }

      const currentTokenId =
        initiative.order[clamp(Number(initiative.currentIndex) || 0, 0, Math.max(0, initiative.order.length - 1))]
          ?.tokenId || null;
      initiative.order = sortInitiativeEntries(initiative.order);
      if (currentTokenId) {
        const nextIndex = initiative.order.findIndex((candidate) => candidate.tokenId === currentTokenId);
        initiative.currentIndex = nextIndex >= 0 ? nextIndex : 0;
      } else {
        initiative.currentIndex = 0;
      }
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("initiative:next", () => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const initiative = campaign.scene.initiative;
      const map = activeMapFromCampaign(campaign);
      if (!initiative || !initiative.active || initiative.order.length === 0 || !map) {
        return;
      }

      initiative.currentIndex += 1;
      if (initiative.currentIndex >= initiative.order.length) {
        initiative.currentIndex = 0;
        initiative.round += 1;
      }

      const current = initiative.order[initiative.currentIndex];
      if (current) {
        initiative.movementSpentByToken[current.tokenId] = 0;
        const token = findTokenById(map, current.tokenId);
        if (token) {
          token.movementInfo = {
            spent: 0,
            max: resolveTokenMovementMax(campaign, token),
            overLimit: false,
          };
        }
      }

      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("initiative:stop", () => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      campaign.scene.initiative = createDefaultInitiativeState();
      const map = activeMapFromCampaign(campaign);
      if (map) {
        map.tokens.forEach((token) => {
          token.movementInfo = null;
        });
      }
      appendSystemLog(campaign, socket, "Initiative ended.");
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("roll:requestModifierApproval", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const targetUserId = String((payload && payload.targetUserId) || "");
      const modifierId = String((payload && payload.modifierId) || "");
      if (!targetUserId || !modifierId) {
        return;
      }

      const approvalId = createId("approval");
      approvalRequests.set(approvalId, {
        id: approvalId,
        campaignId: socket.data.campaignId || null,
        requesterUserId: socket.data.user.id,
        requesterSocketId: socket.id,
        targetUserId,
        modifierId,
        approved: false,
        used: false,
        expiresAt: Date.now() + 90_000,
      });

      for (const client of namespace.sockets.values()) {
        if (
          client.data &&
          client.data.user &&
          client.data.user.id === targetUserId &&
          client.data.campaignId === socket.data.campaignId
        ) {
          client.emit("roll:modifierApprovalRequested", {
            approvalId,
            requesterUserId: socket.data.user.id,
            requesterName: socket.data.user.username,
            modifierId,
            context: payload.context || null,
          });
        }
      }
    });

    socket.on("roll:modifierApprovalResponse", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const approvalId = String((payload && payload.approvalId) || "");
      const approve = Boolean(payload && payload.approve);
      const approval = approvalRequests.get(approvalId);
      if (!approval) {
        return;
      }
      if (approval.targetUserId !== socket.data.user.id) {
        return;
      }
      if (approval.campaignId !== socket.data.campaignId) {
        return;
      }
      approval.approved = approve;

      const requester = namespace.sockets.get(approval.requesterSocketId);
      if (requester) {
        requester.emit("roll:modifierApprovalResolved", {
          approvalId,
          modifierId: approval.modifierId,
          approved: approve,
          byUserId: socket.data.user.id,
          byUsername: socket.data.user.username,
        });
      }
      if (!approve) {
        approvalRequests.delete(approvalId);
      }
    });

    socket.on("roll:skill", async (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const result = resolveRoll(socket, campaign, payload || {});
      if (!result.ok) {
        socket.emit("tabletop:error", { message: result.error });
        return;
      }

      const rollData = result.roll;
      const isdcLogText =
        rollData.isdcCheck && rollData.isdcCheck.required
          ? ` | ISDC ${rollData.isdcCheck.passed ? "pass" : "fail"} (${rollData.isdcCheck.total}/${rollData.isdcCheck.dc})`
          : "";
      appendLog(
        campaign,
        createLogEntry({
          type: "roll",
          actor: socket.data.user.username,
          message: `${result.actorEntity.name} rolled ${rollData.skillName}: ${rollData.total}${isdcLogText}`,
          details: {
            entityId: result.actorEntity.id,
            entityName: result.actorEntity.name,
            roll: rollData,
          },
        })
      );

      socket.emit("roll:result", {
        entityId: result.actorEntity.id,
        entityName: result.actorEntity.name,
        roll: rollData,
      });

      if (
        result.actorEntity &&
        result.actorEntity.sheetUrl &&
        Array.isArray(result.usageCountersToConsume) &&
        result.usageCountersToConsume.length > 0
      ) {
        try {
          await consumeCharacterUsageCounters(result.actorEntity, result.usageCountersToConsume);
          socket.emit("tabletop:notice", { message: "Feat usage updated from sheet." });
        } catch (error) {
          socket.emit("tabletop:error", {
            message: `Could not update feat usage: ${error.message}`,
          });
        }
      }

      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("roll:groupRequest", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const requestId = createId("group_roll");
      const skillName = String((payload && payload.skillName) || "").trim();
      const rollType = String((payload && payload.rollType) || "minor_skill").trim();

      for (const client of namespace.sockets.values()) {
        if (
          !client.data ||
          !client.data.user ||
          roleForUserInCampaign(client.data.user, campaign) !== "player" ||
          client.data.campaignId !== campaign.id
        ) {
          continue;
        }
        const ownedCharacters = campaign.characters.filter(
          (character) => character.ownerUserId === client.data.user.id
        );
        if (ownedCharacters.length === 0) {
          continue;
        }
        client.emit("roll:groupRequested", {
          requestId,
          skillName,
          rollType,
          characterOptions: ownedCharacters.map((character) => ({
            id: character.id,
            name: character.name,
          })),
          requestedBy: socket.data.user.username,
        });
      }

      appendSystemLog(campaign, socket, `DM requested a group roll for ${skillName}.`);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("injury:roll", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const overkill = Math.max(0, Number.parseInt(payload && payload.overkill, 10) || 0);

      let entity = null;
      if (payload && payload.characterId) {
        entity = campaign.characters.find((character) => character.id === payload.characterId) || null;
        if (!entity) {
          socket.emit("tabletop:error", { message: "Unknown character." });
          return;
        }
        if (roleForUserInCampaign(socket.data.user, campaign) !== "dm" && entity.ownerUserId !== socket.data.user.id) {
          socket.emit("tabletop:error", { message: "You cannot roll injuries for this character." });
          return;
        }
      } else if (payload && payload.statblockId) {
        entity = campaign.statblocks.find((statblock) => statblock.id === payload.statblockId) || null;
        if (!entity) {
          socket.emit("tabletop:error", { message: "Unknown statblock." });
          return;
        }
        if (roleForUserInCampaign(socket.data.user, campaign) !== "dm") {
          socket.emit("tabletop:error", { message: "Only DMs can roll injuries for statblocks." });
          return;
        }
      }

      if (!entity) {
        socket.emit("tabletop:error", { message: "Choose a character/statblock first." });
        return;
      }

      const parsed = entity.parsedSheet || {};
      const resistDamageBonus = Number(parsed.resistDamageBonus || 0);
      const maxHp = Math.max(1, Number(parsed.maxHp || 1));

      const deathDc = 10 + overkill - maxHp;
      const injuryDc = 10 + overkill;

      const deathRoll = rollD20WithAdvantageLevel(Number.parseInt(payload.deathAdvantageLevel, 10) || 0);
      const deathTotal = deathRoll.selected + resistDamageBonus + (Number(payload.deathFlatModifier || 0) || 0);
      const deathPassed = deathTotal >= deathDc;

      const injuryRoll = rollD20WithAdvantageLevel(Number.parseInt(payload.injuryAdvantageLevel, 10) || 0);
      const injuryTotal =
        injuryRoll.selected + resistDamageBonus + (Number(payload.injuryFlatModifier || 0) || 0);
      const injuryPassed = injuryTotal >= injuryDc;

      let injuryTier = null;
      let injuryName = null;
      if (!injuryPassed) {
        const failureBy = injuryDc - injuryTotal;
        injuryTier = resolveInjuryTier(failureBy);
        const table = INJURY_TABLES[injuryTier];
        injuryName = table[randomInt(0, table.length - 1)];
      }

      const outcome = {
        entityId: entity.id,
        entityName: entity.name,
        overkill,
        resistDamageBonus,
        maxHp,
        deathCheck: {
          dc: deathDc,
          roll: deathRoll,
          total: deathTotal,
          passed: deathPassed,
        },
        injuryCheck: {
          dc: injuryDc,
          roll: injuryRoll,
          total: injuryTotal,
          passed: injuryPassed,
          tier: injuryTier,
          injury: injuryName,
        },
      };

      appendLog(
        campaign,
        createLogEntry({
          type: "injury",
          actor: socket.data.user.username,
          message: `${entity.name} injury roll: death ${deathPassed ? "saved" : "failed"}, injury ${injuryPassed ? "none" : injuryTier}`,
          details: outcome,
        })
      );

      socket.emit("injury:result", outcome);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("forage:roll", (payload) => {
      if (!requireDm(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      if (!herbsState.herbs || herbsState.herbs.length === 0) {
        socket.emit("tabletop:error", { message: "Herb table is not loaded yet." });
        return;
      }
      const terrain = normalizeSkillName(payload && payload.terrain);
      if (!terrain) {
        socket.emit("tabletop:error", { message: "Select a terrain first." });
        return;
      }
      const rarityRoll = randomInt(1, 20);
      const rarity = chooseRarityFromD20(rarityRoll);
      const eligible = herbsState.herbs.filter((herb) => {
        if (herb.rarity !== rarity) {
          return false;
        }
        return herb.environment.includes("all") || herb.environment.includes(terrain);
      });
      const pool = eligible.length > 0
        ? eligible
        : herbsState.herbs.filter((herb) => herb.rarity === rarity);

      const chosen = pool[randomInt(0, pool.length - 1)];
      const result = {
        terrain,
        rarityRoll,
        rarity,
        herb: chosen,
      };

      appendLog(
        campaign,
        createLogEntry({
          type: "forage",
          actor: socket.data.user.username,
          message: `Foraging (${terrain}): ${chosen.name} (${rarity.replace("_", " ")})`,
          details: result,
        })
      );

      socket.emit("forage:result", result);
      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("chat:message", (payload) => {
      if (!requireAuth(socket)) {
        return;
      }
      const campaign = ensureSocketCampaign(socket);
      const text = String((payload && payload.text) || "").trim();
      if (!text) {
        return;
      }

      if (text.toLowerCase().startsWith("/r")) {
        const parsed = parseRollCommand(text);
        if (!parsed) {
          socket.emit("tabletop:error", {
            message: "Bad roll command. Use /r NdX, /r NdXk1, /r NdXkl1, and optional +Y/-Y.",
          });
          return;
        }
        appendLog(
          campaign,
          createLogEntry({
            type: "roll",
            actor: socket.data.user.username,
            message: `${socket.data.user.username} rolled ${parsed.notation} = ${parsed.total}`,
            details: parsed,
          })
        );
      } else {
        appendLog(
          campaign,
          createLogEntry({
            type: "chat",
            actor: socket.data.user.username,
            message: text,
            details: null,
          })
        );
      }

      persistence.saveSoon();
      broadcastSnapshots();
    });

    socket.on("disconnect", () => {
      socketToSession.delete(socket.id);
      broadcastSnapshots();
    });
  });

  setInterval(() => {
    let anyChanged = false;
    state.campaigns.forEach((campaign) => {
      const initiative = campaign.scene.initiative;
      if (!initiative || !initiative.active) {
        return;
      }

      const map = activeMapFromCampaign(campaign);
      if (!map || map.tokens.length === 0) {
        return;
      }

      let changed = false;
      map.tokens.forEach((token) => {
        if (!token.autoMove || token.layer !== "tokens") {
          return;
        }

        const directions = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ];

        const candidates = [];
        directions.forEach((direction) => {
          const nx = token.x + direction.dx;
          const ny = token.y + direction.dy;
          const cell = getTerrainCell(map, nx, ny);
          if (isTileBlockingMovement(cell)) {
            return;
          }
          candidates.push({ x: nx, y: ny });
        });

        if (candidates.length === 0) {
          return;
        }

        const pick = candidates[randomInt(0, candidates.length - 1)];
        token.x = pick.x;
        token.y = pick.y;
        const targetCell = getTerrainCell(map, pick.x, pick.y);
        applyScenarioTileEffects(campaign, map, token, targetCell);
        changed = true;
      });

      if (changed) {
        map.updatedAt = nowIso();
        campaign.updatedAt = nowIso();
        anyChanged = true;
      }
    });

    if (anyChanged) {
      persistence.saveSoon();
      broadcastSnapshots();
    }
  }, 1200);

  return {
    namespace,
    getState: () => state,
    forceSave: () => persistence.forceSave(),
    refreshHerbs,
  };
}

module.exports = {
  TABLETOP_NAMESPACE,
  createTabletopSystem,
};
