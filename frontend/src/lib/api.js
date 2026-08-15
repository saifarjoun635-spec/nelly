import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ng_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const publicApi = {
  getContent: () => api.get("/content").then((r) => r.data),
  getServices: () => api.get("/services").then((r) => r.data),
  getHours: () => api.get("/hours").then((r) => r.data),
  getAvailability: (date) => api.get(`/availability?date=${date}`).then((r) => r.data),
  createAppointment: (payload) => api.post("/appointments", payload).then((r) => r.data),
};

export const adminApi = {
  login: (email, password) => api.post("/admin/login", { email, password }).then((r) => r.data),
  me: () => api.get("/admin/me").then((r) => r.data),
  listAppointments: () => api.get("/admin/appointments").then((r) => r.data),
  updateAppointment: (id, status) => api.patch(`/admin/appointments/${id}`, { status }).then((r) => r.data),
  deleteAppointment: (id) => api.delete(`/admin/appointments/${id}`).then((r) => r.data),
  updateContent: (data) => api.put("/admin/content", { data }).then((r) => r.data),
  updateServices: (categories) => api.put("/admin/services", { categories }).then((r) => r.data),
  getHours: () => api.get("/hours").then((r) => r.data),
  updateHours: (hours) => api.put("/admin/hours", { hours }).then((r) => r.data),
  getBlocked: () => api.get("/admin/blocked-dates").then((r) => r.data),
  updateBlocked: (dates) => api.put("/admin/blocked-dates", { dates }).then((r) => r.data),
};
