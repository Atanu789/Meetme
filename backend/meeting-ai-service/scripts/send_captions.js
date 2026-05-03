const http = require('http');
const meetingId = process.argv[2] || 'test-summary';

function send(i) {
  const data = JSON.stringify({
    text: `Line ${i} - this is a test caption about project tasks and deadlines`,
    speaker: i % 2 === 0 ? 'Alice' : 'Bob',
    final: true,
    timestamp: Date.now(),
  });

  const req = http.request(
    {
      hostname: '127.0.0.1',
      port: 4010,
      path: `/api/rooms/${encodeURIComponent(meetingId)}/captions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    },
    (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => console.log('[send] status', res.statusCode, 'for', i));
    }
  );

  req.on('error', (e) => console.error('[send] error', e.message));
  req.write(data);
  req.end();
}

for (let i = 1; i <= 20; i++) {
  send(i);
}
