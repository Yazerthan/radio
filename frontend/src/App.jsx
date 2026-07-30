import React, { useState, useEffect } from 'react';
import { socket, BACKEND_URL } from './services/webrtc';
import RadioCenter from './components/RadioCenter';
import RadioSlot from './components/RadioSlot';
import CreateRadioModal from './components/CreateRadioModal';
import './index.css';

function App() {
  const [radios, setRadios] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRadioId, setCurrentRadioId] = useState(null); // The radio we are broadcasting or listening to
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    // Fetch initial radios
    fetch(BACKEND_URL + '/api/radios')
      .then(res => res.json())
      .then(data => setRadios(data))
      .catch(err => console.error('Failed to fetch radios:', err));

    socket.on('radios_updated', () => {
      fetch(BACKEND_URL + '/api/radios')
        .then(res => res.json())
        .then(data => setRadios(data));
    });

    socket.on('radio_ended', ({ radioId }) => {
      if (currentRadioId === radioId) {
        alert('The broadcaster has stopped the radio.');
        setCurrentRadioId(null);
        // Need to stop local playing stream, handle in webrtc.js
        window.dispatchEvent(new CustomEvent('stop_listening'));
      }
    });

    const onRadioJoined = (e) => setCurrentRadioId(e.detail.radioId);
    window.addEventListener('radio_joined', onRadioJoined);

    return () => {
      socket.off('radios_updated');
      socket.off('radio_ended');
      window.removeEventListener('radio_joined', onRadioJoined);
    };
  }, [currentRadioId]);

  const handleCreateRadioClick = () => {
    if (radios.length >= 7) {
      alert("Maximum 7 radios limit reached.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleSlotClick = (radio) => {
    if (currentRadioId === radio.id) {
      // Already connected
      return;
    }
    if (currentRadioId) {
      // Prompt to leave current radio
      if (!window.confirm("You are already connected to a radio. Leave it and join this one?")) {
        return;
      }
      window.dispatchEvent(new CustomEvent('stop_current_connection'));
    }

    let password = null;
    if (radio.hasPassword) {
      password = window.prompt(`Enter password for ${radio.name}:`);
      if (password === null) return;
    }

    // Trigger join
    window.dispatchEvent(new CustomEvent('join_radio', { detail: { radioId: radio.id, password } }));
  };

  // Calculate positions for slots in a circle
  const radius = 280; // Orbit radius increased to avoid overlap with create slot
  const getSlotPosition = (index, total) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle)
    };
  };

  const handleStopBroadcasting = () => {
    window.dispatchEvent(new CustomEvent('stop_current_connection', { detail: { isBroadcaster: true } }));
    setIsBroadcasting(false);
    setCurrentRadioId(null);
  };

  const activeRadio = radios.find(r => r.id === currentRadioId);
  const isListening = currentRadioId && !isBroadcasting && activeRadio;

  return (
    <div className="app-container">
      {isListening && (
        <div className="listening-banner">
          <div className="listening-pulse"></div>
          Vous écoutez actuellement : {activeRadio.name}
        </div>
      )}
      <div className="radio-orbit">
        {radios.map((radio, index) => {
          const pos = getSlotPosition(index, radios.length);
          let status = 'none';
          if (currentRadioId === radio.id) {
            status = isBroadcasting ? 'broadcasting' : 'listening';
          }
          return (
            <RadioSlot 
              key={radio.id} 
              radio={radio} 
              position={pos} 
              onClick={() => handleSlotClick(radio)}
              status={status}
            />
          );
        })}
      </div>

      <RadioCenter 
        onCreateClick={handleCreateRadioClick} 
        isBroadcasting={isBroadcasting} 
        onStopClick={handleStopBroadcasting}
      />

      {isModalOpen && (
        <CreateRadioModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(id) => {
            setIsModalOpen(false);
            setCurrentRadioId(id);
            setIsBroadcasting(true);
            window.dispatchEvent(new CustomEvent('broadcaster_started', { detail: { radioId: id } }));
          }}
          activeRadios={radios}
        />
      )}
      
      <audio id="remoteAudio" autoPlay></audio>
    </div>
  );
}

export default App;
