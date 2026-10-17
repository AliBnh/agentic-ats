from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# HTTP Metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP Requests handled by the API",
    ["method", "endpoint", "status"]
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP Request Latency in seconds",
    ["endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0]
)

# Domain Specific Metrics for AgenticATS Swarm
ATS_AUDITS_TOTAL = Counter(
    "ats_audits_total",
    "Total resume audits initiated",
    ["language", "status"]
)

ATS_MATCHES_TOTAL = Counter(
    "ats_job_matches_total",
    "Total job description alignments processed",
    ["status"]
)

HITL_INTERRUPTS_TOTAL = Counter(
    "ats_hitl_interrupts_total",
    "Total Human-In-The-Loop verification checkpoints triggered",
    ["action"]
)

ATS_SCORE_HISTOGRAM = Histogram(
    "ats_final_scores",
    "Distribution of ATS convergence scores (0-100%)",
    buckets=[40.0, 50.0, 60.0, 70.0, 75.0, 80.0, 85.0, 90.0, 95.0, 100.0]
)
