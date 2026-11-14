"""Build data/regions.json in the shape of 06-data-model-contract.md.

Only public sources here (EIA, Turner & Townsend), so the output is safe to commit.
Edit the tables below, re-run, then run load_db.py.

    python api/seed/build_regions.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RETRIEVED = "2026-11-13"

EIA = {
    "source": "EIA Electric Power Monthly, Table 5.6.A (industrial sector)",
    "source_url": "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a",
}
# cents/kWh, industrial sector. 2026-08 preliminary, 2025-08 final.
EIA_CENTS = {
    "TX": {"2026-08": 7.21, "2025-08": 6.42},
    "CA": {"2026-08": 24.12, "2025-08": 23.84},
    "VA": {"2026-08": 9.98, "2025-08": 9.40},
    "NJ": {"2026-08": 16.24, "2025-08": 15.06},
    "AZ": {"2026-08": 9.73, "2025-08": 8.88},
    "GA": {"2026-08": 13.05, "2025-08": 8.20},
    "OH": {"2026-08": 9.75, "2025-08": 8.47},
}

TT = {
    "source": "Turner & Townsend Data Centre Construction Cost Index 2026-27",
    "source_url": "https://www.turnerandtownsend.com/news/surging-demand-for-ai-drives-race-to-deliver-data-centre-mega-projects/",
    "scope_suffix": "~60 MW air-cooled build-to-suit; EXCLUDES land, utility works, site works, IT equipment, fees",
}
# USD per W of IT capacity, as published.
TT_USD_PER_W = {
    "Dallas": 10.51, "Silicon Valley": 15.01, "North Virginia": 11.80, "New Jersey": 14.22,
    "Phoenix": 11.05, "Atlanta": 10.91, "Columbus": 11.71,
}

# id, name, state, lat, lng (city centre, assumption), T&T market, has CoStar parcels
REGIONS = [
    ("houston", "Houston, TX", "TX", 29.76, -95.37, "Dallas", True),
    ("los-angeles", "Los Angeles, CA", "CA", 34.05, -118.24, "Silicon Valley", True),
    ("dallas", "Dallas, TX", "TX", 32.78, -96.80, "Dallas", False),
    ("northern-virginia", "Northern Virginia", "VA", 39.04, -77.49, "North Virginia", False),
    ("phoenix", "Phoenix, AZ", "AZ", 33.45, -112.07, "Phoenix", False),
    ("atlanta", "Atlanta, GA", "GA", 33.75, -84.39, "Atlanta", False),
    ("columbus", "Columbus, OH", "OH", 39.96, -83.00, "Columbus", False),
    ("new-jersey", "New Jersey", "NJ", 40.22, -74.76, "New Jersey", False),
]


# Regions not in the T&T index; their construction cost borrows another market's figure.
COST_PROXY = {"houston", "los-angeles"}


def unknown(unit, **extra):
    return {"value": None, "unit": unit, "status": "unknown", **extra}


def assumption(value, unit, scope):
    return {"value": value, "unit": unit, "scope": scope, "status": "assumption"}


def cooling():
    return {
        "water": {
            "pue": assumption(1.20, "ratio", "Team reference scenario"),
            "wue": assumption(0.20, "L_per_IT_kWh", "Team reference scenario"),
        },
        "dry": {"pue": unknown("ratio"), "wue": unknown("L_per_IT_kWh")},
    }


def risk_inputs():
    return {
        "water_stress": unknown("score_0_100", source="WRI Aqueduct 4.0 (not yet extracted)"),
        "crowding_count": unknown("count", source="Epoch AI Frontier Data Centers (not yet pulled)"),
        "opposition": unknown("score_0_100"),
        "labor": unknown("category", allowed=["strong", "adequate", "short"]),
    }


def earth(rid, name, state, lat, lng, tt_market, has_parcels):
    proxy = rid in COST_PROXY
    return {
        "id": rid, "name": name, "kind": "earth", "state": state,
        "lat": lat, "lng": lng, "has_parcels": has_parcels,
        "electricity_price": {
            "value": round(EIA_CENTS[state]["2026-08"] / 100, 4), "unit": "USD_per_kWh",
            "scope": f"{state} statewide industrial-sector average, not a data-center tariff",
            "status": "observed", **EIA, "period": "2026-08 (preliminary)", "retrieved": RETRIEVED,
        },
        "construction_cost": {
            "value": TT_USD_PER_W[tt_market], "unit": "USD_per_W_IT",
            "scope": (f"{tt_market} benchmark used as proxy for {name}; " if proxy else f"{tt_market} benchmark; ")
            + TT["scope_suffix"],
            "status": "source_derived" if proxy else "observed",
            "source": TT["source"], "source_url": TT["source_url"], "period": "2026-27", "retrieved": RETRIEVED,
        },
        "cooling": cooling(),
        "grid_wait": unknown("years", scope="Time to receive utility power for a new large load",
                             note="Berkeley Lab queue data covers generators, not loads; do not substitute."),
        "risk_inputs": risk_inputs(),
    }


def orbit():
    return {
        "id": "orbit", "name": "Low Earth Orbit", "kind": "orbit", "state": None,
        "lat": 0, "lng": 0, "has_parcels": False,
        "electricity_price": {"value": 0, "unit": "USD_per_kWh", "scope": "On-board solar; cost is in hardware + launch",
                              "status": "assumption"},
        "construction_cost": unknown("USD_per_W_IT", note="Model lane computes from launch mass x launch cost"),
        "cooling": {"radiative": {"pue": unknown("ratio"), "wue": assumption(0, "L_per_IT_kWh", "No water in orbit")}},
        "grid_wait": unknown("years", note="Model lane states earliest realistic availability as an assumption"),
        "risk_inputs": {
            "water_stress": assumption(0, "score_0_100", "No water use"),
            "crowding_count": unknown("count"), "opposition": unknown("score_0_100"),
            "labor": unknown("category", allowed=["strong", "adequate", "short"]),
        },
    }


def electricity_series():
    rows = []
    for state, by_month in EIA_CENTS.items():
        for month, cents in by_month.items():
            rows.append({"month": month, "state": state, "sector": "industrial",
                         "usd_per_kwh": round(cents / 100, 4),
                         "status": "preliminary" if month.startswith("2026") else "final",
                         "source_url": EIA["source_url"], "retrieved": RETRIEVED})
    return rows


def main():
    out = ROOT / "data"
    out.mkdir(exist_ok=True)
    regions = [earth(*r) for r in REGIONS] + [orbit()]
    (out / "regions.json").write_text(json.dumps(regions, indent=2), encoding="utf-8")
    (out / "electricity_prices.json").write_text(json.dumps(electricity_series(), indent=2), encoding="utf-8")
    for r in regions:
        print(f"{r['id']:18} power={r['electricity_price']['value']} $/kWh  build={r['construction_cost']['value']} $/W "
              f"({r['construction_cost']['status']})")


if __name__ == "__main__":
    main()
