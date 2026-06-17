import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RegisterCustomer = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } catch (err) { alert("Could not access camera. Please check your browser permissions."); }
  };

  const capturePhoto = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], "new_face.jpg", { type: "image/jpeg" });
      setImageFile(file);
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraActive(false);
    }, 'image/jpeg');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Please capture a face photo first!");

    setIsSubmitting(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('phone', formData.phone);
    data.append('email', formData.email); 
    data.append('faceImage', imageFile);

    try {
      await axios.post(`${API_URL}/api/customers/register`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Customer registered successfully!');
      setFormData({ name: '', phone: '', email: '' });
      setImageFile(null);
    } catch (error) {
      console.error(error);
      alert('Failed to save to database. Check Node.js terminal for errors!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px', color: '#f8fafc' }}>
      <h2 style={{ margin: '0 0 20px 0' }}>Register New Customer</h2>
      <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', maxWidth: '500px' }}>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="text" placeholder="Customer Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155' }} />
          <input type="text" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155' }} />
          <input type="email" placeholder="Email Address (For Receipts)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155' }} />

          <div style={{ padding: '20px', border: '2px dashed #475569', borderRadius: '8px', textAlign: 'center' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '8px', display: isCameraActive ? 'block' : 'none', marginBottom: '10px' }}></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            
            {!isCameraActive && !imageFile && (
              <button type="button" onClick={startCamera} style={{ padding: '10px 20px', backgroundColor: '#38bdf8', color: '#0f172a', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', border: 'none' }}>
                📷 Turn On Webcam
              </button>
            )}
            
            {isCameraActive && (
              <button onClick={capturePhoto} style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', border: 'none' }}>
                📸 Snap Photo
              </button>
            )}

            {imageFile && !isCameraActive && (
              <div>
                <p style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Face Captured Successfully!</p>
                <button type="button" onClick={() => { setImageFile(null); startCamera(); }} style={{ padding: '8px', backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  Retake Photo
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} style={{ padding: '14px', backgroundColor: isSubmitting ? '#475569' : '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'Saving to Database...' : 'Save Customer & Face Data'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default RegisterCustomer;