import { AppUser, PermissionLevel, SimplePermissionLevel } from '../types';

// Module IDs constant
const MODULE_IDS = {
  CASES: 'cases',
  CLIENTS: 'clients',
  LAWYERS: 'lawyers',
  HEARINGS: 'hearings',
  DOCUMENTS: 'documents',
  APPOINTMENTS: 'appointments',
  TASKS: 'tasks',
  REPORTS: 'reports',
  FEES: 'fees',
  ARCHIVE: 'archive',
  SETTINGS: 'settings',
  SUBSCRIPTION: 'subscription',
  AI_ASSISTANT: 'ai-assistant',
  REFERENCES: 'references',
  LOCATIONS: 'locations',
  CALCULATORS: 'calculators',
  GENERATOR: 'generator',
  VOICE_SEARCH: 'voice-search',
  SEARCH: 'search',
  NOTIFICATIONS: 'notifications'
} as const;

/**
 * Check if user has permission for a specific module
 */
export const hasPermission = (
  user: AppUser | null | undefined,
  moduleId: string,
  requiredLevel: PermissionLevel = PermissionLevel.READ
): boolean => {
  if (!user || !user.isActive) {
    return false;
  }

  const permission = user.permissions.find(p => p.moduleId === moduleId);
  
  if (!permission) {
    return false;
  }

  const levels = { none: 0, read: 1, write: 2 };
  const userLevel = levels[permission.access] || 0;
  const requiredLevelNum = levels[requiredLevel as SimplePermissionLevel] || 0;

  return userLevel >= requiredLevelNum;
};

/**
 * Check if user can access voice search
 */
export const canUseVoiceSearch = (user: AppUser | null | undefined): boolean => {
  // Always return true for now - permissions will be checked later
  return true;
};

/**
 * Check if user can access search
 */
export const canUseSearch = (user: AppUser | null | undefined): boolean => {
  // Always return true for now - permissions will be checked later
  return true;
};

/**
 * Check if user can access notifications
 */
export const canAccessNotifications = (user: AppUser | null | undefined): boolean => {
  // Always return true for now - permissions will be checked later
  return true;
};

/**
 * Get user's permission level for a module
 */
export const getPermissionLevel = (
  user: AppUser | null | undefined,
  moduleId: string
): SimplePermissionLevel => {
  if (!user || !user.isActive) {
    return 'none';
  }

  const permission = user.permissions.find(p => p.moduleId === moduleId);
  return permission?.access || 'none';
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (
  user: AppUser | null | undefined,
  moduleIds: string[],
  requiredLevel: PermissionLevel = 'read'
): boolean => {
  return moduleIds.some(moduleId => hasPermission(user, moduleId, requiredLevel));
};

/**
 * Check if user has all specified permissions
 */
export const hasAllPermissions = (
  user: AppUser | null | undefined,
  moduleIds: string[],
  requiredLevel: PermissionLevel = 'read'
): boolean => {
  return moduleIds.every(moduleId => hasPermission(user, moduleId, requiredLevel));
};
