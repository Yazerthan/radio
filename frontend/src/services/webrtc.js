import { io } from 'socket.io-client';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `${window.location.protocol}//${window.location.hostname}:3000`;
export const socket = io(BACKEND_URL);

let peerConnections = {}; // targetSocketId -> RTCPeerConnection
let currentRadioId = null;

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

// Broadcaster side: listener joined, create offer
socket.on('listener_joined', async ({ listenerSocketId }) => {
  if (!window.localStream) return; // Not a broadcaster

  const pc = new RTCPeerConnection(configuration);
  peerConnections[listenerSocketId] = pc;

  window.localStream.getTracks().forEach(track => {
    pc.addTrack(track, window.localStream);
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc_ice_candidate', {
        targetSocketId: listenerSocketId,
        candidate: event.candidate,
        radioId: currentRadioId
      });
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit('webrtc_offer', {
    targetSocketId: listenerSocketId,
    offer,
    radioId: currentRadioId
  });
});

// Listener side: receive offer, create answer
socket.on('webrtc_offer', async ({ broadcasterSocketId, offer, radioId }) => {
  const pc = new RTCPeerConnection(configuration);
  peerConnections[broadcasterSocketId] = pc;

  pc.ontrack = (event) => {
    const remoteAudio = document.getElementById('remoteAudio');
    if (remoteAudio && event.streams[0]) {
      remoteAudio.srcObject = event.streams[0];
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc_ice_candidate', {
        targetSocketId: broadcasterSocketId,
        candidate: event.candidate,
        radioId
      });
    }
  };

  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit('webrtc_answer', {
    targetSocketId: broadcasterSocketId,
    answer,
    radioId
  });
});

// Broadcaster side: receive answer
socket.on('webrtc_answer', async ({ listenerSocketId, answer }) => {
  const pc = peerConnections[listenerSocketId];
  if (pc) {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }
});

// Both sides: receive ICE candidate
socket.on('webrtc_ice_candidate', async ({ senderSocketId, candidate }) => {
  const pc = peerConnections[senderSocketId];
  if (pc) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

// Cleanup when someone leaves
socket.on('listener_left', ({ listenerSocketId }) => {
  if (peerConnections[listenerSocketId]) {
    peerConnections[listenerSocketId].close();
    delete peerConnections[listenerSocketId];
  }
});

// Custom events from UI
window.addEventListener('join_radio', (e) => {
  const { radioId, password } = e.detail;
  socket.emit('join_radio', { radioId, password }, (res) => {
    if (res.error) {
      alert(res.error);
    } else {
      currentRadioId = radioId;
      window.dispatchEvent(new CustomEvent('radio_joined', { detail: { radioId } }));
    }
  });
});

window.addEventListener('broadcaster_started', (e) => {
  currentRadioId = e.detail.radioId;
});

window.addEventListener('stop_current_connection', (e) => {
  const isBroadcaster = e?.detail?.isBroadcaster;
  if (currentRadioId) {
    if (isBroadcaster) {
      socket.emit('stop_radio', { radioId: currentRadioId });
    } else {
      socket.emit('leave_radio', { radioId: currentRadioId });
    }
    currentRadioId = null;
  }
  Object.values(peerConnections).forEach(pc => pc.close());
  peerConnections = {};
  const remoteAudio = document.getElementById('remoteAudio');
  if (remoteAudio) remoteAudio.srcObject = null;
  if (window.localStream) {
    window.localStream.getTracks().forEach(t => t.stop());
    window.localStream = null;
  }
});

window.addEventListener('stop_listening', () => {
  Object.values(peerConnections).forEach(pc => pc.close());
  peerConnections = {};
  const remoteAudio = document.getElementById('remoteAudio');
  if (remoteAudio) remoteAudio.srcObject = null;
  currentRadioId = null;
});
