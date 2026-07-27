import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  FileText,
  ShieldCheck,
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
    <div className="overflow-hidden rounded-lg border border-[#2a3039] bg-[#12151a]">
      <div className="flex h-12 items-center justify-between border-b border-[#2a3039] px-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#f4f7fa]">
          <span className="h-2 w-2 rounded-full bg-[#49d17d]" />
          Live session
        </div>
        <span className="text-xs text-[#8f9aa8]">43:18</span>
      </div>
      <div className="grid gap-px bg-[#2a3039] sm:grid-cols-[1.4fr_0.8fr]">
        <div className="grid min-h-[320px] grid-cols-2 gap-px bg-[#2a3039]">
          {['Instructor', 'Student 01', 'Student 02', 'Shared whiteboard'].map((label, index) => (
            <div key={label} className={`relative flex items-end bg-[#181c22] p-3 ${index === 3 ? 'bg-[#10161a]' : ''}`}>
              {index === 3 ? (
                <div className="w-full space-y-3 border border-[#2a3039] p-3">
                  <div className="h-2 w-3/4 bg-[#2a3039]" />
                  <div className="h-2 w-1/2 bg-[#2a3039]" />
                  <div className="h-px w-full bg-[#37d7ff]" />
                  <div className="h-2 w-2/3 bg-[#2a3039]" />
                </div>
              ) : (
                <div className={`absolute inset-0 ${index === 0 ? 'bg-[#19242b]' : index === 1 ? 'bg-[#1b2028]' : 'bg-[#202126]'}`} />
              )}
              <span className="relative z-10 border border-[#2a3039] bg-[#0b0d10] px-2 py-1 text-[11px] font-medium text-[#d8e0e7]">{label}</span>
            </div>
          ))}
        </div>
        <aside className="bg-[#12151a] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#37d7ff]">Meeting context</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#f4f7fa]">Live captions</p>
              <p className="mt-1 text-xs leading-5 text-[#8f9aa8]">Design review begins with the learning flow.</p>
            </div>
            <div className="border-t border-[#2a3039] pt-4">
              <p className="text-xs font-semibold text-[#f4f7fa]">Shared files</p>
              <p className="mt-1 text-xs text-[#8f9aa8]">3 resources available</p>
            </div>
            <div className="border-t border-[#2a3039] pt-4">
              <p className="text-xs font-semibold text-[#f4f7fa]">Session notes</p>
              <p className="mt-1 text-xs text-[#8f9aa8]">Summary ready after recording.</p>
            </div>
          </div>
        </aside>
      </div>
      <div className="flex items-center justify-between border-t border-[#2a3039] px-4 py-3">
        <div className="flex gap-2">
          <span className="h-7 w-7 border border-[#2a3039] bg-[#181c22]" />
          <span className="h-7 w-7 border border-[#2a3039] bg-[#181c22]" />
          <span className="h-7 w-7 border border-[#2a3039] bg-[#181c22]" />
        </div>
        <span className="border border-[#ef6b73] px-3 py-1.5 text-xs font-semibold text-[#ef6b73]">End session</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="pb-0 text-[#f4f7fa]">
      <section className="page-shell-wide grid gap-10 pb-14 pt-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:pt-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#37d7ff]">Meeting and learning workspace</p>
          <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Melanam
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-[#a7b1bc]">
            Meetings, learning workflows and AI meeting memory in one controlled workspace.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-md bg-[#37d7ff] px-4 py-2.5 text-sm font-semibold text-[#061014] hover:bg-[#6be3ff]">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/lms" className="inline-flex items-center gap-2 rounded-md border border-[#2a3039] bg-[#181c22] px-4 py-2.5 text-sm font-semibold text-[#f4f7fa] hover:bg-[#20252d]">
              Open workspace
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#2a3039] bg-[#2a3039] sm:grid-cols-4">
            {[
              ['Rooms', 'Video, captions and recording'],
              ['Courses', 'Sessions and assignments'],
              ['Context', 'AI notes and transcripts'],
              ['Work', 'Files, polls and boards'],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#12151a] p-3">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7d8897]">{label}</dt>
                <dd className="mt-2 text-xs leading-5 text-[#d8e0e7]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <WorkspacePreview />
      </section>

      <section id="features" className="border-y border-[#2a3039] bg-[#101216]">
        <div className="page-shell-wide py-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#37d7ff]">Capabilities</p>
            <h2 className="mt-3 font-display text-2xl font-semibold">Everything stays connected to the session.</h2>
          </div>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-[#2a3039] bg-[#2a3039] sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <article key={title} className="bg-[#12151a] p-5">
                <Icon className="h-5 w-5 text-[#37d7ff]" />
                <h3 className="mt-5 text-sm font-semibold text-[#f4f7fa]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#a7b1bc]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell-wide py-14">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#37d7ff]">How it flows</p>
            <h2 className="mt-3 font-display text-2xl font-semibold">One record from live session to follow-up work.</h2>
            <p className="mt-4 text-sm leading-7 text-[#a7b1bc]">Melanam keeps the meeting record, learning activity and related resources in the same place.</p>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-lg border border-[#2a3039] bg-[#2a3039] sm:grid-cols-2">
            {workflow.map(([number, title, description]) => (
              <li key={title} className="bg-[#12151a] p-5">
                <span className="text-xs font-bold text-[#37d7ff]">{number}</span>
                <h3 className="mt-8 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#a7b1bc]">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-[#2a3039] bg-[#101216]">
        <div className="page-shell-wide flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#49d17d]" />
            <div>
              <p className="text-sm font-semibold">Designed for controlled collaboration.</p>
              <p className="mt-1 text-sm text-[#a7b1bc]">Private rooms, protected workspaces and role-aware learning access.</p>
            </div>
          </div>
          <Link href="/pricing" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#37d7ff] hover:text-[#6be3ff]">
            View membership
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
