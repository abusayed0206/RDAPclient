// Autonomous System Number RDAP lookup.

import { fetchBootstrapData } from './rdap-bootstrap';
import {
  EntityDetails,
  entityDetails,
  eventDate,
  fetchRdapJson,
  findEntityByRole,
  holderName,
  joinUrl,
  pickServer,
  RdapEntity,
  RdapError,
  RdapEvent,
  RdapLink,
  RdapRemark,
  vcardValue,
} from './rdap-common';

interface RdapAsnResponse {
  handle?: string;
  startAutnum?: number;
  endAutnum?: number;
  name?: string;
  type?: string;
  status?: string[];
  country?: string;
  events?: RdapEvent[];
  entities?: RdapEntity[];
  remarks?: RdapRemark[];
  links?: RdapLink[];
}

export interface NormalizedAsnData {
  asn: number;
  handle?: string;
  range: { start: number; end: number };
  name?: string;
  type?: string;
  status?: string[];
  country?: string;
  organization?: string;
  registrar?: string;
  registrationDate?: string;
  lastChanged?: string;
  entities?: EntityDetails[];
  remarks?: RdapRemark[];
  rdapServer: string;
  rdapUrl: string;
}

const MAX_ASN = 4294967295;

/** Accepts "AS15169", "as 15169" or "15169". */
export function validateASN(asn: string | number): {
  isValid: boolean;
  normalized?: number;
  error?: string;
} {
  const raw = String(asn)
    .trim()
    .replace(/^as\s*/i, '');
  if (!/^\d+$/.test(raw))
    return { isValid: false, error: 'Invalid ASN format' };
  const value = Number(raw);
  if (value > MAX_ASN) {
    return { isValid: false, error: `ASN must be between 1 and ${MAX_ASN}` };
  }
  if (value === 0 || value === 23456 || value === 65535 || value === MAX_ASN) {
    return { isValid: false, error: `AS${value} is reserved` };
  }
  return { isValid: true, normalized: value };
}

async function findAsnServer(asn: number): Promise<string | null> {
  const { services } = await fetchBootstrapData('asn');
  for (const [ranges, urls] of services) {
    for (const range of ranges) {
      const [start, end = start] = range.split('-').map(Number);
      if (asn >= start && asn <= end) return pickServer(urls) ?? null;
    }
  }
  return null;
}

export async function lookupASN(
  input: string | number,
): Promise<NormalizedAsnData> {
  const { isValid, normalized: asn, error } = validateASN(input);
  if (!isValid || asn === undefined) {
    throw new RdapError(error ?? 'Invalid ASN', 400);
  }

  const server = await findAsnServer(asn);
  if (!server) {
    throw new RdapError(
      `AS${asn} is not delegated to any RDAP-enabled registry.`,
      404,
      'bootstrap',
    );
  }

  const rdapUrl = joinUrl(server, `autnum/${asn}`);
  const data = await fetchRdapJson<RdapAsnResponse>(rdapUrl);
  const registrar = findEntityByRole(data.entities, 'registrar');

  return {
    asn,
    handle: data.handle,
    range: { start: data.startAutnum ?? asn, end: data.endAutnum ?? asn },
    name: data.name,
    type: data.type,
    status: data.status,
    country: data.country,
    organization: holderName(data.entities),
    registrar: registrar
      ? (vcardValue(registrar, 'org') ?? vcardValue(registrar, 'fn'))
      : undefined,
    registrationDate: eventDate(data.events, 'registration'),
    lastChanged: eventDate(data.events, 'last changed', 'last update'),
    entities: data.entities?.map(entityDetails),
    remarks: data.remarks,
    rdapServer: server,
    rdapUrl,
  };
}
