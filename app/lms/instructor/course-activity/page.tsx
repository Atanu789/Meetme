'use client';

import { InstructorLmsDashboard } from '@/components/lms/InstructorLmsDashboard';
import { LmsGate } from '@/components/lms/LmsGate';

export default function InstructorCourseActivityPage() {
  return <LmsGate allowed={['instructor', 'admin']} redirectTo="/lms/instructor/course-activity"><InstructorLmsDashboard view="activity" /></LmsGate>;
}
