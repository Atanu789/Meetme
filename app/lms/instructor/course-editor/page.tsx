'use client';

import { InstructorLmsDashboard } from '@/components/lms/InstructorLmsDashboard';
import { LmsGate } from '@/components/lms/LmsGate';

export default function InstructorCourseEditorPage() {
  return <LmsGate allowed={['instructor', 'admin']} redirectTo="/lms/instructor/course-editor"><InstructorLmsDashboard view="course-editor" /></LmsGate>;
}
