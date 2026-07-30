import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { socket } from '../services/webrtc';

const RABBITS = ['lapin1', 'lapin2', 'lapin3', 'lapin4', 'lapin5', 'lapin6', 'lapin7'];

function CreateRadioModal({ onClose, onSuccess, activeRadios }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const usedIcons = activeRadios.map(r => r.icon);
  const availableRabbits = RABBITS.filter(r => !usedIcons.includes(r));
  const [icon, setIcon] = useState(availableRabbits.length > 0 ? availableRabbits[0] : RABBITS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If the available rabbits change and current icon is used, pick a new one
  useEffect(() => {
    if (usedIcons.includes(icon) && availableRabbits.length > 0) {
      setIcon(availableRabbits[0]);
    }
  }, [activeRadios, icon]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (usedIcons.includes(icon)) {
      setError("Ce lapin est déjà utilisé !");
      return;
    }

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
              {RABBITS.map(r => {
                const isUsed = usedIcons.includes(r);
                return (
                  <div 
                    key={r} 
                    onClick={() => !isUsed && setIcon(r)}
                    style={{ 
                      cursor: isUsed ? 'not-allowed' : 'pointer', 
                      padding: '8px',
                      borderRadius: '8px',
                      background: icon === r ? 'var(--primary-color)' : 'transparent',
                      opacity: isUsed ? 0.3 : 1
                    }}
                    title={isUsed ? "Déjà utilisé" : ""}
                  >
                    <img src={`/medias/${r}.jpg`} alt={r} className="rabbit-img" />
                  </div>
                );
              })}
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
