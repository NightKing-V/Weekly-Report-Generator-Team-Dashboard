import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Configure CORS origins from environment variable
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

# Initialize the FastAPI app
app = FastAPI(
    title="Team Dashboard API",
    description="API for the Weekly Report Generator & Team Dashboard",
    version="1.0.0"
)

# Configure CORS so your React frontend can communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "The FastAPI server is up and running."}