const crypto = require("crypto");

const FOV_CACHE_VERSION = 1;
const FOV_CACHE_ALGORITHM = "angular-shadow-v1";
const FOV_CACHE_REBUILD_INTERVAL_MS = 60000;
const TAU = Math.PI * 2;
const EPSILON = 1e-9;

function clampGridDimension(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function mapCellIndex(map, x, y) {
  return y * map.cols + x;
}

function bitsetStride(total) {
  return Math.ceil(total / 8);
}

function setBit(bytes, offset) {
  bytes[offset >> 3] |= 1 << (offset & 7);
}

function getBit(bytes, offset) {
  return (bytes[offset >> 3] & (1 << (offset & 7))) !== 0;
}

function normalizeAngle(angle) {
  const normalized = angle % TAU;
  return normalized < 0 ? normalized + TAU : normalized;
}

function cellAngleIntervals(originX, originY, targetX, targetY) {
  const centerX = originX + 0.5;
  const centerY = originY + 0.5;
  const corners = [
    [targetX, targetY],
    [targetX + 1, targetY],
    [targetX, targetY + 1],
    [targetX + 1, targetY + 1],
  ];
  const angles = corners
    .map(([x, y]) => normalizeAngle(Math.atan2(y - centerY, x - centerX)))
    .sort((a, b) => a - b);

  let largestGap = -1;
  let startIndex = 0;
  let endIndex = angles.length - 1;
  for (let index = 0; index < angles.length; index += 1) {
    const current = angles[index];
    const next = index === angles.length - 1 ? angles[0] + TAU : angles[index + 1];
    const gap = next - current;
    if (gap > largestGap) {
      largestGap = gap;
      startIndex = (index + 1) % angles.length;
      endIndex = index;
    }
  }

  const start = angles[startIndex];
  const end = angles[endIndex];
  if (start <= end) {
    return [[start, end]];
  }
  return [
    [start, TAU],
    [0, end],
  ];
}

function intervalCovered(interval, shadows) {
  const [start, end] = interval;
  if (end - start <= EPSILON) {
    return true;
  }
  let cursor = start;
  for (const shadow of shadows) {
    if (shadow[1] <= cursor + EPSILON) {
      continue;
    }
    if (shadow[0] > cursor + EPSILON) {
      return false;
    }
    cursor = Math.max(cursor, shadow[1]);
    if (cursor >= end - EPSILON) {
      return true;
    }
  }
  return false;
}

function intervalsVisible(intervals, shadows) {
  return intervals.some((interval) => !intervalCovered(interval, shadows));
}

function addShadowInterval(shadows, interval) {
  const [start, end] = interval;
  if (end - start <= EPSILON) {
    return;
  }

  const merged = [];
  let next = [start, end];
  let inserted = false;
  for (const shadow of shadows) {
    if (shadow[1] < next[0] - EPSILON) {
      merged.push(shadow);
      continue;
    }
    if (next[1] < shadow[0] - EPSILON) {
      if (!inserted) {
        merged.push(next);
        inserted = true;
      }
      merged.push(shadow);
      continue;
    }
    next = [Math.min(next[0], shadow[0]), Math.max(next[1], shadow[1])];
  }
  if (!inserted) {
    merged.push(next);
  }

  shadows.length = 0;
  merged.forEach((shadow) => shadows.push(shadow));
}

function addShadowIntervals(shadows, intervals) {
  intervals.forEach((interval) => addShadowInterval(shadows, interval));
}

function ringCells(originX, originY, distance, rows, cols) {
  const cells = [];
  const minX = Math.max(0, originX - distance);
  const maxX = Math.min(cols - 1, originX + distance);
  const minY = Math.max(0, originY - distance);
  const maxY = Math.min(rows - 1, originY + distance);

  for (let x = minX; x <= maxX; x += 1) {
    cells.push([x, minY]);
    if (maxY !== minY) {
      cells.push([x, maxY]);
    }
  }
  for (let y = minY + 1; y <= maxY - 1; y += 1) {
    cells.push([minX, y]);
    if (maxX !== minX) {
      cells.push([maxX, y]);
    }
  }

  return cells;
}

function computeFovBitsets(rows, cols, blockers) {
  const total = rows * cols;
  const stride = bitsetStride(total);
  const bytes = new Uint8Array(total * stride);
  const maxDistance = Math.max(rows, cols);
  const intervalCache = new Map();

  function intervalsForDelta(dx, dy) {
    const key = `${dx},${dy}`;
    const cached = intervalCache.get(key);
    if (cached) {
      return cached;
    }
    const intervals = cellAngleIntervals(0, 0, dx, dy);
    intervalCache.set(key, intervals);
    return intervals;
  }

  for (let originY = 0; originY < rows; originY += 1) {
    for (let originX = 0; originX < cols; originX += 1) {
      const originIndex = originY * cols + originX;
      const originOffset = originIndex * stride;
      bytes[originOffset + (originIndex >> 3)] |= 1 << (originIndex & 7);
      const shadows = [];

      for (let distance = 1; distance <= maxDistance; distance += 1) {
        const opaqueIntervals = [];
        const cells = ringCells(originX, originY, distance, rows, cols);
        for (const [targetX, targetY] of cells) {
          const targetIndex = targetY * cols + targetX;
          const intervals = intervalsForDelta(targetX - originX, targetY - originY);
          if (!intervalsVisible(intervals, shadows)) {
            continue;
          }
          bytes[originOffset + (targetIndex >> 3)] |= 1 << (targetIndex & 7);
          if (blockers[targetIndex] === 1) {
            opaqueIntervals.push(intervals);
          }
        }
        opaqueIntervals.forEach((intervals) => addShadowIntervals(shadows, intervals));
      }
    }
  }

  return bytes;
}

function tileBlocksKind(tile, kind) {
  if (!tile) {
    return false;
  }
  if (tile.kind === "door") {
    if (tile.doorOpen) {
      return false;
    }
    return kind === "light" ? tile.blocksLight !== false : tile.blocksVision !== false;
  }
  return kind === "light" ? tile.blocksLight === true : tile.blocksVision === true;
}

function buildTerrainBlockerGrids(map) {
  const rows = clampGridDimension(map && map.rows, 1);
  const cols = clampGridDimension(map && map.cols, 1);
  const total = rows * cols;
  const vision = new Uint8Array(total);
  const light = new Uint8Array(total);
  const layers = Array.isArray(map && map.terrainLayers) ? map.terrainLayers : [];

  layers.forEach((layer) => {
    if (!layer || layer.visible === false || layer.type !== "foreground" || !Array.isArray(layer.cells)) {
      return;
    }
    for (let y = 0; y < rows; y += 1) {
      const row = Array.isArray(layer.cells[y]) ? layer.cells[y] : [];
      for (let x = 0; x < cols; x += 1) {
        const tile = row[x] || null;
        if (!tile) {
          continue;
        }
        const index = y * cols + x;
        if (tileBlocksKind(tile, "vision")) {
          vision[index] = 1;
        }
        if (tileBlocksKind(tile, "light")) {
          light[index] = 1;
        }
      }
    }
  });

  return { rows, cols, vision, light };
}

function terrainFovFingerprint(map) {
  const rows = clampGridDimension(map && map.rows, 1);
  const cols = clampGridDimension(map && map.cols, 1);
  const hash = crypto.createHash("sha256");
  hash.update(`${rows}x${cols}|`);
  const layers = Array.isArray(map && map.terrainLayers) ? map.terrainLayers : [];

  layers.forEach((layer) => {
    if (!layer || layer.type !== "foreground") {
      return;
    }
    hash.update(`layer:${layer.id || ""}:${layer.visible === false ? 0 : 1}|`);
    if (layer.visible === false || !Array.isArray(layer.cells)) {
      return;
    }
    for (let y = 0; y < rows; y += 1) {
      const row = Array.isArray(layer.cells[y]) ? layer.cells[y] : [];
      for (let x = 0; x < cols; x += 1) {
        const tile = row[x] || null;
        const blocksVision = tileBlocksKind(tile, "vision");
        const blocksLight = tileBlocksKind(tile, "light");
        if (!blocksVision && !blocksLight) {
          continue;
        }
        hash.update(
          `${x},${y}:${blocksVision ? 1 : 0}${blocksLight ? 1 : 0}:${tile && tile.kind === "door" ? "door" : "tile"}|`
        );
      }
    }
  });

  return hash.digest("hex");
}

function blockersEqual(a, b) {
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
}

function writeVarUint(value, out) {
  let next = value >>> 0;
  while (next >= 0x80) {
    out.push((next & 0x7f) | 0x80);
    next >>>= 7;
  }
  out.push(next);
}

function readVarUint(bytes, cursor) {
  let value = 0;
  let shift = 0;
  let index = cursor;
  while (index < bytes.length) {
    const byte = bytes[index];
    index += 1;
    value |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      return { value, cursor: index };
    }
    shift += 7;
  }
  return { value: 0, cursor: bytes.length };
}

