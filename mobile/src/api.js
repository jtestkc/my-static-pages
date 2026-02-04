import axios from 'axios';
import io from 'socket.io-client';

// IMPORTANT: Replace with your computer's local network IP
// e.g. 192.168.1.5
// Do not use localhost for physical Android devices!
export const API_URL = 'http://192.168.1.X:3001';

export const api = axios.create({
    baseURL: API_URL + '/api'
});

export const socket = io(API_URL);
