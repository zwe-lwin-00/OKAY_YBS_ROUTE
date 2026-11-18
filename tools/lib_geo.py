"""Shared geo helpers for validation / enrichment / export."""

from __future__ import annotations

import math
from typing import Iterable


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


def normalize_name(name: str) -> str:
    return " ".join(name.lower().split())


def find_apex_index(stops: list[dict]) -> int:
    if len(stops) < 3:
        return max(0, len(stops) - 1)
    start = stops[0]
    best_i = len(stops) // 2
    best_d = -1.0
    for i, stop in enumerate(stops[1:], start=1):
        d = haversine_m(
            start["latitude"],
            start["longitude"],
            stop["latitude"],
            stop["longitude"],
        )
        if d >= best_d:
            best_d = d
            best_i = i
    return best_i


def looks_like_out_and_back(stops: list[dict]) -> bool:
    if len(stops) < 8:
        return False
    end_gap = haversine_m(
        stops[0]["latitude"],
        stops[0]["longitude"],
        stops[-1]["latitude"],
        stops[-1]["longitude"],
    )
    if end_gap <= 350:
        return True
    cut = max(3, len(stops) // 3)
    early = {normalize_name(s["stop_name_en"]) for s in stops[:cut]}
    late = {normalize_name(s["stop_name_en"]) for s in stops[-cut:]}
    shared = len(early & late - {""})
    return shared >= 3 and end_gap < 2000


def line_labels(line_name: str) -> tuple[str, str]:
    """Parse '(N) A - B' style Myanmar/English labels into toward-A / toward-B."""
    text = line_name.strip()
    if ")" in text:
        text = text.split(")", 1)[1].strip()
    if " - " in text:
        left, right = text.split(" - ", 1)
        return left.strip(), right.strip()
    if "-" in text:
        left, right = text.split("-", 1)
        return left.strip(), right.strip()
    return "Start", "End"


def bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360) % 360
