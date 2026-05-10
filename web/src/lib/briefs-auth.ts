import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function requireAdmin(): Promise<NextResponse | null> {
  try {
    const cookieToken = (await cookies()).get('auth_token')?.value;
    const authHeader = (await headers()).get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7) : null;
    const token = cookieToken || headerToken;
    if (!token)
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin')
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    return null;
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}

export function handleUpstreamError(err: unknown): NextResponse {
  if (err && typeof err === 'object' && 'status' in err && 'payload' in err) {
    const e = err as { status: number; payload: unknown };
    return NextResponse.json(e.payload, { status: e.status });
  }
  console.error('[briefs proxy] error inesperado', err);
  return NextResponse.json(
    { error: 'internal_error', message: 'Error inesperado' },
    { status: 500 },
  );
}
