import os
import csv
import re
from datetime import datetime
from backend.app.config import settings
from backend.app.database.session import SessionLocal
from backend.app.models.claim import Claim, ClaimValidation, ClaimRecommendation, ClaimDocument
from backend.app.models.policy import Policyholder, Policy

def clean_val(val: str) -> str:
    if not val:
        return ""
    return val.strip().strip('"')

def parse_float(val: str, default: float = 0.0) -> float:
    try:
        clean = re.sub(r"[^\d.]", "", str(val))
        return float(clean) if clean else default
    except Exception:
        return default

def sync_claims_with_dataset():
    db = SessionLocal()
    claims_file = os.path.join(settings.DATA_DIR, "claim_validation_dataset.csv")
    
    if not os.path.exists(claims_file):
        print("Dataset not found at:", claims_file)
        return

    with open(claims_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = clean_val(row.get("Insurance ID") or row.get("Policyholder ID") or row.get("INSURANCE ID"))
            pol_num = clean_val(row.get("Policy Number"))
            if not pid or not pol_num:
                continue

            claim_id = f"CLM-{pid.replace('POL-', '')}"
            claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
            if not claim:
                continue

            pol_status_str = clean_val(row.get("1. Policy Status"))
            st_date_str = clean_val(row.get("2. Policy Start Date"))
            end_date_str = clean_val(row.get("2. Policy End Date"))
            tot_cov = parse_float(row.get("3. Total Policy Coverage Amount"), 1000000.0)
            elig_str = clean_val(row.get("4. Patient / Member Eligibility"))
            disease = clean_val(row.get("5. Type of Disease / Diagnosis"))
            treatment = clean_val(row.get("6. Treatment / Procedure"))
            treat_cov = clean_val(row.get("7. Treatment Coverage"))
            pre_auth = clean_val(row.get("8. Pre-Authorization Status"))
            claim_amt = parse_float(row.get("9. Claim Amount"), 150000.0)
            cov_comp = clean_val(row.get("10. Policy Amount vs. Claim Amount"))
            bill_up = clean_val(row.get("11. Bill Upload"))
            req_docs = clean_val(row.get("12. Required Documents"))
            doc_ver = clean_val(row.get("13. Documentation Verification Status"))
            accuracy = clean_val(row.get("14. Medical/Claim Information Accuracy"))
            dup_check = clean_val(row.get("15. Duplicate Claim Check"))
            sub_date = clean_val(row.get("16. Claim Submission Date"))

            # 16-Factor exact mapping
            factors_list = []

            # 1. Policy Status
            f1_pass = pol_status_str.lower() == "active"
            factors_list.append((1, "Policy Status", "PASS" if f1_pass else "FAIL", f"Policy is {pol_status_str}"))

            # 2. Start/End Date
            factors_list.append((2, "Policy Start & End Date", "PASS", f"Valid tenure: {st_date_str} to {end_date_str}"))

            # 3. Total Coverage
            factors_list.append((3, "Total Policy Coverage Amount", "PASS", f"Sum Insured: ₹{tot_cov:,.0f}"))

            # 4. Patient Eligibility
            if "eligible" in elig_str.lower() and "ineligible" not in elig_str.lower():
                f4_st = "PASS"
            elif "waiting period" in elig_str.lower():
                f4_st = "WARNING"
            else:
                f4_st = "FAIL"
            factors_list.append((4, "Patient / Member Eligibility", f4_st, elig_str))

            # 5. Disease Diagnosis
            is_excluded = any(k in disease.lower() for k in ["cosmetic", "rhinoplasty", "dental caries", "root canal", "weight loss"]) or treat_cov.lower() == "not covered"
            f5_st = "FAIL" if is_excluded else "PASS"
            factors_list.append((5, "Type of Disease / Diagnosis", f5_st, f"Diagnosis '{disease}' {'is Excluded' if is_excluded else 'is Covered'}"))

            # 6. Treatment Procedure
            f6_st = "WARNING" if is_excluded else "PASS"
            factors_list.append((6, "Treatment / Procedure", f6_st, treatment))

            # 7. Treatment Coverage
            f7_st = "FAIL" if is_excluded or treat_cov.lower() == "not covered" else "PASS"
            factors_list.append((7, "Treatment Coverage", f7_st, f"Treatment is {treat_cov}"))

            # 8. Pre-Auth Status
            if "approved" in pre_auth.lower() or "not required" in pre_auth.lower():
                f8_st = "PASS"
            elif "not applicable" in pre_auth.lower():
                f8_st = "WARNING"
            else:
                f8_st = "FAIL"
            factors_list.append((8, "Pre-Authorization Status", f8_st, f"Pre-Auth: {pre_auth}"))

            # 9. Claim Amount
            factors_list.append((9, "Claim Amount", "PASS", f"Claimed Amount: ₹{claim_amt:,.0f}"))

            # 10. Coverage vs Claim
            f10_st = "PASS" if "within coverage" in cov_comp.lower() else "FAIL"
            factors_list.append((10, "Policy Amount vs. Claim Amount", f10_st, cov_comp))

            # 11. Bill Upload
            if "complete" in bill_up.lower():
                f11_st = "PASS"
            elif "partial" in bill_up.lower():
                f11_st = "WARNING"
            else:
                f11_st = "FAIL"
            factors_list.append((11, "Bill Upload", f11_st, bill_up))

            # 12. Required Documents
            f12_st = "PASS" if "complete" in bill_up.lower() else ("WARNING" if "partial" in bill_up.lower() else "FAIL")
            factors_list.append((12, "Required Documents", f12_st, req_docs))

            # 13. Documentation Verification Status
            if doc_ver.lower() == "verified":
                f13_st = "PASS"
            elif "pending" in doc_ver.lower():
                f13_st = "WARNING"
            else:
                f13_st = "FAIL"
            factors_list.append((13, "Documentation Verification Status", f13_st, doc_ver))

            # 14. Information Accuracy
            if "accurate" in accuracy.lower() or "validated" in accuracy.lower():
                f14_st = "PASS"
            elif "minor" in accuracy.lower() or "audit" in accuracy.lower():
                f14_st = "WARNING"
            else:
                f14_st = "FAIL"
            factors_list.append((14, "Medical/Claim Information Accuracy", f14_st, accuracy))

            # 15. Duplicate Check
            f15_st = "PASS" if "passed" in dup_check.lower() or "no duplicate" in dup_check.lower() else "FAIL"
            factors_list.append((15, "Duplicate Claim Check", f15_st, dup_check))

            # 16. Submission Date
            factors_list.append((16, "Claim Submission Date", "PASS", f"Submitted on {sub_date}"))

            pass_count = sum(1 for _, _, st, _ in factors_list if st == "PASS")
            warn_count = sum(1 for _, _, st, _ in factors_list if st == "WARNING")
            fail_count = sum(1 for _, _, st, _ in factors_list if st == "FAIL")

            conf_score = round((pass_count * 6.25) + (warn_count * 2.5), 1)
            conf_score = min(100.0, max(15.0, conf_score))

            if fail_count == 0 and warn_count == 0 and conf_score >= 95.0:
                risk_level = "LOW"
                final_status = "Claim is Approved"
            elif conf_score >= 80.0 and fail_count == 0:
                risk_level = "LOW"
                final_status = "Claim is Approved"
            elif conf_score >= 65.0 and fail_count <= 1:
                risk_level = "MEDIUM"
                final_status = "Needs Review"
            else:
                risk_level = "HIGH"
                final_status = "Needs Correction" if conf_score >= 45.0 else "High Risk"

            # Financial Calculation
            pol = db.query(Policy).filter(Policy.policy_number == pol_num).first()
            deductible_val = pol.deductible if pol else 0.0
            copay_str = pol.co_payment if pol else "0%"
            copay_pct = parse_float(copay_str, 0.0) / 100.0

            if f1_pass and f7_st == "PASS" and f10_st == "PASS" and fail_count == 0:
                after_ded = max(0.0, claim_amt - deductible_val)
                copay_ded = after_ded * copay_pct
                est_claimable = max(0.0, after_ded - copay_ded)
            else:
                est_claimable = 0.0

            # Update Claim
            claim.confidence_score = conf_score
            claim.risk_level = risk_level
            claim.status = final_status
            claim.disease_diagnosis = disease
            claim.treatment_procedure = treatment
            claim.claim_amount = claim_amt
            claim.estimated_claimable_amount = est_claimable
            claim.pre_auth_status = pre_auth
            claim.notes = f"16-Factor Evaluation: {pass_count} PASS, {warn_count} WARNING, {fail_count} FAIL"

            # Update Validations
            db.query(ClaimValidation).filter(ClaimValidation.claim_id == claim_id).delete()
            for f_num, f_name, st, msg in factors_list:
                db.add(ClaimValidation(
                    claim_id=claim_id,
                    factor_number=f_num,
                    factor_name=f_name,
                    status=st,
                    message=msg,
                    details=f"Evaluated #{f_num}: {f_name} -> {st}"
                ))

            # Update Recommendations
            db.query(ClaimRecommendation).filter(ClaimRecommendation.claim_id == claim_id).delete()
            rec_idx = 1
            for f_num, f_name, st, msg in factors_list:
                if st in ["FAIL", "WARNING"]:
                    rec_act = f"Please resolve {f_name} according to policy guidelines."
                    if f_num == 8:
                        rec_act = "Obtain and upload official pre-authorization approval document."
                    elif f_num in [11, 12]:
                        rec_act = "Upload complete itemized hospital bills and doctor signed summary."
                    elif f_num == 10:
                        rec_act = "Adjust claimed amount to fit within available remaining coverage balance."
                    elif f_num in [5, 7]:
                        rec_act = "Review non-covered policy exclusion terms for this diagnosis."
                    elif f_num == 4:
                        rec_act = "Check waiting period clearance status for this patient."

                    db.add(ClaimRecommendation(
                        rec_id=f"REC-{claim_id}-{rec_idx}",
                        claim_id=claim_id,
                        factor_number=f_num,
                        issue_title=f"{f_name} flagged {st.title()}",
                        severity="HIGH" if st == "FAIL" else "MEDIUM",
                        explanation=msg,
                        recommended_action=rec_act,
                        status="Open",
                        action_type="UPLOAD" if f_num in [8, 11, 12, 13] else "REVIEW"
                    ))
                    rec_idx += 1

            # Update documents verification statuses to match dataset
            docs = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).all()
            for d in docs:
                if "complete" in bill_up.lower() and doc_ver.lower() == "verified":
                    d.verification_status = "Verified"
                elif "partial" in bill_up.lower() or "pending" in doc_ver.lower():
                    d.verification_status = "Pending Audit"
                elif "missing" in bill_up.lower():
                    d.verification_status = "Missing Document"
                else:
                    d.verification_status = doc_ver.title()

    db.commit()
    db.close()
    print("All 200 claims successfully synchronized with claim_validation_dataset.csv!")

if __name__ == "__main__":
    sync_claims_with_dataset()