# Data tools

| Script | Purpose |
|---|---|
| `validate_data.py` | JSON Schema + catalog consistency checks |
| `enrich_directions.py` | Add `direction_meta` / per-stop `direction` + `lane` |
| `export_formats.py` | Export GeoJSON, CSV, GTFS-lite |
| `lib_geo.py` | Shared geo helpers |

```bash
pip install -r tools/requirements.txt
python tools/validate_data.py
python tools/enrich_directions.py
python tools/export_formats.py --format all
```

Outputs go to `exports/` (gitignored).
