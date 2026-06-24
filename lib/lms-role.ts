export type LmsRole = 'student' | 'instructor' | 'admin';

export function normalizeLmsRole(value?: string | null): LmsRole {
  const role = (value || '').toLowerCase();

  if (role === 'admin' || role === 'lms_admin') {
    return 'admin';
  }

  if (role === 'instructor' || role === 'enterprise_admin') {
    return 'instructor';
  }

  return 'student';
}

export function canManageLms(role?: string | null) {
  return normalizeLmsRole(role) === 'admin' || normalizeLmsRole(role) === 'instructor';
}

export function canGradeLms(role?: string | null) {
  return canManageLms(role);
}
