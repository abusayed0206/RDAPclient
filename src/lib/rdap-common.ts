// Shared RDAP types and helpers used by the domain, IP and ASN lookups.

export const RDAP_TIMEOUT_MS = 10_000;
const USER_AGENT = 'RDAPclient (+https://rdap.sayed.app)';

/** Where a lookup failed: the user's input, the IANA bootstrap step, or the registry itself. */
export type RdapStage = 'input' | 'bootstrap' | 'registry';

/** Error carrying the HTTP status the API route should respond with. */
export class RdapError extends Error {
  readonly status: number;
  readonly stage: RdapStage;

  constructor(message: string, status = 500, stage?: RdapStage) {
    super(message);
    this.name = 'RdapError';
    this.status = status;
    this.stage = stage ?? (status === 400 ? 'input' : 'registry');
  }
}

export function errorStatus(error: unknown): number {
  return error instanceof RdapError ? error.status : 500;
}

export function errorStage(error: unknown): RdapStage {
  return error instanceof RdapError ? error.stage : 'registry';
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unknown error occurred';
}

export interface RdapEvent {
  eventAction: string;
  eventDate: string;
}

export interface RdapLink {
  value?: string;
  rel?: string;
  href?: string;
  type?: string;
}

export interface RdapRemark {
  title?: string;
  description?: string[];
}

type VcardProperty = [string, Record<string, unknown>, string, unknown];

export interface RdapEntity {
  handle?: string;
  roles?: string[];
  vcardArray?: [string, VcardProperty[]];
  entities?: RdapEntity[];
  publicIds?: { type?: string; identifier?: string }[];
}

export interface EntityDetails {
  handle?: string;
  roles?: string[];
  name?: string;
  email?: string;
  phone?: string;
  organization?: string;
}

/** Read the first string value of a vCard property (fn, org, email, tel, url…). */
export function vcardValue(
  entity: RdapEntity | undefined,
  property: string,
): string | undefined {
  const props = entity?.vcardArray?.[1];
  if (!Array.isArray(props)) return undefined;
  const found = props.find((p) => Array.isArray(p) && p[0] === property);
  if (!found) return undefined;
  const value = found[3];
  if (typeof value === 'string') return value.trim() || undefined;
  // org can be an array of components; tel can be a "tel:" URI
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

export function entityDetails(entity: RdapEntity): EntityDetails {
  const tel = vcardValue(entity, 'tel');
  return {
    handle: entity.handle,
    roles: entity.roles,
    name: vcardValue(entity, 'fn'),
    email: vcardValue(entity, 'email'),
    phone: tel?.replace(/^tel:/i, ''),
    organization: vcardValue(entity, 'org'),
  };
}

/** Flatten top-level entities and their nested entities (e.g. registrar → abuse). */
export function flattenEntities(entities: RdapEntity[] = []): RdapEntity[] {
  return entities.flatMap((e) => [e, ...flattenEntities(e.entities)]);
}

export function findEntityByRole(
  entities: RdapEntity[] | undefined,
  role: string,
): RdapEntity | undefined {
  return flattenEntities(entities).find((e) => e.roles?.includes(role));
}

/** Best display name for the holder of a resource: registrant first, then any entity. */
export function holderName(
  entities: RdapEntity[] | undefined,
): string | undefined {
  const preferred = ['registrant', 'administrative', 'abuse', 'technical'];
  const all = flattenEntities(entities);
  const ordered = [
    ...preferred.flatMap((r) => all.filter((e) => e.roles?.includes(r))),
    ...all,
  ];
  for (const e of ordered) {
    const name = vcardValue(e, 'org') ?? vcardValue(e, 'fn');
    if (name) return name;
  }
  return undefined;
}

export function eventDate(
  events: RdapEvent[] | undefined,
  ...actions: string[]
): string | undefined {
  for (const action of actions) {
    const event = events?.find((e) => e.eventAction === action);
    if (event) {
      const date = new Date(event.eventDate);
      if (!Number.isNaN(date.getTime())) return date.toUTCString();
    }
  }
  return undefined;
}

export function joinUrl(base: string, path: string): string {
  return `${base.endsWith('/') ? base : `${base}/`}${path}`;
}

/** IANA lists http and https endpoints for some registries; prefer https. */
export function pickServer(urls: string[]): string | undefined {
  return urls.find((u) => u.startsWith('https://')) ?? urls[0];
}

/** Fetch an RDAP JSON document with a timeout and normalized errors. */
export async function fetchRdapJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/rdap+json, application/json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(RDAP_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new RdapError('The RDAP server took too long to respond.', 504);
    }
    throw new RdapError('Could not reach the RDAP server.', 502);
  }

  if (!response.ok) {
    let message =
      response.status === 404
        ? 'No registration record was found.'
        : `The RDAP server returned HTTP ${response.status}.`;
    try {
      const body = await response.json();
      const detail =
        (Array.isArray(body.description)
          ? body.description.join(' ')
          : body.description) || body.title;
      if (typeof detail === 'string' && detail.trim()) message = detail;
    } catch {
      // keep default message
    }
    // Upstream 5xx are a gateway problem from our point of view.
    const status = response.status >= 500 ? 502 : response.status;
    throw new RdapError(message, status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new RdapError('The RDAP server returned invalid JSON.', 502);
  }
}
