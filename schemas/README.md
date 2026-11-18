# YBS JSON schemas

- `catalog.schema.json` — `api/routes.json`
- `route.schema.json` — each `ybs_*_data.json`
- `stop.schema.json` — stop objects (including optional `direction` / `lane`)

## Direction / lane model

After running `python tools/enrich_directions.py`:

| Field | Meaning |
|---|---|
| `direction_meta.pattern` | `out_and_back` or `one_way` |
| `stops[].direction` | `outbound`, `inbound`, `turnaround`, or `one_way` |
| `stops[].lane` | `unspecified`, or `right`/`left` when an opposite curb pair is detected |
| `stops[].opposite_stop_index` | Index of the paired opposite-direction stop, if known |

Lane values are inferred from out-and-back pairing, not surveyed curb surveys. Treat them as best-effort.
