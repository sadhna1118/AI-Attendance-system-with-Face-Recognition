"""
Wrapper delegating to face_engine to maintain backwards compatibility 
while avoiding module naming collisions with the external face_recognition package.
"""
try:
    from .face_engine import get_face_encoding, compare_faces
except (ImportError, ValueError):
    from ai.face_engine import get_face_encoding, compare_faces

__all__ = ["get_face_encoding", "compare_faces"]
