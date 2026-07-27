'use client';

import { InstructorLmsDashboard } from '@/components/lms/InstructorLmsDashboard';
import { LmsGate } from '@/components/lms/LmsGate';

export default function InstructorSchedulePage() {
  return <LmsGate allowed={['instructor', 'admin']} redirectTo="/lms/instructor/schedule"><InstructorLmsDashboard view="schedule" /></LmsGate>;
}
