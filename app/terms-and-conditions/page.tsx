import { InfoPage } from '../info-pages';

export default function TermsAndConditionsPage() {
  return (
    <InfoPage
      eyebrow="Terms and conditions"
      title="Terms for using Melanam."
      description="These starter terms describe acceptable use of the meeting, LMS, billing, and AI features while formal legal terms are finalized."
      sections={[
        { title: 'Use of service', body: 'Users are responsible for using meetings, recordings, shared files, whiteboards, captions, and LMS content lawfully and respectfully.' },
        { title: 'Plans and credits', body: 'Plan limits, included credits, paid upgrades, and extra credit packs are governed by the active pricing and billing configuration.' },
        { title: 'Workspace responsibility', body: 'Organizations and administrators are responsible for member access, course content, meeting records, and internal compliance requirements.' },
        { title: 'Production review', body: 'Replace these starter terms with counsel-approved terms before using Melanam as a public commercial service.' },
      ]}
    />
  );
}
