import os
import shutil
import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.app.database.session import get_db
from backend.app.config import settings
from backend.app.models.claim import Claim, ClaimDocument, ClaimValidation, ClaimRecommendation, ClaimHistory
from backend.app.models.policy import Policy, Policyholder, InsuredMember
from backend.app.schemas.claim import (
    ClaimCreate, ClaimUpdate, ClaimResponse, ClaimDocumentResponse, 
    ClaimValidationResponse, ClaimRecommendationResponse,
    ClaimAnalysisResult, RecheckResult, ClaimSubmissionResult,
    AnalyticsSummaryResponse
)
from backend.app.validators.claim_validator import ClaimValidator
from backend.app.ml.claim_predictor import predictor
from backend.app.utils.pdf_generator import generate_claim_pdf_report

router = APIRouter(prefix="/claims", tags=["Claims"])

@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
def get_claims_analytics_summary(
    policyholder_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Claim)
    if policyholder_id:
        query = query.filter(Claim.policyholder_id == policyholder_id)
    
    claims = query.all()
    total = len(claims)
    
    if total == 0:
        return AnalyticsSummaryResponse(
            total_claims=0,
            pending_claims=0,
            approved_claims=0,
            rejected_claims=0,
            needs_correction_claims=0,
            ready_for_submission_claims=0,
            submitted_claims=0,
            average_confidence_score=0.0,
            status_distribution=[],
            type_distribution=[],
            failure_reasons_distribution=[],
            monthly_claim_amounts=[],
            confidence_score_ranges=[]
        )

    # Categorization counts
    approved = sum(1 for c in claims if "approved" in c.status.lower())
    rejected = sum(1 for c in claims if "reject" in c.status.lower() or "high risk" in c.status.lower())
    submitted = sum(1 for c in claims if c.status.upper() == "SUBMITTED")
    ready = sum(1 for c in claims if "ready" in c.status.lower())
    needs_corr = sum(1 for c in claims if "correction" in c.status.lower())
    pending = total - (approved + rejected + submitted)
    if pending < 0:
        pending = 0

    avg_conf = round(sum(c.confidence_score for c in claims) / total, 1)

    # Status Distribution
    status_map = {}
    for c in claims:
        st = c.status or "Under Review"
        status_map[st] = status_map.get(st, 0) + 1
    status_dist = [{"name": k, "value": v} for k, v in status_map.items()]

    # Type Distribution
    type_map = {}
    for c in claims:
        ct = c.claim_type or "Reimbursement"
        type_map[ct] = type_map.get(ct, 0) + 1
    type_dist = [{"name": k, "value": v} for k, v in type_map.items()]

    # Failure reasons from open recommendations / failed validations
    validations = db.query(ClaimValidation).filter(ClaimValidation.status.in_(["FAIL", "WARNING"])).all()
    failure_map = {}
    for v in validations:
        fname = v.factor_name
        failure_map[fname] = failure_map.get(fname, 0) + 1
    
    # Sort top failure reasons
    sorted_failures = sorted(failure_map.items(), key=lambda x: x[1], reverse=True)[:6]
    failure_dist = [{"name": k, "count": v} for k, v in sorted_failures]

    # Monthly claim amounts
    month_map = {}
    for c in claims:
        dstr = c.claim_submission_date or "2026-01-01"
        try:
            m = dstr[:7] # YYYY-MM
        except Exception:
            m = "2026-08"
        if m not in month_map:
            month_map[m] = {"month": m, "amount": 0.0, "claims_count": 0}
        month_map[m]["amount"] += c.claim_amount
        month_map[m]["claims_count"] += 1
    monthly_dist = sorted(list(month_map.values()), key=lambda x: x["month"])[-6:]

    # Confidence score ranges (80-100 High, 60-79 Med, 0-59 Low)
    high_conf = sum(1 for c in claims if c.confidence_score >= 80)
    med_conf = sum(1 for c in claims if 60 <= c.confidence_score < 80)
    low_conf = sum(1 for c in claims if c.confidence_score < 60)
    conf_ranges = [
        {"range": "High Confidence (80-100%)", "count": high_conf, "color": "#0d9488"},
        {"range": "Medium Confidence (60-79%)", "count": med_conf, "color": "#f59e0b"},
        {"range": "Low Confidence (0-59%)", "count": low_conf, "color": "#f43f5e"},
    ]

    return AnalyticsSummaryResponse(
        total_claims=total,
        pending_claims=pending,
        approved_claims=approved,
        rejected_claims=rejected,
        needs_correction_claims=needs_corr,
        ready_for_submission_claims=ready,
        submitted_claims=submitted,
        average_confidence_score=avg_conf,
        status_distribution=status_dist,
        type_distribution=type_dist,
        failure_reasons_distribution=failure_dist,
        monthly_claim_amounts=monthly_dist,
        confidence_score_ranges=conf_ranges
    )

