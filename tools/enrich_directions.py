#!/usr/bin/env python3
"""
Add explicit direction / lane fields to every route JSON file.

- Detects out-and-back vs one-way encodings
- Labels each stop outbound / inbound / one_way / turnaround
- Sets lane=unspecified by default
- Links likely opposite-direction curb pairs via opposite_stop_index
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from lib_geo import (
    find_apex_index,
    haversine_m,
    line_labels,
    looks_like_out_and_back,
    normalize_name,
)

ROOT = Path(__file__).resolve().parents[1]


def enrich_route(data: dict) -> dict:
    stops = data["stops"]
    line_name = data.get("route_info", {}).get("Line Name", "")
    toward_start, toward_end = line_labels(line_name)

    # Cleanup trivial whitespace typos while enriching
    for stop in stops:
        stop["stop_name_en"] = (stop.get("stop_name_en") or "").strip()
        stop["stop_name_mm"] = (stop.get("stop_name_mm") or "").strip()
        stop["road"] = (stop.get("road") or "").strip()
        stop["lane"] = stop.get("lane") or "unspecified"
        stop.pop("opposite_stop_index", None)

    if looks_like_out_and_back(stops):
        apex = find_apex_index(stops)
        apex = min(max(apex, 1), len(stops) - 2)
        data["direction_meta"] = {
            "pattern": "out_and_back",
            "apex_index": apex + 1,
            "outbound_label": f"Toward {toward_end}",
            "inbound_label": f"Toward {toward_start}",
        }
        for i, stop in enumerate(stops):
            if i < apex:
                stop["direction"] = "outbound"
            elif i > apex:
                stop["direction"] = "inbound"
            else:
                stop["direction"] = "turnaround"

        # Link opposite curbs: same normalized name across halves within 120m
        outbound = [(i, s) for i, s in enumerate(stops) if s["direction"] == "outbound"]
        inbound = [(i, s) for i, s in enumerate(stops) if s["direction"] == "inbound"]
        for oi, os_ in outbound:
            on = normalize_name(os_["stop_name_en"])
            if not on:
                continue
            best = None
            for ii, is_ in inbound:
                if normalize_name(is_["stop_name_en"]) != on:
                    continue
                d = haversine_m(
                    os_["latitude"],
                    os_["longitude"],
                    is_["latitude"],
                    is_["longitude"],
                )
                if d <= 120 and (best is None or d < best[0]):
                    best = (d, ii, is_)
            if best:
                _, ii, is_ = best
                os_["opposite_stop_index"] = is_["index"]
                is_["opposite_stop_index"] = os_["index"]
                # If opposite curb exists, mark lanes as distinct unspecified sides
                if os_.get("lane") == "unspecified":
                    os_["lane"] = "right"
                if is_.get("lane") == "unspecified":
                    is_["lane"] = "left"
    else:
        data["direction_meta"] = {
            "pattern": "one_way",
            "one_way_label": line_name or data.get("bus_line", "One way"),
        }
        for stop in stops:
            stop["direction"] = "one_way"
            stop["lane"] = stop.get("lane") or "unspecified"

    # Keep Total Stops text aligned
    info = data.setdefault("route_info", {})
    info["Total Stops"] = f"{len(stops)} stops"
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    files = sorted(args.root.glob("ybs_*_data.json"))
    changed = 0
    patterns = {"out_and_back": 0, "one_way": 0}

    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        before = json.dumps(data, ensure_ascii=False, sort_keys=True)
        data = enrich_route(data)
        after = json.dumps(data, ensure_ascii=False, sort_keys=True)
        patterns[data["direction_meta"]["pattern"]] += 1
        if before != after:
            changed += 1
            if not args.dry_run:
                path.write_text(
                    json.dumps(data, ensure_ascii=False, indent=4) + "\n",
                    encoding="utf-8",
                )

    # Sync catalog total_stops from files
    catalog_path = args.root / "api" / "routes.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    by_file = {
        p.name: json.loads(p.read_text(encoding="utf-8"))
        for p in files
    }
    for route in catalog["routes"]:
        data = by_file.get(route["data_file"])
        if not data:
            continue
        route["total_stops"] = len(data["stops"])
        route["bus_line"] = data.get("bus_line", route["bus_line"])
    catalog["route_count"] = len(catalog["routes"])
    if not args.dry_run:
        catalog_path.write_text(
            json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    print(
        f"{'DRY RUN — ' if args.dry_run else ''}enriched {changed}/{len(files)} files "
        f"(out_and_back={patterns['out_and_back']}, one_way={patterns['one_way']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
