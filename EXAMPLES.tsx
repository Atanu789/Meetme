/**
 * Advanced Jitsi Component Examples
 * Copy these examples to use advanced features
 */

import React from 'react';
import { JitsiMeeting } from './components/JitsiMeeting';
import { JitsiMeetingContainer } from './components/JitsiMeetingContainer';
import { useJitsiMeeting } from './hooks/useJitsiMeeting';
import { CONFIG_PRESETS, TOOLBAR_PRESETS } from './lib/jitsi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Example 1: Basic Meeting Room
 * Simplest possible  usage 
 */
export function BasicMeeting({ roomId }: { roomId: string }) {
  const router = useRouter();

  return (
    <JitsiMeeting
      roomName={roomId}
      displayName="User"
      height="100%"
      onReadyToClose={() => router.push('/dashboard')}
    />
  );
}

/**
 * Example 2: With User Authentication
 * Pulls user info from Clerk
 */
export function AuthenticatedMeeting({ roomId }: { roomId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const email = session?.user?.email;

  if (!email) return null;

  return (
    <JitsiMeeting
      roomName={roomId}
      displayName={email}
      userEmail={email}
      height="100%"
      onReadyToClose={() => router.push('/dashboard')}
    />
  );
}

/**
 * Example 3: Classroom Setup
 * Teacher has full features, students have limited toolbar
 */
export function ClassroomMeeting({
  roomId,
  isTeacher,
}: {
  roomId: string;
  isTeacher: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const email = session?.user?.email;

  if (!email) return null;

  const teacherButtons = TOOLBAR_PRESETS.host;
  const studentButtons = ['microphone', 'camera', 'chat', 'raisehand', 'hangup'];

  return (
    <JitsiMeeting
      roomName={roomId}
      displayName={email}
      {...CONFIG_PRESETS.classroom}
      toolbarButtons={isTeacher ? teacherButtons : studentButtons}
      height="100%"
      onReadyToClose={() => router.push('/dashboard')}
    />
  );
}

/**
 * Example 4: Webinar Setup
 * Host visible, attendees muted initially
 */
export function WebinarMeeting({
  roomId,
  isHost,
  hostName,
}: {
  roomId: string;
  isHost: boolean;
  hostName: string;
}) {
  const router = useRouter();

  return (
    <JitsiMeeting
      roomName={roomId}
      displayName={isHost ? hostName : 'Attendee'}
      {...CONFIG_PRESETS.webinar}
      toolbarButtons={
        isHost ? TOOLBAR_PRESETS.host : TOOLBAR_PRESETS.standard
      }
      height="100%"
      onReadyToClose={() => router.push('/dashboard')}
    />
  );
}

/**
 * Example 5: One-on-One Video Call
 * Minimal UI for privacy
 */
export function VideoCall({
  roomId,
  callPartnerName,
}: {
  roomId: string;
  callPartnerName: string;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const email = session?.user?.email;

  if (!email) return null;

  return (
    <div className="w-full h-screen bg-slate-900">
      <div className="absolute top-4 right-4 z-20 text-white text-sm">
        Call with: {callPartnerName}
      </div>

      <JitsiMeeting
        roomName={roomId}
        displayName={email}
        toolbarButtons={['microphone', 'camera', 'hangup', 'videoquality']}
        height="100%"
        onReadyToClose={() => router.push('/dashboard')}
      />
    </div>
  );
}

/**
 * Example 6: Meeting with Loading and Error States
 */
export function MeetingWithStateManagement({
  roomId,
  hostId,
  currentUserId,
}: {
  roomId: string;
  hostId: string;
  currentUserId: string;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const email = session?.user?.email;
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Simulate verification
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!email) return null;

  const isHost = currentUserId === hostId;

  return (
    <JitsiMeetingContainer
      roomName={roomId}
      displayName={email}
      isLoading={isLoading}
      error={error}
      toolbarButtons={
        isHost ? TOOLBAR_PRESETS.host : TOOLBAR_PRESETS.standard
      }
      height="100%"
      onRetry={() => window.location.reload()}
      onReadyToClose={() => router.push('/dashboard')}
    />
  );
}

/**
 * Example 7: Dynamic Room with URL Parameters
 */
export function DynamicRoomPage() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room') || 'default-room';
  const displayName = params.get('name') || 'Guest';
  const mode = params.get('mode') || 'standard'; // classroom, webinar, standard

  const router = useRouter();

  let config = {};
  let toolbarButtons = TOOLBAR_PRESETS.standard;

  switch (mode) {
    case 'classroom':
      config = CONFIG_PRESETS.classroom;
      toolbarButtons = TOOLBAR_PRESETS.host;
      break;
    case 'webinar':
      config = CONFIG_PRESETS.webinar;
      toolbarButtons = TOOLBAR_PRESETS.standard;
      break;
    default:
      config = CONFIG_PRESETS.development;
      toolbarButtons = TOOLBAR_PRESETS.standard;
  }

  return (
    <JitsiMeeting
      roomName={roomId}
      displayName={displayName}
      {...config}
      toolbarButtons={toolbarButtons}
      height="100%"
      onReadyToClose={() => router.push('/dashboard')}
    />
  );
}

/**
 * Example 8: Custom Domain Override
 * Use different domain than environment variable
 */
export function MeetingWithCustomDomain({
  roomId,
  domain = 'meet.melanam.com',
}: {
  roomId: string;
  domain?: string;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const email = session?.user?.email;

  if (!email) return null;

  return (
    <JitsiMeeting
      roomName={roomId}
      displayName={email}
      domain={domain}
      height="100%"
      onReadyToClose={() => router.push('/dashboard')}
    />
  );
}

/**
 * Example 9: Embedded in Modal Dialog
 */
export function MeetingModal({
  isOpen,
  roomId,
  onClose,
}: {
  isOpen: boolean;
  roomId: string;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const email = session?.user?.email;

  if (!isOpen || !email) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-8 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-red-600/90 hover:bg-red-700 rounded-lg text-white transition"
        >
          ✕
        </button>

        {/* Meeting */}
        <JitsiMeeting
          roomName={roomId}
          displayName={email}
          height="100%"
          onReadyToClose={onClose}
        />
      </div>
    </div>
  );
}

/**
 * Example 10: Meeting Dashboard
 * Show list of available meetings
 */
export function MeetingsDashboard() {
  const router = useRouter();
  const { generateRoomName } = useJitsiMeeting();

  const meetings = [
    { id: 'room-1', title: 'Team Standup', time: '10:00 AM' },
    { id: 'room-2', title: 'Client Call', time: '2:00 PM' },
    { id: 'room-3', title: 'Project Review', time: '4:00 PM' },
  ];

  const handleJoin = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  const handleCreateNew = () => {
    const newRoomId = generateRoomName();
    router.push(`/room/${newRoomId}`);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Meetings</h1>
        <button
          onClick={handleCreateNew}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Create Meeting
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-700 transition"
          >
            <h3 className="text-lg font-semibold text-white">{meeting.title}</h3>
            <p className="text-gray-400 text-sm">{meeting.time}</p>
            <button
              onClick={() => handleJoin(meeting.id)}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Join Meeting
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 11: Meeting with Control Panel
 */
export function MeetingWithControls({ roomId }: { roomId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const email = session?.user?.email;
  const jitsiRef = React.useRef<any>(null);

  const handleToggleAudio = () => {
    // Note: This requires access to jitsiRef.current
    // You would need to modify JitsiMeeting to expose this
    console.log('Toggle audio');
  };

  const handleToggleVideo = () => {
    console.log('Toggle video');
  };

  if (!email) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Video */}
      <div className="flex-1">
        <JitsiMeeting
          roomName={roomId}
          displayName={email}
          height="100%"
          onReadyToClose={() => router.push('/dashboard')}
        />
      </div>

      {/* Control Panel */}
      <div className="bg-slate-800 border-t border-slate-700 p-4 flex justify-center gap-4">
        <button
          onClick={handleToggleAudio}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🎤 Audio
        </button>
        <button
          onClick={handleToggleVideo}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          📹 Video
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          ✕ Leave
        </button>
      </div>
    </div>
  );
}

// Note: Add imports at the top of your file:
// import React from 'react';

export default BasicMeeting;
