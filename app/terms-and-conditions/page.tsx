import { InfoPage } from '../info-pages';

export default function TermsAndConditionsPage() {
  return (
    <InfoPage
      eyebrow="Terms and conditions"
      title="Terms of Service."
      description="By using Melanam you agree to these terms."
      sections={[
        {
          title: 'User Responsibilities',
          body: 'Users agree to use the platform lawfully and maintain appropriate account security.',
          items: ['Use the platform lawfully.', 'Respect intellectual property rights.', 'Not misuse, disrupt, or attempt unauthorized access.', 'Maintain the confidentiality of their accounts.'],
        },
        {
          title: 'Account Enforcement',
          body: 'Global Development Networks Ltd reserves the right to suspend accounts involved in abuse, fraud, illegal activities, or violations of these terms.',
        },
        {
          title: 'AI-Generated Content',
          body: 'AI-generated content is provided for informational purposes and should be reviewed before making business decisions.',
        },
        {
          title: 'Legal Review',
          body: 'Before publishing publicly, have these terms reviewed by a qualified legal professional to ensure they comply with the laws and regulations that apply to your business and users.',
        },
      ]}
    />
  );
}
