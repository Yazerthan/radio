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
            <Square className="radio-illustration" fill="currentColor" strokeWidth={1.5} />
            <span style={{ color: 'var(--danger)', fontWeight: 'bold', marginTop: '10px' }}>STOP</span>
          </>
        ) : (
          <Radio className="radio-illustration" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}

export default RadioCenter;
