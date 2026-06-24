'use client';

import { LmsGate } from '@/components/lms/LmsGate';
import { InstructorLmsDashboard } from '@/components/lms/InstructorLmsDashboard';

export default function InstructorLmsPage() {
  return (
    <LmsGate allowed={['instructor', 'admin']} redirectTo="/lms/instructor">
      <InstructorLmsDashboard />
    </LmsGate>
  );
}
