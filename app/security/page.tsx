import { InfoPage } from '../info-pages';

export default function SecurityPage() {
  return (
    <InfoPage
      eyebrow="Security"
      title="Security."
      description="Melanam is designed using a defense-in-depth security model for secure collaboration environments."
      sections={[
        {
          title: 'Security Measures',
          body: 'Melanam combines transport encryption, media security, authorization, and isolated infrastructure controls.',
          items: ['TLS 1.2/1.3 encrypted communication', 'WebRTC DTLS-SRTP media encryption', 'Secure WebSocket signaling', 'Passwordless Magic Link authentication', 'Role-Based Access Control (RBAC)', 'Self-hosted conferencing infrastructure', 'Docker container isolation', 'Firewall and reverse proxy protection', 'Secure file authorization', 'Browser permission enforcement', 'Isolated AI processing services'],
        },
        {
          title: 'Continuous Improvement',
          body: 'Melanam continuously monitors and improves its security posture to maintain a secure collaboration environment.',
        },
        {
          title: 'Administrative Control',
          body: 'System administrators can manage users, organizations, subscriptions, and meeting records through protected console workflows.',
        },
        {
          title: 'Production Guidance',
          body: 'Security documentation and deployment checklists should be reviewed before production release and revisited as infrastructure changes.',
        },
      ]}
    />
  );
}
