import { InfoPage } from '../info-pages';

export default function RoadmapPage() {
  return (
    <InfoPage
      eyebrow="Roadmap"
      title="What Melanam is building next."
      description="A practical view of upcoming improvements across meetings, LMS workflows, AI notes, and administration."
      sections={[
        { title: 'Near term', body: 'Better room creation, cleaner post-meeting summaries, and smoother instructor workflows are the current product focus.' },
        { title: 'Platform', body: 'Subscription management, team administration, and reporting will continue to mature around the existing pricing and LMS foundations.' },
        { title: 'Learning tools', body: 'Assignments, resources, recordings, polls, and analytics will become more connected across each course session.' },
        { title: 'Integrations', body: 'The product is being prepared for external documentation, support channels, and operational status visibility.' },
      ]}
    />
  );
}
