from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from backend.app.database.session import get_db
from backend.app.models.policy import Policy, Policyholder, PremiumPayment
from backend.app.models.claim import Claim, ClaimHistory
from backend.app.models.services import PolicyRenewalRequest, PolicyArrears
from backend.app.schemas.policy import PolicyResponse, PolicyRenewalCreate, PolicyRenewalResponse

router = APIRouter(prefix="/policies", tags=["Policies & Coverage"])

def sync_policy_coverage_deductions(policy: Policy, db: Session):
    if not policy:
        return
    # Find all claims associated with this policy
    claims = db.query(Claim).filter(
        (Claim.policy_number.ilike(policy.policy_number.strip())) |
        (Claim.policyholder_id == policy.policyholder_id)
    ).all()
    total_deducted = 0.0
    for c in claims:
        # Deduct claims that are active submitted, approved, paid, or settled
        status_up = str(c.status or "").upper()
        is_active_claim = (
            any(k in status_up for k in ["SUBMIT", "APPROV", "PAID", "SETTLE", "PROCESSING", "CLOSED", "CLAIM READY", "READY"]) and
            not any(k in status_up for k in ["REJECT", "CORRECT", "DRAFT", "CANCEL"])
        )
        if is_active_claim:
            amt = float(c.estimated_claimable_amount or c.claim_amount or 0.0)
            total_deducted += amt
    
    # Cap total deductions so they never exceed the total sum insured
    sum_ins = float(policy.sum_insured or 0.0)
    capped_deducted = min(sum_ins, total_deducted)
    
    new_used = round(capped_deducted, 2)
    new_avail = max(0.0, round(sum_ins - capped_deducted, 2))
    
    if policy.used_coverage != new_used or policy.available_coverage != new_avail:
        policy.used_coverage = new_used
        policy.available_coverage = new_avail
        try:
            db.commit()
            db.refresh(policy)
        except Exception:
            pass

@router.get("", response_model=List[PolicyResponse])
def get_all_policies(db: Session = Depends(get_db)):
    policies = db.query(Policy).limit(200).all()
    for p in policies:
        sync_policy_coverage_deductions(p, db)
    return policies

