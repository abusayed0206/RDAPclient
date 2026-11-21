import { errorResponse, lookupResponse } from '@/lib/api';
import { lookupIP } from '@/lib/ip-rdap';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const startedAt = performance.now();
  try {
    return lookupResponse(
      await lookupIP(decodeURIComponent(address)),
      startedAt,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
