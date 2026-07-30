import React from 'react';
import { Headphones, Lock, Music, Radio, Mic, Speaker, Disc } from 'lucide-react';

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

function RadioSlot({ radio, position, onClick, status }) {
  // We need to offset the position by half the slot width/height (50px) since the container is absolute and origin is top-left
  let borderColor = 'var(--panel-border)';
  if (status === 'broadcasting') {
    borderColor = 'var(--danger)';
  } else if (status === 'listening') {
    borderColor = '#22c55e'; // green
  }

  const style = {
    left: `calc(50% + ${position.x}px - 50px)`,
    top: `calc(50% + ${position.y}px - 50px)`,
    borderColor
  };

  return (
    <div className="radio-slot" style={style} onClick={onClick}>
      {radio.hasPassword && <Lock size={12} style={{ position: 'absolute', top: 10, right: 10, color: 'var(--text-secondary)' }} />}
      <div className="slot-icon">{renderIcon(radio.icon, { size: 32 })}</div>
      <div className="slot-name" title={radio.name}>{radio.name}</div>
      <div className="listeners-badge">
        <Headphones size={10} />
        {radio.listenersCount}
      </div>
    </div>
  );
}

export default RadioSlot;
