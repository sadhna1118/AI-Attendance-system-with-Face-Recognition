import face_recognition
import numpy as np
import base64
import cv2
import json

def get_face_encoding(image_bytes: bytes) -> str | None:
    """
    Takes an image in bytes, detects a face, and returns its 128D encoding as a JSON string.
    Returns None if no face or multiple faces are found.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(rgb_img)
    if len(face_locations) != 1:
        return None # Require exactly one face

    face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
    if len(face_encodings) > 0:
        encoding = face_encodings[0]
        return json.dumps(encoding.tolist())
    return None

def compare_faces(known_encoding_str: str, current_image_bytes: bytes, tolerance: float = 0.5) -> dict:
    """
    Compares a stored encoding with the face in the current image.
    Returns a dict with 'match' and 'confidence'.
    """
    known_encoding = np.array(json.loads(known_encoding_str))
    
    nparr = np.frombuffer(current_image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(rgb_img)
    if len(face_locations) == 0:
        return {"match": False, "error": "No face found"}
    
    face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
    if len(face_encodings) == 0:
        return {"match": False, "error": "Could not encode face"}

    current_encoding = face_encodings[0]
    
    # Calculate face distance
    face_distances = face_recognition.face_distance([known_encoding], current_encoding)
    distance = face_distances[0]
    
    match = bool(distance <= tolerance)
    # Convert distance to a confidence percentage (roughly)
    confidence = max(0.0, min(100.0, (1.0 - distance) * 100))
    
    return {
        "match": match,
        "confidence": f"{confidence:.2f}%",
        "distance": float(distance)
    }
