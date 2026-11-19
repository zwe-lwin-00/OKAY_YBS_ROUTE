#!/usr/bin/env python3
"""Coord / naming audit for YBS route JSON files.

Writes a machine-readable report. Exit 1 only for hard errors when --fail-on-error.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Greater Yangon + nearby corridor towns (Okkan, Taikkyi, etc.)
LAT_MIN, LAT_MAX = 15.8, 17.65
LNG_MIN, LNG_MAX = 95.5, 97.2

PLACEHOLDER_NAMES = {"null", "undefined", "n/a", "na", "-", "?", "none", "test"}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def audit(root: Path) -> dict:
    errors: list[dict] = []
    warnings: list[dict] = []
    stats = {
        "route_files": 0,
        "stops": 0,
        "with_fare": 0,
        "with_schedule": 0,
        "qr_supported": 0,
    }

    files = sorted(root.glob("ybs_*_data.json"))
    stats["route_files"] = len(files)

    for path in files:
        data = load_json(path)
        ri = data.get("route_info") or {}
        if data.get("fare") or ri.get("Fare") or ri.get("fare"):
            stats["with_fare"] += 1
        if data.get("schedule") or ri.get("Schedule") or ri.get("schedule"):
            stats["with_schedule"] += 1
        if "Supported" in str(ri.get("QR Payment", "")):
            stats["qr_supported"] += 1

        stops = data.get("stops") or []
        stats["stops"] += len(stops)
        prev = None
        for i, stop in enumerate(stops):
            idx = stop.get("index", str(i + 1))
            en = stop.get("stop_name_en")
            mm = stop.get("stop_name_mm")
            lat = stop.get("latitude")
            lng = stop.get("longitude")

            if not isinstance(en, str) or not en.strip():
                errors.append(
                    {"file": path.name, "index": idx, "code": "empty_name_en"}
                )
            elif en != en.strip():
                errors.append(
                    {
                        "file": path.name,
                        "index": idx,
                        "code": "whitespace_name_en",
                        "value": en,
                    }
                )
            elif en.strip().lower() in PLACEHOLDER_NAMES:
                errors.append(
                    {
                        "file": path.name,
                        "index": idx,
                        "code": "placeholder_name_en",
                        "value": en,
                    }
                )

            if not isinstance(mm, str) or not mm.strip():
                errors.append(
                    {"file": path.name, "index": idx, "code": "empty_name_mm"}
                )
            elif mm != mm.strip():
                errors.append(
                    {
                        "file": path.name,
                        "index": idx,
                        "code": "whitespace_name_mm",
                        "value": mm,
                    }
                )

            if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
                errors.append(
                    {
                        "file": path.name,
                        "index": idx,
                        "code": "non_numeric_coord",
                        "lat": lat,
                        "lng": lng,
                    }
                )
            elif lat == 0 and lng == 0:
                errors.append(
                    {"file": path.name, "index": idx, "code": "zero_coord"}
                )
            elif not (LAT_MIN <= lat <= LAT_MAX and LNG_MIN <= lng <= LNG_MAX):
                warnings.append(
                    {
                        "file": path.name,
                        "index": idx,
                        "code": "outside_service_bbox",
                        "lat": lat,
                        "lng": lng,
                        "name_en": en,
                    }
                )

            if prev is not None:
                if (
                    prev.get("stop_name_en") == en
                    and prev.get("latitude") == lat
                    and prev.get("longitude") == lng
                ):
                    warnings.append(
                        {
                            "file": path.name,
                            "index": idx,
                            "code": "duplicate_consecutive_stop",
                            "name_en": en,
                        }
                    )
            prev = stop

    catalog = load_json(root / "api" / "routes.json")
    base = catalog.get("base_url") or ""
    if "zwe-lwin-00/OKAY_YBS_ROUTE" not in base:
        warnings.append(
            {
                "file": "api/routes.json",
                "code": "catalog_base_url_not_updated",
                "base_url": base,
            }
        )

    by_code = Counter(e["code"] for e in errors)
    by_warn = Counter(w["code"] for w in warnings)
    return {
        "stats": stats,
        "error_count": len(errors),
        "warning_count": len(warnings),
        "errors_by_code": dict(by_code),
        "warnings_by_code": dict(by_warn),
        "errors": errors,
        "warnings": warnings[:200],
        "notes": {
            "fare_schedule": (
                "No route currently includes fare or schedule objects. "
                "Optional schema fields `fare` and `schedule` are reserved for future data."
            ),
            "bbox": f"lat [{LAT_MIN},{LAT_MAX}] lng [{LNG_MIN},{LNG_MAX}]",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument(
        "--fail-on-error",
        action="store_true",
        help="Exit 1 when hard naming/coord errors are found",
    )
    args = parser.parse_args()

    report = audit(args.root)
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text + "\n", encoding="utf-8")
        print(f"Wrote {args.out}")

    print(
        f"AUDIT — routes={report['stats']['route_files']} stops={report['stats']['stops']} "
        f"errors={report['error_count']} warnings={report['warning_count']}"
    )
    print(f"  fare fields present: {report['stats']['with_fare']}")
    print(f"  schedule fields present: {report['stats']['with_schedule']}")
    if report["errors_by_code"]:
        print("  errors:", report["errors_by_code"])
    if report["warnings_by_code"]:
        print("  warnings:", report["warnings_by_code"])
    print(" ", report["notes"]["fare_schedule"])

    if args.fail_on_error and report["error_count"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
