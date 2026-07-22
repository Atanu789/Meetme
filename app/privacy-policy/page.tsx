import { InfoPage } from '../info-pages';

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      eyebrow="Privacy policy"
      title="How Melanam handles meeting and workspace data."
      description="This page summarizes the intended privacy posture for accounts, live meetings, LMS content, recordings, and AI-generated outputs."
      sections={[
        { title: 'Account data', body: 'Melanam uses account information to authenticate users, route them to the right workspace, and support role-based LMS access.' },
        { title: 'Meeting data', body: 'Meeting content can include room metadata, chat, files, whiteboards, captions, recordings, polls, feedback, and analytics.' },
        { title: 'AI outputs', body: 'Transcripts, summaries, action items, decisions, and follow-up tasks are generated to help users review and continue meeting work.' },
        { title: 'User control', body: 'Workspace and system administrators should define retention, export, and deletion policies before broad production rollout.' },
      ]}
    />
  );
}
