const http = require('http');

const payload = JSON.stringify({ text: 'Automated test caption — assistant', speaker: 'Assistant', final: true });

const options = {
  hostname: '127.0.0.1',
  port: 4010,
  path: '/api/rooms/_9nxxp5qqhqw/captions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY', data);
  });
});

req.on('error', (err) => console.error('REQ_ERR', err));
req.write(payload);
req.end();
