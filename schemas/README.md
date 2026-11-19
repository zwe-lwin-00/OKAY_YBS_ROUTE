# YBS JSON schemas

- `catalog.schema.json` — `api/routes.json`
- `route.schema.json` — each `ybs_*_data.json`
- `stop.schema.json` — stop objects (including optional `direction` / `lane`)

Repo: `https://github.com/zwe-lwin-00/OKAY_YBS_ROUTE`

## Direction / lane model

After running `python tools/enrich_directions.py`:

| Field | Meaning |
|---|---|
| `direction_meta.pattern` | `out_and_back` or `one_way` |
| `stops[].direction` | `outbound`, `inbound`, `turnaround`, or `one_way` |
| `stops[].lane` | `unspecified`, or `right`/`left` when an opposite curb pair is detected |
| `stops[].opposite_stop_index` | Index of the paired opposite-direction stop, if known |

Lane values are inferred from out-and-back pairing, not surveyed curb surveys. Treat them as best-effort.

## Fare / schedule (optional)

| Field | Meaning |
|---|---|
| `fare` | Structured fare object (`currency`, `amount_min`/`max`, `notes`, …) |
| `schedule` | Structured schedule (`first_departure`, `last_departure`, `headway_minutes`, …) |
| `route_info.Fare` / `route_info.Schedule` | Optional free-text summaries |

These fields are **schema-ready**. Current route files do not populate them yet — fill when verified data is available.
