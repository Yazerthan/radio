import React, { useState } from 'react';
import { X, Music, Radio, Headphones, Mic, Speaker, Disc } from 'lucide-react';
import { socket } from '../services/webrtc';

const ICONS = ['music', 'radio', 'headphones', 'mic', 'speaker', 'disc'];

const renderIcon = (name, props) => {
  switch(name) {
    case 'music': return <Music {...props} />;
    case 'radio': return <Radio {...props} />;
    case 'headphones': return <Headphones {...props} />;
    case 'mic': return <Mic {...props} />;
    case 'speaker': return <Speaker {...props} />;
    case 'disc': return <Disc {...props} />;
    default: return <Music {...props} />;
  }
};

function CreateRadioModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Request Audio stream from user
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: true // usually need to ask for video to get audio in some browsers for displayMedia
      });

      // Stop video track if present, we only want audio
      stream.getVideoTracks().forEach(track => track.stop());

      if (stream.getAudioTracks().length === 0) {
        throw new Error("No audio track selected. Please make sure to share system audio.");
      }

      // Save stream to window so webrtc service can use it
      window.localStream = stream;

      // 2. Create radio on backend
      socket.emit('create_radio', { name, icon, password }, (res) => {
        setLoading(false);
        if (res.error) {
          setError(res.error);
        } else {
          onSuccess(res.radioId);
        }
      });

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to capture audio.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2 className="modal-title">Create Radio</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>
        
        {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label>Radio Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="My Awesome Station"
              required 
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>Icon</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {ICONS.map(i => (
                <div 
                  key={i} 
                  onClick={() => setIcon(i)}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '8px',
                    borderRadius: '8px',
                    background: icon === i ? 'var(--primary-color)' : 'transparent'
                  }}
                >
                  {renderIcon(i, { size: 24 })}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Password (Optional)</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Leave empty for public"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Starting...' : 'Start Broadcasting'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateRadioModal;
