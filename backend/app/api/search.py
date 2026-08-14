from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from backend.app.database.session import get_db
from backend.app.models.policy import Policyholder, Policy, InsuredMember
from backend.app.models.claim import Claim

router = APIRouter(prefix="/search", tags=["Global Search Engine"])

@router.get("")
def global_search(
    q: Optional[str] = Query("", min_length=1),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    if not q or len(q.strip()) < 1:
        return {"query": q, "total_results": 0, "results": {"claims": [], "policyholders": [], "policies": [], "members": []}}

    clean_q = q.strip()
    search_term = f"%{clean_q}%"
    is_ph_id_search = clean_q.upper().startswith("POL")

    # 1. Search Policyholders (Always clean with ID & Name only, no external details)
    phs = db.query(Policyholder).filter(
        (Policyholder.policyholder_id.ilike(search_term)) |
        (Policyholder.full_name.ilike(search_term))
    ).limit(limit).all()

    phs_data = [{
        "id": p.policyholder_id,
        "title": f"{p.policyholder_id} - {p.full_name}",
        "subtitle": "Policyholder Profile",
        "status": p.kyc_status,
        "target_tab": "policyholder",
        "record_id": p.policyholder_id
    } for p in phs]

    # If user searched specifically for a Policyholder ID / Policyholder, return ONLY that policyholder profile without external details
    if is_ph_id_search or (len(phs_data) > 0 and clean_q.upper() in [p.policyholder_id.upper() for p in phs]):
        return {
            "query": q,
            "total_results": len(phs_data),
            "results": {
                "claims": [],
                "policyholders": phs_data,
                "policies": [],
                "members": []
            }
        }

    # 2. Search Claims
    claims = db.query(Claim).filter(
        (Claim.claim_id.ilike(search_term)) |
        (Claim.patient_name.ilike(search_term)) |
        (Claim.policy_number.ilike(search_term)) |
        (Claim.disease_diagnosis.ilike(search_term)) |
        (Claim.treatment_procedure.ilike(search_term))
    ).limit(limit).all()

    claims_data = [{
        "id": c.claim_id,
        "title": f"{c.claim_id} - {c.patient_name}",
        "subtitle": f"{c.disease_diagnosis} • ₹{c.claim_amount:,.0f}",
        "status": c.status,
        "risk_level": c.risk_level,
        "confidence": c.confidence_score,
        "target_tab": "claim-analysis",
        "record_id": c.claim_id
    } for c in claims]

    # 3. Search Policies
    pols = db.query(Policy).filter(
        (Policy.policy_number.ilike(search_term)) |
        (Policy.policy_type.ilike(search_term)) |
        (Policy.covered_treatments.ilike(search_term))
    ).limit(limit).all()

    pols_data = [{
        "id": pol.policy_number,
        "title": f"{pol.policy_number} ({pol.policy_type})",
        "subtitle": f"Sum Insured: ₹{pol.sum_insured:,.0f}",
        "status": pol.status,
        "target_tab": "policy-coverage",
        "record_id": pol.policy_number
    } for pol in pols]

    # 4. Search Members
    mems = db.query(InsuredMember).filter(
        (InsuredMember.member_id.ilike(search_term)) |
        (InsuredMember.name.ilike(search_term))
    ).limit(limit).all()

    mems_data = [{
        "id": m.member_id,
        "title": f"{m.name} ({m.relationship})",
        "subtitle": f"Age: {m.age} yrs",
        "status": m.eligibility_status,
        "target_tab": "members",
        "record_id": m.policyholder_id
    } for m in mems]

    total = len(claims_data) + len(phs_data) + len(pols_data) + len(mems_data)

    return {
        "query": q,
        "total_results": total,
        "results": {
            "claims": claims_data,
            "policyholders": phs_data,
            "policies": pols_data,
            "members": mems_data
        }
    }