function encodeRleBytes(bytes) {
  const out = [];
  let index = 0;
  while (index < bytes.length) {
    const value = bytes[index];
    let runLength = 1;
    while (index + runLength < bytes.length && bytes[index + runLength] === value) {
      runLength += 1;
    }
    writeVarUint(runLength, out);
    out.push(value);
    index += runLength;
  }
  return Uint8Array.from(out);
}

function decodeRleBytes(bytes, expectedLength) {
  const out = new Uint8Array(expectedLength);
  let cursor = 0;
  let target = 0;
  while (cursor < bytes.length && target < expectedLength) {
    const result = readVarUint(bytes, cursor);
    cursor = result.cursor;
    const value = bytes[cursor];
    cursor += 1;
    out.fill(value, target, Math.min(expectedLength, target + result.value));
    target += result.value;
  }
  return out;
}

function encodeVisibilityBytes(bytes) {
  const raw = Buffer.from(bytes);
  const rle = Buffer.from(encodeRleBytes(bytes));
  if (rle.length < raw.length) {
    return {
      encoding: "rle-byte-base64-v1",
      data: rle.toString("base64"),
    };
  }
  return {
    encoding: "raw-byte-base64-v1",
    data: raw.toString("base64"),
  };
}

function decodeVisibilityBytes(record, expectedLength) {
  if (!record || typeof record.data !== "string") {
    return new Uint8Array(expectedLength);
  }
  const bytes = Buffer.from(record.data, "base64");
  if (record.encoding === "rle-byte-base64-v1") {
    return decodeRleBytes(bytes, expectedLength);
  }
  const out = new Uint8Array(expectedLength);
  out.set(new Uint8Array(bytes.buffer, bytes.byteOffset, Math.min(bytes.byteLength, expectedLength)));
  return out;
}

