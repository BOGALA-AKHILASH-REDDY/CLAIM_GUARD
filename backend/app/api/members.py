from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.database.session import get_db
from backend.app.models.policy import InsuredMember, Policyholder
from backend.app.schemas.policy import InsuredMemberResponse, InsuredMemberCreate

router = APIRouter(prefix="/members", tags=["Insured Members"])

@router.get("/{policyholder_id}", response_model=List[InsuredMemberResponse])
def get_members_by_policyholder(policyholder_id: str, db: Session = Depends(get_db)):
    return db.query(InsuredMember).filter(InsuredMember.policyholder_id == policyholder_id).all()

@router.post("/{policyholder_id}", response_model=InsuredMemberResponse)
def add_insured_member(policyholder_id: str, member_in: InsuredMemberCreate, db: Session = Depends(get_db)):
    ph = db.query(Policyholder).filter(Policyholder.policyholder_id == policyholder_id).first()
    if not ph:
        raise HTTPException(status_code=404, detail="Policyholder not found")
    
    # Generate new member ID
    count = db.query(InsuredMember).filter(InsuredMember.policyholder_id == policyholder_id).count() + 1
    new_m_id = f"{policyholder_id}-M{count:02d}"
    while db.query(InsuredMember).filter(InsuredMember.member_id == new_m_id).first():
        count += 1
        new_m_id = f"{policyholder_id}-M{count:02d}"

    new_member = InsuredMember(
        member_id=new_m_id,
        policyholder_id=policyholder_id,
        name=member_in.name.strip(),
        relationship=member_in.relationship.strip(),
        age=member_in.age,
        dob=member_in.dob,
        gender=member_in.gender,
        eligibility_status=member_in.eligibility_status or "Eligible"
    )
    db.add(new_member)
    ph.total_members = (ph.total_members or 0) + 1
    db.commit()
    db.refresh(new_member)
    return new_member

@router.delete("/{member_id}")
def delete_insured_member(member_id: str, db: Session = Depends(get_db)):
    member = db.query(InsuredMember).filter(InsuredMember.member_id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Insured member not found")
    
    ph = db.query(Policyholder).filter(Policyholder.policyholder_id == member.policyholder_id).first()
    if ph and ph.total_members > 1:
        ph.total_members -= 1

    db.delete(member)
    db.commit()
    return {"message": f"Member {member_id} successfully removed"}
