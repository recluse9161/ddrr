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

// Zone hover tooltip is disabled at/above this zoom.
// Edit this value to control when hover popups stop showing.
const ZONE_HOVER_MAX_ZOOM = 18;
const INITIAL_MAP_CENTER = [-73.936, 40.843];
const INITIAL_MAP_ZOOM = 12;
// Hide zone numbers + walk labels if zoomed out by more than 1 from default.
const ZONE_LABEL_MIN_ZOOM = INITIAL_MAP_ZOOM - 1;
// Hide INWOOD/WASHINGTON HEIGHTS area labels if zoomed out by more than 0.5.
const WALK_AREA_LABEL_MIN_ZOOM = INITIAL_MAP_ZOOM - 0.5;
// Default map rotation for initial/home view.
const INITIAL_MAP_BEARING = 0;
// Zone boundary thickness controls.
const ZONES_FILL_OUTLINE_WIDTH = 1.4;
const ZONES_TOGGLE_OUTLINE_WIDTH = 2;
const ZONES_TOGGLE_OUTLINE_COLOR_STREETS = "#000000";
const ZONES_TOGGLE_OUTLINE_COLOR_SATELLITE = "#ffffff";
const OVERLAY_LABEL_TEXT_COLOR_STREETS = "#000000";
const OVERLAY_LABEL_HALO_COLOR_STREETS = "#ffffff";
const OVERLAY_LABEL_TEXT_COLOR_SATELLITE = "#ffffff";
const OVERLAY_LABEL_HALO_COLOR_SATELLITE = "#000000";
const OVERLAY_LABEL_HALO_WIDTH_STREETS = 1.5;
const OVERLAY_LABEL_HALO_WIDTH_SATELLITE = 2.3;
const OVERLAY_LABEL_HALO_BLUR_STREETS = 0.2;
const OVERLAY_LABEL_HALO_BLUR_SATELLITE = 0.4;
// Keep to a known-available font from the current basemap glyph set.
// Using unavailable font stacks can make symbol labels disappear.
const OVERLAY_LABEL_FONT_STACK = ["Noto Sans Regular"];
const ZONE_LABEL_TEXT_SIZE = 24;
const WEEKLY_WALK_TEXT_SIZE = 20;
const WALK_AM_TEXT_COLOR = "#A3E635";
const WALK_PM_TEXT_COLOR = "#5B5BEA";
const WALK_TEXT_HALO_COLOR = "#ffffff";
const WALK_AM_ICON_IMAGE_ID = "walk-am-icon";
const WALK_PM_ICON_IMAGE_ID = "walk-pm-icon";
const DISPATCH_AM_ICON_IMAGE_ID = "dispatch-am-icon";
const DISPATCH_PM_ICON_IMAGE_ID = "dispatch-pm-icon";
const STAGING_AREA_ICON_IMAGE_ID = "staging-area-icon";
const STAGING_AREA_CONFIRMED_ICON_IMAGE_ID = "staging-area-confirmed-icon";
const STAGING_AREA_FILL_COLOR = "#ff7a00";
const STAGING_AREA_STROKE_COLOR = "#cd6200";
const STAGING_AREA_CONFIRMED_FILL_COLOR = "#dc2626";
const STAGING_AREA_STROKE_WIDTH = 10;
const STAGING_AREA_CONFIRMED_STROKE_COLOR = "#7f1d1d";
const SCHOOLS_FILL_COLOR = "#1d4ed8";
const SCHOOLS_STROKE_COLOR = "#1d4ed8";
// SCHOOL POINT SIZE: edit these zoom/size values to change school circle size.
// These are set to half the sightings circle size.
const SCHOOLS_CIRCLE_RADIUS = ["interpolate", ["linear"], ["zoom"], 10, 1, 14, 3];
// SCHOOL TAP TARGET SIZE: larger invisible radius used for click/tap interactions.
// Increase/decrease these values to make school points easier/harder to tap.
const SCHOOLS_INTERACTION_RADIUS = ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 16];
// STAGING AREA MAP ICON SIZE: edit this value to change the square size on the map.
const STAGING_AREA_ICON_SIZE = 0.4;
const NYC_VIEWBOX = {
  west: -74.25909,
  south: 40.4774,
  east: -73.70018,
  north: 40.9176,
};


const DATA_PATHS = {
  dividingLine: "./data/dividing_line.geojson",
  sightingsCsv: "./processing/sightings.csv",
  stagingAreasCsv: "./processing/Staging-Areas.csv",
  sightingsGeoJsonFallback: "./data/confirmed_sightings.geojson",
  schools: "./data/schools.geojson",
  zones: "./data/zones_walk_log.geojson",
  dispatch: "./data/dispatch_walk_log.geojson",
  walkAmIcon: "./data/svg/walk_AM.svg",
  walkPmIcon: "./data/svg/walk_PM.svg",
  dispatchAmIcon: "./data/svg/dispatch_AM.svg",
  dispatchPmIcon: "./data/svg/dispatch_PM.svg",
};

const WALK_AREA_LABELS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "inwood-walk-zones-label",
      properties: { label_text: "INWOOD\nZONES" },
      geometry: {
        type: "Point",
        coordinates: toLngLat(40.86521452, -73.94263626),
      },
    },
    {
      type: "Feature",
      id: "washington-heights-walk-zones-label",
      properties: { label_text: "WASHINGTON\nHEIGHTS\nZONES" },
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
  weeklyWalkCounts: "weekly-walk-counts-source",
  dispatchWalkCounts: "dispatch-walk-counts-source",
  walkAreaLabels: "walk-area-labels-source",
  sightings: "sightings-source",
  schools: "schools-source",
  stagingAreas: "staging-areas-source",
  dividingLine: "dividing-line-source",
  dividingLabels: "dividing-labels-source",
};

const LAYER_IDS = {
  zonesFill: "zones-fill",
  zonesInteractionFill: "zones-interaction-fill",
  zonesCasing: "zones-casing",
  zonesOutline: "zones-outline",
  weeklyWalkOutline: "weekly-walk-outline",
  zonesBlackOutline: "zones-black-outline",
  zonesHoverOutline: "zones-hover-outline",
  zonesLabel: "zones-label",
  weeklyWalkCountsAm: "weekly-walk-counts-am-text",
  weeklyWalkCountsAmIcon: "weekly-walk-counts-am-icon",
  weeklyWalkCountsPm: "weekly-walk-counts-pm-text",
  weeklyWalkCountsPmIcon: "weekly-walk-counts-pm-icon",
  dispatchWalkPoint: "dispatch-walk-point",
  dispatchWalkTitle: "dispatch-walk-title",
  dispatchWalkCountsAm: "dispatch-walk-counts-am-text",
  dispatchWalkCountsAmIcon: "dispatch-walk-counts-am-icon",
  dispatchWalkCountsPm: "dispatch-walk-counts-pm-text",
  dispatchWalkCountsPmIcon: "dispatch-walk-counts-pm-icon",
  walkAreaLabels: "walk-area-labels",
  walkAreaLabelPoints: "walk-area-label-points",
  sightings: "confirmed-sightings",
  schools: "schools",
  schoolsInteraction: "schools-interaction",
  stagingAreas: "staging-areas",
  dividingLine: "dividing-line",
  dividingLabelAbove: "dividing-label-above",
  dividingLabelBelow: "dividing-label-below",
};

