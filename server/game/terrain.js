const fs = require("fs");
const path = require("path");

const DEFAULT_TERRAIN_TEXTURE_ROOT =
  process.env.GAIROS_TEXTURE_LIBRARY || "/mnt/d/Dropbox/TabletopRPGs/textures";
const DEFAULT_BACKGROUND_TEXTURE_ID = "Ground001";
const MAX_LAYER_BACKGROUND_DATA_URL_LENGTH = 10_000_000;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function sanitizeHexColor(value, fallback = "#808080") {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;
}

function parseTextureCategory(assetId, manifestCategory = "") {
  if (manifestCategory) {
    return String(manifestCategory).trim();
  }
  const match = String(assetId || "").match(/^(.*?)(\d+)$/);
  return match && match[1] ? match[1] : String(assetId || "").trim();
}

function encodeUrlPath(relativePath) {
  return relativePath
    .split(path.sep)
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function findColorTextureFile(rootDir) {
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (error) {
      entries = [];
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (/_Color\.(png|jpe?g|webp)$/i.test(entry.name)) {
        return absolute;
      }
    }
  }
  return null;
}

function buildTextureCatalog(textureRoot = DEFAULT_TERRAIN_TEXTURE_ROOT) {
  const rootPath = path.resolve(String(textureRoot || DEFAULT_TERRAIN_TEXTURE_ROOT));
  const extractedRoot = path.join(rootPath, "extracted");
  const manifestPath = path.join(rootPath, "manifest.json");
  const manifest = (() => {
    try {
      const raw = fs.readFileSync(manifestPath, "utf8");
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  })();

  const manifestCategoryById = new Map();
  if (manifest && Array.isArray(manifest.items)) {
    manifest.items.forEach((item) => {
      if (!item || !item.asset_id) {
        return;
      }
      manifestCategoryById.set(String(item.asset_id), String(item.family_prefix || ""));
    });
  }

  const categoryMap = new Map();
  let dirEntries = [];
  try {
    dirEntries = fs.readdirSync(extractedRoot, { withFileTypes: true });
  } catch (error) {
    dirEntries = [];
  }

  dirEntries
    .filter((entry) => entry && entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((entry) => {
      const assetId = String(entry.name || "").trim();
      if (!assetId) {
        return;
      }
      const absoluteAssetDir = path.join(extractedRoot, assetId);
      const colorFile = findColorTextureFile(absoluteAssetDir);
      if (!colorFile) {
        return;
      }
      const relativeFilePath = path.relative(extractedRoot, colorFile);
      const categoryId = parseTextureCategory(assetId, manifestCategoryById.get(assetId));
      if (!categoryId) {
        return;
      }
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          label: categoryId,
          assets: [],
        });
      }
      categoryMap.get(categoryId).assets.push({
        id: assetId,
        categoryId,
        label: assetId,
        relativePath: relativeFilePath,
        previewUrl: `/texture-library/${encodeUrlPath(relativeFilePath)}`,
      });
    });

  const categories = Array.from(categoryMap.values())
    .map((category) => ({
      ...category,
      assets: category.assets.slice().sort((a, b) => a.id.localeCompare(b.id)),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((category) => ({
      ...category,
      defaultTextureId:
        category.assets.find((asset) => asset.id === `${category.id}001`)?.id ||
        category.assets[0]?.id ||
        "",
    }));

  const assetsById = {};
  categories.forEach((category) => {
    category.assets.forEach((asset) => {
      assetsById[asset.id] = {
        ...asset,
        categoryId: category.id,
      };
    });
  });

  const defaultBackgroundTextureId = assetsById[DEFAULT_BACKGROUND_TEXTURE_ID]
    ? DEFAULT_BACKGROUND_TEXTURE_ID
    : categories.find((category) => category.id === "Ground")?.defaultTextureId ||
      categories[0]?.defaultTextureId ||
      "";

  return {
    rootPath,
    extractedRoot,
    categories,
    assetsById,
    generatedAt: nowIso(),
    defaultBackgroundTextureId,
  };
}

function isValidTextureId(textureCatalog, textureId) {
  return Boolean(textureCatalog && textureCatalog.assetsById && textureCatalog.assetsById[textureId]);
}

function normalizeTextureDefaults(defaults, textureCatalog) {
  const source = defaults && typeof defaults === "object" ? defaults : {};
  const normalized = {};
  Object.entries(source).forEach(([categoryId, textureId]) => {
    const safeCategoryId = String(categoryId || "").trim();
    const safeTextureId = String(textureId || "").trim();
    if (!safeCategoryId || !safeTextureId || !isValidTextureId(textureCatalog, safeTextureId)) {
      return;
    }
    const asset = textureCatalog.assetsById[safeTextureId];
    if (!asset || asset.categoryId !== safeCategoryId) {
      return;
    }
    normalized[safeCategoryId] = safeTextureId;
  });
  return normalized;
}

function resolveTextureDefaultForCategory(textureCatalog, categoryId, campaignDefaults, globalDefaults) {
  const category = (textureCatalog.categories || []).find((entry) => entry.id === categoryId);
  if (!category) {
    return "";
  }
  const campaignTextureId = String((campaignDefaults && campaignDefaults[categoryId]) || "");
  if (campaignTextureId && isValidTextureId(textureCatalog, campaignTextureId)) {
    return campaignTextureId;
  }
  const globalTextureId = String((globalDefaults && globalDefaults[categoryId]) || "");
  if (globalTextureId && isValidTextureId(textureCatalog, globalTextureId)) {
    return globalTextureId;
  }
  return category.defaultTextureId || category.assets[0]?.id || "";
}

function buildResolvedTextureDefaults(textureCatalog, campaignDefaults, globalDefaults) {
  const resolved = {};
  (textureCatalog.categories || []).forEach((category) => {
    resolved[category.id] = resolveTextureDefaultForCategory(
      textureCatalog,
      category.id,
      campaignDefaults,
      globalDefaults
    );
  });
  return resolved;
}

function createBaseTile(tile, layerType, textureCatalog) {
  if (!tile || typeof tile !== "object") {
    return null;
  }

  const normalizedLayerType = layerType === "foreground" ? "foreground" : "background";
  const kind = ["texture", "color", "door"].includes(tile.kind) ? tile.kind : "texture";
  const alpha = clamp(Number.parseFloat(tile.alpha), 0, 1);
  const safeAlpha = Number.isFinite(alpha) ? alpha : 1;

  if (kind === "door") {
    if (normalizedLayerType !== "foreground") {
      return null;
    }
    return {
      kind: "door",
      alpha: safeAlpha,
      blocksMovement: tile.blocksMovement !== false,
      blocksVision: tile.blocksVision !== false,
      blocksLight: tile.blocksLight !== false,
      doorLocked: Boolean(tile.doorLocked),
      doorOpen: Boolean(tile.doorOpen),
    };
  }

  if (kind === "color") {
    return {
      kind: "color",
      color: sanitizeHexColor(tile.color, "#808080"),
      alpha: safeAlpha,
      blocksMovement: normalizedLayerType === "foreground" ? tile.blocksMovement !== false : false,
      blocksVision: normalizedLayerType === "foreground" ? tile.blocksVision !== false : false,
      blocksLight: normalizedLayerType === "foreground" ? tile.blocksLight !== false : false,
    };
  }

  const textureId = String(tile.textureId || "").trim();
  if (!textureId || !isValidTextureId(textureCatalog, textureId)) {
    return null;
  }
  return {
    kind: "texture",
    textureId,
    alpha: safeAlpha,
    blocksMovement: normalizedLayerType === "foreground" ? tile.blocksMovement !== false : false,
    blocksVision: normalizedLayerType === "foreground" ? tile.blocksVision !== false : false,
    blocksLight: normalizedLayerType === "foreground" ? tile.blocksLight !== false : false,
  };
}

function makeLayerGrid(rows, cols, fillTile = null) {
  const grid = [];
  for (let y = 0; y < rows; y += 1) {
    const row = [];
    for (let x = 0; x < cols; x += 1) {
      row.push(fillTile ? deepClone(fillTile) : null);
    }
    grid.push(row);
  }
  return grid;
}

function resizeLayerGrid(cells, rows, cols, layerType, textureCatalog) {
  const next = [];
  const source = Array.isArray(cells) ? cells : [];
  for (let y = 0; y < rows; y += 1) {
    const sourceRow = Array.isArray(source[y]) ? source[y] : [];
    const nextRow = [];
    for (let x = 0; x < cols; x += 1) {
      nextRow.push(createBaseTile(sourceRow[x], layerType, textureCatalog));
    }
    next.push(nextRow);
  }
  return next;
}

function createTerrainLayer({ createId, name, type, rows, cols, fillTile = null }) {
  const layerType = type === "foreground" ? "foreground" : "background";
  return {
    id: createId("terrain_layer"),
    name: String(name || (layerType === "background" ? "Background" : "Foreground")).slice(0, 60),
    type: layerType,
    visible: true,
    backgroundImageDataUrl: "",
    cells: makeLayerGrid(rows, cols, fillTile),
  };
}

function createDefaultTerrainLayers({ createId, rows, cols, textureCatalog }) {
  const fillTextureId = textureCatalog.defaultBackgroundTextureId || DEFAULT_BACKGROUND_TEXTURE_ID;
  const backgroundTile = createBaseTile(
    {
      kind: "texture",
      textureId: fillTextureId,
      alpha: 1,
      blocksMovement: false,
      blocksVision: false,
      blocksLight: false,
    },
    "background",
    textureCatalog
  );
  return [
    createTerrainLayer({
      createId,
      name: "Background",
      type: "background",
      rows,
      cols,
      fillTile: backgroundTile,
    }),
    createTerrainLayer({
      createId,
      name: "Foreground",
      type: "foreground",
      rows,
      cols,
      fillTile: null,
    }),
  ];
}

function normalizeTerrainLayer(layer, rows, cols, textureCatalog, createId) {
  const type = layer && layer.type === "foreground" ? "foreground" : "background";
  return {
    id: String((layer && layer.id) || createId("terrain_layer")),
    name: String(
      (layer && layer.name) || (type === "background" ? "Background" : "Foreground")
    ).slice(0, 60),
    type,
    visible: layer && layer.visible !== false,
    backgroundImageDataUrl:
      layer && typeof layer.backgroundImageDataUrl === "string" ? layer.backgroundImageDataUrl : "",
    cells: resizeLayerGrid(layer && layer.cells, rows, cols, type, textureCatalog),
  };
}

function ensureTerrainLayers(map, textureCatalog, createId) {
  const rows = clamp(Number.parseInt(map.rows, 10) || 20, 5, 80);
  const cols = clamp(Number.parseInt(map.cols, 10) || 30, 5, 80);
  const isV2 = Number(map.terrainVersion) === 2 && Array.isArray(map.terrainLayers);
  if (!isV2) {
    map.terrainVersion = 2;
    map.terrainLayers = createDefaultTerrainLayers({ createId, rows, cols, textureCatalog });
    return;
  }

  const nextLayers = map.terrainLayers
    .filter((layer) => layer && typeof layer === "object")
    .map((layer) => normalizeTerrainLayer(layer, rows, cols, textureCatalog, createId));

  if (!nextLayers.some((layer) => layer.type === "background")) {
    nextLayers.unshift(
      createTerrainLayer({
        createId,
        name: "Background",
        type: "background",
        rows,
        cols,
        fillTile: createBaseTile(
          {
            kind: "texture",
            textureId: textureCatalog.defaultBackgroundTextureId || DEFAULT_BACKGROUND_TEXTURE_ID,
            alpha: 1,
          },
          "background",
          textureCatalog
        ),
      })
    );
  }
  if (!nextLayers.some((layer) => layer.type === "foreground")) {
    nextLayers.push(
      createTerrainLayer({
        createId,
        name: "Foreground",
        type: "foreground",
        rows,
        cols,
      })
    );
  }

  map.terrainVersion = 2;
  map.terrainLayers = nextLayers;
}

function resizeTerrainForMap(map, rows, cols, textureCatalog, createId) {
  ensureTerrainLayers(map, textureCatalog, createId);
  map.terrainLayers = map.terrainLayers.map((layer) =>
    normalizeTerrainLayer(layer, rows, cols, textureCatalog, createId)
  );
}

function getTerrainLayers(map) {
  return map && Array.isArray(map.terrainLayers) ? map.terrainLayers : [];
}

function getTerrainLayerById(map, layerId) {
  const wanted = String(layerId || "");
  return getTerrainLayers(map).find((layer) => layer.id === wanted) || null;
}

function getTerrainTile(layer, x, y) {
  if (!layer || !Array.isArray(layer.cells) || y < 0 || x < 0) {
    return null;
  }
  const row = layer.cells[y];
  if (!Array.isArray(row) || x >= row.length) {
    return null;
  }
  return row[x] || null;
}

function setTerrainTile(layer, x, y, tile, textureCatalog) {
  if (!layer || !Array.isArray(layer.cells) || y < 0 || x < 0) {
    return false;
  }
  const row = layer.cells[y];
  if (!Array.isArray(row) || x >= row.length) {
    return false;
  }
  row[x] = createBaseTile(tile, layer.type, textureCatalog);
  return true;
}

function buildImageComponent(layer) {
  return {
    layerId: layer.id,
    layerType: layer.type,
    tile: {
      kind: "image",
      alpha: 1,
      blocksMovement: false,
      blocksVision: false,
      blocksLight: false,
    },
  };
}

function getTopTerrainComponent(map, x, y) {
  if (!map || x < 0 || y < 0 || x >= map.cols || y >= map.rows) {
    return null;
  }
  const layers = getTerrainLayers(map);
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    const layer = layers[index];
    if (!layer || layer.visible === false) {
      continue;
    }
    const tile = getTerrainTile(layer, x, y);
    if (tile) {
      return {
        layerId: layer.id,
        layerType: layer.type,
        tile,
      };
    }
    if (layer.backgroundImageDataUrl) {
      return buildImageComponent(layer);
    }
  }
  return null;
}

function isTileBlockingMovement(component) {
  if (!component || component.layerType !== "foreground" || !component.tile) {
    return false;
  }
  if (component.tile.kind === "door") {
    return !component.tile.doorOpen && component.tile.blocksMovement !== false;
  }
  return component.tile.blocksMovement === true;
}

function isTileBlockingSight(component) {
  if (!component || component.layerType !== "foreground" || !component.tile) {
    return false;
  }
  if (component.tile.kind === "door") {
    return !component.tile.doorOpen && component.tile.blocksVision !== false;
  }
  return component.tile.blocksVision === true;
}

function cloneVisibleMapForRole(map, role) {
  const cloned = deepClone(map);
  if (role === "dm") {
    return cloned;
  }
  getTerrainLayers(cloned).forEach((layer) => {
    layer.cells = (Array.isArray(layer.cells) ? layer.cells : []).map((row) =>
      (Array.isArray(row) ? row : []).map((tile) => {
        if (!tile || tile.kind !== "door") {
          return tile;
        }
        const safe = { ...tile };
        delete safe.doorLocked;
        return safe;
      })
    );
  });
  return cloned;
}

function nextLayerName(map, type) {
  const safeType = type === "foreground" ? "Foreground" : "Background";
  const existing = new Set(getTerrainLayers(map).map((layer) => String(layer.name || "").toLowerCase()));
  if (!existing.has(safeType.toLowerCase())) {
    return safeType;
  }
  let index = 2;
  while (index < 500) {
    const candidate = `${safeType} ${index}`;
    if (!existing.has(candidate.toLowerCase())) {
      return candidate;
    }
    index += 1;
  }
  return `${safeType} ${Date.now()}`;
}

function createLayerOnMap(map, type, createId, textureCatalog) {
  const layerType = type === "foreground" ? "foreground" : "background";
  const layer = createTerrainLayer({
    createId,
    name: nextLayerName(map, layerType),
    type: layerType,
    rows: map.rows,
    cols: map.cols,
  });
  getTerrainLayers(map).push(layer);
  return layer;
}

function deleteLayerFromMap(map, layerId) {
  const layers = getTerrainLayers(map);
  const targetIndex = layers.findIndex((layer) => layer.id === String(layerId || ""));
  if (targetIndex < 0) {
    return { ok: false, reason: "Layer not found." };
  }
  const target = layers[targetIndex];
  const sameTypeCount = layers.filter((layer) => layer.type === target.type).length;
  if (sameTypeCount <= 1) {
    return { ok: false, reason: `At least one ${target.type} layer must remain.` };
  }
  layers.splice(targetIndex, 1);
  return { ok: true, deletedLayerId: target.id };
}

function reorderLayersOnMap(map, orderedLayerIds) {
  const layers = getTerrainLayers(map);
  const wanted = Array.isArray(orderedLayerIds) ? orderedLayerIds.map((id) => String(id || "")) : [];
  if (wanted.length !== layers.length) {
    return false;
  }
  const byId = new Map(layers.map((layer) => [layer.id, layer]));
  if (wanted.some((id) => !byId.has(id))) {
    return false;
  }
  map.terrainLayers = wanted.map((id) => byId.get(id));
  return true;
}

function importBackgroundIntoLayer(layer, imageDataUrl) {
  if (!layer || layer.type !== "background") {
    return { ok: false, reason: "Select a background layer first." };
  }
  const safeImageDataUrl = String(imageDataUrl || "");
  if (!safeImageDataUrl) {
    layer.backgroundImageDataUrl = "";
  } else {
    if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(safeImageDataUrl)) {
      return { ok: false, reason: "Background must be an image file." };
    }
    if (safeImageDataUrl.length > MAX_LAYER_BACKGROUND_DATA_URL_LENGTH) {
      return { ok: false, reason: "Background image is too large." };
    }
    layer.backgroundImageDataUrl = safeImageDataUrl;
  }
  layer.cells = makeLayerGrid(layer.cells.length || 0, (layer.cells[0] || []).length || 0, null);
  return { ok: true };
}

