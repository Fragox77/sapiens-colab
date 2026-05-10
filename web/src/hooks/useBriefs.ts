'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  Brief,
  BriefList,
  BriefStats,
  BriefStatus,
  Urgency,
} from '@/lib/briefs-api';

function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('sc_token') : null;
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

interface UseBriefsParams {
  status?: BriefStatus | 'TODOS';
  urgency?: Urgency | 'TODAS';
  pollMs?: number;
}

interface UseBriefsResult {
  briefs: Brief[];
  total: number;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setStatus: (id: string, status: BriefStatus) => Promise<void>;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v !== 'TODOS' && v !== 'TODAS') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function useBriefs({ status, urgency, pollMs }: UseBriefsParams = {}): UseBriefsResult {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery({ status, urgency });
      const res = await authFetch(`/api/briefs${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BriefList = await res.json();
      setBriefs(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar briefs');
    } finally {
      setLoading(false);
    }
  }, [status, urgency]);

  useEffect(() => {
    void reload();
    if (!pollMs) return;
    const id = setInterval(reload, pollMs);
    return () => clearInterval(id);
  }, [reload, pollMs]);

  const setStatus = useCallback(
    async (id: string, newStatus: BriefStatus) => {
      const res = await authFetch(`/api/briefs/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await reload();
    },
    [reload],
  );

  return { briefs, total, loading, error, reload, setStatus };
}

// =================== Stats hook ===================

interface UseBriefStatsResult {
  stats: BriefStats | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useBriefStats(pollMs = 60_000): UseBriefStatsResult {
  const [stats, setStats] = useState<BriefStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await authFetch('/api/briefs/stats');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    if (!pollMs) return;
    const id = setInterval(reload, pollMs);
    return () => clearInterval(id);
  }, [reload, pollMs]);

  return { stats, loading, error, reload };
}
