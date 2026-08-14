from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.database.session import get_db
from backend.app.models.policy import HealthInformation
from backend.app.schemas.policy import HealthInfoResponse, HealthInfoUpdate

router = APIRouter(prefix="/health", tags=["Health Information"])

@router.get("/{policyholder_id}", response_model=HealthInfoResponse)
def get_health_information(policyholder_id: str, db: Session = Depends(get_db)):
    health = db.query(HealthInformation).filter(HealthInformation.policyholder_id == policyholder_id).first()
    if not health:
        raise HTTPException(status_code=404, detail="Health information not found for policyholder")
    return health

@router.put("/{policyholder_id}", response_model=HealthInfoResponse)
def update_health_information(policyholder_id: str, health_in: HealthInfoUpdate, db: Session = Depends(get_db)):
    health = db.query(HealthInformation).filter(HealthInformation.policyholder_id == policyholder_id).first()
    if not health:
        raise HTTPException(status_code=404, detail="Health information not found")
    
    update_dict = health_in.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(health, key, value)

    db.commit()
    db.refresh(health)
    return health
