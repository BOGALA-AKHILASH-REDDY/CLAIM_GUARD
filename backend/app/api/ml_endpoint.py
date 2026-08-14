from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.app.ml.claim_predictor import predictor

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

class PredictRiskRequest(BaseModel):
    policy_status: str = "Active"
    eligibility: str = "Eligible"
    treatment_coverage: str = "covered"
    pre_auth: str = "Approved"
    claim_amount: float = 150000.0
    total_coverage: float = 1000000.0
    has_bill: bool = True
    doc_verified: bool = True
    is_accurate: bool = True
    is_duplicate: bool = False

@router.post("/predict-risk")
def predict_claim_risk(req: PredictRiskRequest):
    res = predictor.predict_risk(req.dict())
    return res
