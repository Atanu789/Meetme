import { InfoPage } from '../info-pages';

export default function StatusPage() {
  return (
    <InfoPage
      eyebrow="Status"
      title="Current platform status."
      description="A simple status page for the core Melanam surfaces while a dedicated public status system is being prepared."
      sections={[
        { title: 'Meetings', body: 'Meeting rooms, invite links, captions, recordings, files, whiteboards, polls, and livestream controls are the core live-session surfaces.' },
        { title: 'LMS', body: 'Student, instructor, and admin dashboards support course sessions, assignments, resources, and recordings.' },
        { title: 'Billing', body: 'Pricing, subscriptions, Razorpay orders, verification, and extra credits are available through the membership flow.' },
        { title: 'Support', body: 'For urgent deployment issues, use the project deployment and troubleshooting guides until a hosted incident page is connected.' },
      ]}
    />
  );
}
