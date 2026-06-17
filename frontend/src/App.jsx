import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import CameraScan from './components/CameraScan';
import Ledger from './components/Ledger';
import RegisterCustomer from './components/RegisterCustomer';
import AdminLogin from './components/AdminLogin';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const custRes = await axios.get(`${API_URL}/api/customers/${id}`);
        setCustomer(custRes.data.data);
        setEditForm({ name: custRes.data.data.name, phone: custRes.data.data.phone, email: custRes.data.data.email });
        const transRes = await axios.get(`${API_URL}/api/customers/${id}/transactions`);
        setTransactions(transRes.data.data);
      } catch (error) { console.error("Failed to fetch data"); }
    };
    fetchData();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/api/customers/${id}`, editForm);
      setCustomer(res.data.data);
      setIsEditing(false);
      alert('Profile updated!');
    } catch (error) { alert('Failed to update.'); }
  };

  if (!customer) return <p style={{ color: '#fff', padding: '20px' }}>Loading...</p>;

  return (
    <div style={{ padding: '32px', backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '20px', padding: '8px 16px', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>&larr; Back to Shop</button>
      
      <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '10px', maxWidth: '500px' }}>
        {isEditing ? (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ padding: '12px', borderRadius: '4px' }} required />
            <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} style={{ padding: '12px', borderRadius: '4px' }} required />
            <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} style={{ padding: '12px', borderRadius: '4px' }} required />
            <button type="submit" style={{ padding: '12px', background: '#38bdf8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
            <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          </form>
        ) : (
          <div>
            <h2>{customer.name}</h2>
            <p>Phone: {customer.phone} | Email: {customer.email}</p>
            <h3 style={{ color: customer.balance > 0 ? '#ef4444' : '#10b981' }}>Balance: ₹{Math.abs(customer.balance).toFixed(2)}</h3>
            <button onClick={() => setIsEditing(true)} style={{ padding: '10px 20px', background: '#38bdf8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>Edit Details</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerLogin() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/customer`, { phone });
      if (res.data.success) { navigate(`/my-portal/${res.data.data._id}`); }
    } catch (err) { setError(err.response?.data?.message || 'Failed to login.'); }
  };

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ maxWidth: '400px', padding: '40px', backgroundColor: '#1e293b', borderRadius: '10px', textAlign: 'center', color: '#fff' }}>
        <h2>Customer Portal Login</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Enter phone to view Khata.</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '15px', borderRadius: '5px' }} required />
          {error && <p style={{ color: '#ef4444' }}>{error}</p>}
          <button type="submit" style={{ padding: '15px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    </div>
  );
}

function CustomerPortalDashboard() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const custRes = await axios.get(`${API_URL}/api/customers/${id}`);
        setCustomer(custRes.data.data);
        const transRes = await axios.get(`${API_URL}/api/customers/${id}/transactions`);
        setTransactions(transRes.data.data);
      } catch (error) { console.error("Failed to fetch data"); }
    };
    fetchData();
  }, [id]);

  if (!customer) return <p style={{ color: '#fff' }}>Loading...</p>;

  return (
    <div style={{ padding: '32px', backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#1e293b', padding: '32px', borderRadius: '12px' }}>
        <h2 style={{ textAlign: 'center' }}>Hello, {customer.name}!</h2>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#0f172a', borderRadius: '8px', margin: '20px 0' }}>
          <h3>Current Balance</h3>
          <p style={{ fontSize: '36px', color: customer.balance > 0 ? '#ef4444' : '#10b981' }}>
            ₹{Math.abs(customer.balance).toFixed(2)} {customer.balance > 0 ? '(Due)' : customer.balance < 0 ? '(Advance)' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(localStorage.getItem('adminAuth') === 'true');

  const handleAdminLogin = () => {
    localStorage.setItem('adminAuth', 'true');
    setIsAdminLoggedIn(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAdminLoggedIn(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <Overview />;
      case 'camera': return <CameraScan />;
      case 'register': return <RegisterCustomer />;
      case 'ledger': return <Ledger />;
      default: return <Overview />;
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          !isAdminLoggedIn ? (
            <AdminLogin onLogin={handleAdminLogin} />
          ) : (
            <div style={{ display: 'flex', backgroundColor: '#0f172a', minHeight: '100vh', margin: 0, fontFamily: 'system-ui' }}>
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleAdminLogout} />
              <div style={{ marginLeft: '260px', flex: 1 }}>
                {renderContent()}
              </div>
            </div>
          )
        } />
        
        <Route path="/crm/:id" element={
          !isAdminLoggedIn ? <AdminLogin onLogin={handleAdminLogin} /> : <CustomerDetail />
        } />
        
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/my-portal/:id" element={<CustomerPortalDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}