import dns from "node:dns";
import type { LookupAddress } from "node:dns";
import type { LookupFunction } from "node:net";

const MONGODB_DNS_SERVERS = ["1.1.1.1", "8.8.8.8"];
const DNS_JSON_ENDPOINTS = [
  "https://cloudflare-dns.com/dns-query",
  "https://dns.google/resolve",
];
const DNS_CACHE_MS = 60_000;

interface DnsJsonAnswer {
  type: number;
  TTL?: number;
  data: string;
}

interface DnsJsonResponse {
  Status: number;
  Answer?: DnsJsonAnswer[];
}

interface SrvRecord {
  priority: number;
  weight: number;
  port: number;
  target: string;
}

interface CachedDnsAnswer {
  expiresAt: number;
  answers: DnsJsonAnswer[];
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoDnsConfigured: boolean | undefined;
  // eslint-disable-next-line no-var
  var __mongoDnsJsonCache: Map<string, CachedDnsAnswer> | undefined;
}

export function configureMongoDns() {
  if (global.__mongoDnsConfigured) {
    return;
  }

  dns.setServers(MONGODB_DNS_SERVERS);
  dns.setDefaultResultOrder("ipv4first");

  global.__mongoDnsConfigured = true;
}

const getDnsCache = () => {
  if (!global.__mongoDnsJsonCache) {
    global.__mongoDnsJsonCache = new Map();
  }

  return global.__mongoDnsJsonCache;
};

const normalizeDnsName = (name: string) => name.replace(/\.$/, "");

async function resolveDnsJson(name: string, type: "SRV" | "TXT" | "A" | "AAAA") {
  const cacheKey = `${type}:${name}`;
  const cache = getDnsCache();
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.answers;
  }

  let lastError: unknown;

  for (const endpoint of DNS_JSON_ENDPOINTS) {
    const url = `${endpoint}?name=${encodeURIComponent(name)}&type=${type}`;

    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/dns-json",
        },
      });

      if (!response.ok) {
        throw new Error(`DNS-over-HTTPS request failed with ${response.status}`);
      }

      const body = (await response.json()) as DnsJsonResponse;

      if (body.Status !== 0) {
        throw new Error(`DNS-over-HTTPS returned status ${body.Status}`);
      }

      const answers = (body.Answer ?? []).filter((answer) => answer.data);
      const ttl = Math.max(15, Math.min(...answers.map((answer) => answer.TTL ?? 60), 60));

      cache.set(cacheKey, {
        answers,
        expiresAt: Date.now() + ttl * 1000,
      });

      return answers;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`DNS-over-HTTPS lookup failed for ${name}`);
}

function parseSrvAnswer(answer: DnsJsonAnswer): SrvRecord {
  const [priority, weight, port, target] = answer.data.trim().split(/\s+/);

  if (!priority || !weight || !port || !target) {
    throw new Error(`Invalid SRV answer: ${answer.data}`);
  }

  return {
    priority: Number(priority),
    weight: Number(weight),
    port: Number(port),
    target: normalizeDnsName(target),
  };
}

function parseTxtAnswer(answer: DnsJsonAnswer) {
  const chunks = answer.data.match(/"([^"]*)"/g);

  if (!chunks) {
    return answer.data;
  }

  return chunks.map((chunk) => chunk.slice(1, -1)).join("");
}

function appendTxtOptions(params: URLSearchParams, txtAnswers: DnsJsonAnswer[]) {
  if (txtAnswers.length === 0) {
    return;
  }

  if (txtAnswers.length > 1) {
    throw new Error("Multiple MongoDB TXT records are not supported");
  }

  const txtParams = new URLSearchParams(parseTxtAnswer(txtAnswers[0]));
  const allowedTxtOptions = new Set(["authSource", "replicaSet", "loadBalanced"]);

  for (const [key, value] of txtParams) {
    if (!allowedTxtOptions.has(key)) {
      throw new Error(`Unsupported MongoDB TXT option: ${key}`);
    }

    if (!params.has(key)) {
      params.set(key, value);
    }
  }
}

export async function resolveMongoConnectionString(uri: string) {
  configureMongoDns();

  if (!uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  const parsedUri = new URL(uri);
  const srvHost = parsedUri.hostname;
  const srvServiceName = parsedUri.searchParams.get("srvServiceName") ?? "mongodb";
  const srvAnswers = await resolveDnsJson(`_${srvServiceName}._tcp.${srvHost}`, "SRV");
  const srvRecords = srvAnswers
    .map(parseSrvAnswer)
    .sort((a, b) => a.priority - b.priority || a.weight - b.weight || a.target.localeCompare(b.target));

  if (srvRecords.length === 0) {
    throw new Error(`No MongoDB SRV records found for ${srvHost}`);
  }

  const params = new URLSearchParams(parsedUri.searchParams);
  params.delete("srvServiceName");
  params.delete("srvMaxHosts");

  const txtAnswers = await resolveDnsJson(srvHost, "TXT").catch((error) => {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("status 3") || message.includes("status 4")) {
      return [] as DnsJsonAnswer[];
    }

    throw error;
  });

  appendTxtOptions(params, txtAnswers);

  if (!params.has("tls") && !params.has("ssl")) {
    params.set("tls", "true");
  }

  const auth = parsedUri.username
    ? `${parsedUri.username}${parsedUri.password ? `:${parsedUri.password}` : ""}@`
    : "";
  const hosts = srvRecords.map((record) => `${record.target}:${record.port}`).join(",");
  const query = params.toString();

  return `mongodb://${auth}${hosts}${parsedUri.pathname}${query ? `?${query}` : ""}`;
}

async function lookupWithDoh(hostname: string): Promise<LookupAddress[]> {
  const [ipv4Answers, ipv6Answers] = await Promise.all([
    resolveDnsJson(hostname, "A").catch(() => [] as DnsJsonAnswer[]),
    resolveDnsJson(hostname, "AAAA").catch(() => [] as DnsJsonAnswer[]),
  ]);

  const addresses: LookupAddress[] = [
    ...ipv4Answers.map((answer) => ({ address: answer.data, family: 4 as const })),
    ...ipv6Answers.map((answer) => ({ address: answer.data, family: 6 as const })),
  ];

  if (addresses.length === 0) {
    throw new Error(`No DNS A/AAAA records found for ${hostname}`);
  }

  return addresses;
}

export const mongoDnsLookup: LookupFunction = (hostname, options, callback) => {
  void lookupWithDoh(hostname)
    .then((addresses) => {
      const family = typeof options === "object" ? options.family : undefined;
      const all = typeof options === "object" && options.all;
      const filtered = family ? addresses.filter((address) => address.family === family) : addresses;
      const selected = filtered.length > 0 ? filtered : addresses;

      if (all) {
        callback(null, selected);
        return;
      }

      callback(null, selected[0].address, selected[0].family);
    })
    .catch((error) => {
      callback(error, "", 0);
    });
};
