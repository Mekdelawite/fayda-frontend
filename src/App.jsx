import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [faydaId, setFaydaId] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // ለፍለጋ የተጨመረ

  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dob: '',
    address: '',
    photo: `https://i.pravatar.cc/150?u=${Math.random()}`
  });

  const API_BASE = "https://fayda-mock-api.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) setIsLoggedIn(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
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
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/all-users`);
      const result = await res.json();
      if (result.success) {
        setAllUsers(result.data);
        setShowTable(true);
      }
    } catch (err) {
      alert("መረጃውን ማምጣት አልተቻለም");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (idToVerify) => {
    const cleanId = (idToVerify || faydaId).replace(/\s/g, '');
    setLoading(true);
    setError('');
    setUserData(null);
    try {
      const response = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber: cleanId })
      });
      const result = await response.json();
      if (response.ok) {
        setUserData(result.data);
      } else {
        setError('ተጠቃሚው አልተገኘም');
      }
    } catch (err) {
      setError('ግንኙነት ተቋርጧል።');
    } finally {
      setLoading(false);
    }
  };

  // --- መረጃ ማስተካከያ (Update Logic) ---
  const handleUpdate = async (user) => {
    const newName = prompt("አዲስ ስም ያስገቡ:", user.fullname);
    const newAddress = prompt("አዲስ አድራሻ ያስገቡ:", user.address);

    if (!newName && !newAddress) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/update-person/${user.fayda_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullName: newName || user.fullname, 
          address: newAddress || user.address 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("መረጃው ተስተካክሏል!");
        fetchAllUsers(); // ዝርዝሩን ያድሳል
      }
    } catch (err) {
      alert("ማስተካከያው አልተሳካም");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/add-person`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        alert(`ተመዝግቧል! መታወቂያ ቁጥር፡ ${result.fayda_id}`);
        setIsAdmin(false);
        handleVerify(result.fayda_id);
      }
    } catch (err) {
      alert('የሰርቨር ስህተት!');
    } finally {
      setLoading(false);
    }
  };

  // --- የፍለጋ ተግባር (Search Logic) ---
  const filteredUsers = allUsers.filter(user => 
    user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.fayda_id?.includes(searchTerm)
  );

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="nav-brand"><span>Fayda e-KYC Portal</span></div>
        <div className="nav-actions">
          <button onClick={() => setIsAdmin(!isAdmin)}>{isAdmin ? '🔍 Verify Mode' : '⚙️ Admin Mode'}</button>
          <button onClick={() => { localStorage.removeItem('userToken'); setIsLoggedIn(false); }}>Logout</button>
        </div>
      </nav>

      <div className="modern-app">
        <div className="glass-panel">
          {!isAdmin ? (
            <div className="verification-section">
              <div className="input-group">
                <input type="text" placeholder="Enter Fayda ID" value={faydaId} onChange={(e) => setFaydaId(e.target.value)} />
                <button onClick={() => handleVerify()} disabled={loading}>Verify</button>
              </div>

              {error && <div className="modern-error">{error}</div>}

              {userData && (
                <div className="modern-card scale-in">
                  <div className="card-content">
                    <img src={userData.photo} alt="User" className="modern-photo" />
                    <div className="user-info">
                      <h3>{userData.fullname}</h3>
                      <p><strong>ID:</strong> {userData.fayda_id}</p>
                      <p><strong>Address:</strong> {userData.address}</p>
                      <span className="status-badge">{userData.status}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="all-users-section">
                <button className="fetch-btn" onClick={fetchAllUsers}>
                  {showTable ? 'Refresh List' : '📊 View All Citizens'}
                </button>

                {showTable && (
                  <div className="table-container scale-in">
                    <input 
                      type="text" 
                      placeholder="በስም ወይም በID ይፈልጉ..." 
                      className="search-bar"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <table className="modern-table">
                      <thead>
                        <tr><th>Name</th><th>Fayda ID</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user, i) => (
                          <tr key={i}>
                            <td onClick={() => {setFaydaId(user.fayda_id); setShowTable(false); handleVerify(user.fayda_id);}} style={{cursor:'pointer'}}>
                              {user.fullname}
                            </td>
                            <td>{user.fayda_id}</td>
                            <td>
                              <button className="edit-btn" onClick={() => handleUpdate(user)}>📝 Edit</button>
                            </td>
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
              <h3>Register New Citizen</h3>
              <form onSubmit={handleAdminAction} className="admin-form">
                <input type="text" placeholder="Full Name" required onChange={e => setFormData({...formData, fullName: e.target.value})} />
                <input type="email" placeholder="Email Address" required onChange={e => setFormData({...formData, email: e.target.value})} />
                <input type="date" required onChange={e => setFormData({...formData, dob: e.target.value})} />
                <input type="text" placeholder="Address" required onChange={e => setFormData({...formData, address: e.target.value})} />
                <button type="submit" disabled={loading}>Register Citizen</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
