import { Address4, Address6 } from 'ip-address';

import { isPrivateIP, isReservedIP, IPVersion, validateIP } from './ip-utils';

// Streamlined interfaces for essential data only
export interface NormalizedIPData {
  ip: string;
  type: IPVersion;
  network: {
    cidr?: string;
    name?: string;
    country?: string;
    organization?: string;
    registrar?: string;
  };
  location?: {
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  };
  rdapServer: string;
}

// Geolocation database interfaces
interface GeoLocationRecord {
  startIP: string;
  endIP: string;
  countryCode: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// RDAP Response Interfaces (simplified)
interface RdapIPEntity {
  handle?: string;
  roles?: string[];
  vcardArray?: [string, Array<[string, Record<string, unknown>, string, string]>];
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
  ipv6: 'https://data.iana.org/rdap/ipv6.json'
};

// Geolocation database URLs
const GEOLOCATION_DB_URLS = {
  ipv4: 'https://raw.githubusercontent.com/sapics/ip-location-db/main/geolite2-city/geolite2-city-ipv4.csv',
  ipv6: 'https://raw.githubusercontent.com/sapics/ip-location-db/main/geolite2-city/geolite2-city-ipv6.csv'
};

// Cache variables
let ipv4BootstrapCache: [string[], string[]][] | null = null;
let ipv6BootstrapCache: [string[], string[]][] | null = null;
let ipv4GeoCache: GeoLocationRecord[] | null = null;
let ipv6GeoCache: GeoLocationRecord[] | null = null;
let bootstrapCacheExpiry = 0;
let geoCacheExpiry = 0;

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
      fetch(IANA_BOOTSTRAP_URLS.ipv6)
    ]);
    
    if (!ipv4Response.ok || !ipv6Response.ok) {
      throw new Error('Failed to fetch IANA bootstrap data');
    }
    
    const [ipv4Data, ipv6Data] = await Promise.all([
      ipv4Response.json(),
      ipv6Response.json()
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
 * Fetch and cache geolocation database
 */
async function fetchGeolocationData(): Promise<void> {
  const now = Date.now();
  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days (geo data updates weekly)
  
  if (ipv4GeoCache && ipv6GeoCache && now < geoCacheExpiry) {
    return;
  }
  
  try {
    const [ipv4Response, ipv6Response] = await Promise.all([
      fetch(GEOLOCATION_DB_URLS.ipv4),
      fetch(GEOLOCATION_DB_URLS.ipv6)
    ]);
    
    if (!ipv4Response.ok || !ipv6Response.ok) {
      return;
    }
    
    const [ipv4Text, ipv6Text] = await Promise.all([
      ipv4Response.text(),
      ipv6Response.text()
    ]);
    
    ipv4GeoCache = parseGeoCSV(ipv4Text);
    ipv6GeoCache = parseGeoCSV(ipv6Text);
    geoCacheExpiry = now + CACHE_TTL;
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch geolocation data:', error);
    // Don't throw - geo data is optional
  }
}

/**
 * Parse geolocation CSV data
 */
function parseGeoCSV(csvText: string): GeoLocationRecord[] {
  const lines = csvText.trim().split('\n');
  const records: GeoLocationRecord[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV (handle quoted fields)
    const fields = parseCSVLine(line);
    
    if (fields.length >= 8) {
      records.push({
        startIP: fields[0],
        endIP: fields[1],
        countryCode: fields[2] || '',
        country: fields[3] || '',
        region: fields[4] || '',
        city: fields[5] || '',
        latitude: parseFloat(fields[6]) || 0,
        longitude: parseFloat(fields[7]) || 0,
        timezone: fields[8] || ''
      });
    }
  }
  
  return records;
}

/**
 * Simple CSV line parser that handles quoted fields
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields;
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
async function queryRdapServer(ip: string, rdapServerUrl: string): Promise<RdapIPResponse> {
  const baseUrl = rdapServerUrl.endsWith('/') ? rdapServerUrl : `${rdapServerUrl}/`;
  const queryUrl = `${baseUrl}ip/${ip}`;
  
  try {
    const response = await fetch(queryUrl, {
      headers: {
        'Accept': 'application/rdap+json, application/json',
        'User-Agent': 'RDAPclient/1.0'
      }
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
 * Check if IPv6 address is in range using string comparison
 */
function isIPv6InRange(ip: string, startIP: string, endIP: string): boolean {
  try {
    const ipAddr = new Address6(ip);
    const startAddr = new Address6(startIP);
    const endAddr = new Address6(endIP);
    
    // Use canonicalForm for consistent comparison
    const ipCanonical = ipAddr.canonicalForm();
    const startCanonical = startAddr.canonicalForm();
    const endCanonical = endAddr.canonicalForm();
    
    return ipCanonical >= startCanonical && ipCanonical <= endCanonical;
  } catch (e) {
    return false;
  }
}

/**
 * Find geolocation data for IP
 */
function findGeolocation(ip: string, version: IPVersion): NormalizedIPData['location'] | undefined {
  const cache = version === 'IPv4' ? ipv4GeoCache : ipv6GeoCache;
  
  if (!cache || cache.length === 0) {
    return undefined;
  }
  
  if (version === 'IPv4') {
    const ipInt = ipToInt(ip);
    
    // Binary search for efficiency
    let left = 0;
    let right = cache.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const record = cache[mid];
      
      const startInt = ipToInt(record.startIP);
      const endInt = ipToInt(record.endIP);
      
      if (ipInt >= startInt && ipInt <= endInt) {
        return {
          country: record.country || undefined,
          countryCode: record.countryCode || undefined,
          region: record.region || undefined,
          city: record.city || undefined,
          latitude: record.latitude || undefined,
          longitude: record.longitude || undefined,
          timezone: record.timezone || undefined
        };
      } else if (ipInt < startInt) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
  } else {
    // For IPv6, use linear search with improved comparison
    for (const record of cache) {
      try {
        if (isIPv6InRange(ip, record.startIP, record.endIP)) {
          return {
            country: record.country || undefined,
            countryCode: record.countryCode || undefined,
            region: record.region || undefined,
            city: record.city || undefined,
            latitude: record.latitude || undefined,
            longitude: record.longitude || undefined,
            timezone: record.timezone || undefined
          };
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  return undefined;
}

/**
 * Extract organization from RDAP entities
 */
function extractOrganization(entities: RdapIPEntity[]): string | undefined {
  for (const entity of entities) {
    if (entity.vcardArray && Array.isArray(entity.vcardArray[1])) {
      const vcard = entity.vcardArray[1];
      
      // Look for organization or full name
      const org = vcard.find(item => Array.isArray(item) && item[0] === 'org');
      const fn = vcard.find(item => Array.isArray(item) && item[0] === 'fn');
      
      if (org && typeof org[3] === 'string') return org[3];
      if (fn && typeof fn[3] === 'string') return fn[3];
    }
  }
  return undefined;
}

/**
 * Main function to lookup IP information
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
    // Load data in parallel
    await Promise.all([
      fetchBootstrapData(),
      fetchGeolocationData()
    ]);
    
    // Find appropriate RDAP server
    const rdapServer = findRdapServerForIP(normalizedIP, version);
    if (!rdapServer) {
      throw new Error(`No RDAP server found for IP ${normalizedIP}`);
    }
    
    // Query RDAP server
    const rdapData = await queryRdapServer(normalizedIP, rdapServer);
    
    // Extract essential network information
    const organization = rdapData.entities ? extractOrganization(rdapData.entities) : undefined;
    const registrar = rdapData.entities?.find(e => e.roles?.includes('registrar'));
    
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
    
    // Get geolocation data
    const location = findGeolocation(normalizedIP, version);
    
    // Build streamlined response
    const result: NormalizedIPData = {
      ip: normalizedIP,
      type: version,
      network: {
        cidr,
        name: rdapData.name,
        country: rdapData.country,
        organization: organization,
        registrar: registrar ? extractOrganization([registrar]) : undefined
      },
      rdapServer
    };
    
    if (location) {
      result.location = location;
    }
    
    return result;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // eslint-disable-next-line no-console
    console.error(`IP lookup failed for ${normalizedIP}:`, error);
    throw new Error(errorMessage);
  }
}
