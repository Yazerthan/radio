const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// State
// radios format: { id: { id, name, icon, password, broadcasterSocketId, listeners: Set() } }
const radios = {};

const MAX_RADIOS = 7;

app.get('/api/radios', (req, res) => {
  const publicRadios = Object.values(radios).map(r => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    hasPassword: !!r.password,
    listenersCount: r.listeners.size
  }));
  res.json(publicRadios);
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Broadcaster creates a radio
  socket.on('create_radio', (data, callback) => {
    if (Object.keys(radios).length >= MAX_RADIOS) {
      return callback({ error: 'Maximum number of radios reached.' });
    }

    const radioId = crypto.randomUUID();
    radios[radioId] = {
      id: radioId,
      name: data.name,
      icon: data.icon,
      password: data.password || null,
      broadcasterSocketId: socket.id,
      listeners: new Set()
    };

    socket.join(`radio_${radioId}_broadcaster`);
    
    // Broadcast to all clients that a new radio was created
    io.emit('radios_updated');
    
    callback({ success: true, radioId });
  });

  // Listener requests to join a radio
  socket.on('join_radio', (data, callback) => {
    const { radioId, password } = data;
    const radio = radios[radioId];

    if (!radio) {
      return callback({ error: 'Radio not found.' });
    }
    
    if (radio.password && radio.password !== password) {
      return callback({ error: 'Incorrect password.' });
    }

    // Join successful
    radio.listeners.add(socket.id);
    socket.join(`radio_${radioId}_listener`);
    
    io.emit('radios_updated'); // Update listener counts
    
    // Notify broadcaster that a new listener joined, so broadcaster can initiate WebRTC offer
    io.to(radio.broadcasterSocketId).emit('listener_joined', { listenerSocketId: socket.id });
    
    callback({ success: true });
  });

  socket.on('leave_radio', (data) => {
    const { radioId } = data;
    const radio = radios[radioId];
    if (radio) {
      radio.listeners.delete(socket.id);
      socket.leave(`radio_${radioId}_listener`);
      io.emit('radios_updated');
      io.to(radio.broadcasterSocketId).emit('listener_left', { listenerSocketId: socket.id });
    }
  });

  socket.on('stop_radio', (data) => {
    const { radioId } = data;
    const radio = radios[radioId];
    if (radio && radio.broadcasterSocketId === socket.id) {
      // Broadcaster manually stopped the radio
      io.to(`radio_${radioId}_listener`).emit('radio_ended', { radioId });
      delete radios[radioId];
      io.emit('radios_updated');
    }
  });

  // WebRTC Signaling
  socket.on('webrtc_offer', (data) => {
    const { targetSocketId, offer, radioId } = data;
    io.to(targetSocketId).emit('webrtc_offer', {
      broadcasterSocketId: socket.id,
      offer,
      radioId
    });
  });

  socket.on('webrtc_answer', (data) => {
    const { targetSocketId, answer, radioId } = data;
    io.to(targetSocketId).emit('webrtc_answer', {
      listenerSocketId: socket.id,
      answer,
      radioId
    });
  });

  socket.on('webrtc_ice_candidate', (data) => {
    const { targetSocketId, candidate, radioId } = data;
    io.to(targetSocketId).emit('webrtc_ice_candidate', {
      senderSocketId: socket.id,
      candidate,
      radioId
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Check if the user was a broadcaster
    for (const [radioId, radio] of Object.entries(radios)) {
      if (radio.broadcasterSocketId === socket.id) {
        // Broadcaster disconnected, remove radio
        io.to(`radio_${radioId}_listener`).emit('radio_ended', { radioId });
        delete radios[radioId];
        io.emit('radios_updated');
      } else if (radio.listeners.has(socket.id)) {
        // Listener disconnected
        radio.listeners.delete(socket.id);
        io.to(radio.broadcasterSocketId).emit('listener_left', { listenerSocketId: socket.id });
        io.emit('radios_updated');
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
