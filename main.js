/*
  DDRR static web map (MapLibre GL JS)
  ------------------------------------
  - No build step
  - Mobile-first drawer controls
  - Streets + Satellite basemap switch
  - GeoJSON overlays loaded with fetch()
  - Layer toggles, popups, and Nominatim search
*/

// Kept for compatibility with earlier instructions; not used for basemap calls here.
const MAPTILER_KEY = "";

// Zone labels are hidden until this zoom.
// Edit this value to control when Zone Label appears.
const ZONE_LABEL_MIN_ZOOM = 0;

// Zone hover tooltip is disabled at/above this zoom.
// Edit this value to control when hover popups stop showing.
const ZONE_HOVER_MAX_ZOOM = 18;
const WALK_ICON_IMAGE_ID = "walk-person-icon";
const NYC_VIEWBOX = {
  west: -74.25909,
  south: 40.4774,
  east: -73.70018,
  north: 40.9176,
};


const DATA_PATHS = {
  dividingLine: "./data/dividing_line.geojson",
  sightings: "./data/confirmed_sightings.geojson",
  zones: "./data/zones.geojson",
  walkIcon: "./data/svg/walk-svgrepo-com.svg",
};

const WALK_AREA_LABELS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "inwood-walk-zones-label",
      properties: { label_text: "INWOOD\nWALK ZONES" },
      geometry: {
        type: "Point",
        coordinates: toLngLat(40.86521452, -73.94263626),
      },
    },
    {
      type: "Feature",
      id: "washington-heights-walk-zones-label",
      properties: { label_text: "WASHINGTON\nHEIGHTS\nWALK ZONES" },
      geometry: {
        type: "Point",
        coordinates: toLngLat(40.84290596, -73.95526209),
      },
    },
  ],
};

// Manually set polygon colors here (key = zone id or Zone_number).
// Add/edit entries to control each polygon color explicitly.
const MANUAL_ZONE_COLORS = {
  1: "#d57544",
  2: "#e0e02a",
  3: "#0ecd5d",
  4: "#2171cd",
  5: "#d57544",
  6: "#43db31",
  7: "#d57544",
  8: "#2cc8dd",
  9: "#e0e02a",
  10: "#cd2f66",
  11: "#2143cd",
  12: "#d57544",
  13: "#a451e0",
  14: "#cd2f66",
  15: "#2cc8dd",
  101: "#eaac2f",
  102: "#2cc8dd",
  103: "#0ecd5d",
  104: "#e0e02a",
  105: "#a451e0",
  106: "#43db31",
  107: "#d57544",
  108: "#2143cd",
  109: "#cd2f66",
  110: "#43db31",
};

const SOURCE_IDS = {
  zones: "zones-source",
  zonesLabels: "zones-labels-source",
  regularWalkers: "regular-walkers-source",
  walkAreaLabels: "walk-area-labels-source",
  sightings: "sightings-source",
  dividingLine: "dividing-line-source",
  dividingLabels: "dividing-labels-source",
};

const LAYER_IDS = {
  zonesFill: "zones-fill",
  zonesCasing: "zones-casing",
  zonesOutline: "zones-outline",
  zonesBlackOutline: "zones-black-outline",
  zonesHoverOutline: "zones-hover-outline",
  zonesLabel: "zones-label",
  regularWalkersText: "regular-walkers-text",
  regularWalkersIcon: "regular-walkers-icon",
  walkAreaLabels: "walk-area-labels",
  walkAreaLabelPoints: "walk-area-label-points",
  sightings: "confirmed-sightings",
  dividingLine: "dividing-line",
  dividingLabelAbove: "dividing-label-above",
  dividingLabelBelow: "dividing-label-below",
};

const appState = {
  map: null,
  data: null,
  currentBasemap: "streets",
  zonesDataMode: "raw",
  zonesBounds: null,
  allBounds: null,
  zoneHoverPopup: null,
  zoneClickPopup: null,
  sightingHoverPopup: null,
  sightingClickPopup: null,
  searchMarker: null,
  searchMarkerTimeoutId: null,
  activeSearchController: null,
  activeZonesInteractionLayer: null,
  walkIconLoadingPromise: null,
  hoveredZoneFeatureId: null,
  walkAreaDomMarkers: [],
};

initializeApp().catch((error) => {
  console.error("Map initialization failed:", error);
  alert("Unable to initialize map. Check console and local data paths.");
});

async function initializeApp() {
  setupDrawerUI();
  setupBasemapSwitching();
  setupLayerToggleUI();
  setupSearchUI();

  appState.data = await loadAndPrepareData();
  appState.zonesBounds = computeGeoJsonBounds(appState.data.zonesRaw || appState.data.zonesFlat);
  appState.allBounds = computeCombinedBounds([
    appState.data.zonesRaw,
    appState.data.sightings,
    appState.data.dividingLine,
  ]);

  appState.map = new maplibregl.Map({
    container: "map",
    style: getBasemapStyle("streets"),
    center: [-73.936, 40.843],
    zoom: 12,
    attributionControl: true,
  });

  appState.map.addControl(new maplibregl.NavigationControl(), "top-right");
  appState.map.addControl(new HomeControl(() => fitToZones(true)), "top-right");

  appState.map.on("error", (event) => {
    console.error("MapLibre runtime error:", event?.error || event);
  });

  appState.map.on("load", () => {
    installOverlaySourcesAndLayers();
    applyLayerVisibilityFromToggles();
    renderWalkAreaDomMarkers();
    // Initial view should focus on polygon extent.
    fitToZones(false);
    runZonesFallbackIfNeeded();
  });

  appState.map.on("click", closeDrawerOnMobile);
}

