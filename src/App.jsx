import React, { useState, useEffect } from 'react';
import './App.css';

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
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  });
};

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
    fullName: '', email: '', dob: '', address: '', gender: 'Male', nationality: 'Ethiopian',
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
      if (data.success) { setIsLoggedIn(true); localStorage.setItem('userToken', data.token); }
      else { alert(data.message); }
    } catch (err) { alert("Server Error!"); } finally { setLoading(false); }
  };

  const handleVerify = async (idToVerify) => {
    const cleanId = (idToVerify || faydaId).replace(/\s/g, '');
    setLoading(true); setError(''); setUserData(null);
    try {
      const response = await fetch(`${API_BASE}/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber: cleanId })
      });
      const result = await response.json();
      if (response.ok) { setUserData(result.data); }
      else { setError('ተጠቃሚው አልተገኘም'); }
    } catch (err) { setError('ግንኙነት ተቋርጧል'); } finally { setLoading(false); }
  };

  const handleAdminAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/add-person`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) { alert(`ተመዝግቧል! ID: ${result.fayda_id}`); setIsAdmin(false); handleVerify(result.fayda_id); }
    } catch (err) { alert('ስህተት ተፈጥሯል'); } finally { setLoading(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <form onSubmit={handleLogin} className="login-form">
          <h2>Fayda Login</h2>
          <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
          <button type="submit">{loading ? '...' : 'Login'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="nav-brand">FAYDA e-KYC Portal</div>
        <div className="nav-actions">
          <button onClick={() => setIsAdmin(!isAdmin)}>{isAdmin ? '🔍 Verify' : '⚙️ Admin'}</button>
          <button onClick={() => { localStorage.removeItem('userToken'); setIsLoggedIn(false); }}>Logout</button>
        </div>
      </nav>

      <div className="modern-app">
        {!isAdmin ? (
          <div className="glass-panel">
            <div className="input-group">
              <input type="text" placeholder="Enter Fayda ID" value={faydaId} onChange={(e) => setFaydaId(e.target.value)} />
              <button onClick={() => handleVerify()}>Verify</button>
            </div>

            {userData && (
              <div className="id-card-wrapper">
                {/* --- REAL FAYDA ID DESIGN --- */}
                <div className="fayda-card" id="printable-card">
                  <div className="card-header">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Emblem_of_Ethiopia.svg/120px-Emblem_of_Ethiopia.svg.png" className="emblem" alt="ETH" />
                    <div className="header-titles">
                      <p className="am">የኢትዮጵያ ዲጂታል መታወቂያ ካርድ</p>
                      <p className="en">Ethiopian Digital ID Card</p>
                    </div>
                    <div className="fayda-logo-top">
                      <img src="https://fayda.ethid.et/img/logo_fayda.png" alt="Logo" />
                    </div>
                  </div>

                  <div className="card-body">
                    <img src={userData.photo} className="citizen-photo" alt="Citizen" />
                    <div className="citizen-details">
                      <div className="detail-row">
                        <label>ሙሉ ስም / First, Middle, Surname</label>
                        <p className="val-am">{userData.fullname}</p>
                        <p className="val-en">{userData.fullname}</p>
                      </div>
                      <div className="detail-row">
                        <label>የትውልድ ቀን / Date of Birth</label>
                        <p className="val-am">{userData.dob}</p>
                      </div>
                      <div className="detail-row">
                        <label>ጾታ / SEX</label>
                        <p className="val-am">{userData.gender || 'ወንድ / Male'}</p>
                      </div>
                      <div className="detail-row">
                        <label>ዜግነት / Country of Citizenship</label>
                        <p className="val-am">ኢትዮጵያ / Ethiopian</p>
                      </div>
                    </div>
                    <div className="watermark-star"></div>
                  </div>

                  <div className="card-footer">
                    <div className="fcn-box">
                      <span className="fcn-label">FCN</span>
                      <span className="fcn-value">{userData.fayda_id}</span>
                    </div>
                    <div className="digital-copy-tag">
                       <img src="https://fayda.ethid.et/img/logo_fayda.png" alt="f" />
                       <span>Digital Copy</span>
                    </div>
                  </div>
                  
                  <div className="bottom-barcode-area">
                    <img src={`https://bwipjs-cdn.micr.be/?bcid=code128&text=${userData.fayda_id}&scale=2&height=8`} alt="barcode" />
                    <p>{userData.fayda_id}</p>
                  </div>
                </div>
                <button className="print-btn" onClick={() => window.print()}>🖨️ Print Card</button>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel">
            <h3>Register Citizen</h3>
            <form onSubmit={handleAdminAction} className="admin-form">
              <input type="text" placeholder="Full Name" onChange={e => setFormData({...formData, fullName: e.target.value})} required />
              <input type="date" onChange={e => setFormData({...formData, dob: e.target.value})} required />
              <select onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <input type="file" accept="image/*" onChange={async (e) => {
                const img = await resizeAndConvert(e.target.files[0]);
                setFormData({...formData, photo: img});
              }} required />
              <button type="submit">Register</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