@router.get("/recommendations/grouped")
def get_grouped_recommendations(
    policyholder_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ClaimRecommendation).join(Claim, ClaimRecommendation.claim_id == Claim.claim_id)
    if policyholder_id:
        query = query.filter(Claim.policyholder_id == policyholder_id)
    
    all_recs = query.filter(ClaimRecommendation.status == "Open").all()

    categories = {
        "Policy Issues": [],
        "Eligibility Issues": [],
        "Treatment Issues": [],
        "Authorization Issues": [],
        "Documentation Issues": [],
        "Amount / Coverage Issues": [],
        "Duplicate Claim Issues": []
    }

    for r in all_recs:
        claim = db.query(Claim).filter(Claim.claim_id == r.claim_id).first()
        rec_item = {
            "rec_id": r.rec_id,
            "claim_id": r.claim_id,
            "factor_number": r.factor_number,
            "issue_title": r.issue_title,
            "severity": r.severity,
            "explanation": r.explanation,
            "recommended_action": r.recommended_action,
            "status": r.status,
            "action_type": r.action_type,
            "patient_name": claim.patient_name if claim else "Unknown",
            "policy_number": claim.policy_number if claim else "Unknown",
            "claim_amount": claim.claim_amount if claim else 0.0,
            "created_at": r.created_at
        }

        fn = r.factor_number
        if fn in [1, 2, 3]:
            categories["Policy Issues"].append(rec_item)
        elif fn in [4]:
            categories["Eligibility Issues"].append(rec_item)
        elif fn in [5, 6, 7]:
            categories["Treatment Issues"].append(rec_item)
        elif fn in [8]:
            categories["Authorization Issues"].append(rec_item)
        elif fn in [11, 12, 13, 14]:
            categories["Documentation Issues"].append(rec_item)
        elif fn in [9, 10]:
            categories["Amount / Coverage Issues"].append(rec_item)
        elif fn in [15]:
            categories["Duplicate Claim Issues"].append(rec_item)
        else:
            categories["Documentation Issues"].append(rec_item)

    return {
        "total_open_recommendations": len(all_recs),
        "categories": [
            {"category_name": cat_name, "count": len(items), "items": items}
            for cat_name, items in categories.items()
        ]
    }

@router.get("", response_model=List[ClaimResponse])
def get_all_claims(
    search: Optional[str] = Query(None),
    policyholder_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    risk: Optional[str] = Query(None),
    claim_type: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Claim)
    if policyholder_id:
        query = query.filter(Claim.policyholder_id == policyholder_id)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Claim.claim_id.ilike(s)) |
            (Claim.patient_name.ilike(s)) |
            (Claim.policy_number.ilike(s)) |
            (Claim.disease_diagnosis.ilike(s)) |
            (Claim.hospital_name.ilike(s))
        )
    if status and status != "ALL":
        query = query.filter(Claim.status == status)
    if risk and risk != "ALL":
        query = query.filter(Claim.risk_level == risk)
    if claim_type and claim_type != "ALL":
        query = query.filter(Claim.claim_type == claim_type)

    return query.order_by(Claim.id.desc()).limit(limit).all()

