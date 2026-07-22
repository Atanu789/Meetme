import { InfoPage } from '../info-pages';

export default function SecurityPage() {
  return (
    <InfoPage
      eyebrow="Security"
      title="Security practices for private learning and meeting spaces."
      description="Melanam is designed around role-based access, authenticated dashboards, private meeting context, and controlled administrative workflows."
      sections={[
        { title: 'Access control', body: 'User, instructor, and admin experiences are separated so each role sees the workflows and records intended for them.' },
        { title: 'Meeting privacy', body: 'Rooms, files, whiteboards, recordings, and AI outputs are tied to meeting and workspace context instead of loose public pages.' },
        { title: 'Billing safety', body: 'Paid plan changes are handled through verified checkout and subscription APIs, with downgrade rules enforced by membership status.' },
        { title: 'Operational hygiene', body: 'Security documentation and deployment checklists live with the project and should be reviewed before production release.' },
      ]}
    />
  );
}
