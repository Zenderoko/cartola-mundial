import { useAuth } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function useApi() {
  const { isLoaded, sessionId, userId } = useAuth();

  async function fetchApi(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (userId) {
      headers['X-Clerk-User-Id'] = userId;
    }
    if (sessionId) {
      headers['X-Clerk-Session-Id'] = sessionId;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(401, body.error?.message || 'Token de autenticación requerido');
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  return { fetchApi };
}

export async function publicFetch(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Request failed: ${res.status}`);
  }
  return res.json();
}
