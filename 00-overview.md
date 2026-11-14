# 00 · Overview and scope

## One-line pitch
We tell companies where to build AI data centers, which land to buy and for how much, and when space becomes the better option.

## Main track
Business & Enterprise. Also targeting: CoStar, Peri, LangChain, Gemini API, Tiger Data, Vultr, GoDaddy.

## Main user
A data center developer or investor choosing a site. The interface is beginner-friendly, but the pitch stays on this user.

## Demo (2 minutes) — this table IS the scope

| # | Time | What the judge sees | What has to work |
|---|------|---------------------|------------------|
| 1 | 0:00–0:15 | Pitch and problem | Spoken |
| 2 | 0:15–0:30 | Pre-filled search: "Large, ready by 2029, lowest cost" | Search form, 3 fields, presets |
| 3 | 0:30–0:50 | Region cards + map, "Low Earth Orbit" as a card | Ranking from the real model |
| 4 | 0:50–1:05 | Drag launch-cost slider, orbit card climbs, break-even line | Live re-rank + break-even |
| 5 | 1:05–1:20 | Click Houston: cost, power, cooling, water breakdown | Region detail page |
| 6 | 1:20–1:40 | Houston parcel "Buy up to $X/acre"; LA parcel "Pass" | Parcel page: Vexcel image, CoStar price, verdict + reason |
| 7 | 1:40–1:50 | Heart → watchlist → "what changed" | Save + one change item |
| 8 | 1:50–2:00 | Who it's for, what's next | Spoken |

**Rule: if it isn't in this table, nobody builds it until every row works end to end.**

## Add only after the table works (in this order)
1. Investigation report (deep agent; fallback is one Gemini call)
2. Matterport 3D embed on one building
3. Replay of one real canceled project
4. Vultr hosting + GoDaddy domain

## Out of scope (goes on the "next steps" slide)
- Searching any parcel anywhere
- Text search over imagery (Vexcel embeddings)
- Rack-capacity estimate from Matterport scans
- Email alerts, user accounts
- Regions beyond the 6–8 chosen

## Lanes

| Lane | Owner | File |
|------|-------|------|
| Frontend 1: search, ranking, sliders | ______ | 02-frontend-1.md |
| Frontend 2: detail, parcel, watchlist, report | ______ | 03-frontend-2.md |
| Model + Agent | ______ | 04-model-agent.md |
| Data + API | ______ | 05-data-api.md |

Shared contract everyone builds against: **01-contract.md**

## Phases

1. **Skeleton** — every screen linked end to end on mock data; endpoints return mock files.
2. **Real numbers** — model functions and real data replace mocks, one screen at a time.
3. **Agent** — starts only when ranking and parcel verdict work end to end.
4. **Freeze** — no new features. Pre-generate demo reports, deploy, fix bugs, rehearse, submit.

## Check-ins (every few hours, 10 minutes)
Each person, 2 minutes:
- What I built and how it works
- What I'm doing next
- What I'm blocked on

## Working rules
- Use AI for one function or one component at a time. Read it and be able to explain it before merging.
- Every chosen number goes in `ASSUMPTIONS.md` with its source and a "measured" or "estimated" label.
- A data source that isn't working after ~30 minutes gets a small hardcoded sample, labeled, and you move on.
- Commit small and often. One folder per lane to avoid merge conflicts.

## Submission checklist
- [ ] Public GitHub repo, created during the event
- [ ] Devpost description (problem, what it does, how we built it, what's next)
- [ ] Discord usernames on the submission
- [ ] Sponsor prizes opted into
- [ ] Confirm the exact deadline in the official rules; aim to submit an hour early
- [ ] 2-minute pitch rehearsed at least twice
