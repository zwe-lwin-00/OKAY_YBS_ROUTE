#!/usr/bin/env python3
"""Export YBS route data to GeoJSON, GTFS-lite, and CSV."""

from __future__ import annotations

import argparse
import csv
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_catalog(root: Path) -> dict:
    return json.loads((root / "api" / "routes.json").read_text(encoding="utf-8"))


def load_route(root: Path, data_file: str) -> dict:
    return json.loads((root / data_file).read_text(encoding="utf-8"))


def export_geojson(root: Path, out_dir: Path) -> Path:
    catalog = load_catalog(root)
    features = []
    for entry in catalog["routes"]:
        data = load_route(root, entry["data_file"])
        coords = [
            [s["longitude"], s["latitude"]]
            for s in data["stops"]
            if isinstance(s.get("latitude"), (int, float))
        ]
        if len(coords) >= 2:
            features.append(
                {
                    "type": "Feature",
                    "properties": {
                        "bus_line": data["bus_line"],
                        "line_name": data["route_info"].get("Line Name"),
                        "agency": data["route_info"].get("Agency"),
                        "data_file": entry["data_file"],
                        "pattern": (data.get("direction_meta") or {}).get("pattern"),
                        "kind": "route_line",
                    },
                    "geometry": {"type": "LineString", "coordinates": coords},
                }
            )
        for stop in data["stops"]:
            features.append(
                {
                    "type": "Feature",
                    "properties": {
                        "bus_line": data["bus_line"],
                        "stop_index": stop["index"],
                        "stop_name_en": stop["stop_name_en"],
                        "stop_name_mm": stop["stop_name_mm"],
                        "road": stop.get("road", ""),
                        "direction": stop.get("direction"),
                        "lane": stop.get("lane"),
                        "kind": "stop",
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [stop["longitude"], stop["latitude"]],
                    },
                }
            )

    out = out_dir / "ybs_routes.geojson"
    out.write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False),
        encoding="utf-8",
    )
    return out


def export_csv(root: Path, out_dir: Path) -> tuple[Path, Path]:
    catalog = load_catalog(root)
    routes_csv = out_dir / "routes.csv"
    stops_csv = out_dir / "stops.csv"

    with routes_csv.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "bus_line",
                "line_name",
                "agency",
                "qr_payment",
                "total_stops",
                "data_file",
                "pattern",
                "outbound_label",
                "inbound_label",
            ],
        )
        w.writeheader()
        for entry in catalog["routes"]:
            data = load_route(root, entry["data_file"])
            meta = data.get("direction_meta") or {}
            w.writerow(
                {
                    "bus_line": data["bus_line"],
                    "line_name": data["route_info"].get("Line Name", ""),
                    "agency": data["route_info"].get("Agency", ""),
                    "qr_payment": data["route_info"].get("QR Payment", ""),
                    "total_stops": len(data["stops"]),
                    "data_file": entry["data_file"],
                    "pattern": meta.get("pattern", ""),
                    "outbound_label": meta.get("outbound_label", ""),
                    "inbound_label": meta.get("inbound_label", ""),
                }
            )

    with stops_csv.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "bus_line",
                "data_file",
                "index",
                "stop_name_en",
                "stop_name_mm",
                "road",
                "latitude",
                "longitude",
                "direction",
                "lane",
                "opposite_stop_index",
            ],
        )
        w.writeheader()
        for entry in catalog["routes"]:
            data = load_route(root, entry["data_file"])
            for stop in data["stops"]:
                w.writerow(
                    {
                        "bus_line": data["bus_line"],
                        "data_file": entry["data_file"],
                        "index": stop["index"],
                        "stop_name_en": stop["stop_name_en"],
                        "stop_name_mm": stop["stop_name_mm"],
                        "road": stop.get("road", ""),
                        "latitude": stop["latitude"],
                        "longitude": stop["longitude"],
                        "direction": stop.get("direction", ""),
                        "lane": stop.get("lane", ""),
                        "opposite_stop_index": stop.get("opposite_stop_index", ""),
                    }
                )

    return routes_csv, stops_csv


