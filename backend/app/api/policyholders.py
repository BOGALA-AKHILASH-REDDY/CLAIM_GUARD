from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database.session import get_db
from backend.app.models.policy import Policyholder
from backend.app.schemas.policy import PolicyholderResponse, PolicyholderUpdate

router = APIRouter(prefix="/policyholders", tags=["Policyholders"])

@router.get("", response_model=List[PolicyholderResponse])
def get_all_policyholders(
    search: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Policyholder)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Policyholder.policyholder_id.ilike(s)) |
            (Policyholder.full_name.ilike(s)) |
            (Policyholder.email.ilike(s)) |
            (Policyholder.contact_number.ilike(s))
        )
    return query.limit(limit).all()

@router.get("/{policyholder_id}", response_model=PolicyholderResponse)
def get_policyholder_by_id(policyholder_id: str, db: Session = Depends(get_db)):
    ph = db.query(Policyholder).filter(Policyholder.policyholder_id == policyholder_id).first()
    if not ph:
        raise HTTPException(status_code=404, detail="Policyholder not found")
    return ph

@router.put("/{policyholder_id}", response_model=PolicyholderResponse)
def update_policyholder(policyholder_id: str, update_data: PolicyholderUpdate, db: Session = Depends(get_db)):
    ph = db.query(Policyholder).filter(Policyholder.policyholder_id == policyholder_id).first()
    if not ph:
        raise HTTPException(status_code=404, detail="Policyholder not found")
    
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(ph, key, value)
    
    db.commit()
    db.refresh(ph)
    return ph
