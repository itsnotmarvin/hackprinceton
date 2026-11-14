# 02 · Frontend 1 — search, ranking, sliders

**You own:** the first screen and everything the judge sees in demo steps 2–4.
**You consume:** `POST /api/rank` (contract section 1).
**You never wait on:** the backend. Build on `mocks/rank.json` until live endpoints exist.

## Screens

### Search bar (Airbnb-style)
Three fields with presets, plain language:

| Field | Presets | Sends |
|-------|---------|-------|
| How big? | Small / Medium / Large / Huge (show MW underneath) | `capacity_mw` |
| Ready by? | Year picker | `ready_by_year` |
| What matters most? | Lowest cost / Fastest / Lowest community impact | `priority` |

"Advanced" toggle reveals: exact MW, cooling type, power price.
The page loads with the demo search already filled in.

### Results: cards left, map right
Each card shows: name, score, cost per MW-year, time to power, one-line `reason`, `badges`, heart button.
- "Low Earth Orbit" is a normal card, visually distinct (different icon or colour).
- Clicking a card or its map pin opens the region detail page (Frontend 2's route).
- Cards re-order with a visible animation when the ranking changes. This matters for the demo.

### Sliders
- Launch cost per kg — **must work live** (demo step 4).
- Power price, cooling efficiency — if time allows.
- Moving a slider re-calls `/api/rank` (debounce ~200 ms) and re-orders the cards.

### Break-even line
Shown above the results from `break_even.text`. Updates with the sliders.

## Workflow

**Phase 1 — Skeleton**
1. Page layout: search on top, cards left, map right.
2. Render cards from `mocks/rank.json`.
3. Map with pins from the same file.
4. Card click navigates to the detail route.

**Phase 2 — Real numbers**
5. Swap the mock for the live `POST /api/rank`.
6. Wire the search form to the request.
7. Launch-cost slider with live re-rank and card animation.
8. Break-even line.

**Phase 3 — while the agent is being built**
9. Polish the demo path only: loading states, empty states, the orbit card.
10. Write the Devpost description and the "next steps" slide.

**Phase 4 — Freeze**
11. Test the full demo path on the deployed site, on the laptop you'll present from.

## Done when
- [ ] Pre-filled search returns ranked cards and pins
- [ ] Orbit card is in the list
- [ ] Launch-cost slider visibly moves the orbit card
- [ ] Break-even line updates
- [ ] Clicking Houston opens the detail page

## Coordinate with
- **Frontend 2:** shared layout, colours, card and badge components, routes. Agree in the first 15 minutes.
- **Data + API:** tell them immediately if a field in the contract is missing or awkward.

## Don't build
Login, a filters sidebar, mobile layout, dark mode.
