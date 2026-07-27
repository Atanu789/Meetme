'use client';

import { LmsGate } from '@/components/lms/LmsGate';
import { StudentLmsDashboard } from '@/components/lms/StudentLmsDashboard';

export default function StudentRecordingsPage() {
  return <LmsGate allowed={['student', 'instructor', 'admin']} redirectTo="/lms/student/recordings"><StudentLmsDashboard view="recordings" /></LmsGate>;
}
