'use client';

import { LmsGate } from '@/components/lms/LmsGate';
import { LmsMeetingHome } from '@/components/lms/LmsMeetingHome';

export default function LmsLandingPage() {
  return (
    <LmsGate allowed={['student', 'instructor', 'admin']} redirectTo="/lms">
      <LmsMeetingHome />
    </LmsGate>
  );
}
