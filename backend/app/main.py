from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.alhail.router import router as alhail_router
from app.db import fetch_one

app = FastAPI(title="UAE AI Demos API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3002"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    fetch_one("select 1 as ok")
    return {"status": "ok"}


app.include_router(alhail_router)
