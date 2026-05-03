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
    console.log(`[ws] broadcast: no active room for ${meetingId}`);
    return;
  }

  const message = JSON.stringify(payload);
  try {
    console.log(`[ws] broadcasting to ${room.size} sockets for ${meetingId} — type=${payload.type || 'message'}`);
  } catch {
    // ignore logging errors
  }

  for (const socket of room) {
    if (socket.readyState === WebSocket.OPEN) {
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