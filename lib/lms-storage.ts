import { nanoid } from 'nanoid';

export const LMS_STORAGE_BUCKET = 'meeting-files';

export function sanitizeStorageSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function getLmsStorageRoot(scopeType: 'meeting' | 'course', scopeId: string) {
  if (scopeType === 'course') {
    return `courses/${scopeId}`;
  }

  return scopeId;
}

export function buildLmsStoragePath(scopeType: 'meeting' | 'course', scopeId: string, fileName: string) {
  const safeName = sanitizeStorageSegment(fileName);
  return `${getLmsStorageRoot(scopeType, scopeId)}/${Date.now()}_${nanoid(6)}_${safeName}`;
}
