'use client';

import { LmsGate } from '@/components/lms/LmsGate';
import { StudentLmsDashboard } from '@/components/lms/StudentLmsDashboard';

export default function StudentClassesPage() {
  return <LmsGate allowed={['student', 'instructor', 'admin']} redirectTo="/lms/student/classes"><StudentLmsDashboard view="classes" /></LmsGate>;
}
