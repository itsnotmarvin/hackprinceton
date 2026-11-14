# Frontend

React 18 + Vite + TypeScript + React Router. One app shared by both frontend lanes.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Runs on `/mocks/*.json` (repo root) until `VITE_API_BASE` is set in `frontend/.env` (see `.env.example`).
A "Mock data" pill in the header shows when you're on mocks.

## Who owns what

| Path | Owner | Rule |
|------|-------|------|
| `src/features/search/` | Frontend 1 | Edit freely. `SearchPage.tsx` is a placeholder to replace. |
| `src/features/detail/` | Frontend 2 | Edit freely. Region, parcel, watchlist, report. |
| `src/shared/` | Both | **Shared.** Tell the other lane before changing. |
| `src/App.tsx` | Both | Route table. Tell the other lane before changing. |
| `/mocks` | Data + API (both frontends read) | Shapes follow `01-contract.md`. |

## How screens hand off

The current search travels in the URL. Frontend 1 links to a region like this:

```ts
import { toQuery } from '../../shared/search'
navigate(`/region/${option.id}?${toQuery(currentSearch)}`)
```

Frontend 2 reads it back with `fromQuery(location.search)` and passes it to the API.

## Routes

| Route | Lane |
|-------|------|
| `/` | Frontend 1 |
| `/region/:id` | Frontend 2 |
| `/parcel/:id` | Frontend 2 |
| `/watchlist` | Frontend 2 |
| `/report/:id` | Frontend 2 |

## Mock files

`api.ts` looks for `mocks/<name>-<id>.json` first, then `mocks/<name>.json`.
For example, `/parcel/la-001` loads `mocks/parcel-la-001.json`, and `/parcel/hou-001` falls back to `mocks/parcel.json`.

## Team rules
- Pull `main` before starting each task.
- Small commits, pushed often.
- Use the components in `src/shared/components` (`VerdictBadge`, `HeartButton`, `Layout`) instead of copying them.
