import os
import csv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.config import settings
from backend.app.models.user import User, Provider
from backend.app.models.policy import Policyholder
from backend.app.schemas.auth import LoginRequest, TokenResponse, UserInfo
from backend.app.utils.security import verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    uname = credentials.username.strip()
    pwd = credentials.password.strip()

    # Find user by username or email
    user = db.query(User).filter((User.username == uname) | (User.email == uname)).first()
    if not user:
        # Check if policyholder exists in dataset and create/authenticate
        ph = db.query(Policyholder).filter(Policyholder.policyholder_id == uname).first()
        if not ph:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid provider ID / Insurance ID or password."
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid provider ID / Insurance ID or password."
        )

    if not verify_password(pwd, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid provider ID / Insurance ID or password."
        )

    token = create_access_token(data={"sub": user.username, "role": user.role, "name": user.full_name})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.username,
        full_name=user.full_name,
        role=user.role,
        email=user.email,
        policyholder_id=user.username if user.role == "policyholder" else None,
        provider_id="PRV-8801" if user.role == "provider" else None
    )

@router.get("/me", response_model=UserInfo)
def get_me(current_user: User = Depends(get_current_user)):
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active
    )

@router.get("/demo-credentials")
def get_demo_credentials(db: Session = Depends(get_db)):
    """
    Returns quick test credentials for hackathon demonstration.
    """
    demo_list = [
        {
            "role": "Provider / Hospital Admin",
            "id": "provider@claimguard.health",
            "password": "admin123",
            "name": "Dr. Arvind Sharma (Chief Medical Officer)",
            "description": "Full access to dashboard, 16-factor validation engine, claim analysis & policy services"
        },
        {
            "role": "Policyholder (POL-1001)",
            "id": "POL-1001",
            "password": "202699",
            "name": "Karan Gupta",
            "description": "Active policyholder with Family Floater (₹25 Lakhs coverage)"
        },
        {
            "role": "Policyholder (POL-1002)",
            "id": "POL-1002",
            "password": "955747",
            "name": "Manoj Kulkarni",
            "description": "Active policyholder with ₹10 Lakhs coverage & pending payment"
        },
        {
            "role": "Policyholder (POL-1003)",
            "id": "POL-1003",
            "password": "902972",
            "name": "Karan Mehta",
            "description": "Inactive policy with high risk claim & nominee transfer"
        }
    ]
    return demo_list
