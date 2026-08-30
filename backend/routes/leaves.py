from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import io
import openpyxl
from datetime import datetime

from .. import schemas, database, models, auth

router = APIRouter(prefix="/api/leaves", tags=["leaves"])

@router.post("/", response_model=schemas.LeaveRequestResponse)
def request_leave(
    leave: schemas.LeaveRequestCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_leave = models.LeaveRequest(
        user_id=current_user.id,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    
    response_data = schemas.LeaveRequestResponse.from_orm(new_leave)
    response_data.username = current_user.username
    return response_data

@router.get("/", response_model=List[schemas.LeaveRequestResponse])
def get_leaves(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.LeaveRequest)
    
    if current_user.role != "admin":
        query = query.filter(models.LeaveRequest.user_id == current_user.id)
        
    leaves = query.order_by(desc(models.LeaveRequest.created_at)).all()
    
    results = []
    for l in leaves:
        data = schemas.LeaveRequestResponse.from_orm(l)
        if l.user:
            data.username = l.user.username
        results.append(data)
        
    return results

@router.patch("/{leave_id}")
def update_leave_status(
    leave_id: int,
    status: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can approve/reject leaves")
        
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    if status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    leave.status = status
    db.commit()
    
    return {"detail": f"Leave {status.lower()} successfully"}

@router.get("/export")
def export_leaves(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can export leaves")
        
    leaves = db.query(models.LeaveRequest).order_by(desc(models.LeaveRequest.created_at)).all()
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Leave Requests"
    
    headers = ["ID", "Username", "Start Date", "End Date", "Reason", "Status", "Requested At"]
    ws.append(headers)
    
    for l in leaves:
        username = l.user.username if l.user else "Unknown"
        start = l.start_date.strftime("%Y-%m-%d") if l.start_date else ""
        end = l.end_date.strftime("%Y-%m-%d") if l.end_date else ""
        created = l.created_at.strftime("%Y-%m-%d %H:%M:%S") if l.created_at else ""
        ws.append([l.id, username, start, end, l.reason, l.status, created])
    
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    filename = f"leaves_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    headers_dict = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    from fastapi import Response
    return Response(content=stream.read(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers_dict)
