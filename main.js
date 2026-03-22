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
// Hard navigation lock: do not pan/zoom out beyond 20 miles from NYC centroid.
// (Centroid approximated from NYC_VIEWBOX center.)
const NAV_LIMIT_CENTER = [-73.979635, 40.6975];
const NAV_LIMIT_RADIUS_MILES = 20;
const NAV_LIMIT_BOUNDS = buildBoundsAroundPointMiles(NAV_LIMIT_CENTER, NAV_LIMIT_RADIUS_MILES);
// Hide zone numbers + walk labels if zoomed out by more than 1 from default.
const ZONE_LABEL_MIN_ZOOM = INITIAL_MAP_ZOOM - 1;
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
const WEEKLY_WALK_LABEL_MIN_ZOOM = 0;
// Dispatch AM/PM text labels (next to dispatch icons):
// - Keep size matched to walk-count numbers.
// - Tweak offsets here if you want to move AM/PM text around.
const DISPATCH_PERIOD_TEXT_SIZE = WEEKLY_WALK_TEXT_SIZE;
const DISPATCH_AM_PERIOD_TEXT_OFFSET = [1.1, 0];
const DISPATCH_PM_PERIOD_TEXT_OFFSET = [1.1, 1.5];
// ZONE CALLOUT STYLE CONTROLS (for zone_label_points.geojson labels + leaders)
const ZONE_CALLOUT_TEXT_SIZE = WEEKLY_WALK_TEXT_SIZE * 0.5;
const ZONE_CALLOUT_TEXT_COLOR = "#000000";
const ZONE_CALLOUT_BOX_FILL_COLOR = "#ffffff";
const ZONE_CALLOUT_BOX_STROKE_COLOR = "#000000";
const ZONE_CALLOUT_LEADER_LINE_COLOR = "#000000";
const ZONE_CALLOUT_LEADER_LINE_WIDTH = 1;
const ZONE_CALLOUT_BOX_STROKE_WIDTH = 4;
const ZONE_CALLOUT_BOX_ICON_WIDTH = 64;
const ZONE_CALLOUT_BOX_ICON_HEIGHT = 64;
const ZONE_CALLOUT_BOX_ICON_IMAGE_ID = "zone-callout-box";
const ZONE_CALLOUT_BOX_ICON_SIZE = 0.55;
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
// Vulnerability fill transparency (0 = fully transparent, 1 = fully opaque).
// Edit this value to control vulnerability layer transparency.
const VULNERABILITY_FILL_OPACITY = 0.75;
// Vulnerability color-ramp controls (evenly spaced across 0..100).
// -----------------------------------------------------------------
// CHANGE THIS to quickly try a different ramp:
//   "white_gray_purple" (default), "purple_16", "purp", "bupu", "dense"
// (Names mirror the kinds of ramps you mentioned, e.g. cmaps.purple_16, cmaps.purp, etc.)
const ACTIVE_VULNERABILITY_RAMP = "dense";
// Choose how stops are distributed across the score range:
// - "even": equal spacing (balanced)
// - "high_emphasis": more color transitions in higher scores (emphasizes high-risk differences)
const VULNERABILITY_RAMP_MODE = "high_emphasis";
// High-emphasis curve control (< 1 pushes more stops toward higher values).
const VULNERABILITY_HIGH_EMPHASIS_GAMMA = 0.55;

// You can edit the hex values below, or add your own named ramp.
const VULNERABILITY_COLOR_RAMPS = {
  dense: [
    "#f8f9fb",
    "#dee4ef",
    "#c3cee6",
    "#98add8",
    "#7080c5",
    "#5a5db3",
    "#4b3e93",
    "#3a2c72",
    "#27194d",
  ],
};

const VULNERABILITY_SCORE_MIN = 0;
const VULNERABILITY_SCORE_MAX = 100;
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
  walkLogCsv: "./processing/walk_log.csv",
  sightingsCsv: "./processing/sightings.csv",
  stagingAreasCsv: "./processing/Staging-Areas.csv",
  sightingsGeoJsonFallback: "./data/confirmed_sightings.geojson",
  schools: "./data/schools.geojson",
  zones: "./data/zones_processed.geojson",
  zonesReference: "./data/zones.geojson",
  zoneLabelPoints: "./data/zone_label_points.geojson",
  dispatch: "./data/dispatch_walk_log.geojson",
  vulnerability: "./data/neighbor_vulnerability.geojson",
  walkAmIcon: "./data/svg/walk_AM.svg",
  walkPmIcon: "./data/svg/walk_PM.svg",
  dispatchAmIcon: "./data/svg/dispatch_AM.svg",
  dispatchPmIcon: "./data/svg/dispatch_PM.svg",
};

// Manually set polygon colors here (key = Zone_ID 1..25).
const MANUAL_ZONE_COLORS = {
  1: "#43db31",
  2: "#2cc8dd",
  3: "#0ecd5d",
  4: "#a451e0",
  5: "#d57544",
  6: "#e0db00",
  7: "#0ecd5d",
  8: "#cd2f66",
  9: "#2143cd",
  10: "#43db31",
  11: "#d57544",
  12: "#e0db00",
  13: "#0ecd5d",
  14: "#2cc8dd",
  15: "#cd2f66",
  16: "#a451e0",
  17: "#d57544",
  18: "#2171cd",
  19: "#43db31",
  20: "#d57544",
  21: "#2143cd",
  22: "#d57544",
  23: "#e0db00",
  24: "#2cc8dd",
  25: "#cd2f66",
};

const SOURCE_IDS = {
  zones: "zones-source",
  zonesLabels: "zones-labels-source",
  zoneCalloutLabels: "zone-callout-labels-source",
  zoneCalloutLeaders: "zone-callout-leaders-source",
  weeklyWalkCounts: "weekly-walk-counts-source",
  dispatchWalkCounts: "dispatch-walk-counts-source",
  sightings: "sightings-source",
  schools: "schools-source",
  stagingAreas: "staging-areas-source",
  vulnerability: "vulnerability-source",
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
  zoneCalloutLeaders: "zone-callout-leaders",
  zoneCalloutLabels: "zone-callout-labels",
  weeklyWalkCountsAm: "weekly-walk-counts-am-text",
  weeklyWalkCountsAmIcon: "weekly-walk-counts-am-icon",
  weeklyWalkCountsPm: "weekly-walk-counts-pm-text",
  weeklyWalkCountsPmIcon: "weekly-walk-counts-pm-icon",
  dispatchWalkPoint: "dispatch-walk-point",
  dispatchWalkTitle: "dispatch-walk-title",
  dispatchWalkCountsAm: "dispatch-walk-counts-am-text",
  dispatchWalkCountsAmIcon: "dispatch-walk-counts-am-icon",
  dispatchWalkCountsAmPeriod: "dispatch-walk-counts-am-period",
  dispatchWalkCountsPm: "dispatch-walk-counts-pm-text",
  dispatchWalkCountsPmIcon: "dispatch-walk-counts-pm-icon",
  dispatchWalkCountsPmPeriod: "dispatch-walk-counts-pm-period",
  sightings: "confirmed-sightings",
  schools: "schools",
  schoolsInteraction: "schools-interaction",
  stagingAreas: "staging-areas",
  vulnerabilityFill: "vulnerability-fill",
};

const AVERAGE_WEEK_VALUE = "__average__";
const WALK_DAY_CODES = ["M", "T", "W", "Th", "F", "Sa", "S"];

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
  vulnerabilityClickPopup: null,
  searchMarker: null,
  searchMarkerTimeoutId: null,
  activeSearchController: null,
  activeZonesInteractionEnabled: false,
  iconLoadingPromises: {},
  hoveredZoneFeatureId: null,
  weeklyWalkWeekOptions: [],
  selectedWeeklyWalkWeek: null,
  selectedWeekdayCodes: [...WALK_DAY_CODES],
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
  setupVulnerabilityInfoUI();
  applyVulnerabilityLegendGradient();

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
  ]);

  appState.map = new maplibregl.Map({
    container: "map",
    style: getBasemapStyle("streets"),
    center: INITIAL_MAP_CENTER,
    zoom: INITIAL_MAP_ZOOM,
    maxBounds: NAV_LIMIT_BOUNDS,
    bearing: INITIAL_MAP_BEARING,
    attributionControl: true,
  });

  enforceNavigationZoomLimit();

  appState.map.addControl(new maplibregl.NavigationControl(), "top-right");
  appState.map.addControl(new HomeControl(() => fitToZones(true)), "top-right");

  appState.map.on("error", (event) => {
    console.error("MapLibre runtime error:", event?.error || event);
  });

  appState.map.on("load", () => {
    enforceNavigationZoomLimit();
    installOverlaySourcesAndLayers();
    applyLayerVisibilityFromToggles();
    // Initial view should focus on polygon extent.
    fitToZones(false);
    runZonesFallbackIfNeeded();
  });

  appState.map.on("click", closeDrawerOnMobile);
  appState.map.on("resize", enforceNavigationZoomLimit);
}

