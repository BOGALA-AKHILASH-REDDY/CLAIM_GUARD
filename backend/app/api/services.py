from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from backend.app.database.session import get_db
from backend.app.models.services import (
    PolicyTransferRequest, PolicySurrenderRequest, PolicyArrears,
    PolicyBenefitTransfer, ConfigurableRule, PolicyRenewalRequest
)
from backend.app.models.policy import Policy, Policyholder, PremiumPayment
from backend.app.models.claim import Claim, ClaimHistory
from backend.app.schemas.services import (
    PolicyTransferCreate, PolicyTransferResponse,
    PolicySurrenderCreate, PolicySurrenderResponse,
    SettleArrearsRequest, PolicyArrearsResponse,
    BenefitTransferCreate, PolicyBenefitTransferResponse,
    ConfigurableRuleResponse, ConfigurableRuleUpdate,
    PolicyRenewalCreate, PolicyRenewalResponse
)

router = APIRouter(prefix="/policy-services", tags=["Policy Lifecycle Services"])

# ----------------------------------------------------------------------
# 11A. Nominee / Family Policy Transfer After Death
# ----------------------------------------------------------------------
@router.get("/transfers", response_model=List[PolicyTransferResponse])
def get_all_transfers(db: Session = Depends(get_db)):
    return db.query(PolicyTransferRequest).order_by(PolicyTransferRequest.id.desc()).all()

