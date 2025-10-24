// Centralized IANA RDAP Bootstrap Data Management

export interface BootstrapService {
  ranges: string[];
  urls: string[];
}

export interface BootstrapData {
  description: string;
  publication: string;
  services: [string[], string[]][];
  version: string;
}

// IANA Bootstrap URLs
export const IANA_BOOTSTRAP_URLS = {
  ipv4: 'https://data.iana.org/rdap/ipv4.json',
  ipv6: 'https://data.iana.org/rdap/ipv6.json',
  asn: 'https://data.iana.org/rdap/asn.json',
  dns: 'https://data.iana.org/rdap/dns.json',
  objectTags: 'https://data.iana.org/rdap/object-tags.json',
} as const;

// Cache storage
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const bootstrapCache = new Map<string, CacheEntry<BootstrapData>>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch and cache IANA bootstrap data
 */
export async function fetchBootstrapData(
  type: keyof typeof IANA_BOOTSTRAP_URLS,
): Promise<BootstrapData> {
  const now = Date.now();
  const cached = bootstrapCache.get(type);

  // Return cached data if still valid
  if (cached && now < cached.expiry) {
    return cached.data;
  }

  try {
    const response = await fetch(IANA_BOOTSTRAP_URLS[type]);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} bootstrap data`);
    }

    const data: BootstrapData = await response.json();

    // Cache the data
    bootstrapCache.set(type, {
      data,
      expiry: now + CACHE_TTL,
    });

    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to fetch ${type} bootstrap data:`, error);
    throw error;
  }
}

/**
 * Clear all bootstrap caches
 */
export function clearBootstrapCache(): void {
  bootstrapCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: { type: string; expiry: Date }[];
} {
  const entries = Array.from(bootstrapCache.entries()).map(
    ([type, { expiry }]) => ({
      type,
      expiry: new Date(expiry),
    }),
  );

  return {
    size: bootstrapCache.size,
    entries,
  };
}
