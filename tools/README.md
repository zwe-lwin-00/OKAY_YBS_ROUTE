# Data tools

| Script | Purpose |
|---|---|
| `validate_data.py` | JSON Schema + catalog consistency + naming/coord checks |
| `audit_data.py` | Coord / naming audit report (CI + release) |
| `enrich_directions.py` | Add `direction_meta` / per-stop `direction` + `lane` |
| `export_formats.py` | Export GeoJSON, CSV, GTFS-lite |
| `lib_geo.py` | Shared geo helpers |

```bash
pip install -r tools/requirements.txt
python tools/validate_data.py
python tools/audit_data.py --fail-on-error
python tools/enrich_directions.py
python tools/export_formats.py --format all
```

Outputs go to `exports/` (gitignored). On `v*` tags, GitHub Actions publishes those files as release artifacts.
