# 06 · Data → Model contract

`01-contract.md` defines what the **frontend** receives. This file defines what the **data lane hands the model functions**: one region record and one parcel record. The model reads these; it never calls a data source directly.

**Change a field name or unit here = tell both lanes.**

---

## Rule 1: every value is an object, not a bare number

```json
"electricity_price": {
  "value": 0.0721,
  "unit": "USD_per_kWh",
  "scope": "Texas statewide industrial-sector average",
  "status": "observed",
  "source": "EIA Electric Power Monthly, Table 5.6.A",
  "source_url": "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a",
  "period": "2026-08 (preliminary)",
  "retrieved": "2026-11-13"
}
```

| Key | Meaning |
|---|---|
| `value` | The number, in exactly `unit`. `null` if unknown. |
| `unit` | One of the canonical units below. Never anything else. |
| `scope` | What the number actually describes (state average vs. this parcel's quote). |
| `status` | `observed` · `source_derived` · `assumption` · `unknown` |
| `source`, `source_url` | Where it came from. Required unless `status` is `assumption` or `unknown`. |
| `period` | When the observation applies (not when we fetched it). |
| `retrieved` | Date we fetched it. |

## Rule 2: canonical units (one per quantity, no exceptions)

| Quantity | Unit | Note |
|---|---|---|
| Electricity price | `USD_per_kWh` | EIA publishes cents/kWh → **divide by 100**. $0.10/kWh = $100/MWh. |
| Construction cost | `USD_per_W_IT` | Per watt of **IT** capacity. × MW × 1,000,000 = dollars. |
| Water use effectiveness | `L_per_IT_kWh` | Multiply by **IT** energy, not facility energy (else PUE is double-counted). |
| PUE | `ratio` | facility energy / IT energy |
| Land area | `acres` | |
| Building area | `sqft` | CoStar commercial areas are sqft. |
| Land price | `USD_per_acre` | |
| Distance | `ft` (short, neighbors) / `mi` (long, substation) | Unit is in the field name. |
| Elevation difference | `m` | Parcel minus surroundings; positive = higher. |
| Time | `years` | |
| Risk scores | `score_0_100` | Higher = riskier. |

## Rule 3: missing stays missing

- Unknown → `"value": null, "status": "unknown"`. **Never 0, never a guess.**
- The model must **not** treat null as zero cost, zero risk, or a passed check. A check with a null input returns `status: "warn"` with text like "Power timing unknown."
- If a required input for a calculation is null, the output field is null and the frontend shows "Unknown", not a number.

---

## Example region record (Houston)

Real values where we have them; everything else is honestly marked.

```json
{
  "id": "houston",
  "name": "Houston, TX",
  "kind": "earth",
  "lat": 29.76,
  "lng": -95.37,
  "state": "TX",

  "electricity_price": {
    "value": 0.0721, "unit": "USD_per_kWh",
    "scope": "Texas statewide industrial-sector average, not a data-center tariff",
    "status": "observed",
    "source": "EIA Electric Power Monthly, Table 5.6.A",
    "source_url": "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a",
    "period": "2026-08 (preliminary)", "retrieved": "2026-11-13"
  },

  "construction_cost": {
    "value": 10.51, "unit": "USD_per_W_IT",
    "scope": "Dallas benchmark used as Texas proxy; ~60 MW air-cooled build-to-suit; EXCLUDES land, utility works, site works, IT equipment, fees",
    "status": "source_derived",
    "source": "Turner & Townsend Data Centre Cost Index 2026-27",
    "source_url": "https://www.turnerandtownsend.com/news/surging-demand-for-ai-drives-race-to-deliver-data-centre-mega-projects/",
    "period": "2026-27", "retrieved": "2026-11-13"
  },

  "cooling": {
    "water": {
      "pue": { "value": 1.20, "unit": "ratio", "scope": "Team reference scenario", "status": "assumption" },
      "wue": { "value": 0.20, "unit": "L_per_IT_kWh", "scope": "Team reference scenario", "status": "assumption" }
    },
    "dry": {
      "pue": { "value": null, "unit": "ratio", "status": "unknown" },
      "wue": { "value": null, "unit": "L_per_IT_kWh", "status": "unknown" }
    }
  },

  "grid_wait": {
    "value": null, "unit": "years",
    "scope": "Time to receive utility power for a new large load",
    "status": "unknown",
    "note": "Berkeley Lab queue data covers generators, not loads; do not substitute."
  },

  "risk_inputs": {
    "water_stress": { "value": null, "unit": "score_0_100", "status": "unknown", "source": "WRI Aqueduct 4.0 (not yet extracted)" },
    "crowding_count": { "value": null, "unit": "count", "status": "unknown", "source": "Epoch AI Frontier Data Centers (not yet pulled)" },
    "opposition": { "value": null, "unit": "score_0_100", "status": "unknown" },
    "labor": { "value": null, "unit": "category", "status": "unknown", "allowed": ["strong", "adequate", "short"] }
  }
}
```

## Example parcel record

Shape only. Real CoStar values live in the gitignored data store, **not in the public repo** (hackathon-only license).

```json
{
  "id": "hou-001",
  "region_id": "houston",
  "address": "EXAMPLE",
  "lat": 29.80,
  "lng": -95.40,
  "costar_property_id": "EXAMPLE",
  "matterport_model_id": null,
  "image_url": null,

  "land_area":   { "value": 12.5,  "unit": "acres",        "status": "observed", "source": "CoStar commercial-property" },
  "building_area": { "value": 180000, "unit": "sqft",      "status": "observed", "source": "CoStar commercial-property" },
  "asking_price": {
    "value": 9000000, "unit": "USD",
    "scope": "Total asking price for the listing",
    "status": "observed", "source": "CoStar commercial-listing-summary"
  },
  "asking_price_per_acre": {
    "value": 720000, "unit": "USD_per_acre",
    "scope": "asking_price / land_area",
    "status": "source_derived"
  },

  "check_inputs": {
    "nearest_residential_ft": { "value": null, "unit": "ft", "status": "unknown", "source": "Vexcel Elements (pending)" },
    "elevation_vs_surroundings": { "value": null, "unit": "m", "status": "unknown", "source": "Vexcel Elevation (pending)" },
    "nearest_substation_mi": { "value": null, "unit": "mi", "status": "unknown", "source": "OpenStreetMap (pending)" }
  }
}
```

---

## Open decisions for the team

1. **Parcel vs. building.** The CoStar kit has only 5 land properties (2 Houston, 3 LA) but ~122 industrial + ~31 flex buildings, 107 for-sale listings overall. Demo likely becomes "buy this industrial building and convert it." If so, the model's size check uses `building_area` and achievable MW, not just acres.
2. **LA electricity price.** Same EIA table, California row; not pulled yet.
3. **Houston construction cost.** Dallas is a proxy. Keep it labeled, or find a Houston figure.
4. **Dry cooling PUE/WUE.** Model lane picks values + sources and marks them `assumption`.
5. **Flood check.** Relative elevation alone doesn't prove flood safety; check text should say "terrain only."
