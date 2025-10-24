import { fetchBootstrapData } from './rdap-bootstrap';

// ASN RDAP Response Interfaces
interface RdapAsnEntity {
  handle?: string;
  roles?: string[];
  vcardArray?: [
    string,
    Array<[string, Record<string, unknown>, string, string]>,
  ];
}

interface RdapAsnResponse {
  objectClassName: string;
  handle?: string;
  startAutnum?: number;
  endAutnum?: number;
  name?: string;
  type?: string;
  status?: string[];
  country?: string;
  events?: { eventAction: string; eventDate: string }[];
  entities?: RdapAsnEntity[];
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

// Normalized ASN Data
export interface NormalizedAsnData {
  asn: number;
  range: {
    start: number;
    end: number;
  };
  name?: string;
  type?: string;
  status?: string[];
  country?: string;
  organization?: string;
  registrar?: string;
  registrationDate?: string;
  lastChanged?: string;
  remarks?: Array<{
    title?: string;
    description?: string[];
  }>;
  rdapServer: string;
}

/**
 * Validate ASN number
 */
export function validateASN(asn: string | number): {
  isValid: boolean;
  normalized?: number;
  error?: string;
} {
  try {
    const asnNum = typeof asn === 'string' ? parseInt(asn.trim(), 10) : asn;

    if (isNaN(asnNum)) {
      return {
        isValid: false,
        error: 'Invalid ASN format',
      };
    }

    // AS numbers range from 0 to 4294967295 (32-bit)
    if (asnNum < 0 || asnNum > 4294967295) {
      return {
        isValid: false,
        error: 'ASN must be between 0 and 4294967295',
      };
    }

    // Reserved ranges
    if (asnNum === 0 || asnNum === 65535 || asnNum === 4294967295) {
      return {
        isValid: false,
        error: 'Reserved ASN',
      };
    }

    return {
      isValid: true,
      normalized: asnNum,
    };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Find RDAP server for ASN
 */
async function findRdapServerForASN(asn: number): Promise<string | null> {
  const bootstrapData = await fetchBootstrapData('asn');

  for (const [ranges, urls] of bootstrapData.services) {
    for (const range of ranges) {
      // Handle ranges like "1-1876" or single numbers like "2043"
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(Number);
        if (asn >= start && asn <= end) {
          return urls[0];
        }
      } else {
        const singleAsn = Number(range);
        if (asn === singleAsn) {
          return urls[0];
        }
      }
    }
  }

  return null;
}

/**
 * Query RDAP server for ASN information
 */
async function queryRdapServer(
  asn: number,
  rdapServerUrl: string,
): Promise<RdapAsnResponse> {
  const baseUrl = rdapServerUrl.endsWith('/')
    ? rdapServerUrl
    : `${rdapServerUrl}/`;
  const queryUrl = `${baseUrl}autnum/${asn}`;

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
    console.error(`RDAP query failed for AS${asn}:`, error);
    throw error;
  }
}

/**
 * Extract organization from RDAP entities
 */
function extractOrganization(entities: RdapAsnEntity[]): string | undefined {
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
 * Main function to lookup ASN information (RDAP only)
 */
export async function lookupASN(
  asn: string | number,
): Promise<NormalizedAsnData> {
  // Validate ASN
  const validation = validateASN(asn);
  if (!validation.isValid || !validation.normalized) {
    throw new Error(validation.error || 'Invalid ASN');
  }

  const normalizedASN = validation.normalized;

  try {
    // Find appropriate RDAP server
    const rdapServer = await findRdapServerForASN(normalizedASN);
    if (!rdapServer) {
      throw new Error(`No RDAP server found for AS${normalizedASN}`);
    }

    // Query RDAP server
    const rdapData = await queryRdapServer(normalizedASN, rdapServer);

    // Extract essential information
    const organization = rdapData.entities
      ? extractOrganization(rdapData.entities)
      : undefined;
    const registrar = rdapData.entities?.find((e) =>
      e.roles?.includes('registrar'),
    );

    // Build response with RDAP data
    const result: NormalizedAsnData = {
      asn: normalizedASN,
      range: {
        start: rdapData.startAutnum || normalizedASN,
        end: rdapData.endAutnum || normalizedASN,
      },
      name: rdapData.name,
      type: rdapData.type,
      status: rdapData.status,
      country: rdapData.country,
      organization: organization,
      registrar: registrar ? extractOrganization([registrar]) : undefined,
      registrationDate: extractDate(rdapData.events, 'registration'),
      lastChanged:
        extractDate(rdapData.events, 'last changed') ||
        extractDate(rdapData.events, 'last update'),
      remarks: rdapData.remarks,
      rdapServer,
    };

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    // eslint-disable-next-line no-console
    console.error(`ASN lookup failed for AS${normalizedASN}:`, error);
    throw new Error(errorMessage);
  }
}
