import { errorResponse, lookupResponse } from '@/lib/api';
import { lookupDomain } from '@/lib/rdap';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ domain: string }> },
) {
  const { domain } = await params;
  const startedAt = performance.now();
  try {
    return lookupResponse(
      await lookupDomain(decodeURIComponent(domain)),
      startedAt,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
