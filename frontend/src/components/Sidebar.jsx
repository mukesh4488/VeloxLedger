import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => { 
  const menuItems = [
    { id: 'overview', label: '📊 Shop Overview', desc: 'Quick business metrics' },
    { id: 'camera', label: '📷 Live Face Scan', desc: 'Real-time AI recognition' },
    { id: 'register', label: '➕ Add Customer', desc: 'Register new face & details' },
    { id: 'ledger', label: '📒 Customer Ledger', desc: 'Manage purchases & accounts' },
  ];

  return (
    <div style={{
      width: '260px', height: '100vh', backgroundColor: '#1e293b', color: '#f8fafc',
      padding: '24px 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
      gap: '24px', position: 'fixed', top: 0, left: 0
    }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#38bdf8' }}>VeloxLedger</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Modern Business Intelligence</p>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: 0 }} />
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none',
                backgroundColor: isActive ? '#38bdf8' : 'transparent',
                color: isActive ? '#0f172a' : '#cbd5e1',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', flexDirection: 'column', gap: '2px'
              }}
            >
              <span style={{ fontWeight: '600', fontSize: '14px' }}>{item.label}</span>
              <span style={{ fontSize: '11px', color: isActive ? '#334155' : '#64748b' }}>{item.desc}</span>
            </button>
          );
        })}
      </nav>

      <button 
        onClick={onLogout}
        style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        🚪 Secure Logout
      </button>

    </div>
  );
};

export default Sidebar;