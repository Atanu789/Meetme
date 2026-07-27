'use client';

import { InstructorLmsDashboard } from '@/components/lms/InstructorLmsDashboard';
import { LmsGate } from '@/components/lms/LmsGate';

export default function InstructorNotesPage() {
  return <LmsGate allowed={['instructor', 'admin']} redirectTo="/lms/instructor/notes"><InstructorLmsDashboard view="notes" /></LmsGate>;
}
