'use strict';

const WebSocket = require('ws');

const rooms = new Map();

function getRoom(meetingId) {
  if (!rooms.has(meetingId)) {
    rooms.set(meetingId, new Set());
  }

  return rooms.get(meetingId);
}

function joinRoom(meetingId, socket) {
  const room = getRoom(meetingId);
  room.add(socket);
}

function leaveRoom(meetingId, socket) {
  const room = rooms.get(meetingId);

  if (!room) {
    return;
  }

  room.delete(socket);

  if (room.size === 0) {
    rooms.delete(meetingId);
  }
}

function broadcast(meetingId, payload) {
  const room = rooms.get(meetingId);

  if (!room) {
    console.log(`[ws] ⚠️  BROADCAST FAILED: no active WebSocket room for ${meetingId} — frontend not connected yet`);
    return;
  }

  const message = JSON.stringify(payload);
  const socketCount = room.size;
  
  try {
    const logText = payload.type === 'caption' 
      ? `caption: "${payload.text?.slice(0, 50) || ''}" from ${payload.speaker || 'unknown'}`
      : `type=${payload.type || 'message'}`;
    console.log(`[ws] 📤 BROADCAST TO ${socketCount} socket(s) | ${logText}`);
  } catch {
    // ignore logging errors
  }

  let sent = 0;
  for (const socket of room) {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(message);
        sent++;
      } catch (err) {
        console.error(`[ws] ❌ Failed to send to socket: ${err.message}`);
      }
    }
  }
  
  if (sent > 0) {
    console.log(`[ws] ✅ DELIVERED to ${sent}/${socketCount} sockets`);
  } else {
    console.log(`[ws] ⚠️  NO OPEN SOCKETS - ${socketCount} sockets in room but all closed`);
  }
}
      socket.send(message);
    }
  }
}

function clearRoom(meetingId) {
  rooms.delete(meetingId);
}

module.exports = {
  broadcast,
  clearRoom,
  joinRoom,
  leaveRoom,
};