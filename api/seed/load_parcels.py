"""Turn the chosen CoStar sites into parcel records (06-data-model-contract.md shape) and upsert them.

Reads data/private/parcel_shortlist.json (run costar_shortlist.py first).
Writes data/private/parcels.json and the `parcels` table. Nothing here is committed with CoStar values.

    python api/seed/load_parcels.py
"""
import json
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from psycopg.types.json import Jsonb

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / "data" / "private"
load_dotenv(ROOT / ".env")

# Our parcel id -> (CoStar property id, demo role). See 07-project-log.md for why each was picked.
PICKS = {
    "hou-001": (13890701, "demo_buy"),       # Houston main: for sale, priced, photo + scan
    "hou-002": (238029, "backup"),           # Houston backup: cheaper, smaller
    "hou-003": (11175666, "scale_showcase"), # Houston: only data-center-scale site; not for sale
    "la-001": (755901, "demo_pass"),         # LA main: asking far above last month's sale
    "la-002": (5446366, "backup"),           # LA backup
}
COSTAR = "CoStar hackathon kit"


def observed(value, unit, source, scope=None):
    if value is None:
        return {"value": None, "unit": unit, "status": "unknown", "source": source}
    v = {"value": value, "unit": unit, "status": "observed", "source": source}
    if scope:
        v["scope"] = scope
    return v


def record(pid, costar_id, role, s):
    fs, ls = s.get("for_sale") or {}, s.get("last_sale") or {}
    price = fs.get("asking_price")
    acres = s.get("lot_acres")
    return {
        "id": pid,
        "region_id": s["region_id"],
        "name": s.get("name") or s["address"],
        "address": f"{s['address']}, {s['city']}",
        "lat": s["lat"],
        "lng": s["lng"],
        "demo_role": role,
        "property_type": s["type"],
        "costar_property_id": costar_id,
        "matterport_model_id": (s["matterport_model_ids"] or [None])[0],
        "image_url": s.get("photo_url"),
        "land_area": observed(acres, "acres", f"{COSTAR}: commercial-property.lotSize"),
        "building_area": observed(s.get("building_sqft"), "sqft", f"{COSTAR}: commercial-property GBA"),
        "zoning": s.get("zoning"),
        "for_sale_status": fs.get("status"),
        "asking_price": observed(price, "USD", f"{COSTAR}: commercial-listing-summary.forSaleSummary",
                                 "Seller's asking price, not a transacted price"),
        "asking_price_per_acre": (
            {"value": round(price / acres), "unit": "USD_per_acre", "scope": "asking_price / land_area",
             "status": "source_derived"}
            if price and acres else {"value": None, "unit": "USD_per_acre", "status": "unknown"}
        ),
        "last_sale": (
            {"value": ls["price"], "unit": "USD", "period": ls["date"], "status": "observed",
             "source": f"{COSTAR}: commercial-sale-comp {ls['sale_comp_id']}"}
            if ls else {"value": None, "unit": "USD", "status": "unknown"}
        ),
        "check_inputs": {
            "nearest_residential_ft": {"value": None, "unit": "ft", "status": "unknown", "source": "Vexcel Elements (pending)"},
            "elevation_vs_surroundings": {"value": None, "unit": "m", "status": "unknown", "source": "Vexcel Elevation (pending)"},
            "nearest_substation_mi": {"value": None, "unit": "mi", "status": "unknown", "source": "OpenStreetMap (pending)"},
        },
        "sources": ["CoStar"],
    }


def main():
    shortlist = {r["costar_property_id"]: r for r in
                 json.loads((PRIVATE / "parcel_shortlist.json").read_text(encoding="utf-8"))}
    parcels = [record(pid, cid, role, shortlist[cid]) for pid, (cid, role) in PICKS.items()]
    (PRIVATE / "parcels.json").write_text(json.dumps(parcels, indent=2), encoding="utf-8")

    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        for p in parcels:
            conn.execute(
                """INSERT INTO parcels (id, region_id, costar_property_id, lat, lng, record, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, now())
                   ON CONFLICT (id) DO UPDATE SET region_id = EXCLUDED.region_id,
                     costar_property_id = EXCLUDED.costar_property_id, lat = EXCLUDED.lat, lng = EXCLUDED.lng,
                     record = EXCLUDED.record, updated_at = now()""",
                (p["id"], p["region_id"], p["costar_property_id"], p["lat"], p["lng"], Jsonb(p)),
            )
        n = conn.execute("SELECT count(*) FROM parcels").fetchone()[0]
    for p in parcels:
        print(f"{p['id']:8} {p['demo_role']:15} {p['address']:40} acres={p['land_area']['value']} "
              f"asking={p['asking_price']['value']} mp={p['matterport_model_id'] is not None}")
    print(f"parcels table: {n} rows")


if __name__ == "__main__":
    main()
