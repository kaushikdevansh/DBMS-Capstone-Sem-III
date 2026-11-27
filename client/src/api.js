const TOKEN_KEY = "token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

const request = async (method, url, body) => {
  const headers = {};
  const token = getToken();
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const API_URL = import.meta.env.VITE_API_URL || "";

const response = await fetch(`${API_URL}/api${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && token && url !== "/auth/login") {
    clearToken();
    window.dispatchEvent(new Event("auth:logout"));
  }
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
};

export const api = {
  get: (url) => request("GET", url),
  post: (url, body) => request("POST", url, body || {}),
  put: (url, body) => request("PUT", url, body || {}),
  patch: (url, body) => request("PATCH", url, body || {}),
  del: (url) => request("DELETE", url),
};
