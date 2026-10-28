export interface ApiError {
  error: string;
  code?: string | null;
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;
  if (!response.ok) {
    const error = new Error((payload as ApiError)?.error ?? `Pedido falhou (${response.status})`) as Error & {
      code?: string | null;
      status?: number;
    };
    error.code = (payload as ApiError)?.code ?? null;
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

export function postJson<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export function patchJson<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}
