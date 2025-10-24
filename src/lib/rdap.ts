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
  remarks?: Array<{
    title?: string;
    description?: string[];
  }>;
  links?: Array<{
    value?: string;
    rel?: string;
    href?: string;
    type?: string;
  }>;
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

  const response = await fetch(IANA_RDAP_DNS_JSON_URL);
  if (!response.ok)
    throw new Error(`Failed to fetch IANA data: ${response.statusText}`);
  const data = await response.json();
  rdapServersCache = data.services;
}

export function findRdapServerUrl(tld: string): string | null {
  if (!rdapServersCache)
    throw new Error('RDAP server list has not been initialized.');
  for (const [tlds, urls] of rdapServersCache) {
    if (tlds.includes(tld)) return urls[0];
  }
  return null;
}

export interface NormalizedRdapData {
  domainName: string;
  registrar: string;
  registrarUrl?: string;
  registrarAbuseEmail?: string;
  registrarAbusePhone?: string;
  dnssec: 'Signed' | 'Unsigned' | 'N/A';
  registeredOn: string;
  expiresOn: string;
  lastUpdated: string;
  lastTransferred?: string;
  statuses: { label: string; url: string }[];
  nameservers: string[];
  entities?: Array<{
    handle?: string;
    roles?: string[];
    name?: string;
    email?: string;
    organization?: string;
  }>;
  remarks?: Array<{
    title?: string;
    description?: string[];
  }>;
  links?: Array<{
    value?: string;
    rel?: string;
    href?: string;
    type?: string;
  }>;
  rdapServer?: string;
}

export function normalizeRdapResponse(
  data: RdapResponse,
  rdapServerUrl?: string,
): NormalizedRdapData {
  const findDate = (action: string): string => {
    const event = data.events?.find((e) => e.eventAction === action);
    return event ? new Date(event.eventDate).toUTCString() : 'N/A';
  };

  const extractEntityDetails = (
    entity: RdapEntity,
  ): {
    handle?: string;
    roles?: string[];
    name?: string;
    email?: string;
    organization?: string;
  } => {
    const result: {
      handle?: string;
      roles?: string[];
      name?: string;
      email?: string;
      organization?: string;
    } = {
      roles: entity.roles,
    };

    const vcard = entity.vcardArray?.[1];
    if (Array.isArray(vcard)) {
      const fn = vcard.find((item) => Array.isArray(item) && item[0] === 'fn');
      const email = vcard.find(
        (item) => Array.isArray(item) && item[0] === 'email',
      );
      const org = vcard.find(
        (item) => Array.isArray(item) && item[0] === 'org',
      );

      if (Array.isArray(fn) && typeof fn[3] === 'string') result.name = fn[3];
      if (Array.isArray(email) && typeof email[3] === 'string')
        result.email = email[3];
      if (Array.isArray(org) && typeof org[3] === 'string')
        result.organization = org[3];
    }

    return result;
  };

  const findRegistrar = (): string => {
    const registrar = data.entities?.find((e) =>
      e.roles?.includes('registrar'),
    );
    const vcard = registrar?.vcardArray?.[1];
    if (!Array.isArray(vcard)) return 'N/A';

    const fn = vcard.find((item) => Array.isArray(item) && item[0] === 'fn');
    return Array.isArray(fn) && typeof fn[3] === 'string' ? fn[3] : 'N/A';
  };

  const findRegistrarDetails = (): {
    url?: string;
    abuseEmail?: string;
    abusePhone?: string;
  } => {
    const registrar = data.entities?.find((e) =>
      e.roles?.includes('registrar'),
    );
    const vcard = registrar?.vcardArray?.[1];
    if (!Array.isArray(vcard)) return {};

    const url = vcard.find((item) => Array.isArray(item) && item[0] === 'url');
    const email = vcard.find(
      (item) => Array.isArray(item) && item[0] === 'email',
    );
    const tel = vcard.find((item) => Array.isArray(item) && item[0] === 'tel');

    return {
      url:
        Array.isArray(url) && typeof url[3] === 'string' ? url[3] : undefined,
      abuseEmail:
        Array.isArray(email) && typeof email[3] === 'string'
          ? email[3]
          : undefined,
      abusePhone:
        Array.isArray(tel) && typeof tel[3] === 'string' ? tel[3] : undefined,
    };
  };

  const toEppStatusUrl = (status: string): string =>
    `https://icann.org/epp#${status.toLowerCase().replace(/\s+/g, '')}`;

  const registrarDetails = findRegistrarDetails();
  const entities = data.entities?.map(extractEntityDetails) || [];

  return {
    domainName: data.ldhName || 'N/A',
    registrar: findRegistrar(),
    registrarUrl: registrarDetails.url,
    registrarAbuseEmail: registrarDetails.abuseEmail,
    registrarAbusePhone: registrarDetails.abusePhone,
    dnssec: data.secureDNS?.delegationSigned ? 'Signed' : 'Unsigned',
    registeredOn: findDate('registration'),
    expiresOn: findDate('expiration'),
    lastUpdated: findDate('last changed') || findDate('last update') || 'N/A',
    lastTransferred: findDate('transfer'),
    statuses:
      data.status?.map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        url: toEppStatusUrl(status),
      })) || [],
    nameservers:
      data.nameservers?.map((ns) => ns.ldhName || 'N/A').filter(Boolean) || [],
    entities,
    remarks: data.remarks,
    links: data.links,
    rdapServer: rdapServerUrl,
  };
}
