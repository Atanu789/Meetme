'use client';

import { useState } from 'react';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; description: string }) => Promise<void>;
}

export function CreateMeetingModal({ isOpen, onClose, onCreate }: CreateMeetingModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Meeting title is required');
      return;
    }

    setIsCreating(true);

    try {
      await onCreate({ title: title.trim(), description: description.trim() });
      setTitle('');
      setDescription('');
      onClose();
    } catch (createError: any) {
      setError(createError?.message || 'Failed to create meeting');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="surface-strong w-full max-w-md rounded-3xl p-6">
        <div className="mb-6">
          <p className="section-kicker mb-2">Create room</p>
          <h2 className="font-display text-2xl font-semibold text-slate-950">Set up a meeting</h2>
          <p className="mt-2 text-sm text-slate-500">Privacy, chat, and recording defaults are handled automatically.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Meeting title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Team sync"
              className="input-modern"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agenda or context"
              className="input-modern min-h-[110px] resize-none"
              rows={4}
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="button-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="button-primary flex-1"
            >
              {isCreating ? 'Creating...' : 'Create room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}