async function loadAndPrepareData() {
  const [
    zonesRaw,
    zonesReferenceRaw,
    zoneLabelPointsRaw,
    dispatchRaw,
    walkLogRecords,
    sightingsRaw,
    schoolsRaw,
    stagingAreasRaw,
    vulnerabilityRaw,
  ] = await Promise.all([
    fetchGeoJson(DATA_PATHS.zones),
    fetchGeoJson(DATA_PATHS.zonesReference),
    fetchGeoJson(DATA_PATHS.zoneLabelPoints),
    fetchGeoJson(DATA_PATHS.dispatch),
    fetchWalkLogCsvRecords(DATA_PATHS.walkLogCsv),
    fetchSightingsGeoJsonWithFallback(DATA_PATHS.sightingsCsv, DATA_PATHS.sightingsGeoJsonFallback),
    fetchGeoJson(DATA_PATHS.schools),
    fetchStagingAreasGeoJsonFromCsv(DATA_PATHS.stagingAreasCsv),
    fetchGeoJson(DATA_PATHS.vulnerability),
  ]);

  const zonesPrepared = preprocessZones(zonesRaw);
  const zonesReferencePrepared = preprocessGenericFeatureCollection(zonesReferenceRaw);
  const zonesFlat = flattenZonesToPolygons(zonesPrepared);
  const zonesLabelPoints = buildZoneLabelPoints(zonesPrepared);
  const zoneCalloutLabelPoints = buildZoneCalloutLabelPoints(zoneLabelPointsRaw);
  const zoneCalloutLeaderLines = buildZoneCalloutLeaderLines(
    zoneCalloutLabelPoints,
    zonesReferencePrepared
  );
  const zoneColorExpression = buildZoneColorExpression(zonesPrepared.features || []);
  const walkMetrics = buildWalkMetrics(walkLogRecords);
  const weeklyWalkWeekOptions = walkMetrics.weeks;
  const selectedWeeklyWalkWeek =
    weeklyWalkWeekOptions.length > 0 ? AVERAGE_WEEK_VALUE : null;
  const weeklyWalkCountsLabelPoints = buildWeeklyWalkCountLabelPoints(
    zonesPrepared,
    walkMetrics,
    selectedWeeklyWalkWeek,
    WALK_DAY_CODES
  );
  const dispatchPrepared = preprocessGenericFeatureCollection(dispatchRaw);
  const dispatchWalkCountsLabelPoints = buildDispatchWalkCountLabelPoints(
    dispatchPrepared,
    walkMetrics,
    selectedWeeklyWalkWeek,
    WALK_DAY_CODES
  );
  const sightings = preprocessGenericFeatureCollection(sightingsRaw);
  const schools = preprocessPointFeatureCollection(schoolsRaw);
  const stagingAreas = preprocessStagingAreas(stagingAreasRaw);
  const vulnerability = preprocessVulnerabilityFeatureCollection(vulnerabilityRaw);

  return {
    zonesRaw: zonesPrepared,
    zonesFlat,
    zonesLabelPoints,
    zoneCalloutLabelPoints,
    zoneCalloutLeaderLines,
    zoneColorExpression,
    walkMetrics,
    weeklyWalkWeekOptions,
    selectedWeeklyWalkWeek,
    weeklyWalkCountsLabelPoints,
    dispatchRaw: dispatchPrepared,
    dispatchWalkCountsLabelPoints,
    sightings,
    schools,
    stagingAreas,
    vulnerability,
  };
}

async function fetchGeoJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed loading ${path}: HTTP ${response.status}`);
  return response.json();
}

async function fetchWalkLogCsvRecords(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed loading ${path}: HTTP ${response.status}`);

  const csvText = await response.text();
  return parseCsvRecords(csvText);
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

function normalizeWalkDayCode(rawDayCode) {
  const text = String(rawDayCode ?? "").trim().toLowerCase();
  if (!text) return null;

  if (text === "m" || text.startsWith("mon")) return "M";
  if (text === "t" || text.startsWith("tue")) return "T";
  if (text === "w" || text.startsWith("wed")) return "W";
  if (text === "th" || text.startsWith("thu")) return "Th";
  if (text === "f" || text.startsWith("fri")) return "F";
  if (text === "sa" || text.startsWith("sat")) return "Sa";
  if (text === "s" || text.startsWith("sun")) return "S";

  return null;
}

