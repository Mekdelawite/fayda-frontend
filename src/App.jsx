import React, { useState, useEffect } from 'react';
import './App.css';

// ምስልን ወደ Base64 እና Resize የሚያደርግ Utility Function
const resizeAndConvert = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // ስፋቱን ወደ 400px ይቀንሳል
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // ጥራቱን ወደ 70% ዝቅ በማድረግ የፋይሉን መጠን በጣም ይቀንሳል
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
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
    fullName: '',
    email: '',
    dob: '',
    address: '',
    photo: `https://i.pravatar.cc/150?u=${Math.random()}`, // Default photo for new users
    gender: '', // ጾታ ጨምረናል
    nationality: 'Ethiopian' // ዜግነት ጨምረናል
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
        fetchAllUsers();
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
      } else {
        alert(result.message || "ምዝገባው አልተሳካም!");
      }
    } catch (err) {
      alert('የሰርቨር ስህተት!');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setLoading(true);
        const compressedBase64 = await resizeAndConvert(file);
        setFormData({ ...formData, photo: compressedBase64 });
      } catch (err) {
        console.error("Photo processing error:", err);
        alert("ፎቶውን ማስተካከል አልተቻለም!");
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredUsers = allUsers.filter(user => 
    user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.fayda_id?.includes(searchTerm)
  );

  // --- Login Screen UI ---
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

  // --- Main App UI ---
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
                <div className="verification-container scale-in">
                  {/* --- Modern User Card (Preview) --- */}
                  <div className="modern-card">
                    <div className="card-content">
                      <img src={userData.photo} alt="User" className="modern-photo" />
                      <div className="user-info">
                        <h3>{userData.fullname}</h3>
                        <p><strong>ID:</strong> {userData.fayda_id}</p>
                        <p><strong>Residence:</strong> {userData.address}</p>
                        <div className="user-actions">
                          <button className="print-btn" onClick={() => window.print()}>🖨️ Print ID Card</button>
                          <span className="status-badge">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- Fayda ID Card for Printing (Exact Replica) --- */}
                  <div className="id-card-to-print">
                    <div className="id-card-header">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Emblem_of_Ethiopia.svg/120px-Emblem_of_Ethiopia.svg.png" alt="Emblem" className="eth-emblem" />
                      <div className="header-text">
                        <h4>የኢትዮጵያ ዲጂታል መታወቂያ ካርድ</h4>
                        <h4>Ethiopian Digital ID Card</h4>
                      </div>
                      <div className="national-id-logo">
                        <img src="https://fayda.ethid.et/img/logo_fayda.png" alt="National ID" />
                        <span>National ID<br/>ብሔራዊ መታወቂያ</span>
                      </div>
                    </div>

                    <div className="id-card-body-print">
                      <img src={userData.photo} className="id-photo-large" alt="ID Photo" />
                      
                      <div className="id-details-print">
                        <p>
                          <span className="label-am">ሙሉ ስም / </span>
                          <span className="label-en">First, Middle, Surname</span>
                          <span className="value-am">{userData.fullname}</span>
                          <span className="value-en">{userData.fullname}</span>
                        </p>
                        <p>
                          <span className="label-am">የትውልድ ቀን / </span>
                          <span className="label-en">Date of Birth</span>
                          <span className="value-am">{new Date(userData.dob).toLocaleDateString('am-ET', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}</span>
                          <span className="value-en">{new Date(userData.dob).toLocaleDateString('en-GB')}</span>
                        </p>
                        <p>
                          <span className="label-am">ጾታ / </span>
                          <span className="label-en">SEX</span>
                          <span className="value-am">{userData.gender === 'Male' ? 'ወንድ' : 'ሴት'}</span>
                          <span className="value-en">{userData.gender}</span>
                        </p>
                        <p>
                          <span className="label-am">ዜግነት (በተገለጸው መሠረት) / </span>
                          <span className="label-en">Country of Citizenship (Self-declared)</span>
                          <span className="value-am">ኢትዮጵያዊ</span>
                          <span className="value-en">Ethiopian</span>
                        </p>
                      </div>

                      <div className="id-watermark"></div> {/* የኮከብ ምልክት ከበስተጀርባ */}
                      
                      <div className="digital-copy-footer">
                        <img src="https://fayda.ethid.et/img/logo_fayda.png" alt="Fayda Logo" className="fayda-logo-small" />
                        <span className="digital-copy-text">Digital Copy</span>
                      </div>
                    </div>

                    <div className="id-card-footer-bottom">
                      <div className="barcode-container">
                        <img src={`https://bwipjs-cdn.micr.be/?bcid=code128&text=${userData.fayda_id}&scale=2&height=10`} alt="Barcode" className="barcode-img" />
                        <span className="barcode-number">{userData.fayda_id}</span>
                      </div>
                      <div className="fcn-section">
                        <span className="fcn-label-text">FCN</span>
                        <span className="fcn-id-number">{userData.fayda_id}</span>
                      </div>
                    </div>
                     <div className="print-date-stamp">Print Date: {new Date().toLocaleDateString('en-GB')}</div>
                  </div>
                </div>
              )}

              {/* --- All Users Section --- */}
              <div className="all-users-section">
                <div className="user-actions">
                    <button className="fetch-btn" onClick={fetchAllUsers}>
                    {showTable ? 'Refresh List' : '📊 View All Citizens'}
                    </button>
                </div>

                {showTable && (
                  <div className="table-container scale-in">
                    <input type="text" placeholder="በስም ወይም በID ይፈልጉ..." className="search-bar" onChange={(e) => setSearchTerm(e.target.value)} />
                    <table className="modern-table">
                      <thead>
                        <tr><th>Name</th><th>Fayda ID</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user, i) => (
                          <tr key={i}>
                            <td onClick={() => {setFaydaId(user.fayda_id); setShowTable(false); handleVerify(user.fayda_id);}} style={{cursor:'pointer'}}>{user.fullname}</td>
                            <td>{user.fayda_id}</td>
                            <td><button className="edit-btn" onClick={() => handleUpdate(user)}>📝 Edit</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            {/* --- Admin Panel UI (Register New Citizen) --- */}
            <div className="admin-panel scale-in">
              <h3>Register New Citizen</h3>
              <form onSubmit={handleAdminAction} className="admin-form">
                <input type="text" placeholder="Full Name" required onChange={e => setFormData({...formData, fullName: e.target.value})} />
                <input type="email" placeholder="Email Address" required onChange={e => setFormData({...formData, email: e.target.value})} />
                <input type="date" required onChange={e => setFormData({...formData, dob: e.target.value})} />
                <input type="text" placeholder="Address" required onChange={e => setFormData({...formData, address: e.target.value})} />
                
                {/* Gender Select */}
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>

                <div className="file-upload-group">
                  <label>Citizen Identification Photo</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} required />
                  
                  {formData.photo && !formData.photo.includes('pravatar') && (
                    <div className="photo-preview-container">
                      <img src={formData.photo} alt="Preview" className="preview-img" />
                      <span className="preview-text">✓ Photo Selected</span>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? 'Processing...' : '🚀 Register Citizen'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