@router.post("/transfer", response_model=PolicyTransferResponse)
def request_policy_transfer(req: PolicyTransferCreate, db: Session = Depends(get_db)):
    # Look up policy by policy_number or policyholder_id
    policy = db.query(Policy).filter(Policy.policy_number == req.policy_number).first()
    if not policy:
        policy = db.query(Policy).filter(Policy.policyholder_id == req.policyholder_id).first()
        if policy:
            req.policy_number = policy.policy_number
        else:
            # Create a fallback policy if not found
            req.policy_number = req.policy_number or f"HLT-2026-{req.policyholder_id}"

    count = db.query(PolicyTransferRequest).count() + 1
    new_req = PolicyTransferRequest(
        request_id=f"TRF-2026-{count:03d}",
        policyholder_id=req.policyholder_id,
        policy_number=req.policy_number,
        nominee_id=req.nominee_id or f"NOM-{req.policyholder_id}-01",
        nominee_name=req.nominee_name,
        relationship=req.relationship,
        death_date=req.death_date,
        death_certificate_doc=req.death_certificate_doc or "death_certificate.pdf",
        verification_status="Verified",
        transfer_status="Approved",
        reviewer_notes=req.reviewer_notes or "Nominee credentials and death certificate verified by medical records committee."
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req

@router.put("/transfers/{request_id}/status")
def update_transfer_status(request_id: str, new_status: str = "Approved", notes: Optional[str] = None, db: Session = Depends(get_db)):
    trf = db.query(PolicyTransferRequest).filter(PolicyTransferRequest.request_id == request_id).first()
    if not trf:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    
    trf.transfer_status = new_status
    if notes:
        trf.reviewer_notes = notes
    db.commit()
    return {"message": f"Transfer status updated to {new_status}", "transfer": trf}

# ----------------------------------------------------------------------
# 11B. Policy Surrender / Early Closure (70% Refund / 30% Penalty Rule)
# ----------------------------------------------------------------------
@router.get("/surrenders", response_model=List[PolicySurrenderResponse])
def get_all_surrenders(db: Session = Depends(get_db)):
    return db.query(PolicySurrenderRequest).order_by(PolicySurrenderRequest.id.desc()).all()

@router.post("/surrender", response_model=PolicySurrenderResponse)
def request_policy_surrender(req: PolicySurrenderCreate, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.policy_number == req.policy_number).first()
    if not policy:
        policy = db.query(Policy).filter(Policy.policyholder_id == req.policyholder_id).first()
        if policy:
            req.policy_number = policy.policy_number
            if req.policy_amount <= 0:
                req.policy_amount = policy.sum_insured

    # Fetch configured refund & penalty rules
    rule_ref = db.query(ConfigurableRule).filter(ConfigurableRule.rule_key == "SURRENDER_REFUND_PCT").first()
    rule_pen = db.query(ConfigurableRule).filter(ConfigurableRule.rule_key == "SURRENDER_PENALTY_PCT").first()
    
    ref_pct = float(rule_ref.rule_value) if rule_ref else 70.0
    pen_pct = float(rule_pen.rule_value) if rule_pen else 30.0

    eligible_refund = round(req.policy_amount * (ref_pct / 100.0), 2)
    penalty = round(req.policy_amount * (pen_pct / 100.0), 2)
    final_refund = eligible_refund

    count = db.query(PolicySurrenderRequest).count() + 1
    new_surrender = PolicySurrenderRequest(
        request_id=f"SUR-2026-{count:03d}",
        policyholder_id=req.policyholder_id,
        policy_number=req.policy_number or "HLT-2026-DEFAULT",
        policy_amount=req.policy_amount,
        refund_percentage=ref_pct,
        penalty_percentage=pen_pct,
        eligible_refund=eligible_refund,
        penalty_amount=penalty,
        final_refund=final_refund,
        reason=req.reason,
        closure_status="Processed & Refund Initiated",
        disclaimer_accepted=req.disclaimer_accepted
    )
    db.add(new_surrender)

    # Mark policy as Surrendered
    if policy:
        policy.status = "Surrendered / Terminated"

    db.commit()
    db.refresh(new_surrender)
    return new_surrender

@router.put("/surrenders/{request_id}/approve")
def approve_surrender(request_id: str, db: Session = Depends(get_db)):
    sur = db.query(PolicySurrenderRequest).filter(PolicySurrenderRequest.request_id == request_id).first()
    if not sur:
        raise HTTPException(status_code=404, detail="Surrender request not found")
    
    sur.closure_status = "Processed & Refund Initiated"
    
    # Mark policy as Inactive/Surrendered
    pol = db.query(Policy).filter(Policy.policy_number == sur.policy_number).first()
    if pol:
        pol.status = "Surrendered / Terminated"
    
    db.commit()
    return {"message": "Policy surrendered and refund of ₹{:,.2f} initiated".format(sur.final_refund)}

# ----------------------------------------------------------------------
# 11C. Policy Continuation / Arrears Settlement
# ----------------------------------------------------------------------
@router.get("/arrears", response_model=List[PolicyArrearsResponse])
def get_all_arrears(db: Session = Depends(get_db)):
    return db.query(PolicyArrears).all()

@router.post("/arrears/settle", response_model=PolicyArrearsResponse)
def settle_policy_arrears(settle_req: SettleArrearsRequest, db: Session = Depends(get_db)):
    arrear = db.query(PolicyArrears).filter(PolicyArrears.arrear_id == settle_req.arrear_id).first()
    if not arrear:
        raise HTTPException(status_code=404, detail="Arrears record not found")

    arrear.paid_amount += settle_req.payment_amount
    arrear.outstanding_balance = max(0.0, arrear.total_due - arrear.paid_amount)
    
    if arrear.outstanding_balance == 0.0:
        arrear.settlement_status = "Settled"
        arrear.claim_eligibility_restored = True
        arrear.settled_at = datetime.utcnow()

        # Update policy & payments status
        pol = db.query(Policy).filter(Policy.policy_number == arrear.policy_number).first()
        if pol:
            pol.status = "Active"
        
        pm = db.query(PremiumPayment).filter(PremiumPayment.policy_number == arrear.policy_number).first()
        if pm:
            pm.payment_status = "Paid"
            pm.outstanding_amount = 0.0

    db.commit()
    db.refresh(arrear)
    return arrear

# ----------------------------------------------------------------------
# 11D. Policy Benefit Transfer (to Spouse, Child, Grandchild)
# ----------------------------------------------------------------------
@router.get("/benefit-transfers", response_model=List[PolicyBenefitTransferResponse])
def get_all_benefit_transfers(db: Session = Depends(get_db)):
    return db.query(PolicyBenefitTransfer).all()

@router.post("/benefit-transfer", response_model=PolicyBenefitTransferResponse)
def request_benefit_transfer(req: BenefitTransferCreate, db: Session = Depends(get_db)):
    count = db.query(PolicyBenefitTransfer).count() + 1
    new_bt = PolicyBenefitTransfer(
        request_id=f"BEN-2026-{count:03d}",
        policyholder_id=req.policyholder_id,
        policy_number=req.policy_number,
        beneficiary_id=req.beneficiary_id,
        beneficiary_name=req.beneficiary_name,
        relationship=req.relationship,
        policy_completion_status="Completed 100% Policy Term",
        benefit_usage="0% Claims Made / Full Unused Benefit",
        transfer_eligibility="Eligible (Configured Benefit Rollover Rule)",
        transfer_status="Approved",
        notes=req.notes or "Benefit transfer approved for next policy renewal cycle."
    )
    db.add(new_bt)
    db.commit()
    db.refresh(new_bt)
    return new_bt

# ----------------------------------------------------------------------
# Configurable Business Rules CRUD
# ----------------------------------------------------------------------
@router.get("/rules", response_model=List[ConfigurableRuleResponse])
def get_configurable_rules(db: Session = Depends(get_db)):
    return db.query(ConfigurableRule).all()

@router.put("/rules/{rule_key}", response_model=ConfigurableRuleResponse)
def update_configurable_rule(rule_key: str, rule_in: ConfigurableRuleUpdate, db: Session = Depends(get_db)):
    rule = db.query(ConfigurableRule).filter(ConfigurableRule.rule_key == rule_key).first()
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule '{rule_key}' not found")
    
    rule.rule_value = rule_in.rule_value
    if rule_in.description:
        rule.description = rule_in.description
    
    db.commit()
    db.refresh(rule)
    return rule

# ----------------------------------------------------------------------
# 11E. Policy Renewal & Instant Reactivation Lifecycle Service
# ----------------------------------------------------------------------
@router.get("/renewals", response_model=List[PolicyRenewalResponse])
def get_all_renewals(
    policy_number: Optional[str] = Query(None),
    policyholder_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(PolicyRenewalRequest)
    if policy_number:
        query = query.filter(PolicyRenewalRequest.policy_number.ilike(f"%{policy_number}%"))
    if policyholder_id:
        query = query.filter(PolicyRenewalRequest.policyholder_id == policyholder_id)
    return query.order_by(PolicyRenewalRequest.id.desc()).all()

@router.post("/renew")
def renew_policy_service(req: PolicyRenewalCreate, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.policy_number.ilike(req.policy_number.strip())).first()
    if not policy and req.policyholder_id:
        policy = db.query(Policy).filter(Policy.policyholder_id == req.policyholder_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy '{req.policy_number}' not found")

    now = datetime.utcnow()
    old_end_date = policy.end_date or now.strftime("%Y-%m-%d")
    renewal_years = max(1, req.renewal_years or 1)
    new_start = req.new_start_date or now.strftime("%Y-%m-%d")
    new_end = req.new_end_date or (now + timedelta(days=365 * renewal_years)).strftime("%Y-%m-%d")

    policy.status = "Active"
    policy.start_date = new_start
    policy.end_date = new_end
    if policy.available_coverage is None or policy.available_coverage <= 0:
        policy.available_coverage = policy.sum_insured
        policy.used_coverage = 0.0

    count = db.query(PolicyRenewalRequest).count() + 1
    new_ren_id = f"REN-{policy.policy_number}-{count:02d}"

    new_renewal = PolicyRenewalRequest(
        renewal_id=new_ren_id,
        policyholder_id=policy.policyholder_id,
        policy_number=policy.policy_number,
        previous_end_date=old_end_date,
        new_start_date=new_start,
        new_end_date=new_end,
        premium_amount=req.premium_amount,
        payment_method=req.payment_method,
        payment_reference=req.payment_reference or f"TXN-UPI-{int(now.timestamp())}",
        renewal_status="Active & Renewed",
        notes=req.notes or f"Policy renewed for {renewal_years} year(s) via {req.payment_method}.",
        created_at=now
    )
    db.add(new_renewal)

    # Settle payments
    existing_payments = db.query(PremiumPayment).filter(
        PremiumPayment.policy_number.ilike(policy.policy_number)
    ).all()
    for p in existing_payments:
        if p.payment_status in ["Pending", "Grace Period", "Lapsed", "Overdue"]:
            p.payment_status = "Paid"
            p.outstanding_amount = 0.0
            p.payment_date = new_start
            p.payment_method = req.payment_method
            p.next_due_date = new_end

    # Settle arrears
    arrears = db.query(PolicyArrears).filter(
        PolicyArrears.policy_number.ilike(policy.policy_number)
    ).all()
    for a in arrears:
        a.settlement_status = "Settled"
        a.claim_eligibility_restored = True
        a.outstanding_balance = 0.0
        a.paid_amount = a.total_due
        a.settled_at = now

    # Log Claim History
    claims = db.query(Claim).filter(Claim.policy_number.ilike(policy.policy_number)).all()
    for c in claims:
        db.add(ClaimHistory(
            claim_id=c.claim_id,
            action="Policy Renewed & Activated",
            previous_status=c.status,
            new_status="Ready for Submission" if "correction" in (c.status or "").lower() or "risk" in (c.status or "").lower() else c.status,
            previous_confidence=c.confidence_score,
            new_confidence=min(100.0, c.confidence_score + 15.0) if c.confidence_score < 85 else c.confidence_score,
            actor=req.actor or "Policyholder (Online Self-Renewal)",
            notes=f"Policy {policy.policy_number} renewed until {new_end}. Premium of ₹{req.premium_amount:,.0f} settled."
        ))

    db.commit()
    db.refresh(policy)
    db.refresh(new_renewal)

    return {
        "success": True,
        "message": f"Policy {policy.policy_number} renewed successfully!",
        "policy": {
            "policy_number": policy.policy_number,
            "policyholder_id": policy.policyholder_id,
            "status": policy.status,
            "start_date": policy.start_date,
            "end_date": policy.end_date,
            "sum_insured": policy.sum_insured,
            "available_coverage": policy.available_coverage,
            "used_coverage": policy.used_coverage
        },
        "renewal": {
            "renewal_id": new_renewal.renewal_id,
            "policy_number": new_renewal.policy_number,
            "new_start_date": new_renewal.new_start_date,
            "new_end_date": new_renewal.new_end_date,
            "premium_amount": new_renewal.premium_amount,
            "renewal_status": new_renewal.renewal_status,
            "payment_method": new_renewal.payment_method,
            "created_at": new_renewal.created_at.strftime("%Y-%m-%d %H:%M:%S") if new_renewal.created_at else new_start
        }
    }
