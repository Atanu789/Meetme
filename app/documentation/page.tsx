import { InfoPage } from '../info-pages';

export default function DocumentationPage() {
  return (
    <InfoPage
      eyebrow="Documentation"
      title="Guides for running meetings and learning workflows."
      description="Documentation for creating rooms, running live sessions, managing LMS content, and using AI meeting outputs."
      sections={[
        { title: 'Getting started', body: 'Create a workspace account, open the LMS dashboard, and start a meeting or class session from the main workspace.' },
        { title: 'Live meetings', body: 'Use invite links, captions, files, whiteboards, recordings, polls, feedback, and livestream controls inside meeting rooms.' },
        { title: 'LMS operations', body: 'Instructors can organize courses, sessions, assignments, resources, recordings, and student activity in one place.' },
        { title: 'Administration', body: 'Admins can manage users, organizations, subscriptions, meetings, and platform activity from the system console.' },
      ]}
    />
  );
}
