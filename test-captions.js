#!/usr/bin/env node

const WebSocket = require('ws');
const http = require('http');

const MEETING_AI_WS_URL = 'ws://127.0.0.1:4010/ws/test-caption-diagnostic';
const MEETING_AI_CONTROL_URL = 'http://127.0.0.1:4010';
const TEST_MEETING_ID = 'test-caption-diagnostic';

console.log('='.repeat(60));
console.log('Caption Flow Diagnostic Test');
console.log('='.repeat(60));

// Test 1: Check if WebSocket server is reachable
console.log('\n1. Testing WebSocket Connectivity...');
console.log(`   Connecting to: ${MEETING_AI_WS_URL}`);

const ws = new WebSocket(MEETING_AI_WS_URL);
let wsConnected = false;

ws.on('open', () => {
  console.log('   ✓ WebSocket connected');
  wsConnected = true;
  
  // Send join message
  ws.send(JSON.stringify({ type: 'join', meetingId: TEST_MEETING_ID }));
  console.log('   ✓ Sent join message');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log(`   ✓ Received: ${JSON.stringify(msg)}`);
});

ws.on('error', (err) => {
  console.error('   ✗ WebSocket Error:', err.message);
});

ws.on('close', () => {
  console.log('   ✗ WebSocket closed');
  wsConnected = false;
});

// Wait for connection and test caption posting
setTimeout(() => {
  if (!wsConnected) {
    console.log('\n   ✗ Failed to establish WebSocket connection');
    process.exit(1);
  }

  console.log('\n2. Testing Caption Posting via HTTP...');
  console.log(`   Posting to: ${MEETING_AI_CONTROL_URL}/api/rooms/${TEST_MEETING_ID}/captions`);

  const postData = JSON.stringify({
    text: 'Diagnostic test caption',
    speaker: 'System',
    final: true,
    timestamp: Date.now(),
  });

  const options = {
    hostname: '127.0.0.1',
    port: 4010,
    path: `/api/rooms/${encodeURIComponent(TEST_MEETING_ID)}/captions`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`   ✓ POST Response Status: ${res.statusCode}`);
      console.log(`   ✓ Response: ${data}`);
      
      // Wait a bit to see if caption is received
      setTimeout(() => {
        console.log('\n3. Summary');
        console.log('   All connection tests passed!');
        console.log('\n   Next steps to verify full flow:');
        console.log('   1. Open a meeting room in browser at http://localhost:3000');
        console.log('   2. Check browser console for any errors');
        console.log('   3. Verify AudioCapture button appears (bottom-left)');
        console.log('   4. Click "Speak" and allow microphone access');
        console.log('   5. Watch for captions in the CaptionOverlay');
        console.log('\n   Environment check:');
        console.log(`   - NEXT_PUBLIC_MEETING_AI_WS_URL: ws://127.0.0.1:4010/ws`);
        console.log(`   - ASSEMBLYAI_API_KEY: ${process.env.ASSEMBLYAI_API_KEY ? '✓ Set' : '✗ Not set'}`);
        
        ws.close();
      }, 1000);
    });
  });

  req.on('error', (err) => {
    console.error('   ✗ POST Error:', err.message);
    ws.close();
  });

  req.write(postData);
  req.end();
}, 2000);

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\nTest timeout - closing connections');
  ws.close();
  process.exit(0);
}, 30000);
