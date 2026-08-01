import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  FileText,
  ShieldCheck,
  Sparkles,
  Video,
  Wand2,
} from 'lucide-react';
import { Footer } from '@/components/ui/footer';

const capabilities = [
  { icon: Video, title: 'Meeting rooms', description: 'Private video rooms with invite links, recording, livestream and captions.' },
  { icon: BookOpen, title: 'Learning workspaces', description: 'Role-aware course, session, assignment and resource workflows.' },
  { icon: Brain, title: 'AI meeting memory', description: 'Transcripts, summaries, decisions and action items after every session.' },
  { icon: FileText, title: 'Shared resources', description: 'Meeting files and course resources stay connected to the work.' },
  { icon: Wand2, title: 'Whiteboards and polls', description: 'Collaborate live without leaving the room context.' },
  { icon: BarChart3, title: 'Participation history', description: 'Review engagement and recording context when the session ends.' },
];

const workflow = [
  ['01', 'Create', 'Start a room, class session or course workflow.'],
  ['02', 'Collaborate', 'Meet with captions, files, polls and whiteboard tools.'],
  ['03', 'Capture', 'Keep the recording, transcript and AI outputs together.'],
  ['04', 'Continue', 'Return to the course, session or follow-up work.'],
];

function WorkspacePreview() {
  return (
    <div className="noir-workspace">
      <div className="noir-workspace__chrome">
        <div className="flex gap-1.5"><span /><span /><span /></div>
        <div className="noir-workspace__record"><i /> Live seminar · 43:18</div>
      </div>
      <div className="noir-workspace__body">
        <div className="noir-workspace__tiles">
          {['Lead instructor', 'Student 01', 'Student 02', 'Shared whiteboard'].map((label, index) => (
            <div className={`noir-tile noir-tile--${index}`} key={label}>
              {index === 3 ? <div className="noir-board"><b /><b /><em /><b /></div> : <span className="noir-tile__avatar" />}
              <small>{label}</small>
            </div>
          ))}
        </div>
        <aside className="noir-workspace__side">
          <p>Meeting intelligence</p>
          <div><strong>Live summary</strong><span>Key decisions and resources are being captured automatically.</span></div>
          <div><strong>Shared resources</strong><span>03 files attached to this session</span></div>
          <div><strong>Next action</strong><span>Review the lesson outline</span></div>
        </aside>
      </div>
      <div className="noir-workspace__controls"><span /><span /><span /><b>End session</b></div>
    </div>
  );
}

function FeatureRail() {
  const topCards = [...capabilities, ...capabilities];
  const bottomCards = [...capabilities.slice(3), ...capabilities.slice(0, 3), ...capabilities.slice(3), ...capabilities.slice(0, 3)];
  const renderRail = (cards: typeof capabilities, reverse = false) => (
    <div className={`noir-marquee ${reverse ? 'noir-marquee--reverse' : ''}`} aria-label={reverse ? undefined : 'Melanam capabilities'}>
      <div className="noir-marquee__track">
        {cards.map(({ icon: Icon, title, description }, index) => (
          <article className="noir-feature-card" key={`${reverse ? 'bottom' : 'top'}-${title}-${index}`} aria-hidden={index >= capabilities.length}>
            <Icon />
            <div><h3>{title}</h3><p>{description}</p></div>
            <ArrowRight className="noir-feature-card__arrow" />
          </article>
        ))}
      </div>
    </div>
  );
  return (
    <section id="features" className="noir-features">
      <div className="page-shell-wide noir-section-heading">
        <p>Connected by design</p>
        <h2>Everything that happens live stays in context.</h2>
      </div>
      <div className="noir-marquee-stack">{renderRail(topCards)}{renderRail(bottomCards, true)}</div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="landing-noir">
      <section className="noir-hero">
        <div className="noir-hero__stars" aria-hidden="true" />
        <div className="page-shell-wide noir-hero__inner">
          <div className="noir-hero__copy">
            <p className="noir-live"><span /><span>Melanam workspace is live</span><ArrowRight /></p>
            <h1>Meet. Teach.<br /><span>Remember.</span></h1>
            <p className="noir-hero__description">A secure operating environment for live meetings, learning workflows, and the intelligence that moves work forward.</p>
            <div className="noir-hero__actions">
              <Link href="/sign-up" className="noir-primary-action noir-shimmer-button"><span>Enter Melanam</span> <ArrowRight /></Link>
              <Link href="/lms" className="noir-secondary-action">Explore workspace</Link>
            </div>
            <div className="noir-proof">
              <span><b>01</b> One record for every session</span>
              <span><b>AI</b> Context built in</span>
              <span><b>∞</b> Work continues after the call</span>
            </div>
          </div>
          <WorkspacePreview />
        </div>
      </section>

      <section className="noir-partner-strip"><span>Built for the entire session lifecycle</span><b>MEETINGS</b><b>LEARNING</b><b>AI MEMORY</b><b>RESOURCES</b><b>FOLLOW-UP</b></section>
      <FeatureRail />

      <section className="page-shell-wide noir-workflow">
        <div className="noir-workflow__intro"><p>From signal to memory</p><h2>Live work deserves a lasting record.</h2><span>Melanam keeps your rooms, lessons, decisions, and follow-up work inside one intentional system.</span></div>
        <ol>
          {workflow.map(([number, title, description]) => <li key={title}><b>{number}</b><div><h3>{title}</h3><p>{description}</p></div><ArrowRight /></li>)}
        </ol>
      </section>

      <section className="page-shell-wide noir-final">
        <Sparkles />
        <p>Private by design. Intelligent by default.</p>
        <h2>Make every conversation count.</h2>
        <Link href="/sign-up" className="noir-primary-action noir-shimmer-button"><span>Get started free</span> <ArrowRight /></Link>
        <span><ShieldCheck /> Secure rooms · controlled workspaces · role-aware access</span>
      </section>
      <Footer />
    </div>
  );
}
