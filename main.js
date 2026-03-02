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


const DATA_PATHS = {
  dividingLine: "./data/dividing_line.geojson",
  sightings: "./data/confirmed_sightings.geojson",
  zones: "./data/zones.geojson",
};

const SOURCE_IDS = {
  zones: "zones-source",
  zonesDebug: "zones-debug-source",
  sightings: "sightings-source",
  dividingLine: "dividing-line-source",
  dividingLabels: "dividing-labels-source",
};

const LAYER_IDS = {
  zonesFill: "zones-fill",
  zonesDebugFill: "zones-debug-fill",
  zonesCasing: "zones-casing",
  zonesOutline: "zones-outline",
  zonesHoverOutline: "zones-hover-outline",
  zonesLabel: "zones-label",
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
    // Keep first-load behavior covering all data as originally requested.
    fitToAllData(false);
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
  const sightings = preprocessGenericFeatureCollection(sightingsRaw);
  const dividingLine = preprocessGenericFeatureCollection(dividingLineRaw);
  const dividingLabels = buildDividingLabelPoints(dividingLine);

  return {
    zonesRaw: zonesPrepared,
    zonesFlat,
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
        properties: { ...(feature.properties || {}) },
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
      const props = { ...(feature.properties || {}) };
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
  const zoneNumber = Number(properties.Zone_number);
  const stableSeed = Number.isFinite(zoneNumber)
    ? String(zoneNumber)
    : String(properties.Zone ?? properties.zone_label ?? fallbackSeed);

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
    runZonesFallbackIfNeeded();
  });
}

function setupLayerToggleUI() {
  const zonesToggle = document.getElementById("toggleZones");
  const sightingsToggle = document.getElementById("toggleSightings");

  // Prevent stale browser-restored state.
  if (zonesToggle) zonesToggle.checked = true;
  if (sightingsToggle) sightingsToggle.checked = true;

  [zonesToggle, sightingsToggle].forEach((toggle) => {
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
  addOrUpdateGeoJsonSource(SOURCE_IDS.zonesDebug, buildDebugTestPolygon());
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
      "fill-color": "#ff00ff",
      "fill-opacity": 1,
    },
  });

  // Sanity-check layer: known-good polygon to confirm render pipeline.
  addLayerIfMissing({
    id: LAYER_IDS.zonesDebugFill,
    type: "fill",
    source: SOURCE_IDS.zonesDebug,
    paint: {
      "fill-color": "#00ffff",
      "fill-opacity": 0.8,
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

  addLayerIfMissing({
    id: LAYER_IDS.zonesOutline,
    type: "line",
    source: SOURCE_IDS.zones,
    paint: {
      "line-color": "#000000",
      "line-width": 0,
      "line-opacity": 0,
    },
  });

  // Hover outline layer (opacity/width increase on hovered feature only).
  addLayerIfMissing({
    id: LAYER_IDS.zonesHoverOutline,
    type: "line",
    source: SOURCE_IDS.zones,
    filter: ["==", ["id"], -1],
    paint: {
      "line-color": "#000000",
      "line-width": 0,
      "line-opacity": 0,
    },
  });

  addLayerIfMissing({
    id: LAYER_IDS.zonesLabel,
    type: "symbol",
    source: SOURCE_IDS.zones,
    layout: {
      "text-field": [
        "coalesce",
        ["to-string", ["get", "Zone_number"]],
        ["to-string", ["get", "zone_label"]],
        ["to-string", ["get", "Zone"]],
      ],
      "text-size": 20,
      "text-anchor": "bottom-right",
      "text-offset": [0.35, -0.35],
      "text-font": ["Noto Sans Regular", "Open Sans Regular", "Arial Unicode MS Regular"],
    },
    paint: {
      "text-color": "#4b5563",
      "text-halo-color": "rgba(255,255,255,0.85)",
      "text-halo-width": 1.2,
    },
  });

  // B) Confirmed sightings points
  addLayerIfMissing({
    id: LAYER_IDS.sightings,
    type: "circle",
    source: SOURCE_IDS.sightings,
    paint: {
      "circle-color": "#dc2626",
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 6, 14, 10],
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

    const sourceFeatures = map.querySourceFeatures(SOURCE_IDS.zones);
    console.info(
      "Zones source features count (current mode):",
      sourceFeatures.length,
      appState.zonesDataMode
    );
    if (sourceFeatures[0]) {
      console.info("Zones source sample properties:", sourceFeatures[0].properties);
    }

    const rendered = map.queryRenderedFeatures(undefined, { layers: [LAYER_IDS.zonesFill] });
    console.info("Zones rendered count (current mode):", rendered.length, appState.zonesDataMode);
    const debugRendered = map.queryRenderedFeatures(undefined, { layers: [LAYER_IDS.zonesDebugFill] });
    console.info("Debug test polygon rendered count:", debugRendered.length);
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
          const sourceFeaturesAfter = map.querySourceFeatures(SOURCE_IDS.zones);
          console.info("Zones source features count after fallback:", sourceFeaturesAfter.length);
          const renderedAfter = map.queryRenderedFeatures(undefined, { layers: [LAYER_IDS.zonesFill] });
          console.info("Zones rendered count after fallback:", renderedAfter.length);
          const debugRenderedAfter = map.queryRenderedFeatures(undefined, {
            layers: [LAYER_IDS.zonesDebugFill],
          });
          console.info("Debug test polygon rendered count after fallback:", debugRenderedAfter.length);
        }, 250);
      }
    }
  }, 950);
}

