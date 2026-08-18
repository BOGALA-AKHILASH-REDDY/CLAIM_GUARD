from pydantic import BaseModel
from typing import Optional, List, Any

# Nominee Transfer
class PolicyTransferCreate(BaseModel):
    policyholder_id: str
    policy_number: str
    nominee_id: str
    nominee_name: str
    relationship: str
    death_date: str
    death_certificate_doc: Optional[str] = None
    reviewer_notes: Optional[str] = None

class PolicyTransferResponse(BaseModel):
    id: int
    request_id: str
    policyholder_id: str
    policy_number: str
    nominee_id: str
    nominee_name: str
    relationship: str
    member_id: Optional[str] = None
    death_date: str
    death_certificate_doc: Optional[str] = None
    verification_status: str
    transfer_status: str
    reviewer_notes: Optional[str] = None
    created_at: Any

    class Config:
        from_attributes = True

# Surrender
class PolicySurrenderCreate(BaseModel):
    policyholder_id: str
    policy_number: str
    policy_amount: float
    reason: Optional[str] = "Financial inability to pay renewal"
    disclaimer_accepted: bool = True

class PolicySurrenderResponse(BaseModel):
    id: int
    request_id: str
    policyholder_id: str
    policy_number: str
    policy_amount: float
    refund_percentage: float
    penalty_percentage: float
    eligible_refund: float
    penalty_amount: float
    final_refund: float
    reason: Optional[str] = None
    closure_status: str
    disclaimer_accepted: bool
    created_at: Any

    class Config:
        from_attributes = True

# Arrears
class SettleArrearsRequest(BaseModel):
    arrear_id: str
    payment_amount: float
    payment_method: Optional[str] = "UPI"

class PolicyArrearsResponse(BaseModel):
    id: int
    arrear_id: str
    policyholder_id: str
    policy_number: str
    total_due: float
    paid_amount: float
    outstanding_balance: float
    grace_period_days: int
    required_settlement_amount: float
    settlement_status: str
    claim_eligibility_restored: bool
    settled_at: Optional[Any] = None
    created_at: Any

    class Config:
        from_attributes = True

# Benefit Transfer
class BenefitTransferCreate(BaseModel):
    policyholder_id: str
    policy_number: str
    beneficiary_id: str
    beneficiary_name: str
    relationship: str
    notes: Optional[str] = None

class PolicyBenefitTransferResponse(BaseModel):
    id: int
    request_id: str
    policyholder_id: str
    policy_number: str
    beneficiary_id: str
    beneficiary_name: str
    relationship: str
    member_id: Optional[str] = None
    policy_completion_status: str
    benefit_usage: str
    transfer_eligibility: str
    transfer_status: str
    notes: Optional[str] = None
    created_at: Any

    class Config:
        from_attributes = True

# Configurable Rule
class ConfigurableRuleUpdate(BaseModel):
    rule_value: str
    description: Optional[str] = None

class ConfigurableRuleResponse(BaseModel):
    id: int
    rule_key: str
    rule_name: str
    rule_value: str
    data_type: str
    description: Optional[str] = None
    updated_at: Any

    class Config:
        from_attributes = True

# Policy Renewal & Instant Reactivation
class PolicyRenewalCreate(BaseModel):
    policy_number: str
    policyholder_id: Optional[str] = None
    renewal_years: int = 1
    new_start_date: Optional[str] = None
    new_end_date: Optional[str] = None
    premium_amount: float = 25000.0
    payment_method: str = "UPI (Instant)"
    payment_reference: Optional[str] = None
    health_declaration_confirmed: bool = True
    notes: Optional[str] = None
    actor: Optional[str] = "Policyholder (Online Self-Renewal)"

class PolicyRenewalResponse(BaseModel):
    id: int
    renewal_id: str
    policyholder_id: str
    policy_number: str
    previous_end_date: str
    new_start_date: str
    new_end_date: str
    premium_amount: float
    payment_method: str
    payment_reference: Optional[str] = None
    renewal_status: str
    notes: Optional[str] = None
    created_at: Any

    class Config:
        from_attributes = True

# ----------------------------------------------------------------------
# 11F. Pre-Claim Policy Continuation & Eligibility Check Schemas
# ----------------------------------------------------------------------
class PreClaimPayInstalmentRequest(BaseModel):
    policy_number: str
    arrear_id: Optional[str] = None
    payment_id: Optional[str] = None
    payment_amount: float
    payment_method: Optional[str] = "UPI"
    notes: Optional[str] = None

