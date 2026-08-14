from pydantic import BaseModel
from typing import Optional, List, Any

class InsuredMemberBase(BaseModel):
    member_id: str
    name: str
    relationship: str
    age: int
    dob: str
    gender: str
    eligibility_status: str

class InsuredMemberCreate(BaseModel):
    name: str
    relationship: str
    age: int
    dob: str
    gender: str
    eligibility_status: Optional[str] = "Eligible"

class InsuredMemberResponse(InsuredMemberBase):
    id: int
    policyholder_id: str

    class Config:
        from_attributes = True

class HealthInfoResponse(BaseModel):
    id: int
    policyholder_id: str
    member_id: Optional[str] = None
    existing_conditions: str
    previous_illnesses: str
    previous_surgeries: str
    current_treatments: str
    lifestyle_factors: str

    class Config:
        from_attributes = True

class HealthInfoUpdate(BaseModel):
    existing_conditions: Optional[str] = None
    previous_illnesses: Optional[str] = None
    previous_surgeries: Optional[str] = None
    current_treatments: Optional[str] = None
    lifestyle_factors: Optional[str] = None

class PolicyResponse(BaseModel):
    id: int
    policy_number: str
    policyholder_id: str
    policy_type: str
    sum_insured: float
    used_coverage: float
    available_coverage: float
    start_date: str
    end_date: str
    covered_treatments: str
    exclusions: str
    waiting_period: str
    deductible: float
    co_payment: str
    sub_limits: str
    status: str

    class Config:
        from_attributes = True

class PremiumPaymentResponse(BaseModel):
    id: int
    payment_id: str
    policy_number: str
    policyholder_id: str
    premium_amount: float
    payment_frequency: str
    payment_status: str
    payment_method: str
    next_due_date: Optional[str] = None
    outstanding_amount: float
    payment_date: Optional[str] = None

    class Config:
        from_attributes = True

class PolicyholderResponse(BaseModel):
    id: int
    policyholder_id: str
    full_name: str
    dob: str
    age: int
    gender: str
    address: str
    contact_number: str
    email: str
    kyc_info: str
    kyc_status: str
    coverage_type: str
    total_members: int
    policies: List[PolicyResponse] = []
    members: List[InsuredMemberResponse] = []
    health_records: List[HealthInfoResponse] = []

    class Config:
        from_attributes = True

class PolicyholderUpdate(BaseModel):
    full_name: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    kyc_info: Optional[str] = None
    kyc_status: Optional[str] = None

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
    created_at: Any = None

    class Config:
        from_attributes = True
