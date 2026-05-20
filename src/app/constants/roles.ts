/**
 * User Roles & Permissions
 */

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  BASIC: 'BASIC'
} as const;

export type ModerationQueueScope = 'MINE' | 'UNASSIGNED' | 'ALL';

