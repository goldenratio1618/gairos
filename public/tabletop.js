(() => {
  const socket = io("/tabletop");

  const STORAGE_SESSION_KEY = "gairos_tabletop_session";
  const STORAGE_LOG_MIN_KEY = "gairos_tabletop_log_minimized";
  const STORAGE_LEFT_MIN_KEY = "gairos_tabletop_left_minimized";
  const MAX_MAP_BACKGROUND_DATA_URL_LENGTH = 9_500_000;
  const DEFAULT_LIGHTING_MODE = "visible";
  const DEFAULT_DIM_LIGHT_ALPHA = 0.34;
  const DEFAULT_DARKVISION_TINT = "#6f89b8";
  const DEFAULT_DARKVISION_TINT_ALPHA = 0.42;
  const DEFAULT_TOKEN_AURA_COLOR = "#59a8ff";
  const MAX_LIGHT_RADIUS_FEET = 10_000;

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
    railTokens: document.getElementById("rail-tokens"),
    railTerrain: document.getElementById("rail-terrain"),
    railLighting: document.getElementById("rail-lighting"),
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
    terrainToolGroup: document.getElementById("terrain-tool-group"),
    terrainActiveLayer: document.getElementById("terrain-active-layer"),
    terrainLayerList: document.getElementById("terrain-layer-list"),
    terrainLayerNewType: document.getElementById("terrain-layer-new-type"),
    terrainLayerNew: document.getElementById("terrain-layer-new"),
    terrainBrushSize: document.getElementById("terrain-brush-size"),
    terrainOpacity: document.getElementById("terrain-opacity"),
    terrainOpacityValue: document.getElementById("terrain-opacity-value"),
    terrainLineWidth: document.getElementById("terrain-line-width"),
    terrainShapeFilled: document.getElementById("terrain-shape-filled"),
    terrainForegroundOptions: document.getElementById("terrain-foreground-options"),
    terrainBlockMovement: document.getElementById("terrain-block-movement"),
    terrainBlockVision: document.getElementById("terrain-block-vision"),
    terrainBlockLight: document.getElementById("terrain-block-light"),
    terrainDoorOptions: document.getElementById("terrain-door-options"),
    terrainDoorState: document.getElementById("terrain-door-state"),
    brushGroup: document.getElementById("brush-group"),
    brushPanel: document.getElementById("brush-panel"),

    tokenCard: document.getElementById("token-card"),
    tokenActiveMap: document.getElementById("token-active-map"),
    tokenPlayerList: document.getElementById("token-player-list"),
    layerGroup: document.getElementById("layer-group"),
    customTokenFile: document.getElementById("custom-token-file"),
    tokenRoster: document.getElementById("token-roster"),
    tokenInfoInline: document.getElementById("token-info-inline"),
    selectedTokenControls: document.getElementById("selected-token-controls"),
    tokenLayerToTokens: document.getElementById("token-layer-to-tokens"),
    tokenLayerToGm: document.getElementById("token-layer-to-gm"),
    tokenToggleAuto: document.getElementById("token-toggle-auto"),
    tokenDelete: document.getElementById("token-delete"),

    lightingCard: document.getElementById("lighting-card"),
    lightingActiveMap: document.getElementById("lighting-active-map"),
    lightingMode: document.getElementById("lighting-mode"),
    lightingDimAmount: document.getElementById("lighting-dim-amount"),
    lightingDimAmountValue: document.getElementById("lighting-dim-amount-value"),
    lightingDarkvisionTint: document.getElementById("lighting-darkvision-tint"),
    lightingDarkvisionStrength: document.getElementById("lighting-darkvision-strength"),
    lightingDarkvisionStrengthValue: document.getElementById("lighting-darkvision-strength-value"),
    lightingSourceId: document.getElementById("lighting-source-id"),
    lightingSourceName: document.getElementById("lighting-source-name"),
    lightingSourceBright: document.getElementById("lighting-source-bright"),
    lightingSourceDim: document.getElementById("lighting-source-dim"),
    lightingSourceColor: document.getElementById("lighting-source-color"),
    lightingSourceArm: document.getElementById("lighting-source-arm"),
    lightingSourceSave: document.getElementById("lighting-source-save"),
    lightingSourceClear: document.getElementById("lighting-source-clear"),
    lightingSourceDelete: document.getElementById("lighting-source-delete"),
    lightingSourceList: document.getElementById("lighting-source-list"),

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
    mapTerrainLayer: document.getElementById("map-terrain-layer"),
    mapLightingLayer: document.getElementById("map-lighting-layer"),
    mapVisionLayer: document.getElementById("map-vision-layer"),
    mapGridTokens: document.getElementById("map-grid-tokens"),
    mapMeasureOverlay: document.getElementById("map-measure-overlay"),
    mapDrawingsLayer: document.getElementById("map-drawings-layer"),
    mapPreviewLayer: document.getElementById("map-preview-layer"),
    mapMeasureLabel: document.getElementById("map-measure-label"),
    mapSelectBox: document.getElementById("map-select-box"),

    terrainCategoryModal: document.getElementById("terrain-category-modal"),
    terrainCategoryTitle: document.getElementById("terrain-category-title"),
    terrainCategoryApplyGlobal: document.getElementById("terrain-category-apply-global"),
    terrainCategoryGrid: document.getElementById("terrain-category-grid"),
    terrainCategoryClose: document.getElementById("terrain-category-close"),
    terrainColorModal: document.getElementById("terrain-color-modal"),
    terrainColorInput: document.getElementById("terrain-color-input"),
    terrainColorConfirm: document.getElementById("terrain-color-confirm"),
    terrainColorClose: document.getElementById("terrain-color-close"),

    tokenInfoModal: document.getElementById("token-info-modal"),
    tokenInfoTitle: document.getElementById("token-info-title"),
    tokenInfoGrid: document.getElementById("token-info-grid"),
    tokenInfoClose: document.getElementById("token-info-close"),
    tokenConfigModal: document.getElementById("token-config-modal"),
    tokenConfigTitle: document.getElementById("token-config-title"),
    tokenConfigTokenId: document.getElementById("token-config-token-id"),
    tokenConfigBright: document.getElementById("token-config-bright"),
    tokenConfigDim: document.getElementById("token-config-dim"),
    tokenConfigDarkvision: document.getElementById("token-config-darkvision"),
    tokenConfigAuraRadius: document.getElementById("token-config-aura-radius"),
    tokenConfigAuraColor: document.getElementById("token-config-aura-color"),
    tokenConfigSave: document.getElementById("token-config-save"),
    tokenConfigClose: document.getElementById("token-config-close"),

    logPanel: document.getElementById("log-panel"),
    logToggle: document.getElementById("log-toggle"),
    logEntries: document.getElementById("log-entries"),
    chatForm: document.getElementById("chat-form"),
    chatInput: document.getElementById("chat-input"),
  };

  const state = {
    snapshot: null,
    selectedTokenIds: new Set(),
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
    terrainCatalog: null,
    tokenLayer: "tokens",
    paintDrag: {
      active: false,
      paintedCells: new Set(),
    },
    dragSelect: {
      active: false,
      startClientX: 0,
      startClientY: 0,
      endClientX: 0,
      endClientY: 0,
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
    terrain: {
      activeTool: "brush",
      activeLayerId: null,
      brush: {
        kind: "texture",
        textureId: "",
        categoryId: "",
        color: "#7f8c4a",
      },
      brushSize: 1,
      lineWidth: 1,
      opacity: 1,
      shapeFilled: true,
      foregroundRules: {
        blocksMovement: true,
        blocksVision: true,
        blocksLight: true,
      },
      doorState: "locked",
      categoryModalCategoryId: "",
      pendingChanges: new Map(),
      syncTimer: null,
      activeStroke: null,
      previewShape: null,
      previewDirty: false,
      layerRenderCache: new Map(),
      textureImages: new Map(),
      textureTileCache: new Map(),
      lockFlash: null,
    },
    lightingUi: {
      selectedSourceId: null,
      pendingPlacement: null,
      tokenInfoTokenId: null,
      tokenConfigTokenId: null,
      blockerCacheKey: "",
      blockerCache: null,
      visibilityCacheKey: "",
      visibilityCache: null,
    },
  };

  function emit(eventName, payload) {
    socket.emit(eventName, payload || {});
  }

  function setStatus(message, isError = false) {
    const text = String(message || "");
    if (elements.mainStatus) {
      elements.mainStatus.textContent = text;
      elements.mainStatus.classList.toggle("tt-status-error", isError);
      elements.mainStatus.classList.toggle("tt-hidden", !text);
    }
    if (state.lastStatusTimeout) {
      clearTimeout(state.lastStatusTimeout);
      state.lastStatusTimeout = null;
    }
    if (text) {
      state.lastStatusTimeout = setTimeout(() => {
        if (elements.mainStatus) {
          elements.mainStatus.textContent = "";
          elements.mainStatus.classList.add("tt-hidden");
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

  function isMapToolMenu(menuKey) {
    return ["terrain", "tokens", "lighting"].includes(menuKey);
  }

  function activeInteractionMode() {
    if (state.activeMenu === "terrain" && isDm()) {
      return "paint";
    }
    if (state.activeMenu === "lighting" && isDm()) {
      return "lighting";
    }
    if (state.activeMenu === "tokens") {
      return state.selectedPlacement ? "place" : "move";
    }
    return "idle";
  }

  function isPaintModeActive() {
    return activeInteractionMode() === "paint";
  }

  function isPlaceModeActive() {
    return activeInteractionMode() === "place";
  }

  function isLightingModeActive() {
    return activeInteractionMode() === "lighting";
  }

  function isTokenInteractionAllowed() {
    if (!isAuthenticated()) {
      return false;
    }
    if (isPlaceModeActive()) {
      return false;
    }
    if (isDm()) {
      return state.activeMenu !== "terrain" && state.activeMenu !== "lighting";
    }
    return true;
  }

  function canStartMeasureDrag(event) {
    return Boolean(
      event &&
      event.altKey &&
      !isPlaceModeActive() &&
      !isPaintModeActive() &&
      !isLightingModeActive() &&
      isToolInteractionEnabled()
    );
  }

  function setInteractionMode(mode) {
    if (mode === "paint") {
      setActiveMenu("terrain");
      return;
    }
    if (mode === "lighting") {
      setActiveMenu("lighting");
      return;
    }
    setActiveMenu("tokens");
    if (mode !== "paint") {
      stopPaintDrag();
    }
    if (mode !== "place") {
      state.selectedPlacement = null;
      renderTokenRoster();
    }
    updateInteractionModeUi();
  }

  function setTokenLayer(layer) {
    const normalized = layer === "gm" ? "gm" : "tokens";
    state.tokenLayer = normalized;
    if (elements.layerGroup) {
      elements.layerGroup.querySelectorAll(".tt-seg").forEach((btn) => {
        btn.classList.toggle("tt-seg-active", btn.dataset.value === normalized);
      });
    }
  }

  function feetPerSquare(map = activeMap()) {
    const value = Number(map && map.feetPerCell);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
    return 5;
  }

  function clampLightRadiusFeet(value) {
    return clamp(Number.parseFloat(value) || 0, 0, MAX_LIGHT_RADIUS_FEET);
  }

  function normalizeTokenVisionConfig(vision) {
    const next = vision && typeof vision === "object" ? vision : {};
    return {
      brightRadius: clampLightRadiusFeet(next.brightRadius),
      dimRadius: clampLightRadiusFeet(next.dimRadius),
      darkvisionRadius: clampLightRadiusFeet(next.darkvisionRadius),
      auraRadius: clampLightRadiusFeet(next.auraRadius),
      auraColor: normalizeTerrainColor(next.auraColor || DEFAULT_TOKEN_AURA_COLOR),
    };
  }

  function lightingSettings(map = activeMap()) {
    const lighting = map && map.lighting && typeof map.lighting === "object" ? map.lighting : {};
    return {
      mode: ["visible", "hidden", "dynamic"].includes(lighting.mode) ? lighting.mode : DEFAULT_LIGHTING_MODE,
      dimAlpha: clamp(Number(lighting.dimAlpha) || DEFAULT_DIM_LIGHT_ALPHA, 0, 0.95),
      darkvisionTint: normalizeTerrainColor(lighting.darkvisionTint || DEFAULT_DARKVISION_TINT),
      darkvisionAlpha: clamp(Number(lighting.darkvisionAlpha) || DEFAULT_DARKVISION_TINT_ALPHA, 0, 0.95),
      sources: Array.isArray(lighting.sources) ? lighting.sources : [],
    };
  }

  function lightingSources(map = activeMap()) {
    return lightingSettings(map).sources;
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

  function terrainLayers(map = activeMap()) {
    return map && Array.isArray(map.terrainLayers) ? map.terrainLayers : [];
  }

  function terrainLayerById(layerId, map = activeMap()) {
    const wanted = String(layerId || "");
    return terrainLayers(map).find((layer) => layer.id === wanted) || null;
  }

  function selectedTerrainLayer() {
    return terrainLayerById(state.terrain.activeLayerId);
  }

  function resolvedTerrainDefaults() {
    return (state.snapshot && state.snapshot.terrain && state.snapshot.terrain.resolvedTextureDefaults) || {};
  }

  function terrainCategories() {
    return (state.terrainCatalog && state.terrainCatalog.categories) || [];
  }

  function terrainAssetById(textureId) {
    const wanted = String(textureId || "");
    if (!wanted) {
      return null;
    }
    for (const category of terrainCategories()) {
      const match = (category.assets || []).find((asset) => asset.id === wanted);
      if (match) {
        return match;
      }
    }
    return null;
  }

  function defaultTextureForCategory(categoryId) {
    const safeCategoryId = String(categoryId || "");
    return safeCategoryId ? resolvedTerrainDefaults()[safeCategoryId] || "" : "";
  }

  function ensureActiveTerrainLayer() {
    const map = activeMap();
    if (!map) {
      state.terrain.activeLayerId = null;
      return null;
    }
    const layers = terrainLayers(map);
    if (layers.length === 0) {
      state.terrain.activeLayerId = null;
      return null;
    }
    const existing = terrainLayerById(state.terrain.activeLayerId, map);
    if (existing) {
      return existing;
    }
    const nextLayer =
      layers.find((layer) => layer.type === "background") ||
      layers.find((layer) => layer.type === "foreground") ||
      layers[0];
    state.terrain.activeLayerId = nextLayer ? nextLayer.id : null;
    return nextLayer || null;
  }

  function setTerrainActiveLayer(layerId) {
    const layer = terrainLayerById(layerId);
    if (!layer) {
      return;
    }
    state.terrain.activeLayerId = layer.id;
    renderTerrainEditor();
  }

  function selectedTerrainTool() {
    return state.terrain.activeTool || "brush";
  }

  function normalizeTerrainColor(value) {
    const text = String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(text) ? text : "#7f8c4a";
  }

  function updateTerrainOpacityLabel() {
    if (!elements.terrainOpacity || !elements.terrainOpacityValue) {
      return;
    }
    const opacity = clamp(Number(elements.terrainOpacity.value) || 1, 0.05, 1);
    elements.terrainOpacityValue.textContent = `${Math.round(opacity * 100)}%`;
  }

  function updateTerrainOptionVisibility() {
    const layer = ensureActiveTerrainLayer();
    const isForeground = Boolean(layer && layer.type === "foreground");
    const showDoorOptions = isForeground && selectedTerrainTool() === "door";
    if (elements.terrainForegroundOptions) {
      elements.terrainForegroundOptions.classList.toggle("tt-hidden", !isForeground);
    }
    if (elements.terrainDoorOptions) {
      elements.terrainDoorOptions.classList.toggle("tt-hidden", !showDoorOptions);
    }
    if (elements.mapBackgroundInput) {
      elements.mapBackgroundInput.disabled = !(layer && layer.type === "background");
    }
  }

  function setTerrainTool(toolKey) {
    const normalized = ["brush", "eraser", "bucket", "line", "rectangle", "ellipse", "door"].includes(toolKey)
      ? toolKey
      : "brush";
    state.terrain.activeTool = normalized;
    if (elements.terrainToolGroup) {
      elements.terrainToolGroup.querySelectorAll(".tt-seg").forEach((btn) => {
        btn.classList.toggle("tt-seg-active", btn.dataset.value === normalized);
      });
    }
    state.terrain.previewShape = null;
    updateTerrainOptionVisibility();
    renderTexturePalette();
    renderMeasurementOverlay();
  }

  function setTerrainBrushSelection(selection) {
    const next = selection && typeof selection === "object" ? selection : {};
    if (next.kind === "color") {
      state.terrain.brush = {
        kind: "color",
        color: normalizeTerrainColor(next.color || state.terrain.brush.color),
        textureId: "",
        categoryId: "uniform-color",
      };
    } else {
      const categoryId = String(next.categoryId || state.terrain.brush.categoryId || "");
      const textureId = String(next.textureId || defaultTextureForCategory(categoryId) || "");
      state.terrain.brush = {
        kind: "texture",
        textureId,
        categoryId,
        color: state.terrain.brush.color || "#7f8c4a",
      };
    }
    renderTexturePalette();
  }

  function cloneTerrainTile(tile) {
    return tile ? JSON.parse(JSON.stringify(tile)) : null;
  }

  function tileFingerprint(tile) {
    return JSON.stringify(tile || null);
  }

  function getLayerCell(layer, x, y) {
    if (!layer || !Array.isArray(layer.cells)) {
      return null;
    }
    const row = layer.cells[y];
    return Array.isArray(row) ? row[x] || null : null;
  }

  function setLayerCell(layer, x, y, tile) {
    if (!layer || !Array.isArray(layer.cells) || !Array.isArray(layer.cells[y])) {
      return;
    }
    layer.cells[y][x] = cloneTerrainTile(tile);
  }

  function topTerrainCellAt(x, y, map = activeMap()) {
    const layers = terrainLayers(map);
    for (let index = layers.length - 1; index >= 0; index -= 1) {
      const layer = layers[index];
      if (!layer || layer.visible === false) {
        continue;
      }
      const tile = getLayerCell(layer, x, y);
      if (tile) {
        return { layer, tile };
      }
      if (layer.backgroundImageDataUrl) {
        return { layer, tile: { kind: "image", alpha: 1 } };
      }
    }
    return null;
  }

  function terrainBlockerFlagsAt(x, y, map = activeMap()) {
    const flags = {
      movement: false,
      vision: false,
      light: false,
    };
    const layers = terrainLayers(map);
    for (let index = layers.length - 1; index >= 0; index -= 1) {
      const layer = layers[index];
      if (!layer || layer.visible === false || layer.type !== "foreground") {
        continue;
      }
      const tile = getLayerCell(layer, x, y);
      if (!tile) {
        continue;
      }
      if (tile.kind === "door") {
        if (!tile.doorOpen) {
          if (tile.blocksMovement !== false) {
            flags.movement = true;
          }
          if (tile.blocksVision !== false) {
            flags.vision = true;
          }
          if (tile.blocksLight !== false) {
            flags.light = true;
          }
        }
      } else {
        flags.movement = flags.movement || tile.blocksMovement === true;
        flags.vision = flags.vision || tile.blocksVision === true;
        flags.light = flags.light || tile.blocksLight === true;
      }
      if (flags.movement && flags.vision && flags.light) {
        break;
      }
    }
    return flags;
  }

  function currentTerrainBrushTile(layer = selectedTerrainLayer()) {
    if (!layer) {
      return null;
    }
    const opacity = clamp(Number(state.terrain.opacity) || 1, 0.05, 1);
    if (selectedTerrainTool() === "eraser") {
      return null;
    }
    if (selectedTerrainTool() === "door") {
      if (layer.type !== "foreground") {
        return null;
      }
      const textureId =
        state.terrain.brush.kind === "texture"
          ? String(state.terrain.brush.textureId || "")
          : "";
      return {
        kind: "door",
        textureId,
        alpha: opacity,
        blocksMovement: true,
        blocksVision: Boolean(state.terrain.foregroundRules.blocksVision),
        blocksLight: Boolean(state.terrain.foregroundRules.blocksLight),
        doorLocked: state.terrain.doorState === "locked",
        doorOpen: state.terrain.doorState === "open",
      };
    }
    const base = {
      alpha: opacity,
      blocksMovement: layer.type === "foreground" ? Boolean(state.terrain.foregroundRules.blocksMovement) : false,
      blocksVision: layer.type === "foreground" ? Boolean(state.terrain.foregroundRules.blocksVision) : false,
      blocksLight: layer.type === "foreground" ? Boolean(state.terrain.foregroundRules.blocksLight) : false,
    };
    if (state.terrain.brush.kind === "color") {
      return {
        kind: "color",
        color: normalizeTerrainColor(state.terrain.brush.color),
        ...base,
      };
    }
    const textureId =
      state.terrain.brush.textureId ||
      defaultTextureForCategory(state.terrain.brush.categoryId) ||
      defaultTextureForCategory("Ground");
    if (!textureId) {
      return null;
    }
    return {
      kind: "texture",
      textureId,
      ...base,
    };
  }

  function paintChangeMapSet(changeMap, x, y, tile, map = activeMap()) {
    if (!map || x < 0 || y < 0 || x >= map.cols || y >= map.rows) {
      return;
    }
    changeMap.set(`${x},${y}`, { x, y, tile: cloneTerrainTile(tile) });
  }

  function brushCellsAt(centerX, centerY, size, map = activeMap()) {
    const results = [];
    const safeSize = Math.max(1, Number.parseInt(size, 10) || 1);
    const radius = safeSize - 1;
    if (radius <= 0) {
      return [{ x: centerX, y: centerY }];
    }
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (dx * dx + dy * dy > radius * radius + radius * 0.5) {
          continue;
        }
        const x = centerX + dx;
        const y = centerY + dy;
        if (!map || x < 0 || y < 0 || x >= map.cols || y >= map.rows) {
          continue;
        }
        results.push({ x, y });
      }
    }
    return results;
  }

  function linePoints(x0, y0, x1, y1) {
    const points = [];
    let currentX = x0;
    let currentY = y0;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      points.push({ x: currentX, y: currentY });
      if (currentX === x1 && currentY === y1) {
        break;
      }
      const e2 = err * 2;
      if (e2 > -dy) {
        err -= dy;
        currentX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currentY += sy;
      }
    }
    return points;
  }

  function applyCellsToChangeMap(changeMap, cells, tile, size = 1, map = activeMap()) {
    cells.forEach((cell) => {
      brushCellsAt(cell.x, cell.y, size, map).forEach((brushCell) => {
        paintChangeMapSet(changeMap, brushCell.x, brushCell.y, tile, map);
      });
    });
  }

  function rectangleCells(start, end, filled, lineWidth, map = activeMap()) {
    const cells = [];
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const width = Math.max(1, Number.parseInt(lineWidth, 10) || 1);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const onBorder =
          x - minX < width ||
          maxX - x < width ||
          y - minY < width ||
          maxY - y < width;
        if ((filled || onBorder) && (!map || (x >= 0 && y >= 0 && x < map.cols && y < map.rows))) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }

  function ellipseCells(start, end, filled, lineWidth, map = activeMap()) {
    const cells = [];
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const rx = Math.max(0.5, (maxX - minX + 1) / 2);
    const ry = Math.max(0.5, (maxY - minY + 1) / 2);
    const cx = minX + rx - 0.5;
    const cy = minY + ry - 0.5;
    const edgeWidth = Math.max(1, Number.parseInt(lineWidth, 10) || 1) / Math.max(rx, ry, 1);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const distance = dx * dx + dy * dy;
        const inside = distance <= 1;
        const nearEdge = distance >= Math.max(0, 1 - edgeWidth * 2);
        if (((filled && inside) || (!filled && inside && nearEdge)) && (!map || (x >= 0 && y >= 0 && x < map.cols && y < map.rows))) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }

  function contiguousFillCells(layer, startX, startY, replacementTile, map = activeMap()) {
    const results = [];
    if (!layer || !map) {
      return results;
    }
    const targetFingerprint = tileFingerprint(getLayerCell(layer, startX, startY));
    const replacementFingerprint = tileFingerprint(replacementTile);
    if (targetFingerprint === replacementFingerprint) {
      return results;
    }
    const queue = [{ x: startX, y: startY }];
    const visited = new Set();
    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.x},${current.y}`;
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);
      if (tileFingerprint(getLayerCell(layer, current.x, current.y)) !== targetFingerprint) {
        continue;
      }
      results.push(current);
      [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ].forEach((next) => {
        if (next.x < 0 || next.y < 0 || next.x >= map.cols || next.y >= map.rows) {
          return;
        }
        queue.push(next);
      });
    }
    return results;
  }

  function applyTerrainChangesLocally(layerId, changes) {
    const layer = terrainLayerById(layerId);
    if (!layer || !Array.isArray(changes)) {
      return;
    }
    changes.forEach((change) => {
      setLayerCell(layer, change.x, change.y, change.tile);
    });
    scheduleTerrainCanvasRender();
  }

  function flushPendingTerrainChanges() {
    if (state.terrain.syncTimer) {
      clearTimeout(state.terrain.syncTimer);
      state.terrain.syncTimer = null;
    }
    if (state.terrain.pendingChanges.size === 0) {
      return;
    }
    const grouped = new Map();
    state.terrain.pendingChanges.forEach((change) => {
      if (!grouped.has(change.layerId)) {
        grouped.set(change.layerId, []);
      }
      grouped.get(change.layerId).push({
        x: change.x,
        y: change.y,
        tile: cloneTerrainTile(change.tile),
      });
    });
    state.terrain.pendingChanges.clear();
    grouped.forEach((ops, layerId) => {
      emit("terrain:applyOps", { layerId, ops });
    });
  }

  function queueTerrainChanges(layerId, changes, flushNow = false) {
    if (!Array.isArray(changes) || changes.length === 0) {
      return;
    }
    changes.forEach((change) => {
      state.terrain.pendingChanges.set(`${layerId}:${change.x},${change.y}`, {
        layerId,
        x: change.x,
        y: change.y,
        tile: cloneTerrainTile(change.tile),
      });
    });
    if (flushNow) {
      flushPendingTerrainChanges();
      return;
    }
    if (state.terrain.syncTimer) {
      clearTimeout(state.terrain.syncTimer);
    }
    state.terrain.syncTimer = setTimeout(() => {
      state.terrain.syncTimer = null;
      flushPendingTerrainChanges();
    }, 90);
  }

  function applyBrushAtCell(layer, x, y) {
    const changeMap = new Map();
    const tile = currentTerrainBrushTile(layer);
    if (tile === null && selectedTerrainTool() !== "eraser") {
      return [];
    }
    applyCellsToChangeMap(changeMap, [{ x, y }], tile, state.terrain.brushSize);
    return Array.from(changeMap.values());
  }

  function applyStrokeSegment(layer, fromCell, toCell) {
    const changeMap = new Map();
    const tile = currentTerrainBrushTile(layer);
    if (tile === null && selectedTerrainTool() !== "eraser") {
      return [];
    }
    applyCellsToChangeMap(
      changeMap,
      linePoints(fromCell.x, fromCell.y, toCell.x, toCell.y),
      tile,
      state.terrain.brushSize
    );
    return Array.from(changeMap.values());
  }

  function applyBucketAtCell(layer, x, y) {
    const tile = currentTerrainBrushTile(layer);
    if (tile === null) {
      return [];
    }
    return contiguousFillCells(layer, x, y, tile).map((cell) => ({
      x: cell.x,
      y: cell.y,
      tile,
    }));
  }

  function buildShapeChanges(layer, stroke) {
    if (!layer || !stroke) {
      return [];
    }
    const changeMap = new Map();
    const lineWidth = Math.max(1, Number.parseInt(state.terrain.lineWidth, 10) || 1);
    const fillShapes = Boolean(state.terrain.shapeFilled);
    const tile = currentTerrainBrushTile(layer);
    if (tile === null) {
      return [];
    }
    if (stroke.tool === "line") {
      applyCellsToChangeMap(changeMap, linePoints(stroke.start.x, stroke.start.y, stroke.end.x, stroke.end.y), tile, lineWidth);
    } else if (stroke.tool === "rectangle") {
      applyCellsToChangeMap(changeMap, rectangleCells(stroke.start, stroke.end, fillShapes, lineWidth), tile, 1);
    } else if (stroke.tool === "ellipse") {
      applyCellsToChangeMap(changeMap, ellipseCells(stroke.start, stroke.end, fillShapes, lineWidth), tile, 1);
    }
    return Array.from(changeMap.values());
  }

  function stopPaintDrag() {
    const stroke = state.terrain.activeStroke;
    if (stroke && stroke.kind === "shape") {
      const changes = buildShapeChanges(terrainLayerById(stroke.layerId), stroke);
      applyTerrainChangesLocally(stroke.layerId, changes);
      queueTerrainChanges(stroke.layerId, changes, true);
    } else if (stroke && stroke.layerId) {
      flushPendingTerrainChanges();
    }
    state.paintDrag.active = false;
    state.paintDrag.paintedCells.clear();
    state.terrain.activeStroke = null;
    state.terrain.previewShape = null;
    renderMeasurementOverlay();
  }

  function beginTerrainPaint(x, y) {
    if (!isPaintModeActive()) {
      return false;
    }
    const layer = ensureActiveTerrainLayer();
    if (!layer) {
      return false;
    }
    const tool = selectedTerrainTool();
    if (tool === "door" && layer.type !== "foreground") {
      setStatus("Doors can only be painted on foreground layers.", true);
      return false;
    }
    state.paintDrag.active = true;
    state.paintDrag.paintedCells.clear();
    if (tool === "bucket") {
      const changes = applyBucketAtCell(layer, x, y);
      applyTerrainChangesLocally(layer.id, changes);
      queueTerrainChanges(layer.id, changes, true);
      state.paintDrag.active = false;
      return true;
    }
    if (["line", "rectangle", "ellipse"].includes(tool)) {
      if (!currentTerrainBrushTile(layer)) {
        return false;
      }
      state.terrain.activeStroke = {
        kind: "shape",
        tool,
        layerId: layer.id,
        start: { x, y },
        end: { x, y },
      };
      state.terrain.previewShape = {
        tool,
        start: { x, y },
        end: { x, y },
      };
      renderMeasurementOverlay();
      return true;
    }
    const changes = applyBrushAtCell(layer, x, y);
    if (changes.length === 0) {
      state.paintDrag.active = false;
      return false;
    }
    applyTerrainChangesLocally(layer.id, changes);
    queueTerrainChanges(layer.id, changes);
    state.terrain.activeStroke = {
      kind: "paint",
      tool,
      layerId: layer.id,
      lastCell: { x, y },
    };
    state.paintDrag.paintedCells.add(`${x},${y}`);
    return true;
  }

  function paintCellIfNeeded(x, y) {
    if (!isPaintModeActive()) {
      return false;
    }
    const layer = ensureActiveTerrainLayer();
    if (!layer) {
      return false;
    }
    if (["line", "rectangle", "ellipse"].includes(selectedTerrainTool())) {
      if (!state.terrain.activeStroke || state.terrain.activeStroke.kind !== "shape") {
        return false;
      }
      state.terrain.activeStroke.end = { x, y };
      state.terrain.previewShape = {
        tool: state.terrain.activeStroke.tool,
        start: state.terrain.activeStroke.start,
        end: { x, y },
      };
      renderMeasurementOverlay();
      return true;
    }
    const stroke = state.terrain.activeStroke;
    if (!stroke || stroke.kind !== "paint") {
      return false;
    }
    const key = `${x},${y}`;
    if (state.paintDrag.paintedCells.has(key)) {
      return false;
    }
    state.paintDrag.paintedCells.add(key);
    const changes = applyStrokeSegment(layer, stroke.lastCell, { x, y });
    stroke.lastCell = { x, y };
    applyTerrainChangesLocally(layer.id, changes);
    queueTerrainChanges(layer.id, changes);
    return true;
  }

  function beginDragSelect(event) {
    if (!activeMap() || !isTokenInteractionAllowed() || isPaintModeActive() || isPlaceModeActive()) {
      return;
    }
    state.lightingUi.tokenInfoTokenId = null;
    state.dragSelect.active = true;
    state.dragSelect.startClientX = event.clientX;
    state.dragSelect.startClientY = event.clientY;
    state.dragSelect.endClientX = event.clientX;
    state.dragSelect.endClientY = event.clientY;
    updateDragSelectBox();
  }

  function updateDragSelect(event) {
    if (!state.dragSelect.active) {
      return;
    }
    state.dragSelect.endClientX = event.clientX;
    state.dragSelect.endClientY = event.clientY;
    updateDragSelectBox();
  }

  function updateDragSelectBox() {
    const box = elements.mapSelectBox;
    if (!box || !elements.mapGridWrap) {
      return;
    }
    const dx = Math.abs(state.dragSelect.endClientX - state.dragSelect.startClientX);
    const dy = Math.abs(state.dragSelect.endClientY - state.dragSelect.startClientY);
    if (dx < 4 && dy < 4) {
      box.classList.add("tt-hidden");
      return;
    }
    box.classList.remove("tt-hidden");
    const rect = elements.mapGridWrap.getBoundingClientRect();
    const scale = clamp(Number(state.mapView.scale) || 1, 0.45, 3.5);
    const x1 = (Math.min(state.dragSelect.startClientX, state.dragSelect.endClientX) - rect.left) / scale;
    const y1 = (Math.min(state.dragSelect.startClientY, state.dragSelect.endClientY) - rect.top) / scale;
    const x2 = (Math.max(state.dragSelect.startClientX, state.dragSelect.endClientX) - rect.left) / scale;
    const y2 = (Math.max(state.dragSelect.startClientY, state.dragSelect.endClientY) - rect.top) / scale;
    box.style.left = `${x1}px`;
    box.style.top = `${y1}px`;
    box.style.width = `${x2 - x1}px`;
    box.style.height = `${y2 - y1}px`;
  }

  function endDragSelect(event) {
    if (!state.dragSelect.active) {
      return;
    }
    state.dragSelect.active = false;
    if (elements.mapSelectBox) {
      elements.mapSelectBox.classList.add("tt-hidden");
    }
    const dx = Math.abs(state.dragSelect.endClientX - state.dragSelect.startClientX);
    const dy = Math.abs(state.dragSelect.endClientY - state.dragSelect.startClientY);
    if (dx < 4 && dy < 4) {
      return;
    }

    const map = activeMap();
    if (!map || !elements.mapGridWrap) {
      return;
    }
    const rect = elements.mapGridWrap.getBoundingClientRect();
    const scale = clamp(Number(state.mapView.scale) || 1, 0.45, 3.5);
    const cellSize = state.tool.cellSize || 40;
    const x1 = (Math.min(state.dragSelect.startClientX, state.dragSelect.endClientX) - rect.left) / scale;
    const y1 = (Math.min(state.dragSelect.startClientY, state.dragSelect.endClientY) - rect.top) / scale;
    const x2 = (Math.max(state.dragSelect.startClientX, state.dragSelect.endClientX) - rect.left) / scale;
    const y2 = (Math.max(state.dragSelect.startClientY, state.dragSelect.endClientY) - rect.top) / scale;
    const col1 = Math.floor(x1 / cellSize);
    const row1 = Math.floor(y1 / cellSize);
    const col2 = Math.floor(x2 / cellSize);
    const row2 = Math.floor(y2 / cellSize);

    const activeLayer = isDm() ? state.tokenLayer : "tokens";

    if (!event || !event.shiftKey) {
      state.selectedTokenIds.clear();
    }
    (map.tokens || []).forEach((token) => {
      if (isDm() && token.layer !== activeLayer) {
        return;
      }
      if (!canCurrentUserControlToken(token)) {
        return;
      }
      if (token.x >= col1 && token.x <= col2 && token.y >= row1 && token.y <= row2) {
        state.selectedTokenIds.add(token.id);
      }
    });
    renderSelectedTokenControls();
    renderMapGrid();
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
    updateInteractionModeUi();
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
    updateInteractionModeUi();
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
    updateInteractionModeUi();
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
    } else if (drawing.type === "ellipse") {
      shape = createSvgElement("ellipse");
      shape.setAttribute("cx", String(drawing.data.cx || 0));
      shape.setAttribute("cy", String(drawing.data.cy || 0));
      shape.setAttribute("rx", String(Math.max(1, Number(drawing.data.rx) || 0)));
      shape.setAttribute("ry", String(Math.max(1, Number(drawing.data.ry) || 0)));
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
    shape.style.fill =
      drawing.fill !== undefined ? drawing.fill : drawing.type === "distance" ? "none" : "";
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

  function renderTerrainPreviewOverlay() {
    if (!elements.mapPreviewLayer || !state.terrain.previewShape) {
      return false;
    }
    const preview = state.terrain.previewShape;
    const cellSize = state.tool.cellSize || 40;
    const color = state.terrain.brush.kind === "color" ? state.terrain.brush.color : "#d9a441";
    if (preview.tool === "line") {
      renderShapeInLayer(
        elements.mapPreviewLayer,
        {
          type: "distance",
          color,
          data: {
            x1: preview.start.x * cellSize + cellSize / 2,
            y1: preview.start.y * cellSize + cellSize / 2,
            x2: preview.end.x * cellSize + cellSize / 2,
            y2: preview.end.y * cellSize + cellSize / 2,
          },
        },
        true
      );
      return true;
    }
    if (preview.tool === "rectangle") {
      renderShapeInLayer(
        elements.mapPreviewLayer,
        {
          type: "rectangle",
          color,
          fill: state.terrain.shapeFilled ? "" : "none",
          data: {
            x: Math.min(preview.start.x, preview.end.x) * cellSize,
            y: Math.min(preview.start.y, preview.end.y) * cellSize,
            width: (Math.abs(preview.end.x - preview.start.x) + 1) * cellSize,
            height: (Math.abs(preview.end.y - preview.start.y) + 1) * cellSize,
          },
        },
        true
      );
      return true;
    }
    if (preview.tool === "ellipse") {
      const minX = Math.min(preview.start.x, preview.end.x) * cellSize;
      const minY = Math.min(preview.start.y, preview.end.y) * cellSize;
      const width = (Math.abs(preview.end.x - preview.start.x) + 1) * cellSize;
      const height = (Math.abs(preview.end.y - preview.start.y) + 1) * cellSize;
      renderShapeInLayer(
        elements.mapPreviewLayer,
        {
          type: "ellipse",
          color,
          fill: state.terrain.shapeFilled ? "" : "none",
          data: {
            cx: minX + width / 2,
            cy: minY + height / 2,
            rx: Math.max(2, width / 2),
            ry: Math.max(2, height / 2),
          },
        },
        true
      );
      return true;
    }
    return false;
  }

  function renderDoorLockFlash() {
    if (!elements.mapPreviewLayer || !state.terrain.lockFlash) {
      return false;
    }
    if (Date.now() > state.terrain.lockFlash.expiresAt) {
      state.terrain.lockFlash = null;
      return false;
    }
    const cellSize = state.tool.cellSize || 40;
    const text = createSvgElement("text");
    text.setAttribute("x", String(state.terrain.lockFlash.x * cellSize + cellSize / 2));
    text.setAttribute("y", String(state.terrain.lockFlash.y * cellSize + cellSize / 2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("fill", "#f7d56f");
    text.setAttribute("font-size", String(Math.max(14, Math.floor(cellSize * 0.34))));
    text.textContent = "🔒";
    elements.mapPreviewLayer.appendChild(text);
    return true;
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

    if (elements.mapPreviewLayer) {
      elements.mapPreviewLayer.innerHTML = "";
    }
    const hasTerrainPreview = renderTerrainPreviewOverlay();
    const hasLockFlash = renderDoorLockFlash();

    if (!state.tool.preview) {
      if (elements.mapMeasureLabel) {
        elements.mapMeasureLabel.classList.add("tt-hidden");
      }
      if (elements.measureReadout) {
        if (hasTerrainPreview) {
          elements.measureReadout.textContent = `Terrain preview: ${selectedTerrainTool()}`;
        } else {
          const selectedLabel = state.tool.selectedDrawingId ? " | Drawing selected" : "";
          elements.measureReadout.textContent = `Tool: ${activeTool()} (${activeDistanceMode()})${selectedLabel}`;
        }
      }
      if (!hasTerrainPreview && !hasLockFlash && elements.mapPreviewLayer) {
        elements.mapPreviewLayer.innerHTML = "";
      }
      return;
    }

    if (elements.mapPreviewLayer) {
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

  function updateLightingLabels() {
    if (elements.lightingDimAmount && elements.lightingDimAmountValue) {
      const dim = clamp(Number(elements.lightingDimAmount.value) || DEFAULT_DIM_LIGHT_ALPHA, 0, 0.95);
      elements.lightingDimAmountValue.textContent = `${Math.round(dim * 100)}%`;
    }
    if (elements.lightingDarkvisionStrength && elements.lightingDarkvisionStrengthValue) {
      const tint = clamp(
        Number(elements.lightingDarkvisionStrength.value) || DEFAULT_DARKVISION_TINT_ALPHA,
        0,
        0.95
      );
      elements.lightingDarkvisionStrengthValue.textContent = `${Math.round(tint * 100)}%`;
    }
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
    const lightingMode = (elements.lightingMode && elements.lightingMode.value) || lightingSettings(map).mode;
    const dimLightAlpha = clamp(
      Number.parseFloat((elements.lightingDimAmount && elements.lightingDimAmount.value) || lightingSettings(map).dimAlpha),
      0,
      0.95
    );
    const darkvisionTint =
      (elements.lightingDarkvisionTint && elements.lightingDarkvisionTint.value) || lightingSettings(map).darkvisionTint;
    const darkvisionTintAlpha = clamp(
      Number.parseFloat(
        (elements.lightingDarkvisionStrength && elements.lightingDarkvisionStrength.value) ||
          lightingSettings(map).darkvisionAlpha
      ),
      0,
      0.95
    );
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
      lightingMode,
      dimLightAlpha,
      darkvisionTint,
      darkvisionTintAlpha,
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
    if (state.leftPanelCollapsed && isMapToolMenu(state.activeMenu)) {
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
    stopPaintDrag();
    state.selectedPlacement = null;
    state.lightingUi.pendingPlacement = null;
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
      { panel: "tokens", button: elements.railTokens },
      { panel: "terrain", button: elements.railTerrain },
      { panel: "lighting", button: elements.railLighting },
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
    if (isMapToolMenu(previousPanel) && menuKey !== previousPanel && !isMapToolMenu(menuKey)) {
      resetMapInteractionMode();
    }
    applyMenuVisibility();
    if (state.snapshot) {
      renderMapGrid();
    }
  }

  function applyMenuVisibility() {
    let panel = state.activeMenu || "character";
    if ((panel === "terrain" || panel === "lighting") && !isDm()) {
      resetMapInteractionMode();
      panel = isAuthenticated() ? "tokens" : "account";
      state.activeMenu = panel;
    }
    if (!isAuthenticated() && panel !== "account") {
      if (isMapToolMenu(panel)) {
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
      if (entry.panel === "terrain" || entry.panel === "lighting") {
        entry.button.classList.toggle("tt-hidden", !isDm());
      }
      if (entry.panel === "tokens") {
        entry.button.classList.toggle("tt-hidden", !isAuthenticated());
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
        remove.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" width="13" height="13" aria-hidden="true"><path d="M4 5h12" stroke-linecap="round"/><path d="M8 5V3h4v2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 5l1 12h6l1-12" stroke-linecap="round" stroke-linejoin="round"/><line x1="9" y1="9" x2="9" y2="15" stroke-linecap="round"/><line x1="11" y1="9" x2="11" y2="15" stroke-linecap="round"/></svg>';
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

  function openTerrainCategoryModal(categoryId) {
    state.terrain.categoryModalCategoryId = String(categoryId || "");
    renderTerrainCategoryModal();
    if (elements.terrainCategoryModal) {
      elements.terrainCategoryModal.classList.remove("tt-hidden");
    }
  }

  function closeTerrainCategoryModal() {
    state.terrain.categoryModalCategoryId = "";
    if (elements.terrainCategoryApplyGlobal) {
      elements.terrainCategoryApplyGlobal.checked = false;
    }
    if (elements.terrainCategoryModal) {
      elements.terrainCategoryModal.classList.add("tt-hidden");
    }
  }

  function openTerrainColorModal() {
    if (elements.terrainColorInput) {
      elements.terrainColorInput.value = normalizeTerrainColor(state.terrain.brush.color);
    }
    if (elements.terrainColorModal) {
      elements.terrainColorModal.classList.remove("tt-hidden");
    }
  }

  function closeTerrainColorModal() {
    if (elements.terrainColorModal) {
      elements.terrainColorModal.classList.add("tt-hidden");
    }
  }

  function renderTexturePalette() {
    if (!elements.brushGroup) {
      return;
    }
    const categories = terrainCategories();
    elements.brushGroup.innerHTML = "";
    if (categories.length === 0) {
      const placeholder = document.createElement("div");
      placeholder.className = "tt-inline-value";
      placeholder.textContent = "Texture catalog unavailable.";
      elements.brushGroup.appendChild(placeholder);
      return;
    }

    const colorButton = document.createElement("div");
    colorButton.className = "tt-texture-card";
    if (state.terrain.brush.kind === "color") {
      colorButton.classList.add("is-active");
    }
    const colorPreview = document.createElement("div");
    colorPreview.className = "tt-texture-preview tt-texture-color";
    colorPreview.style.backgroundColor = normalizeTerrainColor(state.terrain.brush.color);
    colorButton.appendChild(colorPreview);
    const colorLabel = document.createElement("div");
    colorLabel.className = "tt-texture-label";
    colorLabel.textContent = "Uniform Color";
    colorButton.appendChild(colorLabel);
    colorButton.addEventListener("click", () => {
      setTerrainBrushSelection({
        kind: "color",
        color: state.terrain.brush.color,
      });
    });
    const colorMore = document.createElement("button");
    colorMore.type = "button";
    colorMore.className = "tt-texture-more";
    colorMore.textContent = "+";
    colorMore.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openTerrainColorModal();
    });
    colorButton.appendChild(colorMore);
    elements.brushGroup.appendChild(colorButton);

    categories.forEach((category) => {
      const textureId = defaultTextureForCategory(category.id) || category.defaultTextureId || "";
      const asset = (category.assets || []).find((entry) => entry.id === textureId) || category.assets[0] || null;
      const button = document.createElement("div");
      button.className = "tt-texture-card";
      if (state.terrain.brush.kind === "texture" && state.terrain.brush.categoryId === category.id) {
        button.classList.add("is-active");
      }
      const preview = document.createElement("img");
      preview.className = "tt-texture-preview";
      if (asset) {
        preview.src = asset.previewUrl;
        preview.alt = asset.label;
      }
      button.appendChild(preview);
      const label = document.createElement("div");
      label.className = "tt-texture-label";
      label.textContent = category.label || category.id;
      button.appendChild(label);
      button.addEventListener("click", () => {
        setTerrainBrushSelection({
          kind: "texture",
          categoryId: category.id,
          textureId,
        });
      });
      const more = document.createElement("button");
      more.type = "button";
      more.className = "tt-texture-more";
      more.textContent = "+";
      more.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openTerrainCategoryModal(category.id);
      });
      button.appendChild(more);
      elements.brushGroup.appendChild(button);
    });
  }

  function renderTerrainCategoryModal() {
    if (!elements.terrainCategoryGrid || !elements.terrainCategoryTitle) {
      return;
    }
    const category = terrainCategories().find((entry) => entry.id === state.terrain.categoryModalCategoryId) || null;
    elements.terrainCategoryTitle.textContent = category ? `Choose ${category.label}` : "Choose Texture";
    if (!category) {
      elements.terrainCategoryGrid.innerHTML = "";
      return;
    }
    const activeDefault = defaultTextureForCategory(category.id);
    elements.terrainCategoryGrid.innerHTML = "";
    (category.assets || []).forEach((asset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tt-texture-card";
      if (asset.id === activeDefault) {
        button.classList.add("is-active");
      }
      const preview = document.createElement("img");
      preview.className = "tt-texture-preview";
      preview.src = asset.previewUrl;
      preview.alt = asset.label;
      button.appendChild(preview);
      const label = document.createElement("div");
      label.className = "tt-texture-label";
      label.textContent = asset.label;
      button.appendChild(label);
      button.addEventListener("click", () => {
        emit("terrain:setTextureDefault", {
          categoryId: category.id,
          textureId: asset.id,
          applyToAllCampaigns: Boolean(
            elements.terrainCategoryApplyGlobal && elements.terrainCategoryApplyGlobal.checked
          ),
        });
        setTerrainBrushSelection({
          kind: "texture",
          categoryId: category.id,
          textureId: asset.id,
        });
        if (elements.terrainCategoryApplyGlobal) {
          elements.terrainCategoryApplyGlobal.checked = false;
        }
        closeTerrainCategoryModal();
      });
      elements.terrainCategoryGrid.appendChild(button);
    });
  }

  function renderTerrainLayerList() {
    if (!elements.terrainLayerList) {
      return;
    }
    const map = activeMap();
    const activeLayer = ensureActiveTerrainLayer();
    elements.terrainLayerList.innerHTML = "";
    if (!map) {
      return;
    }
    terrainLayers(map).forEach((layer, index, layers) => {
      const row = document.createElement("div");
      row.className = "tt-list-item tt-terrain-layer-item";
      if (activeLayer && layer.id === activeLayer.id) {
        row.classList.add("is-active");
      }
      if (layer.visible === false) {
        row.classList.add("is-hidden");
      }

      const main = document.createElement("div");
      main.className = "tt-terrain-layer-main";

      const select = document.createElement("button");
      select.type = "button";
      select.className = "tt-terrain-layer-select";
      select.addEventListener("click", () => setTerrainActiveLayer(layer.id));

      const dot = document.createElement("span");
      dot.className = "tt-terrain-layer-dot";
      dot.dataset.type = layer.type || "background";
      select.appendChild(dot);

      const name = document.createElement("span");
      name.textContent = `${layer.name} (${layer.type})`;
      select.appendChild(name);
      main.appendChild(select);

      const actions = document.createElement("div");
      actions.className = "tt-terrain-layer-actions";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.textContent = layer.visible === false ? "Show" : "Hide";
      toggle.addEventListener("click", () => {
        emit("terrain:layerUpdate", {
          layerId: layer.id,
          visible: layer.visible === false,
        });
      });
      actions.appendChild(toggle);

      const up = document.createElement("button");
      up.type = "button";
      up.textContent = "↑";
      up.disabled = index === 0;
      up.addEventListener("click", () => {
        const order = layers.map((entry) => entry.id);
        const swapIndex = index - 1;
        [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
        emit("terrain:layerReorder", { orderedLayerIds: order });
      });
      actions.appendChild(up);

      const down = document.createElement("button");
      down.type = "button";
      down.textContent = "↓";
      down.disabled = index === layers.length - 1;
      down.addEventListener("click", () => {
        const order = layers.map((entry) => entry.id);
        const swapIndex = index + 1;
        [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
        emit("terrain:layerReorder", { orderedLayerIds: order });
      });
      actions.appendChild(down);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Del";
      remove.addEventListener("click", () => {
        if (!window.confirm(`Delete layer ${layer.name}?`)) {
          return;
        }
        emit("terrain:layerDelete", { layerId: layer.id });
      });
      actions.appendChild(remove);

      main.appendChild(actions);
      row.appendChild(main);
      elements.terrainLayerList.appendChild(row);
    });

    if (elements.terrainActiveLayer) {
      elements.terrainActiveLayer.textContent = activeLayer
        ? `${activeLayer.name} (${activeLayer.type})`
        : "No layer selected";
    }
  }

  function renderTerrainEditor() {
    ensureActiveTerrainLayer();
    if (!state.terrain.brush.textureId && terrainCategories().length > 0) {
      const groundCategory = terrainCategories().find((entry) => entry.id === "Ground") || terrainCategories()[0];
      if (groundCategory) {
        setTerrainBrushSelection({
          kind: "texture",
          categoryId: groundCategory.id,
          textureId: defaultTextureForCategory(groundCategory.id) || groundCategory.defaultTextureId,
        });
      }
    }
    if (elements.terrainBrushSize && document.activeElement !== elements.terrainBrushSize) {
      elements.terrainBrushSize.value = String(state.terrain.brushSize || 1);
    }
    if (elements.terrainLineWidth && document.activeElement !== elements.terrainLineWidth) {
      elements.terrainLineWidth.value = String(state.terrain.lineWidth || 1);
    }
    if (elements.terrainOpacity && document.activeElement !== elements.terrainOpacity) {
      elements.terrainOpacity.value = String(state.terrain.opacity || 1);
    }
    if (elements.terrainShapeFilled) {
      elements.terrainShapeFilled.checked = Boolean(state.terrain.shapeFilled);
    }
    if (elements.terrainBlockMovement) {
      elements.terrainBlockMovement.checked = Boolean(state.terrain.foregroundRules.blocksMovement);
    }
    if (elements.terrainBlockVision) {
      elements.terrainBlockVision.checked = Boolean(state.terrain.foregroundRules.blocksVision);
    }
    if (elements.terrainBlockLight) {
      elements.terrainBlockLight.checked = Boolean(state.terrain.foregroundRules.blocksLight);
    }
    if (elements.terrainDoorState) {
      elements.terrainDoorState.value = state.terrain.doorState || "locked";
    }
    updateTerrainOpacityLabel();
    updateTerrainOptionVisibility();
    renderTerrainLayerList();
    renderTexturePalette();
    renderTerrainCategoryModal();
  }

  function activeMapSummaryText(map = activeMap()) {
    return map ? `${map.name} (${map.cols}x${map.rows})` : "No map selected";
  }

  function selectedLightingSource() {
    const sourceId = String(state.lightingUi.selectedSourceId || "");
    if (!sourceId) {
      return null;
    }
    return lightingSources().find((source) => source.id === sourceId) || null;
  }

  function clearLightingSourceSelection({ clearPlacement = true } = {}) {
    state.lightingUi.selectedSourceId = null;
    if (clearPlacement) {
      state.lightingUi.pendingPlacement = null;
    }
    if (elements.lightingSourceId) {
      elements.lightingSourceId.value = "";
    }
    if (elements.lightingSourceName) {
      elements.lightingSourceName.value = "";
    }
    if (elements.lightingSourceBright) {
      elements.lightingSourceBright.value = "20";
    }
    if (elements.lightingSourceDim) {
      elements.lightingSourceDim.value = "20";
    }
    if (elements.lightingSourceColor) {
      elements.lightingSourceColor.value = "#f5c56c";
    }
  }

  function fillLightingSourceForm(source) {
    if (!source) {
      clearLightingSourceSelection();
      return;
    }
    state.lightingUi.selectedSourceId = source.id;
    if (elements.lightingSourceId) {
      elements.lightingSourceId.value = source.id;
    }
    if (elements.lightingSourceName && document.activeElement !== elements.lightingSourceName) {
      elements.lightingSourceName.value = source.name || "";
    }
    if (elements.lightingSourceBright && document.activeElement !== elements.lightingSourceBright) {
      elements.lightingSourceBright.value = String(Number(source.brightRadius) || 0);
    }
    if (elements.lightingSourceDim && document.activeElement !== elements.lightingSourceDim) {
      elements.lightingSourceDim.value = String(Number(source.dimRadius) || 0);
    }
    if (elements.lightingSourceColor && document.activeElement !== elements.lightingSourceColor) {
      elements.lightingSourceColor.value = normalizeTerrainColor(source.color || "#f5c56c");
    }
  }

  function lightingSourceFormPayload() {
    return {
      name: String((elements.lightingSourceName && elements.lightingSourceName.value) || "Light Source").trim() || "Light Source",
      brightRadius: clampLightRadiusFeet(elements.lightingSourceBright && elements.lightingSourceBright.value),
      dimRadius: clampLightRadiusFeet(elements.lightingSourceDim && elements.lightingSourceDim.value),
      color: normalizeTerrainColor(
        (elements.lightingSourceColor && elements.lightingSourceColor.value) || "#f5c56c"
      ),
    };
  }

  function renderConnectedPlayerList() {
    if (!elements.tokenPlayerList) {
      return;
    }
    elements.tokenPlayerList.innerHTML = "";
    if (!isDm()) {
      return;
    }
    const players = connectedUsers().filter((entry) => entry && entry.role === "player");
    if (players.length === 0) {
      const empty = document.createElement("div");
      empty.className = "tt-inline-value";
      empty.textContent = "No players currently joined.";
      elements.tokenPlayerList.appendChild(empty);
      return;
    }
    players.forEach((player) => {
      const row = document.createElement("div");
      row.className = "tt-list-item";
      const ownedCharacters = characters().filter((character) => character.ownerUserId === player.id);
      const characterNames = ownedCharacters.map((character) => character.name).join(", ");
      const wrapper = document.createElement("div");
      const name = document.createElement("div");
      name.textContent = player.username;
      wrapper.appendChild(name);
      const detail = document.createElement("div");
      detail.className = "tt-log-meta";
      detail.textContent = characterNames || "No character tokens yet.";
      wrapper.appendChild(detail);
      row.appendChild(wrapper);
      elements.tokenPlayerList.appendChild(row);
    });
  }

  function renderLightingSourceList() {
    if (!elements.lightingSourceList) {
      return;
    }
    elements.lightingSourceList.innerHTML = "";
    const sources = lightingSources();
    if (sources.length === 0) {
      const empty = document.createElement("div");
      empty.className = "tt-inline-value";
      empty.textContent = "No light sources on this map.";
      elements.lightingSourceList.appendChild(empty);
      return;
    }
    sources.forEach((source) => {
      const item = document.createElement("div");
      item.className = "tt-list-item";
      if (source.id === state.lightingUi.selectedSourceId) {
        item.style.borderColor = "#d9a441";
      }

      const label = document.createElement("div");
      const name = document.createElement("div");
      name.textContent = source.name;
      label.appendChild(name);
      const detail = document.createElement("div");
      detail.className = "tt-log-meta";
      detail.textContent =
        `(${source.x + 1}, ${source.y + 1}) • ${Number(source.brightRadius) || 0} ft bright • ` +
        `${Number(source.dimRadius) || 0} ft dim`;
      label.appendChild(detail);
      item.appendChild(label);

      const controls = document.createElement("div");
      controls.className = "tt-grid2";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => {
        fillLightingSourceForm(source);
        renderLightingEditor();
        renderMapGrid();
      });
      controls.appendChild(editButton);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.className = "tt-danger";
      deleteButton.addEventListener("click", () => {
        emit("lighting:sourceDelete", { sourceId: source.id });
        if (state.lightingUi.selectedSourceId === source.id) {
          clearLightingSourceSelection();
        }
      });
      controls.appendChild(deleteButton);

      item.appendChild(controls);
      elements.lightingSourceList.appendChild(item);
    });
  }

  function renderInlineTokenInfo() {
    if (!elements.tokenInfoInline) {
      return;
    }
    const token = getTokenById(state.lightingUi.tokenInfoTokenId);
    if (!token || !canCurrentUserInspectToken(token)) {
      elements.tokenInfoInline.innerHTML = "";
      return;
    }
    renderStatGrid(elements.tokenInfoInline, tokenInfoPairs(token));
  }

  function renderTokenPanel() {
    const show = isAuthenticated();
    if (elements.tokenCard) {
      elements.tokenCard.classList.toggle("tt-hidden", !show);
    }
    if (!show) {
      return;
    }
    if (elements.tokenActiveMap) {
      elements.tokenActiveMap.textContent = activeMapSummaryText();
    }
    if (elements.layerGroup && elements.layerGroup.parentElement) {
      elements.layerGroup.parentElement.classList.toggle("tt-hidden", !isDm());
    }
    if (elements.tokenPlayerList && elements.tokenPlayerList.parentElement) {
      elements.tokenPlayerList.parentElement.classList.toggle("tt-hidden", !isDm());
    }
    renderConnectedPlayerList();
    renderTokenRoster();
    renderInlineTokenInfo();
    renderSelectedTokenControls();
    setTokenLayer(state.tokenLayer || "tokens");
  }

  function renderLightingEditor() {
    const show = isDm();
    if (elements.lightingCard) {
      elements.lightingCard.classList.toggle("tt-hidden", !show);
    }
    if (!show) {
      return;
    }
    if (elements.lightingActiveMap) {
      elements.lightingActiveMap.textContent = activeMapSummaryText();
    }
    const lighting = lightingSettings();
    if (elements.lightingMode) {
      elements.lightingMode.value = lighting.mode;
    }
    if (elements.lightingDimAmount && document.activeElement !== elements.lightingDimAmount) {
      elements.lightingDimAmount.value = String(lighting.dimAlpha);
    }
    if (elements.lightingDimAmountValue) {
      elements.lightingDimAmountValue.textContent = `${Math.round(lighting.dimAlpha * 100)}%`;
    }
    if (elements.lightingDarkvisionTint && document.activeElement !== elements.lightingDarkvisionTint) {
      elements.lightingDarkvisionTint.value = normalizeTerrainColor(lighting.darkvisionTint);
    }
    if (elements.lightingDarkvisionStrength && document.activeElement !== elements.lightingDarkvisionStrength) {
      elements.lightingDarkvisionStrength.value = String(lighting.darkvisionAlpha);
    }
    updateLightingLabels();
    const selectedSource = selectedLightingSource();
    if (selectedSource) {
      fillLightingSourceForm(selectedSource);
    } else if (state.lightingUi.selectedSourceId) {
      clearLightingSourceSelection({ clearPlacement: false });
    }
    renderLightingSourceList();
  }

  function renderMaps() {
    const show = isDm();
    elements.mapCard.classList.toggle("tt-hidden", !show);
    if (elements.drawingLayerRow) {
      elements.drawingLayerRow.classList.toggle("tt-hidden", !show);
    }
    if (!show) {
      renderTokenPanel();
      renderLightingEditor();
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

    renderTerrainEditor();
    renderTokenPanel();
    renderLightingEditor();
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
    const toolMode = isToolInteractionEnabled() && state.tool.dragging;
    elements.mapGridWrap.classList.toggle("tt-mode-paint", paintMode);
    elements.mapGridWrap.classList.toggle("tt-mode-measure", toolMode);
    if (elements.brushPanel) {
      elements.brushPanel.style.opacity = "";
      elements.brushPanel.style.pointerEvents = "";
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

  function canCurrentUserInspectToken(token) {
    if (!token) {
      return false;
    }
    if (isDm()) {
      return true;
    }
    return canCurrentUserControlToken(token);
  }

  function tokenSourceEntity(token) {
    if (!token) {
      return null;
    }
    if (token.sourceType === "character") {
      return characters().find((character) => character.id === token.sourceId) || null;
    }
    if (token.sourceType === "statblock") {
      return statblocks().find((statblock) => statblock.id === token.sourceId) || null;
    }
    return null;
  }

  function handleLightingCellClick(x, y) {
    if (!isDm()) {
      return;
    }
    const payload = lightingSourceFormPayload();
    emit("lighting:sourceCreate", {
      x,
      y,
      ...payload,
    });
    state.lightingUi.pendingPlacement = payload;
    setStatus(`Placed ${payload.name}.`);
  }

  function placeTokenAt(x, y, placement) {
    if (!placement) {
      return;
    }
    emit("token:place", {
      x,
      y,
      layer: state.tokenLayer,
      ...placement,
    });
  }

  function handleCellClick(x, y) {
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

    const hadTokenInfo = Boolean(state.lightingUi.tokenInfoTokenId);
    state.lightingUi.tokenInfoTokenId = null;

    const mode = activeInteractionMode();

    if (isDm() && mode === "paint") {
      if (hadTokenInfo) {
        renderTokenPanel();
        renderMapGrid();
      }
      return;
    }

    if (mode === "lighting") {
      if (hadTokenInfo) {
        renderTokenPanel();
        renderMapGrid();
      }
      handleLightingCellClick(x, y);
      return;
    }

    if (mode === "place") {
      if (hadTokenInfo) {
        renderTokenPanel();
        renderMapGrid();
      }
      if (!state.selectedPlacement) {
        setStatus("Select a token source first.", true);
        return;
      }
      placeTokenAt(x, y, state.selectedPlacement);
      return;
    }

    if (!isTokenInteractionAllowed()) {
      if (hadTokenInfo) {
        renderTokenPanel();
        renderMapGrid();
      }
      return;
    }

    if (state.selectedTokenIds.size === 1) {
      const tokenId = [...state.selectedTokenIds][0];
      if (hadTokenInfo) {
        renderTokenPanel();
        renderMapGrid();
      }
      emit("token:move", { tokenId, x, y });
      return;
    }

    const topCell = topTerrainCellAt(x, y);
    if (state.selectedTokenIds.size === 0 && topCell && topCell.tile && topCell.tile.kind === "door") {
      if (hadTokenInfo) {
        renderTokenPanel();
        renderMapGrid();
      }
      emit("map:interactDoor", { x, y });
    }

    if (state.selectedTokenIds.size > 1) {
      state.selectedTokenIds.clear();
      renderSelectedTokenControls();
      renderMapGrid();
      return;
    }

    if (hadTokenInfo) {
      renderTokenPanel();
      renderMapGrid();
    }
  }

  function ensureCachedImage(cacheKey, src) {
    const existing = state.terrain.textureImages.get(cacheKey);
    if (existing) {
      return existing.loaded ? existing.image : null;
    }
    const image = new Image();
    const record = { image, loaded: false, error: false };
    state.terrain.textureImages.set(cacheKey, record);
    image.onload = () => {
      record.loaded = true;
      scheduleTerrainCanvasRender();
    };
    image.onerror = () => {
      record.error = true;
      scheduleTerrainCanvasRender();
    };
    image.src = src;
    return null;
  }

  function cachedTextureTile(textureId, cellSize) {
    const asset = terrainAssetById(textureId);
    if (!asset || !asset.previewUrl) {
      return null;
    }
    const cacheKey = `${textureId}:${cellSize}`;
    if (state.terrain.textureTileCache.has(cacheKey)) {
      return state.terrain.textureTileCache.get(cacheKey);
    }
    const image = ensureCachedImage(`texture:${textureId}`, asset.previewUrl);
    if (!image) {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = cellSize;
    canvas.height = cellSize;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    context.drawImage(image, 0, 0, cellSize, cellSize);
    state.terrain.textureTileCache.set(cacheKey, canvas);
    return canvas;
  }

  function drawDoorTile(context, tile, left, top, cellSize) {
    context.save();
    context.globalAlpha = tile.doorOpen ? Math.min(0.45, tile.alpha || 1) : tile.alpha || 1;
    const textureCanvas = tile.textureId ? cachedTextureTile(tile.textureId, cellSize) : null;
    if (textureCanvas) {
      context.drawImage(textureCanvas, left, top, cellSize, cellSize);
    } else {
      const gradient = context.createLinearGradient(left, top, left + cellSize, top + cellSize);
      gradient.addColorStop(0, "#6d4a28");
      gradient.addColorStop(0.5, "#b3804f");
      gradient.addColorStop(1, "#6d4a28");
      context.fillStyle = gradient;
      context.fillRect(left + 1, top + 1, cellSize - 2, cellSize - 2);
    }
    context.fillStyle = "rgba(56, 31, 14, 0.32)";
    context.fillRect(left + 1, top + 1, cellSize - 2, cellSize - 2);
    context.strokeStyle = tile.doorLocked ? "#f5d36a" : "rgba(255,255,255,0.26)";
    context.lineWidth = 1.5;
    context.strokeRect(left + 1.5, top + 1.5, cellSize - 3, cellSize - 3);
    if (tile.doorOpen) {
      context.strokeStyle = "rgba(255,255,255,0.55)";
      context.beginPath();
      context.moveTo(left + 3, top + cellSize - 3);
      context.lineTo(left + cellSize - 3, top + 3);
      context.stroke();
    }
    if (tile.doorLocked) {
      context.fillStyle = "#f7d56f";
      context.font = `${Math.max(12, Math.floor(cellSize * 0.34))}px serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("🔒", left + cellSize / 2, top + cellSize / 2);
    }
    context.restore();
  }

  function drawTerrainTile(context, tile, x, y, cellSize) {
    const left = x * cellSize;
    const top = y * cellSize;
    if (tile.kind === "texture") {
      const textureCanvas = cachedTextureTile(tile.textureId, cellSize);
      context.save();
      context.globalAlpha = tile.alpha === undefined ? 1 : tile.alpha;
      if (textureCanvas) {
        context.drawImage(textureCanvas, left, top, cellSize, cellSize);
      } else {
        context.fillStyle = "rgba(90, 103, 90, 0.65)";
        context.fillRect(left, top, cellSize, cellSize);
      }
      context.restore();
      return;
    }
    if (tile.kind === "color") {
      context.save();
      context.globalAlpha = tile.alpha === undefined ? 1 : tile.alpha;
      context.fillStyle = normalizeTerrainColor(tile.color);
      context.fillRect(left, top, cellSize, cellSize);
      context.restore();
      return;
    }
    if (tile.kind === "door") {
      drawDoorTile(context, tile, left, top, cellSize);
    }
  }

  function scheduleTerrainCanvasRender() {
    if (state.terrain.previewDirty) {
      return;
    }
    state.terrain.previewDirty = true;
    window.requestAnimationFrame(() => {
      state.terrain.previewDirty = false;
      renderTerrainLayer();
    });
  }

  function renderTerrainLayer() {
    const map = activeMap();
    const container = elements.mapTerrainLayer;
    if (!container) {
      return;
    }
    if (!map) {
      container.innerHTML = "";
      state.terrain.layerRenderCache.clear();
      return;
    }

    const cellSize = state.tool.cellSize || 40;
    const width = map.cols * cellSize;
    const height = map.rows * cellSize;
    const validIds = new Set();

    terrainLayers(map).forEach((terrainLayer, index) => {
      validIds.add(terrainLayer.id);
      let entry = state.terrain.layerRenderCache.get(terrainLayer.id);
      if (!entry) {
        const canvas = document.createElement("canvas");
        canvas.className = "tt-terrain-canvas";
        entry = {
          canvas,
          context: canvas.getContext("2d"),
        };
        state.terrain.layerRenderCache.set(terrainLayer.id, entry);
        container.appendChild(canvas);
      }
      if (!entry.context) {
        return;
      }
      if (entry.canvas.width !== width || entry.canvas.height !== height) {
        entry.canvas.width = width;
        entry.canvas.height = height;
      }
      entry.canvas.style.zIndex = String(index + 1);
      entry.canvas.style.display = terrainLayer.visible === false ? "none" : "block";

      const context = entry.context;
      context.clearRect(0, 0, width, height);

      if (terrainLayer.backgroundImageDataUrl) {
        const image = ensureCachedImage(
          `background:${terrainLayer.id}:${terrainLayer.backgroundImageDataUrl}`,
          terrainLayer.backgroundImageDataUrl
        );
        if (image) {
          context.drawImage(image, 0, 0, width, height);
        }
      }

      for (let y = 0; y < map.rows; y += 1) {
        const row = Array.isArray(terrainLayer.cells) ? terrainLayer.cells[y] : null;
        if (!Array.isArray(row)) {
          continue;
        }
        for (let x = 0; x < map.cols; x += 1) {
          const tile = row[x];
          if (!tile) {
            continue;
          }
          drawTerrainTile(context, tile, x, y, cellSize);
        }
      }
    });

    Array.from(state.terrain.layerRenderCache.keys()).forEach((layerId) => {
      if (validIds.has(layerId)) {
        return;
      }
      const entry = state.terrain.layerRenderCache.get(layerId);
      if (entry && entry.canvas && entry.canvas.parentNode === container) {
        entry.canvas.parentNode.removeChild(entry.canvas);
      }
      state.terrain.layerRenderCache.delete(layerId);
    });
  }

  function isTerrainComponentBlockingVision(component) {
    if (!component || component.layerType !== "foreground" || !component.tile) {
      return false;
    }
    if (component.tile.kind === "door") {
      return !component.tile.doorOpen && component.tile.blocksVision !== false;
    }
    return component.tile.blocksVision === true;
  }

  function isTerrainComponentBlockingLight(component) {
    if (!component || component.layerType !== "foreground" || !component.tile) {
      return false;
    }
    if (component.tile.kind === "door") {
      return !component.tile.doorOpen && component.tile.blocksLight !== false;
    }
    return component.tile.blocksLight === true;
  }

  function mapCellIndex(map, x, y) {
    return y * map.cols + x;
  }

  function buildVisibilityBlockers(map) {
    const cacheKey = map ? `${map.id}:${map.updatedAt || ""}:blockers` : "";
    if (state.lightingUi.blockerCacheKey === cacheKey && state.lightingUi.blockerCache) {
      return state.lightingUi.blockerCache;
    }
    const total = map.rows * map.cols;
    const vision = new Uint8Array(total);
    const light = new Uint8Array(total);
    for (let y = 0; y < map.rows; y += 1) {
      for (let x = 0; x < map.cols; x += 1) {
        const index = mapCellIndex(map, x, y);
        const blockers = terrainBlockerFlagsAt(x, y, map);
        if (blockers.vision) {
          vision[index] = 1;
        }
        if (blockers.light) {
          light[index] = 1;
        }
      }
    }
    state.lightingUi.blockerCacheKey = cacheKey;
    state.lightingUi.blockerCache = { vision, light };
    return state.lightingUi.blockerCache;
  }

  function hasLineOfSight(map, originX, originY, targetX, targetY, blockers) {
    if (
      originX < 0 ||
      originY < 0 ||
      originX >= map.cols ||
      originY >= map.rows ||
      targetX < 0 ||
      targetY < 0 ||
      targetX >= map.cols ||
      targetY >= map.rows
    ) {
      return false;
    }
    if (originX === targetX && originY === targetY) {
      return true;
    }

    const dx = targetX - originX;
    const dy = targetY - originY;
    const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let x = originX;
    let y = originY;
    let traversedX = 0;
    let traversedY = 0;

    const blocks = (cellX, cellY) => {
      if (cellX === targetX && cellY === targetY) {
        return false;
      }
      return blockers[mapCellIndex(map, cellX, cellY)] === 1;
    };

    while (traversedX < absDx || traversedY < absDy) {
      const decision = (1 + 2 * traversedX) * absDy - (1 + 2 * traversedY) * absDx;
      if (decision === 0) {
        if (
          (stepX !== 0 && blocks(x + stepX, y)) ||
          (stepY !== 0 && blocks(x, y + stepY))
        ) {
          return false;
        }
        x += stepX;
        y += stepY;
        traversedX += 1;
        traversedY += 1;
      } else if (decision < 0) {
        x += stepX;
        traversedX += 1;
      } else {
        y += stepY;
        traversedY += 1;
      }

      if (x === targetX && y === targetY) {
        return true;
      }
      if (blocks(x, y)) {
        return false;
      }
    }

    return true;
  }

  function collectLightSources(map) {
    const sources = lightingSources(map).map((source) => ({
      id: source.id,
      name: source.name,
      x: Number(source.x) || 0,
      y: Number(source.y) || 0,
      brightRadius: clampLightRadiusFeet(source.brightRadius),
      dimRadius: clampLightRadiusFeet(source.dimRadius),
      color: normalizeTerrainColor(source.color || "#f5c56c"),
      kind: "map",
    }));
    (map.tokens || []).forEach((token) => {
      if (!token || token.layer !== "tokens") {
        return;
      }
      const vision = normalizeTokenVisionConfig(token.vision);
      if (vision.brightRadius <= 0 && vision.dimRadius <= 0) {
        return;
      }
      sources.push({
        id: token.id,
        name: token.name,
        x: Number(token.x) || 0,
        y: Number(token.y) || 0,
        brightRadius: vision.brightRadius,
        dimRadius: vision.dimRadius,
        color: normalizeTerrainColor(vision.auraColor || "#f5c56c"),
        kind: "token",
      });
    });
    return sources;
  }

  function computeIlluminationGrid(map, blockers) {
    const illumination = new Uint8Array(map.rows * map.cols);
    const feetPerCell = feetPerSquare(map);
    collectLightSources(map).forEach((source) => {
      const brightRadiusSquares = source.brightRadius / feetPerCell;
      const totalRadiusSquares = (source.brightRadius + source.dimRadius) / feetPerCell;
      if (totalRadiusSquares <= 0) {
        return;
      }
      const brightSq = brightRadiusSquares * brightRadiusSquares;
      const totalSq = totalRadiusSquares * totalRadiusSquares;
      const minX = Math.max(0, Math.floor(source.x - totalRadiusSquares));
      const maxX = Math.min(map.cols - 1, Math.ceil(source.x + totalRadiusSquares));
      const minY = Math.max(0, Math.floor(source.y - totalRadiusSquares));
      const maxY = Math.min(map.rows - 1, Math.ceil(source.y + totalRadiusSquares));
      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          const dx = x - source.x;
          const dy = y - source.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > totalSq + 0.0001) {
            continue;
          }
          if (!hasLineOfSight(map, source.x, source.y, x, y, blockers)) {
            continue;
          }
          const index = mapCellIndex(map, x, y);
          if (brightRadiusSquares > 0 && distSq <= brightSq + 0.0001) {
            illumination[index] = 2;
          } else {
            illumination[index] = Math.max(illumination[index], 1);
          }
        }
      }
    });
    return illumination;
  }

  function computePlayerVisibility(map) {
    const lighting = lightingSettings(map);
    const total = map.rows * map.cols;
    const visible = new Uint8Array(total);
    if (isDm()) {
      visible.fill(3);
      return { cells: visible, illumination: new Uint8Array(total) };
    }
    if (lighting.mode === "visible") {
      visible.fill(3);
      return { cells: visible, illumination: new Uint8Array(total) };
    }
    if (lighting.mode === "hidden") {
      return { cells: visible, illumination: new Uint8Array(total) };
    }

    const blockers = buildVisibilityBlockers(map);
    const illumination = computeIlluminationGrid(map, blockers.light);
    const viewerTokens = (map.tokens || []).filter(
      (token) => token && token.layer === "tokens" && canCurrentUserControlToken(token)
    );
    if (viewerTokens.length === 0) {
      return { cells: visible, illumination };
    }

    const feetPerCell = feetPerSquare(map);

    viewerTokens.forEach((token) => {
      const vision = normalizeTokenVisionConfig(token.vision);
      const darkvisionSquares = vision.darkvisionRadius / feetPerCell;
      const darkvisionSq = darkvisionSquares * darkvisionSquares;

      for (let y = 0; y < map.rows; y += 1) {
        for (let x = 0; x < map.cols; x += 1) {
          const index = mapCellIndex(map, x, y);
          if (!hasLineOfSight(map, token.x, token.y, x, y, blockers.vision)) {
            continue;
          }
          if (illumination[index] > 0 && hasLineOfSight(map, token.x, token.y, x, y, blockers.light)) {
            visible[index] = Math.max(visible[index], illumination[index] === 2 ? 3 : 2);
            continue;
          }
          if (darkvisionSquares > 0) {
            const dx = x - token.x;
            const dy = y - token.y;
            const distSq = dx * dx + dy * dy;
            if (distSq <= darkvisionSq + 0.0001) {
              visible[index] = Math.max(visible[index], 1);
            }
          }
        }
      }
    });

    return { cells: visible, illumination };
  }

  function visibilityStateForMap(map) {
    const cacheKey =
      map && state.snapshot && state.snapshot.auth
        ? `${map.id}:${map.updatedAt || ""}:${state.snapshot.auth.campaignRole || ""}:${userId() || ""}`
        : "";
    if (state.lightingUi.visibilityCacheKey === cacheKey && state.lightingUi.visibilityCache) {
      return state.lightingUi.visibilityCache;
    }
    const next = map ? computePlayerVisibility(map) : null;
    state.lightingUi.visibilityCacheKey = cacheKey;
    state.lightingUi.visibilityCache = next;
    return next;
  }

  function renderVisionLayer(map, cellSize, visibilityState) {
    if (!elements.mapVisionLayer) {
      return;
    }
    const canvas = elements.mapVisionLayer;
    const width = map.cols * cellSize;
    const height = map.rows * cellSize;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.clearRect(0, 0, width, height);
    if (isDm() || !visibilityState) {
      return;
    }
    const lighting = lightingSettings(map);
    const darkvisionRgb = [
      Number.parseInt(lighting.darkvisionTint.slice(1, 3), 16),
      Number.parseInt(lighting.darkvisionTint.slice(3, 5), 16),
      Number.parseInt(lighting.darkvisionTint.slice(5, 7), 16),
    ];
    for (let y = 0; y < map.rows; y += 1) {
      for (let x = 0; x < map.cols; x += 1) {
        const stateValue = visibilityState.cells[mapCellIndex(map, x, y)];
        const left = x * cellSize;
        const top = y * cellSize;
        if (stateValue === 3) {
          continue;
        }
        if (stateValue === 2) {
          context.fillStyle = `rgba(0, 0, 0, ${lighting.dimAlpha})`;
          context.fillRect(left, top, cellSize, cellSize);
          continue;
        }
        if (stateValue === 1) {
          context.fillStyle = "rgba(0, 0, 0, 0.62)";
          context.fillRect(left, top, cellSize, cellSize);
          context.fillStyle = `rgba(${darkvisionRgb[0]}, ${darkvisionRgb[1]}, ${darkvisionRgb[2]}, ${lighting.darkvisionAlpha})`;
          context.fillRect(left, top, cellSize, cellSize);
          continue;
        }
        context.fillStyle = "rgba(0, 0, 0, 1)";
        context.fillRect(left, top, cellSize, cellSize);
      }
    }
  }

  function renderLightingLayer(map, cellSize) {
    if (!elements.mapLightingLayer) {
      return;
    }
    elements.mapLightingLayer.innerHTML = "";
    elements.mapLightingLayer.style.gridTemplateColumns = `repeat(${map.cols}, ${cellSize}px)`;
    elements.mapLightingLayer.style.gridTemplateRows = `repeat(${map.rows}, ${cellSize}px)`;
    const showLightingLayer = isDm() && state.activeMenu === "lighting";
    if (!showLightingLayer) {
      return;
    }
    const feetPerCell = feetPerSquare(map);
    lightingSources(map).forEach((source) => {
      const holder = document.createElement("div");
      holder.className = "tt-token-holder";
      holder.style.gridColumnStart = String((Number(source.x) || 0) + 1);
      holder.style.gridRowStart = String((Number(source.y) || 0) + 1);
      holder.style.width = `${cellSize}px`;
      holder.style.height = `${cellSize}px`;
      holder.style.position = "relative";

      const totalFeet = (Number(source.brightRadius) || 0) + (Number(source.dimRadius) || 0);
      const totalRadiusSquares = totalFeet / feetPerCell;
      const brightRadiusSquares = (Number(source.brightRadius) || 0) / feetPerCell;
      const color = normalizeTerrainColor(source.color || "#f5c56c");

      if (totalRadiusSquares > 0) {
        const dimRing = document.createElement("div");
        dimRing.className = "tt-light-source-ring";
        dimRing.style.color = color;
        dimRing.style.width = `${Math.max(14, totalRadiusSquares * cellSize * 2)}px`;
        dimRing.style.height = dimRing.style.width;
        holder.appendChild(dimRing);
      }
      if (brightRadiusSquares > 0) {
        const brightRing = document.createElement("div");
        brightRing.className = "tt-light-source-ring";
        brightRing.style.color = color;
        brightRing.style.opacity = "0.62";
        brightRing.style.borderStyle = "solid";
        brightRing.style.width = `${Math.max(10, brightRadiusSquares * cellSize * 2)}px`;
        brightRing.style.height = brightRing.style.width;
        holder.appendChild(brightRing);
      }

      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "tt-light-source-marker";
      if (source.id === state.lightingUi.selectedSourceId) {
        marker.classList.add("is-selected");
      }
      marker.style.color = color;
      marker.style.background = color;
      marker.title = source.name || "Light Source";
      marker.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        fillLightingSourceForm(source);
        renderLightingEditor();
        renderMapGrid();
      });
      holder.appendChild(marker);

      elements.mapLightingLayer.appendChild(holder);
    });
  }

  function renderMapGrid() {
    const map = activeMap();
    elements.mapGridCells.innerHTML = "";
    elements.mapGridTokens.innerHTML = "";
    if (elements.mapLightingLayer) {
      elements.mapLightingLayer.innerHTML = "";
    }

    if (!map) {
      if (elements.mapTerrainLayer) {
        elements.mapTerrainLayer.innerHTML = "";
      }
      if (elements.mapVisionLayer) {
        const context = elements.mapVisionLayer.getContext("2d");
        if (context) {
          context.clearRect(0, 0, elements.mapVisionLayer.width, elements.mapVisionLayer.height);
        }
      }
      state.terrain.layerRenderCache.clear();
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
    if (elements.mapLightingLayer) {
      elements.mapLightingLayer.style.gridTemplateColumns = `repeat(${map.cols}, ${cellSize}px)`;
      elements.mapLightingLayer.style.gridTemplateRows = `repeat(${map.rows}, ${cellSize}px)`;
    }
    if (elements.mapMeasureOverlay) {
      elements.mapMeasureOverlay.setAttribute("viewBox", `0 0 ${map.cols * cellSize} ${map.rows * cellSize}`);
    }
    updateInteractionModeUi();
    ensureActiveTerrainLayer();
    scheduleTerrainCanvasRender();
    const visibilityState = visibilityStateForMap(map);

    for (let y = 0; y < map.rows; y += 1) {
      for (let x = 0; x < map.cols; x += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tt-cell";

        button.addEventListener("mousedown", (event) => {
          if (event.button !== 0) {
            return;
          }
          if (isPaintModeActive()) {
            event.preventDefault();
            state.suppressCellClickUntil = Date.now() + 250;
            beginTerrainPaint(x, y);
            return;
          }
          if (isLightingModeActive()) {
            return;
          }
          if (canStartMeasureDrag(event)) {
            event.preventDefault();
            beginMeasureDrag(x, y, cellSize);
            renderMeasurementOverlay();
            return;
          }
          if (isTokenInteractionAllowed()) {
            event.preventDefault();
            beginDragSelect(event);
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

        button.addEventListener("click", () => handleCellClick(x, y));
        if (isDm()) {
          button.addEventListener("dragover", (event) => {
            if (state.activeMenu !== "tokens") {
              return;
            }
            event.preventDefault();
          });
          button.addEventListener("drop", (event) => {
            if (state.activeMenu !== "tokens") {
              return;
            }
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
      }
    }

    map.tokens.forEach((token) => {
      const tokenVision = normalizeTokenVisionConfig(token.vision);
      const cellState = visibilityState ? visibilityState.cells[mapCellIndex(map, token.x, token.y)] : 3;
      const isVisibleToViewer = isDm() || cellState > 0;
      const holder = document.createElement("div");
      holder.className = "tt-token-holder";
      holder.style.gridColumnStart = String(token.x + 1);
      holder.style.gridRowStart = String(token.y + 1);
      holder.style.width = `${cellSize}px`;
      holder.style.height = `${cellSize}px`;
      holder.style.position = "relative";
      const canClickToken = isVisibleToViewer && canCurrentUserInspectToken(token) && isTokenInteractionAllowed();
      holder.style.pointerEvents = canClickToken ? "auto" : "none";

      if (tokenVision.auraRadius > 0 && isVisibleToViewer) {
        const aura = document.createElement("div");
        aura.className = "tt-token-aura";
        aura.style.color = normalizeTerrainColor(tokenVision.auraColor || DEFAULT_TOKEN_AURA_COLOR);
        aura.style.width = `${Math.max(12, (tokenVision.auraRadius / feetPerSquare(map)) * cellSize * 2)}px`;
        aura.style.height = aura.style.width;
        holder.appendChild(aura);
      }

      const tokenEl = document.createElement("div");
      tokenEl.className = "tt-token";
      if (token.layer === "gm") {
        tokenEl.classList.add("tt-token-gm");
        tokenEl.style.setProperty(
          "--gm-token-opacity",
          String(clamp(Number(map.gmTokenOpacity) || 0.55, 0.1, 1))
        );
      }
      if (state.selectedTokenIds.has(token.id)) {
        tokenEl.classList.add("tt-token-selected");
      }
      if (!isVisibleToViewer) {
        tokenEl.classList.add("tt-token-hidden");
      } else if (!isDm() && cellState === 2) {
        tokenEl.classList.add("tt-token-dim");
      } else if (!isDm() && cellState === 1) {
        tokenEl.classList.add("tt-token-darkvision");
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

      tokenEl.addEventListener("mousedown", (event) => {
        if (event.button !== 0 || !isTokenInteractionAllowed() || canStartMeasureDrag(event)) {
          return;
        }
        beginDragSelect(event);
      });

      tokenEl.addEventListener("click", (event) => {
        if ((isToolInteractionEnabled() && state.tool.dragging) || isPaintModeActive() || !isTokenInteractionAllowed()) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (!canCurrentUserInspectToken(token)) {
          return;
        }
        closeTokenInfoModal();
        state.lightingUi.tokenInfoTokenId = token.id;
        if (canCurrentUserControlToken(token)) {
          if (event.shiftKey) {
            if (state.selectedTokenIds.has(token.id)) {
              state.selectedTokenIds.delete(token.id);
            } else {
              state.selectedTokenIds.add(token.id);
            }
          } else {
            if (state.selectedTokenIds.has(token.id) && state.selectedTokenIds.size === 1) {
              state.selectedTokenIds.clear();
            } else {
              state.selectedTokenIds.clear();
              state.selectedTokenIds.add(token.id);
            }
          }
          renderTokenPanel();
          renderMapGrid();
        } else {
          renderTokenPanel();
          renderMapGrid();
        }
      });

      tokenEl.addEventListener("dblclick", (event) => {
        if (
          !isDm() ||
          !isTokenInteractionAllowed() ||
          token.sourceType !== "character" ||
          !token.ownerUserId
        ) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        openTokenConfigModal(token);
      });

      if (canCurrentUserControlToken(token) && isTokenInteractionAllowed()) {
        tokenEl.title = "Click for info and selection, then click a destination tile to move.";
      } else if (canCurrentUserInspectToken(token)) {
        tokenEl.title = "Click for token info.";
      } else {
        tokenEl.title = token.name;
      }

      if (isDm()) {
        holder.addEventListener("dragover", (event) => {
          if (state.activeMenu !== "tokens") {
            return;
          }
          event.preventDefault();
        });
        holder.addEventListener("drop", (event) => {
          if (state.activeMenu !== "tokens") {
            return;
          }
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

      if (state.lightingUi.tokenInfoTokenId === token.id && isVisibleToViewer && canCurrentUserInspectToken(token)) {
        const pairs = tokenInfoPairs(token).slice(0, 4);
        if (pairs.length > 0) {
          const popover = document.createElement("div");
          popover.className = "tt-token-popover";
          pairs.forEach((pair) => {
            const row = document.createElement("div");
            row.className = "tt-token-popover-row";
            const key = document.createElement("span");
            key.className = "tt-token-popover-key";
            key.textContent = pair.key;
            row.appendChild(key);
            const value = document.createElement("span");
            value.className = "tt-token-popover-value";
            value.textContent = String(pair.value);
            row.appendChild(value);
            popover.appendChild(row);
          });
          holder.appendChild(popover);
        }
      }

      holder.appendChild(tokenEl);
      elements.mapGridTokens.appendChild(holder);
    });

    renderLightingLayer(map, cellSize);
    renderVisionLayer(map, cellSize, visibilityState);
    renderMeasurementOverlay();
    applyMapViewTransform();
  }

  function renderTokenRoster() {
    if (!elements.tokenRoster) {
      return;
    }
    if (!isAuthenticated()) {
      elements.tokenRoster.innerHTML = "";
      return;
    }

    elements.tokenRoster.innerHTML = "";

    if (!isDm()) {
      const controlledTokens = ((activeMap() && activeMap().tokens) || []).filter((token) =>
        canCurrentUserControlToken(token)
      );
      if (controlledTokens.length === 0) {
        const empty = document.createElement("div");
        empty.className = "tt-inline-value";
        empty.textContent = "Open the map and click one of your tokens to move it.";
        elements.tokenRoster.appendChild(empty);
        return;
      }
      controlledTokens.forEach((token) => {
        const item = document.createElement("div");
        item.className = "tt-list-item";
        const left = document.createElement("div");
        const name = document.createElement("div");
        name.textContent = token.name;
        left.appendChild(name);
        const detail = document.createElement("div");
        detail.className = "tt-log-meta";
        detail.textContent = `(${token.x + 1}, ${token.y + 1})`;
        left.appendChild(detail);
        item.appendChild(left);
        const selectButton = document.createElement("button");
        selectButton.type = "button";
        selectButton.textContent = state.selectedTokenIds.has(token.id) ? "Selected" : "Select";
        selectButton.addEventListener("click", () => {
          state.lightingUi.tokenInfoTokenId = token.id;
          state.selectedTokenIds.clear();
          state.selectedTokenIds.add(token.id);
          renderTokenPanel();
          renderMapGrid();
        });
        item.appendChild(selectButton);
        elements.tokenRoster.appendChild(item);
      });
      return;
    }

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
      setInteractionMode("place");
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
    if (!isDm() || state.selectedTokenIds.size === 0) {
      elements.selectedTokenControls.classList.add("tt-hidden");
      return;
    }
    const anyValid = [...state.selectedTokenIds].some((id) => getTokenById(id));
    if (!anyValid) {
      state.selectedTokenIds.clear();
      elements.selectedTokenControls.classList.add("tt-hidden");
      return;
    }
    elements.selectedTokenControls.classList.remove("tt-hidden");
  }

  function tokenInfoPairs(token) {
    const entity = tokenSourceEntity(token);
    const parsed = (entity && entity.parsedSheet) || {};
    const currentValues = parsed.currentValues && typeof parsed.currentValues === "object"
      ? parsed.currentValues
      : {};
    const lookup = new Map(Object.keys(currentValues).map((key) => [normalizeLabel(key), currentValues[key]]));
    const readStat = (primary, fallback = "") => {
      if (lookup.has(primary)) {
        return lookup.get(primary);
      }
      if (fallback && lookup.has(fallback)) {
        return lookup.get(fallback);
      }
      return "";
    };
    const vision = normalizeTokenVisionConfig(token && token.vision);
    const pairs = [
      { key: "Current HP", value: readStat("current hp", "hp") },
      { key: "AC", value: readStat("ac") },
      { key: "Current Mana", value: readStat("current mana", "mana") },
      { key: "Speed", value: readStat("speed") || token.movementMax },
      { key: "Initiative", value: token.initiativeMod },
      { key: "Bright Light", value: vision.brightRadius ? `${vision.brightRadius} ft` : "-" },
      { key: "Dim Light", value: vision.dimRadius ? `${vision.dimRadius} ft` : "-" },
      { key: "Darkvision", value: vision.darkvisionRadius ? `${vision.darkvisionRadius} ft` : "-" },
    ];
    return pairs.filter((pair) => pair.value !== "" && pair.value !== undefined && pair.value !== null);
  }

  function openTokenInfoModal(token) {
    if (!elements.tokenInfoModal || !elements.tokenInfoGrid || !elements.tokenInfoTitle) {
      return;
    }
    state.lightingUi.tokenInfoTokenId = token ? token.id : null;
    elements.tokenInfoTitle.textContent = token ? token.name : "Token Info";
    renderStatGrid(elements.tokenInfoGrid, token ? tokenInfoPairs(token) : []);
    elements.tokenInfoModal.classList.remove("tt-hidden");
  }

  function closeTokenInfoModal() {
    state.lightingUi.tokenInfoTokenId = null;
    if (elements.tokenInfoModal) {
      elements.tokenInfoModal.classList.add("tt-hidden");
    }
  }

  function openTokenConfigModal(token) {
    if (!token || !isDm() || !elements.tokenConfigModal) {
      return;
    }
    const vision = normalizeTokenVisionConfig(token.vision);
    state.lightingUi.tokenConfigTokenId = token.id;
    if (elements.tokenConfigTitle) {
      elements.tokenConfigTitle.textContent = `${token.name} Lighting`;
    }
    if (elements.tokenConfigTokenId) {
      elements.tokenConfigTokenId.value = token.id;
    }
    if (elements.tokenConfigBright) {
      elements.tokenConfigBright.value = String(vision.brightRadius || 0);
    }
    if (elements.tokenConfigDim) {
      elements.tokenConfigDim.value = String(vision.dimRadius || 0);
    }
    if (elements.tokenConfigDarkvision) {
      elements.tokenConfigDarkvision.value = String(vision.darkvisionRadius || 0);
    }
    if (elements.tokenConfigAuraRadius) {
      elements.tokenConfigAuraRadius.value = String(vision.auraRadius || 0);
    }
    if (elements.tokenConfigAuraColor) {
      elements.tokenConfigAuraColor.value = normalizeTerrainColor(vision.auraColor || DEFAULT_TOKEN_AURA_COLOR);
    }
    elements.tokenConfigModal.classList.remove("tt-hidden");
  }

  function closeTokenConfigModal() {
    state.lightingUi.tokenConfigTokenId = null;
    if (elements.tokenConfigModal) {
      elements.tokenConfigModal.classList.add("tt-hidden");
    }
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
    renderTerrainLayer();
    renderLogs();
    renderInitiativePanel();
    renderMapAndInitiativeSummary();
    if (state.lightingUi.tokenInfoTokenId && elements.tokenInfoModal && !elements.tokenInfoModal.classList.contains("tt-hidden")) {
      const token = getTokenById(state.lightingUi.tokenInfoTokenId);
      if (token) {
        openTokenInfoModal(token);
      } else {
        closeTokenInfoModal();
      }
    }
    if (
      state.lightingUi.tokenConfigTokenId &&
      elements.tokenConfigModal &&
      !elements.tokenConfigModal.classList.contains("tt-hidden")
    ) {
      const token = getTokenById(state.lightingUi.tokenConfigTokenId);
      if (token) {
        openTokenConfigModal(token);
      } else {
        closeTokenConfigModal();
      }
    }
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
  if (elements.railTokens) {
    elements.railTokens.addEventListener("click", () => {
      setActiveMenu("tokens");
      setLeftPanelCollapsed(false);
    });
  }
  if (elements.railTerrain) {
    elements.railTerrain.addEventListener("click", () => {
      setActiveMenu("terrain");
      setLeftPanelCollapsed(false);
    });
  }
  if (elements.railLighting) {
    elements.railLighting.addEventListener("click", () => {
      setActiveMenu("lighting");
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

  if (elements.mapBackgroundInput) {
    elements.mapBackgroundInput.addEventListener("change", async () => {
      const file = elements.mapBackgroundInput.files && elements.mapBackgroundInput.files[0];
      if (!file) {
        return;
      }
      const layer = selectedTerrainLayer();
      if (!layer || layer.type !== "background") {
        setStatus("Select a background layer first.", true);
        elements.mapBackgroundInput.value = "";
        return;
      }
      try {
        const imageDataUrl = await normalizeMapBackgroundDataUrl(file);
        emit("terrain:importBackground", {
          layerId: layer.id,
          imageDataUrl,
        });
        setStatus(`Background loaded: ${file.name}`);
      } catch (error) {
        setStatus(error.message, true);
      }
      elements.mapBackgroundInput.value = "";
    });
  }

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
        setInteractionMode("place");
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

  if (elements.lightingMode) {
    elements.lightingMode.addEventListener("change", () => {
      scheduleMapAutosave();
      renderMapGrid();
    });
  }
  if (elements.lightingDimAmount) {
    const syncDim = () => {
      updateLightingLabels();
      scheduleMapAutosave();
      renderMapGrid();
    };
    elements.lightingDimAmount.addEventListener("input", syncDim);
    elements.lightingDimAmount.addEventListener("change", syncDim);
  }
  if (elements.lightingDarkvisionTint) {
    elements.lightingDarkvisionTint.addEventListener("input", () => {
      scheduleMapAutosave();
      renderMapGrid();
    });
    elements.lightingDarkvisionTint.addEventListener("change", () => {
      scheduleMapAutosave();
      renderMapGrid();
    });
  }
  if (elements.lightingDarkvisionStrength) {
    const syncDarkvision = () => {
      updateLightingLabels();
      scheduleMapAutosave();
      renderMapGrid();
    };
    elements.lightingDarkvisionStrength.addEventListener("input", syncDarkvision);
    elements.lightingDarkvisionStrength.addEventListener("change", syncDarkvision);
  }
  if (elements.lightingSourceArm) {
    elements.lightingSourceArm.addEventListener("click", () => {
      state.lightingUi.selectedSourceId = null;
      state.lightingUi.pendingPlacement = null;
      if (elements.lightingSourceId) {
        elements.lightingSourceId.value = "";
      }
      renderLightingEditor();
      renderMapGrid();
      setActiveMenu("lighting");
      setStatus("Click the map to keep placing light sources with the current form settings.");
    });
  }
  if (elements.lightingSourceSave) {
    elements.lightingSourceSave.addEventListener("click", () => {
      const source = selectedLightingSource();
      if (!source) {
        setStatus("Select a light source first.", true);
        return;
      }
      emit("lighting:sourceUpdate", {
        sourceId: source.id,
        ...lightingSourceFormPayload(),
      });
    });
  }
  if (elements.lightingSourceClear) {
    elements.lightingSourceClear.addEventListener("click", () => {
      clearLightingSourceSelection();
      renderLightingEditor();
      renderMapGrid();
    });
  }
  if (elements.lightingSourceDelete) {
    elements.lightingSourceDelete.addEventListener("click", () => {
      const source = selectedLightingSource();
      if (!source) {
        setStatus("Select a light source first.", true);
        return;
      }
      emit("lighting:sourceDelete", { sourceId: source.id });
      clearLightingSourceSelection();
    });
  }

  if (elements.terrainToolGroup) {
    elements.terrainToolGroup.addEventListener("click", (event) => {
      const btn = event.target.closest(".tt-seg");
      if (!btn || !btn.dataset.value) {
        return;
      }
      setTerrainTool(btn.dataset.value);
    });
  }

  if (elements.terrainLayerNew) {
    elements.terrainLayerNew.addEventListener("click", () => {
      emit("terrain:layerCreate", {
        type: elements.terrainLayerNewType && elements.terrainLayerNewType.value === "foreground"
          ? "foreground"
          : "background",
      });
    });
  }

  if (elements.terrainBrushSize) {
    elements.terrainBrushSize.addEventListener("change", () => {
      state.terrain.brushSize = clamp(Number.parseInt(elements.terrainBrushSize.value, 10) || 1, 1, 24);
      renderTerrainEditor();
    });
  }

  if (elements.terrainLineWidth) {
    elements.terrainLineWidth.addEventListener("change", () => {
      state.terrain.lineWidth = clamp(Number.parseInt(elements.terrainLineWidth.value, 10) || 1, 1, 24);
      renderTerrainEditor();
    });
  }

  if (elements.terrainOpacity) {
    const syncOpacity = () => {
      state.terrain.opacity = clamp(Number(elements.terrainOpacity.value) || 1, 0.05, 1);
      updateTerrainOpacityLabel();
      renderTerrainEditor();
    };
    elements.terrainOpacity.addEventListener("input", syncOpacity);
    elements.terrainOpacity.addEventListener("change", syncOpacity);
  }

  if (elements.terrainShapeFilled) {
    elements.terrainShapeFilled.addEventListener("change", () => {
      state.terrain.shapeFilled = Boolean(elements.terrainShapeFilled.checked);
    });
  }

  if (elements.terrainBlockMovement) {
    elements.terrainBlockMovement.addEventListener("change", () => {
      state.terrain.foregroundRules.blocksMovement = Boolean(elements.terrainBlockMovement.checked);
    });
  }
  if (elements.terrainBlockVision) {
    elements.terrainBlockVision.addEventListener("change", () => {
      state.terrain.foregroundRules.blocksVision = Boolean(elements.terrainBlockVision.checked);
    });
  }
  if (elements.terrainBlockLight) {
    elements.terrainBlockLight.addEventListener("change", () => {
      state.terrain.foregroundRules.blocksLight = Boolean(elements.terrainBlockLight.checked);
    });
  }
  if (elements.terrainDoorState) {
    elements.terrainDoorState.addEventListener("change", () => {
      state.terrain.doorState = elements.terrainDoorState.value || "locked";
    });
  }

  if (elements.terrainCategoryClose) {
    elements.terrainCategoryClose.addEventListener("click", () => {
      closeTerrainCategoryModal();
    });
  }
  if (elements.terrainColorClose) {
    elements.terrainColorClose.addEventListener("click", () => {
      closeTerrainColorModal();
    });
  }
  if (elements.terrainColorConfirm) {
    elements.terrainColorConfirm.addEventListener("click", () => {
      const color = normalizeTerrainColor(elements.terrainColorInput && elements.terrainColorInput.value);
      state.terrain.brush.color = color;
      setTerrainBrushSelection({ kind: "color", color });
      closeTerrainColorModal();
    });
  }

  document.querySelectorAll("[data-close-modal]").forEach((node) => {
    node.addEventListener("click", () => {
      const modalId = node.getAttribute("data-close-modal");
      if (modalId === "terrain-category-modal") {
        closeTerrainCategoryModal();
      }
      if (modalId === "terrain-color-modal") {
        closeTerrainColorModal();
      }
      if (modalId === "token-info-modal") {
        closeTokenInfoModal();
      }
      if (modalId === "token-config-modal") {
        closeTokenConfigModal();
      }
    });
  });

  if (elements.tokenInfoClose) {
    elements.tokenInfoClose.addEventListener("click", () => {
      closeTokenInfoModal();
    });
  }

  if (elements.tokenConfigClose) {
    elements.tokenConfigClose.addEventListener("click", () => {
      closeTokenConfigModal();
    });
  }

  if (elements.tokenConfigSave) {
    elements.tokenConfigSave.addEventListener("click", () => {
      const tokenId = (elements.tokenConfigTokenId && elements.tokenConfigTokenId.value) || "";
      if (!tokenId) {
        return;
      }
      emit("token:update", {
        tokenId,
        vision: {
          brightRadius: clampLightRadiusFeet(elements.tokenConfigBright && elements.tokenConfigBright.value),
          dimRadius: clampLightRadiusFeet(elements.tokenConfigDim && elements.tokenConfigDim.value),
          darkvisionRadius: clampLightRadiusFeet(elements.tokenConfigDarkvision && elements.tokenConfigDarkvision.value),
          auraRadius: clampLightRadiusFeet(elements.tokenConfigAuraRadius && elements.tokenConfigAuraRadius.value),
          auraColor: normalizeTerrainColor(
            (elements.tokenConfigAuraColor && elements.tokenConfigAuraColor.value) || DEFAULT_TOKEN_AURA_COLOR
          ),
        },
      });
      closeTokenConfigModal();
    });
  }

  if (elements.layerGroup) {
    elements.layerGroup.addEventListener("click", (event) => {
      const btn = event.target.closest(".tt-seg");
      if (!btn || !btn.dataset.value) {
        return;
      }
      setTokenLayer(btn.dataset.value);
    });
  }

  elements.tokenLayerToTokens.addEventListener("click", () => {
    state.selectedTokenIds.forEach((tokenId) => {
      emit("token:setLayer", { tokenId, layer: "tokens" });
    });
  });

  elements.tokenLayerToGm.addEventListener("click", () => {
    state.selectedTokenIds.forEach((tokenId) => {
      emit("token:setLayer", { tokenId, layer: "gm" });
    });
  });

  elements.tokenDelete.addEventListener("click", () => {
    if (state.selectedTokenIds.size === 0) {
      return;
    }
    const count = state.selectedTokenIds.size;
    if (!window.confirm(`Delete ${count} selected token${count > 1 ? "s" : ""}?`)) {
      return;
    }
    state.selectedTokenIds.forEach((tokenId) => {
      emit("token:delete", { tokenId });
    });
    state.selectedTokenIds.clear();
    renderSelectedTokenControls();
  });

  elements.tokenToggleAuto.addEventListener("click", () => {
    if (state.selectedTokenIds.size === 0) {
      return;
    }
    state.selectedTokenIds.forEach((tokenId) => {
      const token = getTokenById(tokenId);
      if (!token) {
        return;
      }
      emit("token:update", { tokenId: token.id, autoMove: !token.autoMove });
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
      if (event.button === 1 || (event.button === 2 && !(isToolInteractionEnabled() && state.tool.preview))) {
        event.preventDefault();
        startMapPan(event);
        return;
      }
      if (event.button === 0 && event.target === elements.boardWrap) {
        beginDragSelect(event);
      }
    });
  }

  window.addEventListener("mousemove", (event) => {
    continueMapPan(event);
    updateDragSelect(event);
    if (!state.tool.dragging || !isToolInteractionEnabled()) {
      return;
    }
    const cell = cellFromClientPoint(event.clientX, event.clientY);
    if (!cell) {
      return;
    }
    updateMeasureDrag(cell.x, cell.y, state.tool.cellSize);
  });

  window.addEventListener("mouseup", (event) => {
    stopPaintDrag();
    endMeasureDrag();
    stopMapPan();
    endDragSelect(event);
  });

  window.addEventListener("resize", () => {
    if (activeMap()) {
      renderMapGrid();
    }
    applyMapViewTransform();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Delete" && event.key !== "Backspace") {
      return;
    }
    const focused = document.activeElement;
    if (focused && (focused.tagName === "INPUT" || focused.tagName === "TEXTAREA" || focused.isContentEditable)) {
      return;
    }

    if (state.selectedTokenIds.size > 0) {
      const deletable = [...state.selectedTokenIds].filter((id) => {
        const token = getTokenById(id);
        return token && canCurrentUserControlToken(token);
      });
      if (deletable.length === 0) {
        return;
      }
      event.preventDefault();
      deletable.forEach((tokenId) => {
        emit("token:delete", { tokenId });
      });
      state.selectedTokenIds.clear();
      renderSelectedTokenControls();
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

  socket.on("terrain:catalog", (catalog) => {
    state.terrainCatalog = catalog || null;
    state.terrain.textureTileCache.clear();
    renderTerrainEditor();
    scheduleTerrainCanvasRender();
  });

  socket.on("tabletop:state", (snapshot) => {
    state.snapshot = snapshot;
    if (state.snapshot && state.snapshot.scene && state.snapshot.scene.map) {
      Array.from(state.terrain.pendingChanges.entries()).forEach(([key, change]) => {
        const layer = terrainLayerById(change.layerId, state.snapshot.scene.map);
        if (!layer || !Array.isArray(layer.cells) || !Array.isArray(layer.cells[change.y])) {
          state.terrain.pendingChanges.delete(key);
          return;
        }
        layer.cells[change.y][change.x] = cloneTerrainTile(change.tile);
      });
    }
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

  socket.on("terrain:doorInteractionResult", (payload) => {
    const x = Number.parseInt(payload && payload.x, 10);
    const y = Number.parseInt(payload && payload.y, 10);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }
    state.terrain.lockFlash = {
      x,
      y,
      expiresAt: Date.now() + 900,
    };
    renderMeasurementOverlay();
    window.setTimeout(() => {
      if (
        state.terrain.lockFlash &&
        state.terrain.lockFlash.x === x &&
        state.terrain.lockFlash.y === y &&
        Date.now() >= state.terrain.lockFlash.expiresAt
      ) {
        state.terrain.lockFlash = null;
        renderMeasurementOverlay();
      }
    }, 920);
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
