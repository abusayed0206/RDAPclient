// IP network RDAP lookup.

import { Address4, Address6 } from 'ip-address';

import {
  IPVersion,
  isPrivateIP,
  isReservedIP,
  rangeToCidr,
  validateIP,
} from './ip-utils';
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

export interface NormalizedIPData {
  ip: string;
  type: IPVersion;
  network: {
    cidr?: string;
    handle?: string;
    name?: string;
    country?: string;
    organization?: string;
    registrar?: string;
    registrationDate?: string;
    lastChanged?: string;
    type?: string;
    status?: string[];
  };
  entities?: EntityDetails[];
  remarks?: RdapRemark[];
  links?: RdapLink[];
  rdapServer: string;
  rdapUrl: string;
}

interface RdapIPResponse {
  handle?: string;
  startAddress?: string;
  endAddress?: string;
  name?: string;
  type?: string;
  country?: string;
  status?: string[];
  events?: RdapEvent[];
  entities?: RdapEntity[];
  remarks?: RdapRemark[];
  links?: RdapLink[];
  cidr0_cidrs?: { v4prefix?: string; v6prefix?: string; length: number }[];
}

async function findIPServer(
  ip: string,
  version: IPVersion,
): Promise<string | null> {
  const { services } = await fetchBootstrapData(
    version === 'IPv4' ? 'ipv4' : 'ipv6',
  );
  // Returns the matching prefix length, or null when ip is outside cidr.
  const match = (cidr: string): number | null => {
    if (version === 'IPv4') {
      const range = new Address4(cidr);
      return new Address4(ip).isInSubnet(range) ? range.subnetMask : null;
    }
    const range = new Address6(cidr);
    return new Address6(ip).isInSubnet(range) ? range.subnetMask : null;
  };

  // Most specific registry entry wins.
  let best: { prefix: number; url: string } | null = null;
  for (const [cidrs, urls] of services) {
    for (const cidr of cidrs) {
      try {
        const prefix = match(cidr);
        const url = pickServer(urls);
        if (prefix !== null && url && (!best || prefix > best.prefix)) {
          best = { prefix, url };
        }
      } catch {
        // skip malformed entries
      }
    }
  }
  return best?.url ?? null;
}

function networkCidr(data: RdapIPResponse, version: IPVersion) {
  const cidrs = (data.cidr0_cidrs ?? [])
    .map((c) => {
      const prefix = c.v4prefix ?? c.v6prefix;
      return prefix ? `${prefix}/${c.length}` : null;
    })
    .filter(Boolean);
  if (cidrs.length) return cidrs.join(', ');
  if (data.startAddress && data.endAddress) {
    return rangeToCidr(data.startAddress, data.endAddress, version);
  }
  return undefined;
}

export async function lookupIP(input: string): Promise<NormalizedIPData> {
  const { isValid, version, normalized, error } = validateIP(input);
  if (!isValid || !version || !normalized) {
    throw new RdapError(error ?? 'Invalid IP address', 400);
  }
  if (isPrivateIP(normalized)) {
    throw new RdapError(
      'Private and loopback addresses are not registered in RDAP.',
      400,
    );
  }
  if (isReservedIP(normalized)) {
    throw new RdapError(
      'Reserved and multicast addresses are not registered in RDAP.',
      400,
    );
  }

  const server = await findIPServer(normalized, version);
  if (!server) {
    throw new RdapError(
      `No RDAP server found for ${normalized}.`,
      404,
      'bootstrap',
    );
  }

  const rdapUrl = joinUrl(server, `ip/${normalized}`);
  const data = await fetchRdapJson<RdapIPResponse>(rdapUrl);
  const registrar = findEntityByRole(data.entities, 'registrar');

  return {
    ip: normalized,
    type: version,
    network: {
      cidr: networkCidr(data, version),
      handle: data.handle,
      name: data.name,
      country: data.country,
      organization: holderName(data.entities),
      registrar: registrar
        ? (vcardValue(registrar, 'org') ?? vcardValue(registrar, 'fn'))
        : undefined,
      registrationDate: eventDate(data.events, 'registration'),
      lastChanged: eventDate(data.events, 'last changed', 'last update'),
      type: data.type,
      status: data.status,
    },
    entities: data.entities?.map(entityDetails),
    remarks: data.remarks,
    links: data.links,
    rdapServer: server,
    rdapUrl,
  };
}
