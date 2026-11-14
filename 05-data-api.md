# 05 · Data + API

**You own:** every data source, the database, and the endpoints.
**You produce:** the live versions of contract sections 1–5.
**You unblock:** everyone. Your first job is serving the mock files from real endpoints so the frontend can switch over early.

## Sources

| Data | Source | Used for | Coverage |
|------|--------|----------|----------|
| Existing data centers: power, cost, location | Epoch AI Frontier Data Centers (CSV, CC-BY, cite it) | cost per MW, crowding | Largest US facilities |
| Electricity prices | EIA API | operating cost, live feed, "what changed" | US states |
| Water stress | WRI Aqueduct | water risk | Global |
| Grid carbon | EPA eGRID | optional carbon line | US regions |
| Skilled labor | BLS occupational data by metro | labor factor | US metros |
| Blocked / delayed projects | Data Center Watch and similar trackers | opposition risk, Peri example | US |
| Land and building data | CoStar (hackathon access) | price, size, vacancy | Houston, LA |
| Aerial imagery | Vexcel Bluesky | parcel image | Houston, LA |
| Parcels, footprints, 40+ attributes | Vexcel Elements | size, neighbors | Houston, LA |
| Elevation | Vexcel Elevation (DSM/DTM) | flood / terrain flag | Houston, LA |
| Building interiors | Matterport (hackathon library) | retrofit embed | Check library |

Confirm field availability for CoStar, Vexcel, and Matterport from the real responses; don't assume.

## Workflow

**Phase 1 — Skeleton**
1. Generate every API key (CoStar, Vexcel, Matterport, EIA, Gemini). Keys go in `.env`, never in the repo.
2. Call each source once and save the raw response in `/samples`. This is the team's reference for what data really exists.
3. Stand up the API with all contract endpoints returning the mock files.
4. Tell the frontend the base URL. They can now switch from files to endpoints.

**Phase 2 — Real numbers**
5. Region table: 6–8 regions with power price, water stress, grid wait, crowding count, labor. Small enough to assemble by hand from the sources; record each value's source.
6. Connect the model's functions to `/api/rank` and `/api/region`.
7. Parcels: pick 2–3 each in Houston and LA with the team. Pull CoStar price and size, Vexcel image, Elements attributes, elevation. Store them; don't call sponsor APIs live during the demo.
8. Connect `/api/parcel` to the model's verdict function.
9. Database (Tiger Data): tables for regions, parcels, a time series of electricity prices, and a time series of scores/verdicts.
10. Watchlist endpoints. "What changed" = compare the latest stored score/verdict with the previous one.
11. One live feed: EIA electricity prices written to the time series.

**Phase 3 — Agent support**
12. Lookup tools for the agent: region data, parcel data, a web search tool for the community subagent.
13. `/api/investigate` starts the agent in the background; `/api/report/:id` returns status and result.
14. Store finished reports; serve pre-generated ones for demo parcels.

**Phase 4 — Freeze**
15. Deploy the backend on Vultr; point the GoDaddy domain at the site.
16. Check every demo step against the deployed URL.
17. README: setup steps, data sources with citations, what is measured vs estimated.

## Parcel checks (you supply inputs, the model decides)
| Check | Input | From |
|-------|-------|------|
| size | parcel acres | CoStar / Vexcel Elements |
| neighbors | distance to nearest residential building | Vexcel Elements footprints + property type |
| flood | parcel elevation vs surroundings | Vexcel Elevation |
| power | distance to nearest substation / line | OpenStreetMap |
| price | asking price per acre | CoStar |

## Done when
- [ ] All five endpoint groups return real data in the contract's shape
- [ ] Demo parcels are stored locally with images
- [ ] One time series updates from EIA
- [ ] Watchlist returns a real change item
- [ ] Site is reachable at the public domain

## Rules
- Cache everything the demo needs. Venue Wi-Fi and rate limits will fail at the worst time.
- A source that isn't working after ~30 minutes gets a labeled hardcoded sample.
- Never change a contract field without telling the team.
- Respect each sponsor's data terms; don't commit their raw data to the public repo if their terms say not to.