function applyLayerVisibilityFromToggles() {
  const zonesVisible = document.getElementById("toggleZones")?.checked ?? true;
  const sightingsVisible = document.getElementById("toggleSightings")?.checked ?? true;

  setLayerVisibility(
    [
      LAYER_IDS.zonesFill,
      LAYER_IDS.zonesCasing,
      LAYER_IDS.zonesOutline,
      LAYER_IDS.zonesHoverOutline,
      LAYER_IDS.zonesLabel,
    ],
    zonesVisible
  );

  setLayerVisibility([LAYER_IDS.sightings], sightingsVisible);

  // Dividing line and labels are always on (no toggle per latest request).
  setLayerVisibility(
    [LAYER_IDS.dividingLine, LAYER_IDS.dividingLabelAbove, LAYER_IDS.dividingLabelBelow],
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

  map.on("mousemove", LAYER_IDS.zonesFill, onZonesHover);
  map.on("mouseleave", LAYER_IDS.zonesFill, onZonesLeave);
  map.on("click", LAYER_IDS.zonesFill, onZonesClick);

  map.on("mousemove", LAYER_IDS.sightings, onSightingsHover);
  map.on("mouseleave", LAYER_IDS.sightings, onSightingsLeave);
  map.on("click", LAYER_IDS.sightings, onSightingsClick);
}

function unbindOverlayInteractions() {
  const map = appState.map;
  if (!map) return;

  const handlers = [
    ["mousemove", LAYER_IDS.zonesFill, onZonesHover],
    ["mouseleave", LAYER_IDS.zonesFill, onZonesLeave],
    ["click", LAYER_IDS.zonesFill, onZonesClick],
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

function onZonesHover(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  map.getCanvas().style.cursor = "pointer";

  const zoneUid = Number(feature.properties?.__zone_uid ?? -1);
  if (map.getLayer(LAYER_IDS.zonesHoverOutline)) {
    map.setFilter(LAYER_IDS.zonesHoverOutline, ["==", ["get", "__zone_uid"], zoneUid]);
  }

  const zoneName = escapeHtml(String(feature.properties?.Zone ?? ""));
  const html = `<strong>Zone:</strong> ${zoneName}`;

  if (!appState.zoneHoverPopup) {
    appState.zoneHoverPopup = new maplibregl.Popup({
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

  map.getCanvas().style.cursor = "";

  if (map.getLayer(LAYER_IDS.zonesHoverOutline)) {
    map.setFilter(LAYER_IDS.zonesHoverOutline, ["==", ["id"], -1]);
  }

  if (appState.zoneHoverPopup) appState.zoneHoverPopup.remove();
}

function onZonesClick(event) {
  const map = appState.map;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  const zoneName = escapeHtml(String(feature.properties?.Zone ?? ""));
  const html = `<strong>Zone:</strong> ${zoneName}`;

  if (appState.zoneClickPopup) appState.zoneClickPopup.remove();

  appState.zoneClickPopup = new maplibregl.Popup({
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

function buildDebugTestPolygon() {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "debug-zone",
        properties: { name: "debug-zone" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-73.9395, 40.851],
              [-73.931, 40.851],
              [-73.931, 40.857],
              [-73.9395, 40.857],
              [-73.9395, 40.851],
            ],
          ],
        },
      },
    ],
  };
}
