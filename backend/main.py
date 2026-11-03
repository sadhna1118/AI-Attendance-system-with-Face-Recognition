from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from . import database, models
    from .routes import auth, attendance, users, leaves
except (ImportError, ValueError):
    import database, models
    from routes import auth, attendance, users, leaves

app = FastAPI(title="AI Attendance API", version="1.0.0")

@app.on_event("startup")
def startup_event():
    try:
        models.Base.metadata.create_all(bind=database.engine)
        print("Database tables verified/created successfully.")
    except Exception as e:
        print(f"Database connection warning on startup: {e}")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    return {
        "message": "Welcome to the AI Attendance System API",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "ok"}
