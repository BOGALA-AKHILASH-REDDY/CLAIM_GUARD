from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ClaimDocumentResponse(BaseModel):
    id: int
    doc_id: str
    claim_id: str
    document_name: str
    document_type: str
    filename: str
    file_path: str
    file_size_bytes: int
    mime_type: str
    format_valid: bool = True
    is_required: bool = True
    verification_status: str
    rejection_reason: Optional[str] = None
    uploaded_at: Any

    class Config:
        from_attributes = True

class ClaimValidationResponse(BaseModel):
    id: int
    claim_id: str
    factor_number: int
    factor_name: str
    status: str # "PASS", "WARNING", "FAIL"
    message: str
    details: Optional[str] = None
    audited_at: Any

    class Config:
        from_attributes = True

class ClaimRecommendationResponse(BaseModel):
    id: int
    rec_id: str
    claim_id: str
    factor_number: Optional[int] = None
    issue_title: str
    severity: str
    explanation: str
    recommended_action: str
    status: str # "Open", "Fixed", "Verified"
    action_type: str
    created_at: Any
    fixed_at: Optional[Any] = None

    class Config:
        from_attributes = True

class ClaimHistoryResponse(BaseModel):
    id: int
    claim_id: str
    action: str
    previous_status: Optional[str] = None
    new_status: str
    previous_confidence: Optional[float] = None
    new_confidence: float
    actor: str
    notes: Optional[str] = None
    timestamp: Any

    class Config:
        from_attributes = True

class ClaimCreate(BaseModel):
    policyholder_id: str
    member_id: Optional[str] = None
    policy_number: str
    patient_name: str
    disease_diagnosis: str
    treatment_procedure: str
    claim_amount: float
    claim_submission_date: Optional[str] = None
    claim_type: Optional[str] = "Reimbursement" # "Cashless" or "Reimbursement"
    hospital_name: Optional[str] = "Apollo Multispeciality Hospital"
    hospital_type: Optional[str] = "Network Hospital" # "Network Hospital" or "Non-Network Hospital"
    admission_date: Optional[str] = None
    discharge_date: Optional[str] = None
    emergency_or_planned: Optional[str] = "Planned Treatment"
    bank_account_holder: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    pan_number: Optional[str] = None
    doctor_name: Optional[str] = None
    pre_auth_number: Optional[str] = None
    pre_auth_status: Optional[str] = "Approved"
    notes: Optional[str] = None

class ClaimUpdate(BaseModel):
    patient_name: Optional[str] = None
    disease_diagnosis: Optional[str] = None
    treatment_procedure: Optional[str] = None
    claim_amount: Optional[float] = None
    claim_submission_date: Optional[str] = None
    claim_type: Optional[str] = None
    hospital_name: Optional[str] = None
    hospital_type: Optional[str] = None
    admission_date: Optional[str] = None
    discharge_date: Optional[str] = None
    emergency_or_planned: Optional[str] = None
    bank_account_holder: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    pan_number: Optional[str] = None
    doctor_name: Optional[str] = None
    pre_auth_number: Optional[str] = None
    pre_auth_status: Optional[str] = None
    notes: Optional[str] = None

class ClaimResponse(BaseModel):
    id: int
    claim_id: str
    policyholder_id: str
    member_id: Optional[str] = None
    policy_number: str
    patient_name: str
    disease_diagnosis: str
    treatment_procedure: str
    claim_submission_date: str
    claim_type: Optional[str] = "Reimbursement"
    hospital_name: Optional[str] = "Apollo Multispeciality Hospital"
    hospital_type: Optional[str] = "Network Hospital"
    admission_date: Optional[str] = None
    discharge_date: Optional[str] = None
    emergency_or_planned: Optional[str] = "Planned Treatment"
    bank_account_holder: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    pan_number: Optional[str] = None
    doctor_name: Optional[str] = None
    pre_auth_number: Optional[str] = None
    claim_amount: float
    estimated_claimable_amount: float
    deductible_applied: float
    copay_applied: float
    sublimit_applied: float
    confidence_score: float
    denial_chance_score: Optional[float] = None
    risk_level: str
    ml_predicted_prob: float
    status: str
    pre_auth_status: str
    notes: Optional[str] = None
    created_at: Any
    updated_at: Optional[Any] = None
    validations: List[ClaimValidationResponse] = []
    documents: List[ClaimDocumentResponse] = []
    recommendations: List[ClaimRecommendationResponse] = []
    history: List[ClaimHistoryResponse] = []

    class Config:
        from_attributes = True

class ClaimAnalysisResult(BaseModel):
    claim_id: str
    policy_number: str
    patient_name: str
    disease_diagnosis: str
    treatment_procedure: str
    claim_amount: float
    estimated_claimable_amount: float
    confidence_score: float
    denial_chance_score: Optional[float] = None
    risk_level: str
    status: str
    passed_factors: int
    warning_factors: int
    failed_factors: int
    validations: List[ClaimValidationResponse]
    recommendations: List[ClaimRecommendationResponse]
    documents: List[ClaimDocumentResponse]
    calculation_breakdown: Dict[str, Any]
    ml_prediction: Dict[str, Any]

class RecheckResult(BaseModel):
    claim_id: str
    before_confidence: float
    before_denial_chance: Optional[float] = None
    before_risk: str
    before_status: str
    before_issues_count: int
    after_confidence: float
    after_denial_chance: Optional[float] = None
    after_risk: str
    after_status: str
    after_issues_count: int
    after_estimated_claimable_amount: float
    improvements: List[str]
    validations: List[ClaimValidationResponse]
    recommendations: List[ClaimRecommendationResponse]

class ClaimSubmissionResult(BaseModel):
    success: bool
    claim_id: str
    status: str
    message: str
    claim_amount: float
    estimated_claimable_amount: float
    confidence_score: float
    denial_chance_score: Optional[float] = None
    submitted_at: str
    policy_number: str
    patient_name: str
    claim_type: str

class AnalyticsSummaryResponse(BaseModel):
    total_claims: int
    pending_claims: int
    approved_claims: int
    rejected_claims: int
    needs_correction_claims: int
    ready_for_submission_claims: int
    submitted_claims: int
    average_confidence_score: float
    status_distribution: List[Dict[str, Any]]
    type_distribution: List[Dict[str, Any]]
    failure_reasons_distribution: List[Dict[str, Any]]
    monthly_claim_amounts: List[Dict[str, Any]]
    confidence_score_ranges: List[Dict[str, Any]]
