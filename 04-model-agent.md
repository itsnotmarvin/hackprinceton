# 04 · Model + Agent

**You own:** the math first, then the deep agent.
**You produce:** plain functions the API calls (and later the agent calls as tools).
**You never wait on:** data. Start with hardcoded inputs.

## Part A — The model (plain functions, no AI)

Rule: **work each formula in a spreadsheet with one example first. The code must reproduce that example.** Every constant goes in `ASSUMPTIONS.md` with a source.

### A1. Resources (Earth)
```
facility_power_mw  = it_power_mw × PUE
cooling_load_mw    ≈ it_power_mw                      (nearly all power becomes heat)
annual_energy_mwh  = facility_power_mw × 8760 × utilization
annual_water_l     = annual_energy_mwh × 1000 × WUE   (WUE in L/kWh; depends on cooling type and climate)
```
PUE and WUE differ for water vs dry cooling. Dry cooling: lower water, higher PUE.

### A2. Cost (Earth)
```
build_cost     = it_power_mw × cost_per_mw              (derive cost_per_mw from Epoch's cost data)
operating_cost = annual_energy_mwh × power_price
               + annual_water_l × water_price
               + maintenance
cost_per_mw_year = (build_cost / lifetime_years + operating_cost) / it_power_mw
```
For a parcel, add `land_cost = acres × price_per_acre` to `build_cost`.

### A3. Time to power
```
time_to_power = max(grid_wait_years, construction_years × labor_factor)
```
`labor_factor` > 1 where skilled trades are short (BLS data).

### A4. Orbit
```
solar_array_m2 = power_w / (solar_flux × panel_efficiency)            solar_flux ≈ 1361 W/m²
radiator_m2    = heat_w / (emissivity × σ × (T_radiator⁴ − T_sink⁴))  σ = 5.67e-8 W/m²K⁴
launch_mass_kg = solar_array_m2 × kg_per_m2_solar
               + radiator_m2 × kg_per_m2_radiator
               + it_mass_kg
launch_cost    = launch_mass_kg × launch_cost_per_kg
orbit_cost_per_mw_year = (hardware_cost + launch_cost) / hardware_life_years / it_power_mw + ops
```
Water is 0. Time to power is a stated assumption (earliest realistic availability year).
Take the specific-mass and lifetime numbers from published sources (Suncatcher paper, Starcloud white paper, ASCEND study) and note which source is optimistic.

### A5. Risk (0–100 each, higher = riskier)
```
water      ← water-stress score for the location
grid       ← grid wait / reserve margin indicator
crowding   ← count of existing + planned data centers in the region
opposition ← recent blocked or delayed projects, local restrictions
overall    = weighted average
```

### A6. Score and ranking
```
normalize cost, time, risk to 0–100 across the candidate set (lower raw = higher points)
score = w_cost × cost_pts + w_time × time_pts + w_risk × risk_pts
```
Weights come from `priority`: cost / speed / community. Options that can't meet `ready_by_year` are flagged, not hidden.

### A7. Break-evens (the ah-ha numbers)
```
Orbit vs Earth site:
  orbit_cost(L) = fixed_orbit + launch_mass_kg × L
  L* = (earth_total_cost − fixed_orbit) / launch_mass_kg        → "Orbit wins below $L* per kg"

Max land price for parcel A vs next-best alternative B:
  p* = (B_total_cost − A_total_cost_without_land) / acres       → "Buy up to $p* per acre"
```
Compare totals over the same lifetime.

### A8. Parcel verdict
```
Pass  if any check fails (too small, flood flag, homes inside minimum distance)
Buy   if no fails and asking_price ≤ p*
Maybe otherwise (warnings, or asking_price above p*)
```
Always return a one-sentence `reason` naming the deciding factor. Thresholds go in `ASSUMPTIONS.md`.

### Model workflow
1. Spreadsheet with one worked 100 MW example for an Earth region and for orbit.
2. A1–A4 as functions with hardcoded inputs; unit tests match the spreadsheet.
3. A5–A6 scoring; check that the ranking order makes sense by eye.
4. A7 break-evens; test by plugging L* back in and confirming costs are equal.
5. A8 verdict.
6. Hand off to Data + API: function signatures match contract sections 1–3.
7. Sanity checks: doubling MW doubles energy; raising launch cost never helps orbit; cheaper power never hurts a site.

**Model done when:** `/api/rank` and `/api/parcel` return your real numbers and the launch-cost slider flips the orbit ranking at L*.

---

## Part B — The agent (start only after Part A works end to end)

Purpose: research what isn't in clean data, then write the investigation report. **The agent never invents numbers; it calls Part A functions as tools.**

### Design
- Library: LangChain `deepagents` (planning, file system, subagents). Model: Gemini via a LangChain chat model.
- Main agent: plans the investigation, delegates, reads findings, writes the report in the contract's shape (section 5).
- Subagents, in build order:
  1. **community** — web search for local opposition, moratoria, zoning. Must return source links.
  2. **power** — calls model functions; looks up grid wait and price trend.
  3. **water** — water stress, local restrictions.
  4. **land** — CoStar and Vexcel lookups for the parcel.
- File system: one folder per site, one findings file per topic, plus the last report. On a repeat run, compare with the saved files and fill `changes_since_last`.

### Agent workflow
1. Wrap Part A functions as tools. Test each tool alone.
2. Main agent + community subagent only. Get one sourced finding for one Houston parcel.
3. Add the power subagent.
4. Output as JSON matching the contract. Validate before returning.
5. Save findings to files; implement "changes since last."
6. Add water and land subagents if time allows.
7. Pre-generate reports for every demo parcel and store them.

### Cut line
If there's no usable report with a few hours left: one Gemini call that takes the model's numbers and writes `summary` + `sections` in the same shape. The report view doesn't change.

### Guardrails
- Every non-model claim has a source URL, or it's dropped.
- The report labels anything estimated.
- Runs in the background; the UI polls. Never block the page on it.
