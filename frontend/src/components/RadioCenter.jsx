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
      
      <button 
        className={`central-radio ${isBroadcasting ? 'broadcasting' : ''}`}
        onClick={isBroadcasting ? onStopClick : undefined}
        title={isBroadcasting ? "Stop Broadcasting" : undefined}
      >
        {isBroadcasting ? (
          <>
            <img src="/medias/carotte.jpg" alt="Carrot" className="carrot-img" style={{ opacity: 0.5 }} />
            <span style={{ position: 'absolute', color: 'var(--danger)', fontWeight: 'bold', fontSize: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>STOP</span>
          </>
        ) : (
          <img src="/medias/carotte.jpg" alt="Carrot" className="carrot-img" />
        )}
      </button>
    </div>
  );
}

export default RadioCenter;
