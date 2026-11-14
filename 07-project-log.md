# 07 · Project log (Data + API lane)

What we've done, in order, and **why**. Read this if you're wondering where a number came from or why something is shaped the way it is.

Newest entries at the bottom. Add to it as you go.

---

## Quick glossary

| Word | Means here |
|---|---|
| **Region** | A metro area we compare as a whole (Houston, Dallas, N. Virginia…). Answers "**which city** should I build in?" Orbit is also a region. |
| **Parcel** | One specific piece of property you could buy in a region: an address, a lot, a building. Answers "**which property**, and **how much** should I pay?" |
| **Verdict** | The model's answer for a parcel: `buy` / `maybe` / `pass`, plus "buy up to $X per acre." |
| **Mock** | Fake-but-correctly-shaped JSON so the frontend can build before real data exists. |
| **Contract** | The agreed JSON shapes. `01-contract.md` = what the frontend gets. `06-data-model-contract.md` = what the data lane hands the model. |

---

## Why parcels exist at all (read this one)

The pitch has two questions, at two zoom levels:

1. **Zoomed out:** *Where* should a data center go? → **regions**, ranked by cost, speed, community impact. Any consulting deck can do this.
2. **Zoomed in:** *Which property* do I buy, and *what's the most I should pay*? → **parcels**. This is what makes us more than a ranking table, and it's the moment in the demo (step 6, 1:20–1:40) where the judge sees a real building, a real asking price, and a clear **"Buy up to $X"** or **"Pass."**

That verdict is the actual product. A developer doesn't buy "Houston"; they buy 6855 Wynnwood Ln. The region tells you where to look; the parcel tells you what to sign.

It's also where three sponsors meet on one screen: **CoStar** (price, size, sale history), **Vexcel** (aerial image, neighbors, elevation), **Matterport** (3D walkthrough of the building). Those sponsor prizes depend on that page.

### How a parcel gets a verdict
```
parcel facts (size, asking price, neighbors, flood, power)
  + its region's costs (electricity, construction)
  → model computes what the site is worth to a data-center developer
  → compare to asking price
  → "Buy up to $X/acre"  or  "Pass: asking is above what it's worth"
```

---

## Log

### 2026-11-13 · Read the repo and set rules
- Repo was planning docs only (`00`–`05`). No code.
- **Why it matters:** `00-overview.md` says the 2-minute demo table *is* the scope. Everything below serves a row in that table.

### 2026-11-13 · Mock API so the frontend isn't blocked (plan step 3)
- `mocks/*.json`: one fake response per endpoint, exact shapes from `01-contract.md`.
- `api/main.py`: FastAPI server that returns those mocks at the real URLs.
- **Why:** the frontend can build every screen now and switch to real data later by changing nothing but the base URL. Data lane's first job per `05-data-api.md` is to unblock everyone.
- Run: `.venv\Scripts\python -m uvicorn main:app --reload --app-dir api` → `http://localhost:8000`.

### 2026-11-13 · Data → model contract (`06-data-model-contract.md`)
- Every value is stored with its **unit, scope, source, and status** (`observed` / `source_derived` / `assumption` / `unknown`).
- **Why:**
  - **Units:** $0.10/kWh = $100/MWh. Mixing them is a 1000× error that nobody notices until the demo.
  - **Scope:** a Texas *state average* power price is not *this site's* power contract. The UI should be honest about which it is.
  - **Missing stays missing:** an unknown grid wait must show as "Unknown," never as 0 years. 0 would make a site look perfect for no reason.

### 2026-11-13 · Keys and secrets
- Keys live in `.env` (gitignored). `.env.example` is the blank template that *is* committed.
- **Why:** the repo is public. A key in a committed file is a leaked key.
- CoStar has no key; it's a data download (`costar-hackathon-kit/`, 404 MB).

### 2026-11-13 · CoStar data stays out of the repo
- `costar-hackathon-kit/`, `data/private/`, and `samples/` are gitignored.
- **Why:** CoStar's data is licensed only for this hackathon. Committing it to a public repo would break that. Anything derived from it (shortlist, parcel records) lives in `data/private/` or the database, never in git. Ask in Discord (`/ask-costar`) before changing that.

### 2026-11-13 · What the CoStar kit actually covers
- **Houston and Los Angeles only.** Matches the demo plan.
- 3,339 properties, but **2,765 are apartment buildings**. Only **5 are land**, ~122 industrial, ~31 flex.
- Every property has a photo and a Matterport 3D scan.
- **Why it matters:** the original plan said "buy land for a 100 MW campus." There's almost no land in the data. What there *is* is industrial buildings for sale. So the realistic demo is **"buy this industrial building and convert it,"** which also fits Matterport (you can walk through the building). **Team needs to confirm this.**