function parseWalkCountValue(value) {
  const parsed = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundToTenths(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function setWalkCountForZoneWeekDay(byZone, zoneId, weekLabel, dayCode, period, count) {
  if (!zoneId || !weekLabel || !dayCode || !period) return;

  if (!byZone.has(zoneId)) byZone.set(zoneId, new Map());
  const byWeek = byZone.get(zoneId);

  if (!byWeek.has(weekLabel)) byWeek.set(weekLabel, new Map());
  const byDay = byWeek.get(weekLabel);

  if (!byDay.has(dayCode)) byDay.set(dayCode, { am: 0, pm: 0 });
  const dayCounts = byDay.get(dayCode);

  if (period === "AM") {
    dayCounts.am = parseWalkCountValue(count);
  } else if (period === "PM") {
    dayCounts.pm = parseWalkCountValue(count);
  }
}

function buildWalkMetrics(walkLogRecords) {
  const byZone = new Map();
  const weekMap = new Map();

  (walkLogRecords || []).forEach((record) => {
    const zoneId = String(getRecordValue(record, ["Zone_ID", "zone_id"]) ?? "").trim();
    if (!zoneId) return;

    const normalizedWeekLabel = String(
      getRecordValue(record, ["Week_Label", "week_label"]) ?? ""
    ).trim();

    if (normalizedWeekLabel) {
      const rawSort = Number.parseInt(
        String(getRecordValue(record, ["Week_Sort", "week_sort"]) ?? ""),
        10
      );
      const sortValue = Number.isFinite(rawSort)
        ? rawSort
        : getWeekLabelSortValue(normalizedWeekLabel);
      if (Number.isFinite(sortValue)) {
        weekMap.set(normalizedWeekLabel, { week: normalizedWeekLabel, sortValue });
      }

      const dayCode = normalizeWalkDayCode(getRecordValue(record, ["Day_Code", "day_code"]));
      if (!dayCode) return;

      setWalkCountForZoneWeekDay(
        byZone,
        zoneId,
        normalizedWeekLabel,
        dayCode,
        "AM",
        getRecordValue(record, ["AM_Count", "am_count"])
      );
      setWalkCountForZoneWeekDay(
        byZone,
        zoneId,
        normalizedWeekLabel,
        dayCode,
        "PM",
        getRecordValue(record, ["PM_Count", "pm_count"])
      );
      return;
    }

    // Backward compatibility for legacy wide-format CSVs.
    Object.entries(record || {}).forEach(([key, value]) => {
      const match = String(key).match(/^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(AM|PM)$/i);
      if (!match) return;

      const weekLabel = match[1];
      const period = String(match[2]).toUpperCase();
      const sortValue = getWeekLabelSortValue(weekLabel);
      if (Number.isFinite(sortValue)) {
        weekMap.set(weekLabel, { week: weekLabel, sortValue });
      }

      setWalkCountForZoneWeekDay(byZone, zoneId, weekLabel, "__ALL__", period, value);
    });
  });

  const weeks = Array.from(weekMap.values()).sort((a, b) => a.sortValue - b.sortValue);
  return { byZone, weeks };
}

function computeWalkAggregateForZone(walkMetrics, zoneId, weekLabel, selectedDayCodes) {
  const byZone = walkMetrics?.byZone;
  const zoneKey = String(zoneId ?? "").trim();
  if (!byZone || !zoneKey || !byZone.has(zoneKey)) return { am: 0, pm: 0 };

  const days = Array.isArray(selectedDayCodes) ? selectedDayCodes : WALK_DAY_CODES;
  const uniqueDays = Array.from(new Set(days.map((d) => normalizeWalkDayCode(d)).filter(Boolean)));

  const isAverageSelection =
    weekLabel === AVERAGE_WEEK_VALUE || String(weekLabel ?? "").toLowerCase() === "average";

  if (isAverageSelection) {
    const weeks = Array.isArray(walkMetrics?.weeks) ? walkMetrics.weeks : [];
    if (!weeks.length) return { am: 0, pm: 0 };

    let totalAm = 0;
    let totalPm = 0;
    weeks.forEach((week) => {
      const weekly = computeWalkAggregateForZone(walkMetrics, zoneKey, week.week, uniqueDays);
      totalAm += weekly.am;
      totalPm += weekly.pm;
    });

    return {
      am: roundToTenths(totalAm / weeks.length),
      pm: roundToTenths(totalPm / weeks.length),
    };
  }

  const byWeek = byZone.get(zoneKey);
  const weekKey = String(weekLabel ?? "").trim();
  if (!byWeek || !weekKey || !byWeek.has(weekKey)) return { am: 0, pm: 0 };

  const byDay = byWeek.get(weekKey);
  if (byDay.has("__ALL__")) {
    const totals = byDay.get("__ALL__");
    return {
      am: parseWalkCountValue(totals?.am),
      pm: parseWalkCountValue(totals?.pm),
    };
  }

  let am = 0;
  let pm = 0;
  uniqueDays.forEach((dayCode) => {
    const counts = byDay.get(dayCode);
    if (!counts) return;
    am += parseWalkCountValue(counts.am);
    pm += parseWalkCountValue(counts.pm);
  });

  return { am, pm };
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

function preprocessVulnerabilityFeatureCollection(input) {
  const base = preprocessGenericFeatureCollection(input);
  const byTract = new Map();

  (base.features || []).forEach((feature, index) => {
    const props = feature?.properties || {};
    const geoid = String(props.GEOIDFQ ?? props.GEOID ?? "").trim();
    const dedupeKey = geoid || JSON.stringify(feature?.geometry || {}) || `feature-${index}`;

    const existing = byTract.get(dedupeKey);
    if (!existing) {
      byTract.set(dedupeKey, feature);
      return;
    }

    const existingScore = Number(
      existing?.properties?.vuln_score
      ?? existing?.properties?.dac_vulnerability_score
      ?? existing?.properties?.vulnerability_score
    );
    const candidateScore = Number(
      props.vuln_score
      ?? props.dac_vulnerability_score
      ?? props.vulnerability_score
    );
    const existingHasScore = Number.isFinite(existingScore);
    const candidateHasScore = Number.isFinite(candidateScore);

    // Keep one feature per tract to prevent stacked duplicate polygons from
    // artificially increasing apparent opacity.
    if (!existingHasScore && candidateHasScore) {
      byTract.set(dedupeKey, feature);
      return;
    }

    if (existingHasScore && candidateHasScore && candidateScore > existingScore) {
      byTract.set(dedupeKey, feature);
    }
  });

  return {
    type: "FeatureCollection",
    features: Array.from(byTract.values()).map((feature, index) => ({
      ...feature,
      id: feature?.id ?? index + 1,
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
  const zoneId = Number.parseInt(String(properties?.Zone_ID ?? properties?.zone_id ?? "").trim(), 10);
  const candidates = [zoneId, Number(properties?.id), Number(properties?.Zone_number)];
  for (const candidate of candidates) {
    if (Number.isFinite(candidate) && MANUAL_ZONE_COLORS[candidate]) {
      return MANUAL_ZONE_COLORS[candidate];
    }
  }

  // Stable fallback color (does not change between refreshes).
  const stableSeed = String(
    properties?.Zone_ID ??
    properties?.zone_id ??
    properties?.id ??
    properties?.Zone_number ??
    properties?.Zone ??
    properties?.zone_label ??
    fallbackSeed
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
  else[r, g, b] = [c, 0, x];

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
    const zoneId = Number.parseInt(String(feature?.properties?.Zone_ID ?? "").trim(), 10);
    if (!Number.isFinite(zoneId)) return;

    const coordinates = getZoneLabelPointFromGeometry(feature?.geometry);
    if (!coordinates) return;

    features.push({
      type: "Feature",
      id: `zone-label-${feature?.id ?? index + 1}`,
      properties: { Zone_ID: zoneId },
      geometry: { type: "Point", coordinates },
    });
  });

  return { type: "FeatureCollection", features };
}

function buildZoneCalloutLabelPoints(zoneLabelPointsGeoJson) {
  const features = [];

  (zoneLabelPointsGeoJson?.features || []).forEach((feature, index) => {
    const props = feature?.properties || {};

    // Use Zone_ID directly from zone_label_points.geojson.
    const zoneId = Number.parseInt(String(props.Zone_ID ?? "").trim(), 10);

    if (!Number.isFinite(zoneId)) return;

    const coordinates = getZoneCalloutPointCoordinates(feature);
    if (!coordinates) return;

    features.push({
      type: "Feature",
      id: `zone-callout-label-${zoneId}-${index + 1}`,
      properties: {
        Zone_ID: zoneId,
      },
      geometry: {
        type: "Point",
        coordinates,
      },
    });
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

function getZoneCalloutPointCoordinates(feature) {
  const props = feature?.properties || {};

  // zone_label_points.geojson stores editable coordinates in lat/long fields.
  // Use those first so label placement follows the latest manual updates.
  const latCandidates = [props.lat, props.latitude, props.Lat, props.Latitude];
  const lngCandidates = [
    props.long,
    props.lng,
    props.lon,
    props.longitude,
    props.Long,
    props.Longitude,
  ];

  const lat = latCandidates.map((value) => Number(value)).find((value) => Number.isFinite(value));
  const lng = lngCandidates.map((value) => Number(value)).find((value) => Number.isFinite(value));
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lng, lat];

  // Fallback to geometry if lat/long props are missing.
  const geometry = feature?.geometry || {};
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    const [gx, gy] = geometry.coordinates;
    if (Number.isFinite(gx) && Number.isFinite(gy)) return [gx, gy];
  }

  const geometryFallback = extractFirstCoordinate(geometry.coordinates);
  if (Array.isArray(geometryFallback) && geometryFallback.length >= 2) {
    const [fx, fy] = geometryFallback;
    if (Number.isFinite(fx) && Number.isFinite(fy)) return [fx, fy];
  }

  return null;
}

function buildZoneCalloutLeaderLines(zoneCalloutLabelPointsGeoJson, zonesReferenceGeoJson) {
  const features = [];
  const zonesById = new Map();

  (zonesReferenceGeoJson?.features || []).forEach((feature) => {
    const zoneId = String(feature?.properties?.Zone_ID ?? "").trim();
    if (!zoneId || !feature?.geometry) return;
    if (!zonesById.has(zoneId)) zonesById.set(zoneId, []);
    zonesById.get(zoneId).push(feature.geometry);
  });

  (zoneCalloutLabelPointsGeoJson?.features || []).forEach((feature, index) => {
    const zoneId = String(feature?.properties?.Zone_ID ?? "").trim();
    const origin = feature?.geometry?.coordinates;
    if (!zoneId || !Array.isArray(origin) || origin.length < 2) return;
    const zoneGeometries = zonesById.get(zoneId) || [];

    // If the callout point already sits on/inside its zone polygon,
    // skip the leader line entirely.
    if (isPointInsideAnyZoneGeometry(origin, zoneGeometries)) return;

    const boundaryPoint = getNearestPointOnZoneBoundary(origin, zoneGeometries);
    if (!boundaryPoint) return;

    features.push({
      type: "Feature",
      id: `zone-callout-leader-${zoneId}-${index + 1}`,
      properties: {
        Zone_ID: zoneId,
      },
      geometry: {
        type: "LineString",
        coordinates: [origin, boundaryPoint],
      },
    });
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

function getNearestPointOnZoneBoundary(point, zoneGeometries) {
  if (!Array.isArray(point) || point.length < 2) return null;
  if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return null;

  let bestPoint = null;
  let bestDistanceSq = Infinity;

  (zoneGeometries || []).forEach((geometry) => {
    visitPolygonBoundarySegments(geometry, (a, b) => {
      const candidate = getClosestPointOnSegment(point, a, b);
      const distanceSq = getDistanceSquared(point, candidate);
      if (distanceSq < bestDistanceSq) {
        bestDistanceSq = distanceSq;
        bestPoint = candidate;
      }
    });
  });

  return bestPoint;
}

function isPointInsideAnyZoneGeometry(point, zoneGeometries) {
  return (zoneGeometries || []).some((geometry) => isPointInsideZoneGeometry(point, geometry));
}

function isPointInsideZoneGeometry(point, geometry) {
  if (!isFiniteCoordinatePair(point) || !geometry) return false;

  if (geometry.type === "Polygon") {
    return isPointInsidePolygonRings(point, geometry.coordinates || []);
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates || []).some((polygon) =>
      isPointInsidePolygonRings(point, polygon || [])
    );
  }

  return false;
}

function isPointInsidePolygonRings(point, polygonRings) {
  if (!Array.isArray(polygonRings) || polygonRings.length === 0) return false;

  const outerRing = polygonRings[0];
  if (!isPointInsideRing(point, outerRing)) return false;

  for (let i = 1; i < polygonRings.length; i += 1) {
    if (isPointInsideRing(point, polygonRings[i])) return false;
  }

  return true;
}

function isPointInsideRing(point, ring) {
  if (!isFiniteCoordinatePair(point) || !Array.isArray(ring) || ring.length < 3) return false;
  if (isPointOnRingBoundary(point, ring)) return true;

  const px = point[0];
  const py = point[1];
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i];
    const b = ring[j];
    if (!isFiniteCoordinatePair(a) || !isFiniteCoordinatePair(b)) continue;

    const xi = a[0];
    const yi = a[1];
    const xj = b[0];
    const yj = b[1];

    const intersects =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function isPointOnRingBoundary(point, ring) {
  if (!isFiniteCoordinatePair(point) || !Array.isArray(ring) || ring.length < 2) return false;

  for (let i = 0; i < ring.length - 1; i += 1) {
    const a = ring[i];
    const b = ring[i + 1];
    if (!isFiniteCoordinatePair(a) || !isFiniteCoordinatePair(b)) continue;
    if (isPointOnSegment(point, a, b)) return true;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (isFiniteCoordinatePair(first) && isFiniteCoordinatePair(last) && !coordinatesEqual(first, last)) {
    return isPointOnSegment(point, last, first);
  }

  return false;
}

function isPointOnSegment(point, a, b, epsilon = 1e-10) {
  const px = point[0];
  const py = point[1];
  const ax = a[0];
  const ay = a[1];
  const bx = b[0];
  const by = b[1];

  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  if (Math.abs(cross) > epsilon) return false;

  const dot = (px - ax) * (bx - ax) + (py - ay) * (by - ay);
  if (dot < -epsilon) return false;

  const lenSq = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
  if (dot - lenSq > epsilon) return false;

  return true;
}

function visitPolygonBoundarySegments(geometry, callback) {
  if (!geometry || typeof callback !== "function") return;

  if (geometry.type === "Polygon") {
    (geometry.coordinates || []).forEach((ring) => iterateRingSegments(ring, callback));
    return;
  }

  if (geometry.type === "MultiPolygon") {
    (geometry.coordinates || []).forEach((polygon) => {
      (polygon || []).forEach((ring) => iterateRingSegments(ring, callback));
    });
  }
}

function iterateRingSegments(ring, callback) {
  if (!Array.isArray(ring) || ring.length < 2) return;

  for (let i = 0; i < ring.length - 1; i += 1) {
    const a = ring[i];
    const b = ring[i + 1];
    if (!isFiniteCoordinatePair(a) || !isFiniteCoordinatePair(b)) continue;
    callback(a, b);
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (isFiniteCoordinatePair(first) && isFiniteCoordinatePair(last) && !coordinatesEqual(first, last)) {
    callback(last, first);
  }
}

function isFiniteCoordinatePair(value) {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function coordinatesEqual(a, b) {
  return a?.[0] === b?.[0] && a?.[1] === b?.[1];
}

function getClosestPointOnSegment(point, a, b) {
  const px = point[0];
  const py = point[1];
  const ax = a[0];
  const ay = a[1];
  const bx = b[0];
  const by = b[1];

  const abx = bx - ax;
  const aby = by - ay;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq <= 0) return [ax, ay];

  const apx = px - ax;
  const apy = py - ay;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));

  return [ax + abx * t, ay + aby * t];
}

function getDistanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
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

function parseWeekLabelToUtcDate(weekLabel) {
  const match = String(weekLabel).match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;

  let year = new Date().getFullYear();
  if (match[3]) {
    const parsedYear = Number(match[3]);
    if (!Number.isFinite(parsedYear)) return null;
    year = match[3].length === 2 ? 2000 + parsedYear : parsedYear;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function getWeekRangeMonthLabel(monthIndex) {
  const monthNamesShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];

  return monthNamesShort[monthIndex] || "";
}

function formatWeekRangeLabel(weekLabel) {
  const startDate = parseWeekLabelToUtcDate(weekLabel);
  if (!startDate) return String(weekLabel ?? "");

  const endDate = new Date(startDate.getTime());
  endDate.setUTCDate(endDate.getUTCDate() + 6);

  const startMonth = startDate.getUTCMonth();
  const startDay = startDate.getUTCDate();
  const startYear = startDate.getUTCFullYear();
  const endMonth = endDate.getUTCMonth();
  const endDay = endDate.getUTCDate();
  const endYear = endDate.getUTCFullYear();

  const startMonthLabel = getWeekRangeMonthLabel(startMonth);
  const endMonthLabel = getWeekRangeMonthLabel(endMonth);

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startMonthLabel} ${startDay}-${endDay}, ${startYear}`;
    }
    return `${startMonthLabel} ${startDay} - ${endMonthLabel} ${endDay}, ${startYear}`;
  }

  return `${startMonthLabel} ${startDay}, ${startYear} - ${endMonthLabel} ${endDay}, ${endYear}`;
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

function buildWeeklyWalkCountLabelPoints(zonesGeoJson, walkMetrics, weekLabel, selectedDayCodes) {
  const features = [];
  if (!weekLabel) return { type: "FeatureCollection", features };
  const isAverageSelection = weekLabel === AVERAGE_WEEK_VALUE || String(weekLabel).toLowerCase() === "average";

  (zonesGeoJson?.features || []).forEach((feature, index) => {
    const props = feature?.properties || {};
    const zoneId = props.Zone_ID;
    if (!zoneId || zoneId === "Dispatch") return;

    const aggregate = computeWalkAggregateForZone(
      walkMetrics,
      zoneId,
      weekLabel,
      selectedDayCodes
    );
    const amCount = isAverageSelection ? roundToTenths(aggregate.am) : Math.round(aggregate.am);
    const pmCount = isAverageSelection ? roundToTenths(aggregate.pm) : Math.round(aggregate.pm);

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

function buildDispatchWalkCountLabelPoints(dispatchGeoJson, walkMetrics, weekLabel, selectedDayCodes) {
  const features = [];
  if (!weekLabel) return { type: "FeatureCollection", features };

  const isAverageSelection = weekLabel === AVERAGE_WEEK_VALUE || String(weekLabel).toLowerCase() === "average";
  const dispatchFeature = (dispatchGeoJson?.features || []).find((feature) => {
    const zoneId = String(feature?.properties?.Zone_ID || "").trim();
    return zoneId === "Dispatch";
  });

  if (!dispatchFeature) return { type: "FeatureCollection", features };

  const aggregate = computeWalkAggregateForZone(walkMetrics, "Dispatch", weekLabel, selectedDayCodes);

  const amCount = isAverageSelection ? roundToTenths(aggregate.am) : Math.round(aggregate.am);
  const pmCount = isAverageSelection ? roundToTenths(aggregate.pm) : Math.round(aggregate.pm);

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

function createRectangleImageData(fillColor, strokeColor, width = 64, height = 64, strokeWidth = 2) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const inset = strokeWidth / 2;
  const diameter = Math.max(0, Math.min(width, height) - strokeWidth);
  const radius = diameter / 2;
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  ctx.arc(centerX, centerY, Math.max(0, radius - inset + strokeWidth / 2), 0, Math.PI * 2);
  ctx.fill();
  if (strokeWidth > 0) ctx.stroke();

  return ctx.getImageData(0, 0, width, height);
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

function ensureZoneCalloutBoxIconLoaded() {
  ensureGeneratedIconLoaded(
    ZONE_CALLOUT_BOX_ICON_IMAGE_ID,
    createRectangleImageData(
      ZONE_CALLOUT_BOX_FILL_COLOR,
      ZONE_CALLOUT_BOX_STROKE_COLOR,
      ZONE_CALLOUT_BOX_ICON_WIDTH,
      ZONE_CALLOUT_BOX_ICON_HEIGHT,
      ZONE_CALLOUT_BOX_STROKE_WIDTH
    )
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
    runZonesFallbackIfNeeded();
  });
}

function setupLayerToggleUI() {
  const zonesToggle = document.getElementById("toggleZones");
  const zonesLabelToggle = document.getElementById("toggleZonesLabel");
  const weeklyWalkCountsToggle = document.getElementById("toggleWeeklyWalkCounts");
  const zonesOutlineToggle = document.getElementById("toggleZonesOutline");
  const vulnerabilityToggle = document.getElementById("toggleVulnerability");
  const sightingsToggle = document.getElementById("toggleSightings");
  const schoolsToggle = document.getElementById("toggleSchools");
  const stagingAreasToggle = document.getElementById("toggleStagingAreas");

  // Prevent stale browser-restored state.
  if (zonesToggle) zonesToggle.checked = true;
  if (zonesLabelToggle) zonesLabelToggle.checked = true;
  if (weeklyWalkCountsToggle) weeklyWalkCountsToggle.checked = false;
  if (zonesOutlineToggle) zonesOutlineToggle.checked = false;
  if (vulnerabilityToggle) vulnerabilityToggle.checked = false;
  if (sightingsToggle) sightingsToggle.checked = true;
  if (schoolsToggle) schoolsToggle.checked = false;
  if (stagingAreasToggle) stagingAreasToggle.checked = false;

  if (zonesToggle && zonesOutlineToggle) {
    zonesToggle.addEventListener("change", () => {
      if (zonesToggle.checked && zonesOutlineToggle) zonesOutlineToggle.checked = false;
      if (zonesToggle.checked && vulnerabilityToggle) vulnerabilityToggle.checked = false;
      applyLayerVisibilityFromToggles();
    });

    zonesOutlineToggle.addEventListener("change", () => {
      if (zonesOutlineToggle.checked && zonesToggle) zonesToggle.checked = false;
      applyLayerVisibilityFromToggles();
    });
  }

  if (vulnerabilityToggle) {
    vulnerabilityToggle.addEventListener("change", () => {
      if (vulnerabilityToggle.checked) {
        if (zonesToggle) zonesToggle.checked = false;
        if (zonesOutlineToggle) zonesOutlineToggle.checked = true;
      }
      applyLayerVisibilityFromToggles();
    });
  }

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
    vulnerabilityToggle,
    sightingsToggle,
    schoolsToggle,
    stagingAreasToggle,
  ].forEach((toggle) => {
    if (!toggle) return;
    toggle.addEventListener("change", applyLayerVisibilityFromToggles);
  });

  updateStagingLegendVisibility();
  updateVulnerabilityLegendVisibility();
  updateWeeklyWalkControlVisibility();
}

function updateStagingLegendVisibility() {
  const stagingAreasVisible = document.getElementById("toggleStagingAreas")?.checked ?? false;
  const stagingLegendSubgroup = document.getElementById("stagingAreasLegendSubgroup");
  if (!stagingLegendSubgroup) return;
  stagingLegendSubgroup.hidden = !stagingAreasVisible;
}

function updateVulnerabilityLegendVisibility() {
  const vulnerabilityVisible = document.getElementById("toggleVulnerability")?.checked ?? false;
  const vulnerabilityLegendSubgroup = document.getElementById("vulnerabilityLegendSubgroup");
  if (!vulnerabilityLegendSubgroup) return;
  vulnerabilityLegendSubgroup.hidden = !vulnerabilityVisible;
}

function initializeWeeklyWalkControls() {
  const selectEl = document.getElementById("walkWeekSelect");
  const prevBtn = document.getElementById("walkWeekPrev");
  const nextBtn = document.getElementById("walkWeekNext");
  const allDaysCheckbox = document.getElementById("walkDayAll");
  const dayCheckboxes = Array.from(document.querySelectorAll(".walk-day-checkbox"));
  if (!selectEl) return;

  selectEl.innerHTML = "";

  const optionsChrono = appState.weeklyWalkWeekOptions || [];
  const options = [
    { week: AVERAGE_WEEK_VALUE, label: "Weekly Average" },
    ...[...optionsChrono].reverse().map((option) => ({
      ...option,
      label: formatWeekRangeLabel(option.week),
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

  if (!Array.isArray(appState.selectedWeekdayCodes) || appState.selectedWeekdayCodes.length === 0) {
    appState.selectedWeekdayCodes = [...WALK_DAY_CODES];
  }

  // Force consistent default state across desktop/mobile.
  dayCheckboxes.forEach((checkbox) => {
    checkbox.checked = true;
  });
  if (allDaysCheckbox) allDaysCheckbox.checked = true;
  appState.selectedWeekdayCodes = [...WALK_DAY_CODES];

  function getSelectedDayCodesFromInputs() {
    return dayCheckboxes
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => normalizeWalkDayCode(checkbox.value))
      .filter(Boolean);
  }

  function syncDayInputsFromState() {
    const selectedSet = new Set(
      (appState.selectedWeekdayCodes || [])
        .map((code) => normalizeWalkDayCode(code))
        .filter(Boolean)
    );

    dayCheckboxes.forEach((checkbox) => {
      const code = normalizeWalkDayCode(checkbox.value);
      checkbox.checked = Boolean(code && selectedSet.has(code));
    });

    if (allDaysCheckbox) {
      allDaysCheckbox.checked = WALK_DAY_CODES.every((code) => selectedSet.has(code));
    }
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
    appState.selectedWeekdayCodes = getSelectedDayCodesFromInputs();

    if (allDaysCheckbox) {
      const selectedSet = new Set(appState.selectedWeekdayCodes);
      allDaysCheckbox.checked = WALK_DAY_CODES.every((code) => selectedSet.has(code));
    }

    refreshWeeklyWalkCountSource();
    refreshDispatchWalkCountSource();
    applyLayerVisibilityFromToggles();
    updateWeekNavButtons();
  }

  function refreshWalkLabelsForSelection() {
    refreshWeeklyWalkCountSource();
    refreshDispatchWalkCountSource();
    applyLayerVisibilityFromToggles();
  }

  function handleIndividualDayToggle() {
    appState.selectedWeekdayCodes = getSelectedDayCodesFromInputs();

    if (allDaysCheckbox) {
      const selectedSet = new Set(appState.selectedWeekdayCodes);
      allDaysCheckbox.checked = WALK_DAY_CODES.every((code) => selectedSet.has(code));
    }

    refreshWalkLabelsForSelection();
  }

  function handleAllDaysToggle() {
    const checked = Boolean(allDaysCheckbox?.checked);
    dayCheckboxes.forEach((checkbox) => {
      checkbox.checked = checked;
    });

    appState.selectedWeekdayCodes = checked ? [...WALK_DAY_CODES] : [];
    refreshWalkLabelsForSelection();
  }

  selectEl.addEventListener("change", () => {
    commitSelectedWeek();
  });

  dayCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", handleIndividualDayToggle);
    checkbox.addEventListener("input", handleIndividualDayToggle);
  });

  if (allDaysCheckbox) {
    allDaysCheckbox.addEventListener("change", handleAllDaysToggle);
    allDaysCheckbox.addEventListener("input", handleAllDaysToggle);
  }

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
  syncDayInputsFromState();
  refreshWalkLabelsForSelection();

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
    appState.data.walkMetrics,
    appState.selectedWeeklyWalkWeek,
    appState.selectedWeekdayCodes
  );

  appState.data.weeklyWalkCountsLabelPoints = points;

  const source = appState.map?.getSource?.(SOURCE_IDS.weeklyWalkCounts);
  if (source) source.setData(points);
}

function refreshDispatchWalkCountSource() {
  if (!appState.data) return;

  const points = buildDispatchWalkCountLabelPoints(
    appState.data.dispatchRaw,
    appState.data.walkMetrics,
    appState.selectedWeeklyWalkWeek,
    appState.selectedWeekdayCodes
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
  addOrUpdateGeoJsonSource(SOURCE_IDS.zoneCalloutLabels, appState.data.zoneCalloutLabelPoints);
  addOrUpdateGeoJsonSource(SOURCE_IDS.zoneCalloutLeaders, appState.data.zoneCalloutLeaderLines);
  addOrUpdateGeoJsonSource(SOURCE_IDS.weeklyWalkCounts, appState.data.weeklyWalkCountsLabelPoints);
  addOrUpdateGeoJsonSource(SOURCE_IDS.dispatchWalkCounts, appState.data.dispatchWalkCountsLabelPoints);
  addOrUpdateGeoJsonSource(SOURCE_IDS.sightings, appState.data.sightings);
  addOrUpdateGeoJsonSource(SOURCE_IDS.schools, appState.data.schools);
  addOrUpdateGeoJsonSource(SOURCE_IDS.stagingAreas, appState.data.stagingAreas);
  addOrUpdateGeoJsonSource(SOURCE_IDS.vulnerability, appState.data.vulnerability);

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

  // Vulnerability choropleth fill (continuous ramp by vuln_score, low->high).
  // Tuned to keep low/mid values subtle and emphasize highest-risk areas.
  // Keep this below outlines, labels, and point layers.
  addLayerIfMissing({
    id: LAYER_IDS.vulnerabilityFill,
    type: "fill",
    source: SOURCE_IDS.vulnerability,
    paint: {
      "fill-color": buildVulnerabilityFillColorExpression(),
      "fill-opacity": VULNERABILITY_FILL_OPACITY,
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
    filter: ["has", "Zone_ID"],
    layout: {
      "text-field": ["to-string", ["get", "Zone_ID"]],
      "text-size": ZONE_LABEL_TEXT_SIZE,
      "text-font": OVERLAY_LABEL_FONT_STACK,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: getOverlayLabelPaint(),
  });

  addLayerIfMissing({
    id: LAYER_IDS.zoneCalloutLeaders,
    type: "line",
    source: SOURCE_IDS.zoneCalloutLeaders,
    minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
    paint: {
      "line-color": ZONE_CALLOUT_LEADER_LINE_COLOR,
      "line-width": ZONE_CALLOUT_LEADER_LINE_WIDTH,
      "line-opacity": 1,
    },
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
  });

  ensureZoneCalloutBoxIconLoaded();

  addLayerIfMissing({
    id: LAYER_IDS.zoneCalloutLabels,
    type: "symbol",
    source: SOURCE_IDS.zoneCalloutLabels,
    minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
    filter: ["has", "Zone_ID"],
    layout: {
      "text-field": ["to-string", ["get", "Zone_ID"]],
      "text-size": ZONE_CALLOUT_TEXT_SIZE,
      "text-font": OVERLAY_LABEL_FONT_STACK,
      "text-anchor": "center",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "icon-image": ZONE_CALLOUT_BOX_ICON_IMAGE_ID,
      "icon-size": ZONE_CALLOUT_BOX_ICON_SIZE,
      "icon-anchor": "center",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    paint: {
      "text-color": ZONE_CALLOUT_TEXT_COLOR,
      "text-halo-width": 0,
      "text-opacity": 1,
    },
  });

  addWeeklyWalkCountLayersIfReady();
  addDispatchWalkCountLayersIfReady();

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

function getActiveVulnerabilityRampColors() {
  const fromName = VULNERABILITY_COLOR_RAMPS[ACTIVE_VULNERABILITY_RAMP];
  const fallback = VULNERABILITY_COLOR_RAMPS.white_gray_purple;
  const selected = Array.isArray(fromName) && fromName.length >= 2 ? fromName : fallback;
  return selected.map((value) => String(value));
}

function buildEvenInterpolateStops(min, max, colors) {
  const safeColors = Array.isArray(colors) ? colors.filter(Boolean) : [];
  if (safeColors.length < 2) {
    return [min, "#f9fafb", max, "#3b0764"];
  }

  const out = [];
  const count = safeColors.length;
  safeColors.forEach((color, index) => {
    const ratio = count === 1 ? 0 : index / (count - 1);
    const stopValue = min + (max - min) * ratio;
    out.push(stopValue, color);
  });

  return out;
}

function buildHighEmphasisInterpolateStops(min, max, colors, gamma = VULNERABILITY_HIGH_EMPHASIS_GAMMA) {
  const safeColors = Array.isArray(colors) ? colors.filter(Boolean) : [];
  if (safeColors.length < 2) {
    return [min, "#f9fafb", max, "#3b0764"];
  }

  const out = [];
  const count = safeColors.length;
  const safeGamma = Number.isFinite(gamma) && gamma > 0 ? gamma : 0.55;

  safeColors.forEach((color, index) => {
    const linearRatio = count === 1 ? 0 : index / (count - 1);
    const emphasizedRatio = Math.pow(linearRatio, safeGamma);
    const stopValue = min + (max - min) * emphasizedRatio;
    out.push(stopValue, color);
  });

  return out;
}

function buildVulnerabilityFillColorExpression() {
  const colors = getActiveVulnerabilityRampColors();
  const stopPairs =
    VULNERABILITY_RAMP_MODE === "high_emphasis"
      ? buildHighEmphasisInterpolateStops(VULNERABILITY_SCORE_MIN, VULNERABILITY_SCORE_MAX, colors)
      : buildEvenInterpolateStops(VULNERABILITY_SCORE_MIN, VULNERABILITY_SCORE_MAX, colors);

  return [
    "interpolate",
    ["linear"],
    [
      "coalesce",
      ["to-number", ["get", "vuln_score"]],
      ["to-number", ["get", "dac_vulnerability_score"]],
      ["to-number", ["get", "vulnerability_score"]],
      0,
    ],
    ...stopPairs,
  ];
}

function applyVulnerabilityLegendGradient() {
  const legendBar = document.querySelector(".vulnerability-segment-gradient");
  const legendMeta = document.getElementById("vulnerabilityLegendMeta");
  const colors = getActiveVulnerabilityRampColors();

  if (legendBar) {
    const gradient = `linear-gradient(90deg, ${colors.join(", ")})`;
    legendBar.style.background = gradient;
  }

  if (legendMeta) legendMeta.hidden = true;
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

async function addWeeklyWalkCountLayersIfReady() {
  const map = appState.map;
  if (!map) return;

  // Text layers first (same idea as old regular walkers): labels should render
  // even if icon loading fails.
  addLayerIfMissing({
    id: LAYER_IDS.weeklyWalkCountsAm,
    type: "symbol",
    source: SOURCE_IDS.weeklyWalkCounts,
    minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
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
    minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
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
      minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
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
      minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
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
    minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
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
    minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
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
    minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
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
    minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
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
      minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
      filter: [">", ["to-number", ["get", "walk_am_count"]], 0],
      layout: {
        "icon-image": DISPATCH_AM_ICON_IMAGE_ID,
        "icon-size": 0.62,
        "icon-anchor": "center",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });

    addLayerIfMissing({
      id: LAYER_IDS.dispatchWalkCountsAmPeriod,
      type: "symbol",
      source: SOURCE_IDS.dispatchWalkCounts,
      minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
      filter: [">", ["to-number", ["get", "walk_am_count"]], 0],
      layout: {
        "text-field": "AM",
        "text-size": DISPATCH_PERIOD_TEXT_SIZE,
        "text-font": OVERLAY_LABEL_FONT_STACK,
        "text-anchor": "left",
        "text-offset": DISPATCH_AM_PERIOD_TEXT_OFFSET,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: getOverlayLabelPaint(),
    });
  }

  if (map.hasImage(DISPATCH_PM_ICON_IMAGE_ID)) {
    addLayerIfMissing({
      id: LAYER_IDS.dispatchWalkCountsPmIcon,
      type: "symbol",
      source: SOURCE_IDS.dispatchWalkCounts,
      minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
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

    addLayerIfMissing({
      id: LAYER_IDS.dispatchWalkCountsPmPeriod,
      type: "symbol",
      source: SOURCE_IDS.dispatchWalkCounts,
      minzoom: WEEKLY_WALK_LABEL_MIN_ZOOM,
      filter: [">", ["to-number", ["get", "walk_pm_count"]], 0],
      layout: {
        "text-field": "PM",
        "text-size": DISPATCH_PERIOD_TEXT_SIZE,
        "text-font": OVERLAY_LABEL_FONT_STACK,
        "text-anchor": "left",
        "text-offset": DISPATCH_PM_PERIOD_TEXT_OFFSET,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: getOverlayLabelPaint(),
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
  const zonesToggle = document.getElementById("toggleZones");
  const zonesOutlineToggle = document.getElementById("toggleZonesOutline");
  const vulnerabilityToggle = document.getElementById("toggleVulnerability");
  let zonesVisible = zonesToggle?.checked ?? true;
  const zonesLabelToggle = document.getElementById("toggleZonesLabel");
  const weeklyWalkCountsToggle = document.getElementById("toggleWeeklyWalkCounts");
  let zonesLabelVisible = zonesLabelToggle?.checked ?? true;
  let weeklyWalkCountsVisible = weeklyWalkCountsToggle?.checked ?? false;

  // Safety guard: these two sublayers are mutually exclusive.
  if (zonesLabelVisible && weeklyWalkCountsVisible) {
    zonesLabelVisible = false;
    if (zonesLabelToggle) zonesLabelToggle.checked = false;
  }

  let zonesOutlineVisible = zonesOutlineToggle?.checked ?? false;
  let vulnerabilityVisible = vulnerabilityToggle?.checked ?? false;
  const sightingsVisible = document.getElementById("toggleSightings")?.checked ?? true;
  const schoolsVisible = document.getElementById("toggleSchools")?.checked ?? false;
  const stagingAreasVisible = document.getElementById("toggleStagingAreas")?.checked ?? false;

  // Safety guard: enforce mutually exclusive toggles.
  if (zonesVisible && zonesOutlineVisible) {
    zonesOutlineVisible = false;
    if (zonesOutlineToggle) zonesOutlineToggle.checked = false;
  }

  // Zone fill and vulnerability cannot be active together.
  if (zonesVisible && vulnerabilityVisible) {
    vulnerabilityVisible = false;
    if (vulnerabilityToggle) vulnerabilityToggle.checked = false;
  }

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
  setLayerVisibility([LAYER_IDS.vulnerabilityFill], vulnerabilityVisible);

  setLayerVisibility([LAYER_IDS.zonesLabel], zonesLabelVisible);
  setLayerVisibility(
    [
      LAYER_IDS.weeklyWalkCountsAm,
      LAYER_IDS.weeklyWalkCountsAmIcon,
      LAYER_IDS.weeklyWalkCountsPm,
      LAYER_IDS.weeklyWalkCountsPmIcon,
      LAYER_IDS.zoneCalloutLeaders,
      LAYER_IDS.zoneCalloutLabels,
      LAYER_IDS.dispatchWalkPoint,
      LAYER_IDS.dispatchWalkTitle,
      LAYER_IDS.dispatchWalkCountsAm,
      LAYER_IDS.dispatchWalkCountsAmIcon,
      LAYER_IDS.dispatchWalkCountsAmPeriod,
      LAYER_IDS.dispatchWalkCountsPm,
      LAYER_IDS.dispatchWalkCountsPmIcon,
      LAYER_IDS.dispatchWalkCountsPmPeriod,
    ],
    weeklyWalkCountsVisible
  );

  updateWeeklyWalkControlVisibility();
  updateStagingLegendVisibility();
  updateVulnerabilityLegendVisibility();

  updateZonesInteractionBinding();

  setLayerVisibility([LAYER_IDS.sightings], sightingsVisible);
  setLayerVisibility([LAYER_IDS.schools, LAYER_IDS.schoolsInteraction], schoolsVisible);
  setLayerVisibility([LAYER_IDS.stagingAreas], stagingAreasVisible);

  if (!vulnerabilityVisible) {
    closeVulnerabilityPopups();
  }

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

  if (map.getLayer(LAYER_IDS.vulnerabilityFill)) {
    map.on("click", LAYER_IDS.vulnerabilityFill, onVulnerabilityClick);
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
    ["click", LAYER_IDS.vulnerabilityFill, onVulnerabilityClick],
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
  const vulnerabilityVisible = document.getElementById("toggleVulnerability")?.checked ?? false;
  if (vulnerabilityVisible) return [];

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

  const zoneId = String(feature.properties?.Zone_ID ?? "").trim();
  const zoneTitle = zoneId ? `Zone ${zoneId}` : "Zone";
  const html = `<span class="zone-name-popup-title">${escapeHtml(zoneTitle)}</span>`;

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
  if (document.getElementById("toggleVulnerability")?.checked) return;

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

function onVulnerabilityClick(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  const vulnerabilityVisible = document.getElementById("toggleVulnerability")?.checked ?? false;
  if (!vulnerabilityVisible) return;

  closeZonePopups();
  closeSightingPopups();
  closeSchoolsPopups();
  closeStagingPopups();

  const html = buildVulnerabilityPopupHtml(feature.properties || {});

  if (appState.vulnerabilityClickPopup) appState.vulnerabilityClickPopup.remove();

  appState.vulnerabilityClickPopup = new maplibregl.Popup({
    className: "zone-name-popup-click",
    closeButton: true,
    closeOnClick: true,
    offset: 12,
    maxWidth: "360px",
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
  closeVulnerabilityPopups();
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
  closeVulnerabilityPopups();
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
  closeVulnerabilityPopups();
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
  closeVulnerabilityPopups();
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
  closeVulnerabilityPopups();
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
  closeVulnerabilityPopups();
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

function setupVulnerabilityInfoUI() {
  const infoBtn = document.getElementById("vulnerabilityInfoBtn");
  const modal = document.getElementById("vulnerabilityInfoModal");
  const closeBtn = document.getElementById("vulnerabilityInfoCloseBtn");
  const backdrop = modal?.querySelector("[data-close-vulnerability-info]");

  if (!infoBtn || !modal) return;

  function setModalOpen(isOpen) {
    modal.hidden = !isOpen;
    modal.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("legend-info-open", isOpen);
  }

  infoBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setModalOpen(true);
  });

  closeBtn?.addEventListener("click", () => {
    setModalOpen(false);
  });

  backdrop?.addEventListener("click", () => {
    setModalOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) setModalOpen(false);
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
  const controlPanel = document.getElementById("controlPanel");
  if (!menuToggle || !controlPanel) return;

  const panelHeader = controlPanel.querySelector(".panel-header");
  const mobileDrawerQuery = "(max-width: 1023px)";
  const edgeSwipeStartPx = 28;
  const dragOpenThresholdRatio = 0.5;

  const dragState = {
    active: false,
    mode: null,
    startX: 0,
    startY: 0,
    panelWidth: 0,
    startOffsetX: 0,
    currentOffsetX: 0,
    intentLocked: false,
    allowDrag: false,
  };

  function isMobileDrawerViewport() {
    return window.matchMedia(mobileDrawerQuery).matches;
  }

  function resetPanelDragStyles() {
    controlPanel.style.transition = "";
    controlPanel.style.transform = "";
    controlPanel.style.willChange = "";
  }

  function setPanelOpen(isOpen) {
    document.body.classList.toggle("panel-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    resetPanelDragStyles();
  }

  function beginPanelDrag(mode, startX, startY) {
    if (!isMobileDrawerViewport()) return;

    const panelWidth = Math.max(1, controlPanel.getBoundingClientRect().width);
    const startOffsetX = mode === "open" ? -panelWidth : 0;

    dragState.active = true;
    dragState.mode = mode;
    dragState.startX = startX;
    dragState.startY = startY;
    dragState.panelWidth = panelWidth;
    dragState.startOffsetX = startOffsetX;
    dragState.currentOffsetX = startOffsetX;
    dragState.intentLocked = false;
    dragState.allowDrag = false;

    if (mode === "open") {
      // Keep panel rendered while user drags it in from the edge.
      document.body.classList.add("panel-open");
      menuToggle.setAttribute("aria-expanded", "true");
    }

    controlPanel.style.transition = "none";
    controlPanel.style.willChange = "transform";
    controlPanel.style.transform = `translateX(${startOffsetX}px)`;
  }

  function cancelPanelDrag() {
    if (!dragState.active) return;

    const wasCloseDrag = dragState.mode === "close";
    dragState.active = false;
    dragState.mode = null;
    dragState.allowDrag = false;
    dragState.intentLocked = false;

    // Revert to whichever steady state we started from.
    setPanelOpen(wasCloseDrag);
  }

  function updatePanelDrag(clientX, clientY, event) {
    if (!dragState.active) return;

    const deltaX = clientX - dragState.startX;
    const deltaY = clientY - dragState.startY;

    if (!dragState.intentLocked) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;

      dragState.intentLocked = true;
      dragState.allowDrag = Math.abs(deltaX) > Math.abs(deltaY);

      if (!dragState.allowDrag) {
        cancelPanelDrag();
        return;
      }
    }

    if (!dragState.allowDrag) return;

    const rawOffset = dragState.startOffsetX + deltaX;
    const clampedOffset = Math.min(0, Math.max(-dragState.panelWidth, rawOffset));
    dragState.currentOffsetX = clampedOffset;
    controlPanel.style.transform = `translateX(${clampedOffset}px)`;

    if (event?.cancelable) event.preventDefault();
  }

  function finalizePanelDrag() {
    if (!dragState.active) return;

    const shouldOpen =
      dragState.currentOffsetX > -dragState.panelWidth * dragOpenThresholdRatio;

    dragState.active = false;
    dragState.mode = null;
    dragState.allowDrag = false;
    dragState.intentLocked = false;

    setPanelOpen(shouldOpen);
  }

  function onEdgeSwipeTouchStart(event) {
    if (!isMobileDrawerViewport()) return;
    if (document.body.classList.contains("panel-open")) return;

    const touch = event.touches?.[0];
    if (!touch) return;
    if (touch.clientX > edgeSwipeStartPx) return;

    beginPanelDrag("open", touch.clientX, touch.clientY);
  }

  function onPanelTouchStart(event) {
    if (!isMobileDrawerViewport()) return;
    if (!document.body.classList.contains("panel-open")) return;

    const touch = event.touches?.[0];
    if (!touch) return;

    // Close-drag starts from the panel header so vertical scrolling in content
    // still works naturally.
    if (panelHeader && !panelHeader.contains(event.target)) return;

    beginPanelDrag("close", touch.clientX, touch.clientY);
  }

  function onAnyTouchMove(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    updatePanelDrag(touch.clientX, touch.clientY, event);
  }

  function onAnyTouchEnd() {
    if (!dragState.active) return;
    finalizePanelDrag();
  }

  function onAnyTouchCancel() {
    cancelPanelDrag();
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

  document.addEventListener("touchstart", onEdgeSwipeTouchStart, { passive: true });
  controlPanel.addEventListener("touchstart", onPanelTouchStart, { passive: true });
  document.addEventListener("touchmove", onAnyTouchMove, { passive: false });
  document.addEventListener("touchend", onAnyTouchEnd, { passive: true });
  document.addEventListener("touchcancel", onAnyTouchCancel, { passive: true });
}

function closeDrawerOnMobile() {
  if (!window.matchMedia("(max-width: 1023px)").matches) return;
  document.body.classList.remove("panel-open");

  const controlPanel = document.getElementById("controlPanel");
  if (controlPanel) {
    controlPanel.style.transition = "";
    controlPanel.style.transform = "";
    controlPanel.style.willChange = "";
  }

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

function buildBoundsAroundPointMiles(center, radiusMiles) {
  const [lng, lat] = center;
  const milesPerDegreeLat = 69.0;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const milesPerDegreeLng = Math.max(1e-6, milesPerDegreeLat * Math.abs(cosLat));

  const latDelta = radiusMiles / milesPerDegreeLat;
  const lngDelta = radiusMiles / milesPerDegreeLng;

  return [
    [lng - lngDelta, lat - latDelta],
    [lng + lngDelta, lat + latDelta],
  ];
}

function enforceNavigationZoomLimit() {
  const map = appState.map;
  if (!map) return;

  // Use strict viewport-based math so mobile aspect ratios cannot zoom out
  // farther than the allowed bounds.
  const minZoom = computeStrictMinZoomForBounds(map, NAV_LIMIT_BOUNDS);
  if (!Number.isFinite(minZoom)) return;

  map.setMinZoom(minZoom);
  if (map.getZoom() < minZoom) map.setZoom(minZoom);
}

function computeStrictMinZoomForBounds(map, bounds) {
  const canvas = map?.getCanvas?.();
  const width = Math.max(1, Number(canvas?.clientWidth || canvas?.width || 0));
  const height = Math.max(1, Number(canvas?.clientHeight || canvas?.height || 0));

  const [[west, south], [east, north]] = bounds || [];
  if (![west, south, east, north].every(Number.isFinite)) return Number.NaN;

  const lngSpan = Math.max(1e-9, Math.abs(east - west));
  const mercSouth = latitudeToMercatorY(south);
  const mercNorth = latitudeToMercatorY(north);
  const mercSpan = Math.max(1e-12, Math.abs(mercNorth - mercSouth));

  const tileSize = 512; // MapLibre default world tile size for zoom math.
  const zoomForLng = Math.log2((width * 360) / (tileSize * lngSpan));
  const zoomForLat = Math.log2(height / (tileSize * mercSpan));

  return Math.max(0, zoomForLng, zoomForLat);
}

function latitudeToMercatorY(latitude) {
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, Number(latitude)));
  const rad = (clamped * Math.PI) / 180;
  return 0.5 - Math.log((1 + Math.sin(rad)) / (1 - Math.sin(rad))) / (4 * Math.PI);
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
  const zoneId = String(properties?.Zone_ID ?? "").trim();
  const zoneTitle = zoneId ? `Zone ${zoneId}` : "Zone";
  const isAverageSelection =
    appState.selectedWeeklyWalkWeek === AVERAGE_WEEK_VALUE ||
    String(appState.selectedWeeklyWalkWeek || "").toLowerCase() === "average";

  const aggregate = computeWalkAggregateForZone(
    appState.data?.walkMetrics,
    zoneId,
    appState.selectedWeeklyWalkWeek,
    appState.selectedWeekdayCodes
  );

  const avgAmRaw = isAverageSelection ? roundToTenths(aggregate.am) : Math.round(aggregate.am);
  const avgPmRaw = isAverageSelection ? roundToTenths(aggregate.pm) : Math.round(aggregate.pm);
  const iceSightingsRaw = properties?.["# of ICE sightings"];

  const avgAm = Number(avgAmRaw);
  const avgPm = Number(avgPmRaw);

  const avgAmText = Number.isFinite(avgAm)
    ? (isAverageSelection ? avgAm.toFixed(1) : String(Math.round(avgAm)))
    : "N/A";
  const avgPmText = Number.isFinite(avgPm)
    ? (isAverageSelection ? avgPm.toFixed(1) : String(Math.round(avgPm)))
    : "N/A";

  const dayCodes = Array.isArray(appState.selectedWeekdayCodes)
    ? appState.selectedWeekdayCodes
    : [];
  const selectedDayText = dayCodes.length ? dayCodes.join(", ") : "None";
  const selectedWeekText =
    appState.selectedWeeklyWalkWeek === AVERAGE_WEEK_VALUE
      ? "All Weeks (Average)"
      : String(appState.selectedWeeklyWalkWeek || "N/A");

  const iceSightingsText = Number.isFinite(Number(iceSightingsRaw))
    ? String(Math.round(Number(iceSightingsRaw)))
    : "N/A";

  return `
    <span class="zone-name-popup-title">${escapeHtml(zoneTitle)}</span><br />
    <span class="zone-name-popup-detail">Week: ${escapeHtml(selectedWeekText)}</span><br />
    <span class="zone-name-popup-detail">Days: ${escapeHtml(selectedDayText)}</span><br />
    <span class="zone-name-popup-detail">${isAverageSelection ? "Avg" : "Selected"} AM walks: ${avgAmText}</span><br />
    <span class="zone-name-popup-detail">${isAverageSelection ? "Avg" : "Selected"} PM walks: ${avgPmText}</span><br />
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

function formatVulnerabilityValue(value, digits = 3) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  return Math.round(num).toLocaleString();
}

function formatVulnerabilityInteger(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  return Math.round(num).toLocaleString();
}

function formatVulnerabilityPercent(value) {
  const rounded = formatVulnerabilityValue(value);
  return rounded === "N/A" ? rounded : `${rounded}%`;
}

function formatVulnerabilityFixed(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  return num.toFixed(digits);
}

function getFirstAvailableProperty(properties, candidateKeys) {
  const source = properties || {};
  for (const key of candidateKeys || []) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }
  return undefined;
}

function buildVulnerabilityPopupHtml(properties) {
  const p = properties || {};
  const tractName = p.NAMELSAD || "N/A";
  const vulnerabilityGroup = p.vuln_group_5;
  const vulnerabilityScore = p.vuln_score;
  const totalPopulation = p.total_pop;
  const nonCitizenPercent = p.noncitizen_pct_pop;
  const nonCitizenLepPercent = p.noncitizen_lep_pct_pop;
  const nonCitizenPerKm = getFirstAvailableProperty(p, [
    "noncitizen_per_km",
    "noncitizen_per_km2",
    "n\nnoncitizen_per_km2",
  ]);
  const dacSocialVulnerability = p.dac_vulnerability_score ?? p.vulnerability_score;
  const lmiFederalPoverty = p.lmi_poverty_federal;

  return `
    <span class="zone-name-popup-title">Census Profile</span><br />
    <span class="zone-name-popup-detail">${escapeHtml(String(tractName))}</span><br />
    <span class="zone-name-popup-detail">Vulnerability Group: ${escapeHtml(String(vulnerabilityGroup ?? "N/A"))}</span><br />
    <span class="zone-name-popup-detail">Vulnerability Score: ${escapeHtml(formatVulnerabilityValue(vulnerabilityScore))}</span><br />
    <span class="zone-name-popup-detail">Total Population: ${escapeHtml(formatVulnerabilityInteger(totalPopulation))}</span><br />
    <span class="zone-name-popup-detail">% Non-Citizen: ${escapeHtml(formatVulnerabilityPercent(nonCitizenPercent))}</span><br />
    <span class="zone-name-popup-detail">% Low English Proficiency Non-Citizen: ${escapeHtml(formatVulnerabilityPercent(nonCitizenLepPercent))}</span><br />
    <span class="zone-name-popup-detail">Non-Citizen Density (per km²): ${escapeHtml(formatVulnerabilityValue(nonCitizenPerKm))}</span><br />
    <span class="zone-name-popup-detail">DAC Social Vulnerability: ${escapeHtml(formatVulnerabilityValue(dacSocialVulnerability))}</span><br />
    <span class="zone-name-popup-detail">Low-Income (Federal Poverty): ${escapeHtml(formatVulnerabilityFixed(lmiFederalPoverty, 2))}</span>
  `;
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

function closeVulnerabilityPopups() {
  if (appState.vulnerabilityClickPopup) appState.vulnerabilityClickPopup.remove();
}
