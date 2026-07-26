import { InfoPage } from '../info-pages';

export default function StatusPage() {
  return (
    <InfoPage
      eyebrow="Status"
      title="Current platform status."
      description="All listed systems are currently Operational. This page will provide real-time service status in future versions."
      sections={[
        { title: 'Authentication', body: 'Operational' },
        { title: 'Meetings', body: 'Operational' },
        { title: 'AI Services', body: 'Operational' },
        { title: 'File Uploads', body: 'Operational' },
        { title: 'Whiteboard', body: 'Operational' },
        { title: 'Recording', body: 'Operational' },
        { title: 'Notifications', body: 'Operational' },
        { title: 'Future Status Monitoring', body: 'This page will provide real-time service status in future versions.' },
      ]}
    />
  );
}
