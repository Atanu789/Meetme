'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MeetingCard } from '@/components/MeetingCard';
import { JoinModal } from '@/components/JoinModal';
import { Loader } from '@/components/Loader';

interface Meeting {
  _id: string;
  meetingId: string;
  title: string;
  hostEmail: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoaded, router]);

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/get-meetings');
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      if (!formData.title.trim()) {
        setError('Meeting title is required');
        setIsCreating(false);
        return;
      }

      const response = await fetch('/api/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostEmail: user?.emailAddresses[0]?.emailAddress,
          title: formData.title,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create meeting');
      }

      const data = await response.json();
      router.push(`/room/${data.meetingId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create meeting');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isLoaded) {
    return <Loader />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user.firstName || 'there'}! 👋
          </h1>
          <p className="text-gray-400">Manage your meetings and connect with others</p>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-6 backdrop-blur-sm bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition text-white font-semibold flex items-center justify-center gap-2"
          >
            <span className="text-2xl">➕</span>
            Create New Meeting
          </button>
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="p-6 backdrop-blur-sm bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl hover:from-purple-700 hover:to-purple-800 transition text-white font-semibold flex items-center justify-center gap-2"
          >
            <span className="text-2xl">📞</span>
            Join Meeting
          </button>
        </div>

        {/* Create Meeting Form */}
        {showCreateForm && (
          <div className="backdrop-blur-sm bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Meeting</h2>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Team Standup"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Add agenda or notes..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ title: '', description: '' });
                    setError('');
                  }}
                  className="px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create & Join'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Meetings List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Recent Meetings</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
                </div>
              </div>
            </div>
          ) : meetings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting._id}
                  meetingId={meeting.meetingId}
                  title={meeting.title}
                  hostEmail={meeting.hostEmail}
                  createdAt={meeting.createdAt}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 backdrop-blur-sm bg-slate-800/30 border border-slate-700 rounded-xl">
              <p className="text-gray-400 text-lg">No meetings yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Create your first meeting to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Join Modal */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
}
