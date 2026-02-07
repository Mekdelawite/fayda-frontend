import React, { useState, useEffect } from 'react';
import './App.css';
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = (error) => reject(error);
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
    photo: `https://i.pravatar.cc/150?u=${Math.random()}`
  });

  const API_BASE = "https://fayda-mock-api.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) setIsLoggedIn(true);
  }, []);
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
      }
    } catch (err) {
      alert('የሰርቨር ስህተት!');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = allUsers.filter(user => 
    user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.fayda_id?.includes(searchTerm)
  );
const resizeAndConvert = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // የምስሉን ስፋት ወደ 400px ዝቅ ያደርገዋል
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // ጥራቱን ወደ 0.7 (70%) ዝቅ በማድረግ መጠኑን በጣም ይቀንሳል
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
    };
  });
};
  
  // --- Login Screen UI ---
  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <form onSubmit={handleLogin} className="login-form scale-in">
          <h2>Fayda Login</h2>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
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
                  <div className="modern-card">
                    <div className="card-content">
                      <img src={userData.photo} alt="User" className="modern-photo" />
                      <div className="user-info">
                        <h3>{userData.fullname}</h3>
                        <p><strong>ID:</strong> {userData.fayda_id}</p>
                        <p><strong>Residence:</strong> {userData.address}</p>
                        <div className="user-actions">
                          <button className="print-btn" onClick={() => window.print()}>🖨️ Print ID Card</button>
                          <span className="status-badge">{userData.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  // ... ካለው ኮድ ውስጥ የ userData ካርድ ያለበትን ክፍል በዚህ ተካው

{userData && (
  <div id="print-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    {/* --- REAL FAYDA CARD START --- */}
    <div style={{ width: '550px', height: '350px', background: 'white', borderRadius: '15px', overflow: 'hidden', position: 'relative', color: 'black', boxShadow: '0 15px 35px rgba(0,0,0,0.5)' }}>
      
      {/* Header */}
      <div style={{ background: '#1b3e71', padding: '10px 20px', display: 'flex', alignItems: 'center', borderBottom: '4px solid #ffcc33', color: 'white' }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Emblem_of_Ethiopia.svg/120px-Emblem_of_Ethiopia.svg.png" width="45" alt="ETH" />
        <div style={{ flex: 1, marginLeft: '15px', textAlign: 'left' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>የኢትዮጵያ ዲጂታል መታወቂያ ካርድ</div>
          <div style={{ fontSize: '11px' }}>Ethiopian Digital ID Card</div>
        </div>
        <img src="https://fayda.ethid.et/img/logo_fayda.png" width="40" alt="Logo" />
      </div>

      {/* Body */}
      <div style={{ display: 'flex', padding: '20px', gap: '20px', textAlign: 'left', position: 'relative' }}>
        {/* Watermark Star */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, zIndex: 0 }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Emblem_of_Ethiopia.svg/500px-Emblem_of_Ethiopia.svg.png" width="250" alt="star" />
        </div>

        <img src={userData.photo} style={{ width: '130px', height: '165px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #ddd', zIndex: 1 }} alt="p" />
        
        <div style={{ flex: 1, zIndex: 1 }}>
          <div style={{ marginBottom: '10px' }}>
            <small style={{ color: '#666', fontSize: '10px' }}>ሙሉ ስም / Full Name</small>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{userData.fullname}</div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <small style={{ color: '#666', fontSize: '10px' }}>የትውልድ ቀን / Date of Birth</small>
            <div style={{ fontWeight: 'bold' }}>{userData.dob}</div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <small style={{ color: '#666', fontSize: '10px' }}>ጾታ / SEX</small>
            <div style={{ fontWeight: 'bold' }}>{userData.gender || 'ወንድ / Male'}</div>
          </div>
          <div>
            <small style={{ color: '#666', fontSize: '10px' }}>ዜግነት / Citizenship</small>
            <div style={{ fontWeight: 'bold' }}>ኢትዮጵያ / Ethiopian</div>
          </div>
        </div>

        {/* --- አዲሱ QR CODE እዚህ ጋር ተጨምሯል --- */}
        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=FaydaID:${userData.fayda_id}%0AName:${userData.fullname}`} 
            alt="QR Code" 
            style={{ border: '1px solid #eee', padding: '5px', background: 'white' }}
          />
          <div style={{ fontSize: '8px', color: '#666', marginTop: '2px' }}>SCAN TO VERIFY</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '60px', width: '100%', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}><span style={{ color: '#b45309' }}>FCN</span> {userData.fayda_id}</div>
        <div style={{ color: '#059669', textAlign: 'right', fontWeight: 'bold' }}>
            <img src="https://fayda.ethid.et/img/logo_fayda.png" width="30" style={{ display: 'block', marginLeft: 'auto' }} />
            Digital Copy
        </div>
      </div>

      {/* Barcode */}
      <div style={{ position: 'absolute', bottom: '5px', width: '100%', textAlign: 'center' }}>
        <img src={`https://bwipjs-cdn.micr.be/?bcid=code128&text=${userData.fayda_id}&scale=2&height=8`} style={{ width: '80%', height: '35px' }} alt="barcode" />
        <div style={{ fontSize: '10px', fontFamily: 'monospace' }}>{userData.fayda_id}</div>
      </div>
    </div>
    {/* --- REAL FAYDA CARD END --- */}

    <button onClick={() => window.print()} style={{ marginTop: '30px', padding: '12px 25px', borderRadius: '10px', background: '#28a745', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Print ID Card</button>
  </div>
)}
              )}

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
           // በ Admin Panel ክፍል ውስጥ ያለውን ፎርም በዚህ ተካው
<div className="admin-panel scale-in">
  <h3>Register New Citizen</h3>
  <form onSubmit={handleAdminAction} className="admin-form">
    <input type="text" placeholder="Full Name" required onChange={e => setFormData({...formData, fullName: e.target.value})} />
    <input type="email" placeholder="Email Address" required onChange={e => setFormData({...formData, email: e.target.value})} />
    <input type="date" required onChange={e => setFormData({...formData, dob: e.target.value})} />
    <input type="text" placeholder="Address" required onChange={e => setFormData({...formData, address: e.target.value})} />
    
    <div className="file-upload-group">
      <label>Citizen Identification Photo</label>
      <input type="file" accept="image/*" onChange={handleFileUpload} required />
      
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