const AVERAGE_WEEK_VALUE = "__average__";

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
  schoolHoverPopup: null,
  schoolClickPopup: null,
  stagingHoverPopup: null,
  stagingClickPopup: null,
  searchMarker: null,
  searchMarkerTimeoutId: null,
  activeSearchController: null,
  activeZonesInteractionEnabled: false,
  iconLoadingPromises: {},
  hoveredZoneFeatureId: null,
  walkAreaDomMarkers: [],
  weeklyWalkWeekOptions: [],
  selectedWeeklyWalkWeek: null,
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
  appState.weeklyWalkWeekOptions = appState.data.weeklyWalkWeekOptions || [];
  appState.selectedWeeklyWalkWeek = appState.data.selectedWeeklyWalkWeek || null;
  initializeWeeklyWalkControls();
  appState.zonesBounds = computeGeoJsonBounds(appState.data.zonesRaw || appState.data.zonesFlat);
  appState.allBounds = computeCombinedBounds([
    appState.data.zonesRaw,
    appState.data.sightings,
    appState.data.schools,
    appState.data.stagingAreas,
    appState.data.dividingLine,
  ]);

  appState.map = new maplibregl.Map({
    container: "map",
    style: getBasemapStyle("streets"),
    center: INITIAL_MAP_CENTER,
    zoom: INITIAL_MAP_ZOOM,
    bearing: INITIAL_MAP_BEARING,
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

  appState.map.on("zoom", () => {
    updateWalkAreaDomMarkersVisibility();
  });

  appState.map.on("click", closeDrawerOnMobile);
}

async function loadAndPrepareData() {
  const [zonesRaw, dispatchRaw, sightingsRaw, schoolsRaw, stagingAreasRaw, dividingLineRaw] = await Promise.all([
    fetchGeoJson(DATA_PATHS.zones),
    fetchGeoJson(DATA_PATHS.dispatch),
    fetchSightingsGeoJsonWithFallback(DATA_PATHS.sightingsCsv, DATA_PATHS.sightingsGeoJsonFallback),
    fetchGeoJson(DATA_PATHS.schools),
    fetchStagingAreasGeoJsonFromCsv(DATA_PATHS.stagingAreasCsv),
    fetchGeoJson(DATA_PATHS.dividingLine),
  ]);

  const zonesPrepared = preprocessZones(zonesRaw);
  const zonesFlat = flattenZonesToPolygons(zonesPrepared);
  const zonesLabelPoints = buildZoneLabelPoints(zonesPrepared);
  const zoneColorExpression = buildZoneColorExpression(zonesPrepared.features || []);
  const weeklyWalkWeekOptions = extractWeeklyWalkWeekOptions(zonesPrepared);
  const selectedWeeklyWalkWeek =
    weeklyWalkWeekOptions.length > 0 ? AVERAGE_WEEK_VALUE : null;
  const weeklyWalkCountsLabelPoints = buildWeeklyWalkCountLabelPoints(
    zonesPrepared,
    selectedWeeklyWalkWeek
  );
  const dispatchPrepared = preprocessGenericFeatureCollection(dispatchRaw);
  const dispatchWalkCountsLabelPoints = buildDispatchWalkCountLabelPoints(
    dispatchPrepared,
    selectedWeeklyWalkWeek
  );
  const sightings = preprocessGenericFeatureCollection(sightingsRaw);
  const schools = preprocessPointFeatureCollection(schoolsRaw);
  const stagingAreas = preprocessStagingAreas(stagingAreasRaw);
  const dividingLine = preprocessGenericFeatureCollection(dividingLineRaw);
  const dividingLabels = buildDividingLabelPoints(dividingLine);

  return {
    zonesRaw: zonesPrepared,
    zonesFlat,
    zonesLabelPoints,
    zoneColorExpression,
    weeklyWalkWeekOptions,
    selectedWeeklyWalkWeek,
    weeklyWalkCountsLabelPoints,
    dispatchRaw: dispatchPrepared,
    dispatchWalkCountsLabelPoints,
    sightings,
    schools,
    stagingAreas,
    dividingLine,
    dividingLabels,
  };
}

async function fetchGeoJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed loading ${path}: HTTP ${response.status}`);
  return response.json();
}

async function fetchSightingsGeoJsonFromCsv(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed loading ${path}: HTTP ${response.status}`);

  const csvText = await response.text();
  const records = parseCsvRecords(csvText);
  return sightingsRecordsToGeoJson(records);
}

async function fetchSightingsGeoJsonWithFallback(csvPath, fallbackGeoJsonPath) {
  try {
    return await fetchSightingsGeoJsonFromCsv(csvPath);
  } catch (error) {
    console.warn(
      `Sightings CSV load failed (${csvPath}); falling back to ${fallbackGeoJsonPath}.`,
      error
    );
    return fetchGeoJson(fallbackGeoJsonPath);
  }
}

