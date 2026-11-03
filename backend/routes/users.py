from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
try:
    from .. import schemas, database, models, auth
    from ..ai import face_engine
except (ImportError, ValueError):
    import schemas, database, models, auth
    from ai import face_engine

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.patch("/me", response_model=schemas.UserResponse)
def update_current_user_info(
    user_update: schemas.UserUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if user_update.department is not None:
        current_user.department = user_update.department
    if user_update.designation is not None:
        current_user.designation = user_update.designation
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/register-face", response_model=schemas.UserResponse)
async def register_face(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Register a face for the currently logged in user.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image file received.")

    encoding_json = face_engine.get_face_encoding(contents)
    
    if not encoding_json:
        raise HTTPException(status_code=400, detail="Could not detect exactly one face in the image. Please try again with clear lighting.")
    
    current_user.face_encoding = encoding_json
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.delete("/me/face", response_model=schemas.UserResponse)
def delete_current_user_face(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Remove the registered face encoding for the currently logged in user.
    """
    if not current_user.face_encoding:
        raise HTTPException(status_code=400, detail="No registered face found for this user.")

    current_user.face_encoding = None
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/{user_id}/face", response_model=schemas.UserResponse)
def delete_employee_face(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Admin endpoint to reset an employee's registered face.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can reset employee face data")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.face_encoding = None
    db.commit()
    db.refresh(user)
    return user

@router.get("/", response_model=List[schemas.UserResponse])
def get_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view all users")
    users = db.query(models.User).order_by(models.User.id.asc()).offset(skip).limit(limit).all()
    return users

@router.delete("/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")
        
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Admins cannot delete their own account.")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}
