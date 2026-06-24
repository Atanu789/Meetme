'use client';

import { LmsGate } from '@/components/lms/LmsGate';
import { AdminLmsDashboard } from '@/components/lms/AdminLmsDashboard';

export default function AdminLmsPage() {
  return (
    <LmsGate allowed={['admin']} redirectTo="/lms/admin">
      <AdminLmsDashboard />
    </LmsGate>
  );
}
