import React from 'react';
import { Plus, Radio, Square } from 'lucide-react';

function RadioCenter({ onCreateClick, isBroadcasting, onStopClick }) {
  return (
    <div className="center-container">
      {!isBroadcasting && (
        <button className="create-slot" onClick={onCreateClick} title="Create Radio">
          <Plus />
        </button>
      )}
      
      <div className={`central-radio ${isBroadcasting ? 'broadcasting' : ''}`}>
        <Radio className="radio-illustration" strokeWidth={1.5} />
        {isBroadcasting && <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>ON AIR</span>}
      </div>

      {isBroadcasting && (
        <button 
          className="stop-button" 
          onClick={onStopClick}
          style={{
            marginTop: '20px',
            background: 'var(--danger)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Square size={16} fill="currentColor" />
          Stop Broadcasting
        </button>
      )}
    </div>
  );
}

export default RadioCenter;
