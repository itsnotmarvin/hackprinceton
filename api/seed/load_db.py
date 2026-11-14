"""Apply api/db/schema.sql and load data/*.json into Tiger Data. Safe to re-run (upserts).

    python api/seed/build_regions.py   # first
    python api/seed/load_db.py
"""
import json
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from psycopg.types.json import Jsonb

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")


def main():
    regions = json.loads((ROOT / "data" / "regions.json").read_text(encoding="utf-8"))
    prices = json.loads((ROOT / "data" / "electricity_prices.json").read_text(encoding="utf-8"))

    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        conn.execute((ROOT / "api" / "db" / "schema.sql").read_text(encoding="utf-8"))

        for r in regions:
            conn.execute(
                """INSERT INTO regions (id, name, kind, state, lat, lng, has_parcels, record, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, now())
                   ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, kind = EXCLUDED.kind,
                     state = EXCLUDED.state, lat = EXCLUDED.lat, lng = EXCLUDED.lng,
                     has_parcels = EXCLUDED.has_parcels, record = EXCLUDED.record, updated_at = now()""",
                (r["id"], r["name"], r["kind"], r["state"], r["lat"], r["lng"], r["has_parcels"], Jsonb(r)),
            )

        for p in prices:
            conn.execute(
                """INSERT INTO electricity_prices (time, state, sector, usd_per_kwh, status, source_url, retrieved)
                   VALUES (%s::date, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (state, sector, time) DO UPDATE SET usd_per_kwh = EXCLUDED.usd_per_kwh,
                     status = EXCLUDED.status, retrieved = EXCLUDED.retrieved""",
                (p["month"] + "-01", p["state"], p["sector"], p["usd_per_kwh"], p["status"],
                 p["source_url"], p["retrieved"]),
            )

        counts = {t: conn.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
                  for t in ("regions", "parcels", "electricity_prices", "score_history", "watchlist", "reports")}
    print(counts)


if __name__ == "__main__":
    main()