function serializedSetHasData(record) {
  return Boolean(
    record &&
      typeof record === "object" &&
      (record.sameAs || (typeof record.data === "string" && record.data.length > 0))
  );
}

function fovCacheHasUsableData(cache, kind = "vision") {
  if (!cache || cache.version !== FOV_CACHE_VERSION) {
    return false;
  }
  const total = Number(cache.total) || Number(cache.rows) * Number(cache.cols);
  const expectedStride = bitsetStride(total);
  if (Number(cache.originByteLength) !== expectedStride) {
    return false;
  }
  const sets = cache.sets && typeof cache.sets === "object" ? cache.sets : {};
  const record = sets[kind];
  if (!serializedSetHasData(record)) {
    return false;
  }
  if (record.sameAs) {
    return serializedSetHasData(sets[record.sameAs]);
  }
  return true;
}

function normalizeFovCacheShape(cache, map) {
  const rows = clampGridDimension(map && map.rows, 1);
  const cols = clampGridDimension(map && map.cols, 1);
  const total = rows * cols;
  const originByteLength = bitsetStride(total);
  const next = cache && typeof cache === "object" ? cache : {};
  const sets = next.sets && typeof next.sets === "object" ? next.sets : {};
  const compatibleShape =
    next.version === FOV_CACHE_VERSION &&
    next.algorithm === FOV_CACHE_ALGORITHM &&
    Number(next.rows) === rows &&
    Number(next.cols) === cols &&
    Number(next.originByteLength) === originByteLength;
  const normalized = {
    version: FOV_CACHE_VERSION,
    algorithm: FOV_CACHE_ALGORITHM,
    rows,
    cols,
    total,
    originByteLength,
    terrainHash: typeof next.terrainHash === "string" ? next.terrainHash : "",
    builtAt: typeof next.builtAt === "string" ? next.builtAt : null,
    stale: Boolean(next.stale),
    staleAt: typeof next.staleAt === "string" ? next.staleAt : null,
    staleReason: typeof next.staleReason === "string" ? next.staleReason : "",
    nextRebuildAt: typeof next.nextRebuildAt === "string" ? next.nextRebuildAt : null,
    rebuilding: Boolean(next.rebuilding),
    sets: {
      vision: compatibleShape && sets.vision && typeof sets.vision === "object" ? sets.vision : null,
      light: compatibleShape && sets.light && typeof sets.light === "object" ? sets.light : null,
    },
  };

  const validShape =
    compatibleShape &&
    fovCacheHasUsableData(normalized, "vision") &&
    fovCacheHasUsableData(normalized, "light");
  if (!validShape) {
    normalized.stale = true;
    normalized.staleReason = normalized.staleReason || "Cache is missing or out of date.";
  }
  return normalized;
}

