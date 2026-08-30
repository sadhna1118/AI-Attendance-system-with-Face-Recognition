from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import database, models
from .routes import auth, attendance, users, leaves

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AI Attendance API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(attendance.router)
app.include_router(users.router)
app.include_router(leaves.router)

@app.get("/")
def root():
    return {"message": "Welcome to the AI Attendance System API"}
