import { NextRequest, NextResponse } from 'next/server';
import {
  listBriefs,
  type BriefStatus,
  type Urgency,
  type ListBriefsParams,
} from '@/lib/briefs-api';
import { requireAdmin, handleUpstreamError } from '@/lib/briefs-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STATUS_VALUES = ['DRAFT', 'PENDING', 'APPROVED', 'CONVERTED', 'REJECTED', 'TODOS'] as const;
const URGENCY_VALUES = ['ALTA', 'MEDIA', 'BAJA', 'TODAS'] as const;

type StatusParam = (typeof STATUS_VALUES)[number];
type UrgencyParam = (typeof URGENCY_VALUES)[number];

function isStatus(v: string | null): v is StatusParam {
  return v != null && (STATUS_VALUES as readonly string[]).includes(v);
}
function isUrgency(v: string | null): v is UrgencyParam {
  return v != null && (URGENCY_VALUES as readonly string[]).includes(v);
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const sp = req.nextUrl.searchParams;
    const params: ListBriefsParams = {};

    const status = sp.get('status');
    if (isStatus(status) && status !== 'TODOS') params.status = status as BriefStatus;

    const urgency = sp.get('urgency');
    if (isUrgency(urgency) && urgency !== 'TODAS') params.urgency = urgency as Urgency;

    const limit = sp.get('limit');
    const offset = sp.get('offset');
    if (limit) params.limit = Math.min(Number(limit) || 50, 200);
    if (offset) params.offset = Math.max(Number(offset) || 0, 0);

    const data = await listBriefs(params);
    return NextResponse.json(data);
  } catch (err) {
    return handleUpstreamError(err);
  }
}
