(() => {
  const socket = io("/tabletop");

  const STORAGE_SESSION_KEY = "gairos_tabletop_session";
  const STORAGE_LOG_MIN_KEY = "gairos_tabletop_log_minimized";
  const STORAGE_LEFT_MIN_KEY = "gairos_tabletop_left_minimized";
  const MAX_MAP_BACKGROUND_DATA_URL_LENGTH = 9_500_000;

  const elements = {
    root: document.getElementById("tabletop-root"),
    leftPanel: document.querySelector(".tt-left"),
    authStatus: document.getElementById("auth-status"),
    authForms: document.getElementById("auth-forms"),
    logoutButton: document.getElementById("logout-button"),
    mainStatus: document.getElementById("main-status"),

    loginForm: document.getElementById("login-form"),
    loginUsername: document.getElementById("login-username"),
    loginPassword: document.getElementById("login-password"),

    registerForm: document.getElementById("register-form"),
    registerUsername: document.getElementById("register-username"),
    registerPassword: document.getElementById("register-password"),
    menuToggle: document.getElementById("menu-toggle"),
    railAccount: document.getElementById("rail-account"),
    railCampaigns: document.getElementById("rail-campaigns"),
    railCharacter: document.getElementById("rail-character"),
    railBattlemaps: document.getElementById("rail-battlemaps"),
    railRolls: document.getElementById("rail-rolls"),
    railCombat: document.getElementById("rail-combat"),
    railUtilities: document.getElementById("rail-utilities"),

    campaignCard: document.getElementById("campaign-card"),
    campaignList: document.getElementById("campaign-list"),
    campaignForm: document.getElementById("campaign-form"),
    campaignName: document.getElementById("campaign-name"),
    campaignCreate: document.getElementById("campaign-create"),

    characterCard: document.getElementById("character-card"),
    characterSelect: document.getElementById("character-select"),
    characterNewButton: document.getElementById("character-new-button"),
    characterDeleteButton: document.getElementById("character-delete-button"),
    characterRefreshButton: document.getElementById("character-refresh-button"),
    characterTokenPreview: document.getElementById("character-token-preview"),
    characterTokenBadge: document.getElementById("character-token-badge"),
    characterTokenLabel: document.getElementById("character-token-label"),
    characterStatsSummary: document.getElementById("character-stats-summary"),
    characterStatsDetailGrid: document.getElementById("character-stats-detail-grid"),
    characterForm: document.getElementById("character-form"),
    characterId: document.getElementById("character-id"),
    characterName: document.getElementById("character-name"),
    characterSheetUrl: document.getElementById("character-sheet-url"),
    characterFeatsText: document.getElementById("character-feats-text"),
    characterTokenImage: document.getElementById("character-token-image"),
    characterTokenFile: document.getElementById("character-token-file"),
    characterSpeed: document.getElementById("character-speed"),
    characterMaxHp: document.getElementById("character-max-hp"),
    characterStrengthMod: document.getElementById("character-strength-mod"),
    characterIsdc: document.getElementById("character-isdc"),

    statblockCard: document.getElementById("statblock-card"),
    statblockList: document.getElementById("statblock-list"),
    statblockForm: document.getElementById("statblock-form"),
    statblockId: document.getElementById("statblock-id"),
    statblockName: document.getElementById("statblock-name"),
    statblockMode: document.getElementById("statblock-mode"),
    statblockSheetUrl: document.getElementById("statblock-sheet-url"),
    statblockSheetName: document.getElementById("statblock-sheet-name"),
    statblockColumnName: document.getElementById("statblock-column-name"),
    statblockManualText: document.getElementById("statblock-manual-text"),
    statblockTokenImage: document.getElementById("statblock-token-image"),
    statblockTokenFile: document.getElementById("statblock-token-file"),

    mapCard: document.getElementById("map-card"),
    mapSelect: document.getElementById("map-select"),
    mapNew: document.getElementById("map-new"),
    mapDelete: document.getElementById("map-delete"),
    mapName: document.getElementById("map-name"),
    mapRows: document.getElementById("map-rows"),
    mapCols: document.getElementById("map-cols"),
    mapGridFeet: document.getElementById("map-grid-feet"),
    mapGmOpacity: document.getElementById("map-gm-opacity"),
    mapGmOpacityValue: document.getElementById("map-gm-opacity-value"),
    mapBackgroundInput: document.getElementById("map-background-input"),
    interactionMode: document.getElementById("interaction-mode"),
    terrainBrush: document.getElementById("terrain-brush"),
    tokenLayerSelect: document.getElementById("token-layer-select"),
    customTokenFile: document.getElementById("custom-token-file"),
    tokenRoster: document.getElementById("token-roster"),

    selectedTokenControls: document.getElementById("selected-token-controls"),
    tokenLayerToTokens: document.getElementById("token-layer-to-tokens"),
    tokenLayerToGm: document.getElementById("token-layer-to-gm"),
    tokenToggleAuto: document.getElementById("token-toggle-auto"),
    tokenDelete: document.getElementById("token-delete"),

    rollCard: document.getElementById("roll-card"),
    rollForm: document.getElementById("roll-form"),
    rollEntitySelect: document.getElementById("roll-entity-select"),
    rollSkillSelect: document.getElementById("roll-skill-select"),
    rollTypeDisplay: document.getElementById("roll-type-display"),
    rollAdvantage: document.getElementById("roll-advantage"),
    rollSkillModifier: document.getElementById("roll-skill-modifier"),
    rollTargetDieWrap: document.getElementById("roll-target-die-wrap"),
    rollTargetDieIndex: document.getElementById("roll-target-die-index"),
    rollShiftingWrap: document.getElementById("roll-shifting-wrap"),
    rollShiftingMode: document.getElementById("roll-shifting-mode"),
    rollMiracleWrap: document.getElementById("roll-miracle-wrap"),
    rollUseMiracle: document.getElementById("roll-use-miracle"),
    rollBonusOverride: document.getElementById("roll-bonus-override"),
    rollModifierList: document.getElementById("roll-modifier-list"),
    allySourceUser: document.getElementById("ally-source-user"),
    allyModifierId: document.getElementById("ally-modifier-id"),
    requestAllyModifier: document.getElementById("request-ally-modifier"),
    approvedModifierList: document.getElementById("approved-modifier-list"),
    rollResult: document.getElementById("roll-result"),

    injuryCard: document.getElementById("injury-card"),
    dmToolsCard: document.getElementById("dm-tools-card"),
    forageTerrain: document.getElementById("forage-terrain"),
    forageRoll: document.getElementById("forage-roll"),
    groupRollSkill: document.getElementById("group-roll-skill"),
    groupRollSend: document.getElementById("group-roll-send"),
    initiativeSummary: document.getElementById("initiative-summary"),
    initiativeOrderList: document.getElementById("initiative-order-list"),
    initiativeControls: document.getElementById("initiative-controls"),
    initiativeStart: document.getElementById("initiative-start"),
    initiativeNext: document.getElementById("initiative-next"),
    initiativeStop: document.getElementById("initiative-stop"),
    toolDistance: document.getElementById("tool-distance"),
    toolCone: document.getElementById("tool-cone"),
    toolCircle: document.getElementById("tool-circle"),
    toolRectangle: document.getElementById("tool-rectangle"),
    distanceMode: document.getElementById("distance-mode"),
    drawingColor: document.getElementById("drawing-color"),
    drawingLayerRow: document.getElementById("drawing-layer-row"),
    drawingLayerSelect: document.getElementById("drawing-layer-select"),
    measureReadout: document.getElementById("measure-readout"),

    injuryEntitySelect: document.getElementById("injury-entity-select"),
    injuryOverkill: document.getElementById("injury-overkill"),
    injuryRoll: document.getElementById("injury-roll"),
    injuryResult: document.getElementById("injury-result"),

    boardWrap: document.getElementById("board-wrap"),
    mapGridWrap: document.getElementById("map-grid-wrap"),
    mapGridCells: document.getElementById("map-grid-cells"),
    mapGridTokens: document.getElementById("map-grid-tokens"),
    mapMeasureOverlay: document.getElementById("map-measure-overlay"),
    mapDrawingsLayer: document.getElementById("map-drawings-layer"),
    mapPreviewLayer: document.getElementById("map-preview-layer"),
    mapMeasureLabel: document.getElementById("map-measure-label"),

    logPanel: document.getElementById("log-panel"),
    logToggle: document.getElementById("log-toggle"),
    logEntries: document.getElementById("log-entries"),
    chatForm: document.getElementById("chat-form"),
    chatInput: document.getElementById("chat-input"),
  };

  const state = {
    snapshot: null,
    selectedTokenId: null,
    selectedPlacement: null,
    selectedCharacterId: null,
    pendingNewCharacterName: null,
    lastRollSkillKey: null,
    activeMenu: "character",
    checkedSelfModifiers: new Set(),
    checkedApprovedModifierIds: new Set(),
    approvedModifierEntries: [],
    lastStatusTimeout: null,
    leftPanelCollapsed: false,
    pendingCustomTokenName: "",
    characterAutoSaveTimer: null,
    mapAutoSaveTimer: null,
    paintDrag: {
      active: false,
      paintedCells: new Set(),
    },
    tool: {
      active: "distance",
      distanceMode: "taxicab",
      drawingColor: "#f3c56e",
      dragging: false,
      start: null,
      end: null,
      cellSize: 40,
      preview: null,
      selectedDrawingId: null,
      layer: "tokens",
    },
    suppressCellClickUntil: 0,
    mapView: {
      scale: 1,
      panX: 0,
      panY: 0,
      panning: false,
      startClientX: 0,
      startClientY: 0,
      startPanX: 0,
      startPanY: 0,
    },
  };

  function emit(eventName, payload) {
    socket.emit(eventName, payload || {});
  }

  function setStatus(message, isError = false) {
    const text = String(message || "");
    if (elements.mainStatus) {
      elements.mainStatus.textContent = text;
      elements.mainStatus.style.color = isError ? "#ff8a8a" : "#9fb5ac";
    }
    if (state.lastStatusTimeout) {
      clearTimeout(state.lastStatusTimeout);
      state.lastStatusTimeout = null;
    }
    if (text) {
      state.lastStatusTimeout = setTimeout(() => {
        if (elements.mainStatus) {
          elements.mainStatus.textContent = "Ready";
          elements.mainStatus.style.color = "#9fb5ac";
        }
      }, 3000);
    }
  }

  function user() {
    return state.snapshot && state.snapshot.auth ? state.snapshot.auth.user : null;
  }

  function isAuthenticated() {
    return Boolean(user());
  }

  function isDm() {
    return Boolean(
      state.snapshot &&
      state.snapshot.auth &&
      state.snapshot.auth.campaignRole === "dm"
    );
  }

  function userId() {
    return user() ? user().id : null;
  }

  function activeMap() {
    return state.snapshot && state.snapshot.scene ? state.snapshot.scene.map : null;
  }

  function characters() {
    return (state.snapshot && state.snapshot.characters) || [];
  }

  function statblocks() {
    return (state.snapshot && state.snapshot.statblocks) || [];
  }

  function connectedUsers() {
    return (state.snapshot && state.snapshot.connectedUsers) || [];
  }

  function campaigns() {
    return (state.snapshot && state.snapshot.campaigns) || [];
  }

  function activeCampaignId() {
    return state.snapshot && state.snapshot.auth ? state.snapshot.auth.campaignId : null;
  }

  function activeCampaign() {
    const id = activeCampaignId();
    if (!id) {
      return null;
    }
    return campaigns().find((campaign) => campaign.id === id) || null;
  }

  function ownCharacters() {
    const me = userId();
    return characters().filter((character) => character.ownerUserId === me);
  }

  function mapOfModifierCatalog() {
    return (state.snapshot && state.snapshot.config && state.snapshot.config.modifierCatalog) || {};
  }

  function getTokenById(tokenId) {
    const map = activeMap();
    if (!map || !Array.isArray(map.tokens)) {
      return null;
    }
    return map.tokens.find((token) => token.id === tokenId) || null;
  }

  function initials(name) {
    const words = String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    if (words.length === 0) {
      return "?";
    }
    return words.map((word) => word[0].toUpperCase()).join("");
  }

  function sanitizeId(text) {
    return String(text || "").replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  function formatTimestamp(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read image file."));
      reader.readAsDataURL(file);
    });
  }

  function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not decode image."));
      image.src = dataUrl;
    });
  }

  function activeInteractionMode() {
    if (!isDm() || !elements.interactionMode) {
      return "move";
    }
    return elements.interactionMode.value || "move";
  }

  function isPaintModeActive() {
    return isDm() && activeInteractionMode() === "paint";
  }

  function isPlaceModeActive() {
    return isDm() && activeInteractionMode() === "place";
  }

  function feetPerSquare(map = activeMap()) {
    const value = Number(map && map.feetPerCell);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
    return 5;
  }

  async function normalizeMapBackgroundDataUrl(file) {
    const initial = await readFileAsDataUrl(file);
    if (initial.length <= MAX_MAP_BACKGROUND_DATA_URL_LENGTH) {
      return initial;
    }

    const image = await loadImageFromDataUrl(initial);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is unavailable for map compression.");
    }

    let width = image.naturalWidth || image.width || 1;
    let height = image.naturalHeight || image.height || 1;
    const maxDimension = 3200;
    if (width > maxDimension || height > maxDimension) {
      const scale = Math.min(maxDimension / width, maxDimension / height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }

    let attempts = 0;
    while (attempts < 7) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      for (let quality = 0.92; quality >= 0.5; quality -= 0.08) {
        const compressed = canvas.toDataURL("image/jpeg", quality);
        if (compressed.length <= MAX_MAP_BACKGROUND_DATA_URL_LENGTH) {
          return compressed;
        }
      }

      width = Math.max(800, Math.round(width * 0.85));
      height = Math.max(800, Math.round(height * 0.85));
      attempts += 1;
    }

    throw new Error("Map image is too large. Try a smaller or lower-resolution file.");
  }

  function stopPaintDrag() {
    state.paintDrag.active = false;
    state.paintDrag.paintedCells.clear();
  }

  function paintCellIfNeeded(x, y) {
    if (!isPaintModeActive()) {
      return false;
    }
    const key = `${x},${y}`;
    if (state.paintDrag.paintedCells.has(key)) {
      return false;
    }
    state.paintDrag.paintedCells.add(key);
    emit("map:paintTerrain", {
      x,
      y,
      brush: elements.terrainBrush.value,
    });
    return true;
  }

  function activeTool() {
    return state.tool.active || "distance";
  }

  function activeDistanceMode() {
    return state.tool.distanceMode || "taxicab";
  }

  function isToolInteractionEnabled() {
    return (state.activeMenu || "character") === "utilities";
  }

  function setActiveTool(toolKey) {
    const normalized =
      ["distance", "cone", "circle", "rectangle"].includes(toolKey) ? toolKey : "distance";
    state.tool.active = normalized;
    const allButtons = [
      elements.toolDistance,
      elements.toolCone,
      elements.toolCircle,
      elements.toolRectangle,
    ];
    allButtons.forEach((button) => {
      if (!button) {
        return;
      }
      button.classList.toggle("tt-tool-active", button.id === `tool-${normalized}`);
    });
    renderMeasurementOverlay();
  }

  function setDistanceMode(mode) {
    const normalized = mode === "euclidean" ? "euclidean" : "taxicab";
    state.tool.distanceMode = normalized;
    if (elements.distanceMode) {
      elements.distanceMode.value = normalized;
    }
    if (state.tool.start && state.tool.end) {
      state.tool.preview = buildPreviewFromDrag(state.tool.start, state.tool.end, state.tool.cellSize);
    }
    renderMeasurementOverlay();
  }

  function setDrawingColor(color) {
    const normalized = /^#[0-9a-f]{6}$/i.test(String(color || "")) ? color : "#f3c56e";
    state.tool.drawingColor = normalized;
    if (elements.drawingColor) {
      elements.drawingColor.value = normalized;
    }
    if (state.tool.preview) {
      state.tool.preview.color = normalized;
    }
    renderMeasurementOverlay();
  }

  function toolDistanceSquares(start, end, mode) {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    if (mode === "euclidean") {
      return Math.sqrt(dx * dx + dy * dy);
    }
    return dx + dy;
  }

  function cellCenter(cell, cellSize) {
    return {
      x: cell.x * cellSize + cellSize / 2,
      y: cell.y * cellSize + cellSize / 2,
    };
  }

  function cellFromClientPoint(clientX, clientY) {
    const map = activeMap();
    if (!map || !elements.mapGridWrap) {
      return null;
    }
    const scale = clamp(Number(state.mapView.scale) || 1, 0.45, 3.5);
    const rect = elements.mapGridWrap.getBoundingClientRect();
    const localX = (clientX - rect.left) / scale;
    const localY = (clientY - rect.top) / scale;
    const cellSize = Number(state.tool.cellSize) || 40;
    return {
      x: clamp(Math.floor(localX / cellSize), 0, Math.max(0, map.cols - 1)),
      y: clamp(Math.floor(localY / cellSize), 0, Math.max(0, map.rows - 1)),
    };
  }

  function buildPreviewFromDrag(start, end, cellSize) {
    const mode = activeDistanceMode();
    const startPx = cellCenter(start, cellSize);
    const endPx = cellCenter(end, cellSize);
    const squaresByMode = toolDistanceSquares(start, end, mode);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const geometricSquares = Math.sqrt(dx * dx + dy * dy);
    const geometricFeet = geometricSquares * feetPerSquare(activeMap());
    const tool = activeTool();

    if (tool === "circle") {
      const radius = Math.sqrt((endPx.x - startPx.x) ** 2 + (endPx.y - startPx.y) ** 2);
      return {
        type: "circle",
        color: state.tool.drawingColor,
        data: { cx: startPx.x, cy: startPx.y, radius, start, end },
        label: `${geometricFeet.toFixed(1)} ft radius`,
      };
    }

    if (tool === "rectangle") {
      const x = Math.min(start.x, end.x) * cellSize;
      const y = Math.min(start.y, end.y) * cellSize;
      const width = (Math.abs(end.x - start.x) + 1) * cellSize;
      const height = (Math.abs(end.y - start.y) + 1) * cellSize;
      return {
        type: "rectangle",
        color: state.tool.drawingColor,
        data: { x, y, width, height, start, end },
        label: `${((Math.abs(end.x - start.x) + 1) * feetPerSquare(activeMap())).toFixed(1)} ft x ${(
          (Math.abs(end.y - start.y) + 1) *
          feetPerSquare(activeMap())
        ).toFixed(1)} ft`,
      };
    }

    if (tool === "cone") {
      const dx = endPx.x - startPx.x;
      const dy = endPx.y - startPx.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const safeDistance = distance <= 0 ? 0.001 : distance;
      const ux = dx / safeDistance;
      const uy = dy / safeDistance;
      const px = -uy;
      const py = ux;
      const halfWidth = distance / 2;
      const p1 = { x: endPx.x + px * halfWidth, y: endPx.y + py * halfWidth };
      const p2 = { x: endPx.x - px * halfWidth, y: endPx.y - py * halfWidth };
      return {
        type: "cone",
        color: state.tool.drawingColor,
        data: {
          x1: startPx.x,
          y1: startPx.y,
          x2: p1.x,
          y2: p1.y,
          x3: p2.x,
          y3: p2.y,
          start,
          end,
        },
        label: `${geometricFeet.toFixed(1)} ft cone`,
      };
    }

    const feet = squaresByMode * feetPerSquare(activeMap());
    return {
      type: "distance",
      color: state.tool.drawingColor,
      data: { x1: startPx.x, y1: startPx.y, x2: endPx.x, y2: endPx.y, start, end, mode },
      label: `${feet.toFixed(1)} ft`,
      squares: squaresByMode,
      feet,
    };
  }

  function beginMeasureDrag(x, y, cellSize) {
    state.tool.dragging = true;
    state.tool.start = { x, y };
    state.tool.end = { x, y };
    state.tool.cellSize = cellSize;
    state.tool.preview = buildPreviewFromDrag(state.tool.start, state.tool.end, cellSize);
    state.suppressCellClickUntil = Date.now() + 250;
  }

  function updateMeasureDrag(x, y, cellSize) {
    if (!state.tool.dragging) {
      return;
    }
    state.tool.end = { x, y };
    state.tool.cellSize = cellSize;
    state.tool.preview = buildPreviewFromDrag(state.tool.start, state.tool.end, cellSize);
    renderMeasurementOverlay();
  }

  function endMeasureDrag() {
    if (!state.tool.dragging) {
      return;
    }
    state.tool.dragging = false;
    renderMeasurementOverlay();
  }

  function clearMeasurementOverlay() {
    if (elements.mapPreviewLayer) {
      elements.mapPreviewLayer.innerHTML = "";
    }
    if (elements.mapMeasureLabel) {
      elements.mapMeasureLabel.classList.add("tt-hidden");
    }
    if (elements.measureReadout) {
      elements.measureReadout.textContent = "Distance: -";
    }
  }

  function clearToolPreview() {
    state.tool.dragging = false;
    state.tool.start = null;
    state.tool.end = null;
    state.tool.preview = null;
  }

  function commitPreviewDrawing() {
    if (!state.tool.preview || !isAuthenticated()) {
      return false;
    }
    emit("map:addDrawing", {
      type: state.tool.preview.type,
      color: state.tool.preview.color || state.tool.drawingColor,
      layer: state.tool.layer || "tokens",
      data: state.tool.preview.data || {},
    });
    clearToolPreview();
    setStatus("Drawing saved.");
    renderMeasurementOverlay();
    return true;
  }

  function createSvgElement(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  function drawingCanBeDeleted(drawing) {
    return Boolean(drawing && (isDm() || drawing.ownerUserId === userId()));
  }

  function renderShapeInLayer(layer, drawing, isPreview = false) {
    if (!layer || !drawing || !drawing.data) {
      return;
    }
    const color = drawing.color || "#f3c56e";
    let shape = null;

    if (drawing.type === "distance") {
      shape = createSvgElement("line");
      shape.setAttribute("x1", String(drawing.data.x1 || 0));
      shape.setAttribute("y1", String(drawing.data.y1 || 0));
      shape.setAttribute("x2", String(drawing.data.x2 || 0));
      shape.setAttribute("y2", String(drawing.data.y2 || 0));
      shape.setAttribute("fill", "none");
    } else if (drawing.type === "circle") {
      shape = createSvgElement("circle");
      shape.setAttribute("cx", String(drawing.data.cx || 0));
      shape.setAttribute("cy", String(drawing.data.cy || 0));
      shape.setAttribute("r", String(Math.max(1, Number(drawing.data.radius) || 0)));
    } else if (drawing.type === "rectangle") {
      shape = createSvgElement("rect");
      shape.setAttribute("x", String(drawing.data.x || 0));
      shape.setAttribute("y", String(drawing.data.y || 0));
      shape.setAttribute("width", String(Math.max(1, Number(drawing.data.width) || 0)));
      shape.setAttribute("height", String(Math.max(1, Number(drawing.data.height) || 0)));
    } else if (drawing.type === "cone") {
      shape = createSvgElement("polygon");
      shape.setAttribute(
        "points",
        `${drawing.data.x1 || 0},${drawing.data.y1 || 0} ${drawing.data.x2 || 0},${drawing.data.y2 || 0} ${
          drawing.data.x3 || 0
        },${drawing.data.y3 || 0}`
      );
    }

    if (!shape) {
      return;
    }

    shape.classList.add("tt-drawing-shape");
    if (!isPreview && drawing.id && drawing.id === state.tool.selectedDrawingId) {
      shape.classList.add("tt-drawing-selected");
    }
    shape.style.stroke = color;
    shape.style.fill = drawing.type === "distance" ? "none" : "";
    if (drawing.layer === "gm") {
      shape.style.opacity = "0.62";
    }
    if (!isPreview) {
      shape.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        state.tool.selectedDrawingId = drawing.id || null;
        renderMeasurementOverlay();
      });
      shape.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        state.tool.selectedDrawingId = drawing.id || null;
        renderMeasurementOverlay();
      });
      shape.title = drawingCanBeDeleted(drawing)
        ? "Select then press Delete/Backspace to remove."
        : "Drawing";
    }
    layer.appendChild(shape);
  }

  function renderMeasurementOverlay() {
    const map = activeMap();
    if (!map) {
      clearMeasurementOverlay();
      return;
    }
    if (elements.mapDrawingsLayer) {
      elements.mapDrawingsLayer.innerHTML = "";
      (Array.isArray(map.drawings) ? map.drawings : [])
        .filter((drawing) => isDm() || drawing.layer !== "gm")
        .forEach((drawing) => {
          renderShapeInLayer(elements.mapDrawingsLayer, drawing, false);
        });
    }

    if (!state.tool.preview) {
      if (elements.mapPreviewLayer) {
        elements.mapPreviewLayer.innerHTML = "";
      }
      if (elements.mapMeasureLabel) {
        elements.mapMeasureLabel.classList.add("tt-hidden");
      }
      if (elements.measureReadout) {
        const selectedLabel = state.tool.selectedDrawingId ? " | Drawing selected" : "";
        elements.measureReadout.textContent = `Tool: ${activeTool()} (${activeDistanceMode()})${selectedLabel}`;
      }
      return;
    }

    if (elements.mapPreviewLayer) {
      elements.mapPreviewLayer.innerHTML = "";
      renderShapeInLayer(elements.mapPreviewLayer, state.tool.preview, true);
    }

    if (elements.mapMeasureLabel) {
      const labelData = state.tool.preview.data || {};
      const lx = Number(labelData.x2 || labelData.cx || labelData.x || labelData.x1 || 0);
      const ly = Number(labelData.y2 || labelData.cy || labelData.y || labelData.y1 || 0);
      elements.mapMeasureLabel.style.left = `${lx}px`;
      elements.mapMeasureLabel.style.top = `${ly}px`;
      elements.mapMeasureLabel.textContent = state.tool.preview.label || "-";
      elements.mapMeasureLabel.classList.remove("tt-hidden");
    }
    if (elements.measureReadout) {
      elements.measureReadout.textContent =
        `${activeTool()} preview: ${state.tool.preview.label || "-"} | Right-click to save`;
    }
  }

  function mapPixelSize() {
    const map = activeMap();
    if (!map) {
      return { width: 0, height: 0 };
    }
    const cellSize = Number(state.tool.cellSize) || 40;
    return {
      width: map.cols * cellSize,
      height: map.rows * cellSize,
    };
  }

  function clampMapPan(panX, panY, scale) {
    if (!elements.boardWrap) {
      return { x: panX, y: panY };
    }
    const { width, height } = mapPixelSize();
    if (width <= 0 || height <= 0) {
      return { x: 0, y: 0 };
    }

    const viewportRect = elements.boardWrap.getBoundingClientRect();
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    let minX = Math.min(0, viewportRect.width - scaledWidth);
    let minY = Math.min(0, viewportRect.height - scaledHeight);
    let maxX = 0;
    let maxY = 0;

    if (scaledWidth < viewportRect.width) {
      const centeredX = (viewportRect.width - scaledWidth) / 2;
      minX = centeredX;
      maxX = centeredX;
    }
    if (scaledHeight < viewportRect.height) {
      const centeredY = (viewportRect.height - scaledHeight) / 2;
      minY = centeredY;
      maxY = centeredY;
    }

    return {
      x: clamp(panX, minX, maxX),
      y: clamp(panY, minY, maxY),
    };
  }

  function applyMapViewTransform() {
    if (!elements.mapGridWrap) {
      return;
    }
    const map = activeMap();
    if (!map) {
      elements.mapGridWrap.style.transform = "none";
      return;
    }
    const safeScale = clamp(Number(state.mapView.scale) || 1, 0.45, 3.5);
    const clamped = clampMapPan(state.mapView.panX, state.mapView.panY, safeScale);
    state.mapView.scale = safeScale;
    state.mapView.panX = clamped.x;
    state.mapView.panY = clamped.y;
    elements.mapGridWrap.style.transform = `translate(${clamped.x}px, ${clamped.y}px) scale(${safeScale})`;
  }

  function startMapPan(event) {
    if (!activeMap() || !elements.boardWrap) {
      return;
    }
    state.mapView.panning = true;
    state.mapView.startClientX = event.clientX;
    state.mapView.startClientY = event.clientY;
    state.mapView.startPanX = state.mapView.panX;
    state.mapView.startPanY = state.mapView.panY;
    elements.boardWrap.classList.add("tt-panning");
  }

  function continueMapPan(event) {
    if (!state.mapView.panning) {
      return;
    }
    const dx = event.clientX - state.mapView.startClientX;
    const dy = event.clientY - state.mapView.startClientY;
    state.mapView.panX = state.mapView.startPanX + dx;
    state.mapView.panY = state.mapView.startPanY + dy;
    applyMapViewTransform();
  }

  function stopMapPan() {
    if (!state.mapView.panning) {
      return;
    }
    state.mapView.panning = false;
    if (elements.boardWrap) {
      elements.boardWrap.classList.remove("tt-panning");
    }
  }

  function zoomMapAtClientPoint(clientX, clientY, deltaY) {
    if (!activeMap() || !elements.boardWrap) {
      return;
    }
    const rect = elements.boardWrap.getBoundingClientRect();
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;
    const oldScale = clamp(Number(state.mapView.scale) || 1, 0.45, 3.5);
    const factor = deltaY < 0 ? 1.12 : 0.89;
    const newScale = clamp(oldScale * factor, 0.45, 3.5);
    if (Math.abs(newScale - oldScale) < 0.001) {
      return;
    }

    const worldX = (pointerX - state.mapView.panX) / oldScale;
    const worldY = (pointerY - state.mapView.panY) / oldScale;
    state.mapView.scale = newScale;
    state.mapView.panX = pointerX - worldX * newScale;
    state.mapView.panY = pointerY - worldY * newScale;
    applyMapViewTransform();
  }

  function resetCharacterForm() {
    elements.characterId.value = "";
    elements.characterName.value = "";
    elements.characterName.readOnly = true;
    elements.characterSheetUrl.value = "";
    elements.characterFeatsText.value = "";
    elements.characterTokenImage.value = "";
    if (elements.characterTokenFile) {
      elements.characterTokenFile.value = "";
    }
    elements.characterSpeed.value = "";
    elements.characterMaxHp.value = "";
    elements.characterStrengthMod.value = "";
    elements.characterIsdc.value = "";
    renderCharacterPanels(null);
  }

  function selectedCharacterForEditing() {
    const list = isDm() ? characters() : ownCharacters();
    const selectedId = elements.characterId.value || state.selectedCharacterId || "";
    if (!selectedId) {
      return null;
    }
    return list.find((entry) => entry.id === selectedId) || null;
  }

  function characterSavePayload() {
    const characterId = elements.characterId.value || state.selectedCharacterId || undefined;
    return {
      id: characterId || undefined,
      name: elements.characterName.value,
      sheetUrl: elements.characterSheetUrl.value,
      featsText: elements.characterFeatsText.value,
      tokenImage: elements.characterTokenImage.value,
      speedOverride: elements.characterSpeed.value,
      maxHpOverride: elements.characterMaxHp.value,
      strengthModifier: elements.characterStrengthMod.value,
      italicizedSkillDc: elements.characterIsdc.value,
    };
  }

  function saveCharacterNow() {
    if (!isAuthenticated()) {
      return;
    }
    const selected = selectedCharacterForEditing();
    const payload = characterSavePayload();
    if (!payload.id || !selected) {
      return;
    }
    const wantedName = String(payload.name || "").trim();
    if (!wantedName) {
      elements.characterName.value = selected.name || "";
      setStatus("Character name cannot be empty.", true);
      return;
    }
    if (hasNameCollision(characters(), wantedName, selected.id)) {
      elements.characterName.value = selected.name || "";
      setStatus("Character name already exists in this campaign.", true);
      return;
    }
    payload.name = wantedName;
    emit("character:save", payload);
  }

  function scheduleCharacterAutosave() {
    if (state.characterAutoSaveTimer) {
      clearTimeout(state.characterAutoSaveTimer);
      state.characterAutoSaveTimer = null;
    }
    state.characterAutoSaveTimer = setTimeout(() => {
      state.characterAutoSaveTimer = null;
      saveCharacterNow();
    }, 420);
  }

  function updateMapOpacityLabel() {
    if (!elements.mapGmOpacity || !elements.mapGmOpacityValue) {
      return;
    }
    const opacity = clamp(Number(elements.mapGmOpacity.value) || 0.55, 0.1, 1);
    elements.mapGmOpacityValue.textContent = `${Math.round(opacity * 100)}%`;
  }

  function saveMapNow({ includeName = false } = {}) {
    if (!isDm()) {
      return;
    }
    const map = activeMap();
    if (!map) {
      return;
    }
    const rows = clamp(Number.parseInt(elements.mapRows && elements.mapRows.value, 10) || map.rows || 20, 5, 80);
    const cols = clamp(Number.parseInt(elements.mapCols && elements.mapCols.value, 10) || map.cols || 30, 5, 80);
    const feetPerCell = clamp(Number.parseFloat(elements.mapGridFeet && elements.mapGridFeet.value) || feetPerSquare(map), 1, 200);
    const gmTokenOpacity = clamp(Number.parseFloat(elements.mapGmOpacity && elements.mapGmOpacity.value) || 0.55, 0.1, 1);
    if (elements.mapRows) {
      elements.mapRows.value = String(rows);
    }
    if (elements.mapCols) {
      elements.mapCols.value = String(cols);
    }
    if (elements.mapGridFeet) {
      elements.mapGridFeet.value = String(feetPerCell);
    }
    if (elements.mapGmOpacity) {
      elements.mapGmOpacity.value = String(gmTokenOpacity);
    }
    updateMapOpacityLabel();

    const payload = {
      id: map.id,
      rows,
      cols,
      feetPerCell,
      gmTokenOpacity,
    };

    if (includeName && elements.mapName) {
      const wantedName = String(elements.mapName.value || "").trim();
      if (!wantedName) {
        elements.mapName.value = map.name || "";
        setStatus("Map name cannot be empty.", true);
        return;
      }
      if (hasNameCollision((state.snapshot && state.snapshot.maps) || [], wantedName, map.id)) {
        elements.mapName.value = map.name || "";
        setStatus("Map name already exists in this campaign.", true);
        return;
      }
      payload.name = wantedName;
    }
    emit("map:update", payload);
  }

  function scheduleMapAutosave() {
    if (state.mapAutoSaveTimer) {
      clearTimeout(state.mapAutoSaveTimer);
      state.mapAutoSaveTimer = null;
    }
    state.mapAutoSaveTimer = setTimeout(() => {
      state.mapAutoSaveTimer = null;
      saveMapNow({ includeName: false });
    }, 380);
  }

  function normalizeLabel(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function numericInputValue(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? String(parsed) : "";
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatStatKey(key) {
    return String(key || "")
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatStatValue(value) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    return String(value);
  }

  function renderStatGrid(container, pairs) {
    if (!container) {
      return;
    }
    container.innerHTML = "";
    pairs.forEach((pair) => {
      const item = document.createElement("div");
      item.className = "tt-stat-item";

      const key = document.createElement("div");
      key.className = "tt-stat-key";
      key.textContent = formatStatKey(pair.key);
      item.appendChild(key);

      const value = document.createElement("div");
      value.className = "tt-stat-value";
      value.textContent = formatStatValue(pair.value);
      item.appendChild(value);

      container.appendChild(item);
    });
  }

  function renderCharacterPanels(character) {
    const badge = elements.characterTokenBadge;
    const label = elements.characterTokenLabel;
    if (badge) {
      badge.innerHTML = "";
      if (character && character.tokenImage) {
        const image = document.createElement("img");
        image.src = character.tokenImage;
        image.alt = character.name || "Token";
        badge.appendChild(image);
      } else {
        badge.textContent = character ? initials(character.name) : "?";
      }
    }
    if (label) {
      label.textContent = character ? `${character.name} token` : "No token selected";
    }

    const parsed = (character && character.parsedSheet) || {};
    const currentValues = parsed.currentValues && typeof parsed.currentValues === "object"
      ? parsed.currentValues
      : {};
    const lookup = new Map(
      Object.keys(currentValues).map((key) => [normalizeLabel(key), currentValues[key]])
    );
    const statValue = (primary, fallback = "") => {
      if (lookup.has(primary)) {
        return lookup.get(primary);
      }
      if (fallback && lookup.has(fallback)) {
        return lookup.get(fallback);
      }
      return "";
    };

    const summaryPairs = [
      { key: "Level", value: statValue("level") },
      { key: "Current HP", value: statValue("current hp", "hp") },
      { key: "Current Mana", value: statValue("current mana", "mana") },
      { key: "Humility", value: statValue("humility") },
      { key: "DR", value: statValue("dr") },
      { key: "AC", value: statValue("ac") },
      { key: "Speed", value: statValue("speed") || parsed.speed },
    ];
    renderStatGrid(elements.characterStatsSummary, summaryPairs);

    const detailPairs = [
      { key: "Max HP", value: parsed.maxHp },
      { key: "Strength Mod", value: parsed.strengthModifier },
      { key: "ISDC", value: parsed.italicizedSkillDc },
    ];
    const shownDetailKeys = new Set([
      ...detailPairs.map((entry) => normalizeLabel(entry.key)),
      "current hp",
      "hp",
      "current mana",
      "mana",
      "level",
      "humility",
      "dr",
      "ac",
      "speed",
    ]);
    Object.keys(currentValues)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        const normalized = normalizeLabel(key);
        if (shownDetailKeys.has(normalized)) {
          return;
        }
        detailPairs.push({
          key: formatStatKey(normalized),
          value: currentValues[key],
        });
      });
    renderStatGrid(elements.characterStatsDetailGrid, detailPairs);
  }

  function fillCharacterForm(character) {
    if (!character) {
      resetCharacterForm();
      return;
    }
    elements.characterId.value = character.id || "";
    elements.characterName.value = character.name || "";
    elements.characterName.readOnly = true;
    elements.characterSheetUrl.value = character.sheetUrl || "";
    elements.characterTokenImage.value = character.tokenImage || "";
    if (elements.characterTokenFile) {
      elements.characterTokenFile.value = "";
    }
    const parsed = character.parsedSheet || {};
    elements.characterFeatsText.value = Array.isArray(parsed.feats) ? parsed.feats.join("\n") : "";
    elements.characterSpeed.value = numericInputValue(parsed.speed);
    elements.characterMaxHp.value = numericInputValue(parsed.maxHp);
    elements.characterStrengthMod.value = numericInputValue(parsed.strengthModifier);
    elements.characterIsdc.value = numericInputValue(parsed.italicizedSkillDc);
    state.selectedCharacterId = character.id || null;
    if (elements.characterSelect) {
      elements.characterSelect.value = character.id || "";
    }
    renderCharacterPanels(character);
    const rollValue = character && character.id ? `character:${character.id}` : "";
    if (
      rollValue &&
      Array.from(elements.rollEntitySelect.options).some((option) => option.value === rollValue)
    ) {
      elements.rollEntitySelect.value = rollValue;
      state.checkedSelfModifiers.clear();
      state.checkedApprovedModifierIds.clear();
      state.lastRollSkillKey = null;
      renderRollSkillOptions();
      renderRollModifiers();
    }
  }

  function selectCharacterById(characterId, availableCharacters, shouldPopulate = true) {
    const list = Array.isArray(availableCharacters) ? availableCharacters : isDm() ? characters() : ownCharacters();
    const found = list.find((character) => character.id === characterId) || null;
    state.selectedCharacterId = found ? found.id : null;
    if (elements.characterSelect) {
      elements.characterSelect.value = found ? found.id : "";
    }
    if (shouldPopulate) {
      if (found) {
        fillCharacterForm(found);
      } else {
        resetCharacterForm();
      }
    }
  }

  function resetStatblockForm() {
    elements.statblockId.value = "";
    elements.statblockName.value = "";
    elements.statblockMode.value = "column";
    elements.statblockSheetUrl.value = "";
    elements.statblockSheetName.value = "Augmented beasts";
    elements.statblockColumnName.value = "";
    elements.statblockManualText.value = "";
    elements.statblockTokenImage.value = "";
    if (elements.statblockTokenFile) {
      elements.statblockTokenFile.value = "";
    }
  }

  function normalizedEntityName(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function hasNameCollision(entries, wantedName, ignoreId = null) {
    const wanted = normalizedEntityName(wantedName);
    if (!wanted) {
      return false;
    }
    return (Array.isArray(entries) ? entries : []).some((entry) => {
      if (!entry || (ignoreId && entry.id === ignoreId)) {
        return false;
      }
      return normalizedEntityName(entry.name) === wanted;
    });
  }

  function nextUniqueName(entries, prefix) {
    let index = 1;
    while (index < 5000) {
      const wanted = `${prefix} ${index}`;
      if (!hasNameCollision(entries, wanted)) {
        return wanted;
      }
      index += 1;
    }
    return `${prefix} ${Date.now()}`;
  }

  function updateRootLayoutClasses() {
    if (!elements.root) {
      return;
    }
    elements.root.classList.toggle("tt-left-collapsed", state.leftPanelCollapsed);
    const rightCollapsed = Boolean(elements.logPanel && elements.logPanel.classList.contains("minimized"));
    elements.root.classList.toggle("tt-right-collapsed", rightCollapsed);
  }

  function setLeftPanelCollapsed(collapsed, persist = true) {
    state.leftPanelCollapsed = Boolean(collapsed);
    if (state.leftPanelCollapsed && state.activeMenu === "battlemaps") {
      resetMapInteractionMode();
    }
    if (persist) {
      localStorage.setItem(STORAGE_LEFT_MIN_KEY, state.leftPanelCollapsed ? "1" : "0");
    }
    if (elements.menuToggle) {
      elements.menuToggle.classList.toggle("active", state.leftPanelCollapsed);
    }
    updateRootLayoutClasses();
  }

  function resetMapInteractionMode() {
    if (!elements.interactionMode) {
      return;
    }
    elements.interactionMode.value = "move";
    stopPaintDrag();
    state.selectedPlacement = null;
    updateInteractionModeUi();
    renderTokenRoster();
  }

  function renderAuth() {
    const current = user();
    if (current) {
      const campaign = activeCampaign();
      const roleLabel = isDm() ? "DM" : "Player";
      elements.authStatus.textContent = campaign
        ? `${current.username} | ${campaign.name} (${roleLabel})`
        : `${current.username} | No campaign`;
      elements.authForms.classList.add("tt-hidden");
      elements.logoutButton.classList.remove("tt-hidden");
    } else {
      elements.authStatus.textContent = "Not logged in";
      elements.authForms.classList.remove("tt-hidden");
      elements.logoutButton.classList.add("tt-hidden");
      if (state.activeMenu !== "account") {
        state.activeMenu = "account";
      }
    }
  }

  function railButtonsByPanel() {
    return [
      { panel: "account", button: elements.railAccount },
      { panel: "campaigns", button: elements.railCampaigns },
      { panel: "character", button: elements.railCharacter },
      { panel: "battlemaps", button: elements.railBattlemaps },
      { panel: "rolls", button: elements.railRolls },
      { panel: "combat", button: elements.railCombat },
      { panel: "utilities", button: elements.railUtilities },
    ];
  }

  function showLogPanel(expand = true) {
    if (!elements.logPanel || !elements.logToggle) {
      return;
    }
    if (expand) {
      elements.logPanel.classList.remove("minimized");
      elements.logToggle.textContent = "Minimize";
      localStorage.setItem(STORAGE_LOG_MIN_KEY, "0");
    } else {
      elements.logPanel.classList.add("minimized");
      elements.logToggle.textContent = "Open";
      localStorage.setItem(STORAGE_LOG_MIN_KEY, "1");
    }
    updateRootLayoutClasses();
  }

  function setActiveMenu(menuKey) {
    const previousPanel = state.activeMenu;
    state.activeMenu = menuKey;
    if (previousPanel === "battlemaps" && menuKey !== "battlemaps") {
      resetMapInteractionMode();
    }
    applyMenuVisibility();
  }

  function applyMenuVisibility() {
    let panel = state.activeMenu || "character";
    if (panel === "battlemaps" && !isDm()) {
      resetMapInteractionMode();
      panel = "character";
      state.activeMenu = panel;
    }
    if (!isAuthenticated() && panel !== "account") {
      if (panel === "battlemaps") {
        resetMapInteractionMode();
      }
      panel = "account";
      state.activeMenu = panel;
    }
    const panelElements = document.querySelectorAll("[data-menu-panel]");
    panelElements.forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      const target = node.getAttribute("data-menu-panel");
      const shouldShow = target === panel;
      node.classList.toggle("tt-menu-hidden", !shouldShow);
    });

    railButtonsByPanel().forEach((entry) => {
      if (!entry.button) {
        return;
      }
      if (entry.panel === "battlemaps") {
        entry.button.classList.toggle("tt-hidden", !isDm());
      }
      entry.button.classList.toggle("active", panel === entry.panel);
    });
    updateRootLayoutClasses();
  }

  function renderCampaigns() {
    if (!elements.campaignCard || !elements.campaignList) {
      return;
    }
    const loggedIn = isAuthenticated();
    elements.campaignCard.classList.toggle("tt-hidden", !loggedIn);
    if (!loggedIn) {
      elements.campaignList.innerHTML = "";
      return;
    }

    const activeId = activeCampaignId();
    elements.campaignList.innerHTML = "";
    campaigns().forEach((campaign) => {
      const row = document.createElement("div");
      row.className = "tt-list-item";

      const left = document.createElement("div");
      left.textContent = campaign.isDm ? `${campaign.name} (DM)` : campaign.name;
      row.appendChild(left);

      const controls = document.createElement("div");
      controls.className = "tt-grid2";
      controls.style.minWidth = campaign.isDm ? "114px" : "70px";

      if (campaign.isDm) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "\u{1F5D1}";
        remove.title = "Delete Campaign";
        remove.addEventListener("click", () => {
          if (!window.confirm(`Delete campaign ${campaign.name}?`)) {
            return;
          }
          emit("campaign:delete", { campaignId: campaign.id });
        });
        controls.appendChild(remove);
      }

      const open = document.createElement("button");
      open.type = "button";
      open.textContent = campaign.id === activeId ? "Open" : "Join";
      open.disabled = campaign.id === activeId;
      open.addEventListener("click", () => {
        emit("campaign:join", { campaignId: campaign.id });
      });
      controls.appendChild(open);
      row.appendChild(controls);

      elements.campaignList.appendChild(row);
    });
  }

  function renderCharacters() {
    const canSeeAll = isDm();
    const list = canSeeAll ? characters() : ownCharacters();

    elements.characterCard.classList.toggle("tt-hidden", !isAuthenticated());
    if (!elements.characterSelect) {
      return;
    }

    const previousSelectedId = state.selectedCharacterId;
    let selectedId = "";

    elements.characterSelect.innerHTML = "";

    list.forEach((character) => {
      const option = document.createElement("option");
      option.value = character.id;
      option.textContent = character.name || "Unnamed Character";
      elements.characterSelect.appendChild(option);
    });

    if (state.pendingNewCharacterName) {
      const pendingMatches = list
        .filter((character) => normalizedEntityName(character.name) === state.pendingNewCharacterName)
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      if (pendingMatches.length > 0) {
        selectedId = pendingMatches[0].id;
        state.pendingNewCharacterName = null;
      }
    }

    if (!selectedId && previousSelectedId && list.some((character) => character.id === previousSelectedId)) {
      selectedId = previousSelectedId;
    } else if (
      !selectedId &&
      elements.characterId.value &&
      list.some((character) => character.id === elements.characterId.value)
    ) {
      selectedId = elements.characterId.value;
    } else if (!selectedId && list.length > 0) {
      selectedId = list[0].id;
    }

    if (selectedId) {
      elements.characterSelect.value = selectedId;
    }
    state.selectedCharacterId = selectedId || null;
    const selectedCharacter = list.find((character) => character.id === selectedId) || null;
    if (selectedCharacter) {
      const focused = document.activeElement;
      const editingCurrent =
        focused instanceof HTMLElement &&
        elements.characterForm &&
        elements.characterForm.contains(focused) &&
        elements.characterId.value === selectedCharacter.id;
      if (editingCurrent) {
        renderCharacterPanels(selectedCharacter);
      } else {
        fillCharacterForm(selectedCharacter);
      }
    } else {
      resetCharacterForm();
    }
    if (elements.characterDeleteButton) {
      elements.characterDeleteButton.disabled = !selectedCharacter;
    }
  }

  function renderStatblocks() {
    elements.statblockCard.classList.toggle("tt-hidden", !isDm());
    if (!isDm()) {
      return;
    }

    elements.statblockList.innerHTML = "";
    statblocks().forEach((statblock) => {
      const item = document.createElement("div");
      item.className = "tt-list-item";

      const left = document.createElement("div");
      left.textContent = statblock.name;
      item.appendChild(left);

      const controls = document.createElement("div");
      controls.className = "tt-grid2";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => {
        elements.statblockId.value = statblock.id;
        elements.statblockName.value = statblock.name || "";
        elements.statblockMode.value = statblock.mode || "column";
        elements.statblockSheetUrl.value = statblock.sheetUrl || "";
        elements.statblockSheetName.value = statblock.sheetName || "Augmented beasts";
        elements.statblockColumnName.value = statblock.columnName || "";
        elements.statblockManualText.value = statblock.manualText || "";
        elements.statblockTokenImage.value = statblock.tokenImage || "";
        if (elements.statblockTokenFile) {
          elements.statblockTokenFile.value = "";
        }
      });
      controls.appendChild(editButton);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        if (!window.confirm(`Delete ${statblock.name}?`)) {
          return;
        }
        emit("statblock:delete", { id: statblock.id });
      });
      controls.appendChild(deleteButton);

      item.appendChild(controls);

      if (statblock.sheetError) {
        const errorEl = document.createElement("div");
        errorEl.textContent = `Sheet parse warning: ${statblock.sheetError}`;
        errorEl.style.color = "#ff9a9a";
        errorEl.style.fontSize = "0.7rem";
        item.appendChild(errorEl);
      }

      elements.statblockList.appendChild(item);
    });
  }

  function renderMaps() {
    const show = isDm();
    elements.mapCard.classList.toggle("tt-hidden", !show);
    if (elements.drawingLayerRow) {
      elements.drawingLayerRow.classList.toggle("tt-hidden", !show);
    }
    if (!show) {
      updateInteractionModeUi();
      return;
    }

    const maps = (state.snapshot && state.snapshot.maps) || [];
    const activeMapId = state.snapshot && state.snapshot.scene ? state.snapshot.scene.activeMapId : null;

    const previousValue = elements.mapSelect.value;
    elements.mapSelect.innerHTML = "";
    maps.forEach((map) => {
      const option = document.createElement("option");
      option.value = map.id;
      option.textContent = `${map.name} (${map.cols}x${map.rows})`;
      elements.mapSelect.appendChild(option);
    });

    if (activeMapId && maps.some((map) => map.id === activeMapId)) {
      elements.mapSelect.value = activeMapId;
    } else if (maps.some((map) => map.id === previousValue)) {
      elements.mapSelect.value = previousValue;
    }

    const map = activeMap();
    if (map) {
      if (elements.mapName && document.activeElement !== elements.mapName) {
        elements.mapName.value = map.name || "";
        elements.mapName.readOnly = true;
      }
      if (elements.mapRows && document.activeElement !== elements.mapRows) {
        elements.mapRows.value = String(map.rows || 20);
      }
      if (elements.mapCols && document.activeElement !== elements.mapCols) {
        elements.mapCols.value = String(map.cols || 30);
      }
      if (elements.mapGridFeet && document.activeElement !== elements.mapGridFeet) {
        elements.mapGridFeet.value = String(feetPerSquare(map));
      }
      if (elements.mapGmOpacity && document.activeElement !== elements.mapGmOpacity) {
        const opacity = clamp(Number(map.gmTokenOpacity) || 0.55, 0.1, 1);
        elements.mapGmOpacity.value = String(opacity);
      }
      if (elements.mapGmOpacityValue && elements.mapGmOpacity) {
        elements.mapGmOpacityValue.textContent = `${Math.round((Number(elements.mapGmOpacity.value) || 0.55) * 100)}%`;
      }
    } else {
      if (elements.mapName) {
        elements.mapName.value = "";
      }
      if (elements.mapRows) {
        elements.mapRows.value = "";
      }
      if (elements.mapCols) {
        elements.mapCols.value = "";
      }
      if (elements.mapGridFeet) {
        elements.mapGridFeet.value = "";
      }
      if (elements.mapGmOpacityValue) {
        elements.mapGmOpacityValue.textContent = "";
      }
    }
    if (elements.mapDelete) {
      elements.mapDelete.disabled = !map;
    }

    renderTokenRoster();
    renderSelectedTokenControls();
    updateInteractionModeUi();
  }

  function renderInitiativePanel() {
    if (!elements.initiativeSummary || !elements.initiativeOrderList) {
      return;
    }
    const scene = state.snapshot && state.snapshot.scene;
    const initiative = scene && scene.initiative;
    const active = Boolean(initiative && initiative.active && Array.isArray(initiative.order));

    if (elements.initiativeControls) {
      elements.initiativeControls.classList.toggle("tt-hidden", !isDm());
    }
    if (elements.initiativeStop) {
      elements.initiativeStop.classList.toggle("tt-hidden", !isDm());
    }

    if (!active || initiative.order.length === 0) {
      elements.initiativeSummary.textContent = "No active combat.";
      elements.initiativeOrderList.innerHTML = "";
      return;
    }

    const currentIndex = clamp(
      Number(initiative.currentIndex) || 0,
      0,
      Math.max(0, initiative.order.length - 1)
    );
    elements.initiativeSummary.textContent = `Round ${initiative.round} | ${initiative.order[currentIndex].name}'s turn`;

    elements.initiativeOrderList.innerHTML = "";
    initiative.order.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "tt-list-item";
      if (index === currentIndex) {
        row.style.borderColor = "#d9a441";
      }

      const left = document.createElement("span");
      left.textContent = `${index + 1}. ${entry.name}`;
      row.appendChild(left);

      if (isDm()) {
        const controls = document.createElement("div");
        controls.className = "tt-row";

        const totalInput = document.createElement("input");
        totalInput.type = "number";
        totalInput.value = String(Number(entry.total) || 0);
        totalInput.style.maxWidth = "64px";
        controls.appendChild(totalInput);

        const modInput = document.createElement("input");
        modInput.type = "number";
        modInput.value = String(Number(entry.initiativeMod) || 0);
        modInput.style.maxWidth = "64px";
        controls.appendChild(modInput);

        const apply = document.createElement("button");
        apply.type = "button";
        apply.textContent = "Save";
        apply.addEventListener("click", () => {
          emit("initiative:updateEntry", {
            tokenId: entry.tokenId,
            total: Number.parseInt(totalInput.value, 10) || 0,
            initiativeMod: Number.parseInt(modInput.value, 10) || 0,
            roll: Number(entry.roll) || 1,
          });
        });
        controls.appendChild(apply);
        row.appendChild(controls);
      } else {
        const right = document.createElement("span");
        right.className = "tt-log-meta";
        const initiativeMod = Number(entry.initiativeMod) || 0;
        right.textContent = `${entry.total} (${entry.roll}${initiativeMod >= 0 ? "+" : ""}${initiativeMod})`;
        row.appendChild(right);
      }

      elements.initiativeOrderList.appendChild(row);
    });
  }

  function updateInteractionModeUi() {
    if (!elements.mapGridWrap) {
      return;
    }
    const paintMode = isPaintModeActive();
    const placeMode = isPlaceModeActive();
    const toolMode = !paintMode && !placeMode;
    elements.mapGridWrap.classList.toggle("tt-mode-paint", paintMode);
    elements.mapGridWrap.classList.toggle("tt-mode-measure", toolMode);
    if (elements.terrainBrush) {
      elements.terrainBrush.disabled = placeMode;
      const row = elements.terrainBrush.closest(".tt-row");
      if (row) {
        row.classList.toggle("is-disabled", placeMode);
      }
    }
    if (elements.drawingLayerRow) {
      elements.drawingLayerRow.classList.toggle("tt-hidden", !isDm());
    }
    if (elements.drawingLayerSelect) {
      elements.drawingLayerSelect.disabled = !isDm();
      if (!isDm()) {
        elements.drawingLayerSelect.value = "tokens";
        state.tool.layer = "tokens";
      }
    }
  }

  function tokenLabelFromSpecial(cell) {
    if (!cell || !cell.specialType) {
      return "";
    }
    return "";
  }

  function canCurrentUserControlToken(token) {
    const me = userId();
    if (!me || !token) {
      return false;
    }
    if (isDm()) {
      return true;
    }
    if (token.sourceType === "character") {
      const character = characters().find((candidate) => candidate.id === token.sourceId);
      return Boolean(character && character.ownerUserId === me);
    }
    return token.ownerUserId === me;
  }

  function placeTokenAt(x, y, placement) {
    if (!placement) {
      return;
    }
    emit("token:place", {
      x,
      y,
      layer: elements.tokenLayerSelect.value,
      ...placement,
    });
  }

  function handleCellClick(x, y, cell) {
    if (!state.snapshot) {
      return;
    }

    if (state.tool.dragging) {
      return;
    }
    if (Date.now() < state.suppressCellClickUntil) {
      return;
    }

    if (state.tool.selectedDrawingId) {
      state.tool.selectedDrawingId = null;
      renderMeasurementOverlay();
    }

    const mode = activeInteractionMode();

    if (isDm() && mode === "paint") {
      paintCellIfNeeded(x, y);
      stopPaintDrag();
      return;
    }

    if (isDm() && mode === "place") {
      if (!state.selectedPlacement) {
        setStatus("Select a token source first.", true);
        return;
      }
      placeTokenAt(x, y, state.selectedPlacement);
      return;
    }

    if (state.selectedTokenId) {
      emit("token:move", {
        tokenId: state.selectedTokenId,
        x,
        y,
      });
      return;
    }

    if (cell && cell.blockType === "door") {
      emit("map:interactDoor", { x, y });
    }
  }

  function renderMapGrid() {
    const map = activeMap();
    elements.mapGridCells.innerHTML = "";
    elements.mapGridTokens.innerHTML = "";

    if (!map) {
      clearMeasurementOverlay();
      applyMapViewTransform();
      return;
    }

    const cellSize = window.innerWidth < 860 ? 34 : 40;
    state.tool.cellSize = cellSize;

    elements.mapGridCells.style.gridTemplateColumns = `repeat(${map.cols}, ${cellSize}px)`;
    elements.mapGridCells.style.gridTemplateRows = `repeat(${map.rows}, ${cellSize}px)`;
    elements.mapGridTokens.style.gridTemplateColumns = `repeat(${map.cols}, ${cellSize}px)`;
    elements.mapGridTokens.style.gridTemplateRows = `repeat(${map.rows}, ${cellSize}px)`;
    elements.mapGridCells.style.backgroundImage = map.background && map.background.imageDataUrl
      ? `url(${map.background.imageDataUrl})`
      : "none";
    if (elements.mapMeasureOverlay) {
      elements.mapMeasureOverlay.setAttribute("viewBox", `0 0 ${map.cols * cellSize} ${map.rows * cellSize}`);
    }
    updateInteractionModeUi();

    map.terrain.forEach((row, y) => {
      row.forEach((cell, x) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tt-cell";
        button.classList.add(`tt-terrain-${sanitizeId(cell.blockType || "empty")}`);
        if (cell.blockType === "door" && cell.doorOpen) {
          button.classList.add("tt-door-open");
        }
        if (cell.difficultType === "visible") {
          button.classList.add("tt-difficult-visible");
        }

        const label = tokenLabelFromSpecial(cell);
        if (label) {
          const special = document.createElement("div");
          special.className = "tt-special";
          special.textContent = label;
          button.appendChild(special);
        }

        button.addEventListener("mousedown", (event) => {
          if (event.button !== 0) {
            return;
          }
          if (isPaintModeActive()) {
            event.preventDefault();
            state.paintDrag.active = true;
            state.paintDrag.paintedCells.clear();
            state.suppressCellClickUntil = Date.now() + 250;
            paintCellIfNeeded(x, y);
            return;
          }
          if (!isPlaceModeActive() && isToolInteractionEnabled()) {
            event.preventDefault();
            beginMeasureDrag(x, y, cellSize);
            renderMeasurementOverlay();
          }
        });

        button.addEventListener("mouseenter", (event) => {
          if (state.tool.dragging) {
            updateMeasureDrag(x, y, cellSize);
            return;
          }
          if (state.paintDrag.active && isPaintModeActive() && (event.buttons & 1) === 1) {
            paintCellIfNeeded(x, y);
          }
        });

        button.addEventListener("click", () => handleCellClick(x, y, cell));
        if (isDm()) {
          button.addEventListener("dragover", (event) => {
            event.preventDefault();
          });
          button.addEventListener("drop", (event) => {
            event.preventDefault();
            const raw = event.dataTransfer
              ? event.dataTransfer.getData("application/x-tabletop-placement") ||
                event.dataTransfer.getData("text/plain")
              : "";
            if (!raw) {
              return;
            }
            try {
              const placement = JSON.parse(raw);
              if (!placement || !placement.sourceType || !placement.name) {
                return;
              }
              placeTokenAt(x, y, placement);
            } catch (error) {
              setStatus("Could not read dropped token.", true);
            }
          });
        }
        elements.mapGridCells.appendChild(button);
      });
    });

    map.tokens.forEach((token) => {
      const holder = document.createElement("div");
      holder.className = "tt-token-holder";
      holder.style.gridColumnStart = String(token.x + 1);
      holder.style.gridRowStart = String(token.y + 1);
      holder.style.width = `${cellSize}px`;
      holder.style.height = `${cellSize}px`;
      holder.style.position = "relative";

      const tokenEl = document.createElement("div");
      tokenEl.className = "tt-token";
      if (token.layer === "gm") {
        tokenEl.classList.add("tt-token-gm");
        tokenEl.style.setProperty(
          "--gm-token-opacity",
          String(clamp(Number(map.gmTokenOpacity) || 0.55, 0.1, 1))
        );
      }
      if (token.id === state.selectedTokenId) {
        tokenEl.classList.add("tt-token-selected");
      }

      if (token.tokenImage) {
        const image = document.createElement("img");
        image.src = token.tokenImage;
        image.alt = token.name;
        tokenEl.appendChild(image);
      } else {
        tokenEl.textContent = initials(token.name);
      }

      const nameEl = document.createElement("div");
      nameEl.className = "tt-token-name";
      nameEl.textContent = token.name;
      tokenEl.appendChild(nameEl);

      if (token.movementInfo && Number.isFinite(token.movementInfo.max)) {
        const moveEl = document.createElement("div");
        moveEl.className = "tt-move-info";
        if (token.movementInfo.overLimit) {
          moveEl.classList.add("over");
        }
        moveEl.textContent = `${token.movementInfo.spent}/${token.movementInfo.max}`;
        tokenEl.appendChild(moveEl);
      }

      tokenEl.addEventListener("click", (event) => {
        if ((isToolInteractionEnabled() && state.tool.dragging) || isPaintModeActive()) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (state.selectedTokenId === token.id) {
          state.selectedTokenId = null;
        } else {
          state.selectedTokenId = token.id;
        }
        renderSelectedTokenControls();
        renderMapGrid();
      });

      if (canCurrentUserControlToken(token)) {
        tokenEl.title = "Click to select, then click a destination tile to move.";
      } else {
        tokenEl.title = token.name;
      }

      if (isDm()) {
        holder.addEventListener("dragover", (event) => {
          event.preventDefault();
        });
        holder.addEventListener("drop", (event) => {
          event.preventDefault();
          const raw = event.dataTransfer
            ? event.dataTransfer.getData("application/x-tabletop-placement") ||
              event.dataTransfer.getData("text/plain")
            : "";
          if (!raw) {
            return;
          }
          try {
            const placement = JSON.parse(raw);
            if (!placement || !placement.sourceType || !placement.name) {
              return;
            }
            placeTokenAt(token.x, token.y, placement);
          } catch (error) {
            setStatus("Could not read dropped token.", true);
          }
        });
      }

      holder.appendChild(tokenEl);
      elements.mapGridTokens.appendChild(holder);
    });

    renderMeasurementOverlay();
    applyMapViewTransform();
  }

  function renderTokenRoster() {
    if (!isDm()) {
      elements.tokenRoster.innerHTML = "";
      return;
    }

    elements.tokenRoster.innerHTML = "";

    const allEntries = [
      ...characters().map((character) => ({
        id: character.id,
        type: "character",
        name: character.name,
        tokenImage: character.tokenImage,
      })),
      ...statblocks().map((statblock) => ({
        id: statblock.id,
        type: "statblock",
        name: statblock.name,
        tokenImage: statblock.tokenImage,
      })),
    ];

    const choosePlacement = (entry) => {
      state.selectedPlacement = {
        sourceType: entry.type,
        sourceId: entry.id,
        name: entry.name,
        tokenImage: entry.tokenImage || "",
      };
      elements.interactionMode.value = "place";
      updateInteractionModeUi();
      setStatus(`Selected ${entry.name} for placement.`);
      renderTokenRoster();
    };

    allEntries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "tt-list-item";
      item.draggable = true;
      item.title = "Drag onto the map to place this token.";
      item.addEventListener("dragstart", (event) => {
        const payload = JSON.stringify({
          sourceType: entry.type,
          sourceId: entry.id,
          name: entry.name,
          tokenImage: entry.tokenImage || "",
        });
        if (event.dataTransfer) {
          event.dataTransfer.setData("application/x-tabletop-placement", payload);
          event.dataTransfer.setData("text/plain", payload);
          event.dataTransfer.effectAllowed = "copy";
        }
      });

      const label = document.createElement("div");
      label.className = "tt-row";
      const tokenBubble = document.createElement("div");
      tokenBubble.className = "tt-roster-token";
      if (entry.tokenImage) {
        const image = document.createElement("img");
        image.src = entry.tokenImage;
        image.alt = entry.name;
        tokenBubble.appendChild(image);
      } else {
        tokenBubble.textContent = initials(entry.name);
      }
      label.appendChild(tokenBubble);
      const labelText = document.createElement("div");
      labelText.textContent = `${entry.name} (${entry.type})`;
      label.appendChild(labelText);
      item.appendChild(label);

      const place = document.createElement("button");
      place.type = "button";
      place.textContent = "Use";
      place.addEventListener("click", () => choosePlacement(entry));
      item.appendChild(place);

      if (
        state.selectedPlacement &&
        state.selectedPlacement.sourceType === entry.type &&
        state.selectedPlacement.sourceId === entry.id
      ) {
        item.style.borderColor = "#d9a441";
      }

      elements.tokenRoster.appendChild(item);
    });

    const customItem = document.createElement("div");
    customItem.className = "tt-list-item";
    const customLabel = document.createElement("div");
    customLabel.textContent = "Custom token";
    customItem.appendChild(customLabel);
    const customButton = document.createElement("button");
    customButton.type = "button";
    customButton.textContent = "Use";
    customButton.addEventListener("click", () => {
      const name = window.prompt("Custom token name:", state.pendingCustomTokenName || "Custom");
      if (!name) {
        return;
      }
      if (!elements.customTokenFile) {
        setStatus("Custom token file upload is unavailable.", true);
        return;
      }
      state.pendingCustomTokenName = name.trim() || "Custom";
      setStatus("Upload a token image file for the custom token.");
      elements.customTokenFile.value = "";
      elements.customTokenFile.click();
    });
    customItem.appendChild(customButton);
    customItem.title = "Use token file upload to choose a custom token image.";
    elements.tokenRoster.appendChild(customItem);
  }

  function renderSelectedTokenControls() {
    if (!isDm() || !state.selectedTokenId) {
      elements.selectedTokenControls.classList.add("tt-hidden");
      return;
    }

    const token = getTokenById(state.selectedTokenId);
    if (!token) {
      elements.selectedTokenControls.classList.add("tt-hidden");
      return;
    }

    elements.selectedTokenControls.classList.remove("tt-hidden");
  }

  const HIDDEN_SELF_MODIFIERS = new Set(["bottled_luck"]);

  const MAJOR_SKILL_ORDER = [
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
  ];

  const MINOR_SKILL_ORDER = [
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
  ];

  const SKILL_MENU_ORDER = [...MAJOR_SKILL_ORDER, ...MINOR_SKILL_ORDER];
  const MAJOR_SKILL_SET = new Set(MAJOR_SKILL_ORDER);
  const MINOR_SKILL_SET = new Set(MINOR_SKILL_ORDER);
  const ATTACK_SKILLS = new Set(["melee weapons", "ranged weapons"]);

  function skillDisplayName(skillName) {
    return String(skillName || "")
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }

  function deriveRollTypeFromSkill(skillName, rollTypeHint = "") {
    const hint = normalizeLabel(rollTypeHint);
    if (hint) {
      return hint;
    }
    const normalized = normalizeLabel(skillName);
    if (!normalized) {
      return "major_skill";
    }
    if (normalized === "prepared prayer") {
      return "prepared_prayer";
    }
    if (normalized === "beseech the gods") {
      return "beseech_the_gods";
    }
    if (normalized === "resistive willpower") {
      return "resistive_willpower";
    }
    if (ATTACK_SKILLS.has(normalized)) {
      return "attack";
    }
    if (MINOR_SKILL_SET.has(normalized)) {
      return "minor_skill";
    }
    if (MAJOR_SKILL_SET.has(normalized)) {
      return "major_skill";
    }
    return "major_skill";
  }

  function rollContextLabel(rollType) {
    const labels = {
      major_skill: "Major Skill",
      minor_skill: "Minor Skill",
      attack: "Attack",
      saving_throw: "Saving Throw",
      beseech_the_gods: "Beseech the Gods",
      prepared_prayer: "Prepared Prayer",
      constitution_check: "Constitution Check",
      resistive_willpower: "Resistive Willpower",
    };
    return labels[rollType] || rollType;
  }

  function rollContextValue() {
    return normalizeLabel(
      elements.rollTypeDisplay && elements.rollTypeDisplay.dataset
        ? elements.rollTypeDisplay.dataset.value
        : elements.rollTypeDisplay.textContent
    ) || "major_skill";
  }

  function setRollContext(rollType) {
    const normalized = normalizeLabel(rollType) || "major_skill";
    if (elements.rollTypeDisplay && elements.rollTypeDisplay.dataset) {
      elements.rollTypeDisplay.dataset.value = normalized;
    }
    elements.rollTypeDisplay.textContent = rollContextLabel(normalized);
  }

  function normalizedSkillValue() {
    return normalizeLabel(elements.rollSkillSelect ? elements.rollSkillSelect.value : "");
  }

  function getEntitySkillEntries(entity) {
    const parsed = (entity && entity.parsedSheet) || {};
    const skills = parsed.skills && typeof parsed.skills === "object" ? parsed.skills : {};
    const normalizedSkills = new Map();
    Object.keys(skills).forEach((rawKey) => {
      normalizedSkills.set(normalizeLabel(rawKey), Number(skills[rawKey]));
    });

    const hasParsedSkills = normalizedSkills.size > 0;
    const entries = [];
    SKILL_MENU_ORDER.forEach((skillName) => {
      if (hasParsedSkills && !normalizedSkills.has(skillName)) {
        return;
      }
      const rawBonus = normalizedSkills.has(skillName) ? normalizedSkills.get(skillName) : 0;
      const bonus = Number.isFinite(rawBonus) ? rawBonus : 0;
      entries.push({
        value: skillName,
        label: skillDisplayName(skillName),
        bonus,
      });
    });
    return entries;
  }

  function getSkillBonusForEntity(entity, skillName) {
    const normalized = normalizeLabel(skillName);
    if (!entity || !normalized) {
      return 0;
    }
    const parsed = entity.parsedSheet || {};
    const skills = parsed.skills && typeof parsed.skills === "object" ? parsed.skills : {};
    const exactKey = Object.keys(skills).find((key) => normalizeLabel(key) === normalized);
    if (!exactKey) {
      return 0;
    }
    const bonus = Number(skills[exactKey]);
    return Number.isFinite(bonus) ? bonus : 0;
  }

  function syncRollSkillContext(rollTypeHint = "") {
    const parsed = parseEntitySelectValue(elements.rollEntitySelect.value);
    const entity = parsed ? parsed.entity : null;
    const skillName = elements.rollSkillSelect.value;
    const rollType = deriveRollTypeFromSkill(skillName, rollTypeHint);
    setRollContext(rollType);

    const selectedKey = `${parsed ? `${parsed.type}:${parsed.id}` : "none"}:${normalizeLabel(skillName)}`;
    if (state.lastRollSkillKey !== selectedKey) {
      elements.rollSkillModifier.value = String(getSkillBonusForEntity(entity, skillName));
      state.lastRollSkillKey = selectedKey;
    }
  }

  function renderRollSkillOptions(preferredSkillName = "", preferredRollType = "") {
    const parsed = parseEntitySelectValue(elements.rollEntitySelect.value);
    const entity = parsed ? parsed.entity : null;
    const currentValue = normalizeLabel(elements.rollSkillSelect.value);
    const desiredValue = normalizeLabel(preferredSkillName);
    const skills = getEntitySkillEntries(entity);

    elements.rollSkillSelect.innerHTML = "";
    const majorGroup = document.createElement("optgroup");
    majorGroup.label = "Major Skills";
    const minorGroup = document.createElement("optgroup");
    minorGroup.label = "Minor Skills";

    skills.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      if (MINOR_SKILL_SET.has(entry.value)) {
        minorGroup.appendChild(option);
      } else {
        majorGroup.appendChild(option);
      }
    });

    if (majorGroup.children.length > 0) {
      elements.rollSkillSelect.appendChild(majorGroup);
    }
    if (minorGroup.children.length > 0) {
      elements.rollSkillSelect.appendChild(minorGroup);
    }

    if (desiredValue && skills.some((entry) => entry.value === desiredValue)) {
      elements.rollSkillSelect.value = desiredValue;
    } else if (currentValue && skills.some((entry) => entry.value === currentValue)) {
      elements.rollSkillSelect.value = currentValue;
    } else if (skills.length > 0) {
      elements.rollSkillSelect.value = skills[0].value;
    }

    if (desiredValue && !skills.some((entry) => entry.value === desiredValue)) {
      const option = document.createElement("option");
      option.value = desiredValue;
      option.textContent = skillDisplayName(desiredValue);
      elements.rollSkillSelect.appendChild(option);
      elements.rollSkillSelect.value = desiredValue;
    }

    syncRollSkillContext(preferredRollType);
  }

  function deriveModifiersFromEntity(entity) {
    if (!entity) {
      return [];
    }

    const catalog = mapOfModifierCatalog();
    const feats = new Set(
      ((entity.parsedSheet && entity.parsedSheet.feats) || []).map((featName) => normalizeLabel(featName))
    );
    const resolved = [];
    Object.values(catalog).forEach((modifier) => {
      if ((modifier.featNames || []).some((featName) => feats.has(normalizeLabel(featName)))) {
        resolved.push(modifier.id);
      }
    });
    return resolved;
  }

  function doesModifierApply(modifierMeta, rollType, skillName) {
    if (!modifierMeta || !Array.isArray(modifierMeta.appliesTo)) {
      return true;
    }
    const appliesTo = modifierMeta.appliesTo.map((entry) => String(entry || "").toLowerCase());
    const normalizedRollType = String(rollType || "").toLowerCase();
    const normalizedSkill = String(skillName || "").toLowerCase();

    if (appliesTo.includes("any")) {
      return true;
    }
    if (appliesTo.includes(normalizedRollType)) {
      return true;
    }
    if (appliesTo.includes(normalizedSkill)) {
      return true;
    }
    if (appliesTo.includes("any_skill") && normalizedRollType.includes("skill")) {
      return true;
    }
    if (
      appliesTo.includes("beseech_the_gods") &&
      (normalizedRollType === "beseech_the_gods" || normalizedRollType === "prepared_prayer")
    ) {
      return true;
    }
    return false;
  }

  function parseEntitySelectValue(value) {
    const raw = String(value || "");
    const separator = raw.indexOf(":");
    if (separator < 0) {
      return null;
    }
    const type = raw.slice(0, separator);
    const id = raw.slice(separator + 1);
    if (type === "character") {
      const character = characters().find((candidate) => candidate.id === id);
      if (!character) {
        return null;
      }
      return {
        type,
        id,
        entity: character,
      };
    }
    if (type === "statblock") {
      const statblock = statblocks().find((candidate) => candidate.id === id);
      if (!statblock) {
        return null;
      }
      return {
        type,
        id,
        entity: statblock,
      };
    }
    return null;
  }

  function renderRollEntityOptions() {
    const currentValue = elements.rollEntitySelect.value;
    elements.rollEntitySelect.innerHTML = "";

    const options = [];
    if (isDm()) {
      characters().forEach((character) => {
        options.push({ value: `character:${character.id}`, label: `PC: ${character.name}` });
      });
      statblocks().forEach((statblock) => {
        options.push({ value: `statblock:${statblock.id}`, label: `NPC: ${statblock.name}` });
      });
    } else {
      ownCharacters().forEach((character) => {
        options.push({ value: `character:${character.id}`, label: character.name });
      });
    }

    options.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      elements.rollEntitySelect.appendChild(option);
    });

    const preferredCharacter = state.selectedCharacterId
      ? `character:${state.selectedCharacterId}`
      : "";
    if (preferredCharacter && options.some((entry) => entry.value === preferredCharacter)) {
      elements.rollEntitySelect.value = preferredCharacter;
    } else if (options.some((entry) => entry.value === currentValue)) {
      elements.rollEntitySelect.value = currentValue;
    } else if (options.length > 0) {
      elements.rollEntitySelect.value = options[0].value;
    }
    renderRollSkillOptions();
    renderRollModifiers();
  }

  function renderRollModifiers() {
    const parsed = parseEntitySelectValue(elements.rollEntitySelect.value);
    const entity = parsed ? parsed.entity : null;
    const rollType = rollContextValue();
    const skillName = normalizedSkillValue();
    const selfModifiers = deriveModifiersFromEntity(entity);
    const catalog = mapOfModifierCatalog();

    const keepChecked = new Set();
    const visibleModifierIds = new Set();

    elements.rollModifierList.innerHTML = "";
    selfModifiers.forEach((modifierId) => {
      if (HIDDEN_SELF_MODIFIERS.has(modifierId)) {
        return;
      }
      const meta = catalog[modifierId];
      if (!doesModifierApply(meta, rollType, skillName)) {
        return;
      }
      visibleModifierIds.add(modifierId);
      const row = document.createElement("label");
      row.className = "tt-list-item";

      const left = document.createElement("span");
      const featLabel =
        meta && Array.isArray(meta.featNames) && meta.featNames[0] ? meta.featNames[0] : modifierId;
      left.textContent = meta ? `${featLabel} (${meta.phase})` : modifierId;
      row.appendChild(left);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = state.checkedSelfModifiers.has(modifierId);
      if (checkbox.checked) {
        keepChecked.add(modifierId);
      }
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          state.checkedSelfModifiers.add(modifierId);
        } else {
          state.checkedSelfModifiers.delete(modifierId);
        }
        updateConditionalRollControls(visibleModifierIds);
      });
      row.appendChild(checkbox);

      elements.rollModifierList.appendChild(row);
    });

    state.checkedSelfModifiers = keepChecked;

    elements.approvedModifierList.innerHTML = "";
    const keepApproved = new Set();
    state.approvedModifierEntries.forEach((entry) => {
      const meta = catalog[entry.modifierId];
      if (!doesModifierApply(meta, rollType, skillName)) {
        return;
      }
      visibleModifierIds.add(entry.modifierId);
      const row = document.createElement("label");
      row.className = "tt-list-item";
      const text = document.createElement("span");
      const featLabel =
        meta && Array.isArray(meta.featNames) && meta.featNames[0]
          ? meta.featNames[0]
          : entry.modifierId;
      text.textContent = `${featLabel} (approved by ${entry.byUsername})`;
      row.appendChild(text);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = state.checkedApprovedModifierIds.has(entry.approvalId);
      if (checkbox.checked) {
        keepApproved.add(entry.approvalId);
      }
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          state.checkedApprovedModifierIds.add(entry.approvalId);
        } else {
          state.checkedApprovedModifierIds.delete(entry.approvalId);
        }
        updateConditionalRollControls(visibleModifierIds);
      });
      row.appendChild(checkbox);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "x";
      remove.addEventListener("click", () => {
        state.approvedModifierEntries = state.approvedModifierEntries.filter(
          (candidate) => candidate.approvalId !== entry.approvalId
        );
        state.checkedApprovedModifierIds.delete(entry.approvalId);
        renderRollModifiers();
      });
      row.appendChild(remove);

      elements.approvedModifierList.appendChild(row);
    });
    state.checkedApprovedModifierIds = keepApproved;

    updateConditionalRollControls(visibleModifierIds);
    renderAllyModifierSelectors();
  }

  function updateConditionalRollControls(visibleModifierIds) {
    const visible = visibleModifierIds instanceof Set ? visibleModifierIds : new Set();
    const selectedModifierIds = new Set();

    state.checkedSelfModifiers.forEach((modifierId) => {
      if (visible.has(modifierId)) {
        selectedModifierIds.add(modifierId);
      }
    });
    state.approvedModifierEntries.forEach((entry) => {
      if (!entry || !state.checkedApprovedModifierIds.has(entry.approvalId)) {
        return;
      }
      if (visible.has(entry.modifierId)) {
        selectedModifierIds.add(entry.modifierId);
      }
    });

    const showMiracleSettings = selectedModifierIds.has("miracle_worker");
    const showShiftingSettings = selectedModifierIds.has("shifting_fortunes");
    const needsTargetDie =
      selectedModifierIds.has("inspired_by_the_gods") || selectedModifierIds.has("small_fortunes");

    if (elements.rollMiracleWrap) {
      elements.rollMiracleWrap.classList.toggle("tt-hidden", !showMiracleSettings);
    }
    if (!showMiracleSettings && elements.rollUseMiracle) {
      elements.rollUseMiracle.checked = false;
    }

    if (elements.rollShiftingWrap) {
      elements.rollShiftingWrap.classList.toggle("tt-hidden", !showShiftingSettings);
    }
    if (!showShiftingSettings && elements.rollShiftingMode) {
      elements.rollShiftingMode.value = "add";
    }

    if (elements.rollTargetDieWrap) {
      elements.rollTargetDieWrap.classList.toggle("tt-hidden", !needsTargetDie);
    }
    if (!needsTargetDie && elements.rollTargetDieIndex) {
      elements.rollTargetDieIndex.value = "0";
    }
  }

  function renderAllyModifierSelectors() {
    const me = userId();
    const map = activeMap();
    const modifierSources = [];
    if (map && Array.isArray(map.tokens)) {
      map.tokens
        .filter((token) => token.layer === "tokens")
        .forEach((token) => {
          let entity = null;
          let sourceUserId = null;
          if (token.sourceType === "character") {
            entity = characters().find((candidate) => candidate.id === token.sourceId) || null;
            sourceUserId = entity ? entity.ownerUserId : null;
          } else if (token.sourceType === "statblock") {
            entity = statblocks().find((candidate) => candidate.id === token.sourceId) || null;
            sourceUserId = entity ? entity.ownerUserId : null;
          }
          if (!entity || !sourceUserId || sourceUserId === me) {
            return;
          }
          const modifiers = deriveModifiersFromEntity(entity).filter((modifierId) => {
            const meta = mapOfModifierCatalog()[modifierId];
            return Boolean(meta && meta.requiresApproval);
          });
          if (modifiers.length === 0) {
            return;
          }
          modifierSources.push({
            sourceUserId,
            modifiers,
          });
        });
    }

    const eligibleUserIds = new Set(modifierSources.map((source) => source.sourceUserId));
    const users = connectedUsers().filter(
      (candidate) => candidate.id !== me && eligibleUserIds.has(candidate.id)
    );
    const previousUser = elements.allySourceUser.value;

    elements.allySourceUser.innerHTML = "";
    users.forEach((candidate) => {
      const option = document.createElement("option");
      option.value = candidate.id;
      option.textContent = `${candidate.username} (${candidate.role})`;
      elements.allySourceUser.appendChild(option);
    });

    if (users.some((candidate) => candidate.id === previousUser)) {
      elements.allySourceUser.value = previousUser;
    }

    const selectedUserId = elements.allySourceUser.value;
    const availableModifiersForUser = new Set();
    modifierSources.forEach((source) => {
      if (source.sourceUserId !== selectedUserId) {
        return;
      }
      source.modifiers.forEach((modifierId) => availableModifiersForUser.add(modifierId));
    });

    const previousModifier = elements.allyModifierId.value;
    elements.allyModifierId.innerHTML = "";
    Array.from(availableModifiersForUser).forEach((modifierId) => {
      const option = document.createElement("option");
      option.value = modifierId;
      option.textContent = modifierId;
      elements.allyModifierId.appendChild(option);
    });

    if (
      Array.from(elements.allyModifierId.options).some((option) => option.value === previousModifier)
    ) {
      elements.allyModifierId.value = previousModifier;
    }
  }

  function renderRollAndInjurySelectors() {
    renderRollEntityOptions();

    const previousInjury = elements.injuryEntitySelect.value;
    elements.injuryEntitySelect.innerHTML = "";

    const entries = [];
    if (isDm()) {
      characters().forEach((character) => {
        entries.push({ value: `character:${character.id}`, label: `PC: ${character.name}` });
      });
      statblocks().forEach((statblock) => {
        entries.push({ value: `statblock:${statblock.id}`, label: `NPC: ${statblock.name}` });
      });
    } else {
      ownCharacters().forEach((character) => {
        entries.push({ value: `character:${character.id}`, label: character.name });
      });
    }

    entries.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      elements.injuryEntitySelect.appendChild(option);
    });

    if (entries.some((entry) => entry.value === previousInjury)) {
      elements.injuryEntitySelect.value = previousInjury;
    } else if (entries.length > 0) {
      elements.injuryEntitySelect.value = entries[0].value;
    }

    elements.injuryCard.classList.toggle("tt-hidden", !isAuthenticated());
    elements.injuryRoll.disabled = entries.length === 0;
    elements.dmToolsCard.classList.toggle("tt-hidden", !isDm());
  }

  function renderLogs() {
    const logs = (state.snapshot && state.snapshot.logs) || [];
    elements.logEntries.innerHTML = "";

    logs.slice(-200).forEach((entry) => {
      const block = document.createElement("div");
      block.className = "tt-log-entry";

      const meta = document.createElement("div");
      meta.className = "tt-log-meta";
      meta.textContent = `${formatTimestamp(entry.timestamp)} ${entry.actor ? `| ${entry.actor}` : ""} | ${entry.type}`;
      block.appendChild(meta);

      const message = document.createElement("div");
      message.textContent = entry.message;
      block.appendChild(message);

      if (entry.type === "roll" && entry.details && entry.details.roll && entry.details.roll.d20) {
        const rollLine = document.createElement("div");
        rollLine.className = "tt-log-meta";
        const rollData = entry.details.roll;
        const groups = Array.isArray(rollData.d20.groups) ? rollData.d20.groups : [];
        const groupText = groups.length > 1
          ? `groups: ${groups
            .map((group, index) => `#${index + 1}[${group.dice.join(",")}]=>${group.selected}`)
            .join(" | ")}`
          : `d20s: ${rollData.d20.dice.join(", ")}`;
        rollLine.textContent = `${groupText} | selected ${rollData.d20.selected} | total ${rollData.total}`;
        block.appendChild(rollLine);

        if (rollData.isdcCheck && rollData.isdcCheck.required) {
          const isdcLine = document.createElement("div");
          isdcLine.className = "tt-log-meta";
          isdcLine.textContent =
            `ISDC check: ${rollData.isdcCheck.total}/${rollData.isdcCheck.dc} (${rollData.isdcCheck.passed ? "pass" : "fail"})`;
          block.appendChild(isdcLine);
        }
      }

      elements.logEntries.appendChild(block);
    });

    elements.logEntries.scrollTop = elements.logEntries.scrollHeight;
  }

  function renderMapAndInitiativeSummary() {
    const map = activeMap();
    if (!map) {
      return;
    }

    const initiative = state.snapshot.scene && state.snapshot.scene.initiative;
    if (initiative && initiative.active && initiative.order.length > 0) {
      const current = initiative.order[initiative.currentIndex];
      if (current) {
        setStatus(`Round ${initiative.round} - Turn: ${current.name}`);
      }
    }
  }

  function renderAll() {
    if (!state.snapshot) {
      return;
    }

    renderAuth();
    renderCampaigns();
    renderCharacters();
    renderStatblocks();
    renderMaps();
    renderRollAndInjurySelectors();
    renderMapGrid();
    renderLogs();
    renderInitiativePanel();
    renderMapAndInitiativeSummary();
    applyMenuVisibility();
    setActiveTool(activeTool());
    if (elements.distanceMode) {
      elements.distanceMode.value = activeDistanceMode();
    }
    if (elements.drawingColor) {
      elements.drawingColor.value = state.tool.drawingColor;
    }
    if (elements.drawingLayerSelect) {
      elements.drawingLayerSelect.value = state.tool.layer || "tokens";
    }
  }

  function parseEntitySelectionForPayload(selectValue) {
    const parsed = parseEntitySelectValue(selectValue);
    if (!parsed) {
      return null;
    }
    if (parsed.type === "character") {
      return {
        characterId: parsed.id,
      };
    }
    return {
      statblockId: parsed.id,
    };
  }

  function selectedSelfModifierPayloads() {
    const payloads = [];
    state.checkedSelfModifiers.forEach((modifierId) => {
      if (HIDDEN_SELF_MODIFIERS.has(modifierId)) {
        return;
      }
      const entry = { id: modifierId, external: false };
      if (modifierId === "portent") {
        const typed = window.prompt("Portent die value (1-20):", "10");
        const value = Number.parseInt(typed || "", 10);
        if (!Number.isFinite(value) || value < 1 || value > 20) {
          setStatus("Portent requires a value from 1 to 20.", true);
          return;
        }
        entry.portentValue = value;
      }
      payloads.push(entry);
    });
    return payloads;
  }

  function selectedApprovedModifierPayloads() {
    const payloads = [];
    state.approvedModifierEntries.forEach((entry) => {
      if (!state.checkedApprovedModifierIds.has(entry.approvalId)) {
        return;
      }
      payloads.push({ id: entry.modifierId, external: true });
    });
    return payloads;
  }

  function selectedApprovalIds() {
    return state.approvedModifierEntries
      .filter((entry) => state.checkedApprovedModifierIds.has(entry.approvalId))
      .map((entry) => entry.approvalId);
  }

  elements.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    emit("auth:login", {
      username: elements.loginUsername.value,
      password: elements.loginPassword.value,
    });
  });

  elements.registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    emit("auth:register", {
      username: elements.registerUsername.value,
      password: elements.registerPassword.value,
    });
  });

  elements.logoutButton.addEventListener("click", () => {
    emit("auth:logout");
    localStorage.removeItem(STORAGE_SESSION_KEY);
  });

  if (elements.menuToggle) {
    elements.menuToggle.addEventListener("click", () => {
      setLeftPanelCollapsed(!state.leftPanelCollapsed);
    });
  }

  if (elements.railAccount) {
    elements.railAccount.addEventListener("click", () => {
      setActiveMenu("account");
      setLeftPanelCollapsed(false);
    });
  }
  if (elements.railCampaigns) {
    elements.railCampaigns.addEventListener("click", () => {
      setActiveMenu("campaigns");
      setLeftPanelCollapsed(false);
    });
  }
  if (elements.railCharacter) {
    elements.railCharacter.addEventListener("click", () => {
      setActiveMenu("character");
      setLeftPanelCollapsed(false);
    });
  }
  if (elements.railBattlemaps) {
    elements.railBattlemaps.addEventListener("click", () => {
      setActiveMenu("battlemaps");
      setLeftPanelCollapsed(false);
    });
  }
  if (elements.railRolls) {
    elements.railRolls.addEventListener("click", () => {
      setActiveMenu("rolls");
      setLeftPanelCollapsed(false);
    });
  }
  if (elements.railCombat) {
    elements.railCombat.addEventListener("click", () => {
      setActiveMenu("combat");
      setLeftPanelCollapsed(false);
    });
  }
  if (elements.railUtilities) {
    elements.railUtilities.addEventListener("click", () => {
      setActiveMenu("utilities");
      setLeftPanelCollapsed(false);
    });
  }

  if (elements.campaignForm) {
    elements.campaignForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!isAuthenticated()) {
        setStatus("Log in first.", true);
        return;
      }
      const name = (elements.campaignName.value || "").trim();
      emit("campaign:create", { name });
      elements.campaignName.value = "";
      setActiveMenu("campaigns");
    });
  }

  if (elements.characterSelect) {
    elements.characterSelect.addEventListener("change", () => {
      const selectedId = elements.characterSelect.value;
      if (!selectedId) {
        state.selectedCharacterId = null;
        resetCharacterForm();
        return;
      }
      selectCharacterById(selectedId, isDm() ? characters() : ownCharacters(), true);
    });
  }

  if (elements.characterNewButton) {
    elements.characterNewButton.addEventListener("click", () => {
      const pool = characters();
      const name = nextUniqueName(pool, "New Character");
      state.pendingNewCharacterName = normalizedEntityName(name);
      emit("character:save", {
        name,
        sheetUrl: "",
        featsText: "",
        tokenImage: "",
      });
      setStatus(`Creating ${name}...`);
    });
  }

  if (elements.characterDeleteButton) {
    elements.characterDeleteButton.addEventListener("click", () => {
      const selected = selectedCharacterForEditing();
      if (!selected) {
        setStatus("Select a character first.", true);
        return;
      }
      if (!window.confirm(`Delete ${selected.name}?`)) {
        return;
      }
      emit("character:delete", { id: selected.id });
    });
  }

  if (elements.characterName) {
    elements.characterName.addEventListener("dblclick", () => {
      const selected = selectedCharacterForEditing();
      if (!selected) {
        return;
      }
      elements.characterName.readOnly = false;
      elements.characterName.dataset.previousValue = elements.characterName.value || "";
      elements.characterName.focus();
      elements.characterName.select();
    });
    elements.characterName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        elements.characterName.blur();
      } else if (event.key === "Escape") {
        elements.characterName.value = elements.characterName.dataset.previousValue || "";
        elements.characterName.readOnly = true;
        elements.characterName.blur();
      }
    });
    elements.characterName.addEventListener("blur", () => {
      if (elements.characterName.readOnly) {
        return;
      }
      elements.characterName.readOnly = true;
      saveCharacterNow();
    });
  }

  if (elements.characterRefreshButton) {
    elements.characterRefreshButton.addEventListener("click", () => {
      const characterId = elements.characterId.value || state.selectedCharacterId || "";
      if (!characterId) {
        setStatus("Select a saved character first.", true);
        return;
      }
      emit("character:refresh", { id: characterId });
      setStatus("Refreshing character sheet...");
    });
  }

  if (elements.characterSheetUrl) {
    elements.characterSheetUrl.addEventListener("change", () => {
      scheduleCharacterAutosave();
    });
    elements.characterSheetUrl.addEventListener("blur", () => {
      scheduleCharacterAutosave();
    });
  }
  if (elements.characterFeatsText) {
    elements.characterFeatsText.addEventListener("input", () => {
      scheduleCharacterAutosave();
    });
    elements.characterFeatsText.addEventListener("blur", () => {
      scheduleCharacterAutosave();
    });
  }

  if (elements.characterTokenFile) {
    elements.characterTokenFile.addEventListener("change", async () => {
      const file = elements.characterTokenFile.files && elements.characterTokenFile.files[0];
      if (!file) {
        return;
      }
      try {
        const imageDataUrl = await readFileAsDataUrl(file);
        elements.characterTokenImage.value = imageDataUrl;
        scheduleCharacterAutosave();
        setStatus(`Loaded token file: ${file.name}`);
      } catch (error) {
        setStatus(error.message, true);
      }
    });
  }

  elements.characterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCharacterNow();
  });

  if (elements.statblockTokenFile) {
    elements.statblockTokenFile.addEventListener("change", async () => {
      const file = elements.statblockTokenFile.files && elements.statblockTokenFile.files[0];
      if (!file) {
        return;
      }
      try {
        const imageDataUrl = await readFileAsDataUrl(file);
        elements.statblockTokenImage.value = imageDataUrl;
        setStatus(`Loaded token file: ${file.name}`);
      } catch (error) {
        setStatus(error.message, true);
      }
    });
  }

  elements.statblockForm.addEventListener("submit", (event) => {
    event.preventDefault();
    emit("statblock:save", {
      id: elements.statblockId.value || undefined,
      name: elements.statblockName.value,
      mode: elements.statblockMode.value,
      sheetUrl: elements.statblockSheetUrl.value,
      sheetName: elements.statblockSheetName.value,
      columnName: elements.statblockColumnName.value,
      manualText: elements.statblockManualText.value,
      tokenImage: elements.statblockTokenImage.value,
    });
    resetStatblockForm();
  });

  if (elements.mapNew) {
    elements.mapNew.addEventListener("click", () => {
      const maps = (state.snapshot && state.snapshot.maps) || [];
      const current = activeMap();
      const name = nextUniqueName(maps, "New Map");
      emit("map:create", {
        name,
        rows: current ? current.rows : 20,
        cols: current ? current.cols : 30,
        feetPerCell: current ? feetPerSquare(current) : 5,
      });
      setStatus(`Creating ${name}...`);
    });
  }

  if (elements.mapSelect) {
    elements.mapSelect.addEventListener("change", () => {
      if (!elements.mapSelect.value) {
        return;
      }
      emit("map:load", { id: elements.mapSelect.value });
    });
  }

  elements.mapDelete.addEventListener("click", () => {
    const mapId = elements.mapSelect.value;
    const selected = state.snapshot && state.snapshot.maps
      ? state.snapshot.maps.find((entry) => entry.id === mapId)
      : null;
    if (!selected) {
      return;
    }
    if (!window.confirm(`Delete map ${selected.name}?`)) {
      return;
    }
    emit("map:delete", { id: mapId });
  });

  if (elements.mapName) {
    elements.mapName.addEventListener("dblclick", () => {
      const map = activeMap();
      if (!map) {
        return;
      }
      elements.mapName.readOnly = false;
      elements.mapName.dataset.previousValue = elements.mapName.value || "";
      elements.mapName.focus();
      elements.mapName.select();
    });
    elements.mapName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        elements.mapName.blur();
      } else if (event.key === "Escape") {
        elements.mapName.value = elements.mapName.dataset.previousValue || "";
        elements.mapName.readOnly = true;
        elements.mapName.blur();
      }
    });
    elements.mapName.addEventListener("blur", () => {
      if (elements.mapName.readOnly) {
        return;
      }
      elements.mapName.readOnly = true;
      saveMapNow({ includeName: true });
    });
  }

  elements.mapBackgroundInput.addEventListener("change", async () => {
    const file = elements.mapBackgroundInput.files && elements.mapBackgroundInput.files[0];
    if (!file) {
      return;
    }
    try {
      const imageDataUrl = await normalizeMapBackgroundDataUrl(file);
      emit("map:setBackground", { imageDataUrl });
      setStatus(`Background loaded: ${file.name}`);
    } catch (error) {
      setStatus(error.message, true);
    }
    elements.mapBackgroundInput.value = "";
  });

  if (elements.customTokenFile) {
    elements.customTokenFile.addEventListener("change", async () => {
      const file = elements.customTokenFile.files && elements.customTokenFile.files[0];
      if (!file) {
        return;
      }
      try {
        const tokenImage = await readFileAsDataUrl(file);
        const fallbackName = String(file.name || "").replace(/\.[^./\\]+$/, "") || "Custom";
        const name = (state.pendingCustomTokenName || fallbackName).trim() || "Custom";
        state.pendingCustomTokenName = "";
        state.selectedPlacement = {
          sourceType: "custom",
          sourceId: "",
          name,
          tokenImage,
        };
        elements.interactionMode.value = "place";
        updateInteractionModeUi();
        renderTokenRoster();
        setStatus(`Selected custom token ${name}.`);
      } catch (error) {
        setStatus(error.message, true);
      } finally {
        elements.customTokenFile.value = "";
      }
    });
  }

  if (elements.mapGridFeet) {
    elements.mapGridFeet.addEventListener("change", () => {
      scheduleMapAutosave();
      renderMeasurementOverlay();
    });
  }
  if (elements.mapRows) {
    elements.mapRows.addEventListener("change", () => {
      scheduleMapAutosave();
    });
  }
  if (elements.mapCols) {
    elements.mapCols.addEventListener("change", () => {
      scheduleMapAutosave();
    });
  }
  if (elements.mapGmOpacity) {
    elements.mapGmOpacity.addEventListener("input", () => {
      updateMapOpacityLabel();
      scheduleMapAutosave();
    });
    elements.mapGmOpacity.addEventListener("change", () => {
      updateMapOpacityLabel();
      scheduleMapAutosave();
    });
  }

  elements.interactionMode.addEventListener("change", () => {
    if (elements.interactionMode.value !== "paint") {
      stopPaintDrag();
    }
    if (elements.interactionMode.value !== "place") {
      state.selectedPlacement = null;
      renderTokenRoster();
    }
    updateInteractionModeUi();
  });

  elements.tokenLayerToTokens.addEventListener("click", () => {
    if (!state.selectedTokenId) {
      return;
    }
    emit("token:setLayer", {
      tokenId: state.selectedTokenId,
      layer: "tokens",
    });
  });

  elements.tokenLayerToGm.addEventListener("click", () => {
    if (!state.selectedTokenId) {
      return;
    }
    emit("token:setLayer", {
      tokenId: state.selectedTokenId,
      layer: "gm",
    });
  });

  elements.tokenDelete.addEventListener("click", () => {
    if (!state.selectedTokenId) {
      return;
    }
    if (!window.confirm("Delete selected token?")) {
      return;
    }
    emit("token:delete", {
      tokenId: state.selectedTokenId,
    });
    state.selectedTokenId = null;
  });

  elements.tokenToggleAuto.addEventListener("click", () => {
    if (!state.selectedTokenId) {
      return;
    }
    const token = getTokenById(state.selectedTokenId);
    if (!token) {
      return;
    }
    emit("token:update", {
      tokenId: token.id,
      autoMove: !token.autoMove,
    });
  });

  elements.rollEntitySelect.addEventListener("change", () => {
    state.checkedSelfModifiers.clear();
    state.checkedApprovedModifierIds.clear();
    state.approvedModifierEntries = [];
    state.lastRollSkillKey = null;
    renderRollSkillOptions();
    renderRollModifiers();
  });

  elements.rollSkillSelect.addEventListener("change", () => {
    state.lastRollSkillKey = null;
    syncRollSkillContext();
    renderRollModifiers();
  });

  elements.requestAllyModifier.addEventListener("click", () => {
    const targetUserId = elements.allySourceUser.value;
    const modifierId = elements.allyModifierId.value;
    if (!targetUserId || !modifierId) {
      setStatus("Choose an ally and modifier first.", true);
      return;
    }
    emit("roll:requestModifierApproval", {
      targetUserId,
      modifierId,
      context: {
        skillName: elements.rollSkillSelect.value,
        rollType: rollContextValue(),
      },
    });
    setStatus(`Requested ${modifierId} from ally.`);
  });

  elements.allySourceUser.addEventListener("change", () => {
    renderAllyModifierSelectors();
  });

  elements.rollForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const entityPayload = parseEntitySelectionForPayload(elements.rollEntitySelect.value);
    if (!entityPayload) {
      setStatus("Select who is rolling first.", true);
      return;
    }
    if (!elements.rollSkillSelect.value) {
      setStatus("Select a skill to roll.", true);
      return;
    }

    const payload = {
      ...entityPayload,
      skillName: elements.rollSkillSelect.value,
      rollType: rollContextValue(),
      advantageLevel: Number.parseInt(elements.rollAdvantage.value, 10) || 0,
      flatModifier: Number.parseInt(elements.rollBonusOverride.value, 10) || 0,
      bonusOverride: Number.parseInt(elements.rollSkillModifier.value, 10) || 0,
      modifiers: [...selectedSelfModifierPayloads(), ...selectedApprovedModifierPayloads()],
      approvalIds: selectedApprovalIds(),
      targetDieIndexForReroll: Number.parseInt(elements.rollTargetDieIndex.value, 10) || 0,
      targetDieIndexForSmallFortunes: Number.parseInt(elements.rollTargetDieIndex.value, 10) || 0,
      shiftingFortunesMode: elements.rollShiftingMode.value,
      useMiracleWorkerPenalty: elements.rollUseMiracle.checked,
    };

    emit("roll:skill", payload);
  });

  elements.forageRoll.addEventListener("click", () => {
    emit("forage:roll", {
      terrain: elements.forageTerrain.value,
    });
  });

  elements.groupRollSend.addEventListener("click", () => {
    const skillName = elements.groupRollSkill.value.trim();
    if (!skillName) {
      setStatus("Enter a skill to request.", true);
      return;
    }
    emit("roll:groupRequest", {
      skillName,
      rollType: deriveRollTypeFromSkill(skillName),
    });
  });

  elements.initiativeStart.addEventListener("click", () => {
    emit("initiative:start");
  });

  elements.initiativeNext.addEventListener("click", () => {
    emit("initiative:next");
  });

  elements.initiativeStop.addEventListener("click", () => {
    emit("initiative:stop");
  });

  elements.injuryRoll.addEventListener("click", () => {
    const parsed = parseEntitySelectionForPayload(elements.injuryEntitySelect.value);
    if (!parsed) {
      setStatus("Select who takes the injury checks.", true);
      return;
    }
    emit("injury:roll", {
      ...parsed,
      overkill: Number.parseInt(elements.injuryOverkill.value, 10) || 0,
    });
  });

  if (elements.toolDistance) {
    elements.toolDistance.addEventListener("click", () => setActiveTool("distance"));
  }
  if (elements.toolCone) {
    elements.toolCone.addEventListener("click", () => setActiveTool("cone"));
  }
  if (elements.toolCircle) {
    elements.toolCircle.addEventListener("click", () => setActiveTool("circle"));
  }
  if (elements.toolRectangle) {
    elements.toolRectangle.addEventListener("click", () => setActiveTool("rectangle"));
  }
  if (elements.distanceMode) {
    elements.distanceMode.addEventListener("change", () => {
      setDistanceMode(elements.distanceMode.value);
    });
  }
  if (elements.drawingColor) {
    elements.drawingColor.addEventListener("input", () => {
      setDrawingColor(elements.drawingColor.value);
    });
  }
  if (elements.drawingLayerSelect) {
    elements.drawingLayerSelect.addEventListener("change", () => {
      const nextLayer = elements.drawingLayerSelect.value === "gm" ? "gm" : "tokens";
      state.tool.layer = nextLayer;
      renderMeasurementOverlay();
    });
  }

  if (elements.boardWrap) {
    elements.boardWrap.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (isToolInteractionEnabled() && state.tool.preview) {
        commitPreviewDrawing();
      }
    });
    elements.boardWrap.addEventListener(
      "wheel",
      (event) => {
        if (!activeMap()) {
          return;
        }
        event.preventDefault();
        zoomMapAtClientPoint(event.clientX, event.clientY, event.deltaY);
      },
      { passive: false }
    );
    elements.boardWrap.addEventListener("mousedown", (event) => {
      if (event.button !== 1 && event.button !== 2) {
        return;
      }
      if (event.button === 2 && isToolInteractionEnabled() && state.tool.preview) {
        return;
      }
      event.preventDefault();
      startMapPan(event);
    });
  }

  window.addEventListener("mousemove", (event) => {
    continueMapPan(event);
    if (!state.tool.dragging || !isToolInteractionEnabled()) {
      return;
    }
    const cell = cellFromClientPoint(event.clientX, event.clientY);
    if (!cell) {
      return;
    }
    updateMeasureDrag(cell.x, cell.y, state.tool.cellSize);
  });

  window.addEventListener("mouseup", () => {
    stopPaintDrag();
    endMeasureDrag();
    stopMapPan();
  });

  window.addEventListener("resize", () => {
    applyMapViewTransform();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Delete" && event.key !== "Backspace") {
      return;
    }
    if (!state.tool.selectedDrawingId) {
      return;
    }
    const map = activeMap();
    if (!map || !Array.isArray(map.drawings)) {
      return;
    }
    const drawing = map.drawings.find((entry) => entry.id === state.tool.selectedDrawingId) || null;
    if (!drawing || !drawingCanBeDeleted(drawing)) {
      return;
    }
    event.preventDefault();
    emit("map:deleteDrawing", { drawingId: drawing.id });
    state.tool.selectedDrawingId = null;
  });

  elements.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = elements.chatInput.value.trim();
    if (!text) {
      return;
    }
    emit("chat:message", { text });
    elements.chatInput.value = "";
  });

  if (elements.logToggle && elements.logPanel) {
    elements.logToggle.addEventListener("click", () => {
      const expand = elements.logPanel.classList.contains("minimized");
      showLogPanel(expand);
    });
  }

  socket.on("connect", () => {
    setStatus("Connected");
    const token = localStorage.getItem(STORAGE_SESSION_KEY);
    if (token) {
      emit("auth:resume", {
        sessionToken: token,
      });
    }
  });

  socket.on("disconnect", () => {
    setStatus("Disconnected", true);
  });

  socket.on("tabletop:state", (snapshot) => {
    state.snapshot = snapshot;
    if (snapshot && snapshot.auth && snapshot.auth.sessionToken) {
      localStorage.setItem(STORAGE_SESSION_KEY, snapshot.auth.sessionToken);
    }
    renderAll();
  });

  socket.on("tabletop:error", (payload) => {
    const message = payload && payload.message ? payload.message : "Unknown error";
    setStatus(message, true);
    if (/uses remaining/i.test(message)) {
      window.alert(message);
    }
  });

  socket.on("tabletop:notice", (payload) => {
    setStatus(payload && payload.message ? payload.message : "Notice");
  });

  socket.on("roll:modifierApprovalRequested", (payload) => {
    const modifierId = payload && payload.modifierId ? payload.modifierId : "modifier";
    const requesterName = payload && payload.requesterName ? payload.requesterName : "Player";
    const approve = window.confirm(`${requesterName} asks to use ${modifierId}. Approve?`);
    emit("roll:modifierApprovalResponse", {
      approvalId: payload.approvalId,
      approve,
    });
  });

  socket.on("roll:modifierApprovalResolved", (payload) => {
    if (!payload || !payload.approvalId) {
      return;
    }
    if (!payload.approved) {
      setStatus(`${payload.modifierId} request was denied.`, true);
      return;
    }

    if (state.approvedModifierEntries.some((entry) => entry.approvalId === payload.approvalId)) {
      return;
    }

    state.approvedModifierEntries.push({
      approvalId: payload.approvalId,
      modifierId: payload.modifierId,
      byUserId: payload.byUserId,
      byUsername: payload.byUsername,
    });
    state.checkedApprovedModifierIds.add(payload.approvalId);
    renderRollModifiers();
    setStatus(`${payload.modifierId} approved by ${payload.byUsername}.`);
  });

  socket.on("roll:result", (payload) => {
    const roll = payload && payload.roll;
    if (!roll) {
      return;
    }
    const groups = roll.d20 && Array.isArray(roll.d20.groups) ? roll.d20.groups : [];
    const diceText = groups.length > 1
      ? groups
        .map((group, index) => `#${index + 1}[${group.dice.join(",")}]=>${group.selected}`)
        .join(" | ")
      : roll.d20 && Array.isArray(roll.d20.dice)
        ? roll.d20.dice.join(", ")
        : "-";
    const guidanceText = Array.isArray(roll.guidingDice) && roll.guidingDice.length > 0
      ? ` | extra: ${roll.guidingDice.map((entry) => `${entry.type}:${entry.roll}`).join(", ")}`
      : "";
    const fofText =
      roll.fortuneOverFinesse && roll.fortuneOverFinesse.enabled
        ? ` | FoF groups: +${roll.fortuneOverFinesse.extraGroups}`
        : "";
    const isdcText =
      roll.isdcCheck && roll.isdcCheck.required
        ? ` | ISDC ${roll.isdcCheck.passed ? "pass" : "fail"} (${roll.isdcCheck.total}/${roll.isdcCheck.dc})`
        : "";
    elements.rollResult.textContent =
      `${payload.entityName}: ${roll.total} | d20: ${diceText}${fofText}${guidanceText}${isdcText}`;
  });

  socket.on("roll:groupRequested", (payload) => {
    setStatus(`${payload.requestedBy} requested: ${payload.skillName}`, false);

    if (Array.isArray(payload.characterOptions) && payload.characterOptions.length > 0) {
      const first = payload.characterOptions[0];
      const wantedValue = `character:${first.id}`;
      if (Array.from(elements.rollEntitySelect.options).some((option) => option.value === wantedValue)) {
        elements.rollEntitySelect.value = wantedValue;
      }
    }
    state.lastRollSkillKey = null;
    renderRollSkillOptions(payload.skillName, payload.rollType);
    renderRollModifiers();
  });

  socket.on("forage:result", (payload) => {
    if (!payload || !payload.herb) {
      return;
    }
    const rarity = String(payload.rarity || "").replace("_", " ");
    setStatus(`Forage: ${payload.herb.name} (${rarity})`);
  });

  socket.on("injury:result", (payload) => {
    if (!payload) {
      return;
    }
    const injury = payload.injuryCheck.passed
      ? "No injury"
      : `${payload.injuryCheck.tier}: ${payload.injuryCheck.injury}`;
    const text = `${payload.entityName} | death check ${payload.deathCheck.total}/${payload.deathCheck.dc} (${payload.deathCheck.passed ? "pass" : "fail"}) | injury ${payload.injuryCheck.total}/${payload.injuryCheck.dc}: ${injury}`;
    elements.injuryResult.textContent = text;
  });

  const minimizedByDefault = localStorage.getItem(STORAGE_LOG_MIN_KEY) === "1";
  showLogPanel(!minimizedByDefault);
  const leftCollapsedByDefault = localStorage.getItem(STORAGE_LEFT_MIN_KEY) === "1";
  setLeftPanelCollapsed(leftCollapsedByDefault, false);
  if (elements.drawingLayerSelect) {
    state.tool.layer = elements.drawingLayerSelect.value === "gm" ? "gm" : "tokens";
  }
  updateMapOpacityLabel();
  applyMapViewTransform();
})();
