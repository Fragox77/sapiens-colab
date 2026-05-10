import { NextRequest, NextResponse } from 'next/server';
import { patchBriefStatus, type BriefStatus } from '@/lib/briefs-api';
import { requireAdmin, handleUpstreamError } from '@/lib/briefs-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  try {
    const { status } = (await req.json()) as { status: BriefStatus };
    const data = await patchBriefStatus(id, status);
    return NextResponse.json(data);
  } catch (err) {
    return handleUpstreamError(err);
  }
}
