/**
 * Database Reset Script
 * Removes all registered users for a fresh start
 * Usage: node scripts/reset-database.js
 */

require('dotenv').config({ path: '.env.local' });

const dns = require('node:dns');
const { MongoClient } = require('mongodb');

dns.setServers(['1.1.1.1', '8.8.8.8']);
dns.setDefaultResultOrder('ipv4first');

const dohEndpoints = [
  'https://cloudflare-dns.com/dns-query',
  'https://dns.google/resolve',
];
const dohCache = new Map();

async function resolveDnsJson(name, type) {
  const key = `${type}:${name}`;
  if (dohCache.has(key)) return dohCache.get(key);

  let lastError;
  for (const endpoint of dohEndpoints) {
    try {
      const response = await fetch(`${endpoint}?name=${encodeURIComponent(name)}&type=${type}`, {
        headers: { accept: 'application/dns-json' },
      });
      if (!response.ok) throw new Error(`DNS-over-HTTPS request failed with ${response.status}`);

      const body = await response.json();
      if (body.Status !== 0) throw new Error(`DNS-over-HTTPS returned status ${body.Status}`);

      const answers = body.Answer || [];
      dohCache.set(key, answers);
      return answers;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function parseTxtAnswer(answer) {
  const chunks = answer.data.match(/"([^"]*)"/g);
  return chunks ? chunks.map((chunk) => chunk.slice(1, -1)).join('') : answer.data;
}

async function resolveMongoConnectionString(uri) {
  if (!uri.startsWith('mongodb+srv://')) return uri;

  const parsedUri = new URL(uri);
  const srvHost = parsedUri.hostname;
  const srvAnswers = await resolveDnsJson(`_mongodb._tcp.${srvHost}`, 'SRV');
  const srvRecords = srvAnswers
    .map((answer) => {
      const [priority, weight, port, target] = answer.data.trim().split(/\s+/);
      return {
        priority: Number(priority),
        weight: Number(weight),
        port,
        target: target.replace(/\.$/, ''),
      };
    })
    .sort((a, b) => a.priority - b.priority || a.weight - b.weight || a.target.localeCompare(b.target));

  if (srvRecords.length === 0) {
    throw new Error(`No MongoDB SRV records found for ${srvHost}`);
  }

  const params = new URLSearchParams(parsedUri.searchParams);
  const txtAnswers = await resolveDnsJson(srvHost, 'TXT').catch(() => []);
  if (txtAnswers.length > 0) {
    const txtParams = new URLSearchParams(parseTxtAnswer(txtAnswers[0]));
    for (const [key, value] of txtParams) {
      if (!params.has(key)) params.set(key, value);
    }
  }
  if (!params.has('tls') && !params.has('ssl')) params.set('tls', 'true');

  const auth = parsedUri.username
    ? `${parsedUri.username}${parsedUri.password ? `:${parsedUri.password}` : ''}@`
    : '';
  const hosts = srvRecords.map((record) => `${record.target}:${record.port}`).join(',');

  return `mongodb://${auth}${hosts}${parsedUri.pathname}?${params}`;
}

function mongoDnsLookup(hostname, options, callback) {
  Promise.all([
    resolveDnsJson(hostname, 'A').catch(() => []),
    resolveDnsJson(hostname, 'AAAA').catch(() => []),
  ])
    .then(([ipv4Answers, ipv6Answers]) => {
      const addresses = [
        ...ipv4Answers.map((answer) => ({ address: answer.data, family: 4 })),
        ...ipv6Answers.map((answer) => ({ address: answer.data, family: 6 })),
      ];

      if (addresses.length === 0) {
        throw new Error(`No DNS A/AAAA records found for ${hostname}`);
      }

      if (typeof options === 'object' && options.all) {
        callback(null, addresses);
        return;
      }

      callback(null, addresses[0].address, addresses[0].family);
    })
    .catch((error) => callback(error, '', 0));
}

async function resetDatabase() {
  const uri = await resolveMongoConnectionString(process.env.MONGODB_URI);
  const client = new MongoClient(uri, { lookup: mongoDnsLookup });

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    console.log('\nWARNING: About to remove ALL registered users from the database');
    console.log('========================================================');
    
    const count = await usersCollection.countDocuments();
    console.log(`Current user count: ${count}`);
    
    if (count === 0) {
      console.log('No users found. Database is already clean.');
      await client.close();
      process.exit(0);
    }

    // Use readline for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\nType "RESET" to confirm deletion: ', async (answer) => {
      if (answer !== 'RESET') {
        console.log('Cancelled. No users were deleted.');
        rl.close();
        await client.close();
        process.exit(0);
      }

      console.log('\nRemoving all users...');
      const result = await usersCollection.deleteMany({});
      console.log(`Successfully deleted ${result.deletedCount} user(s)`);
      
      const remaining = await usersCollection.countDocuments();
      console.log(`Remaining users: ${remaining}`);

      rl.close();
      await client.close();
      console.log('\nDatabase reset complete. Fresh start ready!');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error.message);
    await client.close();
    process.exit(1);
  }
}

resetDatabase();
