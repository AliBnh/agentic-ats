import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.utils.seed_data import seed_database
from app.api.auth_routes import router as auth_router
from app.api.thread_routes import router as thread_router
from app.api.audit_routes import router as audit_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("agentic_ats")

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
    # Run seed
    with SessionLocal() as db:
        seed_database(db)
except Exception as e:
    logger.warning(f"Database initialization warning: {e}")

app = FastAPI(
    title="AgenticATS API",
    description="Autonomous Multi-Agent Resume Optimization & ATS Intelligence Engine",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus Metrics Instrumentation
try:
    import time
    from fastapi import Request, Response
    from app.core.metrics import (
        REQUEST_COUNT,
        REQUEST_LATENCY,
        ATS_AUDITS_TOTAL,
        generate_latest,
        CONTENT_TYPE_LATEST
    )

    @app.middleware("http")
    async def prometheus_middleware(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        
        endpoint = request.url.path
        # Avoid high-cardinality endpoint paths for IDs
        if endpoint.startswith("/api/audit/result/"):
            endpoint = "/api/audit/result/{id}"
        elif endpoint.startswith("/api/audit/resume/"):
            endpoint = "/api/audit/resume/{id}"
        elif endpoint.startswith("/api/threads/"):
            endpoint = "/api/threads/{id}"

        REQUEST_COUNT.labels(method=request.method, endpoint=endpoint, status=response.status_code).inc()
        REQUEST_LATENCY.labels(endpoint=endpoint).observe(duration)
        return response

    @app.get("/metrics")
    def metrics():
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

except Exception as e:
    logger.warning(f"Prometheus instrumentation skipped: {e}")

# Include Routers
app.include_router(auth_router)
app.include_router(thread_router)
app.include_router(audit_router)

@app.get("/")
def root():
    return {
        "system": "AgenticATS Engine",
        "status": "ONLINE",
        "documentation": "/docs",
        "metrics": "/metrics",
        "version": "1.0.0"
    }

@app.get("/health")
def healthcheck():
    return {"status": "HEALTHY", "metrics": "ACTIVE", "version": "1.0.0"}

