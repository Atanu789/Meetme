'use client';

import { LmsGate } from '@/components/lms/LmsGate';
import { StudentLmsDashboard } from '@/components/lms/StudentLmsDashboard';

export default function StudentAssignmentsPage() {
  return <LmsGate allowed={['student', 'instructor', 'admin']} redirectTo="/lms/student/assignments"><StudentLmsDashboard view="assignments" /></LmsGate>;
}
