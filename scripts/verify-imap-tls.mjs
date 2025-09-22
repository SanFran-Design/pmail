#!/usr/bin/env node

import tls from 'node:tls';
import { setTimeout as delay } from 'node:timers/promises';

const host = process.env.IMAP_VERIFY_HOST || 'imap.gmail.com';
const port = Number(process.env.IMAP_VERIFY_PORT || 993);
const timeoutMs = Number(process.env.IMAP_VERIFY_TIMEOUT || 10000);

const socket = tls.connect({
  host,
  port,
  servername: host,
  rejectUnauthorized: true,
});

let completed = false;

const handleFailure = (error) => {
  if (completed) return;
  completed = true;
  console.error('❌ TLS verification failed:', error);
  socket.destroy();

  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENETUNREACH') {
    console.error('Network is unreachable. Ensure outbound IMAP access is allowed in your environment.');
  }

  process.exit(1);
};

socket.once('secureConnect', () => {
  if (completed) return;
  completed = true;

  if (!socket.authorized) {
    handleFailure(socket.authorizationError || 'Certificate not authorized');
    return;
  }

  console.log(
    `✅ Successfully negotiated TLS with ${host}:${port}.`,
    socket.getProtocol() ? `Protocol: ${socket.getProtocol()}` : ''
  );
  socket.end();
  process.exit(0);
});

socket.once('error', handleFailure);

await delay(timeoutMs).then(() => {
  if (!completed) {
    handleFailure(new Error(`Timed out after ${timeoutMs}ms while waiting for TLS handshake.`));
  }
});