@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim_by_id(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")
    return claim

@router.get("/{claim_id}/recommendations", response_model=List[ClaimRecommendationResponse])
def get_claim_recommendations(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")
    return claim.recommendations

@router.get("/{claim_id}/analysis", response_model=ClaimAnalysisResult)
def get_claim_analysis(claim_id: str, db: Session = Depends(get_db)):
    return validate_claim_live(claim_id, db)

def run_claim_reaudit(claim_id: str, db: Session, action_source: str = "System Audit"):
    """
    Central re-audit helper: re-runs the 16-factor validation engine on current claim state & attached documents,
    updates DB tables (claim, validations, recommendations, history), and ensures all 16 factors and scores stay in sync.
    """
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        return None, [], {}

    docs = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).all()
    validator = ClaimValidator(db)
    
    claim_dict = {
        "claim_id": claim.claim_id,
        "policy_number": claim.policy_number,
        "policyholder_id": claim.policyholder_id,
        "member_id": claim.member_id,
        "patient_name": claim.patient_name,
        "disease_diagnosis": claim.disease_diagnosis,
        "treatment_procedure": claim.treatment_procedure,
        "claim_amount": claim.claim_amount,
        "claim_submission_date": claim.claim_submission_date,
        "pre_auth_status": claim.pre_auth_status,
        "notes": claim.notes
    }

    factors, calc_summary = validator.validate_16_factors(claim_dict, docs)

    before_conf = claim.confidence_score
    before_status = claim.status

    claim.confidence_score = calc_summary["confidence_score"]
    claim.risk_level = calc_summary["risk_level"]
    # If already explicitly submitted, preserve SUBMITTED status
    if claim.status != "SUBMITTED":
        claim.status = calc_summary["status"]
    claim.estimated_claimable_amount = calc_summary["estimated_claimable_amount"]
    claim.deductible_applied = calc_summary["deductible"]
    claim.copay_applied = calc_summary["copay_amount"]
    claim.sublimit_applied = calc_summary["sublimit_applied"]

    # Refresh validations table
    db.query(ClaimValidation).filter(ClaimValidation.claim_id == claim_id).delete()
    for f in factors:
        db.add(ClaimValidation(
            claim_id=claim_id,
            factor_number=f["number"],
            factor_name=f["name"],
            status=f["status"],
            message=f["message"],
            details=f["details"]
        ))

    # Synchronize recommendations
    for f in factors:
        if f["status"] == "PASS":
            recs_for_f = db.query(ClaimRecommendation).filter(
                ClaimRecommendation.claim_id == claim_id,
                ClaimRecommendation.factor_number == f["number"]
            ).all()
            for r in recs_for_f:
                r.status = "Fixed"
                r.fixed_at = datetime.utcnow()
        elif f["status"] in ["FAIL", "WARNING"]:
            existing_rec = db.query(ClaimRecommendation).filter(
                ClaimRecommendation.claim_id == claim_id,
                ClaimRecommendation.factor_number == f["number"]
            ).first()
            if existing_rec:
                existing_rec.status = "Open"
                existing_rec.severity = "HIGH" if f["status"] == "FAIL" else "MEDIUM"
                existing_rec.issue_title = f"{f['name']} ({f['status']})"
                existing_rec.explanation = f["details"]
                existing_rec.recommended_action = f"Please resolve {f['name']}: {f['message']}"
            else:
                db.add(ClaimRecommendation(
                    rec_id=f"REC-{claim_id}-F{f['number']}",
                    claim_id=claim_id,
                    factor_number=f["number"],
                    issue_title=f"{f['name']} ({f['status']})",
                    severity="HIGH" if f["status"] == "FAIL" else "MEDIUM",
                    explanation=f["details"],
                    recommended_action=f"Please resolve {f['name']}: {f['message']}",
                    status="Open",
                    action_type="UPLOAD" if any(k in f["name"] for k in ["Document", "Bill", "Auth"]) else "EDIT"
                ))

    # Log history if status or score changed
    if before_conf != claim.confidence_score or before_status != claim.status:
        db.add(ClaimHistory(
            claim_id=claim_id,
            action=action_source,
            previous_status=before_status,
            new_status=claim.status,
            previous_confidence=before_conf,
            new_confidence=claim.confidence_score,
            actor="CLAIMGUARD Audit Engine",
            notes=f"{action_source}: Score updated from {before_conf:.1f}% to {claim.confidence_score:.1f}% ({claim.status})."
        ))

    db.commit()
    db.refresh(claim)
    return claim, factors, calc_summary

@router.post("", response_model=ClaimResponse)
def create_new_claim(claim_in: ClaimCreate, db: Session = Depends(get_db)):
    # Verify policy exists
    policy = db.query(Policy).filter(Policy.policy_number == claim_in.policy_number).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found in registry")

    # Generate unique sequence claim ID
    count = db.query(Claim).count() + 1
    date_code = datetime.utcnow().strftime("%Y%m%d")
    new_claim_id = f"CLM{date_code}{count:04d}"
    submission_date = claim_in.claim_submission_date or datetime.utcnow().strftime("%Y-%m-%d")

    # Run 16-factor validation
    validator = ClaimValidator(db)
    claim_dict = {
        "claim_id": new_claim_id,
        "policy_number": claim_in.policy_number,
        "policyholder_id": claim_in.policyholder_id,
        "member_id": claim_in.member_id,
        "patient_name": claim_in.patient_name,
        "disease_diagnosis": claim_in.disease_diagnosis,
        "treatment_procedure": claim_in.treatment_procedure,
        "claim_amount": claim_in.claim_amount,
        "claim_submission_date": submission_date,
        "pre_auth_status": claim_in.pre_auth_status or "Approved",
        "notes": claim_in.notes
    }

    factors, calc_summary = validator.validate_16_factors(claim_dict, [])

    # ML prediction
    ml_res = predictor.predict_risk({
        "policy_status": policy.status,
        "eligibility": "Eligible",
        "treatment_coverage": "covered" if "PASS" in [f["status"] for f in factors if f["number"] == 7] else "not covered",
        "pre_auth": claim_in.pre_auth_status or "Approved",
        "claim_amount": claim_in.claim_amount,
        "total_coverage": policy.sum_insured,
        "has_bill": False,
        "doc_verified": False,
        "is_accurate": True,
        "is_duplicate": False
    })

    new_claim = Claim(
        claim_id=new_claim_id,
        policyholder_id=claim_in.policyholder_id,
        member_id=claim_in.member_id,
        policy_number=claim_in.policy_number,
        patient_name=claim_in.patient_name,
        disease_diagnosis=claim_in.disease_diagnosis,
        treatment_procedure=claim_in.treatment_procedure,
        claim_submission_date=submission_date,
        claim_type=claim_in.claim_type or "Reimbursement",
        hospital_name=claim_in.hospital_name or "Apollo Multispeciality Hospital",
        hospital_type=claim_in.hospital_type or "Network Hospital",
        admission_date=claim_in.admission_date,
        discharge_date=claim_in.discharge_date,
        emergency_or_planned=claim_in.emergency_or_planned or "Planned Treatment",
        bank_account_holder=claim_in.bank_account_holder,
        bank_account_number=claim_in.bank_account_number,
        bank_ifsc=claim_in.bank_ifsc,
        pan_number=claim_in.pan_number,
        doctor_name=claim_in.doctor_name,
        pre_auth_number=claim_in.pre_auth_number,
        claim_amount=claim_in.claim_amount,
        estimated_claimable_amount=calc_summary["estimated_claimable_amount"],
        deductible_applied=calc_summary["deductible"],
        copay_applied=calc_summary["copay_amount"],
        sublimit_applied=calc_summary["sublimit_applied"],
        confidence_score=calc_summary["confidence_score"],
        risk_level=calc_summary["risk_level"],
        ml_predicted_prob=ml_res["denial_probability"],
        status=calc_summary["status"],
        pre_auth_status=claim_in.pre_auth_status or "Approved",
        notes=claim_in.notes or f"Created with 16-factor evaluation: {calc_summary['passed_factors']} Passed."
    )
    db.add(new_claim)

    # Save 16 validations
    for f in factors:
        db.add(ClaimValidation(
            claim_id=new_claim_id,
            factor_number=f["number"],
            factor_name=f["name"],
            status=f["status"],
            message=f["message"],
            details=f["details"]
        ))

    # Save recommendations for non-PASS factors
    rec_idx = 1
    for f in factors:
        if f["status"] in ["FAIL", "WARNING"]:
            db.add(ClaimRecommendation(
                rec_id=f"REC-{new_claim_id}-{rec_idx}",
                claim_id=new_claim_id,
                factor_number=f["number"],
                issue_title=f"{f['name']} ({f['status']})",
                severity="HIGH" if f["status"] == "FAIL" else "MEDIUM",
                explanation=f["details"],
                recommended_action=f"Please resolve {f['name']}: {f['message']}",
                status="Open",
                action_type="UPLOAD" if "Document" in f["name"] or "Bill" in f["name"] or "Auth" in f["name"] else "EDIT"
            ))
            rec_idx += 1

    # Save history
    db.add(ClaimHistory(
        claim_id=new_claim_id,
        action="Created & 16-Factor Evaluated",
        previous_status=None,
        new_status=calc_summary["status"],
        previous_confidence=None,
        new_confidence=calc_summary["confidence_score"],
        actor="Provider / System",
        notes="New claim registered and initial denial prevention scan executed."
    ))

    db.commit()
    db.refresh(new_claim)
    return new_claim

@router.put("/{claim_id}", response_model=ClaimResponse)
def update_claim_details(claim_id: str, update_in: ClaimUpdate, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")

    update_dict = update_in.dict(exclude_unset=True)
    for field, val in update_dict.items():
        if hasattr(claim, field) and val is not None:
            setattr(claim, field, val)

    db.commit()
    db.refresh(claim)

    # Automatically re-audit claim factors with new data
    updated_claim, _, _ = run_claim_reaudit(claim_id, db, action_source="Claim Fields Updated")
    return updated_claim

@router.post("/{claim_id}/submit", response_model=ClaimSubmissionResult)
def submit_final_claim(claim_id: str, db: Session = Depends(get_db)):
    """
    Final Submission Gate:
    Runs full 16-factor validation. If all mandatory checks pass, transitions claim to SUBMITTED status.
    If mandatory checks fail, rejects submission with specific missing items.
    """
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")

    # Run fresh validation
    updated_claim, factors, calc_summary = run_claim_reaudit(claim_id, db, action_source="Pre-Submission Final Validation")
    
    # Check for mandatory failures
    failed_factors = [f for f in factors if f["status"] == "FAIL"]
    if failed_factors:
        error_msgs = [f"Factor {f['number']} ({f['name']}): {f['message']}" for f in failed_factors]
        raise HTTPException(
            status_code=400, 
            detail={
                "message": "Claim cannot be submitted because mandatory validation requirements are not satisfied.",
                "failed_factors_count": len(failed_factors),
                "reasons": error_msgs
            }
        )

    # Perform submission
    sub_timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    prev_status = claim.status
    claim.status = "SUBMITTED"
    claim.updated_at = datetime.utcnow()

    db.add(ClaimHistory(
        claim_id=claim_id,
        action="Final Claim Submitted to Insurer",
        previous_status=prev_status,
        new_status="SUBMITTED",
        previous_confidence=claim.confidence_score,
        new_confidence=claim.confidence_score,
        actor="Provider (Dr. Arvind Sharma)",
        notes=f"All 16 factors verified ({claim.confidence_score:.1f}% confidence). Dispatched to insurance processing network."
    ))

    db.commit()
    db.refresh(claim)

    return ClaimSubmissionResult(
        success=True,
        claim_id=claim.claim_id,
        status="SUBMITTED",
        message="Your claim has passed the configured pre-submission validation checks and has been submitted for further processing.",
        claim_amount=claim.claim_amount,
        estimated_claimable_amount=claim.estimated_claimable_amount,
        confidence_score=claim.confidence_score,
        denial_chance_score=round(max(0.0, min(100.0, 100.0 - claim.confidence_score)), 1),
        submitted_at=sub_timestamp,
        policy_number=claim.policy_number,
        patient_name=claim.patient_name,
        claim_type=claim.claim_type
    )

@router.post("/{claim_id}/documents", response_model=ClaimDocumentResponse)
def upload_claim_document(
    claim_id: str,
    document_type: str = Form(...),
    document_name: Optional[str] = Form(None),
    verification_status: Optional[str] = Form("Pending Review"),
    is_required: Optional[bool] = Form(True),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension '.{ext}' not supported. Allowed: PDF, JPG, JPEG, PNG")

    doc_count = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).count() + 1
    safe_filename = f"{claim_id}_{doc_count}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"File size exceeds maximum {settings.MAX_UPLOAD_SIZE_MB}MB")

    doc_obj = ClaimDocument(
        doc_id=f"DOC-{claim_id}-{doc_count:02d}",
        claim_id=claim_id,
        document_name=document_name or file.filename,
        document_type=document_type,
        filename=safe_filename,
        file_path=file_path,
        file_size_bytes=file_size,
        mime_type=file.content_type or f"application/{ext}",
        format_valid=True,
        is_required=is_required if is_required is not None else True,
        verification_status=verification_status or "Pending Review"
    )
    db.add(doc_obj)
    db.commit()
    db.refresh(doc_obj)

    # Automatically re-audit claim factors so score and validations update immediately
    run_claim_reaudit(claim_id, db, action_source=f"Document Uploaded ({document_type})")

    return doc_obj

@router.post("/{claim_id}/documents/{doc_id}/verify")
def verify_single_document(claim_id: str, doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id, ClaimDocument.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.verification_status = "Verified"
    db.commit()

    # Automatically re-audit claim
    updated_claim, _, _ = run_claim_reaudit(claim_id, db, action_source=f"Document {doc_id} Verified")

    return {
        "message": f"Document {doc_id} verified successfully.",
        "verification_status": "Verified",
        "confidence_score": updated_claim.confidence_score if updated_claim else None,
        "status": updated_claim.status if updated_claim else None
    }

@router.post("/{claim_id}/documents/verify-all")
def verify_all_documents(claim_id: str, db: Session = Depends(get_db)):
    docs = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).all()
    if not docs:
        raise HTTPException(status_code=404, detail="No documents found for this claim")
    for d in docs:
        d.verification_status = "Verified"
    db.commit()

    updated_claim, _, _ = run_claim_reaudit(claim_id, db, action_source="All Documents Verified")
    return {
        "message": f"All {len(docs)} documents verified successfully.",
        "confidence_score": updated_claim.confidence_score if updated_claim else None,
        "status": updated_claim.status if updated_claim else None
    }

@router.post("/{claim_id}/documents/{doc_id}/reject")
def reject_single_document(claim_id: str, doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id, ClaimDocument.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.verification_status = "Rejected"
    db.commit()

    # Automatically re-audit claim
    run_claim_reaudit(claim_id, db, action_source=f"Document {doc_id} Rejected")

    return {"message": f"Document {doc_id} marked as Rejected.", "verification_status": "Rejected"}

@router.post("/{claim_id}/validate", response_model=ClaimAnalysisResult)
def validate_claim_live(claim_id: str, db: Session = Depends(get_db)):
    claim, factors, calc_summary = run_claim_reaudit(claim_id, db, action_source="Live Validation Engine Scan")
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    docs = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).all()
    validation_objs = db.query(ClaimValidation).filter(ClaimValidation.claim_id == claim_id).order_by(ClaimValidation.factor_number.asc()).all()
    recs = db.query(ClaimRecommendation).filter(ClaimRecommendation.claim_id == claim_id).all()

    ml_res = predictor.predict_risk({
        "policy_status": "Active",
        "eligibility": "Eligible",
        "treatment_coverage": "covered",
        "pre_auth": claim.pre_auth_status,
        "claim_amount": claim.claim_amount,
        "total_coverage": 1000000,
        "has_bill": len(docs) > 0,
        "doc_verified": any(d.verification_status == "Verified" for d in docs),
        "is_accurate": True,
        "is_duplicate": False
    })

    return ClaimAnalysisResult(
        claim_id=claim.claim_id,
        policy_number=claim.policy_number,
        patient_name=claim.patient_name,
        disease_diagnosis=claim.disease_diagnosis,
        treatment_procedure=claim.treatment_procedure,
        claim_amount=claim.claim_amount,
        estimated_claimable_amount=claim.estimated_claimable_amount,
        confidence_score=claim.confidence_score,
        denial_chance_score=calc_summary.get("denial_chance_score", round(max(0.0, min(100.0, 100.0 - claim.confidence_score)), 1)),
        risk_level=claim.risk_level,
        status=claim.status,
        passed_factors=calc_summary["passed_factors"],
        warning_factors=calc_summary["warning_factors"],
        failed_factors=calc_summary["failed_factors"],
        validations=validation_objs,
        recommendations=recs,
        documents=docs,
        calculation_breakdown=calc_summary,
        ml_prediction=ml_res
    )

@router.post("/{claim_id}/recommendations/{rec_id}/fix")
def fix_claim_recommendation(claim_id: str, rec_id: str, db: Session = Depends(get_db)):
    rec = db.query(ClaimRecommendation).filter(
        ClaimRecommendation.claim_id == claim_id,
        ClaimRecommendation.rec_id == rec_id
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = "Fixed"
    rec.fixed_at = datetime.utcnow()

    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    policy = db.query(Policy).filter(Policy.policy_number == claim.policy_number).first()
    policyholder = db.query(Policyholder).filter(Policyholder.policyholder_id == claim.policyholder_id).first()
    fn = rec.factor_number

    # Factor 1: Policy Status -> Reactivate policy
    if fn == 1 and policy:
        policy.status = "Active"
        if policyholder:
            policyholder.policy_status = "Active"

    # Factor 2: Policy Start & End Date -> Ensure policy tenure covers claim date
    if fn == 2 and policy:
        policy.status = "Active"
        policy.start_date = "2024-01-01"
        policy.end_date = "2027-12-31"
        if policyholder:
            policyholder.policy_status = "Active"

    # Factor 3: Total Policy Coverage Amount
    if fn == 3 and policy:
        needed = max(policy.sum_insured, claim.claim_amount + 500000)
        policy.sum_insured = needed
        policy.available_coverage = max(policy.available_coverage, claim.claim_amount + 200000)

    # Factor 4: Patient / Member Eligibility
    if fn == 4:
        if claim.member_id:
            m = db.query(InsuredMember).filter(InsuredMember.member_id == claim.member_id).first()
            if m:
                m.eligibility_status = "Eligible"
                m.waiting_period_days = 0
        if policyholder:
            policyholder.policy_status = "Active"
        if policy:
            policy.status = "Active"

    # Factor 5 & 7: Diagnosis & Treatment Coverage
    if fn in [5, 7]:
        if "cosmetic" in claim.disease_diagnosis.lower() or "rhinoplasty" in claim.disease_diagnosis.lower():
            claim.disease_diagnosis = "Deviated Septum & Nasal Reconstruction"
            claim.treatment_procedure = "Functional Septorhinoplasty"
        elif "dental" in claim.disease_diagnosis.lower() or "caries" in claim.disease_diagnosis.lower():
            claim.disease_diagnosis = "Maxillofacial Trauma / Infection"
            claim.treatment_procedure = "Emergency Surgical Dental Debridement"
        if policy:
            policy.coverage_type = "Comprehensive Health Insurance"

    # Factor 6: Treatment / Procedure Protocol
    if fn == 6:
        if "rhinoplasty" in claim.treatment_procedure.lower():
            claim.treatment_procedure = "Functional Septorhinoplasty"

    # Factor 8: Pre-Authorization Status
    if fn == 8:
        claim.pre_auth_status = "Approved"

    # Factor 9 & 10: Claim Amount vs Policy Coverage
    if fn in [9, 10] and policy:
        needed = max(policy.sum_insured, claim.claim_amount + 500000)
        policy.sum_insured = needed
        policy.available_coverage = max(policy.available_coverage, claim.claim_amount + 200000)

    # Factor 11: Bill Upload
    if fn == 11:
        doc_count = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).count() + 1
        db.add(ClaimDocument(
            doc_id=f"DOC-{claim_id}-{doc_count:02d}",
            claim_id=claim_id,
            document_name="Certified Final Itemized Bill",
            document_type="Final Itemized Bill",
            filename="hospital_final_bill.pdf",
            file_path=os.path.join(settings.UPLOAD_DIR, "hospital_final_bill.pdf"),
            file_size_bytes=245000,
            mime_type="application/pdf",
            format_valid=True,
            is_required=True,
            verification_status="Verified"
        ))

    # Factor 12: Required Documents
    if fn == 12:
        doc_count = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).count() + 1
        db.add(ClaimDocument(
            doc_id=f"DOC-{claim_id}-{doc_count:02d}",
            claim_id=claim_id,
            document_name="Certified Medical Discharge Summary",
            document_type="Hospital Discharge Summary",
            filename="discharge_summary.pdf",
            file_path=os.path.join(settings.UPLOAD_DIR, "discharge_summary.pdf"),
            file_size_bytes=195000,
            mime_type="application/pdf",
            format_valid=True,
            is_required=True,
            verification_status="Verified"
        ))

    # Factor 13 & 14: Documentation Verification & Accuracy
    if fn in [13, 14]:
        docs = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).all()
        for d in docs:
            d.verification_status = "Verified"
        if not any("bill" in d.document_type.lower() for d in docs):
            doc_count = len(docs) + 1
            db.add(ClaimDocument(
                doc_id=f"DOC-{claim_id}-{doc_count:02d}",
                claim_id=claim_id,
                document_name="Certified Final Itemized Bill",
                document_type="Final Itemized Bill",
                filename="hospital_final_bill.pdf",
                file_path=os.path.join(settings.UPLOAD_DIR, "hospital_final_bill.pdf"),
                file_size_bytes=245000,
                mime_type="application/pdf",
                format_valid=True,
                is_required=True,
                verification_status="Verified"
            ))

    # Factor 15: Duplicate Claim Check
    if fn == 15:
        claim.notes = (claim.notes or "").replace("Duplicate", "").replace("duplicate", "").strip()

    # Factor 16: Claim Submission Date
    if fn == 16:
        claim.claim_submission_date = datetime.utcnow().strftime("%Y-%m-%d")

    db.commit()

    # Automatically re-audit claim
    updated_claim, _, _ = run_claim_reaudit(claim_id, db, action_source=f"Recommendation {rec_id} Resolved")

    return {
        "message": f"Recommendation {rec_id} resolved and claim re-audited.",
        "status": "Fixed",
        "confidence_score": updated_claim.confidence_score if updated_claim else None,
        "claim_status": updated_claim.status if updated_claim else None
    }

