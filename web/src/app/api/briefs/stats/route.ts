import { NextResponse } from 'next/server';
import { getStats } from '@/lib/briefs-api';
import { requireAdmin, handleUpstreamError } from '@/lib/briefs-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const data = await getStats();
    return NextResponse.json(data);
  } catch (err) {
    return handleUpstreamError(err);
  }
}
