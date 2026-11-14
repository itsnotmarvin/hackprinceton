"""Phase 1 skeleton: every contract endpoint returns a mock file from /mocks.

Swap each handler to real data/model calls in Phase 2, one endpoint at a time.
Contract: 01-contract.md. Never change a response shape without telling the team.
"""
import json
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

MOCKS = Path(__file__).resolve().parent.parent / "mocks"

app = FastAPI(title="Data center site API (mock phase)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def load(name: str):
    path = MOCKS / name
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"No such item ({name})")
    return json.loads(path.read_text(encoding="utf-8"))


# ---- 1. Search -> ranking -------------------------------------------------
class Assumptions(BaseModel):
    launch_cost_per_kg: float | None = None
    power_price_multiplier: float | None = None
    cooling: Literal["water", "dry"] | None = None


class RankRequest(BaseModel):
    capacity_mw: float
    ready_by_year: int
    priority: Literal["cost", "speed", "community"]
    assumptions: Assumptions | None = None


@app.post("/api/rank")
def rank(req: RankRequest):
    # TODO Phase 2: call the model's ranking function with req.
    return load("rank.json")


# ---- 2. Region detail -----------------------------------------------------
@app.get("/api/region/{region_id}")
def region(region_id: str, capacity_mw: float = 100):
    # TODO Phase 2: model breakdown for capacity_mw + assumptions query params.
    return load(f"region-{region_id}.json")


# ---- 3. Parcel verdict ----------------------------------------------------
@app.get("/api/parcel/{parcel_id}")
def parcel(parcel_id: str, capacity_mw: float = 100):
    # TODO Phase 2: stored parcel data + model verdict function.
    return load(f"parcel-{parcel_id}.json")


# ---- 4. Watchlist (one shared demo list, in memory for now) ---------------
_watchlist = load("watchlist.json")


class WatchRequest(BaseModel):
    kind: Literal["region", "parcel"]
    id: str


@app.get("/api/watchlist")
def get_watchlist():
    return _watchlist


@app.post("/api/watchlist")
def add_watch(req: WatchRequest):
    if not any(i["id"] == req.id for i in _watchlist["items"]):
        _watchlist["items"].append(
            {
                "kind": req.kind,
                "id": req.id,
                "name": req.id,
                "current": {"verdict": "maybe", "score": 0},
                "changes": [],
            }
        )
    return _watchlist


@app.delete("/api/watchlist/{item_id}")
def remove_watch(item_id: str):
    _watchlist["items"] = [i for i in _watchlist["items"] if i["id"] != item_id]
    return _watchlist


# ---- 5. Investigation report ----------------------------------------------
class InvestigateRequest(BaseModel):
    kind: Literal["region", "parcel"]
    id: str


@app.post("/api/investigate")
def investigate(req: InvestigateRequest):
    # TODO Phase 3: start the agent in the background.
    return {"report_id": "demo-hou-001", "status": "running"}


@app.get("/api/report/{report_id}")
def report(report_id: str):
    # TODO Phase 3: look up stored report / agent status.
    return load("report.json")
