const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Wrapper simple autour de fetch.
 * Ajoute automatiquement le token JWT s'il est présent, et lève une erreur
 * lisible en cas de réponse non OK (géré ensuite avec try/catch + useState
 * dans les pages, comme vu en semaine 2).
 */
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || `Erreur ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  inscription: (payload) => request('/auth/inscription', { method: 'POST', body: payload }),
  connexion: (payload) => request('/auth/connexion', { method: 'POST', body: payload }),
  getVehicules: (token) => request('/vehicules', { token }),
  getAlertes: (token) => request('/alertes', { token }),
  getStats: (token) => request('/stats', { token }),
};
