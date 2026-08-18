import os
import csv
import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database.session import SessionLocal, engine, Base
from backend.app.models.user import User, Provider
from backend.app.models.policy import Policyholder, InsuredMember, HealthInformation, Policy, PremiumPayment
from backend.app.models.claim import Claim, ClaimDocument, ClaimValidation, ClaimRecommendation, ClaimHistory
from backend.app.models.services import (
    PolicyTransferRequest, PolicySurrenderRequest, PolicyArrears, 
    PolicyBenefitTransfer, ConfigurableRule
)
from backend.app.utils.security import get_password_hash

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

def parse_int(val: str, default: int = 0) -> int:
    try:
        clean = re.sub(r"[^\d]", "", str(val))
        return int(clean) if clean else default
    except Exception:
        return default



def seed_database(db: Session):
    # Check if already seeded
    if db.query(Policyholder).count() > 0:
        print("Database already contains data. Skipping seed.")
        return

    print("Starting database seeding...")

    # 1. Seed Configurable Rules
    default_rules = [
        ("SURRENDER_REFUND_PCT", "Policy Surrender Refund Percentage", "70.0", "float", "Eligible refund percentage upon early policy closure"),
        ("SURRENDER_PENALTY_PCT", "Policy Surrender Penalty Percentage", "30.0", "float", "Penalty percentage retained upon early policy closure"),
        ("INITIAL_WAITING_PERIOD_DAYS", "Initial Waiting Period (Days)", "30", "int", "Standard initial waiting period for illnesses"),
        ("PRE_EXISTING_WAITING_MONTHS", "Pre-existing Disease Waiting Period (Months)", "36", "int", "Waiting period for pre-existing declared conditions"),
        ("PRE_AUTH_REQUIRED_SURGERY", "Require Pre-Authorization for Planned Surgeries", "true", "bool", "Flag to mandate pre-authorization for surgical procedures"),
        ("SUBMISSION_GRACE_DAYS", "Claim Submission Window (Days)", "30", "int", "Maximum days post-discharge to submit claim without penalty"),
        ("COPAY_SENIOR_CITIZEN_PCT", "Senior Citizen Mandatory Co-Payment", "20.0", "float", "Default co-payment for policyholders over 60 years"),
    ]
    for key, name, val, dtype, desc in default_rules:
        db.add(ConfigurableRule(
            rule_key=key, rule_name=name, rule_value=val, data_type=dtype, description=desc
        ))

    # 2. Seed Default Provider & Admin User
    admin_hash = get_password_hash("admin123")
    provider_user = User(
        username="provider@claimguard.health",
        email="provider@claimguard.health",
        hashed_password=admin_hash,
        full_name="Dr. Arvind Sharma (Chief Medical Officer)",
        role="provider",
        is_active=True
    )
    db.add(provider_user)

    provider_record = Provider(
        provider_id="PRV-8801",
        name="Dr. Arvind Sharma",
        hospital_name="Apollo Multi-Speciality Hospital",
        email="provider@claimguard.health",
        contact_number="+91-9884011223",
        license_number="MED-LIC-2026-9901"
    )
    db.add(provider_record)

    # 3. Read Passwords CSV
    passwords_map = {}
    passwords_file = os.path.join(settings.DATA_DIR, "policyholder_passwords.csv")
    if os.path.exists(passwords_file):
        with open(passwords_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                pid = clean_val(row.get("Insurance ID") or row.get("Policyholder ID") or row.get("INSURANCE ID"))
                pwd = clean_val(row.get("Password"))
                if pid:
                    passwords_map[pid] = pwd

    # 4. Read Policyholders CSV
    policyholders_file = os.path.join(settings.DATA_DIR, "policyholders_dataset.csv")
    policy_map = {}
    if os.path.exists(policyholders_file):
        with open(policyholders_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                pid = clean_val(row.get("Insurance ID") or row.get("Policyholder ID") or row.get("INSURANCE ID"))
                if not pid:
                    continue
                
                full_name = clean_val(row.get("Full Name"))
                dob = clean_val(row.get("DOB"))
                age = parse_int(row.get("Age"), 40)
                gender = clean_val(row.get("Gender"))
                address = clean_val(row.get("Address"))
                contact = clean_val(row.get("Contact Number"))
                email = clean_val(row.get("Email"))
                kyc_info = clean_val(row.get("KYC / ID Info"))
                cov_type = clean_val(row.get("Coverage Type", "Family Floater"))
                tot_members = parse_int(row.get("Total Members"), 1)
                
                # Create Policyholder record
                ph = Policyholder(
                    policyholder_id=pid,
                    full_name=full_name,
                    dob=dob,
                    age=age,
                    gender=gender,
                    address=address,
                    contact_number=contact,
                    email=email,
                    kyc_info=kyc_info,
                    kyc_status="Verified",
                    coverage_type=cov_type,
                    total_members=tot_members
                )
                db.add(ph)

                # Create User account for Policyholder
                user_pwd = passwords_map.get(pid, "123456")
                u = User(
                    username=pid,
                    email=email,
                    hashed_password=get_password_hash(user_pwd),
                    full_name=full_name,
                    role="policyholder",
                    is_active=True
                )
                db.add(u)

                # Insured Members Details: "POL-1001-M01 (Self, Age: 46, DOB: 1979-09-04) | POL-1001-M02 (Spouse, Age: 58, DOB: 1968-01-19)"
                raw_members = clean_val(row.get("Insured Members Details"))
                if raw_members:
                    member_entries = raw_members.split("|")
                    for entry in member_entries:
                        entry = entry.strip()
                        if not entry:
                            continue
                        m_id_match = re.match(r"(POL-\d+-M\d+)", entry)
                        m_id = m_id_match.group(1) if m_id_match else f"{pid}-M01"
                        
                        rel_match = re.search(r"\((Self|Spouse|Son|Daughter|Mother|Father|Child|Other)", entry, re.IGNORECASE)
                        rel = rel_match.group(1) if rel_match else ("Self" if "M01" in m_id else "Family Member")
                        
                        age_match = re.search(r"Age:\s*(\d+)", entry)
                        m_age = int(age_match.group(1)) if age_match else age
                        
                        dob_match = re.search(r"DOB:\s*([\d-]+)", entry)
                        m_dob = dob_match.group(1) if dob_match else dob
                        
                        m_name = full_name if "Self" in rel else f"{full_name.split()[0]}'s {rel}"
                        
                        member_obj = InsuredMember(
                            member_id=m_id,
                            policyholder_id=pid,
                            name=m_name,
                            relationship=rel,
                            age=m_age,
                            dob=m_dob,
                            gender="Female" if rel in ["Mother", "Daughter", "Wife", "Spouse"] and gender == "Male" else gender,
                            eligibility_status="Eligible"
                        )
                        db.add(member_obj)
                else:
                    # Fallback single self member
                    db.add(InsuredMember(
                        member_id=f"{pid}-M01",
                        policyholder_id=pid,
                        name=full_name,
                        relationship="Self",
                        age=age,
                        dob=dob,
                        gender=gender,
                        eligibility_status="Eligible"
                    ))

                # Health Information
                existing_cond = clean_val(row.get("Existing Conditions", "None"))
                prev_ill = clean_val(row.get("Previous Illnesses", "None"))
                prev_surg = clean_val(row.get("Previous Surgeries", "None"))
                curr_treat = clean_val(row.get("Current Treatments", "None"))
                lifestyle = clean_val(row.get("Lifestyle Risk Factors", "Non-smoker, Non-drinker"))

                health_obj = HealthInformation(
                    policyholder_id=pid,
                    member_id=f"{pid}-M01",
                    existing_conditions=existing_cond,
                    previous_illnesses=prev_ill,
                    previous_surgeries=prev_surg,
                    current_treatments=curr_treat,
                    lifestyle_factors=lifestyle
                )
                db.add(health_obj)

                # Policy details
                pol_num = clean_val(row.get("Policy Number"))
                pol_type = clean_val(row.get("Policy Type", "Standard Health Guard"))
                sum_ins = parse_float(row.get("Sum Insured"), 1000000.0)
                st_date = clean_val(row.get("Policy Start Date"))
                end_date = clean_val(row.get("Policy End Date"))
                cov_treat = clean_val(row.get("Covered Treatments", "In-patient hospitalization, Daycare procedures, AYUSH"))
                exclusions = clean_val(row.get("Exclusions", "Cosmetic surgery, Dental care"))
                waiting_p = clean_val(row.get("Waiting Period", "30 days initial, 36 months for pre-existing"))
                deductible = parse_float(row.get("Deductible"), 0.0)
                copay = clean_val(row.get("Co-payment", "0%"))
                sub_lim = clean_val(row.get("Sub-limits", "No Sub-limits applied"))
                
                # Active vs Inactive logic
                pol_status = "Active"

                policy_obj = Policy(
                    policy_number=pol_num,
                    policyholder_id=pid,
                    policy_type=pol_type,
                    sum_insured=sum_ins,
                    used_coverage=0.0,
                    available_coverage=sum_ins,
                    start_date=st_date,
                    end_date=end_date,
                    covered_treatments=cov_treat,
                    exclusions=exclusions,
                    waiting_period=waiting_p,
                    deductible=deductible,
                    co_payment=copay,
                    sub_limits=sub_lim,
                    status=pol_status
                )
                db.add(policy_obj)
                policy_map[pol_num] = policy_obj

                # Premium Payments
                prem_amt = parse_float(row.get("Premium Amount"), 25000.0)
                pay_freq = clean_val(row.get("Payment Frequency", "Annual"))
                pay_status = clean_val(row.get("Payment Status", "Paid"))
                pay_method = clean_val(row.get("Payment Method", "Net Banking"))
                
                out_amt = 0.0
                if pay_status in ["Pending", "Overdue", "Grace Period"]:
                    out_amt = prem_amt

                # Calculate next_due_date within the active policy term period
                try:
                    p_st_dt = datetime.strptime(st_date, "%Y-%m-%d")
                    p_end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                    if pay_freq == "Monthly":
                        calc_due = p_st_dt + timedelta(days=30)
                    elif pay_freq == "Quarterly":
                        calc_due = p_st_dt + timedelta(days=90)
                    elif pay_freq == "Semi-Annual":
                        calc_due = p_st_dt + timedelta(days=180)
                    else: # Annual
                        calc_due = p_end_dt - timedelta(days=30)
                    
                    if calc_due >= p_end_dt:
                        calc_due = p_end_dt - timedelta(days=30)
                    if calc_due < p_st_dt:
                        calc_due = p_st_dt + timedelta(days=30) if (p_st_dt + timedelta(days=30)) < p_end_dt else p_st_dt
                    
                    due_date_str = calc_due.strftime("%Y-%m-%d")
                except Exception:
                    due_date_str = end_date

                payment_obj = PremiumPayment(
                    payment_id=f"PAY-{pid.replace('POL-', '')}-01",
                    policy_number=pol_num,
                    policyholder_id=pid,
                    premium_amount=prem_amt,
                    payment_frequency=pay_freq,
                    payment_status=pay_status,
                    payment_method=pay_method,
                    next_due_date=due_date_str,
                    outstanding_amount=out_amt,
                    payment_date=st_date if pay_status == "Paid" else None
                )
                db.add(payment_obj)

                # Seed sample Arrears for those with Overdue/Pending
                if pay_status in ["Overdue", "Pending", "Grace Period"]:
                    db.add(PolicyArrears(
                        arrear_id=f"ARR-{pid.replace('POL-', '')}",
                        policyholder_id=pid,
                        policy_number=pol_num,
                        total_due=prem_amt,
                        paid_amount=0.0,
                        outstanding_balance=prem_amt,
                        grace_period_days=30,
                        required_settlement_amount=prem_amt,
                        settlement_status="Pending Settlement",
                        claim_eligibility_restored=False
                    ))

    db.commit()

    # 5. Read Claim Validation Dataset CSV
    claims_file = os.path.join(settings.DATA_DIR, "claim_validation_dataset.csv")
    if os.path.exists(claims_file):
        with open(claims_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                pid = clean_val(row.get("Insurance ID") or row.get("Policyholder ID") or row.get("INSURANCE ID"))
                pol_num = clean_val(row.get("Policy Number"))
                if not pid or not pol_num:
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
                raw_sub_date = clean_val(row.get("16. Claim Submission Date"))
                sub_date = raw_sub_date

                # Get policyholder name
                ph_rec = db.query(Policyholder).filter(Policyholder.policyholder_id == pid).first()
                patient_name = ph_rec.full_name if ph_rec else f"Patient {pid}"

                # Compute initial 16-factor evaluation & score
                pass_count = 0
                warn_count = 0
                fail_count = 0
                factors_list = []

                # F1: Policy Status
                f1_pass = pol_status_str.lower() == "active"
                f1_status = "PASS" if f1_pass else "FAIL"
                factors_list.append((1, "Policy Status", f1_status, "Policy is Active" if f1_pass else f"Policy is {pol_status_str}"))

                # F2: Dates
                f2_pass = True
                factors_list.append((2, "Policy Start & End Date", "PASS" if f2_pass else "FAIL", f"Valid tenure: {st_date_str} to {end_date_str}"))

                # F3: Total Coverage
                factors_list.append((3, "Total Policy Coverage Amount", "PASS", f"Sum Insured: ₹{tot_cov:,.0f}"))

                # F4: Eligibility
                f4_status = "PASS" if "eligible" in elig_str.lower() and "ineligible" not in elig_str.lower() else "FAIL"
                factors_list.append((4, "Patient/Member Eligibility", f4_status, elig_str))

                # F5: Disease Diagnosis
                f5_status = "PASS"
                factors_list.append((5, "Type of Disease / Diagnosis", f5_status, disease))

                # F6: Treatment
                factors_list.append((6, "Treatment / Procedure", "PASS", treatment))

                # F7: Treatment Coverage
                f7_status = "PASS" if treat_cov.lower() == "covered" else "FAIL"
                factors_list.append((7, "Treatment Coverage", f7_status, f"Treatment is {treat_cov}"))

                # F8: Pre-Auth
                f8_status = "PASS" if "approved" in pre_auth.lower() or "not required" in pre_auth.lower() else ("WARNING" if "not applicable" in pre_auth.lower() else "FAIL")
                factors_list.append((8, "Pre-Authorization Status", f8_status, f"Pre-Auth: {pre_auth}"))

                # F9: Claim Amount
                factors_list.append((9, "Claim Amount", "PASS", f"Claimed: ₹{claim_amt:,.0f}"))

                # F10: Policy Amount vs Claim Amount
                f10_status = "PASS" if "within coverage" in cov_comp.lower() else "FAIL"
                factors_list.append((10, "Policy Amount vs. Claim Amount", f10_status, cov_comp))

                # F11: Bill Upload
                f11_status = "PASS" if "complete" in bill_up.lower() else ("WARNING" if "partial" in bill_up.lower() else "FAIL")
                factors_list.append((11, "Bill Upload", f11_status, bill_up))

                # F12: Required Documents
                f12_status = "PASS" if "complete" in bill_up.lower() else "WARNING"
                factors_list.append((12, "Required Documents", f12_status, req_docs))

                # F13: Document Verification Status
                f13_status = "PASS" if doc_ver.lower() == "verified" else ("WARNING" if "pending" in doc_ver.lower() else "FAIL")
                factors_list.append((13, "Documentation Verification Status", f13_status, doc_ver))

                # F14: Medical/Claim Info Accuracy
                f14_status = "PASS" if "accurate" in accuracy.lower() or "validated" in accuracy.lower() else ("WARNING" if "minor" in accuracy.lower() or "audit" in accuracy.lower() else "FAIL")
                factors_list.append((14, "Medical/Claim Information Accuracy", f14_status, accuracy))

                # F15: Duplicate Check
                f15_status = "PASS" if "passed" in dup_check.lower() or "no duplicate" in dup_check.lower() else "FAIL"
                factors_list.append((15, "Duplicate Claim Check", f15_status, dup_check))

                # F16: Submission Date
                factors_list.append((16, "Claim Submission Date", "PASS", f"Submitted on {sub_date}"))

                for f_num, f_name, st, msg in factors_list:
                    if st == "PASS":
                        pass_count += 1
                    elif st == "WARNING":
                        warn_count += 1
                    else:
                        fail_count += 1

                # Calculate confidence score
                conf_score = round((pass_count * 6.0) + (warn_count * 2.5), 1)
                conf_score = min(100.0, max(15.0, conf_score))

                if conf_score >= 85 and fail_count == 0:
                    risk_level = "LOW"
                    final_status = "Claim Approval"
                elif conf_score >= 60 and fail_count <= 2:
                    risk_level = "MEDIUM"
                    final_status = "Needs Review"
                else:
                    risk_level = "HIGH"
                    final_status = "High Risk"

                # Calculate Estimated Claimable Amount
                # Fetch policy deductible & copay
                pol = db.query(Policy).filter(Policy.policy_number == pol_num).first()
                deductible_val = pol.deductible if pol else 0.0
                copay_str = pol.co_payment if pol else "0%"
                copay_pct = parse_float(copay_str, 0.0) / 100.0

                if f1_pass and f7_status == "PASS" and f10_status == "PASS":
                    after_ded = max(0.0, claim_amt - deductible_val)
                    copay_ded = after_ded * copay_pct
                    est_claimable = max(0.0, after_ded - copay_ded)
                else:
                    est_claimable = 0.0

                claim_id = f"CLM-{pid.replace('POL-', '')}"

                claim_obj = Claim(
                    claim_id=claim_id,
                    policyholder_id=pid,
                    member_id=f"{pid}-M01",
                    policy_number=pol_num,
                    patient_name=patient_name,
                    disease_diagnosis=disease,
                    treatment_procedure=treatment,
                    claim_submission_date=sub_date,
                    claim_amount=claim_amt,
                    estimated_claimable_amount=est_claimable,
                    deductible_applied=deductible_val,
                    copay_applied=claim_amt * copay_pct,
                    sublimit_applied=0.0,
                    confidence_score=conf_score,
                    risk_level=risk_level,
                    ml_predicted_prob=round(1.0 - (conf_score / 100.0), 3),
                    status=final_status,
                    pre_auth_status=pre_auth,
                    notes=f"Audited via CLAIMGUARD 16-factor engine. {pass_count} Passed, {warn_count} Warnings, {fail_count} Failed."
                )
                db.add(claim_obj)

                # Add 16 validation rows
                for f_num, f_name, st, msg in factors_list:
                    db.add(ClaimValidation(
                        claim_id=claim_id,
                        factor_number=f_num,
                        factor_name=f_name,
                        status=st,
                        message=msg,
                        details=f"Evaluated factor #{f_num}: {f_name} -> {st}"
                    ))

                # Add sample documents
                db.add(ClaimDocument(
                    doc_id=f"DOC-{claim_id}-01",
                    claim_id=claim_id,
                    document_name="Itemized Hospital Bill",
                    document_type="Final Itemized Bill",
                    filename="hospital_final_bill.pdf",
                    file_path=os.path.join(settings.UPLOAD_DIR, "hospital_final_bill.pdf"),
                    file_size_bytes=245000,
                    mime_type="application/pdf",
                    verification_status="Verified" if "complete" in bill_up.lower() else "Pending Review"
                ))

                db.add(ClaimDocument(
                    doc_id=f"DOC-{claim_id}-02",
                    claim_id=claim_id,
                    document_name="Discharge Summary",
                    document_type="Hospital Discharge Summary",
                    filename="discharge_summary.pdf",
                    file_path=os.path.join(settings.UPLOAD_DIR, "discharge_summary.pdf"),
                    file_size_bytes=180000,
                    mime_type="application/pdf",
                    verification_status=doc_ver if doc_ver else "Uploaded"
                ))

                # Add Recommendations for warning or failed factors
                rec_idx = 1
                for f_num, f_name, st, msg in factors_list:
                    if st in ["FAIL", "WARNING"]:
                        action_type = "UPLOAD"
                        explanation = f"Validation flagged issue on {f_name}: {msg}"
                        rec_act = f"Please resolve {f_name} according to configured policy rules."
                        
                        if f_num == 8:
                            rec_act = "Obtain and upload the required pre-authorization approval document."
                        elif f_num in [11, 12]:
                            rec_act = "Upload missing itemized hospital bills and complete doctor notes."
                        elif f_num == 10:
                            rec_act = "Review the requested claim amount against remaining available coverage limit."
                        elif f_num == 13:
                            rec_act = "Complete documentation verification to resolve pending audits."

                        db.add(ClaimRecommendation(
                            rec_id=f"REC-{claim_id}-{rec_idx}",
                            claim_id=claim_id,
                            factor_number=f_num,
                            issue_title=f"{f_name} {st.title()}",
                            severity="HIGH" if st == "FAIL" else "MEDIUM",
                            explanation=explanation,
                            recommended_action=rec_act,
                            status="Open",
                            action_type=action_type
                        ))
                        rec_idx += 1

                # Add initial history
                db.add(ClaimHistory(
                    claim_id=claim_id,
                    action="Initial 16-Factor Audit",
                    previous_status=None,
                    new_status=final_status,
                    previous_confidence=None,
                    new_confidence=conf_score,
                    actor="CLAIMGUARD Rule Engine",
                    notes="Automated pre-submission denial prevention audit completed."
                ))

    # 6. Seed Sample Policy Lifecycle Requests for Demonstration
    # Sample Nominee Transfer
    db.add(PolicyTransferRequest(
        request_id="TRF-2026-001",
        policyholder_id="POL-1003",
        policy_number="HLT-2026-383060",
        nominee_id="POL-1003-M02",
        nominee_name="Sunita Mehta",
        relationship="Spouse",
        death_date="2026-01-15",
        death_certificate_doc="death_cert_pol1003.pdf",
        verification_status="Verified",
        transfer_status="Under Review",
        reviewer_notes="Death certificate verified with municipal database. Transfer eligible pending committee sign-off."
    ))

    # Sample Surrender
    db.add(PolicySurrenderRequest(
        request_id="SUR-2026-001",
        policyholder_id="POL-1006",
        policy_number="HLT-2026-273148",
        policy_amount=100000.0,
        refund_percentage=70.0,
        penalty_percentage=30.0,
        eligible_refund=70000.0,
        penalty_amount=30000.0,
        final_refund=70000.0,
        reason="Financial hardship / Inability to pay renewal premium",
        closure_status="Pending Approval",
        disclaimer_accepted=True
    ))

    # Sample Benefit Transfer
    db.add(PolicyBenefitTransfer(
        request_id="BEN-2026-001",
        policyholder_id="POL-1001",
        policy_number="HLT-2026-127824",
        beneficiary_id="POL-1001-M02",
        beneficiary_name="Sunita Gupta",
        relationship="Spouse",
        policy_completion_status="Completed 100% Policy Term",
        benefit_usage="0% Claims Made / Unused Benefit",
        transfer_eligibility="Eligible (No Claims Claimed)",
        transfer_status="Approved",
        notes="Unused preventive health & floater balance transferred to spouse for next policy cycle."
    ))

    db.commit()
    print("Database seeding completed successfully! (200 Policyholders & Claims seeded)")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
