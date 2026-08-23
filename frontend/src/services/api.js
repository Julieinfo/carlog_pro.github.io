import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Intercepteur pour injecter automatiquement le token JWT s'il existe dans le localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export des méthodes réutilisables dans toute l'application
export const api = {
  // Authentification
  connexion: (credentials) => API.post('/auth/connexion', credentials),
  inscription: (userData) => API.post('/auth/inscription', userData),

  // Véhicules
  getVehicules: () => API.get('/vehicules'),
  addVehicule: (data) => API.post('/vehicules', data),
  updateVehicule: (id, data) => API.put(`/vehicules/${id}`, data),
  deleteVehicule: (id) => API.delete(`/vehicules/${id}`),

  // Alertes
  getAlertes: () => API.get('/alertes'),
  addAlerte: (data) => API.post('/alertes', data),
  updateAlerte: (id, data) => API.put(`/alertes/${id}`, data),
  deleteAlerte: (id) => API.delete(`/alertes/${id}`),

  // Affectations
  getAffectations: () => API.get('/affectations'),
  addAffectation: (data) => API.post('/affectations', data),

  // Statistiques
  getStats: () => API.get('/stats'),
};

export default API;