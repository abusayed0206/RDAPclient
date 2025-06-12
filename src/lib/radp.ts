// src/lib/rdap.ts

// --- TYPE DEFINITIONS for raw RDAP Response ---
export interface RdapEvent {
  eventAction: string;
  eventDate: string;
}

export interface RdapEntity {
  roles?: string[];
  vcardArray?: (string | (string | string | string | string)[])[];
}

export interface RdapNameserver {
    ldhName?: string;
}

export interface RdapSecureDns {
    delegationSigned?: boolean;
}

export interface RdapResponse {
  ldhName?: string;
  nameservers?: RdapNameserver[];
  status?: string[];
  events?: RdapEvent[];
  entities?: RdapEntity[];
  secureDNS?: RdapSecureDns;
}

// --- TYPE DEFINITION for Normalized/Processed Data ---
export interface NormalizedRdapData {
  domainName: string;
  registrar: string;
  dnssec: 'Signed' | 'Unsigned' | 'N/A';
  registeredOn: string;
  expiresOn: string;
  lastUpdated: string;
  statuses: string[];
  nameservers: string[];
}


// --- CORE LOGIC ---

const IANA_RDAP_DNS_JSON_URL = 'https://data.iana.org/rdap/dns.json';
// This cache is stored in memory on the server.
let rdapServersCache: [string[], string[]][] | null = null;

/**
 * Fetches and caches the list of RDAP servers from IANA.
 * The cache is stored in a global variable to persist across requests in a serverless environment.
 */
export async function fetchAndCacheServers() {
  if (rdapServersCache) {
    return;
  }
  try {
    const response = await fetch(IANA_RDAP_DNS_JSON_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch IANA data: ${response.statusText}`);
    }
    const data = await response.json();
    rdapServersCache = data.services;
  } catch (error) {
    console.error('Failed to initialize RDAP server cache:', error);
    throw error;
  }
}

/**
 * Finds the correct RDAP server URL for a given Top-Level Domain (TLD).
 * @param tld The Top-Level Domain (e.g., "com", "org").
 * @returns The base URL of the RDAP server, or null if not found.
 */
export function findRdapServerUrl(tld: string): string | null {
  if (!rdapServersCache) {
    throw new Error('RDAP server list has not been initialized.');
  }
  for (const service of rdapServersCache) {
    const tlds = service[0];
    const url = service[1][0]; 
    if (tlds.includes(tld)) {
      return url;
    }
  }
  return null;
}

/**
 * Normalizes the raw RDAP JSON response into a more human-readable format.
 * @param data The raw RDAP JSON response.
 * @returns The structured, simplified data.
 */
export function normalizeRdapResponse(data: RdapResponse): NormalizedRdapData {
    const findDate = (action: string): string => {
        const event = data.events?.find(e => e.eventAction === action);
        return event ? new Date(event.eventDate).toUTCString() : 'N/A';
    };

    const findRegistrar = (): string => {
        const registrarEntity = data.entities?.find(e => e.roles?.includes('registrar'));
        if (!registrarEntity) return 'N/A';
        
        const vcard = registrarEntity.vcardArray?.[1];
        if (!Array.isArray(vcard)) return 'N/A';
        
        const fn = vcard.find(prop => Array.isArray(prop) && prop[0] === 'fn');
        return Array.isArray(fn) && typeof fn[3] === 'string' ? fn[3] : 'N/A';
    };

    return {
        domainName: data.ldhName || 'N/A',
        registrar: findRegistrar(),
        dnssec: data.secureDNS?.delegationSigned ? 'Signed' : 'Unsigned',
        registeredOn: findDate('registration'),
        expiresOn: findDate('expiration'),
        lastUpdated: findDate('last changed') || findDate('last update') || 'N/A',
        statuses: data.status?.map(s => s.charAt(0).toUpperCase() + s.slice(1)) || ['N/A'],
        nameservers: data.nameservers?.map(ns => ns.ldhName || 'N/A').filter(ns => ns !== 'N/A') || [],
    };
}