async function fetchStagingAreasGeoJsonFromCsv(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed loading ${path}: HTTP ${response.status}`);

  const csvText = await response.text();
  const records = parseCsvRecords(csvText);
  return stagingAreasRecordsToGeoJson(records);
}

async function fetchGeoJsonWithFallback(primaryPath, fallbackPath) {
  try {
    return await fetchGeoJson(primaryPath);
  } catch (error) {
    console.warn(`Primary GeoJSON failed (${primaryPath}), trying fallback (${fallbackPath}).`, error);
    return fetchGeoJson(fallbackPath);
  }
}

function parseCsvRecords(csvText) {
  const rows = parseCsvRows(csvText);
  if (rows.length === 0) return [];

  const headers = rows[0].map((header, index) => {
    const normalized = String(header ?? "");
    return (index === 0 ? normalized.replace(/^\uFEFF/, "") : normalized).trim();
  });

  return rows
    .slice(1)
    .filter((row) => row.some((value) => String(value ?? "").trim() !== ""))
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        if (!header) return;
        record[header] = String(row[index] ?? "");
      });
      return record;
    });
}

function parseCsvRows(csvText) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i];

    if (inQuotes) {
      if (ch === "\"") {
        if (csvText[i + 1] === "\"") {
          value += "\"";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === "\"") {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(value);
      value = "";
      continue;
    }

    if (ch === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    if (ch !== "\r") value += ch;
  }

  row.push(value);
  const hasAnyValue = row.some((cell) => String(cell ?? "").trim() !== "");
  if (hasAnyValue || rows.length > 0) rows.push(row);

  return rows;
}

function sightingsRecordsToGeoJson(records) {
  return csvRecordsToPointGeoJson(records, {
    latitudeFields: ["Latitude", "latitude"],
    longitudeFields: ["Longitude", "longitude"],
  });
}

function stagingAreasRecordsToGeoJson(records) {
  return csvRecordsToPointGeoJson(records, {
    latitudeFields: ["latitude", "Latitude"],
    longitudeFields: ["longitude", "Longitude"],
  });
}

function csvRecordsToPointGeoJson(records, coordinateFields) {
  const features = records
    .map((record, index) => {
      const latitude = parseCsvCoordinate(getRecordValue(record, coordinateFields?.latitudeFields || []));
      const longitude = parseCsvCoordinate(
        getRecordValue(record, coordinateFields?.longitudeFields || [])
      );

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

      return {
        type: "Feature",
        id: index + 1,
        properties: sanitizeProperties(record),
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      };
    })
    .filter(Boolean);

  return {
    type: "FeatureCollection",
    features,
  };
}

function getRecordValue(record, candidateFields) {
  const entries = Object.entries(record || {});

  for (const fieldName of candidateFields || []) {
    if (Object.prototype.hasOwnProperty.call(record || {}, fieldName)) {
      return record[fieldName];
    }

    const match = entries.find(
      ([key]) => String(key).trim().toLowerCase() === String(fieldName).trim().toLowerCase()
    );
    if (match) return match[1];
  }

  return undefined;
}

function parseCsvCoordinate(raw) {
  const value = Number.parseFloat(String(raw ?? "").trim());
  return Number.isFinite(value) ? value : NaN;
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

function preprocessStagingAreas(input) {
  const base = preprocessGenericFeatureCollection(input);

  base.features = base.features
    .filter((feature) => feature?.geometry?.type === "Point")
    .map((feature, index) => {
      const properties = sanitizeProperties(feature.properties || {});
      properties.__staging_status_normalized = normalizeStatusValue(properties.Status);

      return {
        type: "Feature",
        id: feature.id ?? index + 1,
        properties,
        geometry: feature.geometry,
      };
    });

  return base;
}

function preprocessPointFeatureCollection(input) {
  const base = preprocessGenericFeatureCollection(input);
  base.features = base.features.filter((feature) => feature?.geometry?.type === "Point");
  return base;
}

function normalizeStatusValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
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

function extractWeeklyWalkWeekOptions(zonesGeoJson) {
  const weekMap = new Map();

  (zonesGeoJson?.features || []).forEach((feature) => {
    const props = feature?.properties || {};

    Object.keys(props).forEach((key) => {
      const match = String(key).match(/^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(AM|PM)$/i);
      if (!match) return;

      const weekLabel = match[1];
      const sortValue = getWeekLabelSortValue(weekLabel);
      if (!Number.isFinite(sortValue)) return;

      if (!weekMap.has(weekLabel)) {
        weekMap.set(weekLabel, {
          week: weekLabel,
          sortValue,
        });
      }
    });
  });

  return Array.from(weekMap.values()).sort((a, b) => a.sortValue - b.sortValue);
}

function getWeekLabelSortValue(weekLabel) {
  const match = String(weekLabel).match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!match) return Number.NaN;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return Number.NaN;

  let year = new Date().getFullYear();
  if (match[3]) {
    const parsedYear = Number(match[3]);
    if (!Number.isFinite(parsedYear)) return Number.NaN;
    year = match[3].length === 2 ? 2000 + parsedYear : parsedYear;
  }

  return year * 10000 + month * 100 + day;
}

function parseWeekLabelParts(weekLabel) {
  const match = String(weekLabel).match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;

  return { month, day };
}

function resolveWeeklyFieldName(properties, weekLabel, period) {
  const targetPeriod = String(period || "").toUpperCase();
  const direct = `${weekLabel} ${targetPeriod}`;
  const props = properties || {};

  if (Object.prototype.hasOwnProperty.call(props, direct)) return direct;

  const target = parseWeekLabelParts(weekLabel);
  if (!target) return direct;

  for (const key of Object.keys(props)) {
    const match = String(key).match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(AM|PM)$/i);
    if (!match) continue;

    const month = Number(match[1]);
    const day = Number(match[2]);
    const keyPeriod = String(match[4]).toUpperCase();

    if (keyPeriod !== targetPeriod) continue;
    if (month === target.month && day === target.day) return key;
  }

  return direct;
}

function buildWeeklyWalkCountLabelPoints(zonesGeoJson, weekLabel) {
  const features = [];
  if (!weekLabel) return { type: "FeatureCollection", features };
  const isAverageSelection = weekLabel === AVERAGE_WEEK_VALUE || String(weekLabel).toLowerCase() === "average";

  (zonesGeoJson?.features || []).forEach((feature, index) => {
    const props = feature?.properties || {};
    const zoneId = props.Zone_ID;
    if (!zoneId || zoneId === "Dispatch") return;

    const amRaw = isAverageSelection
      ? props["Avg AM"]
      : props[resolveWeeklyFieldName(props, weekLabel, "AM")];
    const pmRaw = isAverageSelection
      ? props["Avg PM"]
      : props[resolveWeeklyFieldName(props, weekLabel, "PM")];
    const amValue = Number(amRaw);
    const pmValue = Number(pmRaw);

    const amCount = Number.isFinite(amValue)
      ? (isAverageSelection ? Math.round(amValue * 10) / 10 : Math.round(amValue))
      : 0;
    const pmCount = Number.isFinite(pmValue)
      ? (isAverageSelection ? Math.round(pmValue * 10) / 10 : Math.round(pmValue))
      : 0;

    const displayAm = isAverageSelection ? amCount : Math.round(amCount);
    const displayPm = isAverageSelection ? pmCount : Math.round(pmCount);
    if (displayAm <= 0 && displayPm <= 0) return;

    const coordinates = getZoneLabelPointFromGeometry(feature?.geometry);
    if (!coordinates) return;

    features.push({
      type: "Feature",
      id: `weekly-walk-counts-${feature?.id ?? index + 1}`,
      properties: {
        Zone_ID: zoneId,
        week_label: weekLabel,
        walk_am_count: Math.max(0, displayAm),
        walk_pm_count: Math.max(0, displayPm),
      },
      geometry: { type: "Point", coordinates },
    });
  });

  return { type: "FeatureCollection", features };
}

function buildDispatchWalkCountLabelPoints(dispatchGeoJson, weekLabel) {
  const features = [];
  if (!weekLabel) return { type: "FeatureCollection", features };

  const isAverageSelection = weekLabel === AVERAGE_WEEK_VALUE || String(weekLabel).toLowerCase() === "average";
  const dispatchFeature = (dispatchGeoJson?.features || []).find((feature) => {
    const zoneId = String(feature?.properties?.Zone_ID || "").trim();
    return zoneId === "Dispatch";
  });

  if (!dispatchFeature) return { type: "FeatureCollection", features };

  const props = dispatchFeature.properties || {};
  const amRaw = isAverageSelection
    ? props["Avg AM"]
    : props[resolveWeeklyFieldName(props, weekLabel, "AM")];
  const pmRaw = isAverageSelection
    ? props["Avg PM"]
    : props[resolveWeeklyFieldName(props, weekLabel, "PM")];

  const amValue = Number(amRaw);
  const pmValue = Number(pmRaw);
  const amCount = Number.isFinite(amValue)
    ? (isAverageSelection ? Math.round(amValue * 10) / 10 : Math.round(amValue))
    : 0;
  const pmCount = Number.isFinite(pmValue)
    ? (isAverageSelection ? Math.round(pmValue * 10) / 10 : Math.round(pmValue))
    : 0;

  const displayAm = isAverageSelection ? amCount : Math.round(amCount);
  const displayPm = isAverageSelection ? pmCount : Math.round(pmCount);
  if (displayAm <= 0 && displayPm <= 0) return { type: "FeatureCollection", features };

  const geometry = dispatchFeature.geometry || {};
  const coordinates =
    geometry.type === "Point"
      ? geometry.coordinates
      : extractFirstCoordinate(geometry.coordinates);
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return { type: "FeatureCollection", features };
  }

  features.push({
    type: "Feature",
    id: "dispatch-weekly-walk-counts",
    properties: {
      Zone_ID: "Dispatch",
      week_label: weekLabel,
      walk_am_count: Math.max(0, displayAm),
      walk_pm_count: Math.max(0, displayPm),
    },
    geometry: { type: "Point", coordinates },
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

async function ensureSvgIconLoaded(imageId, iconPath) {
  const map = appState.map;
  if (!map) return;
  if (map.hasImage(imageId)) return;

  if (appState.iconLoadingPromises[imageId]) {
    await appState.iconLoadingPromises[imageId];
    return;
  }

  appState.iconLoadingPromises[imageId] = (async () => {
    try {
      const response = await fetch(iconPath);
      if (!response.ok) throw new Error(`Failed loading ${iconPath}: HTTP ${response.status}`);

      const svg = await response.text();
      const imageData = await svgTextToImageData(svg, 96);

      if (!map.hasImage(imageId)) {
        map.addImage(imageId, imageData, { pixelRatio: 2 });
      }
    } catch (error) {
      console.error(`Failed to load icon ${imageId}:`, error);
    } finally {
      delete appState.iconLoadingPromises[imageId];
    }
  })();

  await appState.iconLoadingPromises[imageId];
}

async function ensureWalkIconsLoaded() {
  await Promise.all([
    ensureSvgIconLoaded(WALK_AM_ICON_IMAGE_ID, DATA_PATHS.walkAmIcon),
    ensureSvgIconLoaded(WALK_PM_ICON_IMAGE_ID, DATA_PATHS.walkPmIcon),
  ]);
}

async function ensureDispatchIconsLoaded() {
  await Promise.all([
    ensureSvgIconLoaded(DISPATCH_AM_ICON_IMAGE_ID, DATA_PATHS.dispatchAmIcon),
    ensureSvgIconLoaded(DISPATCH_PM_ICON_IMAGE_ID, DATA_PATHS.dispatchPmIcon),
  ]);
}

function createSquareImageData(fillColor, strokeColor, size = 64, strokeWidth = 6) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const inset = strokeWidth / 2;
  const squareSize = size - strokeWidth;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  ctx.rect(inset, inset, squareSize, squareSize);
  ctx.fill();
  ctx.stroke();

  return ctx.getImageData(0, 0, size, size);
}

function ensureGeneratedIconLoaded(imageId, imageData) {
  const map = appState.map;
  if (!map || map.hasImage(imageId)) return;
  map.addImage(imageId, imageData, { pixelRatio: 2 });
}

function ensureStagingAreaIconsLoaded() {
  ensureGeneratedIconLoaded(
    STAGING_AREA_ICON_IMAGE_ID,
    createSquareImageData(
      STAGING_AREA_FILL_COLOR,
      STAGING_AREA_STROKE_COLOR,
      64,
      STAGING_AREA_STROKE_WIDTH
    )
  );
  ensureGeneratedIconLoaded(
    STAGING_AREA_CONFIRMED_ICON_IMAGE_ID,
    createSquareImageData(STAGING_AREA_CONFIRMED_FILL_COLOR, STAGING_AREA_CONFIRMED_STROKE_COLOR)
  );
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
  const weeklyWalkCountsToggle = document.getElementById("toggleWeeklyWalkCounts");
  const zonesOutlineToggle = document.getElementById("toggleZonesOutline");
  const sightingsToggle = document.getElementById("toggleSightings");
  const schoolsToggle = document.getElementById("toggleSchools");
  const stagingAreasToggle = document.getElementById("toggleStagingAreas");

  // Prevent stale browser-restored state.
  if (zonesToggle) zonesToggle.checked = true;
  if (zonesLabelToggle) zonesLabelToggle.checked = true;
  if (weeklyWalkCountsToggle) weeklyWalkCountsToggle.checked = false;
  if (zonesOutlineToggle) zonesOutlineToggle.checked = false;
  if (sightingsToggle) sightingsToggle.checked = true;
  if (schoolsToggle) schoolsToggle.checked = false;
  if (stagingAreasToggle) stagingAreasToggle.checked = false;

  if (zonesLabelToggle && weeklyWalkCountsToggle) {
    zonesLabelToggle.addEventListener("change", () => {
      if (!zonesLabelToggle.checked) return;
      weeklyWalkCountsToggle.checked = false;
      updateWeeklyWalkControlVisibility();
      applyLayerVisibilityFromToggles();
    });

    weeklyWalkCountsToggle.addEventListener("change", () => {
      if (!weeklyWalkCountsToggle.checked) {
        updateWeeklyWalkControlVisibility();
        applyLayerVisibilityFromToggles();
        return;
      }

      zonesLabelToggle.checked = false;
      updateWeeklyWalkControlVisibility();
      applyLayerVisibilityFromToggles();
    });
  }

  [
    zonesToggle,
    zonesLabelToggle,
    weeklyWalkCountsToggle,
    zonesOutlineToggle,
    sightingsToggle,
    schoolsToggle,
    stagingAreasToggle,
  ].forEach((toggle) => {
    if (!toggle) return;
    toggle.addEventListener("change", applyLayerVisibilityFromToggles);
  });

  updateStagingLegendVisibility();
  updateWeeklyWalkControlVisibility();
}

function updateStagingLegendVisibility() {
  const stagingAreasVisible = document.getElementById("toggleStagingAreas")?.checked ?? false;
  const stagingLegendSubgroup = document.getElementById("stagingAreasLegendSubgroup");
  if (!stagingLegendSubgroup) return;
  stagingLegendSubgroup.hidden = !stagingAreasVisible;
}

function initializeWeeklyWalkControls() {
  const selectEl = document.getElementById("walkWeekSelect");
  const prevBtn = document.getElementById("walkWeekPrev");
  const nextBtn = document.getElementById("walkWeekNext");
  if (!selectEl) return;

  selectEl.innerHTML = "";

  const optionsChrono = appState.weeklyWalkWeekOptions || [];
  const options = [
    { week: AVERAGE_WEEK_VALUE, label: "Weekly Average" },
    ...[...optionsChrono].reverse().map((option) => ({
      ...option,
      label: option.week,
    })),
  ];
  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.week;
    opt.textContent = option.label;
    selectEl.appendChild(opt);
  });

  if (appState.selectedWeeklyWalkWeek && options.some((option) => option.week === appState.selectedWeeklyWalkWeek)) {
    selectEl.value = appState.selectedWeeklyWalkWeek;
  } else if (options.length > 0) {
    // Default to Weekly Average.
    selectEl.value = options[0].week;
    appState.selectedWeeklyWalkWeek = selectEl.value;
  }

  function getDateOptionIndices() {
    return Array.from(selectEl.options)
      .map((_, index) => index)
      .filter((index) => selectEl.options[index].value !== AVERAGE_WEEK_VALUE);
  }

  function getAverageOptionIndex() {
    return Array.from(selectEl.options).findIndex(
      (option) => option.value === AVERAGE_WEEK_VALUE
    );
  }

  function getCurrentDatePosition() {
    const dateIndices = getDateOptionIndices();
    const selectedIndex = selectEl.selectedIndex;
    const pos = dateIndices.indexOf(selectedIndex);
    return { dateIndices, pos };
  }

  function updateWeekNavButtons() {
    if (!prevBtn && !nextBtn) return;
    const { dateIndices, pos } = getCurrentDatePosition();
    const averageIndex = getAverageOptionIndex();
    const hasAverage = averageIndex >= 0;

    if (dateIndices.length === 0) {
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    if (selectEl.value === AVERAGE_WEEK_VALUE) {
      // From Average, allow left to jump back to most recent date.
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    // Left button = previous date (older), so it moves down the date list.
    if (prevBtn) prevBtn.disabled = pos < 0 || pos >= dateIndices.length - 1;
    // Right button = later date (newer), and from newest it can move to Weekly Average.
    if (nextBtn) nextBtn.disabled = pos < 0 || (!hasAverage && pos <= 0);
  }

  function commitSelectedWeek() {
    appState.selectedWeeklyWalkWeek = selectEl.value || null;
    refreshWeeklyWalkCountSource();
    refreshDispatchWalkCountSource();
    applyLayerVisibilityFromToggles();
    updateWeekNavButtons();
  }

  selectEl.addEventListener("change", () => {
    commitSelectedWeek();
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const { dateIndices, pos } = getCurrentDatePosition();
      if (dateIndices.length === 0) return;

      if (selectEl.value === AVERAGE_WEEK_VALUE) {
        selectEl.selectedIndex = dateIndices[0];
        commitSelectedWeek();
        return;
      }

      // Left button: previous date (older) -> move down one date.
      if (pos < 0 || pos >= dateIndices.length - 1) return;
      selectEl.selectedIndex = dateIndices[pos + 1];
      commitSelectedWeek();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (selectEl.value === AVERAGE_WEEK_VALUE) return;

      const { dateIndices, pos } = getCurrentDatePosition();
      const averageIndex = getAverageOptionIndex();
      // Right button: later date (newer) -> move up one date.
      if (pos === 0 && averageIndex >= 0) {
        selectEl.selectedIndex = averageIndex;
        commitSelectedWeek();
        return;
      }
      if (pos <= 0) return;
      selectEl.selectedIndex = dateIndices[pos - 1];
      commitSelectedWeek();
    });
  }

  updateWeekNavButtons();

  updateWeeklyWalkControlVisibility();
}

function updateWeeklyWalkControlVisibility() {
  const controlsEl = document.getElementById("walkWeekControls");
  if (!controlsEl) return;

  const zonesLabelChecked = document.getElementById("toggleZonesLabel")?.checked ?? false;
  const weeklyChecked = document.getElementById("toggleWeeklyWalkCounts")?.checked ?? false;
  const show = weeklyChecked && !zonesLabelChecked;

  controlsEl.hidden = !show;
}

function refreshWeeklyWalkCountSource() {
  if (!appState.data) return;

  const points = buildWeeklyWalkCountLabelPoints(
    appState.data.zonesRaw,
    appState.selectedWeeklyWalkWeek
  );

  appState.data.weeklyWalkCountsLabelPoints = points;

  const source = appState.map?.getSource?.(SOURCE_IDS.weeklyWalkCounts);
  if (source) source.setData(points);
}

function refreshDispatchWalkCountSource() {
  if (!appState.data) return;

  const points = buildDispatchWalkCountLabelPoints(
    appState.data.dispatchRaw,
    appState.selectedWeeklyWalkWeek
  );

  appState.data.dispatchWalkCountsLabelPoints = points;

  const source = appState.map?.getSource?.(SOURCE_IDS.dispatchWalkCounts);
  if (source) source.setData(points);
}

function getActiveZonesData() {
  return appState.zonesDataMode === "flat" ? appState.data.zonesFlat : appState.data.zonesRaw;
}

function getZonesToggleOutlineColor() {
  return appState.currentBasemap === "satellite"
    ? ZONES_TOGGLE_OUTLINE_COLOR_SATELLITE
    : ZONES_TOGGLE_OUTLINE_COLOR_STREETS;
}

function getOverlayLabelPaint() {
  const isSatellite = appState.currentBasemap === "satellite";

  return {
    "text-color": isSatellite ? OVERLAY_LABEL_TEXT_COLOR_SATELLITE : OVERLAY_LABEL_TEXT_COLOR_STREETS,
    "text-halo-color": isSatellite ? OVERLAY_LABEL_HALO_COLOR_SATELLITE : OVERLAY_LABEL_HALO_COLOR_STREETS,
    "text-halo-width": isSatellite
      ? OVERLAY_LABEL_HALO_WIDTH_SATELLITE
      : OVERLAY_LABEL_HALO_WIDTH_STREETS,
    "text-halo-blur": isSatellite
      ? OVERLAY_LABEL_HALO_BLUR_SATELLITE
      : OVERLAY_LABEL_HALO_BLUR_STREETS,
    "text-opacity": 1,
  };
}

function installOverlaySourcesAndLayers() {
  const map = appState.map;
  if (!map || !appState.data) return;

  addOrUpdateGeoJsonSource(SOURCE_IDS.zones, getActiveZonesData());
  addOrUpdateGeoJsonSource(SOURCE_IDS.zonesLabels, appState.data.zonesLabelPoints);
  addOrUpdateGeoJsonSource(SOURCE_IDS.weeklyWalkCounts, appState.data.weeklyWalkCountsLabelPoints);
  addOrUpdateGeoJsonSource(SOURCE_IDS.dispatchWalkCounts, appState.data.dispatchWalkCountsLabelPoints);
  addOrUpdateGeoJsonSource(SOURCE_IDS.walkAreaLabels, WALK_AREA_LABELS_GEOJSON);
  addOrUpdateGeoJsonSource(SOURCE_IDS.sightings, appState.data.sightings);
  addOrUpdateGeoJsonSource(SOURCE_IDS.schools, appState.data.schools);
  addOrUpdateGeoJsonSource(SOURCE_IDS.stagingAreas, appState.data.stagingAreas);
  addOrUpdateGeoJsonSource(SOURCE_IDS.dividingLine, appState.data.dividingLine);
  addOrUpdateGeoJsonSource(SOURCE_IDS.dividingLabels, appState.data.dividingLabels);

  // A) Zones polygons
  addLayerIfMissing({
    id: LAYER_IDS.zonesFill,
    type: "fill",
    source: SOURCE_IDS.zones,
    paint: {
      "fill-color": appState.data.zoneColorExpression || "#2563eb",
      "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.4, 0.3],
    },
  });

  // Invisible interaction surface so zone hover/click still works even when
  // only the outline layer is enabled.
  addLayerIfMissing({
    id: LAYER_IDS.zonesInteractionFill,
    type: "fill",
    source: SOURCE_IDS.zones,
    paint: {
      "fill-color": "#000000",
      "fill-opacity": 0,
    },
  });

  // Keep this casing disabled; true zone outlines are drawn by zonesOutline.
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
      "line-color": getZonesToggleOutlineColor(),
      "line-width": ZONES_TOGGLE_OUTLINE_WIDTH,
      "line-opacity": 1,
    },
  });

  addLayerIfMissing({
    id: LAYER_IDS.zonesOutline,
    type: "line",
    source: SOURCE_IDS.zones,
    paint: {
      "line-color": appState.data.zoneColorExpression || "#2563eb",
      "line-width": ZONES_FILL_OUTLINE_WIDTH,
      "line-opacity": 1,
    },
  });

  // Weekly walk-count mode boundary overlay: white outline, no fill.
  addLayerIfMissing({
    id: LAYER_IDS.weeklyWalkOutline,
    type: "line",
    source: SOURCE_IDS.zones,
    paint: {
      // Keep weekly polygon overlay active for mode logic, but visually hidden.
      "line-color": "rgba(255,255,255,0)",
      "line-width": 0,
      "line-opacity": 0,
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
      "text-size": ZONE_LABEL_TEXT_SIZE,
      "text-font": OVERLAY_LABEL_FONT_STACK,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: getOverlayLabelPaint(),
  });

  addWeeklyWalkCountLayersIfReady();
  addDispatchWalkCountLayersIfReady();

  // B) Dividing line + labels (always visible)
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

  // Keep confirmed sightings above the dividing line while still below
  // the dividing-line labels.
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

  addSchoolsLayerIfReady();

  addStagingAreaLayerIfReady();

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
    minzoom: WALK_AREA_LABEL_MIN_ZOOM,
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
    minzoom: WALK_AREA_LABEL_MIN_ZOOM,
    paint: {
      "circle-radius": 2,
      "circle-color": "#a4bdff",
      "circle-stroke-width": 0,
    },
  });

  // Keep basemap text labels above overlays without lifting non-label basemap layers
  // (e.g., buildings) above the zone polygons.
  bringBasemapLabelsToTop();

  bindOverlayInteractions();
}

function addStagingAreaLayerIfReady() {
  const map = appState.map;
  if (!map) return;

  ensureStagingAreaIconsLoaded();

  addLayerIfMissing({
    id: LAYER_IDS.stagingAreas,
    type: "symbol",
    source: SOURCE_IDS.stagingAreas,
    layout: {
      "icon-image": [
        "case",
        ["==", ["get", "__staging_status_normalized"], "confirmed"],
        STAGING_AREA_CONFIRMED_ICON_IMAGE_ID,
        STAGING_AREA_ICON_IMAGE_ID,
      ],
      "icon-size": STAGING_AREA_ICON_SIZE,
      "icon-anchor": "center",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  applyLayerVisibilityFromToggles();
}

function addSchoolsLayerIfReady() {
  const map = appState.map;
  if (!map) return;

  addLayerIfMissing({
    id: LAYER_IDS.schools,
    type: "circle",
    source: SOURCE_IDS.schools,
    paint: {
      "circle-color": SCHOOLS_FILL_COLOR,
      "circle-radius": SCHOOLS_CIRCLE_RADIUS,
      "circle-stroke-color": SCHOOLS_STROKE_COLOR,
      "circle-stroke-width": 1.5,
      "circle-opacity": 0.95,
    },
  });

  addLayerIfMissing({
    id: LAYER_IDS.schoolsInteraction,
    type: "circle",
    source: SOURCE_IDS.schools,
    paint: {
      "circle-color": "#000000",
      "circle-radius": SCHOOLS_INTERACTION_RADIUS,
      "circle-opacity": 0,
      "circle-stroke-width": 0,
    },
  });

  applyLayerVisibilityFromToggles();
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

function isBasemapLabelLayer(layer) {
  if (!layer) return false;

  // Satellite basemap label raster layer.
  if (layer.id === "carto-labels") return true;

  // Vector basemap label layers are symbol layers that actually draw text.
  if (layer.type === "symbol") {
    const textField = layer.layout?.["text-field"];
    return textField !== undefined && textField !== null && textField !== "";
  }

  return false;
}

function bringBasemapLabelsToTop() {
  const map = appState.map;
  const styleLayers = map?.getStyle?.()?.layers || [];
  if (!map || !styleLayers.length) return;

  const overlayLayerIds = new Set(Object.values(LAYER_IDS));

  const basemapLabelLayerIds = styleLayers
    .filter((layer) => !overlayLayerIds.has(layer.id) && isBasemapLabelLayer(layer))
    .map((layer) => layer.id);

  // Keep basemap labels above zone polygons/outlines, but below our custom
  // overlay label layers (Zone Number / Weekly counts).
  const overlayLabelAnchorId = map.getLayer(LAYER_IDS.zonesLabel) ? LAYER_IDS.zonesLabel : null;

  basemapLabelLayerIds.forEach((layerId) => {
    if (!map.getLayer(layerId)) return;
    if (overlayLabelAnchorId) {
      map.moveLayer(layerId, overlayLabelAnchorId);
      return;
    }

    map.moveLayer(layerId);
  });
}

function addLayerIfMissing(layerDefinition, beforeLayerId = null) {
  if (!appState.map.getLayer(layerDefinition.id)) {
    if (beforeLayerId && appState.map.getLayer(beforeLayerId)) {
      appState.map.addLayer(layerDefinition, beforeLayerId);
      return;
    }

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

  updateWalkAreaDomMarkersVisibility();
}

function updateWalkAreaDomMarkersVisibility() {
  const map = appState.map;
  if (!map) return;

  const visible = map.getZoom() >= WALK_AREA_LABEL_MIN_ZOOM;
  appState.walkAreaDomMarkers.forEach((marker) => {
    const el = marker?.getElement?.();
    if (el) el.style.display = visible ? "" : "none";
  });
}

function toLngLat(lat, lng) {
  return [lng, lat];
}

async function addWeeklyWalkCountLayersIfReady() {
  const map = appState.map;
  if (!map) return;

  // Text layers first (same idea as old regular walkers): labels should render
  // even if icon loading fails.
  addLayerIfMissing({
    id: LAYER_IDS.weeklyWalkCountsAm,
    type: "symbol",
    source: SOURCE_IDS.weeklyWalkCounts,
    minzoom: ZONE_LABEL_MIN_ZOOM,
    filter: [">", ["to-number", ["get", "walk_am_count"]], 0],
    layout: {
      "text-field": ["to-string", ["get", "walk_am_count"]],
      "text-size": WEEKLY_WALK_TEXT_SIZE,
      "text-font": OVERLAY_LABEL_FONT_STACK,
      "text-anchor": "right",
      "text-offset": [-0.65, 0],
      "text-justify": "right",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: getOverlayLabelPaint(),
  });

  addLayerIfMissing({
    id: LAYER_IDS.weeklyWalkCountsPm,
    type: "symbol",
    source: SOURCE_IDS.weeklyWalkCounts,
    minzoom: ZONE_LABEL_MIN_ZOOM,
    filter: [">", ["to-number", ["get", "walk_pm_count"]], 0],
    layout: {
      "text-field": ["to-string", ["get", "walk_pm_count"]],
      "text-size": WEEKLY_WALK_TEXT_SIZE,
      "text-font": OVERLAY_LABEL_FONT_STACK,
      "text-anchor": "right",
      "text-offset": [-0.65, 1.05],
      "text-justify": "right",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: getOverlayLabelPaint(),
  });

  await ensureWalkIconsLoaded();

  if (map.hasImage(WALK_AM_ICON_IMAGE_ID)) {
    addLayerIfMissing({
      id: LAYER_IDS.weeklyWalkCountsAmIcon,
      type: "symbol",
      source: SOURCE_IDS.weeklyWalkCounts,
      minzoom: ZONE_LABEL_MIN_ZOOM,
      filter: [">", ["to-number", ["get", "walk_am_count"]], 0],
      layout: {
        "icon-image": WALK_AM_ICON_IMAGE_ID,
        "icon-size": 0.62,
        "icon-anchor": "center",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });
  }

  if (map.hasImage(WALK_PM_ICON_IMAGE_ID)) {
    addLayerIfMissing({
      id: LAYER_IDS.weeklyWalkCountsPmIcon,
      type: "symbol",
      source: SOURCE_IDS.weeklyWalkCounts,
      minzoom: ZONE_LABEL_MIN_ZOOM,
      filter: [">", ["to-number", ["get", "walk_pm_count"]], 0],
      layout: {
        "icon-image": WALK_PM_ICON_IMAGE_ID,
        "icon-size": 0.62,
        "icon-anchor": "center",
        "icon-offset": [0, 30],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });
  }

  applyLayerVisibilityFromToggles();
}

async function addDispatchWalkCountLayersIfReady() {
  const map = appState.map;
  if (!map) return;

  addLayerIfMissing({
    id: LAYER_IDS.dispatchWalkPoint,
    type: "circle",
    minzoom: ZONE_LABEL_MIN_ZOOM,
    source: SOURCE_IDS.dispatchWalkCounts,
    paint: {
      "circle-radius": 7,
      "circle-color": "#000000",
      "circle-opacity": 0,
      "circle-stroke-width": 0,
    },
  });

  addLayerIfMissing({
    id: LAYER_IDS.dispatchWalkTitle,
    type: "symbol",
    source: SOURCE_IDS.dispatchWalkCounts,
    minzoom: ZONE_LABEL_MIN_ZOOM,
    layout: {
      "text-field": "DISPATCH",
      "text-size": WEEKLY_WALK_TEXT_SIZE,
      "text-font": OVERLAY_LABEL_FONT_STACK,
      "text-anchor": "center",
      "text-offset": [0, -1.4],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: getOverlayLabelPaint(),
  });

  addLayerIfMissing({
    id: LAYER_IDS.dispatchWalkCountsAm,
    type: "symbol",
    source: SOURCE_IDS.dispatchWalkCounts,
    minzoom: ZONE_LABEL_MIN_ZOOM,
    filter: [">", ["to-number", ["get", "walk_am_count"]], 0],
    layout: {
      "text-field": ["to-string", ["get", "walk_am_count"]],
      "text-size": WEEKLY_WALK_TEXT_SIZE,
      "text-font": OVERLAY_LABEL_FONT_STACK,
      "text-anchor": "right",
      "text-offset": [-1.05, 0],
      "text-justify": "right",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: getOverlayLabelPaint(),
  });

  addLayerIfMissing({
    id: LAYER_IDS.dispatchWalkCountsPm,
    type: "symbol",
    source: SOURCE_IDS.dispatchWalkCounts,
    minzoom: ZONE_LABEL_MIN_ZOOM,
    filter: [">", ["to-number", ["get", "walk_pm_count"]], 0],
    layout: {
      "text-field": ["to-string", ["get", "walk_pm_count"]],
      "text-size": WEEKLY_WALK_TEXT_SIZE,
      "text-font": OVERLAY_LABEL_FONT_STACK,
      "text-anchor": "right",
      "text-offset": [-1.05, 1.45],
      "text-justify": "right",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: getOverlayLabelPaint(),
  });

  await ensureDispatchIconsLoaded();

  if (map.hasImage(DISPATCH_AM_ICON_IMAGE_ID)) {
    addLayerIfMissing({
      id: LAYER_IDS.dispatchWalkCountsAmIcon,
      type: "symbol",
      source: SOURCE_IDS.dispatchWalkCounts,
      minzoom: ZONE_LABEL_MIN_ZOOM,
      filter: [">", ["to-number", ["get", "walk_am_count"]], 0],
      layout: {
        "icon-image": DISPATCH_AM_ICON_IMAGE_ID,
        "icon-size": 0.62,
        "icon-anchor": "center",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });
  }

  if (map.hasImage(DISPATCH_PM_ICON_IMAGE_ID)) {
    addLayerIfMissing({
      id: LAYER_IDS.dispatchWalkCountsPmIcon,
      type: "symbol",
      source: SOURCE_IDS.dispatchWalkCounts,
      minzoom: ZONE_LABEL_MIN_ZOOM,
      filter: [">", ["to-number", ["get", "walk_pm_count"]], 0],
      layout: {
        "icon-image": DISPATCH_PM_ICON_IMAGE_ID,
        "icon-size": 0.62,
        "icon-anchor": "center",
        "icon-offset": [0, 42],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });
  }

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
  const weeklyWalkCountsToggle = document.getElementById("toggleWeeklyWalkCounts");
  let zonesLabelVisible = zonesLabelToggle?.checked ?? true;
  let weeklyWalkCountsVisible = weeklyWalkCountsToggle?.checked ?? false;

  // Safety guard: these two sublayers are mutually exclusive.
  if (zonesLabelVisible && weeklyWalkCountsVisible) {
    zonesLabelVisible = false;
    if (zonesLabelToggle) zonesLabelToggle.checked = false;
  }

  const zonesOutlineVisible = document.getElementById("toggleZonesOutline")?.checked ?? false;
  const sightingsVisible = document.getElementById("toggleSightings")?.checked ?? true;
  const schoolsVisible = document.getElementById("toggleSchools")?.checked ?? false;
  const stagingAreasVisible = document.getElementById("toggleStagingAreas")?.checked ?? false;

  setLayerVisibility(
    [
      LAYER_IDS.zonesFill,
      LAYER_IDS.zonesInteractionFill,
      LAYER_IDS.zonesCasing,
      LAYER_IDS.zonesOutline,
      LAYER_IDS.zonesHoverOutline,
    ],
    zonesVisible
  );

  setLayerVisibility([LAYER_IDS.zonesInteractionFill], zonesVisible || zonesOutlineVisible);

  setLayerVisibility([LAYER_IDS.zonesBlackOutline], zonesOutlineVisible);
  setLayerVisibility([LAYER_IDS.weeklyWalkOutline], weeklyWalkCountsVisible);

  setLayerVisibility([LAYER_IDS.zonesLabel], zonesLabelVisible);
  setLayerVisibility(
    [
      LAYER_IDS.weeklyWalkCountsAm,
      LAYER_IDS.weeklyWalkCountsAmIcon,
      LAYER_IDS.weeklyWalkCountsPm,
      LAYER_IDS.weeklyWalkCountsPmIcon,
      LAYER_IDS.dispatchWalkPoint,
      LAYER_IDS.dispatchWalkTitle,
      LAYER_IDS.dispatchWalkCountsAm,
      LAYER_IDS.dispatchWalkCountsAmIcon,
      LAYER_IDS.dispatchWalkCountsPm,
      LAYER_IDS.dispatchWalkCountsPmIcon,
    ],
    weeklyWalkCountsVisible
  );

  updateWeeklyWalkControlVisibility();
  updateStagingLegendVisibility();

  updateZonesInteractionBinding();

  setLayerVisibility([LAYER_IDS.sightings], sightingsVisible);
  setLayerVisibility([LAYER_IDS.schools, LAYER_IDS.schoolsInteraction], schoolsVisible);
  setLayerVisibility([LAYER_IDS.stagingAreas], stagingAreasVisible);

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

  if (map.getLayer(LAYER_IDS.schools)) {
    map.on("mousemove", LAYER_IDS.schools, onSchoolsHover);
    map.on("mouseleave", LAYER_IDS.schools, onSchoolsLeave);
  }

  if (map.getLayer(LAYER_IDS.schoolsInteraction)) {
    map.on("click", LAYER_IDS.schoolsInteraction, onSchoolsClick);
  }

  if (map.getLayer(LAYER_IDS.stagingAreas)) {
    map.on("mousemove", LAYER_IDS.stagingAreas, onStagingAreasHover);
    map.on("mouseleave", LAYER_IDS.stagingAreas, onStagingAreasLeave);
    map.on("click", LAYER_IDS.stagingAreas, onStagingAreasClick);
  }
}

function unbindOverlayInteractions() {
  const map = appState.map;
  if (!map) return;

  if (appState.activeZonesInteractionEnabled) {
    try {
      map.off("mousemove", onZonesPointerMove);
      map.off("mouseleave", onZonesPointerLeave);
      map.off("click", onZonesMapClick);
    } catch {
      // Ignore if handlers were not attached.
    }
    appState.activeZonesInteractionEnabled = false;
  }

  const handlers = [
    ["mousemove", LAYER_IDS.sightings, onSightingsHover],
    ["mouseleave", LAYER_IDS.sightings, onSightingsLeave],
    ["click", LAYER_IDS.sightings, onSightingsClick],
    ["mousemove", LAYER_IDS.schools, onSchoolsHover],
    ["mouseleave", LAYER_IDS.schools, onSchoolsLeave],
    ["click", LAYER_IDS.schoolsInteraction, onSchoolsClick],
    ["mousemove", LAYER_IDS.stagingAreas, onStagingAreasHover],
    ["mouseleave", LAYER_IDS.stagingAreas, onStagingAreasLeave],
    ["click", LAYER_IDS.stagingAreas, onStagingAreasClick],
  ];

  handlers.forEach(([eventName, layerId, handler]) => {
    try {
      map.off(eventName, layerId, handler);
    } catch {
      // Ignore if handler was not attached yet.
    }
  });
}

function getVisibleZonesInteractionLayerIds() {
  const zonesVisible = document.getElementById("toggleZones")?.checked ?? true;
  const zonesOutlineVisible = document.getElementById("toggleZonesOutline")?.checked ?? false;
  const layerIds = [];

  if ((zonesVisible || zonesOutlineVisible) && appState.map?.getLayer(LAYER_IDS.zonesInteractionFill)) {
    layerIds.push(LAYER_IDS.zonesInteractionFill);
  } else {
    if (zonesVisible && appState.map?.getLayer(LAYER_IDS.zonesFill)) {
      layerIds.push(LAYER_IDS.zonesFill);
    }

    if (zonesOutlineVisible && appState.map?.getLayer(LAYER_IDS.zonesBlackOutline)) {
      layerIds.push(LAYER_IDS.zonesBlackOutline);
    }
  }

  return layerIds;
}

function updateZonesInteractionBinding() {
  const map = appState.map;
  if (!map) return;

  const shouldEnable = getVisibleZonesInteractionLayerIds().length > 0;

  if (appState.activeZonesInteractionEnabled && !shouldEnable) {
    try {
      map.off("mousemove", onZonesPointerMove);
      map.off("mouseleave", onZonesPointerLeave);
      map.off("click", onZonesMapClick);
    } catch {
      // Ignore if handlers were not attached.
    }

    appState.activeZonesInteractionEnabled = false;
  }

  if (!appState.activeZonesInteractionEnabled && shouldEnable) {
    map.on("mousemove", onZonesPointerMove);
    map.on("mouseleave", onZonesPointerLeave);
    map.on("click", onZonesMapClick);
    appState.activeZonesInteractionEnabled = true;
  }

  if (!shouldEnable) {
    onZonesLeave();
  }
}

function getZoneFeatureAtPoint(point) {
  const map = appState.map;
  if (!map) return null;

  const layerIds = getVisibleZonesInteractionLayerIds();
  if (!layerIds.length) return null;

  const features = map.queryRenderedFeatures(point, { layers: layerIds });
  return features?.[0] || null;
}

function onZonesPointerMove(event) {
  const feature = getZoneFeatureAtPoint(event.point);
  if (!feature) {
    onZonesLeave();
    return;
  }

  onZonesHover({ ...event, features: [feature] });
}

function onZonesPointerLeave() {
  onZonesLeave();
}

function onZonesMapClick(event) {
  const feature = getZoneFeatureAtPoint(event.point);
  if (!feature) return;

  onZonesClick({ ...event, features: [feature] });
}

function onZonesHover(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  const isMobile = window.matchMedia("(max-width: 1023px)").matches;

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

  if (hasActivePointPopup()) {
    if (appState.zoneHoverPopup) appState.zoneHoverPopup.remove();
    map.getCanvas().style.cursor = "";
    return;
  }

  // Mobile: disable hover popups (click popup still works).
  if (isMobile) {
    if (appState.zoneHoverPopup) appState.zoneHoverPopup.remove();
    return;
  }

  if (map.getZoom() >= ZONE_HOVER_MAX_ZOOM) {
    if (appState.zoneHoverPopup) appState.zoneHoverPopup.remove();
    map.getCanvas().style.cursor = "";
    return;
  }

  map.getCanvas().style.cursor = "pointer";

  const zoneName = escapeHtml(String(feature.properties?.Zone ?? ""));
  const html = `<span class="zone-name-popup-title">${zoneName}</span>`;

  if (!appState.zoneHoverPopup) {
    appState.zoneHoverPopup = new maplibregl.Popup({
      className: "zone-name-popup-hover",
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

  if (hasActivePointPopup()) return;

  const html = buildZonePopupHtml(feature.properties || {});

  if (appState.zoneClickPopup) appState.zoneClickPopup.remove();

  appState.zoneClickPopup = new maplibregl.Popup({
    className: "zone-name-popup-click",
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
  closeSchoolsPopups();
  closeStagingPopups();

  const isMobile = window.matchMedia("(max-width: 1023px)").matches;
  if (isMobile) {
    map.getCanvas().style.cursor = "";
    if (appState.sightingHoverPopup) appState.sightingHoverPopup.remove();
    return;
  }

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
  closeSchoolsPopups();
  closeStagingPopups();

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

function onStagingAreasHover(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  closeZonePopups();
  closeSightingPopups();
  closeSchoolsPopups();

  const isMobile = window.matchMedia("(max-width: 1023px)").matches;
  if (isMobile) {
    map.getCanvas().style.cursor = "";
    if (appState.stagingHoverPopup) appState.stagingHoverPopup.remove();
    return;
  }

  map.getCanvas().style.cursor = "pointer";

  const statusText = escapeHtml(String(feature.properties?.Status ?? ""));
  const html = `<p class="popup-tooltip">Status: ${statusText}</p>`;

  if (!appState.stagingHoverPopup) {
    appState.stagingHoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      maxWidth: "260px",
    });
  }

  appState.stagingHoverPopup.setLngLat(event.lngLat).setHTML(html).addTo(map);
}

function onStagingAreasLeave() {
  const map = appState.map;
  if (!map) return;
  map.getCanvas().style.cursor = "";
  if (appState.stagingHoverPopup) appState.stagingHoverPopup.remove();
}

function onStagingAreasClick(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  closeZonePopups();
  closeSightingPopups();
  closeSchoolsPopups();

  const rows = Object.entries(feature.properties || {})
    .filter(([key]) => key !== "__staging_status_normalized")
    .map(
      ([key, value]) =>
        `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(String(value ?? ""))}</td></tr>`
    )
    .join("");

  if (appState.stagingClickPopup) appState.stagingClickPopup.remove();

  appState.stagingClickPopup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    offset: 12,
    maxWidth: "320px",
  })
    .setLngLat(event.lngLat)
    .setHTML(`<table class="popup-table">${rows}</table>`)
    .addTo(map);
}

function onSchoolsHover(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  closeZonePopups();
  closeSightingPopups();
  closeStagingPopups();

  const isMobile = window.matchMedia("(max-width: 1023px)").matches;
  if (isMobile) {
    map.getCanvas().style.cursor = "";
    if (appState.schoolHoverPopup) appState.schoolHoverPopup.remove();
    return;
  }

  map.getCanvas().style.cursor = "pointer";

  const schoolName = escapeHtml(String(feature.properties?.["School Name"] ?? ""));
  const html = `<p class="popup-tooltip">${schoolName}</p>`;

  if (!appState.schoolHoverPopup) {
    appState.schoolHoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      maxWidth: "320px",
    });
  }

  appState.schoolHoverPopup.setLngLat(event.lngLat).setHTML(html).addTo(map);
}

function onSchoolsLeave() {
  const map = appState.map;
  if (!map) return;
  map.getCanvas().style.cursor = "";
  if (appState.schoolHoverPopup) appState.schoolHoverPopup.remove();
}

function onSchoolsClick(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  closeZonePopups();
  closeSchoolsPopups();
  closeSightingPopups();
  closeStagingPopups();

  const rows = Object.entries(feature.properties || {})
    .map(
      ([key, value]) =>
        `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(String(value ?? ""))}</td></tr>`
    )
    .join("");

  if (appState.schoolClickPopup) appState.schoolClickPopup.remove();

  appState.schoolClickPopup = new maplibregl.Popup({
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
  const panelCloseBtn = document.getElementById("panelCloseBtn");
  if (!menuToggle) return;

  function setPanelOpen(isOpen) {
    document.body.classList.toggle("panel-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  }

  menuToggle.addEventListener("click", () => {
    const willOpen = !document.body.classList.contains("panel-open");
    setPanelOpen(willOpen);
  });

  if (panelCloseBtn) {
    panelCloseBtn.addEventListener("click", () => {
      setPanelOpen(false);
    });
  }
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
    bearing: INITIAL_MAP_BEARING,
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
    bearing: INITIAL_MAP_BEARING,
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

function buildZonePopupHtml(properties) {
  const zoneName = escapeHtml(String(properties?.Zone ?? ""));
  const avgAmRaw = properties?.["Avg AM"];
  const avgPmRaw = properties?.["Avg PM"];
  const iceSightingsRaw = properties?.["# of ICE sightings"];

  const avgAm = Number(avgAmRaw);
  const avgPm = Number(avgPmRaw);

  const avgAmText = Number.isFinite(avgAm) ? avgAm.toFixed(1) : "N/A";
  const avgPmText = Number.isFinite(avgPm) ? avgPm.toFixed(1) : "N/A";
  const iceSightingsText = Number.isFinite(Number(iceSightingsRaw))
    ? String(Math.round(Number(iceSightingsRaw)))
    : "N/A";

  return `
    <span class="zone-name-popup-title">${zoneName}</span><br />
    <span class="zone-name-popup-detail">Avg AM walks: ${avgAmText}</span><br />
    <span class="zone-name-popup-detail">Avg PM walks: ${avgPmText}</span><br />
    <span class="zone-name-popup-detail">Confirmed ICE sightings: ${iceSightingsText}</span>
  `;
}

function isPopupOpen(popup) {
  return Boolean(popup && typeof popup.isOpen === "function" && popup.isOpen());
}

function hasActiveSightingPopup() {
  return isPopupOpen(appState.sightingHoverPopup) || isPopupOpen(appState.sightingClickPopup);
}

function hasActiveStagingPopup() {
  return isPopupOpen(appState.stagingHoverPopup) || isPopupOpen(appState.stagingClickPopup);
}

function hasActiveSchoolPopup() {
  return isPopupOpen(appState.schoolHoverPopup) || isPopupOpen(appState.schoolClickPopup);
}

function hasActivePointPopup() {
  return hasActiveSightingPopup() || hasActiveSchoolPopup() || hasActiveStagingPopup();
}

function closeZonePopups() {
  if (appState.zoneHoverPopup) appState.zoneHoverPopup.remove();
  if (appState.zoneClickPopup) appState.zoneClickPopup.remove();
}

function closeSightingPopups() {
  if (appState.sightingHoverPopup) appState.sightingHoverPopup.remove();
  if (appState.sightingClickPopup) appState.sightingClickPopup.remove();
}

function closeSchoolsPopups() {
  if (appState.schoolHoverPopup) appState.schoolHoverPopup.remove();
  if (appState.schoolClickPopup) appState.schoolClickPopup.remove();
}

function closeStagingPopups() {
  if (appState.stagingHoverPopup) appState.stagingHoverPopup.remove();
  if (appState.stagingClickPopup) appState.stagingClickPopup.remove();
}
