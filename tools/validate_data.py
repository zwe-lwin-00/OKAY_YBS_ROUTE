#!/usr/bin/env python3
"""Validate YBS catalog + route JSON files against schemas and consistency rules."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = ROOT / "schemas"

try:
    import jsonschema
    from jsonschema import Draft202012Validator
    from referencing import Registry, Resource
except ImportError:  # pragma: no cover
    print("Missing dependency: pip install jsonschema referencing", file=sys.stderr)
    sys.exit(2)


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def build_registry() -> Registry:
    resources = []
    for path in SCHEMAS.glob("*.schema.json"):
        data = load_json(path)
        resources.append((data["$id"], Resource.from_contents(data)))
    registry = Registry()
    for uri, resource in resources:
        registry = registry.with_resource(uri, resource)
    return registry


def validate_instance(instance, schema_name: str, registry: Registry) -> list[str]:
    schema = load_json(SCHEMAS / schema_name)
    validator = Draft202012Validator(schema, registry=registry)
    return [
        f"{e.json_path}: {e.message}" for e in sorted(validator.iter_errors(instance), key=lambda e: e.path)
    ]


def check_route_consistency(path: Path, data: dict) -> list[str]:
    errors: list[str] = []
    stops = data.get("stops") or []
    indexes = [s.get("index") for s in stops]
    expected = [str(i) for i in range(1, len(stops) + 1)]
    if indexes != expected:
        errors.append(f"{path.name}: stop indexes are not contiguous 1..N")

    for i, stop in enumerate(stops):
        en = (stop.get("stop_name_en") or "").strip()
        mm = (stop.get("stop_name_mm") or "").strip()
        if en != stop.get("stop_name_en") or mm != stop.get("stop_name_mm"):
            errors.append(f"{path.name}: stop #{i+1} has leading/trailing whitespace in names")
        if stop.get("stop_name_en") != en or stop.get("stop_name_mm") != mm:
            pass
        lat, lng = stop.get("latitude"), stop.get("longitude")
        if lat == 0 and lng == 0:
            errors.append(f"{path.name}: stop #{i+1} has 0,0 coordinates")

    total_text = (data.get("route_info") or {}).get("Total Stops", "")
    if isinstance(total_text, str) and total_text:
        digits = "".join(ch for ch in total_text if ch.isdigit())
        if digits and int(digits) != len(stops):
            errors.append(
                f"{path.name}: Total Stops text '{total_text}' != stops.length {len(stops)}"
            )

    if "direction_meta" in data:
        pattern = data["direction_meta"].get("pattern")
        dirs = {s.get("direction") for s in stops}
        if pattern == "one_way" and dirs - {None, "one_way"}:
            errors.append(f"{path.name}: one_way route has non-one_way stop directions")
        if pattern == "out_and_back" and not ({"outbound", "inbound"} & dirs):
            errors.append(f"{path.name}: out_and_back route missing outbound/inbound stop directions")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args()
    root: Path = args.root

    registry = build_registry()
    errors: list[str] = []

    catalog_path = root / "api" / "routes.json"
    catalog = load_json(catalog_path)
    errors.extend(
        f"catalog{err}" if err.startswith(":") else f"catalog: {err}"
        for err in validate_instance(catalog, "catalog.schema.json", registry)
    )

    if catalog.get("route_count") != len(catalog.get("routes") or []):
        errors.append(
            f"catalog: route_count {catalog.get('route_count')} != len(routes) {len(catalog.get('routes') or [])}"
        )

    bus_lines = [r["bus_line"] for r in catalog.get("routes") or []]
    for line, count in Counter(bus_lines).items():
        if count > 1:
            errors.append(f"catalog: duplicate bus_line '{line}' ({count} times)")

    data_files = [r["data_file"] for r in catalog.get("routes") or []]
    for file_name, count in Counter(data_files).items():
        if count > 1:
            errors.append(f"catalog: duplicate data_file '{file_name}'")

    route_files = sorted(root.glob("ybs_*_data.json"))
    on_disk = {p.name for p in route_files}
    in_catalog = set(data_files)

    for missing in sorted(in_catalog - on_disk):
        errors.append(f"catalog: missing data file on disk: {missing}")
    for orphan in sorted(on_disk - in_catalog):
        errors.append(f"orphan route file not in catalog: {orphan}")

    for entry in catalog.get("routes") or []:
        path = root / entry["data_file"]
        if not path.exists():
            continue
        data = load_json(path)
        for err in validate_instance(data, "route.schema.json", registry):
            errors.append(f"{path.name}: {err}")
        errors.extend(check_route_consistency(path, data))
        if len(data.get("stops") or []) != entry.get("total_stops"):
            errors.append(
                f"{path.name}: catalog total_stops {entry.get('total_stops')} != file stops {len(data.get('stops') or [])}"
            )
        if data.get("bus_line") != entry.get("bus_line"):
            errors.append(
                f"{path.name}: bus_line mismatch file='{data.get('bus_line')}' catalog='{entry.get('bus_line')}'"
            )

    if errors:
        print(f"VALIDATION FAILED ({len(errors)} issue(s))")
        for err in errors:
            print(f"- {err}")
        return 1

    print(
        f"VALIDATION OK — {len(catalog.get('routes') or [])} catalog routes, "
        f"{len(route_files)} route files"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
