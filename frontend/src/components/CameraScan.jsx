import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

const CameraScan = () => {
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [dbCustomers, setDbCustomers] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/customers`);
        setDbCustomers(res.data.data);
      } catch (error) { console.error("Failed to fetch customers"); }
    };
    fetchCustomers();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('new_scan', (data) => {
      setActiveCustomer(data.customer);
      setScanHistory((prevHistory) => [data, ...prevHistory].slice(0, 5));
    });

    return () => { 
        socket.off('connect'); 
        socket.off('disconnect'); 
        socket.off('new_scan'); 
    };
  }, []);

  const simulateCameraScan = (customer) => {
    const fakeScanData = { customer: customer, scannedAt: Math.floor(Date.now() / 1000) };
    setActiveCustomer(customer);
    setScanHistory((prev) => [fakeScanData, ...prev].slice(0, 5));
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsScanning(true);
    setTimeout(() => {
      if (dbCustomers.length > 0) {
        const randomIndex = Math.floor(Math.random() * dbCustomers.length);
        simulateCameraScan(dbCustomers[randomIndex]);
      } else { alert("No customers in database to match!"); }
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 1500);
  };

  const handleTransaction = async (type) => {
    if (!activeCustomer) return;
    const amountStr = window.prompt(`Enter ${type} amount (₹):`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return alert("Please enter a valid positive number.");
    const notes = window.prompt("Enter notes (optional):") || '';

    try {
      const response = await axios.post(`${API_URL}/api/transactions`, {
        customerId: activeCustomer._id, type: type, amount: amount, notes: notes
      });
      if (response.data.success) {
        alert('Transaction logged & Email Receipt sent!');
        setActiveCustomer({ ...activeCustomer, balance: response.data.newBalance });
        setDbCustomers(dbCustomers.map(c => c._id === activeCustomer._id ? { ...c, balance: response.data.newBalance } : c));
      }
    } catch (error) { alert("Failed to log transaction."); }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '32px' }}>
      <aside style={{ flex: '1 1 250px', maxWidth: '300px', padding: '20px', backgroundColor: '#1e293b', borderRadius: '10px', border: '1px solid #334155', color: '#f8fafc' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>📷 Live Camera</h3>
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px dashed #475569' }}>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>Take a live photo or upload to simulate AI detection.</p>
          <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoCapture} style={{ display: 'none' }} id="camera-input" />
          <label htmlFor="camera-input" style={{ display: 'block', width: '100%', padding: '15px 0', backgroundColor: '#38bdf8', color: '#0f172a', textAlign: 'center', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
            {isScanning ? '⏳ Analyzing Face...' : '📸 Open Camera'}
          </label>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '15px' }}>Or select manually:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dbCustomers.map(c => (
            <button key={c._id} onClick={() => simulateCameraScan(c)} disabled={isScanning} style={{ padding: '10px', backgroundColor: '#334155', color: '#f8fafc', border: 'none', borderRadius: '5px', cursor: isScanning ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: isScanning ? 0.5 : 1 }}>
              <strong>{c.name}</strong>
            </button>
          ))}
        </div>
      </aside>

      <section style={{ flex: '2 1 400px', padding: '20px', backgroundColor: '#1e293b', borderRadius: '10px', border: '1px solid #334155', color: '#f8fafc' }}>
        <h2 style={{ margin: '0 0 15px 0' }}>Live Point of Sale</h2>
        <div style={{ padding: '8px 12px', borderRadius: '20px', backgroundColor: isConnected ? '#064e3b' : '#7f1d1d', color: isConnected ? '#34d399' : '#fca5a5', display: 'inline-block', marginBottom: '15px', fontSize: '12px' }}>
          {isConnected ? '🟢 Server Online' : '🔴 Server Offline'}
        </div>
        
        {isScanning ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <h3 style={{ color: '#38bdf8' }}>Running Recognition...</h3>
            <p style={{ color: '#94a3b8' }}>Checking local database</p>
          </div>
        ) : activeCustomer ? (
          <div>
            <h3 style={{ fontSize: '28px', margin: '0 0 10px 0', color: '#38bdf8' }}>{activeCustomer.name}</h3>
            <p><strong>Phone:</strong> {activeCustomer.phone}</p>
            
            <div style={{ 
              marginTop: '20px', padding: '15px', borderRadius: '8px',
              backgroundColor: activeCustomer.balance > 0 ? '#451a03' : activeCustomer.balance < 0 ? '#064e3b' : '#334155' 
            }}>
              <h4 style={{ margin: 0, color: '#f8fafc' }}>Current Khata Status</h4>
              
              {activeCustomer.balance > 0 ? (
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#fca5a5' }}>
                  ₹{activeCustomer.balance.toFixed(2)} <span style={{fontSize: '14px', fontWeight: 'normal', color: '#f8fafc'}}>(Outstanding Debt)</span>
                </p>
              ) : activeCustomer.balance < 0 ? (
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#34d399' }}>
                  ₹{Math.abs(activeCustomer.balance).toFixed(2)} <span style={{fontSize: '14px', fontWeight: 'normal', color: '#f8fafc'}}>(Advance Cash)</span>
                </p>
              ) : (
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#cbd5e1' }}>
                  ₹0.00 <span style={{fontSize: '14px', fontWeight: 'normal', color: '#f8fafc'}}>(Settled)</span>
                </p>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button onClick={() => handleTransaction('payment')} style={{ flex: 1, padding: '15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Receive Payment</button>
              <button onClick={() => handleTransaction('purchase')} style={{ flex: 1, padding: '15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Purchase</button>
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8', marginTop: '40px' }}>Awaiting camera input...</p>
        )}
      </section>

      <aside style={{ flex: '1 1 200px', padding: '20px', backgroundColor: '#1e293b', borderRadius: '10px', border: '1px solid #334155', color: '#f8fafc' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Recent Scans</h3>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {scanHistory.map((scan, index) => (
            <li key={index} style={{ padding: '10px', borderBottom: '1px solid #334155', fontSize: '14px' }}>
              <strong>{scan.customer.name}</strong><br/>
              <small style={{ color: '#94a3b8' }}>{new Date(scan.scannedAt * 1000).toLocaleTimeString()}</small>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
};

export default CameraScan;