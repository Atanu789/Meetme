import { InfoPage } from '../info-pages';

export default function RoadmapPage() {
  return (
    <InfoPage
      eyebrow="Roadmap"
      title="Roadmap."
      description="Coming Soon. This page previews planned Melanam capabilities while the public roadmap is being prepared."
      sections={[
        {
          title: 'Planned Features',
          body: 'The roadmap currently includes the following product areas.',
          items: ['AI Meeting Assistant', 'API Platform', 'Enterprise Billing', 'Calendar Integrations', 'Team Workspaces', 'Mobile Applications', 'Advanced Analytics', 'AI Agents'],
        },
        { title: 'Coming Soon', body: 'Detailed release windows, voting, and public changelog links will be added in future versions.' },
      ]}
    />
  );
}
