from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from datetime import datetime
from backend.app.database.session import Base

class PolicyTransferRequest(Base):
    __tablename__ = "policy_transfer_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. TRF-2026-001
    policyholder_id = Column(String(50), nullable=False)
    policy_number = Column(String(50), nullable=False)
    nominee_id = Column(String(50), nullable=False)
    nominee_name = Column(String(150), nullable=False)
    relationship = Column(String(50), nullable=False) # Spouse, Son, Daughter, Legal Heir
    death_date = Column(String(50), nullable=False)
    death_certificate_doc = Column(String(255), nullable=True)
    verification_status = Column(String(50), default="Pending") # Pending, Verified, Discrepancy Found
    transfer_status = Column(String(50), default="Pending") # Pending, Under Review, Approved, Rejected
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PolicySurrenderRequest(Base):
    __tablename__ = "policy_surrender_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. SUR-2026-001
    policyholder_id = Column(String(50), nullable=False)
    policy_number = Column(String(50), nullable=False)
    policy_amount = Column(Float, nullable=False) # Total eligible policy amount
    refund_percentage = Column(Float, default=70.0) # 70% configurable
    penalty_percentage = Column(Float, default=30.0) # 30% penalty
    eligible_refund = Column(Float, nullable=False) # 70% of policy_amount
    penalty_amount = Column(Float, nullable=False) # 30% of policy_amount
    final_refund = Column(Float, nullable=False)
    reason = Column(Text, nullable=True)
    closure_status = Column(String(50), default="Pending Approval") # Pending Approval, Processed, Closed, Rejected
    disclaimer_accepted = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PolicyArrears(Base):
    __tablename__ = "policy_arrears"

    id = Column(Integer, primary_key=True, index=True)
    arrear_id = Column(String(50), unique=True, index=True, nullable=False)
    policyholder_id = Column(String(50), nullable=False)
    policy_number = Column(String(50), nullable=False)
    total_due = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    outstanding_balance = Column(Float, nullable=False)
    grace_period_days = Column(Integer, default=30)
    required_settlement_amount = Column(Float, nullable=False)
    settlement_status = Column(String(50), default="Pending Settlement") # Pending Settlement, Settled, Restored
    claim_eligibility_restored = Column(Boolean, default=False)
    settled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PolicyBenefitTransfer(Base):
    __tablename__ = "policy_benefit_transfers"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(50), unique=True, index=True, nullable=False)
    policyholder_id = Column(String(50), nullable=False)
    policy_number = Column(String(50), nullable=False)
    beneficiary_id = Column(String(50), nullable=False)
    beneficiary_name = Column(String(150), nullable=False)
    relationship = Column(String(50), nullable=False) # Spouse / soulmate, Child, Grandchild, Other
    policy_completion_status = Column(String(50), default="Completed 100% Policy Term")
    benefit_usage = Column(String(50), default="0% Claims Made / Unused Benefit")
    transfer_eligibility = Column(String(50), default="Eligible (No Claims Claimed)")
    transfer_status = Column(String(50), default="Under Review") # Pending, Under Review, Approved, Rejected
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ConfigurableRule(Base):
    __tablename__ = "configurable_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_key = Column(String(100), unique=True, index=True, nullable=False)
    rule_name = Column(String(150), nullable=False)
    rule_value = Column(String(200), nullable=False)
    data_type = Column(String(50), default="float") # float, int, string, json
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PolicyRenewalRequest(Base):
    __tablename__ = "policy_renewal_requests"

    id = Column(Integer, primary_key=True, index=True)
    renewal_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. REN-2026-001
    policyholder_id = Column(String(50), nullable=False)
    policy_number = Column(String(50), nullable=False)
    previous_end_date = Column(String(50), nullable=False)
    new_start_date = Column(String(50), nullable=False)
    new_end_date = Column(String(50), nullable=False)
    premium_amount = Column(Float, default=25000.0)
    payment_method = Column(String(50), default="UPI (Instant)")
    payment_reference = Column(String(100), nullable=True)
    renewal_status = Column(String(50), default="Active & Renewed")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
