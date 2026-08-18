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
    allow_origins=[
        "http://localhost:5173",
        "https://claim-guard-frontend.vercel.app",
    ],
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

from fastapi import Request
from fastapi.responses import FileResponse, JSONResponse

@app.get("/api")
def api_root():
    return {
        "system": "CLAIMGUARD",
        "subtitle": "Provider Claim Denial Prevention & Insurance Policy Management System",
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

# Serve Frontend static build if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str = ""):
        # Exclude backend internal routes
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("uploads"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        
        # If client specifically asks for JSON on root
        if not full_path and "application/json" in request.headers.get("accept", "") and "text/html" not in request.headers.get("accept", ""):
            return {
                "system": "CLAIMGUARD",
                "subtitle": "Provider Claim Denial Prevention & Insurance Policy Management System",
                "version": settings.VERSION,
                "status": "online",
                "docs_url": "/docs"
            }

        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {
            "system": "CLAIMGUARD",
            "subtitle": "Provider Claim Denial Prevention & Insurance Policy Management System",
            "version": settings.VERSION,
            "status": "online",
            "docs_url": "/docs"
        }
else:
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
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
