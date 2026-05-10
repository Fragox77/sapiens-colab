/**
 * Cliente HTTP server-side hacia whatsapp-brief-api.
 * Solo se usa desde route handlers (app/api/**) para que la API key
 * nunca viaje al navegador.
 */

// =================== Tipos ===================

export type BriefStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'CONVERTED' | 'REJECTED';
export type Urgency = 'ALTA' | 'MEDIA' | 'BAJA';
export type ConversationStatus = 'OPEN' | 'CLOSED';
export type Direction = 'INBOUND' | 'OUTBOUND';
export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'AUDIO'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'LOCATION'
  | 'CONTACTS'
  | 'STICKER'
  | 'INTERACTIVE'
  | 'REACTION'
  | 'UNKNOWN';

export interface ClientLite {
  id: string;
  waId: string;
  name: string | null;
}

export interface ConversationLite {
  id: string;
  status: ConversationStatus;
}

export interface Brief {
  id: string;
  workspaceId: string;
  clientId: string;
  conversationId: string;
  status: BriefStatus;
  urgency: Urgency;
  objective: string | null;
  deliverables: string[];
  references: string[];
  tone: string | null;
  deadline: string | null; // ISO
  pendingQuestions: string[];
  risks: string[];
  nextStep: string | null;
  suggestedReply: string | null;
  modelUsed: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  convertedAt: string | null;
  client: ClientLite;
  conversation: ConversationLite;
}

export interface BriefList {
  items: Brief[];
  total: number;
}

export interface BriefStats {
  receivedToday: number;
  pendingReview: number;
  approvedThisMonth: number;
  urgentUnapproved: number;
}

export interface Message {
  id: string;
  conversationId: string;
  waMessageId: string;
  direction: Direction;
  type: MessageType;
  text: string | null;
  mediaId: string | null;
  mimeType: string | null;
  transcript: string | null;
  receivedAt: string;
}

export interface Conversation extends ConversationLite {
  startedAt: string;
  closedAt: string | null;
  messages: Message[];
  briefs: Brief[];
}

export interface ClientWithConversations {
  id: string;
  waId: string;
  name: string | null;
  phone: string | null;
  conversations: Conversation[];
}

// =================== Configuración ===================

function getConfig() {
  const baseUrl = process.env.BRIEFS_API_URL;
  const apiKey = process.env.BRIEFS_API_KEY;
  if (!baseUrl) throw new Error('BRIEFS_API_URL no configurado');
  if (!apiKey) throw new Error('BRIEFS_API_KEY no configurado');
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey };
}

// =================== Wrapper de fetch ===================

interface FetchOptions extends Omit<RequestInit, 'headers' | 'body'> {
  searchParams?: URLSearchParams | Record<string, string | number | undefined>;
  body?: unknown;
}

export async function briefsFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const { searchParams, body, ...rest } = opts;

  let qs = '';
  if (searchParams) {
    const params =
      searchParams instanceof URLSearchParams
        ? searchParams
        : new URLSearchParams(
            Object.entries(searchParams)
              .filter(([, v]) => v !== undefined && v !== '')
              .map(([k, v]) => [k, String(v)]),
          );
    const s = params.toString();
    if (s) qs = `?${s}`;
  }

  const res = await fetch(`${baseUrl}${path}${qs}`, {
    ...rest,
    headers: {
      'x-api-key': apiKey,
      'content-type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: 'upstream_error', message: text };
    }
    const err = new Error(`briefs-api ${res.status}`) as Error & {
      status: number;
      payload: unknown;
    };
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return res.json() as Promise<T>;
}

// =================== Helpers tipados ===================

export interface ListBriefsParams {
  status?: BriefStatus | 'TODOS';
  urgency?: Urgency | 'TODAS';
  limit?: number;
  offset?: number;
  [key: string]: string | number | undefined;
}

export function listBriefs(params: ListBriefsParams = {}) {
  return briefsFetch<BriefList>('/api/briefs', { searchParams: params });
}

export function getStats() {
  return briefsFetch<BriefStats>('/api/briefs/stats');
}

export function patchBriefStatus(id: string, status: BriefStatus) {
  return briefsFetch<Brief>(`/api/briefs/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { status },
  });
}

export function getClientConversations(waId: string) {
  return briefsFetch<ClientWithConversations>(
    `/api/clients/${encodeURIComponent(waId)}/conversations`,
  );
}
