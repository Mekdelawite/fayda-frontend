import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // 1. Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 2. Verification & Table States
  const [faydaId, setFaydaId] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // እዚህ መሆን አለበት
  const [showTable, setShowTable] = useState(false); // እዚህ መሆን አለበት

  // 3. Admin States
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    fayda_id: '',
    fullName: '',
    dob: '',
    address: '',
    gender: 'Male',
    photo: 'https://i.pravatar.cc/150?u=' + Math.random()
  });

  // ገጹ ሲከፈት የቆየ Login እና History መኖሩን ቼክ ያደርጋል
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) setIsLoggedIn(true);

    const savedHistory = JSON.parse(localStorage.getItem('faydaHistory') || '[]');
    setHistory(savedHistory);
  }, []);

  // Login Logic
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://fayda-mock-api.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        localStorage.setItem('userToken', data.token);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("ሰርቨሩ አልተነሳም!");
    }
  };

  // ሁሉንም ተጠቃሚዎች ከ API ለማምጣት (አሁን በ App ውስጥ ነው)
 const fetchAllUsers = async () => {
  setLoading(true);
  try {
    const res = await fetch('https://fayda-mock-api.onrender.com/all-users');
    const result = await res.json();
    
    // ዳታው መኖሩን ለማረጋገጥ console ላይ ቼክ አድርግ
    console.log("Fetched Data:", result);

    if (res.ok && result.data) {
      setAllUsers(result.data);
      setShowTable(true);
    }
  } catch (err) {
    alert("መረጃውን ማምጣት አልተቻለም");
  } finally {
    setLoading(false);
  }
};
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    if (val.length <= 12) setFaydaId(formatted);
  };

  const handleVerify = async () => {
    const cleanId = faydaId.replace(/\s/g, '');
    if (cleanId.length !== 12) {
      setError('እባክዎ 12 አሃዝ በትክክል ያስገቡ');
      return;
    }
    setLoading(true);
    setError('');
    setUserData(null);
    try {
      const response = await fetch('https://fayda-mock-api.onrender.com/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber: cleanId })
      });
      const result = await response.json();
      if (response.ok) {
        setUserData(result.data);
        const newHistory = [result.data, ...history.filter(h => h.fayda_id !== cleanId)].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem('faydaHistory', JSON.stringify(newHistory));
      } else {
        setError('ተጠቃሚው አልተገኘም');
      }
    } catch (err) {
      setError('የሰርቨር ግንኙነት ተቋርጧል።');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('https://fayda-mock-api.onrender.com/add-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Fayda-Secure-2024' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('ተመዝግቧል!');
        setIsAdmin(false);
        setFaydaId(formData.fayda_id);
        handleVerify();
      }
    } catch (err) { alert('ስህተት!'); } finally { setLoading(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card scale-in">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Flag_of_Ethiopia_%281975%E2%80%931987%29.svg/250px-Flag_of_Ethiopia_%281975%E2%80%931987%29.svg.png" />
          <h2>Fayda Verifier Login</h2>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="nav-brand">
          <img src="https://play-lh.googleusercontent.com/tx1qrpGe0b6uBTadJqLqF64_HW-ehqnH_00J5L5CxjtDPu84eDgnDvSD5d9OTHe3Suw" height="30" alt="Logo" />
          <span>Fayda e-KYC Portal</span>
        </div>
        <div className="nav-actions">
          <button className="admin-btn" onClick={() => setIsAdmin(!isAdmin)}>
            {isAdmin ? '🔍 Verify Mode' : '⚙️ Admin Mode'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="modern-app">
        <div className="glass-panel">
          <header className="hero-header">
            <div className="ethio-stripe"></div>
            <h1>National e-ID Verifier</h1>
            <p>{isAdmin ? "Register New Citizen" : "Secure Digital Identity Verification"}</p>
          </header>

          {!isAdmin ? (
            <div className="verification-section">
              <div className="input-group">
                <div className="input-wrapper">
                  <span className="input-icon">🆔</span>
                  <input type="text" placeholder="0000 0000 0000" value={faydaId} onChange={handleInputChange} />
                </div>
                <button onClick={handleVerify}>Verify Identity</button>
              </div>

              {error && <div className="modern-error">{error}</div>}

              {userData && (
                <div className="modern-card scale-in">
                  <div className="verification-stamp">VERIFIED</div>
                  <div className="card-content">
                    <img src={userData.photo} alt="Profile" className="modern-photo" />
                    <div className="user-info">
                      <h3>{userData.fullName}</h3>
                      <p className="fayda-num">{userData.fayda_id}</p>
                      <p>{userData.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* All Users Button */}
              <div className="all-users-section">
                <button className="fetch-btn" onClick={fetchAllUsers}>
                  📊 {showTable ? 'Hide Citizens List' : 'View All Registered Citizens'}
                </button>
                {showTable && (
                  <div className="table-container scale-in">
                    <table className="modern-table">
                      <thead>
                        <tr><th>Photo</th><th>Name</th><th>Fayda ID</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {allUsers.map((user, index) => (
                          <tr key={index} onClick={() => {setFaydaId(user.fayda_id); setShowTable(false);}}>
                            <td><img src={user.photo} width="30" style={{borderRadius: '50%'}} /></td>
                            <td>{user.fullName}</td>
                            <td>{user.fayda_id}</td>
                            <td><span className="status-badge">Active</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-panel scale-in">
              <form onSubmit={handleAdminAction} className="admin-form">
                <input type="text" placeholder="Fayda ID" required onChange={e => setFormData({...formData, fayda_id: e.target.value})} />
                <input type="text" placeholder="Full Name" required onChange={e => setFormData({...formData, fullName: e.target.value})} />
                <input type="text" placeholder="Address" required onChange={e => setFormData({...formData, address: e.target.value})} />
                <button type="submit" className="save-btn">Register Citizen</button>
              </form>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        <div className="history-glass">
          <h3>Recent Activity</h3>
          {history.map((user, i) => (
            <div key={i} className="history-card" onClick={() => setFaydaId(user.fayda_id)}>
               <p>{user.fullName}</p>
               <small>{user.fayda_id}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
