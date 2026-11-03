# AI Attendance System with Face Recognition

A full-stack, enterprise-ready AI-powered attendance and employee management system featuring real-time facial recognition, liveness spoofing detection, employee directory management, leave request workflows, and attendance analytics.

---

## Features

- **Automated Face Recognition Attendance:** Instant face matching using 128-dimensional facial embeddings.
- **Liveness & Anti-Spoof Protection:** Verification pipeline preventing photographic and static spoof attacks.
- **Dynamic Role Management:**
  - **First-user Initialization:** The first registered account on a fresh database is automatically assigned the **Admin** role.
  - **Admin Privileges:** Full analytics access, employee directory, leave approvals/rejections, record management, and Excel exports.
  - **Employee Access:** Personal attendance logs, face enrollment, profile editing, and leave request submission.
- **Smart Attendance Logic:** Automatic detection of Check-in vs Check-out, configurable late arrivals, IP logging, and optional geolocation tracking.
- **Data Export:** Export attendance logs and leave records directly to formatted `.xlsx` spreadsheets.
- **Modern Responsive UI:** Glassmorphism dashboard built with React 19, Vite, Lucide Icons, and Recharts.

---

## Tech Stack

- **Backend:** FastAPI (Python 3.10+), SQLAlchemy, PostgreSQL / SQLite, bcrypt, PyJWT, openpyxl, OpenCV, face_recognition.
- **Frontend:** React 19, Vite, Axios, React Router v7, React-Toastify, Recharts, Lucide Icons.
- **DevOps:** Docker, Docker Compose, Vercel ready.

---

## Project Structure

```text
├── backend/
│   ├── ai/
│   │   ├── face_engine.py      # Face detection, 128D encoding & matching
│   │   ├── face_recognition.py # AI engine wrapper
│   │   └── liveness.py         # Anti-spoofing detection logic
│   ├── routes/
│   │   ├── attendance.py       # Check-in/out, logs, Excel exports
│   │   ├── auth.py             # User signup, login & JWT generation
│   │   ├── leaves.py           # Leave requests & approval workflows
│   │   └── users.py            # User management & face enrollment
│   ├── auth.py                 # JWT & bcrypt security helpers
│   ├── database.py             # SQLAlchemy session & DB connection
│   ├── Dockerfile              # Container definition for backend
│   ├── main.py                 # FastAPI application entrypoint
│   ├── models.py               # Database schemas & relationships
│   ├── requirements.txt        # Python dependencies
│   └── schemas.py              # Pydantic validation models
├── frontend/
│   ├── src/
│   │   ├── api/axios.js        # Axios instance with auth interceptors
│   │   ├── components/         # Shared UI components (Sidebar, etc.)
│   │   ├── pages/              # Dashboard, LiveAttendance, Leaves, etc.
│   │   ├── App.jsx             # React routing & layout
│   │   └── main.jsx            # React root
│   ├── Dockerfile              # Container definition for frontend
│   ├── package.json            # Node dependencies & scripts
│   └── vite.config.js          # Vite & chunking configuration
├── docker-compose.yml          # Multi-container orchestration
└── README.md
```

---

## Quick Start (Docker Compose)

The easiest way to run the entire stack (Database + Backend + Frontend):

```bash
docker-compose up --build
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## Manual Setup

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server (defaults to local SQLite database if DATABASE_URL is unset)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend

# Install packages
npm install

# (Optional) Set backend URL if not running on http://localhost:8000/api
# cp .env.example .env

# Run development server
npm run dev
```

---

## Authentication & Initial Login Credentials

There are **no hardcoded accounts** in the repository. Instead:

1. Open the frontend at `http://localhost:5173/login`.
2. Click **"Don't have an account? Sign up"**.
3. Create your account with your desired **Username**, **Email**, and **Password**.
4. **First User Rule:** The very first account registered on the database is automatically assigned the **`admin`** role. All subsequent registrations receive the **`employee`** role.
5. Switch to **Sign In** and log in with your new credentials.

---

## Environment Variables

### Backend

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./attendance.db` | PostgreSQL or SQLite connection string |
| `SECRET_KEY` | `supersecretkey` | JWT secret key for signature verification |

### Frontend

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | API Base URL for backend requests |

---

## API Endpoints Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register user account | Public |
| `POST` | `/api/auth/login` | Login and obtain JWT token | Public |
| `GET` | `/api/users/me` | Current user profile | Authenticated |
| `PATCH` | `/api/users/me` | Update department/designation | Authenticated |
| `POST` | `/api/users/register-face` | Enroll user face embedding | Authenticated |
| `GET` | `/api/users/` | List all users | Admin |
| `DELETE` | `/api/users/{id}` | Delete employee account | Admin |
| `POST` | `/api/attendance/check-in` | Facial scan check-in/out | Authenticated |
| `GET` | `/api/attendance/` | Attendance log history | Authenticated |
| `GET` | `/api/attendance/export` | Export attendance records to Excel | Authenticated |
| `DELETE` | `/api/attendance/{id}` | Delete attendance record | Admin |
| `POST` | `/api/leaves/` | Submit leave request | Authenticated |
| `GET` | `/api/leaves/` | View leave requests | Authenticated |
| `PATCH` | `/api/leaves/{id}` | Approve or reject leave | Admin |
| `GET` | `/api/leaves/export` | Export leave records to Excel | Admin |
| `GET` | `/health` | Service health status | Public |
