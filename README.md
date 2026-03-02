# DDRR Static Webmap

Mobile-first + desktop-friendly MapLibre GL JS webmap using static files only (no build step).

## Files

- `index.html`
- `style.css`
- `main.js`

## Data paths (expected)

The map loads these local GeoJSON files via `fetch()`:

- `./data/dividing_line.geojson`
- `./data/confirmed_sightings.geojson`
- `./data/zones.geojson`

## Basemaps

- **Streets:** OpenFreeMap Liberty style
- **Satellite:** Esri World Imagery + CARTO label overlay

Per your latest request, there are **no MapTiler basemap calls** in the code.

## Run locally

From the repo root:

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

## Search usage note

Search uses Nominatim (OpenStreetMap). Please keep queries light and avoid rapid repeated requests.

## Deploy with GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set source to your main branch root (or `/docs` if you move files there).
4. Save and wait for the Pages URL.

No build pipeline is required.