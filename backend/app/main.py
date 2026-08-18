import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.database.session import engine, SessionLocal, Base
from backend.app.database.seed_data import seed_database
from backend.app.api import (
    auth, dashboard, policyholders, members, 
    policies, health, payments, services, 
    claims, reports, ml_endpoint, search
)

# Initialize DB models
Base.metadata.create_all(bind=engine)

# Auto migrate newly added columns to existing tables
from sqlalchemy import text
with engine.connect() as conn:
    for table, col, col_type in [
        ("policy_transfer_requests", "member_id", "VARCHAR(50)"),
        ("policy_benefit_transfers", "member_id", "VARCHAR(50)")
    ]:
        try:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
            conn.commit()
        except Exception:
            pass

# Auto seed if empty
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CLAIMGUARD - Provider Claim Denial Prevention & Insurance Policy Management System",
    version=settings.VERSION
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(policyholders.router, prefix=settings.API_V1_STR)
app.include_router(members.router, prefix=settings.API_V1_STR)
app.include_router(policies.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(services.router, prefix=settings.API_V1_STR)
app.include_router(claims.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(ml_endpoint.router, prefix=settings.API_V1_STR)
app.include_router(search.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": "CLAIMGUARD",
        "subtitle": "Provider Claim Denial Prevention & Insurance Policy Management System",
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
