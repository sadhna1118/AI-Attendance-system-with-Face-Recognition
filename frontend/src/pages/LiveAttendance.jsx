import { useRef, useState, useEffect } from 'react';
import { ScanFace } from 'lucide-react';
import api from '../api/axios';

export default function LiveAttendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', text: 'Looking for a face...' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);

  useEffect(() => {
    startCamera();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation denied or error", err)
      );
    }
    return () => stopCamera();
  }, []);

  // Set up an interval to capture frames every 2 seconds for continuous attendance check
  useEffect(() => {
    if (!stream) return;
    
    const interval = setInterval(() => {
      if (!isProcessing && status.type !== 'success') {
        captureAndCheckIn();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [stream, isProcessing, status]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Camera access denied.' });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndCheckIn = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    setStatus({ type: 'idle', text: 'Analyzing...' });

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if(canvas.width === 0) {
      setIsProcessing(false);
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');
      if (locationCoords) {
        formData.append('latitude', locationCoords.lat.toString());
        formData.append('longitude', locationCoords.lng.toString());
      }

      try {
        const res = await api.post('/attendance/check-in', formData);
        setStatus({ type: 'success', text: `Welcome, ${res.data.username}! ${res.data.type} recorded at ${new Date(res.data.timestamp).toLocaleTimeString()}` });
        
        // Reset after 5 seconds to allow the next person to scan
        setTimeout(() => setStatus({ type: 'idle', text: 'Looking for a face...' }), 5000);
      } catch (err) {
        // Only show error briefly, then resume scanning
        setStatus({ type: 'error', text: err.response?.data?.detail || 'Recognition failed.' });
        setTimeout(() => setStatus({ type: 'idle', text: 'Looking for a face...' }), 2000);
      } finally {
        setIsProcessing(false);
      }
    }, 'image/jpeg', 0.8);
  };

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
            {/* Simple scanning animation line if analyzing */}
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
