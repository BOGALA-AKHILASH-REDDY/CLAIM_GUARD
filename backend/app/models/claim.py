from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship as sa_relationship
from datetime import datetime
from backend.app.database.session import Base

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. CLM-1001
    policyholder_id = Column(String(50), nullable=False)
    member_id = Column(String(50), nullable=True)
    policy_number = Column(String(50), ForeignKey("policies.policy_number"), nullable=False)
    patient_name = Column(String(150), nullable=False)
    disease_diagnosis = Column(String(200), nullable=False)
    treatment_procedure = Column(String(200), nullable=False)
    claim_submission_date = Column(String(50), nullable=False)
    
    # Claim Workflow & Type
    claim_type = Column(String(50), default="Reimbursement") # "Cashless", "Reimbursement"
    hospital_name = Column(String(200), default="Apollo Multispeciality Hospital")
    hospital_type = Column(String(50), default="Network Hospital") # "Network Hospital", "Non-Network Hospital"
    admission_date = Column(String(50), nullable=True)
    discharge_date = Column(String(50), nullable=True)
    emergency_or_planned = Column(String(50), default="Planned Treatment") # "Emergency Treatment", "Planned Treatment"
    
    # Bank & Payment Info for Reimbursement
    bank_account_holder = Column(String(150), nullable=True)
    bank_account_number = Column(String(50), nullable=True)
    bank_ifsc = Column(String(50), nullable=True)
    pan_number = Column(String(50), nullable=True)
    
    # Pre-auth and Doctor Details
    doctor_name = Column(String(150), nullable=True)
    pre_auth_number = Column(String(50), nullable=True)
    
    # Financial fields
    claim_amount = Column(Float, nullable=False)
    estimated_claimable_amount = Column(Float, default=0.0)
    deductible_applied = Column(Float, default=0.0)
    copay_applied = Column(Float, default=0.0)
    sublimit_applied = Column(Float, default=0.0)
    
    # Confidence & Risk
    confidence_score = Column(Float, default=0.0) # 0-100
    risk_level = Column(String(50), default="LOW") # LOW, MEDIUM, HIGH
    ml_predicted_prob = Column(Float, default=0.0)
    
    # Status
    status = Column(String(50), default="Needs Review") # "Claim Ready", "Needs Correction", "Under Review", "High Risk", "Submitted", "Rejected"
    pre_auth_status = Column(String(50), default="Approved") # Approved, Rejected, Missing, Not Required (Emergency), Not Applicable
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    policy = sa_relationship("Policy", back_populates="claims", foreign_keys=[policy_number])
    documents = sa_relationship("ClaimDocument", back_populates="claim", cascade="all, delete-orphan", foreign_keys="ClaimDocument.claim_id")
    validations = sa_relationship("ClaimValidation", back_populates="claim", cascade="all, delete-orphan", foreign_keys="ClaimValidation.claim_id", order_by="ClaimValidation.factor_number.asc()")
    recommendations = sa_relationship("ClaimRecommendation", back_populates="claim", cascade="all, delete-orphan", foreign_keys="ClaimRecommendation.claim_id")
    history = sa_relationship("ClaimHistory", back_populates="claim", cascade="all, delete-orphan", foreign_keys="ClaimHistory.claim_id")

    @property
    def denial_chance_score(self) -> float:
        return round(max(0.0, min(100.0, 100.0 - (self.confidence_score or 0.0))), 1)

class ClaimDocument(Base):
    __tablename__ = "claim_documents"

    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(String(50), unique=True, index=True, nullable=False)
    claim_id = Column(String(50), ForeignKey("claims.claim_id"), nullable=False)
    document_name = Column(String(200), nullable=False)
    document_type = Column(String(100), nullable=False) # "Hospital Discharge Summary", "Final Itemized Bill", "Pharmacy Invoices", "Lab Reports", "Pre-Authorization Document", "Death Certificate"
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    format_valid = Column(Boolean, default=True)
    is_required = Column(Boolean, default=True)
    verification_status = Column(String(50), default="Uploaded") # "Uploaded", "Verified", "Pending Review", "Pending Additional Documents", "Rejected (Missing Documentation)", "Discrepancy Found"
    rejection_reason = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    claim = sa_relationship("Claim", back_populates="documents", foreign_keys=[claim_id])

class ClaimValidation(Base):
    __tablename__ = "claim_validations"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String(50), ForeignKey("claims.claim_id"), nullable=False)
    factor_number = Column(Integer, nullable=False) # 1 to 16
    factor_name = Column(String(150), nullable=False)
    status = Column(String(50), nullable=False) # "PASS", "WARNING", "FAIL"
    message = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    audited_at = Column(DateTime, default=datetime.utcnow)

    claim = sa_relationship("Claim", back_populates="validations", foreign_keys=[claim_id])

class ClaimRecommendation(Base):
    __tablename__ = "claim_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    rec_id = Column(String(50), unique=True, index=True, nullable=False)
    claim_id = Column(String(50), ForeignKey("claims.claim_id"), nullable=False)
    factor_number = Column(Integer, nullable=True)
    issue_title = Column(String(200), nullable=False)
    severity = Column(String(50), default="HIGH") # "HIGH", "MEDIUM", "LOW"
    explanation = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    status = Column(String(50), default="Open") # "Open", "Fixed", "Verified"
    action_type = Column(String(50), default="UPLOAD") # "UPLOAD", "EDIT", "REVIEW"
    created_at = Column(DateTime, default=datetime.utcnow)
    fixed_at = Column(DateTime, nullable=True)

    claim = sa_relationship("Claim", back_populates="recommendations", foreign_keys=[claim_id])

class ClaimHistory(Base):
    __tablename__ = "claim_history"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String(50), ForeignKey("claims.claim_id"), nullable=False)
    action = Column(String(100), nullable=False) # "Created", "Validated", "Rechecked", "Fixed Recommendation", "Status Updated"
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    previous_confidence = Column(Float, nullable=True)
    new_confidence = Column(Float, nullable=False)
    actor = Column(String(100), default="System")
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    claim = sa_relationship("Claim", back_populates="history", foreign_keys=[claim_id])
