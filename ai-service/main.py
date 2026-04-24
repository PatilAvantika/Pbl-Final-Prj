"""
Minimal FastAPI microservice for NGO Field Ops AI layer.
Safe defaults: same heuristic as Nest rule layer when sklearn unavailable.
Run: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="NGO Field AI Service", version="0.1.0")


class ReliabilityIn(BaseModel):
    attendance_rate: float = 0.5
    task_completion_rate: float = 0.5
    report_approval_rate: float = 0.5
    absences_last_7_days: int = 0


class ReliabilityOut(BaseModel):
    ai_score: float
    category: str  # low | medium | high


@app.post("/predict/reliability", response_model=ReliabilityOut)
def predict_reliability(body: ReliabilityIn):
    # Weighted blend (mirrors Nest rule layer) with small penalty for absences.
    base = (
        0.5 * body.attendance_rate
        + 0.3 * body.task_completion_rate
        + 0.2 * body.report_approval_rate
    )
    penalty = min(0.25, body.absences_last_7_days * 0.06)
    score = max(0.0, min(1.0, base - penalty))
    if score > 0.75:
        cat = "high"
    elif score >= 0.5:
        cat = "medium"
    else:
        cat = "low"
    return ReliabilityOut(ai_score=round(score, 4), category=cat)


class Candidate(BaseModel):
    worker_id: str
    worker_name: Optional[str] = None
    score: float = 0.0
    reliability_score: float = 0.0
    distance_score: float = 0.0
    workload_score: float = 0.0


class TaskIn(BaseModel):
    task_id: str
    candidates: List[Candidate] = []


class RankedItem(BaseModel):
    worker_id: str
    score: float


class TaskOut(BaseModel):
    ranked: List[RankedItem]


@app.post("/predict/task", response_model=TaskOut)
def predict_task(body: TaskIn):
    """Re-rank candidates with a tiny jitter so AI path is observable vs pure sort."""
    if not body.candidates:
        return TaskOut(ranked=[])
    ranked = sorted(
        body.candidates,
        key=lambda c: c.score + 0.001 * (hash(c.worker_id) % 7) / 100.0,
        reverse=True,
    )[:3]
    return TaskOut(
        ranked=[RankedItem(worker_id=c.worker_id, score=round(c.score, 4)) for c in ranked]
    )


@app.get("/health")
def health():
    return {"ok": True}