### 2026-11-13 · Region table (plan step 5) → `data/regions.json`
8 Earth regions + orbit. Built by `api/seed/build_regions.py` from public sources only (safe to commit).

| Value | Source | Notes |
|---|---|---|
| Electricity price | EIA Table 5.6.A, industrial, Aug 2026 (preliminary) | State average. LA is 24¢/kWh, Houston 7¢. That gap alone drives a lot of the ranking. |
| Construction cost | Turner & Townsend 2026–27 index, $/W of IT | **Houston and LA aren't in the index.** Houston uses Dallas, LA uses Silicon Valley, both labeled `source_derived`. Excludes land, utility work, IT gear, fees. |
| PUE / WUE (water cooling) | Team assumption: 1.20 / 0.20 L per IT kWh | Labeled `assumption`. Dry cooling values still TBD by model lane. |
| Grid wait, water stress, crowding, labor | — | `unknown` for now. Berkeley Lab queue data covers *generators*, not *loads*, so it can't be used for grid wait. |

**Why these regions:** Houston + LA have parcels (CoStar). The other six are the big real-world data-center markets that have both an EIA price and a T&T cost, so the ranking compares against places a real developer would consider.

### 2026-11-13 · Database (plan step 9) → Tiger Data
- Postgres + TimescaleDB. Schema in `api/db/schema.sql`.
- Tables: `regions`, `parcels`, `watchlist`, `reports`, plus two **time series**: `electricity_prices` and `score_history`.
- **Why Tiger Data:** sponsor prize, and the watchlist's "what changed" is literally "compare the latest score to the previous one," which is a time-series question.
- Loaded: 9 regions, 14 electricity price rows (Aug 2025 + Aug 2026 per state).
- Reload: `python api/seed/build_regions.py` then `python api/seed/load_db.py`.

### 2026-11-13 · Parcel shortlist (plan step 7)
- `api/seed/costar_shortlist.py` pulls every industrial / flex / land site in Houston + LA, with size, asking price (if for sale), last sale, photo, and Matterport scans → `data/private/parcel_shortlist.csv` (158 sites, 14 for sale).

### 2026-11-13 · Picked 5 demo parcels → `parcels` table
Loaded by `api/seed/load_parcels.py`. Prices are in the database / `data/private/`, not here (CoStar license).

| Our id | Address | Role | Why this one |
|---|---|---|---|
| `hou-001` | 6855 Wynnwood Ln, Houston | **Demo "Buy"** | For sale with a listed price, ~2.8 acres, photo + 3D scan. Cheap Texas power makes the math work. |
| `hou-002` | 5025 Jensen Dr, Houston | Backup | For sale, priced, cheaper and smaller. Swap in if `hou-001` doesn't come out as "buy." |
| `hou-003` | 15550 Milner Rd, Houston | Scale showcase | 50 acres, 1.2M sqft: the only site in the data that's actually data-center sized. Not for sale, so no asking price → verdict will be "maybe / contact owner." |
| `la-001` | 1601 Perrino Pl, Los Angeles | **Demo "Pass"** | Asking price is far above what it sold for a month ago, *and* LA power is 3× Houston's. Easy-to-explain "Pass." |
| `la-002` | 5801 S Alameda St, Los Angeles | Backup | For sale, priced, asking above its last sale. |

**Picking rules we used:** has an asking price (needed for "buy up to $X"), has acreage, has a photo and a 3D scan, ideally has a past sale price to back the verdict up. Then chose one clear "Buy" story in Houston and one clear "Pass" story in LA, since that's what demo step 6 shows.

**Known problem:** these buildings are 1–3 acres, which fits a few MW, not 100 MW. Options: run the parcel page at a smaller size, or pitch them as "retrofit / edge" sites and use `hou-003` for the big-campus story. **Model lane + pitch person decide.**

---

## Open questions for the team
1. Confirm the demo becomes "buy an industrial building" rather than "buy land."
2. What size (MW) do the parcel verdicts run at? (See known problem above.)
3. Dry-cooling PUE/WUE values and sources (model lane).
4. Is it OK to show CoStar prices on the public deployed site? Ask `/ask-costar`.
5. Deadline: rules say **8:00 AM ET Sunday Nov 15** in one place. Plan around that.

## Still to do (data lane)
- Vexcel: pull image, neighbors, elevation for the 5 parcels → fills the `check_inputs` that are `unknown` right now.
- Watchlist endpoints backed by the database (plan step 10).
- Switch `/api/region` and `/api/parcel` from mocks to the database once the model functions exist (steps 6, 8).
- EIA live feed (step 11, needs EIA key).
