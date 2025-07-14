import { Address4, Address6 } from 'ip-address';

import { IPVersion, isPrivateIP, isReservedIP, validateIP } from './ip-utils';

// Simplified interface for RDAP-only data
export interface NormalizedIPData {
  ip: string;
  type: IPVersion;
  network: {
    cidr?: string;
    name?: string;
    country?: string;
    organization?: string;
    registrar?: string;
    registrationDate?: string;
    lastChanged?: string;
  };
  rdapServer: string;
}

// RDAP Response Interfaces
interface RdapIPEntity {
  handle?: string;
  roles?: string[];
  vcardArray?: [
    string,
    Array<[string, Record<string, unknown>, string, string]>,
  ];
}

interface RdapIPResponse {
  objectClassName: string;
  startAddress?: string;
  endAddress?: string;
  name?: string;
  type?: string;
  country?: string;
  events?: { eventAction: string; eventDate: string }[];
  entities?: RdapIPEntity[];
}

// Bootstrap URLs
const IANA_BOOTSTRAP_URLS = {
  ipv4: 'https://data.iana.org/rdap/ipv4.json',
  ipv6: 'https://data.iana.org/rdap/ipv6.json',
};

// Cache variables
let ipv4BootstrapCache: [string[], string[]][] | null = null;
let ipv6BootstrapCache: [string[], string[]][] | null = null;
let bootstrapCacheExpiry = 0;

/**
 * Fetch and cache IANA bootstrap data
 */
async function fetchBootstrapData(): Promise<void> {
  const now = Date.now();
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  if (ipv4BootstrapCache && ipv6BootstrapCache && now < bootstrapCacheExpiry) {
    return;
  }

  try {
    const [ipv4Response, ipv6Response] = await Promise.all([
      fetch(IANA_BOOTSTRAP_URLS.ipv4),
      fetch(IANA_BOOTSTRAP_URLS.ipv6),
    ]);

    if (!ipv4Response.ok || !ipv6Response.ok) {
      throw new Error('Failed to fetch IANA bootstrap data');
    }

    const [ipv4Data, ipv6Data] = await Promise.all([
      ipv4Response.json(),
      ipv6Response.json(),
    ]);

    ipv4BootstrapCache = ipv4Data.services;
    ipv6BootstrapCache = ipv6Data.services;
    bootstrapCacheExpiry = now + CACHE_TTL;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch bootstrap data:', error);
    throw error;
  }
}

/**
 * Find RDAP server for IP
 */
function findRdapServerForIP(ip: string, version: IPVersion): string | null {
  const cache = version === 'IPv4' ? ipv4BootstrapCache : ipv6BootstrapCache;

  if (!cache) {
    throw new Error('Bootstrap data not loaded');
  }

  for (const [cidrs, urls] of cache) {
    for (const cidr of cidrs) {
      try {
        if (version === 'IPv4') {
          const ipAddr = new Address4(ip);
          const range = new Address4(cidr);
          if (ipAddr.isInSubnet(range)) {
            return urls[0];
          }
        } else {
          const ipAddr = new Address6(ip);
          const range = new Address6(cidr);
          if (ipAddr.isInSubnet(range)) {
            return urls[0];
          }
        }
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}

/**
 * Query RDAP server for IP information
 */
async function queryRdapServer(
  ip: string,
  rdapServerUrl: string,
): Promise<RdapIPResponse> {
  const baseUrl = rdapServerUrl.endsWith('/')
    ? rdapServerUrl
    : `${rdapServerUrl}/`;
  const queryUrl = `${baseUrl}ip/${ip}`;

  try {
    const response = await fetch(queryUrl, {
      headers: {
        Accept: 'application/rdap+json, application/json',
        'User-Agent': 'RDAPclient/1.0',
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.description || errorData.title || errorMessage;
      } catch (e) {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`RDAP query failed for ${ip}:`, error);
    throw error;
  }
}

/**
 * Convert IP to integer for range comparison (IPv4 only)
 */
function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

/**
 * Extract organization from RDAP entities
 */
function extractOrganization(entities: RdapIPEntity[]): string | undefined {
  for (const entity of entities) {
    if (entity.vcardArray && Array.isArray(entity.vcardArray[1])) {
      const vcard = entity.vcardArray[1];

      // Look for organization or full name
      const org = vcard.find(
        (item) => Array.isArray(item) && item[0] === 'org',
      );
      const fn = vcard.find((item) => Array.isArray(item) && item[0] === 'fn');

      if (org && typeof org[3] === 'string') return org[3];
      if (fn && typeof fn[3] === 'string') return fn[3];
    }
  }
  return undefined;
}

/**
 * Extract date from RDAP events
 */
function extractDate(
  events: { eventAction: string; eventDate: string }[] | undefined,
  action: string,
): string | undefined {
  const event = events?.find((e) => e.eventAction === action);
  return event ? new Date(event.eventDate).toUTCString() : undefined;
}

/**
 * Main function to lookup IP information (RDAP only)
 */
export async function lookupIP(ip: string): Promise<NormalizedIPData> {
  // Validate IP address
  const validation = validateIP(ip);
  if (!validation.isValid || !validation.version || !validation.normalized) {
    throw new Error(validation.error || 'Invalid IP address');
  }

  const normalizedIP = validation.normalized;
  const version = validation.version;

  // Check for private/reserved IP addresses
  if (isPrivateIP(normalizedIP)) {
    throw new Error('Private IP addresses are not supported');
  }

  if (isReservedIP(normalizedIP)) {
    throw new Error('Reserved IP addresses are not supported');
  }

  try {
    // Load bootstrap data
    await fetchBootstrapData();

    // Find appropriate RDAP server
    const rdapServer = findRdapServerForIP(normalizedIP, version);
    if (!rdapServer) {
      throw new Error(`No RDAP server found for IP ${normalizedIP}`);
    }

    // Query RDAP server
    const rdapData = await queryRdapServer(normalizedIP, rdapServer);

    // Extract essential network information
    const organization = rdapData.entities
      ? extractOrganization(rdapData.entities)
      : undefined;
    const registrar = rdapData.entities?.find((e) =>
      e.roles?.includes('registrar'),
    );

    // Build CIDR notation
    let cidr: string | undefined;
    if (rdapData.startAddress && rdapData.endAddress) {
      if (version === 'IPv4') {
        try {
          const startInt = ipToInt(rdapData.startAddress);
          const endInt = ipToInt(rdapData.endAddress);
          const size = endInt - startInt + 1;
          const prefixLength = 32 - Math.log2(size);
          cidr = `${rdapData.startAddress}/${Math.floor(prefixLength)}`;
        } catch (e) {
          cidr = `${rdapData.startAddress}-${rdapData.endAddress}`;
        }
      } else {
        cidr = `${rdapData.startAddress}/64`; // Default for IPv6
      }
    }

    // Build response with RDAP data only
    const result: NormalizedIPData = {
      ip: normalizedIP,
      type: version,
      network: {
        cidr,
        name: rdapData.name,
        country: rdapData.country,
        organization: organization,
        registrar: registrar ? extractOrganization([registrar]) : undefined,
        registrationDate: extractDate(rdapData.events, 'registration'),
        lastChanged:
          extractDate(rdapData.events, 'last changed') ||
          extractDate(rdapData.events, 'last update'),
      },
      rdapServer,
    };

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    // eslint-disable-next-line no-console
    console.error(`IP lookup failed for ${normalizedIP}:`, error);
    throw new Error(errorMessage);
  }
}
