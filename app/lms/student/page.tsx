'use client';

import { LmsGate } from '@/components/lms/LmsGate';
import { StudentLmsDashboard } from '@/components/lms/StudentLmsDashboard';

export default function StudentLmsPage() {
  return (
    <LmsGate allowed={['student', 'instructor', 'admin']} redirectTo="/lms/student">
      <StudentLmsDashboard />
    </LmsGate>
  );
}
