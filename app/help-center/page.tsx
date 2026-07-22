import { InfoPage } from '../info-pages';

export default function HelpCenterPage() {
  return (
    <InfoPage
      eyebrow="Help center"
      title="Help for getting unstuck quickly."
      description="Find the most common entry points for joining meetings, opening the LMS, managing plans, and reviewing saved meeting work."
      sections={[
        { title: 'Join or create a room', body: 'Use Get Started to sign in, then open the LMS dashboard to create a meeting or course-linked session.' },
        { title: 'Find recordings and notes', body: 'Meeting recordings, transcripts, summaries, and AI outputs are connected to meeting history and LMS sessions.' },
        { title: 'Manage membership', body: 'Open the pricing page to activate a free plan, upgrade, compare plan limits, or add extra credits.' },
        { title: 'Admin support', body: 'System administrators can use the admin login and console to review organizations, users, subscriptions, and meetings.' },
      ]}
    />
  );
}
