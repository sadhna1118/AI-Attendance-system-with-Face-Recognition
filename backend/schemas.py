from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime

try:
    from pydantic import ConfigDict
    HAS_PYDANTIC_V2 = True
except ImportError:
    HAS_PYDANTIC_V2 = False

if HAS_PYDANTIC_V2:
    class CompatibleBaseModel(BaseModel):
        model_config = ConfigDict(from_attributes=True)

        @classmethod
        def from_orm(cls, obj: Any):
            return cls.model_validate(obj, from_attributes=True)
else:
    class CompatibleBaseModel(BaseModel):
        class Config:
            orm_mode = True

class UserBase(CompatibleBaseModel):
    username: str
    email: EmailStr
    role: str = "employee"

class UserCreate(UserBase):
    password: str

class UserUpdate(CompatibleBaseModel):
    department: Optional[str] = None
    designation: Optional[str] = None

class UserResponse(UserBase):
    id: int
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: bool
    created_at: datetime
    has_face_encoding: bool

class AttendanceRecordResponse(CompatibleBaseModel):
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

class LeaveRequestCreate(CompatibleBaseModel):
    start_date: datetime
    end_date: datetime
    reason: str

class LeaveRequestResponse(CompatibleBaseModel):
    id: int
    user_id: int
    username: Optional[str] = None
    start_date: datetime
    end_date: datetime
    reason: str
    status: str
    created_at: datetime

class Token(CompatibleBaseModel):
    access_token: str
    token_type: str

class TokenData(CompatibleBaseModel):
    username: Optional[str] = None
