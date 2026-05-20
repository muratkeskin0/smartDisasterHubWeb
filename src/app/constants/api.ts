/**
 * API Endpoints Constants
 */

export const API_BASE_URL = 'http://localhost:8082';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ACTIVATE: '/api/auth/activate',
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
    MAP: '/api/reddit-posts/map',
    REFRESH: '/api/reddit-posts/jobs/refresh',
    FETCH_JOB: '/api/reddit-posts/jobs/fetch',
    ANALYZE_JOB: '/api/reddit-posts/jobs/analyze',
    REPORTS_SUMMARY: '/api/reddit-posts/reports/summary',
    REPORTS_TREND: '/api/reddit-posts/reports/trend',
    REPORTS_TOP_ADJUSTED: '/api/reddit-posts/reports/top-adjusted',
    REPORTS_BREAKDOWN: '/api/reddit-posts/reports/breakdown',
    MODERATION_PENDING: '/api/reddit-posts/moderation/pending',
    MODERATION_APPROVE: '/api/reddit-posts/moderation',
    MODERATION_REJECT: '/api/reddit-posts/moderation'
  },
  ABOUT: {
    GET: '/api/about',
    UPDATE: '/api/about',
    CREATE: '/api/about'
  },
  /** Aggregated authors; backend path may stay reddit-* until multi-source API ships */
  AUTHORS: {
    LIST: '/api/reddit-authors',
    INSIGHTS: '/api/reddit-authors/insights'
  }
} as const;

export const API_TIMEOUT = 10000; // 10 seconds

