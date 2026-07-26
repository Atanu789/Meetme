import { InfoPage } from '../info-pages';

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      eyebrow="Privacy policy"
      title="Privacy Policy."
      description="Last Updated: January 2036. Melanam respects your privacy and is committed to protecting your personal information."
      sections={[
        {
          title: 'Information We Collect',
          body: 'Melanam collects only the information needed to authenticate users, operate meetings, and provide collaboration features.',
          items: ['Name', 'Email address', 'Authentication information', 'Meeting metadata', 'Uploaded documents', 'Whiteboard data', 'AI-generated meeting summaries', 'Transcription data when enabled'],
        },
        {
          title: 'How We Use Your Information',
          body: 'Collected information is used to run the platform and protect the service.',
          items: ['Authenticate users', 'Provide conferencing services', 'Generate AI-powered summaries', 'Improve platform performance', 'Provide customer support', 'Maintain service security'],
        },
        {
          title: 'Data Security',
          body: 'Melanam implements industry-standard security practices including encrypted communication channels, secure authentication, access controls, and infrastructure protection to safeguard user information.',
        },
        {
          title: 'Third-Party Services',
          body: 'Certain platform features may integrate with trusted third-party providers for authentication, AI processing, cloud storage, or communication services. These providers process data only as necessary to deliver requested functionality.',
        },
        {
          title: 'User Rights',
          body: 'Users may request access, correction, deletion, or removal where applicable.',
          items: ['Access to their information', 'Correction of inaccurate information', 'Deletion of their account', 'Removal of stored meeting data where applicable'],
        },
        {
          title: 'Legal Review',
          body: 'Before publishing publicly, have this policy reviewed by a qualified legal professional to ensure it complies with the laws and regulations that apply to your business and users.',
        },
      ]}
    />
  );
}
