from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from backend.app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False) # Insurance ID (e.g. POL-1001) or email
    email = Column(String(150), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default="provider") # "provider", "policyholder", "admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    hospital_name = Column(String(200), default="Apollo Care Hospital")
    email = Column(String(150), unique=True, nullable=False)
    contact_number = Column(String(50), default="+91-9876543210")
    license_number = Column(String(100), default="MED-LIC-2026-9901")
    created_at = Column(DateTime, default=datetime.utcnow)
