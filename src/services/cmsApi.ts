/**
 * Laravel CMS API client. Failures are silent so the public archive
 * continues to operate from archiveStore when the backend is offline.
 */

import { authService } from './authService';
import { CmsConfig } from '../types/cms';

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  const token = authService.getToken();
  try {
    const res = await fetch(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const cmsApi = {
  getPublicChrome: () => request<{ cms: CmsConfig }>('/api/v1/cms/public'),
  getAdminCms: () => request<{ cms: CmsConfig }>('/api/v1/admin/cms'),
  saveCms: (cms: CmsConfig) =>
    request<{ cms: CmsConfig; message: string }>('/api/v1/admin/cms', {
      method: 'PUT',
      body: JSON.stringify(cms),
    }),
  getAuditLogs: () => request<{ logs: unknown[] }>('/api/v1/admin/audit-logs'),
};
