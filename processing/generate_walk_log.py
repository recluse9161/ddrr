from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import date
from pathlib import Path
from typing import Any

from openpyxl import load_workbook


def get_zone_id(label: str | None) -> str | None:
    if label is None:
        return None

    clean = str(label).strip()
    if not clean:
        return None

    inwood_match = re.fullmatch(r"(?i)Inwood\s+(\d+)\s*", clean)
    if inwood_match:
        return f"I_{int(inwood_match.group(1))}"

    wahi_match = re.fullmatch(r"(?i)WaHi\s+(\d+)\s*", clean)
    if wahi_match:
        return f"WH_{int(wahi_match.group(1))}"

    if re.fullmatch(r"(?i)Dispatch\s*", clean):
        return "Dispatch"

    return None


def parse_week_date(a1_text: Any, default_year: int) -> date:
    text = "" if a1_text is None else str(a1_text).strip()
    if not text:
        raise ValueError("Could not parse date from empty A1 value.")

    # Examples:
    # - Wk of 2/23
    # - Wk of 1/19/2026
    match = re.search(r"(?i)Wk\s*of\s*(\d{1,2})\s*/\s*(\d{1,2})(?:\s*/\s*(\d{2,4}))?", text)
    if not match:
        raise ValueError(f"Could not parse week date from A1 value: {text!r}")

    month = int(match.group(1))
    day = int(match.group(2))

    year_text = match.group(3)
    if year_text:
        year = int(year_text)
        if len(year_text) == 2:
            year += 2000
    else:
        year = default_year

    return date(year, month, day)


def zone_sort_key(zone_id: str) -> tuple[int, int, str]:
    inwood_match = re.fullmatch(r"I_(\d+)", zone_id)
    if inwood_match:
        return (0, int(inwood_match.group(1)), "")

    wahi_match = re.fullmatch(r"WH_(\d+)", zone_id)
    if wahi_match:
        return (1, int(wahi_match.group(1)), "")

    if zone_id == "Dispatch":
        return (2, 999, "")

    return (9, 999, zone_id)


def has_value(cell_value: Any) -> bool:
    if cell_value is None:
        return False
    return str(cell_value).strip() != ""