function markFovCacheStale(map, reason, now = new Date()) {
  const cache = normalizeFovCacheShape(map && map.fovCache, map);
  cache.stale = true;
  cache.staleAt = now.toISOString();
  cache.staleReason = String(reason || "Terrain changed.").slice(0, 160);
  map.fovCache = cache;
  return cache;
}

function fovCacheNeedsRebuild(map) {
  const cache = normalizeFovCacheShape(map && map.fovCache, map);
  const currentHash = terrainFovFingerprint(map);
  return (
    !fovCacheHasUsableData(cache, "vision") ||
    !fovCacheHasUsableData(cache, "light") ||
    cache.terrainHash !== currentHash ||
    cache.stale === true
  );
}

function createFovCacheForMap(map, builtAt = new Date()) {
  const { rows, cols, vision, light } = buildTerrainBlockerGrids(map);
  const total = rows * cols;
  const originByteLength = bitsetStride(total);
  const visionBytes = computeFovBitsets(rows, cols, vision);
  const sameBlockers = blockersEqual(vision, light);
  const lightBytes = sameBlockers ? visionBytes : computeFovBitsets(rows, cols, light);

  return {
    version: FOV_CACHE_VERSION,
    algorithm: FOV_CACHE_ALGORITHM,
    rows,
    cols,
    total,
    originByteLength,
    terrainHash: terrainFovFingerprint(map),
    builtAt: builtAt.toISOString(),
    stale: false,
    staleAt: null,
    staleReason: "",
    nextRebuildAt: null,
    rebuilding: false,
    sets: {
      vision: encodeVisibilityBytes(visionBytes),
      light: sameBlockers ? { sameAs: "vision" } : encodeVisibilityBytes(lightBytes),
    },
  };
}

function decodeSerializedFovSet(cache, kind) {
  const normalizedKind = kind === "light" ? "light" : "vision";
  const total = Number(cache && cache.total) || Number(cache && cache.rows) * Number(cache && cache.cols);
  const expectedLength = total * bitsetStride(total);
  const sets = cache && cache.sets && typeof cache.sets === "object" ? cache.sets : {};
  const record = sets[normalizedKind];
  if (record && record.sameAs) {
    return decodeSerializedFovSet(cache, record.sameAs);
  }
  return decodeVisibilityBytes(record, expectedLength);
}

function serializedFovHasLineOfSight(cache, kind, originIndex, targetIndex) {
  const total = Number(cache && cache.total) || Number(cache && cache.rows) * Number(cache && cache.cols);
  if (originIndex < 0 || targetIndex < 0 || originIndex >= total || targetIndex >= total) {
    return false;
  }
  const stride = bitsetStride(total);
  const bytes = decodeSerializedFovSet(cache, kind);
  return (bytes[originIndex * stride + (targetIndex >> 3)] & (1 << (targetIndex & 7))) !== 0;
}

module.exports = {
  FOV_CACHE_ALGORITHM,
  FOV_CACHE_REBUILD_INTERVAL_MS,
  FOV_CACHE_VERSION,
  bitsetStride,
  buildTerrainBlockerGrids,
  computeFovBitsets,
  createFovCacheForMap,
  decodeSerializedFovSet,
  fovCacheHasUsableData,
  fovCacheNeedsRebuild,
  getBit,
  mapCellIndex,
  markFovCacheStale,
  normalizeFovCacheShape,
  serializedFovHasLineOfSight,
  terrainFovFingerprint,
};
