'use client';

import { InstructorLmsDashboard } from '@/components/lms/InstructorLmsDashboard';
import { LmsGate } from '@/components/lms/LmsGate';

export default function InstructorStudentsPage() {
  return <LmsGate allowed={['instructor', 'admin']} redirectTo="/lms/instructor/students"><InstructorLmsDashboard view="students" /></LmsGate>;
}