function applyTerrainOps(map, layerId, ops, textureCatalog) {
  const layer = getTerrainLayerById(map, layerId);
  if (!layer) {
    return { ok: false, reason: "Layer not found." };
  }
  const safeOps = Array.isArray(ops) ? ops.slice(0, 20_000) : [];
  safeOps.forEach((op) => {
    const x = Number.parseInt(op && op.x, 10);
    const y = Number.parseInt(op && op.y, 10);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x >= map.cols || y >= map.rows) {
      return;
    }
    setTerrainTile(layer, x, y, op ? op.tile : null, textureCatalog);
  });
  return { ok: true, layerId: layer.id };
}

function findDoorComponentAt(map, x, y) {
  const component = getTopTerrainComponent(map, x, y);
  if (!component || !component.tile || component.tile.kind !== "door") {
    return null;
  }
  const layer = getTerrainLayerById(map, component.layerId);
  const tile = layer ? getTerrainTile(layer, x, y) : null;
  if (!layer || !tile || tile.kind !== "door") {
    return null;
  }
  return {
    layer,
    tile,
    x,
    y,
  };
}

function normalizeCampaignTerrainDefaults(campaign, textureCatalog) {
  if (!campaign || typeof campaign !== "object") {
    return;
  }
  campaign.terrainTextureDefaults = normalizeTextureDefaults(campaign.terrainTextureDefaults, textureCatalog);
}

