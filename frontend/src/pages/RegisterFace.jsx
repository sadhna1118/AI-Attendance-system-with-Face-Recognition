import { useRef, useState, useEffect } from 'react';
import { Camera, UploadCloud } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function RegisterFace() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to access camera. Please allow permissions.' });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndRegister = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'face.jpg');

      try {
        await api.post('/users/register-face', formData);
        setMessage({ type: 'success', text: 'Face registered successfully!' });
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to register face.' });
      } finally {
        setLoading(false);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="flex justify-center items-center" style={{ minHeight: '70vh' }}>
      <div className="glass-panel p-6 text-center" style={{ width: '100%', maxWidth: '600px' }}>
        <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-4">
          <UploadCloud size={28} color="var(--accent-color)" /> Enroll Your Face
        </h2>
        <p className="text-secondary mb-6">Look directly at the camera and ensure good lighting.</p>
        
        {message.text && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: message.type === 'error' ? '#fca5a5' : '#6ee7b7',
            border: `1px solid ${message.type === 'error' ? 'var(--error)' : 'var(--success)'}`
          }}>
            {message.text}
          </div>
        )}

        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', margin: '0 auto', border: '2px solid var(--glass-border)', aspectRatio: '4/3', backgroundColor: '#000' }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <button 
          onClick={captureAndRegister} 
          disabled={loading || !stream}
          className="btn btn-primary mt-6 flex items-center justify-center gap-4" 
          style={{ width: '100%' }}
        >
          <Camera size={20} />
          {loading ? 'Processing...' : 'Capture & Register'}
        </button>
      </div>
    </div>
  );
}
