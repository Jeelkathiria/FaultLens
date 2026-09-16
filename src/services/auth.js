import api from './api';
import { auth, googleProvider, signInWithPopup } from './firebase';

export const authService = {
  async register(userData) {
    const data = await api.post('/auth/register', userData);
    if (data.token) {
      api.setToken(data.token);
    }
    return data;
  },

  async login(credentials) {
    const data = await api.post('/auth/login', credentials);
    if (data.token) {
      api.setToken(data.token);
    }
    return data;
  },

  /**
   * Google Sign-up / Login via Firebase OAuth (Developer role only)
   */
  async signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const googleUser = result.user;

    const payload = {
      name: googleUser.displayName || 'Developer',
      email: googleUser.email,
      googleId: googleUser.uid,
      photoURL: googleUser.photoURL,
      role: 'DEVELOPER'
    };

    try {
      // Synchronize with backend to register / retrieve developer session
      const backendRes = await api.post('/auth/google', payload);
      if (backendRes?.token) {
        api.setToken(backendRes.token);
      }
      return {
        user: backendRes?.user || {
          id: googleUser.uid,
          name: googleUser.displayName || 'Developer',
          email: googleUser.email,
          role: 'DEVELOPER',
          photoURL: googleUser.photoURL
        },
        token: backendRes?.token
      };
    } catch (backendErr) {
      console.warn('Backend google sync fallback:', backendErr.message);
      // Offline client fallback for dev
      return {
        user: {
          id: googleUser.uid,
          name: googleUser.displayName || 'Developer',
          email: googleUser.email,
          role: 'DEVELOPER',
          photoURL: googleUser.photoURL
        },
        token: null
      };
    }
  },

  async getMe() {
    return api.get('/auth/me');
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    api.setToken(null);
  }
};
