# DDRR Static Webmap

Mobile-first + desktop-friendly MapLibre GL JS webmap using static files only (no build step).

## Files

- `index.html`
- `style.css`
- `main.js`

## Data paths (expected)

The map loads these local files via `fetch()`:

- `./data/dividing_line.geojson`
- `./data/icebreaker.geojson` (confirmed sightings)
- `./data/zones.geojson`

## Basemaps

- **Streets:** OpenFreeMap Liberty style
- **Satellite:** Esri World Imagery + CARTO label overlay

Per your latest request, there are **no MapTiler basemap calls** in the code.

## Run locally
```bash
source C:/anaconda3/Scripts/activate GS
```
From the repo root:

```bash

python -m http.server 8000
```

Then open:

`http://localhost:8000`

## Refresh walk-log labels/data

Because GitHub Pages is static hosting, it cannot run `processing/generate_walk_log.py` automatically when the map loads.

If you update the walk log and want the polygon labels/counts to refresh, run this from the repo root before serving locally or pushing to GitHub Pages:

```bash
python processing/generate_walk_log.py
```

## Search usage note

Search uses Nominatim (OpenStreetMap). Please keep queries light and avoid rapid repeated requests.

## Deploy with GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set source to your main branch root (or `/docs` if you move files there).
4. Save and wait for the Pages URL.

No build pipeline is required.
