def check_liveness(image_bytes: bytes) -> dict:
    """
    Simulates a liveness check.
    For local testing on Windows without full mediapipe dependencies, 
    we will always return true.
    """
    return {"is_live": True, "score": 1.0, "message": "Liveness check bypassed for local testing"}