function serializeTextureCatalogForClient(textureCatalog) {
  return {
    generatedAt: textureCatalog.generatedAt,
    defaultBackgroundTextureId: textureCatalog.defaultBackgroundTextureId,
    categories: (textureCatalog.categories || []).map((category) => ({
      id: category.id,
      label: category.label,
      defaultTextureId: category.defaultTextureId,
      assets: (category.assets || []).map((asset) => ({
        id: asset.id,
        label: asset.label,
        categoryId: asset.categoryId,
        previewUrl: asset.previewUrl,
      })),
    })),
  };
}

module.exports = {
  DEFAULT_BACKGROUND_TEXTURE_ID,
  DEFAULT_TERRAIN_TEXTURE_ROOT,
  MAX_LAYER_BACKGROUND_DATA_URL_LENGTH,
  applyTerrainOps,
  buildResolvedTextureDefaults,
  buildTextureCatalog,
  cloneVisibleMapForRole,
  createBaseTile,
  createDefaultTerrainLayers,
  createLayerOnMap,
  deleteLayerFromMap,
  ensureTerrainLayers,
  findDoorComponentAt,
  getTerrainLayerById,
  getTopTerrainComponent,
  importBackgroundIntoLayer,
  isTileBlockingMovement,
  isTileBlockingSight,
  normalizeCampaignTerrainDefaults,
  normalizeTextureDefaults,
  reorderLayersOnMap,
  resizeTerrainForMap,
  serializeTextureCatalogForClient,
};
