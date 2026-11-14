# 03 · Frontend 2 — detail, parcel, watchlist, report

**You own:** everything the judge sees in demo steps 5–7, plus the report view.
**You consume:** contract sections 2, 3, 4, 5.
**You never wait on:** the backend or the agent. Build on `mocks/region.json`, `mocks/parcel.json`, `mocks/watchlist.json`, `mocks/report.json`.

## Screens

### Region detail page
- Header: name, score, heart button.
- Breakdown: build cost, yearly operating cost, power, cooling, water. Show water as a household equivalent next to the raw number.
- Risk notes as plain sentences (crowding, labor, water, grid).
- If `has_parcels` (Houston, LA): parcel listings with Buy / Maybe / Pass badges.
- If not: a line saying "Site-level analysis available in Houston and Los Angeles."

### Parcel page
- Aerial image (`image_url`, from Vexcel).
- Address, acres, asking price.
- Verdict badge, large: **Buy / Maybe / Pass**.
- `reason` sentence directly under it, including "Buy up to $X per acre."
- Checks list with pass / warn / fail icons and one sentence each.
- Sources line.
- Heart button, "Investigate this site" button.
- Matterport embed if `matterport_model_id` is set (add-on, later).

### Watchlist
- Saved regions and parcels with current verdict or score.
- "What changed" items at the top, with a better/worse indicator.

### Report view
- Summary at the top.
- One block per section: topic, finding, risk level, source links.
- "Changes since last report."
- States: running (spinner + "researching power, water, land, community"), done, failed.

## Workflow

**Phase 1 — Skeleton**
1. Routes: `/region/:id`, `/parcel/:id`, `/watchlist`, `/report/:id`.
2. Parcel page from `mocks/parcel.json`. Start here; it's the most important screen you own.
3. Region detail from `mocks/region.json`.

**Phase 2 — Real numbers**
4. Swap mocks for live endpoints, parcel page first.
5. Vexcel image showing on the parcel page.
6. Heart button and watchlist with one "what changed" item.

**Phase 3 — Agent**
7. Report view from `mocks/report.json`.
8. "Investigate" button: call `POST /api/investigate`, poll `GET /api/report/:id` until done.
9. Matterport embed on one building, if a usable space exists.

**Phase 4 — Freeze**
10. Walk demo steps 5–7 on the deployed site.

## Done when
- [ ] Houston parcel shows image, "Buy up to $X," reason, checks
- [ ] LA parcel shows "Pass" with its reason
- [ ] Heart saves; watchlist shows a change item
- [ ] Report view renders the mock, then a real report

## Matterport note (add-on)
Use the Embed SDK: it loads from a script tag and is meant for embedding with basic controls. Skip the Bundle SDK.

## Coordinate with
- **Frontend 1:** shared components and routes.
- **Model + Agent:** report shape; flag anything the view needs that isn't in it.
- **Data + API:** which demo parcels exist and their IDs.

## Don't build
Parcel search across the whole city, parcel comparison, map drawing tools.
