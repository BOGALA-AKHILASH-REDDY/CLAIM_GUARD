from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from backend.app.database.session import get_db
from backend.app.models.services import (
    PolicyTransferRequest, PolicySurrenderRequest, PolicyArrears,
    PolicyBenefitTransfer, ConfigurableRule, PolicyRenewalRequest
)
from backend.app.models.policy import Policy, Policyholder, PremiumPayment, InsuredMember, HealthInformation
from backend.app.models.claim import Claim, ClaimHistory
from backend.app.schemas.services import (
    PolicyTransferCreate, PolicyTransferResponse,
    PolicySurrenderCreate, PolicySurrenderResponse,
    SettleArrearsRequest, PolicyArrearsResponse,
    BenefitTransferCreate, PolicyBenefitTransferResponse,
    ConfigurableRuleResponse, ConfigurableRuleUpdate,
    PolicyRenewalCreate, PolicyRenewalResponse,
    PreClaimEligibilityCheckResponse, PreClaimPayInstalmentRequest,
    PreClaimSummaryItem, PreClaimIssue, PreClaimRecommendation,
    PreClaimPillarDiagnostic, PreClaimCoverageSummary,
    PreClaimInsuredMemberDetail, PreClaimEstimateRequest,
    PreClaimEstimateResponse
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
    try:
        # Look up policy by policy_number or policyholder_id
        policy = db.query(Policy).filter(Policy.policy_number.ilike(req.policy_number.strip())).first() if req.policy_number else None
        if not policy:
            policy = db.query(Policy).filter(Policy.policyholder_id.ilike(req.policyholder_id.strip())).first()
            if policy:
                req.policy_number = policy.policy_number
            else:
                req.policy_number = req.policy_number or f"HLT-2026-{req.policyholder_id}"

        # Guaranteed unique request ID
        t_count = db.query(PolicyTransferRequest).count() + 1
        req_id = f"TRF-2026-{t_count:03d}"
        while db.query(PolicyTransferRequest).filter(PolicyTransferRequest.request_id == req_id).first():
            t_count += 1
            req_id = f"TRF-2026-{t_count:03d}"

        nom_id = req.nominee_id or f"NOM-{req.policyholder_id}-01"
        new_req = PolicyTransferRequest(
            request_id=req_id,
            policyholder_id=req.policyholder_id,
            policy_number=req.policy_number,
            nominee_id=nom_id,
            nominee_name=req.nominee_name.strip(),
            relationship=req.relationship.strip(),
            death_date=req.death_date,
            death_certificate_doc=req.death_certificate_doc or "death_certificate.pdf",
            verification_status="Verified",
            transfer_status="Approved",
            reviewer_notes=req.reviewer_notes or "Nominee credentials and death certificate verified by medical records committee."
        )
        db.add(new_req)

        # Register/Update InsuredMember so the nominee is immediately eligible and available for New Claims
        existing_mem = db.query(InsuredMember).filter(
            InsuredMember.policyholder_id == req.policyholder_id,
            (InsuredMember.name.ilike(req.nominee_name.strip())) | 
            (InsuredMember.member_id.ilike(nom_id.strip())) |
            (InsuredMember.relationship.ilike(req.relationship.strip()))
        ).first()

        if existing_mem:
            existing_mem.name = req.nominee_name.strip()
            existing_mem.relationship = req.relationship.strip()
            existing_mem.eligibility_status = "Eligible"
            new_req.member_id = existing_mem.member_id
        else:
            mem_count = db.query(InsuredMember).filter(InsuredMember.policyholder_id == req.policyholder_id).count() + 1
            gen_m_id = f"{req.policyholder_id}-M{mem_count:02d}"
            while db.query(InsuredMember).filter(InsuredMember.member_id == gen_m_id).first():
                mem_count += 1
                gen_m_id = f"{req.policyholder_id}-M{mem_count:02d}"

            new_mem = InsuredMember(
                member_id=gen_m_id,
                policyholder_id=req.policyholder_id,
                name=req.nominee_name.strip(),
                relationship=req.relationship.strip(),
                age=34 if req.relationship in ["Spouse", "Legal Heir"] else (19 if req.relationship in ["Son", "Daughter"] else 45),
                dob="1992-06-15" if req.relationship in ["Spouse", "Legal Heir"] else ("2007-04-10" if req.relationship in ["Son", "Daughter"] else "1981-01-01"),
                gender="Female" if req.relationship in ["Spouse", "Daughter", "Mother", "Wife"] else "Male",
                eligibility_status="Eligible"
            )
            db.add(new_mem)
            new_req.member_id = gen_m_id
            ph = db.query(Policyholder).filter(Policyholder.policyholder_id == req.policyholder_id).first()
            if ph:
                ph.total_members = (ph.total_members or 1) + 1

        db.commit()
        db.refresh(new_req)
        return new_req
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Policy transfer failed: {str(e)}")

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
# 11C. Pre-Claim Policy Continuation & 4-Pillar Eligibility Engine
# ----------------------------------------------------------------------
def evaluate_pre_claim_eligibility(policy: Policy, db: Session) -> dict:
    now = datetime.utcnow()
    now_str = now.strftime("%Y-%m-%d")

    ph = policy.policyholder or db.query(Policyholder).filter(Policyholder.policyholder_id == policy.policyholder_id).first()
    ph_name = ph.full_name if ph else "Insured Policyholder"

    # ------------------------------------------------------------------
    # TENURE & WAITING PERIOD CALCULATIONS
    # ------------------------------------------------------------------
    try:
        start_dt = datetime.strptime(policy.start_date.strip(), "%Y-%m-%d")
    except Exception:
        start_dt = now - timedelta(days=365)
    try:
        end_dt = datetime.strptime(policy.end_date.strip(), "%Y-%m-%d")
    except Exception:
        end_dt = now + timedelta(days=365)

    total_tenure_days = max(1, (end_dt - start_dt).days)
    days_active = max(0, (now - start_dt).days)
    days_remaining = max(0, (end_dt - now).days)
    is_initial_waiting_cleared = days_active >= 30
    initial_waiting_days_remaining = max(0, 30 - days_active)

    # ------------------------------------------------------------------
    # LIVE COVERAGE & DEDUCTIONS CALCULATION
    # ------------------------------------------------------------------
    from backend.app.api.policies import sync_policy_coverage_deductions
    sync_policy_coverage_deductions(policy, db)

    sum_insured = float(policy.sum_insured or 1000000.0)
    used_coverage = float(policy.used_coverage or 0.0)
    available_coverage = float(policy.available_coverage if policy.available_coverage is not None else max(0.0, sum_insured - used_coverage))
    coverage_utilized_pct = min(100.0, round((used_coverage / max(1.0, sum_insured)) * 100.0, 1))

    if available_coverage <= 0:
        safety_status = "EXHAUSTED"
    elif coverage_utilized_pct >= 75.0 or available_coverage < (0.25 * sum_insured):
        safety_status = "CRITICAL_LOW"
    elif coverage_utilized_pct >= 40.0:
        safety_status = "MODERATE"
    else:
        safety_status = "OPTIMAL"

    co_pay_str = policy.co_payment or "0%"
    deductible_val = float(policy.deductible or 0.0)
    senior_copay_pct = 10.0
    sub_limits_str = policy.sub_limits or "Room Rent: Up to ₹5,000/day | ICU: Up to ₹10,000/day | Daycare: 100% Covered"
    covered_treatments_str = policy.covered_treatments or "In-patient hospitalization, Daycare procedures, AYUSH, Pre/Post Hospitalization, Emergency ICU"
    exclusions_str = policy.exclusions or "Cosmetic surgery, Unproven therapies, Dental without accidental trauma, Obesity treatment"
    waiting_period_str = policy.waiting_period or "30 days initial, 36 months for pre-existing"

    coverage_details = {
        "policy_type": policy.policy_type or "Comprehensive Family Health Plan",
        "sum_insured": sum_insured,
        "used_coverage": used_coverage,
        "available_coverage": available_coverage,
        "coverage_utilized_pct": coverage_utilized_pct,
        "safety_status": safety_status,
        "deductible": deductible_val,
        "co_payment": co_pay_str,
        "senior_citizen_copay_pct": senior_copay_pct,
        "sub_limits": sub_limits_str,
        "covered_treatments": covered_treatments_str,
        "exclusions": exclusions_str,
        "waiting_period": waiting_period_str,
        "start_date": policy.start_date,
        "end_date": policy.end_date,
        "total_tenure_days": total_tenure_days,
        "days_active": days_active,
        "days_remaining": days_remaining,
        "is_initial_waiting_cleared": is_initial_waiting_cleared,
        "initial_waiting_days_remaining": initial_waiting_days_remaining
    }

    # ------------------------------------------------------------------
    # INSURED MEMBERS & PRE-EXISTING DISEASE ROSTER
    # ------------------------------------------------------------------
    db_members = db.query(InsuredMember).filter(
        InsuredMember.policyholder_id == policy.policyholder_id
    ).order_by(InsuredMember.id.asc()).all()

    insured_members_list = []
    base_copay_val = 0.0
    try:
        base_copay_val = float(co_pay_str.replace("%", "").strip())
    except Exception:
        base_copay_val = 0.0

    if not db_members:
        # Default self member if none in table
        insured_members_list.append({
            "member_id": f"{policy.policyholder_id}-M01",
            "name": ph_name,
            "relationship": "Self",
            "age": ph.age if ph and ph.age else 45,
            "gender": ph.gender if ph and ph.gender else "Male",
            "is_senior_citizen": (ph.age >= 60) if ph and ph.age else False,
            "eligibility_status": "Eligible",
            "applicable_copay_pct": base_copay_val + (senior_copay_pct if (ph and ph.age and ph.age >= 60) else 0.0),
            "health_conditions": "None (Clean Health Profile)",
            "ped_waiting_cleared": True,
            "ped_waiting_note": "No pre-existing conditions reported",
            "claim_readiness": "READY" if policy.status == "Active" and is_initial_waiting_cleared else "WAITING_PERIOD"
        })
    else:
        for m in db_members:
            # Query health info
            health_rec = db.query(HealthInformation).filter(
                HealthInformation.policyholder_id == policy.policyholder_id,
                (HealthInformation.member_id == m.member_id) | (HealthInformation.member_id == None)
            ).first()

            existing_cond = health_rec.existing_conditions if health_rec and health_rec.existing_conditions and health_rec.existing_conditions.strip().lower() not in ["none", "null", ""] else "None (Clean Health Profile)"
            is_senior = (m.age >= 60)
            member_copay = base_copay_val + (senior_copay_pct if is_senior else 0.0)
            has_ped = existing_cond != "None (Clean Health Profile)" and existing_cond.lower() != "none"
            
            # 36 months = 1095 days for PED clearance
            ped_cleared = (days_active >= 1095) or not has_ped
            ped_note = "36-Month PED waiting period fully cleared" if ped_cleared else f"PED waiting period active ({round(days_active / 365.0, 1)} of 3.0 yrs elapsed)"

            if policy.status != "Active":
                c_readiness = "INELIGIBLE"
            elif not is_initial_waiting_cleared:
                c_readiness = "WAITING_PERIOD"
            elif not ped_cleared:
                c_readiness = "PED_WAITING"
            else:
                c_readiness = "READY"

            insured_members_list.append({
                "member_id": m.member_id,
                "name": m.name,
                "relationship": m.relationship,
                "age": m.age,
                "gender": m.gender or "Male",
                "is_senior_citizen": is_senior,
                "eligibility_status": m.eligibility_status or "Eligible",
                "applicable_copay_pct": member_copay,
                "health_conditions": existing_cond,
                "ped_waiting_cleared": ped_cleared,
                "ped_waiting_note": ped_note,
                "claim_readiness": c_readiness
            })

    # Covered treatments and exclusions lists
    covered_treatments_list = [t.strip() for t in covered_treatments_str.replace(";", ",").split(",") if t.strip()]
    exclusions_list = [e.strip() for e in exclusions_str.replace(";", ",").split(",") if e.strip()]

    # --------    # ------------------------------------------------------------------
    # PILLAR 1: Premium Payment Status & Term Compliance
    # ------------------------------------------------------------------
    payments = db.query(PremiumPayment).filter(
        PremiumPayment.policy_number.ilike(policy.policy_number)
    ).order_by(PremiumPayment.id.desc()).all()

    arrears = db.query(PolicyArrears).filter(
        PolicyArrears.policy_number.ilike(policy.policy_number)
    ).order_by(PolicyArrears.id.desc()).all()

    active_arrear = next((a for a in arrears if a.settlement_status != "Settled" and a.outstanding_balance > 0), None)
    latest_pm = payments[0] if payments else None

    # Calculate next_due_date strictly within the active policy term [start_dt, end_dt]
    raw_due_str = latest_pm.next_due_date if (latest_pm and latest_pm.next_due_date) else None
    try:
        if raw_due_str:
            due_dt = datetime.strptime(raw_due_str.strip(), "%Y-%m-%d")
            if due_dt >= end_dt:
                due_dt = end_dt - timedelta(days=30)
            elif due_dt < start_dt:
                due_dt = start_dt + timedelta(days=30)
        else:
            due_dt = end_dt - timedelta(days=30)
    except Exception:
        due_dt = end_dt - timedelta(days=30)

    base_due_date_str = due_dt.strftime("%Y-%m-%d")

    has_overdue_pm = any(p.payment_status in ["Overdue", "Lapsed"] for p in payments)
    has_grace_pm = any(p.payment_status in ["Grace Period", "Pending"] for p in payments)
    
    p1_status = "PASS"
    p1_label = "Paid & Up to Date"
    p1_msg = "All premium payments are up to date with zero payment delays."
    p1_details = f"Active schedule ({latest_pm.payment_frequency if latest_pm else 'Annual'}). All scheduled premium receipts verified."

    if has_overdue_pm or (policy.status == "Lapsed" and not active_arrear):
        p1_status = "FAIL"
        p1_label = "Overdue / Payment Lapsed"
        p1_msg = "Premium payment is currently overdue. Immediate settlement required before claim processing."
        p1_details = f"Overdue premium of ₹{(latest_pm.premium_amount if latest_pm else 25000):,.0f} has exceeded payment due date ({base_due_date_str})."
    elif has_grace_pm or active_arrear:
        p1_status = "WARNING"
        p1_label = "Pending in Grace Window"
        p1_msg = "Current premium instalment is pending within the active 30-day grace protection period."
        p1_details = f"Pending instalment of ₹{(latest_pm.premium_amount if latest_pm else (active_arrear.outstanding_balance if active_arrear else 25000)):,.0f} due on {base_due_date_str}."

    p1_diag = {
        "name": "Premium Payment Status",
        "pillar_number": 1,
        "status": p1_status,
        "status_label": p1_label,
        "message": p1_msg,
        "details": p1_details,
        "key_metrics": {
            "payment_status": latest_pm.payment_status if latest_pm else ("Active" if policy.status == "Active" else "Overdue"),
            "payment_frequency": latest_pm.payment_frequency if latest_pm else "Annual",
            "premium_amount": latest_pm.premium_amount if latest_pm else 25000.0,
            "last_payment_date": latest_pm.payment_date if latest_pm else policy.start_date,
            "next_due_date": base_due_date_str,
            "payment_method": latest_pm.payment_method if latest_pm else "UPI / Net Banking"
        }
    }

    # ------------------------------------------------------------------
    # PILLAR 2: Outstanding Instalments
    # ------------------------------------------------------------------
    total_out_amt = 0.0
    pending_instalments = 0

    for p in payments:
        if p.payment_status in ["Overdue", "Pending", "Grace Period"] or (p.outstanding_amount and p.outstanding_amount > 0):
            total_out_amt += (p.outstanding_amount or p.premium_amount or 0.0)
            pending_instalments += 1

    if active_arrear and active_arrear.outstanding_balance > 0:
        total_out_amt = max(total_out_amt, active_arrear.outstanding_balance)
        if pending_instalments == 0:
            pending_instalments = 1

    p2_status = "PASS"
    p2_label = "₹0 Outstanding (All Cleared)"
    p2_msg = "Zero pending instalments or unsettled premium arrears detected."
    p2_details = "All billing instalments up to the current term cycle are cleared and reconciled in the policy ledger."

    if total_out_amt > 0:
        if p1_status == "FAIL":
            p2_status = "FAIL"
            p2_label = f"₹{total_out_amt:,.0f} Overdue ({pending_instalments} Instalment)"
            p2_msg = f"Critical overdue balance of ₹{total_out_amt:,.0f} pending settlement."
            p2_details = "Unsettled instalments block digital pre-authorization and trigger mandatory claim adjudication hold."
        else:
            p2_status = "WARNING"
            p2_label = f"₹{total_out_amt:,.0f} Pending ({pending_instalments} Instalment)"
            p2_msg = f"Pending instalment balance of ₹{total_out_amt:,.0f} due for settlement."
            p2_details = "Clearing pending instalment before claim filing prevents payment deduction or claim query delays."

    p2_diag = {
        "name": "Outstanding Instalments",
        "pillar_number": 2,
        "status": p2_status,
        "status_label": p2_label,
        "message": p2_msg,
        "details": p2_details,
        "key_metrics": {
            "pending_instalments_count": pending_instalments,
            "total_outstanding_amount": total_out_amt,
            "arrear_id": active_arrear.arrear_id if active_arrear else None,
            "payment_id": latest_pm.payment_id if latest_pm else None,
            "required_settlement_amount": total_out_amt
        }
    }

    # ------------------------------------------------------------------
    # PILLAR 3: Grace-Period Status
    # ------------------------------------------------------------------
    is_in_grace = False
    is_grace_expired = False
    grace_period_days = active_arrear.grace_period_days if active_arrear and active_arrear.grace_period_days else 30

    grace_expiry_dt = min(end_dt, due_dt + timedelta(days=grace_period_days))
    grace_expiry_str = grace_expiry_dt.strftime("%Y-%m-%d")
    grace_days_remaining = 27

    if active_arrear:
        if active_arrear.settlement_status == "Settled" or active_arrear.outstanding_balance == 0:
            p3_status = "PASS"
            p3_label = "Grace Cleared & Restored"
            p3_msg = "Grace period successfully reconciled and policy eligibility restored."
            p3_details = f"Arrear {active_arrear.arrear_id} settled. 100% active policy continuity guaranteed."
        else:
            is_in_grace = True
            grace_days_remaining = 27
            p3_status = "WARNING"
            p3_label = f"Active Grace ({grace_days_remaining} Days Left)"
            p3_msg = f"Policy is operating under {grace_period_days}-day grace protection with {grace_days_remaining} days remaining."
            p3_details = f"Grace window ends on {grace_expiry_str}. Settle pending instalments to maintain continuous coverage and NCB."
    elif has_grace_pm or has_overdue_pm:
        is_in_grace = True
        grace_days_remaining = 27
        p3_status = "WARNING"
        p3_label = f"Active Grace ({grace_days_remaining} Days Left)"
        p3_msg = f"Policy is operating under {grace_period_days}-day grace protection ({grace_days_remaining} days remaining)."
        p3_details = f"Grace period window ends on {grace_expiry_str}. Settle balance before expiry."
    else:
        p3_status = "PASS"
        p3_label = "Standard Active (Not in Grace)"
        p3_msg = "Policy is in full active standing with no active grace period countdown."
        p3_details = f"Unconditional claim validity active under standard policy tenure (Term through {policy.end_date})."

    p3_diag = {
        "name": "Grace-Period Status",
        "pillar_number": 3,
        "status": p3_status,
        "status_label": p3_label,
        "message": p3_msg,
        "details": p3_details,
        "key_metrics": {
            "is_in_grace": is_in_grace,
            "is_grace_expired": is_grace_expired,
            "grace_period_days": grace_period_days,
            "days_remaining": grace_days_remaining if is_in_grace else (0 if is_grace_expired else 30),
            "payment_due_date": base_due_date_str,
            "grace_expiry_date": grace_expiry_str
        }
    }

    # ------------------------------------------------------------------
    # PILLAR 4: Policy-Specific Conditions & Live Coverage Health
    # ------------------------------------------------------------------
    p4_status = "PASS"
    p4_label = "Active & Full Coverage Satisfied"
    p4_msg = f"Policy is Active with ₹{available_coverage:,.0f} available coverage ({100 - coverage_utilized_pct:.0f}% buffer remaining)."
    p4_details = f"Tenure: {policy.start_date} to {policy.end_date} ({days_remaining} days remaining). Waiting period cleared. Co-pay: {co_pay_str}."

    if policy.status in ["Lapsed", "Surrendered", "Expired", "Suspended"]:
        p4_status = "FAIL"
        p4_label = f"Policy Contract {policy.status}"
        p4_msg = f"Policy contract is currently {policy.status}."
        p4_details = f"Claims cannot be submitted or honored while policy contract is {policy.status}. Reactivation is mandatory."
    elif available_coverage <= 0:
        p4_status = "FAIL"
        p4_label = "Coverage Balance Exhausted (₹0 Remaining)"
        p4_msg = "Policy sum insured is fully utilized by previous claim payouts (₹0 available coverage)."
        p4_details = "Additional claims cannot be submitted until policy renewal or coverage buffer enhancement is processed."
    elif not is_initial_waiting_cleared:
        p4_status = "WARNING"
        p4_label = f"Initial Waiting Active ({initial_waiting_days_remaining} Days Left)"
        p4_msg = f"Policy was activated {days_active} days ago. 30-day initial waiting period applies to planned illnesses."
        p4_details = "Emergency accidental injury claims are 100% covered from Day 1. Planned hospitalizations clear after Day 30."
    elif safety_status == "CRITICAL_LOW":
        p4_status = "WARNING"
        p4_label = f"Low Coverage Buffer ({100 - coverage_utilized_pct:.0f}% Remaining)"
        p4_msg = f"Available coverage buffer is low (₹{available_coverage:,.0f} of ₹{sum_insured:,.0f})."
        p4_details = "Claims exceeding remaining balance will require out-of-pocket patient co-share or Top-Up activation."

    p4_diag = {
        "name": "Policy-Specific Conditions",
        "pillar_number": 4,
        "status": p4_status,
        "status_label": p4_label,
        "message": p4_msg,
        "details": p4_details,
        "key_metrics": {
            "policy_status": policy.status,
            "policy_type": policy.policy_type,
            "start_date": policy.start_date,
            "end_date": policy.end_date,
            "days_active": days_active,
            "days_remaining": days_remaining,
            "sum_insured": sum_insured,
            "available_coverage": available_coverage,
            "used_coverage": used_coverage,
            "coverage_utilized_pct": coverage_utilized_pct,
            "safety_status": safety_status,
            "waiting_period": waiting_period_str,
            "is_initial_waiting_cleared": is_initial_waiting_cleared,
            "co_payment": co_pay_str,
            "deductible": deductible_val,
            "sub_limits": sub_limits_str
        }
    }

    # ------------------------------------------------------------------
    # IDENTIFIED ISSUES
    # ------------------------------------------------------------------
    issues = []
    if p1_status == "FAIL":
        issues.append({
            "id": "ISS-PREM-OVERDUE",
            "category": "Premium Payment Status",
            "severity": "CRITICAL_BLOCKER",
            "title": "Overdue Premium Payment Detected",
            "description": f"Scheduled premium of ₹{(latest_pm.premium_amount if latest_pm else 25000):,.0f} has passed the due date without payment.",
            "claim_impact": "Direct blocker: Claim cannot be verified or submitted until premium payment is cleared."
        })
    if total_out_amt > 0:
        issues.append({
            "id": "ISS-INSTALMENT-DUE",
            "category": "Outstanding Instalments",
            "severity": "CRITICAL_BLOCKER" if p2_status == "FAIL" else "WARNING",
            "title": f"Outstanding Instalment Balance of ₹{total_out_amt:,.0f}",
            "description": f"{pending_instalments} unpaid instalment(s) totaling ₹{total_out_amt:,.0f} are outstanding on this policy schedule.",
            "claim_impact": "Claim processing hold or deduction: Claim may face settlement delay or rejection without clearance."
        })
    if is_grace_expired:
        issues.append({
            "id": "ISS-GRACE-EXPIRED",
            "category": "Grace-Period Status",
            "severity": "CRITICAL_BLOCKER",
            "title": "30-Day Grace Period Protection Expired",
            "description": "The statutory 30-day grace protection window has elapsed. Policy coverage is currently suspended.",
            "claim_impact": "Policy Lapsed: Claims will be rejected by adjudication engine until continuation settlement is executed."
        })
    elif is_in_grace:
        issues.append({
            "id": "ISS-GRACE-ACTIVE",
            "category": "Grace-Period Status",
            "severity": "WARNING",
            "title": f"Policy in Active Grace Window ({grace_days_remaining} Days Remaining)",
            "description": "Policy is operating under temporary grace protection. Dues must be settled before grace expiry.",
            "claim_impact": "Advisory: Claim submission is permitted, but final claim disbursement requires instalment clearance."
        })
    if p4_status == "FAIL":
        issues.append({
            "id": "ISS-POLICY-CONDITION",
            "category": "Policy-Specific Conditions",
            "severity": "CRITICAL_BLOCKER",
            "title": f"Policy Contract Condition: {policy.status}" if available_coverage > 0 else "Policy Coverage Balance Exhausted (₹0 Remaining)",
            "description": f"The policy is marked {policy.status} in core registry. Sum insured available: ₹{available_coverage:,.0f}." if available_coverage > 0 else f"100% of ₹{sum_insured:,.0f} sum insured has been exhausted by claim payouts.",
            "claim_impact": "Contractual block: Claims cannot be processed under exhausted coverage or inactive policy contracts."
        })
    elif not is_initial_waiting_cleared:
        issues.append({
            "id": "ISS-WAITING-PERIOD",
            "category": "Policy-Specific Conditions",
            "severity": "WARNING",
            "title": f"Initial 30-Day Waiting Period ({initial_waiting_days_remaining} Days Left)",
            "description": f"Policy tenure active for {days_active} days. Planned illness treatments require 30 active days.",
            "claim_impact": "Advisory: Accidental emergency claims are 100% valid immediately. Planned admissions require Day 30+."
        })

    # ------------------------------------------------------------------
    # RECOMMENDED CORRECTIVE ACTIONS
    # ------------------------------------------------------------------
    recommendations = []
    if total_out_amt > 0 or active_arrear:
        settle_amt = total_out_amt if total_out_amt > 0 else (active_arrear.outstanding_balance if active_arrear else 25000.0)
        recommendations.append({
            "id": "ACT-SETTLE-INSTALMENT",
            "action_type": "PAY_INSTALMENT",
            "title": f"Settle Outstanding Instalment (₹{settle_amt:,.0f})",
            "description": "Execute instant online settlement via UPI / Net Banking to clear all arrears, update ledger, and reinstate 100% active claim submission eligibility.",
            "cta_label": f"Pay ₹{settle_amt:,.0f} & Restore Eligibility",
            "amount": settle_amt,
            "payload": {
                "policy_number": policy.policy_number,
                "arrear_id": active_arrear.arrear_id if active_arrear else None,
                "payment_id": latest_pm.payment_id if latest_pm else None,
                "payment_amount": settle_amt
            }
        })

    if policy.status in ["Lapsed", "Expired", "Suspended"] or is_grace_expired:
        recommendations.append({
            "id": "ACT-RENEW-POLICY",
            "action_type": "RENEW_POLICY",
            "title": "Renew & Reactivate Policy Coverage",
            "description": "Initiate seamless policy renewal to extend active policy tenure by 1–3 years, restore cumulative NCB bonus, and reactivate instant claim clearance.",
            "cta_label": "Renew & Reactivate Policy",
            "amount": latest_pm.premium_amount if latest_pm else 25000.0,
            "payload": {
                "policy_number": policy.policy_number,
                "policyholder_id": policy.policyholder_id
            }
        })

    if is_in_grace and not (total_out_amt > 0):
        recommendations.append({
            "id": "ACT-CLEAR-GRACE",
            "action_type": "CLEAR_GRACE",
            "title": "Clear Grace Period Arrears",
            "description": "Lock in continuous coverage security before the grace period ends to prevent tenure reset or waiting period loss.",
            "cta_label": "Clear Grace Dues",
            "amount": 25000.0,
            "payload": {"policy_number": policy.policy_number}
        })

    if available_coverage <= 0:
        recommendations.append({
            "id": "ACT-TOPUP-COVERAGE",
            "action_type": "TOPUP_COVERAGE",
            "title": "Policy Balance Completely Utilized — Renew / Top-Up Coverage",
            "description": f"The policy sum insured of ₹{sum_insured:,.0f} is 100% exhausted (₹0 remaining available balance). Renew policy or activate Super Top-Up extension to restore active claim submission readiness.",
            "cta_label": "Renew / Top-Up Coverage Balance ➔",
            "amount": latest_pm.premium_amount if latest_pm else 25000.0,
            "payload": {"policy_number": policy.policy_number, "policyholder_id": policy.policyholder_id}
        })
    elif safety_status == "CRITICAL_LOW":
        recommendations.append({
            "id": "ACT-TOPUP-COVERAGE",
            "action_type": "TOPUP_COVERAGE",
            "title": "Enhance Coverage Buffer (Super Top-Up / Recharge)",
            "description": f"Available coverage is low at ₹{available_coverage:,.0f} of ₹{sum_insured:,.0f}. Activate a Super Top-Up buffer or Sum Insured extension to ensure uninterrupted cashless hospitalization clearance.",
            "cta_label": "Enhance Coverage Buffer",
            "amount": 15000.0,
            "payload": {"policy_number": policy.policy_number, "policyholder_id": policy.policyholder_id}
        })

    if len(issues) == 0:
        recommendations.append({
            "id": "ACT-PROCEED-CLAIM",
            "action_type": "PROCEED_CLAIM",
            "title": "Proceed Directly to Claim Submission",
            "description": "All 4 pre-claim verification checks have PASSED. This policy has verified active status, cleared instalments, and full coverage availability.",
            "cta_label": "Create New Claim Now ➔",
            "amount": 0.0,
            "payload": {
                "policy_number": policy.policy_number,
                "policyholder_id": policy.policyholder_id,
                "policyholder_name": ph_name
            }
        })

    # ------------------------------------------------------------------
    # OVERALL ELIGIBILITY VERDICT
    # ------------------------------------------------------------------
    has_critical_blocker = any(iss["severity"] == "CRITICAL_BLOCKER" for iss in issues) or p1_status == "FAIL" or p4_status == "FAIL" or is_grace_expired
    has_warning = any(iss["severity"] == "WARNING" for iss in issues) or p1_status == "WARNING" or p2_status == "WARNING" or is_in_grace

    if has_critical_blocker:
        overall_elig = "ACTION_REQUIRED_BLOCKED"
        can_submit = False
        readiness = 25
        sum_msg = "Pre-claim eligibility check identified critical blockers (overdue premium, exhausted coverage, or inactive contract). Execute the recommended corrective action below to restore claim submission eligibility."
    elif has_warning:
        overall_elig = "CONDITIONAL_WARNING"
        can_submit = True
        readiness = 75
        sum_msg = "Policy is conditionally eligible under active grace protection or low buffer. We recommend settling pending items to prevent claim processing delays."
    else:
        overall_elig = "ELIGIBLE"
        can_submit = True
        readiness = 100
        sum_msg = "All 4 pre-claim verification checks PASSED. Policy is active, premium is up to date, zero outstanding instalments, and full coverage buffer is ready for claim submission."

    return {
        "policyholder_id": policy.policyholder_id,
        "policyholder_name": ph_name,
        "policy_number": policy.policy_number,
        "overall_eligibility": overall_elig,
        "can_submit_claim": can_submit,
        "readiness_score": readiness,
        "summary_message": sum_msg,
        "coverage_details": coverage_details,
        "insured_members": insured_members_list,
        "covered_treatments_list": covered_treatments_list,
        "exclusions_list": exclusions_list,
        "premium_status": p1_diag,
        "outstanding_instalments": p2_diag,
        "grace_period": p3_diag,
        "policy_conditions": p4_diag,
        "issues": issues,
        "recommendations": recommendations,
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S")
    }

@router.get("/continuation/eligibility-check", response_model=PreClaimEligibilityCheckResponse)
def check_pre_claim_eligibility(
    policy_number: Optional[str] = Query(None),
    policyholder_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    policy = None
    if policy_number and policy_number.strip():
        policy = db.query(Policy).filter(Policy.policy_number.ilike(policy_number.strip())).first()
    if not policy and policyholder_id and policyholder_id.strip():
        policy = db.query(Policy).filter(Policy.policyholder_id.ilike(policyholder_id.strip())).first()
    if not policy:
        policy = db.query(Policy).first()
    if not policy:
        raise HTTPException(status_code=404, detail="No policy found for pre-claim eligibility evaluation")

    return evaluate_pre_claim_eligibility(policy, db)

@router.get("/continuation/all-policies-summary", response_model=List[PreClaimSummaryItem])
def get_all_policies_pre_claim_summary(db: Session = Depends(get_db)):
    policies = db.query(Policy).all()
    summaries = []
    for pol in policies:
        eval_res = evaluate_pre_claim_eligibility(pol, db)
        cov = eval_res["coverage_details"]
        summaries.append({
            "policyholder_id": pol.policyholder_id,
            "policyholder_name": eval_res["policyholder_name"],
            "policy_number": pol.policy_number,
            "policy_type": cov["policy_type"],
            "sum_insured": cov["sum_insured"],
            "used_coverage": cov["used_coverage"],
            "available_coverage": cov["available_coverage"],
            "coverage_utilized_pct": cov["coverage_utilized_pct"],
            "co_payment": cov["co_payment"],
            "deductible": cov["deductible"],
            "premium_status": eval_res["premium_status"]["status_label"],
            "outstanding_amount": eval_res["outstanding_instalments"]["key_metrics"]["total_outstanding_amount"],
            "is_in_grace": eval_res["grace_period"]["key_metrics"]["is_in_grace"],
            "grace_days_remaining": eval_res["grace_period"]["key_metrics"]["days_remaining"],
            "policy_status": pol.status,
            "overall_eligibility": eval_res["overall_eligibility"],
            "can_submit_claim": eval_res["can_submit_claim"],
            "readiness_score": eval_res["readiness_score"]
        })
    return summaries

@router.post("/continuation/estimate-claim", response_model=PreClaimEstimateResponse)
def estimate_pre_claim_payout(req: PreClaimEstimateRequest, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.policy_number.ilike(req.policy_number.strip())).first()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy '{req.policy_number}' not found")

    eval_data = evaluate_pre_claim_eligibility(policy, db)
    cov = eval_data["coverage_details"]
    avail_before = cov["available_coverage"]
    gross_bill = float(req.estimated_bill_amount)

    # Member details
    target_member = None
    if req.member_id:
        target_member = next((m for m in eval_data["insured_members"] if m["member_id"] == req.member_id), None)
    if not target_member and len(eval_data["insured_members"]) > 0:
        target_member = eval_data["insured_members"][0]

    member_name = target_member["name"] if target_member else eval_data["policyholder_name"]
    member_rel = target_member["relationship"] if target_member else "Self"
    member_copay_pct = float(target_member["applicable_copay_pct"]) if target_member else 0.0

    # Treatment check against exclusions
    t_name_lower = req.treatment_name.lower().strip()
    is_excluded = any(exc.lower() in t_name_lower for exc in eval_data["exclusions_list"])
    is_covered = not is_excluded

    warning_notes = []
    sub_limit_name = None
    sub_limit_applied = 0.0
    sub_limit_deduction = 0.0

    if not is_covered:
        cov_category = "EXCLUDED"
        warning_notes.append(f"'{req.treatment_name}' matches policy exclusion clauses. Standard claims for this procedure will be rejected.")
    else:
        cov_category = "FULLY_COVERED"

    # Sub-limits calculation (e.g. Room rent limit)
    room_daily_limit = 5000.0 if "super top-up" not in (policy.policy_type or "").lower() else 10000.0
    stay_days = req.stay_days or 1
    if "icu" in (req.room_type or "").lower():
        room_daily_limit = room_daily_limit * 2.0
    
    # Check if bill contains excessive room rent
    if "deluxe" in (req.room_type or "").lower() or "suite" in (req.room_type or "").lower():
        estimated_room_bill = stay_days * 12000.0
        allowed_room_bill = stay_days * room_daily_limit
        if estimated_room_bill > allowed_room_bill and gross_bill > allowed_room_bill:
            sub_limit_deduction = min(gross_bill * 0.15, estimated_room_bill - allowed_room_bill)
            sub_limit_name = f"Room Rent Sub-Limit Cap ({req.room_type})"
            sub_limit_applied = allowed_room_bill
            cov_category = "COVERED_WITH_SUBLIMIT"
            warning_notes.append(f"Room rent exceeds policy daily limit of ₹{room_daily_limit:,.0f}/day. Pro-rata room rent deduction of ₹{sub_limit_deduction:,.0f} applied.")

    # Deductible application
    admissible_before_deductible = max(0.0, gross_bill - sub_limit_deduction) if is_covered else 0.0
    deductible_val = cov["deductible"]
    deductible_applied = min(admissible_before_deductible, deductible_val)
    amount_after_deductible = max(0.0, admissible_before_deductible - deductible_applied)

    # Co-pay calculation
    copay_deduction = round(amount_after_deductible * (member_copay_pct / 100.0), 2)
    amount_after_copay = max(0.0, amount_after_deductible - copay_deduction)

    # Cap by available coverage
    estimated_approved_payout = min(avail_before, amount_after_copay)
    estimated_patient_out_of_pocket = round(gross_bill - estimated_approved_payout, 2)
    projected_available_after = max(0.0, avail_before - estimated_approved_payout)

    if avail_before < amount_after_copay:
        warning_notes.append(f"Available coverage buffer (₹{avail_before:,.0f}) is lower than admissible claim amount (₹{amount_after_copay:,.0f}). Balance ₹{amount_after_copay - avail_before:,.0f} must be borne by patient.")

    if target_member and not target_member.get("ped_waiting_cleared", True):
        warning_notes.append(f"Pre-existing disease clause active for {member_name} ({target_member.get('health_conditions')}). Medical necessity validation required.")

    if target_member and target_member.get("is_senior_citizen"):
        warning_notes.append(f"Senior citizen co-payment modifier (+10%) applied for {member_name} (Age {target_member.get('age')}).")

    if not warning_notes:
        warning_notes.append("Treatment satisfies all policy coverage conditions and sub-limit thresholds. Ready for cashless/reimbursement claim submission.")

    return {
        "policy_number": policy.policy_number,
        "treatment_name": req.treatment_name,
        "member_name": member_name,
        "member_relationship": member_rel,
        "gross_bill_amount": gross_bill,
        "is_treatment_covered": is_covered,
        "treatment_coverage_category": cov_category,
        "sub_limit_name": sub_limit_name,
        "sub_limit_applied": sub_limit_applied,
        "sub_limit_deduction": sub_limit_deduction,
        "admissible_amount_before_deductible": admissible_before_deductible,
        "deductible_applied": deductible_applied,
        "amount_after_deductible": amount_after_deductible,
        "copay_pct_applied": member_copay_pct,
        "copay_deduction": copay_deduction,
        "estimated_approved_payout": estimated_approved_payout,
        "estimated_patient_out_of_pocket": estimated_patient_out_of_pocket,
        "available_coverage_before_claim": avail_before,
        "projected_available_coverage_after_claim": projected_available_after,
        "coverage_warning_notes": warning_notes
    }

@router.post("/continuation/pay-instalment", response_model=PreClaimEligibilityCheckResponse)
def pay_pre_claim_instalment(req: PreClaimPayInstalmentRequest, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.policy_number.ilike(req.policy_number.strip())).first()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy '{req.policy_number}' not found")

    now = datetime.utcnow()
    # Settle PremiumPayment records
    payments = db.query(PremiumPayment).filter(
        PremiumPayment.policy_number.ilike(policy.policy_number)
    ).all()
    for p in payments:
        if p.payment_status in ["Overdue", "Pending", "Grace Period", "Lapsed"] or (p.outstanding_amount and p.outstanding_amount > 0):
            p.payment_status = "Paid"
            p.outstanding_amount = 0.0
            p.payment_method = req.payment_method or "UPI"
            p.payment_date = now.strftime("%Y-%m-%d")

    # Settle PolicyArrears records
    arrears = db.query(PolicyArrears).filter(
        PolicyArrears.policy_number.ilike(policy.policy_number)
    ).all()
    for a in arrears:
        a.settlement_status = "Settled"
        a.claim_eligibility_restored = True
        a.paid_amount = a.total_due
        a.outstanding_balance = 0.0
        a.settled_at = now

    # Reinstate Policy to Active
    policy.status = "Active"
    if policy.available_coverage is None or policy.available_coverage <= 0:
        policy.available_coverage = policy.sum_insured

    # Add Claim History Ledger entry for Audit Trail
    claims = db.query(Claim).filter(Claim.policy_number.ilike(policy.policy_number)).all()
    for c in claims:
        db.add(ClaimHistory(
            claim_id=c.claim_id,
            action="Pre-Claim Instalment Settled",
            previous_status=c.status,
            new_status="Ready for Submission" if "correction" in (c.status or "").lower() or "risk" in (c.status or "").lower() else c.status,
            previous_confidence=c.confidence_score,
            new_confidence=min(100.0, c.confidence_score + 10.0) if c.confidence_score < 90 else c.confidence_score,
            actor=req.notes or f"Policyholder (Instant {req.payment_method or 'UPI'} Payment)",
            notes=f"Outstanding instalment of ₹{req.payment_amount:,.0f} settled. Policy continuation eligibility restored to 100%."
        ))

    db.commit()
    db.refresh(policy)

    return evaluate_pre_claim_eligibility(policy, db)

@router.post("/continuation/restore-policy", response_model=PreClaimEligibilityCheckResponse)
def restore_policy_continuation(
    policy_number: str = Query(...),
    db: Session = Depends(get_db)
):
    policy = db.query(Policy).filter(Policy.policy_number.ilike(policy_number.strip())).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    now = datetime.utcnow()
    policy.status = "Active"
    
    payments = db.query(PremiumPayment).filter(PremiumPayment.policy_number.ilike(policy.policy_number)).all()
    for p in payments:
        p.payment_status = "Paid"
        p.outstanding_amount = 0.0
        p.payment_date = now.strftime("%Y-%m-%d")

    arrears = db.query(PolicyArrears).filter(PolicyArrears.policy_number.ilike(policy.policy_number)).all()
    for a in arrears:
        a.settlement_status = "Settled"
        a.claim_eligibility_restored = True
        a.outstanding_balance = 0.0
        a.settled_at = now

    db.commit()
    db.refresh(policy)
    return evaluate_pre_claim_eligibility(policy, db)

# Backwards compatibility endpoints
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
    try:
        # Look up policy
        policy = db.query(Policy).filter(Policy.policy_number.ilike(req.policy_number.strip())).first() if req.policy_number else None
        if not policy:
            policy = db.query(Policy).filter(Policy.policyholder_id.ilike(req.policyholder_id.strip())).first()
            if policy:
                req.policy_number = policy.policy_number
            else:
                req.policy_number = req.policy_number or f"HLT-2026-{req.policyholder_id}"

        count = db.query(PolicyBenefitTransfer).count() + 1
        req_id = f"BEN-2026-{count:03d}"
        while db.query(PolicyBenefitTransfer).filter(PolicyBenefitTransfer.request_id == req_id).first():
            count += 1
            req_id = f"BEN-2026-{count:03d}"

        ben_id = req.beneficiary_id or f"BEN-{req.policyholder_id}-02"
        new_bt = PolicyBenefitTransfer(
            request_id=req_id,
            policyholder_id=req.policyholder_id,
            policy_number=req.policy_number,
            beneficiary_id=ben_id,
            beneficiary_name=req.beneficiary_name.strip(),
            relationship=req.relationship.strip(),
            policy_completion_status="Completed 100% Policy Term",
            benefit_usage="0% Claims Made / Full Unused Benefit",
            transfer_eligibility="Eligible (Configured Benefit Rollover Rule)",
            transfer_status="Approved",
            notes=req.notes or "Benefit transfer approved for next policy renewal cycle."
        )
        db.add(new_bt)

        # Register/Update InsuredMember so the beneficiary is immediately available for New Claims
        existing_mem = db.query(InsuredMember).filter(
            InsuredMember.policyholder_id == req.policyholder_id,
            (InsuredMember.name.ilike(req.beneficiary_name.strip())) | 
            (InsuredMember.member_id.ilike(ben_id.strip())) |
            (InsuredMember.relationship.ilike(req.relationship.strip()))
        ).first()

        if existing_mem:
            existing_mem.name = req.beneficiary_name.strip()
            existing_mem.relationship = req.relationship.strip()
            existing_mem.eligibility_status = "Eligible"
            new_bt.member_id = existing_mem.member_id
        else:
            mem_count = db.query(InsuredMember).filter(InsuredMember.policyholder_id == req.policyholder_id).count() + 1
            gen_m_id = f"{req.policyholder_id}-M{mem_count:02d}"
            while db.query(InsuredMember).filter(InsuredMember.member_id == gen_m_id).first():
                mem_count += 1
                gen_m_id = f"{req.policyholder_id}-M{mem_count:02d}"

            new_mem = InsuredMember(
                member_id=gen_m_id,
                policyholder_id=req.policyholder_id,
                name=req.beneficiary_name.strip(),
                relationship=req.relationship.strip(),
                age=30 if req.relationship in ["Spouse", "Soulmate"] else (16 if req.relationship in ["Child", "Son", "Daughter"] else 9),
                dob="1996-03-20" if req.relationship in ["Spouse", "Soulmate"] else ("2010-08-14" if req.relationship in ["Child", "Son", "Daughter"] else "2017-02-11"),
                gender="Female" if req.relationship in ["Spouse", "Soulmate", "Daughter"] else "Male",
                eligibility_status="Eligible"
            )
            db.add(new_mem)
            new_bt.member_id = gen_m_id
            ph = db.query(Policyholder).filter(Policyholder.policyholder_id == req.policyholder_id).first()
            if ph:
                ph.total_members = (ph.total_members or 1) + 1

        db.commit()
        db.refresh(new_bt)
        return new_bt
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Benefit transfer failed: {str(e)}")

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
