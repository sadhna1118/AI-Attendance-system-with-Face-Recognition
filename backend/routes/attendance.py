from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import io
import openpyxl
from datetime import datetime

from .. import schemas, database, models, auth
from ..ai import face_recognition, liveness

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Form, Request

@router.post("/check-in", response_model=schemas.AttendanceRecordResponse)
async def check_in(
    request: Request,
    file: UploadFile = File(...),
    latitude: str = Form(None),
    longitude: str = Form(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Check-in using a webcam frame. Performs liveness detection and face matching.
    """
    if not current_user.face_encoding:
        raise HTTPException(status_code=400, detail="User has no registered face.")

    contents = await file.read()

    # 1. Liveness Detection
    liveness_result = liveness.check_liveness(contents)
    if not liveness_result["is_live"]:
        # Log failure
        record = models.AttendanceRecord(
            user_id=current_user.id,
            status="Failed - Spoof Detected",
            confidence="0"
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        raise HTTPException(status_code=401, detail="Liveness check failed. Spoof detected.")

    # 2. Face Recognition Match
    match_result = face_recognition.compare_faces(current_user.face_encoding, contents)
    
    if "error" in match_result:
        raise HTTPException(status_code=400, detail=match_result["error"])

    if not match_result["match"]:
        # Log failure
        record = models.AttendanceRecord(
            user_id=current_user.id,
            status="Failed - Face Mismatch",
            confidence=match_result["confidence"]
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        raise HTTPException(status_code=401, detail="Face recognition match failed.")

    # 3. Determine Check-in or Check-out
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get last record for today
    last_record = db.query(models.AttendanceRecord)\
        .filter(models.AttendanceRecord.user_id == current_user.id)\
        .filter(models.AttendanceRecord.timestamp >= today_start)\
        .order_by(desc(models.AttendanceRecord.timestamp))\
        .first()
        
    record_type = "Check-in"
    if last_record and last_record.type == "Check-in":
        record_type = "Check-out"

    is_late = now.hour >= 9 if record_type == "Check-in" else False
    ip_address = request.client.host if request.client else None

    record = models.AttendanceRecord(
        user_id=current_user.id,
        status="Present",
        confidence=match_result["confidence"],
        latitude=latitude,
        longitude=longitude,
        is_late=is_late,
        type=record_type,
        ip_address=ip_address
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    # Return response including username for convenience
    response_data = schemas.AttendanceRecordResponse.from_orm(record)
    response_data.username = current_user.username
    return response_data


@router.get("/", response_model=List[schemas.AttendanceRecordResponse])
def get_attendance(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.AttendanceRecord)
    if current_user.role != "admin":
        query = query.filter(models.AttendanceRecord.user_id == current_user.id)
        
    records = query.order_by(desc(models.AttendanceRecord.timestamp)).offset(skip).limit(limit).all()
    
    # Eagerly load or just inject usernames for the response
    results = []
    for r in records:
        data = schemas.AttendanceRecordResponse.from_orm(r)
        if r.user:
            data.username = r.user.username
        results.append(data)
        
    return results

@router.get("/export")
def export_attendance(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.AttendanceRecord)
    if current_user.role != "admin":
        query = query.filter(models.AttendanceRecord.user_id == current_user.id)
        
    records = query.order_by(desc(models.AttendanceRecord.timestamp)).all()
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Attendance Logs"
    
    # Headers
    headers = ["ID", "Username", "Timestamp", "Status", "Confidence"]
    ws.append(headers)
    
    for r in records:
        username = r.user.username if r.user else "Unknown"
        timestamp = r.timestamp.strftime("%Y-%m-%d %H:%M:%S") if r.timestamp else ""
        ws.append([r.id, username, timestamp, r.status, r.confidence])
    
    # Save to memory
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    filename = f"attendance_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    return Response(content=stream.read(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)

@router.delete("/{record_id}")
def delete_attendance(record_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete records")
        
    record = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    db.delete(record)
    db.commit()
    return {"detail": "Record deleted successfully"}
