import axios from 'axios'

// Support for separate backend hosting (Pterodactyl, etc.)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Export WebSocket URL for terminal component
export const getWebSocketURL = (path) => `${WS_BASE_URL}/${path}`

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - unauthorized
    if (error.response?.status === 401) {
      // Don't redirect if already on login/register
      const isAuthPage = window.location.pathname.includes('/login') || 
                         window.location.pathname.includes('/register')
      
      if (!isAuthPage) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// VPS API
export const vpsApi = {
  getAll: () => api.get('/vps'),
  getById: (id) => api.get(`/vps/${id}`),
  create: (data) => api.post('/vps', data),
  start: (id) => api.post(`/vps/${id}/start`),
  stop: (id) => api.post(`/vps/${id}/stop`),
  reboot: (id) => api.post(`/vps/${id}/reboot`),
  suspend: (id) => api.post(`/vps/${id}/suspend`),
  unsuspend: (id) => api.post(`/vps/${id}/unsuspend`),
  assign: (id, userId) => api.put(`/vps/${id}/assign`, { user_id: userId }),
  setExpiry: (id, date) => api.put(`/vps/${id}/expiry`, { expiry_date: date }),
  setOverride: (id, override) => api.put(`/vps/${id}/override`, { override_suspension: override }),
  delete: (id) => api.delete(`/vps/${id}`)
}

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getVPS: (id) => api.get(`/users/${id}/vps`),
  delete: (id) => api.delete(`/users/${id}`)
}

// Branding API
export const brandingApi = {
  get: () => api.get('/branding'),
  update: (data) => api.put('/branding', data)
}

export default api
