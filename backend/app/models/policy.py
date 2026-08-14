from sqlalchemy import Column, Integer, String, Float, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship as sa_relationship
from datetime import datetime
from backend.app.database.session import Base

class Policyholder(Base):
    __tablename__ = "policyholders"

    id = Column(Integer, primary_key=True, index=True)
    policyholder_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. POL-1001
    full_name = Column(String(150), nullable=False)
    dob = Column(String(50), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    address = Column(Text, nullable=False)
    contact_number = Column(String(50), nullable=False)
    email = Column(String(150), nullable=False)
    kyc_info = Column(String(150), nullable=False)
    kyc_status = Column(String(50), default="Verified")
    coverage_type = Column(String(50), default="Family Floater")
    total_members = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    members = sa_relationship("InsuredMember", back_populates="policyholder", cascade="all, delete-orphan", foreign_keys="InsuredMember.policyholder_id")
    policies = sa_relationship("Policy", back_populates="policyholder", cascade="all, delete-orphan", foreign_keys="Policy.policyholder_id")
    health_records = sa_relationship("HealthInformation", back_populates="policyholder", cascade="all, delete-orphan", foreign_keys="HealthInformation.policyholder_id")

class InsuredMember(Base):
    __tablename__ = "insured_members"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. POL-1001-M01
    policyholder_id = Column(String(50), ForeignKey("policyholders.policyholder_id"), nullable=False)
    name = Column(String(150), nullable=False)
    relationship = Column(String(50), nullable=False) # Self, Spouse, Son, Daughter, Mother, Father
    age = Column(Integer, nullable=False)
    dob = Column(String(50), nullable=False)
    gender = Column(String(20), default="Male")
    eligibility_status = Column(String(50), default="Eligible") # Eligible, Ineligible (Waiting Period), etc.
    created_at = Column(DateTime, default=datetime.utcnow)

    policyholder = sa_relationship("Policyholder", back_populates="members", foreign_keys=[policyholder_id])

class HealthInformation(Base):
    __tablename__ = "health_information"

    id = Column(Integer, primary_key=True, index=True)
    policyholder_id = Column(String(50), ForeignKey("policyholders.policyholder_id"), nullable=False)
    member_id = Column(String(50), nullable=True)
    existing_conditions = Column(Text, default="None")
    previous_illnesses = Column(Text, default="None")
    previous_surgeries = Column(Text, default="None")
    current_treatments = Column(Text, default="None")
    lifestyle_factors = Column(Text, default="Non-smoker, Non-drinker")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    policyholder = sa_relationship("Policyholder", back_populates="health_records", foreign_keys=[policyholder_id])

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. HLT-2026-127824
    policyholder_id = Column(String(50), ForeignKey("policyholders.policyholder_id"), nullable=False)
    policy_type = Column(String(100), default="Comprehensive Family Care")
    sum_insured = Column(Float, default=1000000.0)
    used_coverage = Column(Float, default=0.0)
    available_coverage = Column(Float, default=1000000.0)
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=False)
    covered_treatments = Column(Text, nullable=False)
    exclusions = Column(Text, nullable=False)
    waiting_period = Column(String(100), default="30 days initial, 36 months for pre-existing")
    deductible = Column(Float, default=0.0)
    co_payment = Column(String(20), default="0%") # e.g. "10%", "20%", "0%"
    sub_limits = Column(Text, default="No Sub-limits applied")
    status = Column(String(50), default="Active") # Active, Inactive, Lapsed, Expired
    created_at = Column(DateTime, default=datetime.utcnow)

    policyholder = sa_relationship("Policyholder", back_populates="policies", foreign_keys=[policyholder_id])
    claims = sa_relationship("Claim", back_populates="policy", cascade="all, delete-orphan")
    payments = sa_relationship("PremiumPayment", back_populates="policy", cascade="all, delete-orphan")

class PremiumPayment(Base):
    __tablename__ = "premium_payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. PAY-1001-01
    policy_number = Column(String(50), ForeignKey("policies.policy_number"), nullable=False)
    policyholder_id = Column(String(50), nullable=False)
    premium_amount = Column(Float, default=25000.0)
    payment_frequency = Column(String(50), default="Annual") # Monthly, Quarterly, Annual
    payment_status = Column(String(50), default="Paid") # Paid, Pending, Grace Period, Overdue, Lapsed
    payment_method = Column(String(50), default="Credit Card") # Credit Card, Net Banking, UPI, Auto-Debit
    next_due_date = Column(String(50), nullable=True)
    outstanding_amount = Column(Float, default=0.0)
    payment_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    policy = sa_relationship("Policy", back_populates="payments", foreign_keys=[policy_number])
