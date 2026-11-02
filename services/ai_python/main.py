import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(
    title="ADAPT OS AI Services",
    version="0.1.0",
    description="Provider-neutral service boundary for future AI capabilities."
)

@app.get("/health")
async def health():
    return {
        "service": "adapt-os-ai",
        "status": "operational",
        "provider_configured": bool(os.getenv("AI_PROVIDER_API_KEY"))
    }

@app.post("/summarize")
async def summarize(payload: dict):
    if not os.getenv("AI_PROVIDER_API_KEY"):
        return JSONResponse(status_code=503, content={
            "error": "AI provider is not configured.",
            "status": "not_connected"
        })
    return JSONResponse(status_code=501, content={
        "error": "No AI provider adapter has been selected yet.",
        "status": "adapter_required"
    })
