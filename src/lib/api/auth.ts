// En dev : requêtes relatives (/api/...) proxifiées vers Django par Vite (évite les soucis CORS).
const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "" : "http://localhost:8000");

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export type AuthUser = {
  id: number;
  email?: string;
  nom: string;
  prenom: string;
  role: string;
  telephone_whatsapp?: string | null;
  is_active?: boolean;
};

export function getApiUrl(path = ""): string {
  return `${API_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(getApiUrl("/api/token/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error("Failed to fetch");
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    const detail = errData?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.join(" ")
          : "Identifiants incorrects.";
    throw new Error(message);
  }

  const data = await response.json();
  localStorage.setItem(AUTH_TOKEN_KEY, data.access);
  if (data.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getAuthToken();
  if (!token) return null;

  const response = await fetch(getApiUrl("/api/users/me/"), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    clearAuthSession();
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible de vérifier la session.");
  }

  return response.json();
}

export async function verifyAuthSession(): Promise<boolean> {
  try {
    const user = await fetchCurrentUser();
    return user !== null;
  } catch {
    return false;
  }
}

export function logout(): void {
  clearAuthSession();
}
