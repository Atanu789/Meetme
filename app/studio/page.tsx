'use client';

import { LmsGate } from '@/components/lms/LmsGate';
import { LearningStudio } from '@/components/studio/LearningStudio';

export default function StudioPage() {
  return (
    <LmsGate allowed={['student', 'instructor', 'admin']} redirectTo="/studio">
      <LearningStudio />
    </LmsGate>
  );
}
