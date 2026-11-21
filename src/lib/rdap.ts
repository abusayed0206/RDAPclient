// Domain RDAP lookup.

import { parse } from 'tldts';

import { fetchBootstrapData } from './rdap-bootstrap';
import {
  EntityDetails,
  entityDetails,
  eventDate,
  fetchRdapJson,
  findEntityByRole,
  joinUrl,
  pickServer,
  RdapEntity,
  RdapError,
  RdapEvent,
  RdapLink,
  RdapRemark,
  vcardValue,
} from './rdap-common';

export interface RdapDomainResponse {
  ldhName?: string;
  unicodeName?: string;
  nameservers?: { ldhName?: string }[];
  status?: string[];
  events?: RdapEvent[];
  entities?: RdapEntity[];
  secureDNS?: { delegationSigned?: boolean };
  remarks?: RdapRemark[];
  links?: RdapLink[];
}

export interface NormalizedRdapData {
  domainName: string;
  registrar: string;
  registrarUrl?: string;
  registrarIanaId?: string;
  registrarAbuseEmail?: string;
  registrarAbusePhone?: string;
  dnssec: 'Signed' | 'Unsigned' | 'N/A';
  registeredOn: string;
  expiresOn: string;
  lastUpdated: string;
  lastTransferred?: string;
  statuses: { label: string; url: string }[];
  nameservers: string[];
  entities?: EntityDetails[];
  remarks?: RdapRemark[];
  links?: RdapLink[];
  rdapServer?: string;
  rdapUrl?: string;
}

/**
 * Reduce user input (URL, subdomain, IDN, mixed case) to the registrable ASCII domain.
 * Returns null when there is no registrable domain.
 */
export function normalizeDomainInput(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  let hostname = trimmed;
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//.test(trimmed)
      ? trimmed
      : `http://${trimmed}`;
    hostname = new URL(withScheme).hostname; // punycodes IDNs
  } catch {
    return null;
  }
  const parsed = parse(hostname);
  if (!parsed.domain || parsed.isIp) return null;
  return parsed.domain;
}

async function findDomainServer(domain: string): Promise<string | null> {
  const { services } = await fetchBootstrapData('dns');
  const labels = domain.split('.');
  // Longest matching suffix wins (the registry may list multi-label entries).
  for (let i = 0; i < labels.length; i++) {
    const suffix = labels.slice(i).join('.');
    const match = services.find(([tlds]) => tlds.includes(suffix));
    if (match) return pickServer(match[1]) ?? null;
  }
  return null;
}

const toEppStatusUrl = (status: string): string =>
  `https://icann.org/epp#${status.toLowerCase().replace(/\s+/g, '')}`;

export function normalizeRdapResponse(
  data: RdapDomainResponse,
  rdapServerUrl?: string,
  rdapUrl?: string,
): NormalizedRdapData {
  const registrar = findEntityByRole(data.entities, 'registrar');
  const abuse = findEntityByRole(registrar?.entities, 'abuse');
  const ianaId = registrar?.publicIds?.[0]?.identifier;

  const abuseTel = vcardValue(abuse, 'tel') ?? vcardValue(registrar, 'tel');

  const dnssec: NormalizedRdapData['dnssec'] = !data.secureDNS
    ? 'N/A'
    : data.secureDNS.delegationSigned
      ? 'Signed'
      : 'Unsigned';

  return {
    domainName: (data.ldhName ?? 'N/A').toLowerCase(),
    registrar:
      vcardValue(registrar, 'fn') ?? vcardValue(registrar, 'org') ?? 'N/A',
    registrarUrl: vcardValue(registrar, 'url'),
    registrarIanaId: ianaId,
    registrarAbuseEmail:
      vcardValue(abuse, 'email') ?? vcardValue(registrar, 'email'),
    registrarAbusePhone: abuseTel?.replace(/^tel:/i, ''),
    dnssec,
    registeredOn: eventDate(data.events, 'registration') ?? 'N/A',
    expiresOn: eventDate(data.events, 'expiration') ?? 'N/A',
    lastUpdated: eventDate(data.events, 'last changed', 'last update') ?? 'N/A',
    lastTransferred: eventDate(data.events, 'transfer'),
    statuses: (data.status ?? []).map((status) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      url: toEppStatusUrl(status),
    })),
    nameservers: (data.nameservers ?? [])
      .map((ns) => ns.ldhName?.toLowerCase())
      .filter((ns): ns is string => Boolean(ns)),
    entities: (data.entities ?? [])
      .filter((e) => !e.roles?.includes('registrar'))
      .map(entityDetails),
    remarks: data.remarks,
    links: data.links,
    rdapServer: rdapServerUrl,
    rdapUrl,
  };
}

export async function lookupDomain(input: string): Promise<NormalizedRdapData> {
  const domain = normalizeDomainInput(input);
  if (!domain) {
    throw new RdapError(`'${input}' is not a valid registrable domain.`, 400);
  }

  const server = await findDomainServer(domain);
  if (!server) {
    const tld = domain.slice(domain.lastIndexOf('.') + 1);
    throw new RdapError(
      `The .${tld} registry does not publish an RDAP service.`,
      404,
      'bootstrap',
    );
  }

  const rdapUrl = joinUrl(server, `domain/${domain}`);
  const raw = await fetchRdapJson<RdapDomainResponse>(rdapUrl);
  return normalizeRdapResponse(raw, server, rdapUrl);
}
