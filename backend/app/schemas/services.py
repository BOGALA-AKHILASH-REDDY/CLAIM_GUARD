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