def export_gtfs_lite(root: Path, out_dir: Path) -> Path:
    """
    Minimal GTFS-like zip for mapping/tooling.
    Not a full agency schedule feed (no frequencies/trips/calendars beyond one synthetic trip).
    """
    catalog = load_catalog(root)
    gtfs_dir = out_dir / "gtfs_lite_tmp"
    if gtfs_dir.exists():
        for p in gtfs_dir.glob("*"):
            p.unlink()
    else:
        gtfs_dir.mkdir(parents=True)

    agency = gtfs_dir / "agency.txt"
    routes = gtfs_dir / "routes.txt"
    stops = gtfs_dir / "stops.txt"
    trips = gtfs_dir / "trips.txt"
    stop_times = gtfs_dir / "stop_times.txt"
    calendar = gtfs_dir / "calendar.txt"

    agency.write_text(
        "agency_id,agency_name,agency_url,agency_timezone\n"
        "YBS,Yangon Bus Service,https://github.com/hidecard/YBS-Bus-Data,Asia/Yangon\n",
        encoding="utf-8",
    )
    calendar.write_text(
        "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n"
        "EVERYDAY,1,1,1,1,1,1,1,20200101,20991231\n",
        encoding="utf-8",
    )

    with routes.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "route_id",
                "agency_id",
                "route_short_name",
                "route_long_name",
                "route_type",
            ],
        )
        w.writeheader()
        for entry in catalog["routes"]:
            w.writerow(
                {
                    "route_id": entry["data_file"].replace(".json", ""),
                    "agency_id": "YBS",
                    "route_short_name": entry["bus_line"],
                    "route_long_name": entry["line_name"],
                    "route_type": "3",
                }
            )

    stop_rows = {}
    trip_rows = []
    stop_time_rows = []

    for entry in catalog["routes"]:
        data = load_route(root, entry["data_file"])
        route_id = entry["data_file"].replace(".json", "")
        trip_id = f"{route_id}_trip"
        trip_rows.append(
            {
                "route_id": route_id,
                "service_id": "EVERYDAY",
                "trip_id": trip_id,
                "trip_headsign": data["route_info"].get("Line Name", ""),
            }
        )
        for seq, stop in enumerate(data["stops"], start=1):
            stop_id = f"{route_id}_{stop['index']}"
            stop_rows[stop_id] = {
                "stop_id": stop_id,
                "stop_name": stop["stop_name_en"],
                "stop_lat": stop["latitude"],
                "stop_lon": stop["longitude"],
            }
            # Synthetic evenly spaced times from 06:00
            minutes = 6 * 60 + (seq - 1) * 2
            hh, mm = divmod(minutes, 60)
            t = f"{hh:02d}:{mm:02d}:00"
            stop_time_rows.append(
                {
                    "trip_id": trip_id,
                    "arrival_time": t,
                    "departure_time": t,
                    "stop_id": stop_id,
                    "stop_sequence": str(seq),
                }
            )

    with stops.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f, fieldnames=["stop_id", "stop_name", "stop_lat", "stop_lon"]
        )
        w.writeheader()
        for row in stop_rows.values():
            w.writerow(row)

    with trips.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f, fieldnames=["route_id", "service_id", "trip_id", "trip_headsign"]
        )
        w.writeheader()
        for row in trip_rows:
            w.writerow(row)

    with stop_times.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "trip_id",
                "arrival_time",
                "departure_time",
                "stop_id",
                "stop_sequence",
            ],
        )
        w.writeheader()
        for row in stop_time_rows:
            w.writerow(row)

    zip_path = out_dir / "ybs_gtfs_lite.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name in [
            "agency.txt",
            "routes.txt",
            "stops.txt",
            "trips.txt",
            "stop_times.txt",
            "calendar.txt",
        ]:
            zf.write(gtfs_dir / name, arcname=name)

    for p in gtfs_dir.glob("*"):
        p.unlink()
    gtfs_dir.rmdir()
    return zip_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "exports",
        help="Output directory (default: ./exports)",
    )
    parser.add_argument(
        "--format",
        choices=["all", "geojson", "csv", "gtfs"],
        default="all",
    )
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    written: list[Path] = []
    if args.format in ("all", "geojson"):
        written.append(export_geojson(args.root, args.out))
    if args.format in ("all", "csv"):
        written.extend(export_csv(args.root, args.out))
    if args.format in ("all", "gtfs"):
        written.append(export_gtfs_lite(args.root, args.out))

    print("Wrote:")
    for path in written:
        print(f"- {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
