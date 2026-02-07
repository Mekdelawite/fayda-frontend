import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = "https://fayda-mock-api.onrender.com";

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
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dob: '',
    address: '',
    photo: `https://i.pravatar.cc/150?u=${Math.random()}`
  });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) setIsLoggedIn(true);
  }, []);

  const resizeAndConvert = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const compressedBase64 = await resizeAndConvert(file);
      setFormData({ ...formData, photo: compressedBase64 });
      setLoading(false);
    }
  };

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
      } else { alert(data.message); }
    } catch (err) { alert("Server Down!"); } finally { setLoading(false); }
  };

  const handleVerify = async (idToVerify) => {
    const cleanId = (idToVerify || faydaId).replace(/\s/g, '');
    if(!cleanId) return;
    setLoading(true); setError(''); setUserData(null);
    try {
      const response = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber: cleanId })
      });
      const result = await response.json();
      if (response.ok) { setUserData(result.data); } 
      else { setError('ተጠቃሚው አልተገኘም'); }
    } catch (err) { setError('ግንኙነት ተቋርጧል።'); } finally { setLoading(false); }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/all-users`);
      const result = await res.json();
      if (result.success) { setAllUsers(result.data); setShowTable(true); }
    } catch (err) { alert("Error fetching data"); } finally { setLoading(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <form onSubmit={handleLogin} className="login-form scale-in">
          <h2>Fayda Login</h2>
          <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="nav-brand"><span>FAYDA e-KYC Portal</span></div>
        <div className="nav-actions">
          <button onClick={() => setIsAdmin(!isAdmin)}>{isAdmin ? '🔍 Verify Mode' : '⚙️ Admin Mode'}</button>
          <button onClick={() => { localStorage.removeItem('userToken'); setIsLoggedIn(false); }}>Logout</button>
        </div>
      </nav>

      <div className="modern-app">
        <div className="glass-panel scale-in">
          {!isAdmin ? (
            <div className="verification-section">
              <div className="input-group">
                <input type="text" placeholder="Enter Fayda ID" value={faydaId} onChange={(e) => setFaydaId(e.target.value)} />
                <button onClick={() => handleVerify()} disabled={loading}>Verify Identity</button>
              </div>

              {error && <div className="modern-error">{error}</div>}

              {userData && (
                <div id="print-area">
                  <div className="fayda-card">
                    {/* Header */}
                    <div className="card-header-inner">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Emblem_of_Ethiopia.svg/120px-Emblem_of_Ethiopia.svg.png" width="45" alt="ETH" />
                      <div className="header-text">
                        <div className="amharic-title">የኢትዮጵያ ዲጂታል መታወቂያ ካርድ</div>
                        <div className="english-title">Ethiopian Digital ID Card</div>
                      </div>
                      <img src="https://fayda.ethid.et/img/logo_fayda.png" width="40" alt="Logo" />
                    </div>

                    {/* Body */}
                    <div className="card-body-inner">
                      <div className="watermark">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Emblem_of_Ethiopia.svg/500px-Emblem_of_Ethiopia.svg.png" width="250" alt="star" />
                      </div>

                      <img src={userData.photo} className="card-photo" alt="p" />
                      
                      <div className="card-info-cols">
                        <div className="info-item">
                          <small>ሙሉ ስም / Full Name</small>
                          <div>{userData.fullname}</div>
                        </div>
                        <div className="info-item">
                          <small>የትውልድ ቀን / DOB</small>
                          <div>{userData.dob}</div>
                        </div>
                        <div className="info-item">
                          <small>ጾታ / SEX</small>
                          <div>{userData.gender || 'ወንድ / Male'}</div>
                        </div>
                      </div>

                      <div className="card-auth-section">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${userData.fayda_id}`} alt="QR" className="card-qr" />
                        <div className="signature-box">
                           <img src="https://upload.wikimedia.org/wikipedia/commons/f/f8/Signature_of_Zuzana_Caputova.svg" className="signature-img" alt="sign" />
                           <div className="official-stamp">FAYDA<br/>OFFICIAL</div>
                           <div className="registrar-line">Registrar General</div>
                        </div>
                      </div>
                    </div>

                    <div className="fcn-row">
                      <div className="fcn-text"><span>FCN</span> {userData.fayda_id}</div>
                      <div className="digital-copy-text">Digital Copy</div>
                    </div>

                    <div className="barcode-row">
                      <img src={`https://bwipjs-cdn.micr.be/?bcid=code128&text=${userData.fayda_id}&scale=2&height=8`} alt="barcode" />
                      <div className="barcode-number">{userData.fayda_id}</div>
                    </div>
                  </div>
                  <button onClick={() => window.print()} className="print-btn-action">🖨️ Print ID Card</button>
                </div>
              )}

              <div className="all-users-section">
                <button className="fetch-btn" onClick={fetchAllUsers}>📊 View All Citizens</button>
                {showTable && (
                  <div className="table-container">
                    <table className="modern-table">
                      <thead><tr><th>Name</th><th>ID</th><th>Action</th></tr></thead>
                      <tbody>
                        {allUsers.filter(u => u.fullname.includes(searchTerm)).map((user, i) => (
                          <tr key={i}>
                            <td onClick={() => handleVerify(user.fayda_id)} style={{cursor:'pointer'}}>{user.fullname}</td>
                            <td>{user.fayda_id}</td>
                            <td><button onClick={() => handleVerify(user.fayda_id)}>View</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-panel">
              <h3>Register New Citizen</h3>
              <form onSubmit={handleAdminAction} className="admin-form">
                <input type="text" placeholder="Full Name" required onChange={e => setFormData({...formData, fullName: e.target.value})} />
                <input type="date" required onChange={e => setFormData({...formData, dob: e.target.value})} />
                <input type="text" placeholder="Address" required onChange={e => setFormData({...formData, address: e.target.value})} />
                <input type="file" accept="image/*" onChange={handleFileUpload} required />
                <button type="submit" disabled={loading}>🚀 Register Citizen</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
