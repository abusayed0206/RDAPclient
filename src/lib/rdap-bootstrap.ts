// IANA RDAP bootstrap registries (RFC 9224), cached in memory per server instance.

import { RdapError } from './rdap-common';

export interface BootstrapData {
  description: string;
  publication: string;
  services: [string[], string[]][];
  version: string;
}

export const IANA_BOOTSTRAP_URLS = {
  ipv4: 'https://data.iana.org/rdap/ipv4.json',
  ipv6: 'https://data.iana.org/rdap/ipv6.json',
  asn: 'https://data.iana.org/rdap/asn.json',
  dns: 'https://data.iana.org/rdap/dns.json',
} as const;

export type BootstrapType = keyof typeof IANA_BOOTSTRAP_URLS;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map<BootstrapType, { data: BootstrapData; expiry: number }>();
const inFlight = new Map<BootstrapType, Promise<BootstrapData>>();

async function download(type: BootstrapType): Promise<BootstrapData> {
  let response: Response;
  try {
    response = await fetch(IANA_BOOTSTRAP_URLS[type], {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: CACHE_TTL_MS / 1000 },
    });
  } catch {
    throw new RdapError(
      'Could not load the IANA RDAP bootstrap registry.',
      502,
      'bootstrap',
    );
  }
  if (!response.ok) {
    throw new RdapError(
      `IANA bootstrap registry returned HTTP ${response.status}.`,
      502,
      'bootstrap',
    );
  }
  return (await response.json()) as BootstrapData;
}

/** Fetch a bootstrap registry, reusing a fresh cached copy and de-duplicating concurrent loads. */
export async function fetchBootstrapData(
  type: BootstrapType,
): Promise<BootstrapData> {
  const cached = cache.get(type);
  if (cached && Date.now() < cached.expiry) return cached.data;

  const pending = inFlight.get(type);
  if (pending) return pending;

  const request = download(type)
    .then((data) => {
      cache.set(type, { data, expiry: Date.now() + CACHE_TTL_MS });
      return data;
    })
    .catch((error) => {
      // Serve a stale copy rather than failing if IANA is briefly unreachable.
      if (cached) return cached.data;
      throw error;
    })
    .finally(() => inFlight.delete(type));

  inFlight.set(type, request);
  return request;
}

export function clearBootstrapCache(): void {
  cache.clear();
}
