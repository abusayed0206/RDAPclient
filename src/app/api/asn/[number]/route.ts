import { errorResponse, lookupResponse } from '@/lib/api';
import { lookupASN } from '@/lib/asn-rdap';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const { number } = await params;
  const startedAt = performance.now();
  try {
    return lookupResponse(
      await lookupASN(decodeURIComponent(number)),
      startedAt,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
