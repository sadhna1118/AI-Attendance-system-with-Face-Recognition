from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
try:
    from .database import Base
except (ImportError, ValueError):
    from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="employee")
    department = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    face_encoding = Column(Text, nullable=True)  # Stores JSON string of face encoding array
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def has_face_encoding(self):
        return self.face_encoding is not None

    attendance_records = relationship(
        "AttendanceRecord",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    leave_requests = relationship(
        "LeaveRequest",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String)  # Present, Failed - Spoof, Failed - Face Mismatch
    confidence = Column(String)  # Confidence score of face match
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)
    is_late = Column(Boolean, default=False)
    type = Column(String, default="Check-in")  # Check-in or Check-out
    ip_address = Column(String, nullable=True)

    user = relationship("User", back_populates="attendance_records")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="Pending")  # Pending, Approved, Rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="leave_requests")
