'use strict';

const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY || process.env.AAI_API_KEY || '';
const { broadcast } = require('./ws/roomHub');

// Simple in-memory per-meeting caption buffer and timers.
const buffers = new Map();
const lastSummaries = new Map();

function ensureBuffer(meetingId) {
  if (!buffers.has(meetingId)) {
    buffers.set(meetingId, { captions: [], timer: null });
  }
  return buffers.get(meetingId);
}

async function callAssemblyAISummarize(text) {
  if (!ASSEMBLYAI_KEY) {
    throw new Error('AssemblyAI API key not configured');
  }

  // Use AssemblyAI text summarization endpoint. We send the combined captions
  // and request a concise summary and action items if available.
  const res = await fetch('https://api.assemblyai.com/v2/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: ASSEMBLYAI_KEY,
    },
    body: JSON.stringify({
      text,
      summary_type: 'concise',
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AssemblyAI summarize failed: ${res.status} ${txt}`);
  }

  const json = await res.json();
  // AssemblyAI may return summary text or structured items.
  return json;
}

async function summarizeMeeting(meetingId, captions) {
  try {
    const combined = captions.map((c) => `${c.speaker || 'Speaker'}: ${c.text}`).join('\n');

    // Ask AssemblyAI to summarize the collected captions
    const result = await callAssemblyAISummarize(combined);

    // Normalize AssemblyAI response into { summary, actions }
    let summary = '';
    let actions = [];

    if (result) {
      if (typeof result.summary === 'string') {
        summary = result.summary;
      } else if (typeof result.text === 'string') {
        summary = result.text;
      } else if (result?.summaries && Array.isArray(result.summaries) && result.summaries[0]) {
        summary = result.summaries[0].text || '';
      }

      if (Array.isArray(result.action_items)) {
        actions = result.action_items.map((a) => ({ description: a.text || a.description || '', assignee: a.assignee || undefined }));
      } else if (Array.isArray(result.actions)) {
        actions = result.actions.map((a) => ({ description: a.text || a.description || '', assignee: a.assignee || undefined }));
      }
    }

    // If AssemblyAI didn't return structured data, try to extract plain text
    if (!summary) {
      summary = captions.length > 0 ? `${captions[0].text.split('.').slice(0,1).join('.')}. ${captions[captions.length-1].text.split('.').slice(0,1).join('.')}.` : '';
    }

    // Broadcast a combined payload
    broadcast(meetingId, {
      type: 'summary',
      meetingId,
      summary: String(summary).trim(),
      actions: Array.isArray(actions) ? actions : [],
      timestamp: Date.now(),
    });
    // store last summary
    lastSummaries.set(meetingId, { summary: String(summary).trim(), actions: Array.isArray(actions) ? actions : [], timestamp: Date.now() });
  } catch (err) {
    console.error('[summarizer] error summarizing meeting', meetingId, err.message || err);

    // Fallback: produce a simple extractive summary and naive action extraction
    try {
      const fallback = fallbackSummarize(captions);
      broadcast(meetingId, {
        type: 'summary',
        meetingId,
        summary: fallback.summary,
        actions: fallback.actions,
        timestamp: Date.now(),
      });
    } catch (err2) {
      console.error('[summarizer] fallback error', err2 && err2.message);
    }
  }
}

function fallbackSummarize(captions) {
  const lines = captions.map((c) => `${c.speaker || 'Speaker'}: ${c.text}`);
  const joined = lines.join(' ');

  // Simple summary: first and last caption snippets
  const first = captions[0]?.text || '';
  const last = captions[captions.length - 1]?.text || '';
  const summary = `${first.split('.').slice(0,1).join('.')}. ${last.split('.').slice(0,1).join('.')}.`;

  // Naive action extraction: lines containing keywords
  const actionKeywords = ['action', 'todo', 'follow up', 'follow-up', 'deadline', 'will', 'please', 'assign', 'assign to'];
  const actions = [];

  for (const c of captions) {
    const text = (c.text || '').toLowerCase();
    if (actionKeywords.some((k) => text.includes(k))) {
      actions.push({ description: c.text.trim(), assignee: undefined });
    }
  }

  return { summary: summary.trim(), actions };
}

function scheduleSummarize(meetingId) {
  const buf = ensureBuffer(meetingId);
  if (buf.timer) return; // already scheduled

  buf.timer = setTimeout(async () => {
    const captions = buf.captions.splice(0, buf.captions.length);
    buf.timer = null;
    if (captions.length === 0) return;
    await summarizeMeeting(meetingId, captions);
  }, 30_000); // summarize every 30s if captions accumulate
}

async function addCaption(meetingId, payload) {
  try {
    const buf = ensureBuffer(meetingId);
    buf.captions.push({ speaker: payload.speaker || 'Speaker', text: payload.text || '' });

    // If buffer large enough, summarize immediately
    if (buf.captions.length >= 20) {
      const captions = buf.captions.splice(0, buf.captions.length);
      if (buf.timer) {
        clearTimeout(buf.timer);
        buf.timer = null;
      }
      await summarizeMeeting(meetingId, captions);
      return;
    }

    // Otherwise ensure a scheduled summarize
    scheduleSummarize(meetingId);
  } catch (err) {
    console.error('[summarizer] addCaption error', err.message || err);
  }
}

module.exports = { addCaption };

function getLastSummary(meetingId) {
  return lastSummaries.get(meetingId) || null;
}

module.exports = { addCaption, getLastSummary };
