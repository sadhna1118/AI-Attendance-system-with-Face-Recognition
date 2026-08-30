from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "employee"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    department: Optional[str] = None
    designation: Optional[str] = None

class UserResponse(UserBase):
    id: int
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: bool
    created_at: datetime
    has_face_encoding: bool

    class Config:
        orm_mode = True
        from_attributes = True

class AttendanceRecordResponse(BaseModel):
    id: int
    user_id: int
    timestamp: datetime
    status: str
    confidence: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    is_late: bool = False
    type: str = "Check-in"
    ip_address: Optional[str] = None
    username: Optional[str] = None

    class Config:
        from_attributes = True

class LeaveRequestCreate(BaseModel):
    start_date: datetime
    end_date: datetime
    reason: str

class LeaveRequestResponse(BaseModel):
    id: int
    user_id: int
    username: Optional[str] = None
    start_date: datetime
    end_date: datetime
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
