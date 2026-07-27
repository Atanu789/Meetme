'use client';

import { LmsGate } from '@/components/lms/LmsGate';
import { StudentLmsDashboard } from '@/components/lms/StudentLmsDashboard';

export default function StudentNotesPage() {
  return <LmsGate allowed={['student', 'instructor', 'admin']} redirectTo="/lms/student/notes"><StudentLmsDashboard view="notes" /></LmsGate>;
}
