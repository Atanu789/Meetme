export type StudioSourceKind = 'prompt' | 'youtube' | 'vimeo' | 'loom' | 'google-drive' | 'public-video';

export type StudioSource = {
  kind: StudioSourceKind;
  value: string;
  url?: string;
  providerLabel: string;
};

export type CourseLesson = {
  title: string;
  objective: string;
  durationMinutes: number;
  notes: string;
  exercise: string;
};

export type CourseModule = {
  title: string;
  description: string;
  lessons: CourseLesson[];
};

export type CourseBlueprint = {
  title: string;
  description: string;
  learnerLevel: string;
  estimatedDuration: string;
  learningOutcomes: string[];
  modules: CourseModule[];
  assessment: string;
  instructorNotes: string;
};

export type StudioResult = {
  course: CourseBlueprint;
  markdown: string;
  transcriptPreview?: string;
  source: {
    kind: StudioSourceKind;
    providerLabel: string;
    url?: string;
  };
};

export type StudioProcessRequest = { source: string };
