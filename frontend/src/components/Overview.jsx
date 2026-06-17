import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Overview = () => {
  const [statsData, setStatsData] = useState({
    totalOutstanding: 0,
    totalAdvance: 0,
    totalCustomers: 0,
    clearedAccounts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/customers`);
        const customers = res.data.data;

        let outstanding = 0;
        let advance = 0;
        let cleared = 0;

        customers.forEach(customer => {
          if (customer.balance > 0) {
            outstanding += customer.balance;
          } else if (customer.balance < 0) {
            advance += Math.abs(customer.balance); 
          } else {
            cleared += 1;
          }
        });

        setStatsData({
          totalOutstanding: outstanding,
          totalAdvance: advance,
          totalCustomers: customers.length,
          clearedAccounts: cleared
        });
      } catch (error) {
        console.error("Failed to fetch live stats", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveStats();
  }, []);

  const stats = [
    { title: 'Total Outstanding Khata', value: `₹ ${statsData.totalOutstanding.toFixed(2)}`, color: '#ef4444' },
    { title: 'Customer Advance Cash', value: `₹ ${statsData.totalAdvance.toFixed(2)}`, color: '#10b981' },
    { title: 'Total Registered Customers', value: statsData.totalCustomers.toString(), color: '#38bdf8' },
    { title: 'Cleared Accounts', value: statsData.clearedAccounts.toString(), color: '#94a3b8' }
  ];

  return (
    <div style={{ padding: '32px', color: '#f8fafc', width: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: '28px', margin: '0 0 8px 0' }}>Shop Overview</h1>
      <p style={{ color: '#94a3b8', margin: '0 0 32px 0' }}>Welcome back. Here is your live business data.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>{stat.title}</h3>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: stat.color }}>
              {isLoading ? '...' : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>Financial Health</h3>
        <p style={{ color: '#94a3b8' }}>
          🟢 Your ledger correctly separates outstanding debts from customer overpayments (advances).
        </p>
      </div>
    </div>
  );
};

export default Overview;