@router.get("/renewals/history", response_model=List[PolicyRenewalResponse])
def get_all_renewal_history(
    policy_number: Optional[str] = Query(None),
    policyholder_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns audit history of all completed policy renewals and reactivations.
    """
    query = db.query(PolicyRenewalRequest)
    if policy_number:
        query = query.filter(PolicyRenewalRequest.policy_number.ilike(f"%{policy_number}%"))
    if policyholder_id:
        query = query.filter(PolicyRenewalRequest.policyholder_id == policyholder_id)
    return query.order_by(PolicyRenewalRequest.id.desc()).all()

@router.get("/{policy_number}", response_model=PolicyResponse)
def get_policy_by_number(policy_number: str, db: Session = Depends(get_db)):
    pol = db.query(Policy).filter(Policy.policy_number.ilike(policy_number.strip())).first()
    if not pol:
        raise HTTPException(status_code=404, detail=f"Policy '{policy_number}' not found")
    sync_policy_coverage_deductions(pol, db)
    return pol

@router.get("/{policy_number}/renewals", response_model=List[PolicyRenewalResponse])
def get_renewals_by_policy(policy_number: str, db: Session = Depends(get_db)):
    return db.query(PolicyRenewalRequest).filter(
        PolicyRenewalRequest.policy_number.ilike(policy_number.strip())
    ).order_by(PolicyRenewalRequest.id.desc()).all()

@router.get("/policyholder/{policyholder_id}", response_model=List[PolicyResponse])
def get_policies_by_policyholder(policyholder_id: str, db: Session = Depends(get_db)):
    policies = db.query(Policy).filter(Policy.policyholder_id == policyholder_id).all()
    for p in policies:
        sync_policy_coverage_deductions(p, db)
    return policies

@router.post("/{policy_number}/renew")
def renew_and_activate_policy(
    policy_number: str,
    req: PolicyRenewalCreate,
    db: Session = Depends(get_db)
):
    """
    Enterprise Policy Renewal & Instant Activation:
    - Extends policy tenure dates (start_date, end_date)
    - Restores policy status from Inactive/Lapsed/Expired to 'Active'
    - Refreshes available coverage balance
    - Records an audit entry in policy_renewal_requests
    - Settles outstanding premium payments and arrears
    - Logs history event in ClaimHistory for all affected claims
    """
    policy = db.query(Policy).filter(Policy.policy_number.ilike(policy_number.strip())).first()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy '{policy_number}' not found in registry")

    now = datetime.utcnow()
    old_end_date = policy.end_date or now.strftime("%Y-%m-%d")

    # Determine new tenure dates
    renewal_years = max(1, req.renewal_years or 1)
    new_start = req.new_start_date or now.strftime("%Y-%m-%d")
    
    if req.new_end_date:
        new_end = req.new_end_date
    else:
        new_end = (now + timedelta(days=365 * renewal_years)).strftime("%Y-%m-%d")

    # 1. Update Policy status & validity
    policy.status = "Active"
    policy.start_date = new_start
    policy.end_date = new_end
    if policy.available_coverage is None or policy.available_coverage <= 0:
        policy.available_coverage = policy.sum_insured
        policy.used_coverage = 0.0

    # 2. Record Policy Renewal Request
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
        notes=req.notes or f"Policy renewed for {renewal_years} year(s) via {req.payment_method}. Health declaration confirmed.",
        created_at=now
    )
    db.add(new_renewal)

    # 3. Settle Premium Payments
    existing_payments = db.query(PremiumPayment).filter(
        PremiumPayment.policy_number.ilike(policy.policy_number)
    ).all()

    had_overdue = False
    for p in existing_payments:
        if p.payment_status in ["Pending", "Grace Period", "Lapsed", "Overdue"]:
            p.payment_status = "Paid"
            p.outstanding_amount = 0.0
            p.payment_date = new_start
            p.payment_method = req.payment_method
            p.next_due_date = new_end
            had_overdue = True

    if not had_overdue:
        pay_count = db.query(PremiumPayment).count() + 1
        db.add(PremiumPayment(
            payment_id=f"PAY-{policy.policyholder_id}-REN{pay_count:02d}",
            policy_number=policy.policy_number,
            policyholder_id=policy.policyholder_id,
            premium_amount=req.premium_amount,
            payment_frequency="Annual",
            payment_status="Paid",
            payment_method=req.payment_method,
            next_due_date=new_end,
            outstanding_amount=0.0,
            payment_date=new_start,
            created_at=now
        ))

    # 4. Settle Arrears if any
    arrears = db.query(PolicyArrears).filter(
        PolicyArrears.policy_number.ilike(policy.policy_number)
    ).all()
    for a in arrears:
        a.settlement_status = "Settled"
        a.claim_eligibility_restored = True
        a.outstanding_balance = 0.0
        a.paid_amount = a.total_due
        a.settled_at = now

    # 5. Log Claim History for associated claims
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
            notes=f"Policy {policy.policy_number} successfully renewed until {new_end}. Premium of ₹{req.premium_amount:,.0f} paid via {req.payment_method}."
        ))

    db.commit()
    db.refresh(policy)
    db.refresh(new_renewal)

    return {
        "success": True,
        "message": f"Policy {policy.policy_number} has been renewed and activated successfully!",
        "policy": {
            "policy_number": policy.policy_number,
            "policyholder_id": policy.policyholder_id,
            "status": policy.status,
            "start_date": policy.start_date,
            "end_date": policy.end_date,
            "sum_insured": policy.sum_insured,
            "available_coverage": policy.available_coverage,
            "used_coverage": policy.used_coverage,
            "policy_type": policy.policy_type,
            "covered_treatments": policy.covered_treatments,
            "exclusions": policy.exclusions,
            "waiting_period": policy.waiting_period,
            "deductible": policy.deductible,
            "co_payment": policy.co_payment,
            "sub_limits": policy.sub_limits
        },
        "renewal": {
            "renewal_id": new_renewal.renewal_id,
            "policy_number": new_renewal.policy_number,
            "previous_end_date": new_renewal.previous_end_date,
            "new_start_date": new_renewal.new_start_date,
            "new_end_date": new_renewal.new_end_date,
            "premium_amount": new_renewal.premium_amount,
            "payment_method": new_renewal.payment_method,
            "payment_reference": new_renewal.payment_reference,
            "renewal_status": new_renewal.renewal_status,
            "created_at": new_renewal.created_at.strftime("%Y-%m-%d %H:%M:%S") if new_renewal.created_at else new_start
        }
    }
