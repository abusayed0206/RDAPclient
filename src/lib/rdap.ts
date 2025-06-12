// src/lib/rdap.ts

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

export interface NormalizedRdapData {
  domainName: string;
  registrar: string;
  dnssec: 'Signed' | 'Unsigned' | 'N/A';
  registeredOn: string;
  expiresOn: string;
  lastUpdated: string;
  statuses: { label: string; url: string }[];
  nameservers: string[];
}

const IANA_RDAP_DNS_JSON_URL = 'https://data.iana.org/rdap/dns.json';

let rdapServersCache: [string[], string[]][] | null = null;

export async function fetchAndCacheServers() {
  if (rdapServersCache) return;

  try {
    const response = await fetch(IANA_RDAP_DNS_JSON_URL);
    if (!response.ok) throw new Error(`Failed to fetch IANA data: ${response.statusText}`);
    const data = await response.json();
    rdapServersCache = data.services;
  } catch (error) {
    console.error('Failed to initialize RDAP server cache:', error);
    throw error;
  }
}

export function findRdapServerUrl(tld: string): string | null {
  if (!rdapServersCache) throw new Error('RDAP server list has not been initialized.');
  for (const [tlds, urls] of rdapServersCache) {
    if (tlds.includes(tld)) return urls[0];
  }
  return null;
}

export function normalizeRdapResponse(data: RdapResponse): NormalizedRdapData {
  const findDate = (action: string): string => {
    const event = data.events?.find(e => e.eventAction === action);
    return event ? new Date(event.eventDate).toUTCString() : 'N/A';
  };

  const findRegistrar = (): string => {
    const registrar = data.entities?.find(e => e.roles?.includes('registrar'));
    const vcard = registrar?.vcardArray?.[1];
    if (!Array.isArray(vcard)) return 'N/A';

    const fn = vcard.find(item => Array.isArray(item) && item[0] === 'fn');
    return Array.isArray(fn) && typeof fn[3] === 'string' ? fn[3] : 'N/A';
  };

  const toEppStatusUrl = (status: string): string =>
    `https://icann.org/epp#${status.toLowerCase().replace(/\s+/g, '')}`;

  return {
    domainName: data.ldhName || 'N/A',
    registrar: findRegistrar(),
    dnssec: data.secureDNS?.delegationSigned ? 'Signed' : 'Unsigned',
    registeredOn: findDate('registration'),
    expiresOn: findDate('expiration'),
    lastUpdated: findDate('last changed') || findDate('last update') || 'N/A',
    statuses: data.status?.map(status => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      url: toEppStatusUrl(status),
    })) || [],
    nameservers: data.nameservers?.map(ns => ns.ldhName || 'N/A').filter(Boolean) || [],
  };
}