class PreClaimIssue(BaseModel):
    id: str
    category: str
    severity: str # "CRITICAL_BLOCKER", "WARNING", "INFO"
    title: str
    description: str
    claim_impact: str

class PreClaimRecommendation(BaseModel):
    id: str
    action_type: str # "PAY_INSTALMENT", "SETTLE_ARREARS", "CLEAR_GRACE", "RENEW_POLICY", "PROCEED_CLAIM", "REVIEW_CONDITIONS", "TOPUP_COVERAGE"
    title: str
    description: str
    cta_label: str
    amount: Optional[float] = 0.0
    payload: Optional[dict] = None

class PreClaimPillarDiagnostic(BaseModel):
    name: str
    pillar_number: int
    status: str # "PASS", "WARNING", "FAIL"
    status_label: str
    message: str
    details: str
    key_metrics: Optional[dict] = None

class PreClaimInsuredMemberDetail(BaseModel):
    member_id: str
    name: str
    relationship: str
    age: int
    gender: str
    is_senior_citizen: bool
    eligibility_status: str
    applicable_copay_pct: float
    health_conditions: str
    ped_waiting_cleared: bool
    ped_waiting_note: str
    claim_readiness: str # "READY", "PED_WAITING", "INELIGIBLE"

class PreClaimCoverageSummary(BaseModel):
    policy_type: str
    sum_insured: float
    used_coverage: float
    available_coverage: float
    coverage_utilized_pct: float
    safety_status: str # "OPTIMAL", "MODERATE", "CRITICAL_LOW", "EXHAUSTED"
    deductible: float
    co_payment: str
    senior_citizen_copay_pct: float
    sub_limits: str
    covered_treatments: str
    exclusions: str
    waiting_period: str
    start_date: str
    end_date: str
    total_tenure_days: int
    days_active: int
    days_remaining: int
    is_initial_waiting_cleared: bool
    initial_waiting_days_remaining: int

class PreClaimEstimateRequest(BaseModel):
    policy_number: str
    member_id: Optional[str] = None
    treatment_name: str
    estimated_bill_amount: float
    room_type: Optional[str] = "Normal Room"
    stay_days: Optional[int] = 1

class PreClaimEstimateResponse(BaseModel):
    policy_number: str
    treatment_name: str
    member_name: str
    member_relationship: str
    gross_bill_amount: float
    is_treatment_covered: bool
    treatment_coverage_category: str # "FULLY_COVERED", "COVERED_WITH_SUBLIMIT", "EXCLUDED", "WAITING_PERIOD_APPLIES"
    sub_limit_name: Optional[str] = None
    sub_limit_applied: float = 0.0
    sub_limit_deduction: float = 0.0
    admissible_amount_before_deductible: float
    deductible_applied: float
    amount_after_deductible: float
    copay_pct_applied: float
    copay_deduction: float
    estimated_approved_payout: float
    estimated_patient_out_of_pocket: float
    available_coverage_before_claim: float
    projected_available_coverage_after_claim: float
    coverage_warning_notes: List[str]

class PreClaimEligibilityCheckResponse(BaseModel):
    policyholder_id: str
    policyholder_name: str
    policy_number: str
    overall_eligibility: str # "ELIGIBLE", "CONDITIONAL_WARNING", "ACTION_REQUIRED_BLOCKED"
    can_submit_claim: bool
    readiness_score: int
    summary_message: str
    coverage_details: PreClaimCoverageSummary
    insured_members: List[PreClaimInsuredMemberDetail]
    covered_treatments_list: List[str]
    exclusions_list: List[str]
    premium_status: PreClaimPillarDiagnostic
    outstanding_instalments: PreClaimPillarDiagnostic
    grace_period: PreClaimPillarDiagnostic
    policy_conditions: PreClaimPillarDiagnostic
    issues: List[PreClaimIssue]
    recommendations: List[PreClaimRecommendation]
    timestamp: str

class PreClaimSummaryItem(BaseModel):
    policyholder_id: str
    policyholder_name: str
    policy_number: str
    policy_type: str
    sum_insured: float
    available_coverage: float
    coverage_utilized_pct: float
    co_payment: str
    deductible: float
    premium_status: str
    outstanding_amount: float
    is_in_grace: bool
    grace_days_remaining: int
    policy_status: str
    overall_eligibility: str
    can_submit_claim: bool
    readiness_score: int

