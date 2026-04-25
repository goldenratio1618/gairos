const assert = require("assert").strict;
const {
  createFovCacheForMap,
  mapCellIndex,
  serializedFovHasLineOfSight,
} = require("../server/game/fov");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function wallTile(overrides = {}) {
  return {
    kind: "color",
    color: "#555555",
    alpha: 1,
    blocksMovement: true,
    blocksVision: true,
    blocksLight: true,
    ...overrides,
  };
}

function doorTile(overrides = {}) {
  return {
    kind: "door",
    doorOpen: false,
    doorLocked: false,
    blocksMovement: true,
    blocksVision: true,
    blocksLight: true,
    ...overrides,
  };
}

function emptyLayer(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
}

function mapWithForeground(rows, cols, cells) {
  return {
    id: "map_test",
    rows,
    cols,
    terrainLayers: [
      {
        id: "foreground",
        type: "foreground",
        visible: true,
        cells,
      },
    ],
  };
}

function hasLos(cache, kind, map, origin, target) {
  return serializedFovHasLineOfSight(
    cache,
    kind,
    mapCellIndex(map, origin.x, origin.y),
    mapCellIndex(map, target.x, target.y)
  );
}

test("a token inside a lit room can see all room floor and wall tiles", () => {
  const rows = 9;
  const cols = 9;
  const cells = emptyLayer(rows, cols);
  for (let x = 1; x <= 7; x += 1) {
    cells[1][x] = wallTile();
    cells[7][x] = wallTile();
  }
  for (let y = 1; y <= 7; y += 1) {
    cells[y][1] = wallTile();
    cells[y][7] = wallTile();
  }

  const map = mapWithForeground(rows, cols, cells);
  const cache = createFovCacheForMap(map);
  const origin = { x: 4, y: 4 };

  for (let y = 1; y <= 7; y += 1) {
    for (let x = 1; x <= 7; x += 1) {
      assert.equal(hasLos(cache, "vision", map, origin, { x, y }), true, `expected LOS to ${x},${y}`);
    }
  }

  assert.equal(hasLos(cache, "vision", map, origin, { x: 4, y: 0 }), false);
  assert.equal(hasLos(cache, "vision", map, origin, { x: 0, y: 4 }), false);
});

test("a wall tile is visible but a second wall directly behind it is blocked", () => {
  const cells = emptyLayer(5, 6);
  cells[2][3] = wallTile();
  cells[2][4] = wallTile();

  const map = mapWithForeground(5, 6, cells);
  const cache = createFovCacheForMap(map);
  const origin = { x: 2, y: 2 };

  assert.equal(hasLos(cache, "vision", map, origin, { x: 3, y: 2 }), true);
  assert.equal(hasLos(cache, "vision", map, origin, { x: 4, y: 2 }), false);
});

test("closed doors block FOV and open doors do not", () => {
  const closedCells = emptyLayer(5, 6);
  closedCells[2][3] = doorTile({ doorOpen: false });
  const closedMap = mapWithForeground(5, 6, closedCells);
  const closedCache = createFovCacheForMap(closedMap);

  const openCells = emptyLayer(5, 6);
  openCells[2][3] = doorTile({ doorOpen: true });
  const openMap = mapWithForeground(5, 6, openCells);
  const openCache = createFovCacheForMap(openMap);

  const origin = { x: 2, y: 2 };
  const beyondDoor = { x: 4, y: 2 };
  assert.equal(hasLos(closedCache, "vision", closedMap, origin, beyondDoor), false);
  assert.equal(hasLos(openCache, "vision", openMap, origin, beyondDoor), true);
});

test("vision and light blocker caches can diverge", () => {
  const cells = emptyLayer(5, 6);
  cells[2][3] = wallTile({
    blocksVision: false,
    blocksLight: true,
  });

  const map = mapWithForeground(5, 6, cells);
  const cache = createFovCacheForMap(map);
  const origin = { x: 2, y: 2 };
  const target = { x: 4, y: 2 };

  assert.equal(hasLos(cache, "vision", map, origin, target), true);
  assert.equal(hasLos(cache, "light", map, origin, target), false);
});

let failures = 0;
tests.forEach(({ name, fn }) => {
  try {
    fn();
    process.stdout.write(`ok - ${name}\n`);
  } catch (error) {
    failures += 1;
    process.stderr.write(`not ok - ${name}\n`);
    process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
  }
});

if (failures > 0) {
  process.exitCode = 1;
}
