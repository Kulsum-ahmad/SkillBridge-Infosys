// src/components/api.js
import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor to send token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("sb_token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - only show toast, don't redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      // Just show a warning but do not redirect immediately
      toast.error("Session expired or unauthorized. Please log in again.");
    }
    return Promise.reject(error);
  }
);

export default api;
