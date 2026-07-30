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
      {radio.hasPassword && <Lock size={12} style={{ position: 'absolute', top: 10, right: 10, color: 'var(--text-secondary)' }} />}
      <div className="slot-icon">
        {/* radio.icon holds the rabbit name e.g. "lapin1" */}
        <img src={`/medias/${radio.icon}.jpg`} alt={radio.name} className="rabbit-img" />
      </div>
      <div className="slot-name" title={radio.name}>{radio.name}</div>
      <div className="listeners-badge">
        <Headphones size={10} />
        {radio.listenersCount}
      </div>
    </div>
  );
}

export default RadioSlot;