def to_int_or_float(value: Any) -> int | float:
    if isinstance(value, (int, float)):
        return value
    text = "" if value is None else str(value).strip()
    if not text:
        return 0
    try:
        as_float = float(text)
    except ValueError:
        return 0

    if as_float.is_integer():
        return int(as_float)
    return as_float


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]

    parser = argparse.ArgumentParser(description="Generate walk_log.csv and joined walk-log GeoJSON outputs.")
    parser.add_argument(
        "--input-workbook",
        default=str(repo_root / "processing" / "2026-log-of-walks-inwood_wahi.xlsx"),
    )
    parser.add_argument(
        "--output-csv",
        default=str(repo_root / "processing" / "walk_log.csv"),
    )
    parser.add_argument(
        "--input-zones-geojson",
        default=str(repo_root / "data" / "zones.geojson"),
    )
    parser.add_argument(
        "--output-zones-geojson",
        default=str(repo_root / "data" / "zones_walk_log.geojson"),
    )
    parser.add_argument(
        "--output-dispatch-geojson",
        default=str(repo_root / "data" / "dispatch_walk_log.geojson"),
    )
    parser.add_argument("--default-year", type=int, default=2026)
    args = parser.parse_args()

    input_workbook = Path(args.input_workbook)
    output_csv = Path(args.output_csv)
    input_zones_geojson = Path(args.input_zones_geojson)
    output_zones_geojson = Path(args.output_zones_geojson)
    output_dispatch_geojson = Path(args.output_dispatch_geojson)

    workbook = load_workbook(input_workbook, data_only=True)

    weeks: list[dict[str, Any]] = []
    all_zones: set[str] = set()

    for sheet in workbook.worksheets:
        week_date = parse_week_date(sheet["A1"].value, args.default_year)
        week_label = f"{week_date.month}/{week_date.day}/{week_date.year % 100:02d}"

        max_row = sheet.max_row or 0
        max_col = sheet.max_column or 0

        am_cols: list[int] = []
        pm_cols: list[int] = []
        for col in range(2, max_col + 1):
            header_text = str(sheet.cell(row=2, column=col).value or "").strip().upper()
            if header_text == "AM":
                am_cols.append(col)
            elif header_text == "PM":
                pm_cols.append(col)

        counts_by_zone: dict[str, dict[str, int]] = {}

        for row in range(1, max_row + 1):
            raw_label = str(sheet.cell(row=row, column=1).value or "").strip()
            if not raw_label:
                continue
            if re.fullmatch(r"(?i)Other\s*", raw_label):
                continue

            zone_id = get_zone_id(raw_label)
            if not zone_id:
                continue

            all_zones.add(zone_id)
            zone_counts = counts_by_zone.setdefault(zone_id, {"AM": 0, "PM": 0})

            zone_counts["AM"] += sum(
                1 for col in am_cols if has_value(sheet.cell(row=row, column=col).value)
            )
            zone_counts["PM"] += sum(
                1 for col in pm_cols if has_value(sheet.cell(row=row, column=col).value)
            )

        weeks.append(
            {
                "week_date": week_date,
                "week_label": week_label,
                "counts_by_zone": counts_by_zone,
            }
        )

    workbook.close()

    all_zones.add("Dispatch")
    ordered_weeks = sorted(weeks, key=lambda w: w["week_date"])
    ordered_zones = sorted(all_zones, key=zone_sort_key)

    rows: list[dict[str, Any]] = []
    week_count = len(ordered_weeks)

    for zone_id in ordered_zones:
        row: dict[str, Any] = {"Zone_ID": zone_id}

        am_values: list[int] = []
        pm_values: list[int] = []

        for week in ordered_weeks:
            am_field = f"{week['week_label']} AM"
            pm_field = f"{week['week_label']} PM"

            zone_counts = week["counts_by_zone"].get(zone_id)
            am_value = int(zone_counts["AM"]) if zone_counts else 0
            pm_value = int(zone_counts["PM"]) if zone_counts else 0

            row[am_field] = am_value
            row[pm_field] = pm_value
            am_values.append(am_value)
            pm_values.append(pm_value)

        avg_am = (sum(am_values) / week_count) if week_count else 0.0
        avg_pm = (sum(pm_values) / week_count) if week_count else 0.0

        row["Avg AM"] = round(avg_am, 1)
        row["Avg PM"] = round(avg_pm, 1)

        rows.append(row)

    fieldnames: list[str] = ["Zone_ID"]
    for week in ordered_weeks:
        fieldnames.extend([f"{week['week_label']} AM", f"{week['week_label']} PM"])
    fieldnames.extend(["Avg AM", "Avg PM"])

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with output_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Created CSV: {output_csv}")

    rows_by_zone = {str(row["Zone_ID"]): row for row in rows}

    with input_zones_geojson.open("r", encoding="utf-8") as f:
        zones_geojson = json.load(f)

    for feature in zones_geojson.get("features", []):
        props = feature.get("properties")
        if not isinstance(props, dict):
            continue

        zone_id = str(props.get("Zone_ID", "")).strip()
        if not zone_id or zone_id == "Dispatch":
            continue

        zone_row = rows_by_zone.get(zone_id)
        if not zone_row:
            continue

        for key, value in zone_row.items():
            if key == "Zone_ID":
                continue
            props[key] = to_int_or_float(value)

    output_zones_geojson.parent.mkdir(parents=True, exist_ok=True)
    with output_zones_geojson.open("w", encoding="utf-8") as f:
        json.dump(zones_geojson, f, ensure_ascii=False)
    print(f"Created joined zones GeoJSON: {output_zones_geojson}")

    dispatch_props: dict[str, Any] = {"Zone_ID": "Dispatch"}
    dispatch_row = rows_by_zone.get("Dispatch")

    if dispatch_row:
        for key, value in dispatch_row.items():
            if key == "Zone_ID":
                continue
            dispatch_props[key] = to_int_or_float(value)
    else:
        for week in ordered_weeks:
            dispatch_props[f"{week['week_label']} AM"] = 0
            dispatch_props[f"{week['week_label']} PM"] = 0
        dispatch_props["Avg AM"] = 0
        dispatch_props["Avg PM"] = 0

    dispatch_collection: dict[str, Any] = {
        "type": "FeatureCollection",
        "name": "dispatch_walk_log",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    **dispatch_props,
                    "Zone_ID": str(dispatch_props.get("Zone_ID", "Dispatch")),
                },
                "geometry": {
                    "type": "Point",
                    # GeoJSON uses [longitude, latitude]
                    "coordinates": [-73.93394320, 40.87604323],
                },
            }
        ],
    }

    if "crs" in zones_geojson:
        dispatch_collection["crs"] = zones_geojson["crs"]

    output_dispatch_geojson.parent.mkdir(parents=True, exist_ok=True)
    with output_dispatch_geojson.open("w", encoding="utf-8") as f:
        json.dump(dispatch_collection, f, ensure_ascii=False)
    print(f"Created dispatch point GeoJSON: {output_dispatch_geojson}")


if __name__ == "__main__":
    main()
