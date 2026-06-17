import React, { useState } from 'react';

const AdminLogin = ({ onLogin }) => {
  const [pin, setPin] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === '8055') {
      onLogin();
    } else {
      alert('Incorrect PIN!');
    }
  };

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ maxWidth: '400px', padding: '40px', backgroundColor: '#1e293b', borderRadius: '10px', textAlign: 'center', color: '#fff' }}>
        <h2 style={{ color: '#38bdf8' }}>VeloxLedger Admin</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Enter Master PIN to continue</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="password" placeholder="Enter PIN" value={pin} onChange={(e) => setPin(e.target.value)} style={{ padding: '15px', borderRadius: '5px', textAlign: 'center', fontSize: '18px' }} required />
          <button type="submit" style={{ padding: '15px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Unlock Dashboard</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;