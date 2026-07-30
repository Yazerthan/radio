import React from 'react';
import { Headphones, Lock } from 'lucide-react';

function RadioSlot({ radio, position, onClick, status }) {
  // We need to offset the position by half the slot width/height (50px) since the container is absolute and origin is top-left
  let borderColor = 'var(--panel-border)';
  if (status === 'broadcasting') {
    borderColor = 'var(--danger)';
  } else if (status === 'listening') {
    borderColor = 'var(--primary-color)';
  }

  const style = {
    left: `calc(50% + ${position.x}px - 50px)`,
    top: `calc(50% + ${position.y}px - 50px)`,
    borderColor
  };

  return (
    <div className="radio-slot" style={style} onClick={onClick}>
      <img src={`/medias/${radio.icon}.jpg`} alt={radio.name} className="slot-rabbit-img" />
      {radio.hasPassword && (
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, background: 'var(--danger)', color: '#fff', borderRadius: '50%', padding: '4px', display: 'flex' }}>
          <Lock size={10} strokeWidth={3} />
        </div>
      )}
      <div className="slot-name" title={radio.name}>{radio.name}</div>
      <div className="listeners-badge">
        <Headphones size={10} />
        {radio.listenersCount}
      </div>
    </div>
  );
}

export default RadioSlot;
