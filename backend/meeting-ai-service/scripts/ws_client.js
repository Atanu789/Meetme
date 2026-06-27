const WebSocket = require('ws');
const meetingId = process.argv[2] || '_9nxxp5qqhqw';
const url = `ws://127.0.0.1:4010/ws/${encodeURIComponent(meetingId)}`;

console.log('Connecting to', url);
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('[client] open');
  ws.send(JSON.stringify({ type: 'join', meetingId }));
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('[client] message:', msg);
  } catch (err) {
    console.log('[client] raw:', data.toString());
  }
});

ws.on('close', () => console.log('[client] closed'));
ws.on('error', (e) => console.error('[client] error', e && e.message));
