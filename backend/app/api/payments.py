from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.database.session import get_db
from backend.app.models.policy import PremiumPayment, Policy
from backend.app.schemas.policy import PremiumPaymentResponse

router = APIRouter(prefix="/payments", tags=["Premium & Payments"])

@router.get("", response_model=List[PremiumPaymentResponse])
def get_all_payments(policyholder_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(PremiumPayment)
    if policyholder_id:
        query = query.join(Policy, PremiumPayment.policy_number == Policy.policy_number).filter(Policy.policyholder_id == policyholder_id)
    return query.limit(200).all()

@router.get("/{policy_number}", response_model=List[PremiumPaymentResponse])
def get_payments_by_policy(policy_number: str, db: Session = Depends(get_db)):
    payments = db.query(PremiumPayment).filter(PremiumPayment.policy_number == policy_number).all()
    if not payments:
        raise HTTPException(status_code=404, detail="No payment records found for this policy")
    return payments

@router.post("/pay/{payment_id}")
def pay_premium(payment_id: str, payment_method: str = "UPI", db: Session = Depends(get_db)):
    payment = db.query(PremiumPayment).filter(PremiumPayment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
    
    payment.payment_status = "Paid"
    payment.outstanding_amount = 0.0
    payment.payment_method = payment_method
    payment.payment_date = datetime.utcnow().strftime("%Y-%m-%d")

    # Update policy status if it was inactive due to payment
    policy = db.query(Policy).filter(Policy.policy_number == payment.policy_number).first()
    if policy and policy.status in ["Lapsed", "Grace Period"]:
        policy.status = "Active"

    db.commit()
    db.refresh(payment)
    return {"message": "Payment recorded successfully", "payment": payment}
