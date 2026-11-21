import { NextResponse } from 'next/server';

import { errorMessage, errorStage, errorStatus } from './rdap-common';

/** Successful lookups are cached at the edge; registration data changes slowly. */
export function lookupResponse(data: object, startedAt: number) {
  // fetchedAt / queryMs describe the server's own lookup (bootstrap + registry).
  // Both survive edge caching, so clients can tell a live answer from a cached one.
  return NextResponse.json(
    {
      ...data,
      fetchedAt: new Date().toISOString(),
      queryMs: Math.round(performance.now() - startedAt),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}

export function errorResponse(error: unknown) {
  const status = errorStatus(error);
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  return NextResponse.json(
    { error: errorMessage(error), stage: errorStage(error) },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}