async function loadAndPrepareData() {
  const [zonesRaw, sightingsRaw, dividingLineRaw] = await Promise.all([
    fetchGeoJson(DATA_PATHS.zones),
    fetchGeoJson(DATA_PATHS.sightings),
    fetchGeoJson(DATA_PATHS.dividingLine),
  ]);

  const zonesPrepared = preprocessZones(zonesRaw);
  const zonesFlat = flattenZonesToPolygons(zonesPrepared);
  const zonesLabelPoints = buildZoneLabelPoints(zonesPrepared);
  const regularWalkersLabelPoints = buildRegularWalkersLabelPoints(zonesPrepared);
  const sightings = preprocessGenericFeatureCollection(sightingsRaw);
  const dividingLine = preprocessGenericFeatureCollection(dividingLineRaw);
  const dividingLabels = buildDividingLabelPoints(dividingLine);

  return {
    zonesRaw: zonesPrepared,
    zonesFlat,
    zonesLabelPoints,
    regularWalkersLabelPoints,
    sightings,
    dividingLine,
    dividingLabels,
  };
}

async function fetchGeoJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed loading ${path}: HTTP ${response.status}`);
  return response.json();
}

function preprocessGenericFeatureCollection(input) {
  const features = Array.isArray(input?.features) ? input.features : [];
  return {
    type: "FeatureCollection",
    features: features
      .filter((feature) => feature && feature.type === "Feature" && feature.geometry)
      .map((feature, index) => ({
        type: "Feature",
        id: feature.id ?? index + 1,
        properties: sanitizeProperties(feature.properties || {}),
        geometry: feature.geometry,
      })),
  };
}

function preprocessZones(input) {
  const base = preprocessGenericFeatureCollection(input);

  base.features = base.features
    .filter((feature) => {
      const type = feature?.geometry?.type;
      return type === "Polygon" || type === "MultiPolygon";
    })
    .map((feature, index) => {
      const props = sanitizeProperties(feature.properties || {});
      const zoneUid = index + 1;
      props.__zone_uid = zoneUid;
      props.zone_color = getDeterministicZoneColor(props, zoneUid);

      return {
        type: "Feature",
        id: zoneUid,
        properties: props,
        geometry: feature.geometry,
      };
    });

  return base;
}

function flattenZonesToPolygons(zonesFeatureCollection) {
  const out = [];
  let nextId = 1;

  (zonesFeatureCollection.features || []).forEach((feature) => {
    const geometry = feature.geometry || {};
    const props = { ...(feature.properties || {}) };

    if (geometry.type === "Polygon") {
      out.push({
        type: "Feature",
        id: nextId++,
        properties: props,
        geometry: {
          type: "Polygon",
          coordinates: geometry.coordinates,
        },
      });
      return;
    }

    if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
      geometry.coordinates.forEach((polygonCoords) => {
        out.push({
          type: "Feature",
          id: nextId++,
          properties: props,
          geometry: {
            type: "Polygon",
            coordinates: polygonCoords,
          },
        });
      });
    }
  });

  return { type: "FeatureCollection", features: out };
}

function sanitizeProperties(properties) {
  const out = {};

  Object.entries(properties || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === "number" && !Number.isFinite(value)) return;
    out[key] = value;
  });

  return out;
}

/**
 * Ensure polygon winding order is RFC7946-friendly:
 * - outer ring: counter-clockwise
 * - holes: clockwise
 *
 * Some renderers tolerate incorrect winding, but others can fail to fill polygons.
 */
function normalizePolygonWinding(geometry) {
  if (!geometry) return geometry;

  if (geometry.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: normalizePolygonCoordinates(geometry.coordinates),
    };
  }

  if (geometry.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: (geometry.coordinates || []).map((polygon) =>
        normalizePolygonCoordinates(polygon)
      ),
    };
  }

  return geometry;
}

function normalizePolygonCoordinates(polygonCoordinates) {
  if (!Array.isArray(polygonCoordinates)) return polygonCoordinates;

  return polygonCoordinates.map((ring, ringIndex) => {
    if (!Array.isArray(ring) || ring.length < 4) return ring;

    const signedArea = getRingSignedArea(ring);
    const isCCW = signedArea > 0;
    const shouldBeCCW = ringIndex === 0;

    if ((shouldBeCCW && !isCCW) || (!shouldBeCCW && isCCW)) {
      return [...ring].reverse();
    }

    return ring;
  });
}

function getRingSignedArea(ring) {
  let area = 0;

  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }

  return area / 2;
}

function getDeterministicZoneColor(properties, fallbackSeed) {
  const candidates = [Number(properties?.id), Number(properties?.Zone_number)];
  for (const candidate of candidates) {
    if (Number.isFinite(candidate) && MANUAL_ZONE_COLORS[candidate]) {
      return MANUAL_ZONE_COLORS[candidate];
    }
  }

  // Stable fallback color (does not change between refreshes).
  const stableSeed = String(
    properties?.id ?? properties?.Zone_number ?? properties?.Zone ?? properties?.zone_label ?? fallbackSeed
  );

  let hash = 0;
  for (let i = 0; i < stableSeed.length; i += 1) {
    hash = (hash * 31 + stableSeed.charCodeAt(i)) | 0;
  }

  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 72, 50);
}

function hslToHex(h, s, l) {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (value) => Math.round((value + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function buildZoneColorExpression(zoneFeatures) {
  const expression = ["match", ["get", "__zone_uid"]];

  zoneFeatures.forEach((feature) => {
    const uid = Number(feature?.properties?.__zone_uid);
    const color = feature?.properties?.zone_color;
    if (Number.isFinite(uid)) {
      expression.push(uid, typeof color === "string" ? color : "#2563eb");
    }
  });

  expression.push("#2563eb");
  return expression;
}

function buildZoneLabelPoints(zonesGeoJson) {
  const features = [];

  (zonesGeoJson?.features || []).forEach((feature, index) => {
    const zoneNumber = feature?.properties?.Zone_number;
    if (zoneNumber === null || zoneNumber === undefined || zoneNumber === "") return;

    const coordinates = getZoneLabelPointFromGeometry(feature?.geometry);
    if (!coordinates) return;

    features.push({
      type: "Feature",
      id: `zone-label-${feature?.id ?? index + 1}`,
      properties: { Zone_number: zoneNumber },
      geometry: { type: "Point", coordinates },
    });
  });

  return { type: "FeatureCollection", features };
}

function buildRegularWalkersLabelPoints(zonesGeoJson) {
  const features = [];

  (zonesGeoJson?.features || []).forEach((feature, index) => {
    const walkValue = feature?.properties?.walk;
    if (walkValue === null || walkValue === undefined || walkValue === "") return;

    const coordinates = getZoneLabelPointFromGeometry(feature?.geometry);
    if (!coordinates) return;

    features.push({
      type: "Feature",
      id: `regular-walkers-${feature?.id ?? index + 1}`,
      properties: { walk_label: String(walkValue) },
      geometry: { type: "Point", coordinates },
    });
  });

  return { type: "FeatureCollection", features };
}

function loadHtmlImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("HTML image failed to load"));
    image.src = url;
  });
}

async function svgTextToImageData(svgText, size = 128) {
  const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadHtmlImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, size, size);
    return ctx.getImageData(0, 0, size, size);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function ensureWalkIconLoaded() {
  const map = appState.map;
  if (!map) return;
  if (map.hasImage(WALK_ICON_IMAGE_ID)) return;

  if (appState.walkIconLoadingPromise) {
    await appState.walkIconLoadingPromise;
    return;
  }

  appState.walkIconLoadingPromise = (async () => {
    try {
      const response = await fetch(DATA_PATHS.walkIcon);
      if (!response.ok) throw new Error(`Failed loading ${DATA_PATHS.walkIcon}: HTTP ${response.status}`);

      const svg = await response.text();
      const styledSvg = svg.replace(/stroke="#000000"/g, 'stroke="#0f172a"');
      const imageData = await svgTextToImageData(styledSvg, 128);

      if (!map.hasImage(WALK_ICON_IMAGE_ID)) {
        map.addImage(WALK_ICON_IMAGE_ID, imageData, { pixelRatio: 2 });
      }
    } catch (error) {
      console.error("Failed to load walking icon:", error);
    } finally {
      appState.walkIconLoadingPromise = null;
    }
  })();

  await appState.walkIconLoadingPromise;
}

function getZoneLabelPointFromGeometry(geometry) {
  if (!geometry) return null;

  if (geometry.type === "Polygon") {
    return getPolygonLabelPoint(geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
    let largest = null;
    let maxArea = -Infinity;

    polygons.forEach((polygon) => {
      const outerRing = Array.isArray(polygon) ? polygon[0] : null;
      const area = Array.isArray(outerRing) ? Math.abs(getRingSignedArea(outerRing)) : 0;
      if (area > maxArea) {
        maxArea = area;
        largest = polygon;
      }
    });

    return largest ? getPolygonLabelPoint(largest) : null;
  }

  return null;
}

function getPolygonLabelPoint(polygonCoordinates) {
  const outerRing = Array.isArray(polygonCoordinates) ? polygonCoordinates[0] : null;
  if (!Array.isArray(outerRing) || outerRing.length < 4) return null;

  const centroid = getRingCentroid(outerRing);
  if (centroid) return centroid;
  return getRingAveragePoint(outerRing);
}

function getRingCentroid(ring) {
  let signedAreaTimes2 = 0;
  let cxAccumulator = 0;
  let cyAccumulator = 0;

  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const cross = x1 * y2 - x2 * y1;
    signedAreaTimes2 += cross;
    cxAccumulator += (x1 + x2) * cross;
    cyAccumulator += (y1 + y2) * cross;
  }

  if (Math.abs(signedAreaTimes2) < 1e-12) return null;
  return [cxAccumulator / (3 * signedAreaTimes2), cyAccumulator / (3 * signedAreaTimes2)];
}

function getRingAveragePoint(ring) {
  if (!Array.isArray(ring) || ring.length < 2) return null;

  const end = ring.length - 1;
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let i = 0; i < end; i += 1) {
    const [x, y] = ring[i];
    sumX += x;
    sumY += y;
    count += 1;
  }

  if (!count) return null;
  return [sumX / count, sumY / count];
}

function buildDividingLabelPoints(dividingLineGeoJson) {
  const features = [];

  (dividingLineGeoJson.features || []).forEach((feature, index) => {
    const props = feature.properties || {};
    const start = extractFirstCoordinate(feature?.geometry?.coordinates);
    if (!start) return;

    const [lng, lat] = start;

    features.push({
      type: "Feature",
      id: `above-${index + 1}`,
      properties: {
        label_kind: "above",
        label_text: props.above_label || "",
      },
      geometry: {
        type: "Point",
        coordinates: [lng, lat + 0.0012],
      },
    });

    features.push({
      type: "Feature",
      id: `below-${index + 1}`,
      properties: {
        label_kind: "below",
        label_text: props.below_label || "",
      },
      geometry: {
        type: "Point",
        coordinates: [lng, lat - 0.0012],
      },
    });
  });

  return { type: "FeatureCollection", features };
}

function extractFirstCoordinate(coords) {
  if (!Array.isArray(coords)) return null;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") return coords;
  for (const child of coords) {
    const found = extractFirstCoordinate(child);
    if (found) return found;
  }
  return null;
}

function getBasemapStyle(name) {
  if (name === "satellite") {
    return {
      version: 8,
      name: "Free Hybrid Fallback",
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        esriSatellite: {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution:
            "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        },
        cartoLabels: {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
            "https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
            "https://c.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
            "https://d.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution: "Labels © OpenStreetMap contributors, © CARTO",
        },
      },
      layers: [
        { id: "esri-satellite", type: "raster", source: "esriSatellite" },
        { id: "carto-labels", type: "raster", source: "cartoLabels" },
      ],
    };
  }

  return "https://tiles.openfreemap.org/styles/liberty";
}

function setupBasemapSwitching() {
  document.querySelectorAll('input[name="basemap"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      switchBasemap(radio.value);
      closeDrawerOnMobile();
    });
  });
}

function switchBasemap(nextBasemap) {
  if (!appState.map || nextBasemap === appState.currentBasemap) return;
  appState.currentBasemap = nextBasemap;
  appState.map.setStyle(getBasemapStyle(nextBasemap), { diff: false });

  appState.map.once("style.load", () => {
    installOverlaySourcesAndLayers();
    applyLayerVisibilityFromToggles();
    renderWalkAreaDomMarkers();
    runZonesFallbackIfNeeded();
  });
}

function setupLayerToggleUI() {
  const zonesToggle = document.getElementById("toggleZones");
  const zonesLabelToggle = document.getElementById("toggleZonesLabel");
  const regularWalkersToggle = document.getElementById("toggleRegularWalkers");
  const zonesOutlineToggle = document.getElementById("toggleZonesOutline");
  const sightingsToggle = document.getElementById("toggleSightings");

  // Prevent stale browser-restored state.
  if (zonesToggle) zonesToggle.checked = true;
  if (zonesLabelToggle) zonesLabelToggle.checked = true;
  if (regularWalkersToggle) regularWalkersToggle.checked = false;
  if (zonesOutlineToggle) zonesOutlineToggle.checked = false;
  if (sightingsToggle) sightingsToggle.checked = true;

  if (zonesLabelToggle && regularWalkersToggle) {
    zonesLabelToggle.addEventListener("change", () => {
      if (!zonesLabelToggle.checked) return;
      regularWalkersToggle.checked = false;
      applyLayerVisibilityFromToggles();
    });

    regularWalkersToggle.addEventListener("change", () => {
      if (!regularWalkersToggle.checked) return;
      zonesLabelToggle.checked = false;
      applyLayerVisibilityFromToggles();
    });
  }

  [zonesToggle, zonesLabelToggle, regularWalkersToggle, zonesOutlineToggle, sightingsToggle].forEach((toggle) => {
    if (!toggle) return;
    toggle.addEventListener("change", applyLayerVisibilityFromToggles);
  });
}

function getActiveZonesData() {
  return appState.zonesDataMode === "flat" ? appState.data.zonesFlat : appState.data.zonesRaw;
}

function installOverlaySourcesAndLayers() {
  const map = appState.map;
  if (!map || !appState.data) return;

  addOrUpdateGeoJsonSource(SOURCE_IDS.zones, getActiveZonesData());
  addOrUpdateGeoJsonSource(SOURCE_IDS.zonesLabels, appState.data.zonesLabelPoints);
  addOrUpdateGeoJsonSource(SOURCE_IDS.regularWalkers, appState.data.regularWalkersLabelPoints);
  addOrUpdateGeoJsonSource(SOURCE_IDS.walkAreaLabels, WALK_AREA_LABELS_GEOJSON);
  addOrUpdateGeoJsonSource(SOURCE_IDS.sightings, appState.data.sightings);
  addOrUpdateGeoJsonSource(SOURCE_IDS.dividingLine, appState.data.dividingLine);
  addOrUpdateGeoJsonSource(SOURCE_IDS.dividingLabels, appState.data.dividingLabels);

  const zoneColorExpression = buildZoneColorExpression(appState.data.zonesRaw.features || []);

  // A) Zones polygons
  addLayerIfMissing({
    id: LAYER_IDS.zonesFill,
    type: "fill",
    source: SOURCE_IDS.zones,
    paint: {
      "fill-color": zoneColorExpression,
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.40,
        0.30,
      ],
    },
  });

  // Subtle white casing to keep adjacent boundaries readable.
  addLayerIfMissing({
    id: LAYER_IDS.zonesCasing,
    type: "line",
    source: SOURCE_IDS.zones,
    paint: {
      "line-color": "rgba(255,255,255,0.78)",
      "line-width": 0,
      "line-opacity": 0,
    },
  });

  // Optional additional outline layer (separate toggle).
  addLayerIfMissing({
    id: LAYER_IDS.zonesBlackOutline,
    type: "line",
    source: SOURCE_IDS.zones,
    paint: {
      "line-color": "#000000",
      "line-width": 4,
      "line-opacity": 1,
    },
  });

  addLayerIfMissing({
    id: LAYER_IDS.zonesOutline,
    type: "line",
    source: SOURCE_IDS.zones,
    paint: {
      "line-color": zoneColorExpression,
      "line-width": 1.4,
      "line-opacity": 1,
    },
  });

  addLayerIfMissing({
    id: LAYER_IDS.zonesLabel,
    type: "symbol",
    source: SOURCE_IDS.zonesLabels,
    minzoom: ZONE_LABEL_MIN_ZOOM,
    filter: ["has", "Zone_number"],
    layout: {
      "text-field": ["to-string", ["get", "Zone_number"]],
      "text-size": 22,
      "text-font": ["Noto Sans Regular"],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#000000",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1,
      "text-halo-blur": 0.15,
      "text-opacity": 1,
    },
  });

  addRegularWalkersLayerIfReady();

  // B) Confirmed sightings points
  addLayerIfMissing({
    id: LAYER_IDS.sightings,
    type: "circle",
    source: SOURCE_IDS.sightings,
    paint: {
      "circle-color": "#dc2626",
      // SIGHTINGS POINT SIZE: adjust the numbers below to change dot size by zoom level.
      // Format: ["interpolate", ["linear"], ["zoom"], zoom1, size1, zoom2, size2]
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2, 14, 6],
      "circle-stroke-color": "#7f1d1d",
      "circle-stroke-width": 2,
      "circle-opacity": 0.92,
    },
  });

  // C) Dividing line + labels (always visible)
  addLayerIfMissing({
    id: LAYER_IDS.dividingLine,
    type: "line",
    source: SOURCE_IDS.dividingLine,
    paint: {
      "line-color": "#007bff",
      "line-width": 7,
      "line-dasharray": [2, 2],
      "line-opacity": 1,
    },
  });

  addLayerIfMissing({
    id: LAYER_IDS.dividingLabelAbove,
    type: "symbol",
    source: SOURCE_IDS.dividingLabels,
    filter: ["==", ["get", "label_kind"], "above"],
    layout: {
      "text-field": ["get", "label_text"],
      "text-size": 40,
      "text-anchor": "left",
      "text-font": ["Noto Sans Bold", "Open Sans Bold", "Arial Unicode MS Bold"],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#007bff",
      "text-halo-color": "rgba(255,255,255,0.92)",
      "text-halo-width": 1.8,
    },
  });

  addLayerIfMissing({
    id: LAYER_IDS.dividingLabelBelow,
    type: "symbol",
    source: SOURCE_IDS.dividingLabels,
    filter: ["==", ["get", "label_kind"], "below"],
    layout: {
      "text-field": ["get", "label_text"],
      "text-size": 40,
      "text-anchor": "left",
      "text-font": ["Noto Sans Bold", "Open Sans Bold", "Arial Unicode MS Bold"],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#007bff",
      "text-halo-color": "rgba(255,255,255,0.92)",
      "text-halo-width": 1.8,
    },
  });

  addLayerIfMissing({
    id: LAYER_IDS.walkAreaLabels,
    type: "symbol",
    source: SOURCE_IDS.walkAreaLabels,
    layout: {
      "text-field": ["get", "label_text"],
      "text-size": 24,
      "text-anchor": "center",
      "text-justify": "center",
      "text-font": ["Noto Sans Bold", "Open Sans Bold", "Arial Unicode MS Bold"],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#007bff",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.8,
      "text-halo-blur": 0.15,
    },
  });

  addLayerIfMissing({
    id: LAYER_IDS.walkAreaLabelPoints,
    type: "circle",
    source: SOURCE_IDS.walkAreaLabels,
    paint: {
      "circle-radius": 2,
      "circle-color": "#a4bdff",
      "circle-stroke-width": 0,
    },
  });

  bindOverlayInteractions();
}

function addOrUpdateGeoJsonSource(id, data) {
  const map = appState.map;
  if (!map) return;

  const source = map.getSource(id);
  if (source) {
    source.setData(data);
    return;
  }

  map.addSource(id, { type: "geojson", data });
}

function addLayerIfMissing(layerDefinition) {
  if (!appState.map.getLayer(layerDefinition.id)) {
    appState.map.addLayer(layerDefinition);
  }
}

function renderWalkAreaDomMarkers() {
  const map = appState.map;
  if (!map) return;

  appState.walkAreaDomMarkers.forEach((marker) => marker.remove());
  appState.walkAreaDomMarkers = [];

  (WALK_AREA_LABELS_GEOJSON.features || []).forEach((feature) => {
    const coords = feature?.geometry?.coordinates;
    const labelText = String(feature?.properties?.label_text || "");
    if (!Array.isArray(coords) || coords.length < 2) return;

    const pointEl = document.createElement("div");
    pointEl.style.width = "5px";
    pointEl.style.height = "5px";
    pointEl.style.borderRadius = "50%";
    pointEl.style.background = "#a4bdff";

    const pointMarker = new maplibregl.Marker({ element: pointEl, anchor: "center" })
      .setLngLat(coords)
      .addTo(map);

    const labelEl = document.createElement("div");
    labelEl.textContent = labelText.toUpperCase();
    labelEl.style.whiteSpace = "pre-line";
    labelEl.style.textAlign = "center";
    labelEl.style.fontSize = "24px";
    labelEl.style.fontWeight = "700";
    labelEl.style.lineHeight = "1.05";
    labelEl.style.color = "#007bff";
    labelEl.style.pointerEvents = "none";
    labelEl.style.textShadow =
      "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 2px #fff";

    const labelMarker = new maplibregl.Marker({ element: labelEl, anchor: "center" })
      .setLngLat(coords)
      .addTo(map);

    appState.walkAreaDomMarkers.push(pointMarker, labelMarker);
  });
}

function toLngLat(lat, lng) {
  return [lng, lat];
}

async function addRegularWalkersLayerIfReady() {
  const map = appState.map;
  if (!map) return;

  addLayerIfMissing({
    id: LAYER_IDS.regularWalkersText,
    type: "symbol",
    source: SOURCE_IDS.regularWalkers,
    minzoom: ZONE_LABEL_MIN_ZOOM,
    filter: ["has", "walk_label"],
    layout: {
      "text-field": ["get", "walk_label"],
      "text-size": 18,
      "text-font": ["Noto Sans Regular"],
      "text-anchor": "left",
      "text-offset": [0.7, 0],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#000000",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1,
      "text-halo-blur": 0.15,
      "text-opacity": 1,
    },
  });

  await ensureWalkIconLoaded();

  if (!map.hasImage(WALK_ICON_IMAGE_ID)) {
    applyLayerVisibilityFromToggles();
    return;
  }

  addLayerIfMissing({
    id: LAYER_IDS.regularWalkersIcon,
    type: "symbol",
    source: SOURCE_IDS.regularWalkers,
    minzoom: ZONE_LABEL_MIN_ZOOM,
    filter: ["has", "walk_label"],
    layout: {
      "icon-image": WALK_ICON_IMAGE_ID,
      "icon-size": 0.38,
      "icon-anchor": "center",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  applyLayerVisibilityFromToggles();
}

function runZonesFallbackIfNeeded() {
  const map = appState.map;
  if (!map) return;

  const zonesEnabled = document.getElementById("toggleZones")?.checked ?? true;
  if (!zonesEnabled) return;

  setTimeout(() => {
    if (!map.getLayer(LAYER_IDS.zonesFill) || !map.getSource(SOURCE_IDS.zones)) return;

    if (!map.isSourceLoaded(SOURCE_IDS.zones)) {
      runZonesFallbackIfNeeded();
      return;
    }

    const rendered = map.queryRenderedFeatures(undefined, { layers: [LAYER_IDS.zonesFill] });
    console.info("Zones rendered count (current mode):", rendered.length, appState.zonesDataMode);
    if (rendered.length > 0) return;

    // Fallback path: swap to flattened polygon data if raw multipolygons did not render.
    if (appState.zonesDataMode === "raw" && (appState.data?.zonesFlat?.features?.length ?? 0) > 0) {
      console.warn("Zones not visible from raw multipolygons; switching to flattened polygons fallback.");
      appState.zonesDataMode = "flat";
      const source = map.getSource(SOURCE_IDS.zones);
      if (source) {
        source.setData(appState.data.zonesFlat);
        fitToZones(false);

        // One more visibility check after fallback source swap.
        setTimeout(() => {
          const renderedAfter = map.queryRenderedFeatures(undefined, { layers: [LAYER_IDS.zonesFill] });
          console.info("Zones rendered count after fallback:", renderedAfter.length);
        }, 250);
      }
    }
  }, 950);
}

function applyLayerVisibilityFromToggles() {
  const zonesVisible = document.getElementById("toggleZones")?.checked ?? true;
  const zonesLabelToggle = document.getElementById("toggleZonesLabel");
  const regularWalkersToggle = document.getElementById("toggleRegularWalkers");
  let zonesLabelVisible = zonesLabelToggle?.checked ?? true;
  let regularWalkersVisible = regularWalkersToggle?.checked ?? false;

  // Safety guard: these two sublayers are mutually exclusive.
  if (zonesLabelVisible && regularWalkersVisible) {
    zonesLabelVisible = false;
    if (zonesLabelToggle) zonesLabelToggle.checked = false;
  }

  const zonesOutlineVisible = document.getElementById("toggleZonesOutline")?.checked ?? false;
  const sightingsVisible = document.getElementById("toggleSightings")?.checked ?? true;

  setLayerVisibility(
    [
      LAYER_IDS.zonesFill,
      LAYER_IDS.zonesCasing,
      LAYER_IDS.zonesOutline,
      LAYER_IDS.zonesHoverOutline,
    ],
    zonesVisible
  );

  setLayerVisibility([LAYER_IDS.zonesBlackOutline], zonesOutlineVisible);

  setLayerVisibility([LAYER_IDS.zonesLabel], zonesLabelVisible);
  setLayerVisibility([LAYER_IDS.regularWalkersText, LAYER_IDS.regularWalkersIcon], regularWalkersVisible);

  updateZonesInteractionBinding();

  setLayerVisibility([LAYER_IDS.sightings], sightingsVisible);

  // Dividing line and labels are always on (no toggle per latest request).
  setLayerVisibility(
    [
      LAYER_IDS.dividingLine,
      LAYER_IDS.dividingLabelAbove,
      LAYER_IDS.dividingLabelBelow,
      LAYER_IDS.walkAreaLabels,
      LAYER_IDS.walkAreaLabelPoints,
    ],
    true
  );
}

function setLayerVisibility(layerIds, visible) {
  const map = appState.map;
  if (!map) return;
  const value = visible ? "visible" : "none";

  layerIds.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", value);
    }
  });
}

function bindOverlayInteractions() {
  const map = appState.map;
  if (!map) return;

  unbindOverlayInteractions();

  updateZonesInteractionBinding();

  map.on("mousemove", LAYER_IDS.sightings, onSightingsHover);
  map.on("mouseleave", LAYER_IDS.sightings, onSightingsLeave);
  map.on("click", LAYER_IDS.sightings, onSightingsClick);
}

function unbindOverlayInteractions() {
  const map = appState.map;
  if (!map) return;

  if (appState.activeZonesInteractionLayer) {
    const layerId = appState.activeZonesInteractionLayer;
    try {
      map.off("mousemove", layerId, onZonesHover);
      map.off("mouseleave", layerId, onZonesLeave);
      map.off("click", layerId, onZonesClick);
    } catch {
      // Ignore if handlers were not attached.
    }
    appState.activeZonesInteractionLayer = null;
  }

  const handlers = [
    ["mousemove", LAYER_IDS.sightings, onSightingsHover],
    ["mouseleave", LAYER_IDS.sightings, onSightingsLeave],
    ["click", LAYER_IDS.sightings, onSightingsClick],
  ];

  handlers.forEach(([eventName, layerId, handler]) => {
    try {
      map.off(eventName, layerId, handler);
    } catch {
      // Ignore if handler was not attached yet.
    }
  });
}

function getActiveZonesInteractionLayerId() {
  const zonesVisible = document.getElementById("toggleZones")?.checked ?? true;
  const zonesOutlineVisible = document.getElementById("toggleZonesOutline")?.checked ?? false;

  if (zonesVisible) return LAYER_IDS.zonesFill;
  if (zonesOutlineVisible) return LAYER_IDS.zonesBlackOutline;
  return null;
}

function updateZonesInteractionBinding() {
  const map = appState.map;
  if (!map) return;

  const previousLayerId = appState.activeZonesInteractionLayer;
  const nextLayerId = getActiveZonesInteractionLayerId();

  if (previousLayerId && previousLayerId !== nextLayerId) {
    try {
      map.off("mousemove", previousLayerId, onZonesHover);
      map.off("mouseleave", previousLayerId, onZonesLeave);
      map.off("click", previousLayerId, onZonesClick);
    } catch {
      // Ignore if handlers were not attached.
    }
  }

  if (nextLayerId && previousLayerId !== nextLayerId) {
    map.on("mousemove", nextLayerId, onZonesHover);
    map.on("mouseleave", nextLayerId, onZonesLeave);
    map.on("click", nextLayerId, onZonesClick);
  }

  if (!nextLayerId) {
    if (appState.zoneHoverPopup) appState.zoneHoverPopup.remove();
    map.getCanvas().style.cursor = "";
  }

  appState.activeZonesInteractionLayer = nextLayerId;
}

function onZonesHover(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  if (appState.hoveredZoneFeatureId !== null && appState.hoveredZoneFeatureId !== feature.id) {
    map.setFeatureState(
      { source: SOURCE_IDS.zones, id: appState.hoveredZoneFeatureId },
      { hover: false }
    );
  }

  if (feature.id !== null && feature.id !== undefined) {
    appState.hoveredZoneFeatureId = feature.id;
    map.setFeatureState({ source: SOURCE_IDS.zones, id: feature.id }, { hover: true });
  }

  if (hasActiveSightingPopup()) {
    if (appState.zoneHoverPopup) appState.zoneHoverPopup.remove();
    map.getCanvas().style.cursor = "";
    return;
  }

  if (map.getZoom() >= ZONE_HOVER_MAX_ZOOM) {
    if (appState.zoneHoverPopup) appState.zoneHoverPopup.remove();
    map.getCanvas().style.cursor = "";
    return;
  }

  map.getCanvas().style.cursor = "pointer";

  const zoneName = escapeHtml(String(feature.properties?.Zone ?? ""));
  const html = `<span class="zone-name-popup-text">${zoneName}</span>`;

  if (!appState.zoneHoverPopup) {
    appState.zoneHoverPopup = new maplibregl.Popup({
      className: "zone-name-popup",
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      maxWidth: "320px",
    });
  }

  appState.zoneHoverPopup.setLngLat(event.lngLat).setHTML(html).addTo(map);
}

function onZonesLeave() {
  const map = appState.map;
  if (!map) return;

  if (appState.hoveredZoneFeatureId !== null) {
    map.setFeatureState(
      { source: SOURCE_IDS.zones, id: appState.hoveredZoneFeatureId },
      { hover: false }
    );
    appState.hoveredZoneFeatureId = null;
  }

  map.getCanvas().style.cursor = "";

  if (appState.zoneHoverPopup) appState.zoneHoverPopup.remove();
}

function onZonesClick(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  if (hasActiveSightingPopup()) return;

  const zoneName = escapeHtml(String(feature.properties?.Zone ?? ""));
  const html = `<span class="zone-name-popup-text">${zoneName}</span>`;

  if (appState.zoneClickPopup) appState.zoneClickPopup.remove();

  appState.zoneClickPopup = new maplibregl.Popup({
    className: "zone-name-popup",
    closeButton: true,
    closeOnClick: true,
    offset: 12,
    maxWidth: "320px",
  })
    .setLngLat(event.lngLat)
    .setHTML(html)
    .addTo(map);
}

function onSightingsHover(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  closeZonePopups();

  map.getCanvas().style.cursor = "pointer";

  const props = feature.properties || {};
  const html = `
    <p class="popup-tooltip">
      Date of Incident: ${escapeHtml(String(props["Date of Incident"] ?? ""))}<br />
      Time: ${escapeHtml(String(props.Time ?? ""))}<br />
      Week Day: ${escapeHtml(String(props["Week Day"] ?? ""))}
    </p>
  `;

  if (!appState.sightingHoverPopup) {
    appState.sightingHoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      maxWidth: "320px",
    });
  }

  appState.sightingHoverPopup.setLngLat(event.lngLat).setHTML(html).addTo(map);
}

function onSightingsLeave() {
  const map = appState.map;
  if (!map) return;
  map.getCanvas().style.cursor = "";
  if (appState.sightingHoverPopup) appState.sightingHoverPopup.remove();
}

function onSightingsClick(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  closeZonePopups();

  const rows = Object.entries(feature.properties || {})
    .map(
      ([key, value]) =>
        `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(String(value ?? ""))}</td></tr>`
    )
    .join("");

  if (appState.sightingClickPopup) appState.sightingClickPopup.remove();

  appState.sightingClickPopup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    offset: 12,
    maxWidth: "320px",
  })
    .setLngLat(event.lngLat)
    .setHTML(`<table class="popup-table">${rows}</table>`)
    .addTo(map);
}

function setupSearchUI() {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");
  const resultsList = document.getElementById("searchResults");
  if (!form || !input || !resultsList) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const query = input.value.trim();
    if (!query) {
      renderSearchResults([], "Type an address or cross-streets to search.");
      return;
    }

    if (appState.activeSearchController) appState.activeSearchController.abort();
    appState.activeSearchController = new AbortController();

    renderSearchResults([], "Searching...");

    try {
      const results = await queryNominatim(query, appState.activeSearchController.signal);
      renderSearchResults(results);
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("Search error:", error);
      renderSearchResults([], "Search failed. Please try again.");
    }
  });
}

async function queryNominatim(query, signal) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  // Restrict search results to NYC limits.
  url.searchParams.set(
    "viewbox",
    `${NYC_VIEWBOX.west},${NYC_VIEWBOX.north},${NYC_VIEWBOX.east},${NYC_VIEWBOX.south}`
  );
  url.searchParams.set("bounded", "1");
  url.searchParams.set("countrycodes", "us");

  const response = await fetch(url.toString(), {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);
  return response.json();
}

function renderSearchResults(results, message = "") {
  const resultsList = document.getElementById("searchResults");
  if (!resultsList) return;
  resultsList.innerHTML = "";

  if (message) {
    const li = document.createElement("li");
    li.textContent = message;
    resultsList.appendChild(li);
    return;
  }

  if (!results.length) {
    const li = document.createElement("li");
    li.textContent = "No results found.";
    resultsList.appendChild(li);
    return;
  }

  results.forEach((result) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = result.display_name || `${result.lat}, ${result.lon}`;
    button.addEventListener("click", () => {
      flyToSearchResult([Number(result.lon), Number(result.lat)]);
      closeDrawerOnMobile();
    });
    li.appendChild(button);
    resultsList.appendChild(li);
  });
}

function flyToSearchResult([lng, lat]) {
  if (!appState.map || Number.isNaN(lng) || Number.isNaN(lat)) return;

  appState.map.flyTo({ center: [lng, lat], zoom: 16, essential: true });

  if (appState.searchMarker) appState.searchMarker.remove();
  appState.searchMarker = new maplibregl.Marker({ color: "#00e5ff" })
    .setLngLat([lng, lat])
    .addTo(appState.map);

  if (appState.searchMarkerTimeoutId) clearTimeout(appState.searchMarkerTimeoutId);
  appState.searchMarkerTimeoutId = setTimeout(() => {
    if (appState.searchMarker) {
      appState.searchMarker.remove();
      appState.searchMarker = null;
    }
  }, 120000);
}

function setupDrawerUI() {
  const menuToggle = document.getElementById("menuToggle");
  if (!menuToggle) return;

  menuToggle.addEventListener("click", () => {
    const willOpen = !document.body.classList.contains("panel-open");
    document.body.classList.toggle("panel-open", willOpen);
    menuToggle.setAttribute("aria-expanded", String(willOpen));
  });
}

function closeDrawerOnMobile() {
  if (!window.matchMedia("(max-width: 1023px)").matches) return;
  document.body.classList.remove("panel-open");

  const menuToggle = document.getElementById("menuToggle");
  if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
}

function fitToAllData(animated = true) {
  if (!appState.map || !appState.allBounds) return;
  const hasDesktopPanel = window.matchMedia("(min-width: 1024px)").matches;
  const padding = hasDesktopPanel
    ? { top: 36, right: 36, bottom: 36, left: 360 }
    : { top: 26, right: 26, bottom: 26, left: 26 };

  appState.map.fitBounds(appState.allBounds, {
    padding,
    duration: animated ? 900 : 0,
  });
}

function fitToZones(animated = true) {
  if (!appState.map || !appState.zonesBounds) return;
  const hasDesktopPanel = window.matchMedia("(min-width: 1024px)").matches;
  const padding = hasDesktopPanel
    ? { top: 36, right: 36, bottom: 36, left: 360 }
    : { top: 26, right: 26, bottom: 26, left: 26 };

  appState.map.fitBounds(appState.zonesBounds, {
    padding,
    duration: animated ? 900 : 0,
  });
}

function computeCombinedBounds(featureCollections) {
  const bounds = new maplibregl.LngLatBounds();
  let touched = false;

  featureCollections.forEach((featureCollection) => {
    (featureCollection?.features || []).forEach((feature) => {
      if (extendBoundsWithCoordinates(bounds, feature?.geometry?.coordinates)) {
        touched = true;
      }
    });
  });

  return touched ? bounds : null;
}

function computeGeoJsonBounds(featureCollection) {
  if (!featureCollection?.features?.length) return null;

  const bounds = new maplibregl.LngLatBounds();
  let touched = false;

  featureCollection.features.forEach((feature) => {
    if (extendBoundsWithCoordinates(bounds, feature?.geometry?.coordinates)) {
      touched = true;
    }
  });

  return touched ? bounds : null;
}

function extendBoundsWithCoordinates(bounds, coordinates) {
  if (!Array.isArray(coordinates)) return false;

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    bounds.extend([coordinates[0], coordinates[1]]);
    return true;
  }

  let touched = false;
  coordinates.forEach((nested) => {
    if (extendBoundsWithCoordinates(bounds, nested)) touched = true;
  });

  return touched;
}

class HomeControl {
  constructor(onClick) {
    this.onClick = onClick;
    this.container = null;
    this.button = null;
  }

  onAdd() {
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group maplibregl-ctrl-home";

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.title = "Home (fit to zones)";
    this.button.setAttribute("aria-label", "Fit map to zones");
    this.button.textContent = "⌂";
    this.button.addEventListener("click", this.onClick);

    this.container.appendChild(this.button);
    return this.container;
  }

  onRemove() {
    if (this.button) this.button.removeEventListener("click", this.onClick);
    if (this.container?.parentNode) this.container.parentNode.removeChild(this.container);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isPopupOpen(popup) {
  return Boolean(popup && typeof popup.isOpen === "function" && popup.isOpen());
}

function hasActiveSightingPopup() {
  return isPopupOpen(appState.sightingHoverPopup) || isPopupOpen(appState.sightingClickPopup);
}

function closeZonePopups() {
  if (appState.zoneHoverPopup) appState.zoneHoverPopup.remove();
  if (appState.zoneClickPopup) appState.zoneClickPopup.remove();
}
