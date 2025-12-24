/**
 * API Endpoints Constants
 */

export const API_BASE_URL = 'http://localhost:8082';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY: '/api/auth/verify',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password'
  },
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/update',
    DELETE: '/api/user/delete',
    CHANGE_PASSWORD: '/api/user/change-password'
  },
  REDDIT_POSTS: {
    ANALYZED: '/api/reddit-posts/analyzed',
    DISASTER_RELATED: '/api/reddit-posts/disaster-related',
    STATISTICS: '/api/reddit-posts/statistics',
    BY_ID: '/api/reddit-posts',
    MAP: '/api/reddit-posts/map'
  },
  ABOUT: {
    GET: '/api/about',
    UPDATE: '/api/about',
    CREATE: '/api/about'
  }
} as const;

export const API_TIMEOUT = 10000; // 10 seconds

