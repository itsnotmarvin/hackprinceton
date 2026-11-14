# 01 · Data contract

Everyone builds against these shapes. Frontend reads them from mock files first, then from live endpoints. **Changing a shape requires telling the whole team.**

All numbers below are placeholders to show the shape, not real values.

Mock files live in `/mocks`. Field names are final once agreed in the kickoff.

---

## 1. Search → ranking

`POST /api/rank`

Request:
```json
{
  "capacity_mw": 100,
  "ready_by_year": 2029,
  "priority": "cost",
  "assumptions": {
    "launch_cost_per_kg": 1500,
    "power_price_multiplier": 1.0,
    "cooling": "water"
  }
}
```
- `priority`: `"cost" | "speed" | "community"`
- `cooling`: `"water" | "dry"`
- `assumptions` is optional; missing fields use defaults.

Response:
```json
{
  "options": [
    {
      "id": "houston",
      "name": "Houston, TX",
      "kind": "earth",
      "lat": 29.76,
      "lng": -95.37,
      "score": 82,
      "rank": 1,
      "cost_per_mw_year": 0,
      "time_to_power_years": 0,
      "risk": { "water": 0, "grid": 0, "crowding": 0, "opposition": 0, "overall": 0 },
      "labor": "strong",
      "reason": "Cheap power, moderate grid wait.",
      "badges": ["Lowest cost"],
      "has_parcels": true
    }
  ],
  "break_even": {
    "versus_id": "houston",
    "launch_cost_per_kg": 0,
    "text": "Orbit beats Houston below $X per kg."
  }
}
```
- `kind`: `"earth" | "orbit"`. Orbit is one entry in `options` with `id: "orbit"`.
- Risk values are 0–100, higher = riskier.
- `labor`: `"strong" | "adequate" | "short"`.

---

## 2. Region detail

`GET /api/region/{id}?capacity_mw=100&...same assumptions`

```json
{
  "id": "houston",
  "name": "Houston, TX",
  "breakdown": {
    "build_cost_usd": 0,
    "annual_operating_cost_usd": 0,
    "facility_power_mw": 0,
    "cooling_load_mw": 0,
    "annual_water_liters": 0,
    "water_household_equivalent": 0,
    "annual_energy_mwh": 0
  },
  "risk_notes": [
    { "factor": "crowding", "text": "9 projects already planned here." }
  ],
  "parcels": [
    { "id": "hou-001", "name": "Example parcel", "verdict": "buy", "lat": 0, "lng": 0 }
  ]
}
```
For orbit, `breakdown` also includes `solar_array_m2`, `radiator_m2`, `launch_mass_kg`, `launch_cost_usd`, and water is 0.

---

## 3. Parcel verdict

`GET /api/parcel/{id}?capacity_mw=100&...`

```json
{
  "id": "hou-001",
  "region_id": "houston",
  "address": "…",
  "lat": 0,
  "lng": 0,
  "acres": 0,
  "asking_price_per_acre": 0,
  "image_url": "…",
  "checks": [
    { "name": "size",      "status": "pass", "text": "Large enough for 100 MW." },
    { "name": "neighbors", "status": "warn", "text": "Homes 400 ft away." },
    { "name": "flood",     "status": "pass", "text": "Above surrounding terrain." },
    { "name": "power",     "status": "pass", "text": "Substation 0.8 mi." }
  ],
  "verdict": "buy",
  "max_price_per_acre": 0,
  "reason": "Buy up to $X per acre. Above that, the next-best site is the better deal.",
  "matterport_model_id": null,
  "sources": ["CoStar", "Vexcel Elements", "Vexcel Elevation"]
}
```
- `verdict`: `"buy" | "maybe" | "pass"`
- `status`: `"pass" | "warn" | "fail"`

---

## 4. Watchlist

`GET /api/watchlist` · `POST /api/watchlist` `{ "kind": "region|parcel", "id": "…" }` · `DELETE /api/watchlist/{id}`

```json
{
  "items": [
    {
      "kind": "parcel",
      "id": "hou-001",
      "name": "Example parcel",
      "current": { "verdict": "buy", "score": 82 },
      "changes": [
        {
          "date": "2026-11-14",
          "text": "Power prices rose 6%. Max price dropped to $X per acre.",
          "direction": "worse"
        }
      ]
    }
  ]
}
```
No login. One shared demo watchlist is fine.

---

## 5. Investigation report

`POST /api/investigate` `{ "kind": "parcel", "id": "hou-001" }` → `{ "report_id": "…", "status": "running" }`

`GET /api/report/{report_id}`

```json
{
  "report_id": "…",
  "status": "done",
  "site": { "kind": "parcel", "id": "hou-001", "name": "…" },
  "summary": "Two or three sentences with the recommendation.",
  "sections": [
    {
      "topic": "community",
      "finding": "…",
      "risk": "medium",
      "sources": [{ "title": "…", "url": "…" }]
    }
  ],
  "changes_since_last": ["…"],
  "generated_at": "2026-11-14T00:00:00Z"
}
```
- `status`: `"running" | "done" | "failed"`
- `topic`: `"power" | "water" | "land" | "community"`
- Every finding that isn't from our own model needs at least one source link.

A hand-written `mocks/report.json` must exist before the agent does.
