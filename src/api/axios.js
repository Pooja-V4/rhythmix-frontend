import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
});

export default API;

export const getUsers = () => API.get('/users');
export const createUser = (data) => API.post('/users', data);
export const getSongs = () => API.get('/songs');
export const createSong = (data) => API.post('/songs', data);
export const getUserPlaylists = (userId) => API.get(`/playlists/user/${userId}`);
export const createPlaylist = (userId, data) => API.post(`/playlists/${userId}`, data);
export const addSongToPlaylist = (playlistId, songId) => API.post(`/playlists/${playlistId}/songs/${songId}`);
export const removeSongFromPlaylist = (playlistId, songId) => API.delete(`/playlists/${playlistId}/songs/${songId}`);
export const getFavorites = (userId) => API.get(`/favorites/${userId}`);
export const addFavorite = (userId, songId) => API.post(`/favorites/${userId}/songs/${songId}`);
export const removeFavorite = (userId, songId) => API.delete(`/favorites/${userId}/songs/${songId}`);