import { useRef, useState, useEffect, useCallback } from 'react';
import { ScanFace } from 'lucide-react';
import api from '../api/axios';

export default function LiveAttendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isProcessingRef = useRef(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', text: 'Looking for a face...' });
  const [locationCoords, setLocationCoords] = useState(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setHasCamera(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setHasCamera(true);
    } catch {
      setStatus({ type: 'error', text: 'Camera access denied. Please grant camera permission.' });
    }
  }, []);

  const captureAndCheckIn = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessingRef.current) return;
    
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    isProcessingRef.current = true;
    setStatus({ type: 'idle', text: 'Analyzing...' });

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        isProcessingRef.current = false;
        return;
      }

      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');
      if (locationCoords) {
        formData.append('latitude', locationCoords.lat.toString());
        formData.append('longitude', locationCoords.lng.toString());
      }

      try {
        const res = await api.post('/attendance/check-in', formData);
        setStatus({ 
          type: 'success', 
          text: `Welcome, ${res.data.username}! ${res.data.type} recorded at ${new Date(res.data.timestamp).toLocaleTimeString()}` 
        });
        
        // Cooldown for 4 seconds after successful check-in
        setTimeout(() => {
          setStatus({ type: 'idle', text: 'Looking for a face...' });
          isProcessingRef.current = false;
        }, 4000);
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'Recognition failed.';
        setStatus({ type: 'error', text: errorMsg });
        
        // Cooldown for 2.5 seconds on error before retrying
        setTimeout(() => {
          setStatus({ type: 'idle', text: 'Looking for a face...' });
          isProcessingRef.current = false;
        }, 2500);
      }
    }, 'image/jpeg', 0.85);
  }, [locationCoords]);

  useEffect(() => {
    startCamera();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation denied or unavailable", err)
      );
    }
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Periodic attendance capture loop
  useEffect(() => {
    if (!hasCamera) return;

    const interval = setInterval(() => {
      if (!isProcessingRef.current) {
        captureAndCheckIn();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [hasCamera, captureAndCheckIn]);

  return (
    <div className="flex justify-center items-center" style={{ minHeight: '70vh' }}>
      <div className="glass-panel p-6 text-center" style={{ width: '100%', maxWidth: '800px' }}>
        <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-4">
          <ScanFace size={28} color="var(--accent-color)" /> Live Attendance
        </h2>
        <p className="text-secondary mb-6">Stand in front of the camera to automatically log your attendance.</p>
        
        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', margin: '0 auto', border: '2px solid var(--glass-border)', aspectRatio: '16/9', backgroundColor: '#000' }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Overlay scanning UI */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            border: status.type === 'success' ? '4px solid var(--success)' : status.type === 'error' ? '4px solid var(--error)' : '4px solid transparent',
            transition: 'border 0.3s ease',
            pointerEvents: 'none'
          }}>
            {status.text === 'Analyzing...' && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: 'var(--accent-color)',
                boxShadow: '0 0 10px var(--accent-color)',
                animation: 'scan 2s infinite linear'
              }} />
            )}
          </div>
        </div>

        <div style={{ 
          marginTop: '2rem',
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : status.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
          color: status.type === 'success' ? '#6ee7b7' : status.type === 'error' ? '#fca5a5' : '#93c5fd',
          border: `1px solid ${status.type === 'success' ? 'var(--success)' : status.type === 'error' ? 'var(--error)' : 'var(--accent-color)'}`,
          fontWeight: '500',
          fontSize: '1.25rem'
        }}>
          {status.text}
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scan {
            0% { top: 10%; }
            50% { top: 90%; }
            100% { top: 10%; }
          }
        `}} />
      </div>
    </div>
  );
}