@router.post("/{claim_id}/auto-fix-all", response_model=RecheckResult)
def auto_fix_all_claim_issues(claim_id: str, db: Session = Depends(get_db)):
    """
    1-Click Fix: Resolves all open recommendations across all 16 factors,
    reactivates policy, approves pre-auth, expands coverage, attaches verified bills & discharge summary,
    and triggers live recheck.
    """
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    policy = db.query(Policy).filter(Policy.policy_number == claim.policy_number).first()
    policyholder = db.query(Policyholder).filter(Policyholder.policyholder_id == claim.policyholder_id).first()

    # 1. Reactivate policy and align dates
    if policy:
        policy.status = "Active"
        policy.start_date = "2024-01-01"
        policy.end_date = "2027-12-31"
        needed = max(policy.sum_insured, claim.claim_amount + 500000)
        policy.sum_insured = needed
        policy.available_coverage = max(policy.available_coverage, claim.claim_amount + 200000)

    if policyholder:
        policyholder.policy_status = "Active"

    # 2. Member eligibility
    if claim.member_id:
        m = db.query(InsuredMember).filter(InsuredMember.member_id == claim.member_id).first()
        if m:
            m.eligibility_status = "Eligible"
            m.waiting_period_days = 0

    # 3. Align disease / procedure if excluded
    if "cosmetic" in claim.disease_diagnosis.lower() or "rhinoplasty" in claim.disease_diagnosis.lower():
        claim.disease_diagnosis = "Deviated Septum & Nasal Reconstruction"
        claim.treatment_procedure = "Functional Septorhinoplasty"
    elif "dental" in claim.disease_diagnosis.lower() or "caries" in claim.disease_diagnosis.lower():
        claim.disease_diagnosis = "Maxillofacial Trauma / Infection"
        claim.treatment_procedure = "Emergency Surgical Dental Debridement"

    # 4. Approve Pre-Auth
    if "approved" not in claim.pre_auth_status.lower():
        claim.pre_auth_status = "Approved"

    # 5. Attach verified bill and discharge summary if missing
    docs = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).all()
    for d in docs:
        d.verification_status = "Verified"

    if not any("bill" in d.document_type.lower() for d in docs):
        doc_count = len(docs) + 1
        db.add(ClaimDocument(
            doc_id=f"DOC-{claim_id}-{doc_count:02d}",
            claim_id=claim_id,
            document_name="Hospital Final Itemized Bill (Certified)",
            document_type="Final Itemized Bill",
            filename="hospital_final_bill_verified.pdf",
            file_path=os.path.join(settings.UPLOAD_DIR, "hospital_final_bill.pdf"),
            file_size_bytes=245000,
            mime_type="application/pdf",
            format_valid=True,
            is_required=True,
            verification_status="Verified"
        ))

    if not any("discharge" in d.document_type.lower() or "summary" in d.document_type.lower() for d in docs):
        doc_count = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).count() + 1
        db.add(ClaimDocument(
            doc_id=f"DOC-{claim_id}-{doc_count:02d}",
            claim_id=claim_id,
            document_name="Signed Medical Discharge Summary",
            document_type="Hospital Discharge Summary",
            filename="discharge_summary_verified.pdf",
            file_path=os.path.join(settings.UPLOAD_DIR, "discharge_summary.pdf"),
            file_size_bytes=180000,
            mime_type="application/pdf",
            format_valid=True,
            is_required=True,
            verification_status="Verified"
        ))

    # 6. Clear duplicate notes and align submission date
    claim.notes = (claim.notes or "").replace("Duplicate", "").replace("duplicate", "").strip()
    claim.claim_submission_date = datetime.utcnow().strftime("%Y-%m-%d")

    # 7. Mark all recommendations as fixed
    recs = db.query(ClaimRecommendation).filter(ClaimRecommendation.claim_id == claim_id).all()
    for r in recs:
        r.status = "Fixed"
        r.fixed_at = datetime.utcnow()

    db.commit()

    # 8. Now execute recheck
    return recheck_claim(claim_id, db)

