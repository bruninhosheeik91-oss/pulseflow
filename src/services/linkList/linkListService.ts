import { LinkList } from '../../types/linkList';
import { getCurrentTenantId } from '../affiliatePrograms/affiliateProgramsService';

const DEFAULT_BASE_URL = 'http://localhost:3001';

function getBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_WPP_BACKEND_URL as string | undefined;
  return (fromEnv && fromEnv.trim()) || DEFAULT_BASE_URL;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const tenantId = getCurrentTenantId();
  if (!tenantId) throw new Error('Tenant de desenvolvimento não configurado.');
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
      ...(init?.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((body && body.error) || `Erro ${response.status} ao comunicar com o servidor.`);
  }
  return body as T;
}

export async function listLinkLists(): Promise<LinkList[]> {
  const result = await apiFetch<{ lists: LinkList[] }>('/api/affiliate/link-lists');
  return result.lists || [];
}

export async function createLinkList(payload: Omit<LinkList, 'id' | 'createdAt' | 'links' | 'automationSource'>): Promise<LinkList> {
  const result = await apiFetch<{ list: LinkList }>('/api/affiliate/link-lists', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result.list;
}

export async function deleteLinkList(id: string): Promise<void> {
  await apiFetch(`/api/affiliate/link-lists/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function addLinksToList(id: string, urls: string[]): Promise<LinkList> {
  const result = await apiFetch<{ list: LinkList }>(
    `/api/affiliate/link-lists/${encodeURIComponent(id)}/links`,
    { method: 'POST', body: JSON.stringify({ urls }) }
  );
  return result.list;
}

export async function removeLinkFromList(listId: string, linkId: string): Promise<LinkList> {
  const result = await apiFetch<{ list: LinkList }>(
    `/api/affiliate/link-lists/${encodeURIComponent(listId)}/links/${encodeURIComponent(linkId)}`,
    { method: 'DELETE' }
  );
  return result.list;
}

export async function processLinkList(id: string): Promise<LinkList> {
  const result = await apiFetch<{ list: LinkList }>(
    `/api/affiliate/link-lists/${encodeURIComponent(id)}/process`,
    { method: 'POST', body: JSON.stringify({}) }
  );
  return result.list;
}
