'use client';

import { InstructorLmsDashboard } from '@/components/lms/InstructorLmsDashboard';
import { LmsGate } from '@/components/lms/LmsGate';

export default function InstructorAssignmentsPage() {
  return <LmsGate allowed={['instructor', 'admin']} redirectTo="/lms/instructor/assignments"><InstructorLmsDashboard view="assignments" /></LmsGate>;
}
