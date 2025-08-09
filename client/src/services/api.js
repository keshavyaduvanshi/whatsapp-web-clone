// client/src/services/api.js
import axios from 'axios';
import { io } from 'socket.io-client';

export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000').replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const fetchConversations = () => api.get('/conversations').then(r => r.data);
export const fetchConversationMessages = (wa_id) => api.get(`/conversations/${encodeURIComponent(wa_id)}`).then(r => r.data);
export const sendMessage = (payload) => api.post('/messages', payload).then(r => r.data);
export const updateMessageStatus = (id, status) => api.patch(`/messages/${id}/status`, { status }).then(r => r.data);

let socket = null;
export const initSocket = () => {
  if (socket) return socket;
  try {
    socket = io(API_BASE, { autoConnect: true });
    socket.on('connect', () => console.log('Socket connected', socket.id));
    socket.on('connect_error', (err) => console.warn('Socket connect error', err.message));
  } catch (e) {
    console.warn('Socket init failed', e);
    socket = null;
  }
  return socket;
};
export const getSocket = () => socket;
