"""Build a shortlist of candidate demo sites from the CoStar hackathon kit.

Candidates: Industrial, Flex and Land properties in Houston and Los Angeles,
joined with their for-sale listings, last single-property sale, and Matterport scans.

Output goes to data/private/ (gitignored: CoStar data is hackathon-only licensed).

    python api/seed/costar_shortlist.py
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KIT = ROOT / "costar-hackathon-kit"
OUT = ROOT / "data" / "private"

TYPES = {2: "Industrial", 3: "Land", 7: "Flex"}
MARKETS = {14: "houston", 20: "los-angeles"}
SQFT_PER_ACRE = 43560
SALE_STATUS = {1: "Active", 2: "Escrow", 3: "Pending", 4: "UnderContract", 5: "Sold", 6: "Withdrawn"}


def jsonl(name):
    with open(KIT / "data" / f"{name}.jsonl", encoding="utf-8") as f:
        for line in f:
            yield json.loads(line)


def lot_acres(p):
    size, unit = p.get("lotSize"), p.get("lotSizeMeasurementType")
    if size is None:
        return None
    if unit == 2:  # Acres
        return round(size, 2)
    if unit == 1:  # SquareFeet
        return round(size / SQFT_PER_ACRE, 2)
    return None


def main():
    # Matterport model ids per property, from the starter CSV.
    models = defaultdict(list)
    with open(KIT / "commercial-properties.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["MatterportModelId"]:
                models[int(row["PropertyId"])].append(row["MatterportModelId"])

    props = {}
    for p in jsonl("commercial-property"):
        if p.get("propertyType") not in TYPES:
            continue
        addr = p.get("primaryAddress") or {}
        region = MARKETS.get(addr.get("researchMarketId"))
        if not region:
            continue
        photo = (p.get("primaryPhoto") or {}).get("attachmentUri")
        props[p["id"]] = {
            "costar_property_id": p["id"],
            "region_id": region,
            "type": TYPES[p["propertyType"]],
            "name": p.get("buildingName"),
            "address": " ".join(str(addr[k]) for k in ("streetNumber", "streetDirection", "streetName", "streetType")
                                if addr.get(k)) or None,
            "city": addr.get("city"),
            "lat": addr.get("latitude"),
            "lng": addr.get("longitude"),
            "building_sqft": p.get("grossBuildingAreaSquareFeet") or p.get("rentableBuildingAreaSquareFeet"),
            "lot_acres": lot_acres(p),
            "zoning": p.get("zoningDescription"),
            "photo_url": photo,
            "matterport_model_ids": models.get(p["id"], []),
            "for_sale": None,
            "last_sale": None,
        }

    # Active-ish for-sale listings on those properties.
    for l in jsonl("commercial-listing-summary"):
        fs = l.get("forSaleSummary")
        pid = l.get("propertyId")
        if not fs or pid not in props:
            continue
        price = fs.get("askingPriceLow") or fs.get("askingPriceHigh")
        cur = props[pid]["for_sale"]
        if cur is None or (price and not cur["asking_price"]):
            props[pid]["for_sale"] = {
                "listing_id": l["id"],
                "status": SALE_STATUS.get(fs.get("saleStatus"), str(fs.get("saleStatus"))),
                "asking_price": price,
                "asking_price_high": fs.get("askingPriceHigh"),
            }

    # Most recent single-property sale with a price.
    for s in jsonl("commercial-sale-comp"):
        if (s.get("numberOfEntities") or 1) != 1 or not s.get("soldForPrice"):
            continue
        for e in s.get("entities") or []:
            pid = e.get("propertyId")
            if pid not in props:
                continue
            cur = props[pid]["last_sale"]
            if cur is None or s["soldDate"] > cur["date"]:
                props[pid]["last_sale"] = {"date": s["soldDate"][:10], "price": s["soldForPrice"], "sale_comp_id": s["id"]}

    rows = list(props.values())
    for r in rows:
        price = (r["for_sale"] or {}).get("asking_price")
        r["asking_price_per_acre"] = round(price / r["lot_acres"]) if price and r["lot_acres"] else None
    # For sale with a price first, then biggest buildings.
    rows.sort(key=lambda r: (
        not ((r["for_sale"] or {}).get("asking_price")),
        not r["for_sale"],
        -(r["building_sqft"] or 0),
    ))

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "parcel_shortlist.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    cols = ["region_id", "type", "costar_property_id", "name", "address", "city", "building_sqft", "lot_acres",
            "zoning", "sale_status", "asking_price", "asking_price_per_acre", "last_sale_date", "last_sale_price",
            "matterport_count", "has_photo", "lat", "lng"]
    with open(OUT / "parcel_shortlist.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in rows:
            fs, ls = r["for_sale"] or {}, r["last_sale"] or {}
            w.writerow({**{k: r.get(k) for k in cols if k in r},
                        "sale_status": fs.get("status"), "asking_price": fs.get("asking_price"),
                        "last_sale_date": ls.get("date"), "last_sale_price": ls.get("price"),
                        "matterport_count": len(r["matterport_model_ids"]), "has_photo": bool(r["photo_url"])})

    by = defaultdict(lambda: defaultdict(int))
    for r in rows:
        k = (r["region_id"], r["type"])
        by[k]["total"] += 1
        by[k]["for_sale"] += bool(r["for_sale"])
        by[k]["priced"] += bool((r["for_sale"] or {}).get("asking_price"))
        by[k]["last_sale"] += bool(r["last_sale"])
        by[k]["acres"] += bool(r["lot_acres"])
    for k, v in sorted(by.items()):
        print(k, dict(v))
    print(f"wrote {len(rows)} rows to {OUT}")


if __name__ == "__main__":
    main()
