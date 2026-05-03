const WebSocket = require('ws');
const meetingId = process.argv[2] || 'test-summary';
const ws = new WebSocket('ws://127.0.0.1:4010/ws/' + meetingId);
ws.on('open', () => {
  console.log('[ws-listen] open for', meetingId);
  ws.send(JSON.stringify({ type: 'join', meetingId }));
});
ws.on('message', (m) => console.log('[ws-listen] message', m.toString()));
ws.on('close', () => console.log('[ws-listen] close'));
ws.on('error', (e) => console.error('[ws-listen] error', e && e.message));
