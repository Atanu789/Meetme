'use client';

import { InstructorLmsDashboard } from '@/components/lms/InstructorLmsDashboard';
import { LmsGate } from '@/components/lms/LmsGate';

export default function InstructorResourcesPage() {
  return <LmsGate allowed={['instructor', 'admin']} redirectTo="/lms/instructor/resources"><InstructorLmsDashboard view="resources" /></LmsGate>;
}
