import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Ledger = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/customers`);
        setCustomers(res.data.data);
      } catch (error) { console.error("Failed to fetch customers"); }
    };
    fetchCustomers();
  }, []);

  return (
    <div style={{ padding: '32px', color: '#f8fafc' }}>
      <h2 style={{ margin: '0 0 20px 0' }}>Customer Ledger</h2>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', textAlign: 'left' }}>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#94a3b8' }}>Name</th>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#94a3b8' }}>Phone</th>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#94a3b8' }}>Status / Balance</th>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#94a3b8' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c._id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '16px' }}>{c.name}</td>
                <td style={{ padding: '16px', color: '#cbd5e1' }}>{c.phone}</td>
                
                <td style={{ padding: '16px' }}>
                  {c.balance > 0 ? (
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>₹{c.balance.toFixed(2)} (Owes You)</span>
                  ) : c.balance < 0 ? (
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>₹{Math.abs(c.balance).toFixed(2)} (Advance)</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>₹0.00 (Settled)</span>
                  )}
                </td>

                <td style={{ padding: '16px' }}>
                  <Link to={`/crm/${c._id}`} style={{ padding: '8px 16px', backgroundColor: '#38bdf8', color: '#0f172a', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Ledger;