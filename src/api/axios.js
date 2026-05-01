import axios from 'axios';
import { getToken, clearUserId } from '../lib/auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const API = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — token expired or invalid
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — log out automatically
      clearUserId();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;

export const loginUser = (data) =>
  axios.post(`${BASE_URL}/auth/login`, data);
export const registerUser = (data) =>
  axios.post(`${BASE_URL}/auth/register`, data);
export const googleAuth = (token) =>
  axios.post(`${BASE_URL}/auth/google`, { token });
export const forgotPassword = (email) =>
  axios.post(`${BASE_URL}/auth/forgot-password`, { email });
export const resetPassword = (token, newPassword) =>
  axios.post(`${BASE_URL}/auth/reset-password`, { token, newPassword });

export const getUsers = () => API.get('/users');
export const getSongs = () => API.get('/songs');
export const createSong = (data) => API.post('/songs', data);
export const getUserPlaylists = (userId) => API.get(`/playlists/user/${userId}`);
export const createPlaylist = (userId, data) => API.post(`/playlists/${userId}`, data);
export const addSongToPlaylist = (playlistId, songId) =>
  API.post(`/playlists/${playlistId}/songs/${songId}`);
export const removeSongFromPlaylist = (playlistId, songId) =>
  API.delete(`/playlists/${playlistId}/songs/${songId}`);
export const getFavorites = (userId) => API.get(`/favorites/${userId}`);
export const addFavorite = (userId, songId) =>
  API.post(`/favorites/${userId}/songs/${songId}`);
export const removeFavorite = (userId, songId) =>
  API.delete(`/favorites/${userId}/songs/${songId}`);
export const getProfile = (userId) => API.get(`/users/${userId}/profile`);
export const updateProfile = (userId, data) =>
  API.put(`/users/${userId}/profile`, data);
export const changePassword = (userId, data) =>
  API.put(`/users/${userId}/password`, data);
export const deleteAccount = (userId) => API.delete(`/users/${userId}`);