@router.post("/{claim_id}/recheck", response_model=RecheckResult)
def recheck_claim(claim_id: str, db: Session = Depends(get_db)):
    """
    Live Recheck: Re-runs the 16-factor validation engine on current documents,
    current pre-auth status, and current policy conditions and returns before/after comparisons.
    """
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    before_conf = claim.confidence_score
    before_risk = claim.risk_level
    before_status = claim.status
    open_recs_before = db.query(ClaimRecommendation).filter(
        ClaimRecommendation.claim_id == claim_id,
        ClaimRecommendation.status == "Open"
    ).count()

    updated_claim, factors, calc_summary = run_claim_reaudit(claim_id, db, action_source="Live Recheck Executed")

    open_recs_after = db.query(ClaimRecommendation).filter(
        ClaimRecommendation.claim_id == claim_id,
        ClaimRecommendation.status == "Open"
    ).count()

    improvements = []
    if updated_claim.confidence_score > before_conf:
        improvements.append(f"Confidence score improved from {before_conf:.1f}% to {updated_claim.confidence_score:.1f}% (+{updated_claim.confidence_score - before_conf:.1f}%)")
    elif open_recs_after > 0:
        improvements.append(f"Re-audit completed. {open_recs_after} unresolved item(s) require action before final submission.")
    else:
        improvements.append(f"All 16 factors verified. Current status: {updated_claim.status}.")

    val_objs = db.query(ClaimValidation).filter(ClaimValidation.claim_id == claim_id).order_by(ClaimValidation.factor_number.asc()).all()
    updated_recs = db.query(ClaimRecommendation).filter(ClaimRecommendation.claim_id == claim_id).all()

    return RecheckResult(
        claim_id=claim_id,
        before_confidence=before_conf,
        before_denial_chance=round(max(0.0, min(100.0, 100.0 - before_conf)), 1),
        before_risk=before_risk,
        before_status=before_status,
        before_issues_count=open_recs_before,
        after_confidence=updated_claim.confidence_score,
        after_denial_chance=round(max(0.0, min(100.0, 100.0 - updated_claim.confidence_score)), 1),
        after_risk=updated_claim.risk_level,
        after_status=updated_claim.status,
        after_issues_count=open_recs_after,
        after_estimated_claimable_amount=updated_claim.estimated_claimable_amount,
        improvements=improvements,
        validations=val_objs,
        recommendations=updated_recs
    )

@router.get("/{claim_id}/pdf")
def download_claim_pdf(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    validations = db.query(ClaimValidation).filter(ClaimValidation.claim_id == claim_id).order_by(ClaimValidation.factor_number.asc()).all()
    recommendations = db.query(ClaimRecommendation).filter(ClaimRecommendation.claim_id == claim_id).all()

    claim_data = {
        "claim_id": claim.claim_id,
        "patient_name": claim.patient_name,
        "policy_number": claim.policy_number,
        "disease_diagnosis": claim.disease_diagnosis,
        "treatment_procedure": claim.treatment_procedure,
        "claim_amount": claim.claim_amount,
        "estimated_claimable_amount": claim.estimated_claimable_amount,
        "confidence_score": claim.confidence_score,
        "risk_level": claim.risk_level,
        "status": claim.status,
        "validations": [{"factor_number": v.factor_number, "factor_name": v.factor_name, "status": v.status, "message": v.message} for v in validations],
        "recommendations": [{"severity": r.severity, "issue_title": r.issue_title, "recommended_action": r.recommended_action} for r in recommendations]
    }

    pdf_path = generate_claim_pdf_report(claim_data)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"ClaimGuard_PreSubmission_Audit_{claim_id}.pdf"
    )
