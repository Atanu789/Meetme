'use strict';

const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY || process.env.AAI_API_KEY || '';
const { broadcast } = require('./ws/roomHub');

const ASSEMBLYAI_LEMUR_URL = 'https://api.assemblyai.com/v2/lemur/v3/generate';

const buffers = new Map();
const lastSummaries = new Map();

function ensureBuffer(meetingId) {
  if (!buffers.has(meetingId)) {
    buffers.set(meetingId, { captions: [], timer: null });
  }

  return buffers.get(meetingId);
}

async function callAssemblyAIMeetingNotes(text) {
  if (!ASSEMBLYAI_KEY) {
    throw new Error('AssemblyAI API key not configured');
  }

  const response = await fetch(ASSEMBLYAI_LEMUR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: ASSEMBLYAI_KEY,
    },
    body: JSON.stringify({
      final_model: 'default',
      max_output_size: 4096,
      prompt: `Analyze these live meeting captions and return ONLY valid JSON.

Schema:
{
  "summary": "3-5 sentence executive summary",
  "keyNotes": ["Important discussion point or context"],
  "keyDecisions": ["Decision that was actually made"],
  "actionItems": [{"description": "Task", "assignee": "Owner if mentioned"}]
}

Rules:
- Keep speaker names exactly as written in the captions.
- Do not invent decisions, owners, or action items.
- Use empty arrays when nothing clear is present.
- Keep every item concise.

Captions:
${text}`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AssemblyAI LeMUR failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  return parseMeetingNotes(json.response || json.text || '');
}

function parseMeetingNotes(text) {
  const parsed = parseJsonObject(text);

  if (!parsed) {
    return {
      summary: String(text || '').trim(),
      keyNotes: [],
      keyDecisions: [],
      actionItems: [],
    };
  }

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
    keyNotes: normalizeStringList(parsed.keyNotes || parsed.key_notes || parsed.notes),
    keyDecisions: normalizeStringList(parsed.keyDecisions || parsed.key_decisions || parsed.decisions),
    actionItems: normalizeActionItems(parsed.actionItems || parsed.action_items || parsed.actions),
  };
}

function parseJsonObject(text) {
  const cleaned = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeStringList(value) {
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((line) => line.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim())
      .filter(Boolean);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (!item || typeof item !== 'object') return '';
      return String(item.text || item.description || item.note || item.decision || item.item || '').trim();
    })
    .filter(Boolean);
}

function normalizeActionItems(value) {
  if (typeof value === 'string') {
    return normalizeStringList(value).map((description) => ({
      description,
      assignee: extractAssignee(description),
    }));
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return {
          description: item.trim(),
          assignee: extractAssignee(item),
        };
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const description = String(item.description || item.text || item.item || item.task || '').trim();
      const assignee = String(item.assignee || item.owner || item.assignedTo || '').trim();

      if (!description) {
        return null;
      }

      return {
        description,
        assignee: assignee || extractAssignee(description),
      };
    })
    .filter(Boolean);
}

function extractAssignee(text) {
  const match = String(text || '').match(/^(.*?):\s+.+$/);
  return match ? match[1].trim() : undefined;
}

async function summarizeMeeting(meetingId, captions) {
  try {
    const combined = captions
      .map((caption) => {
        const speaker = caption.speaker || (caption.speakerId ? `Speaker ${caption.speakerId}` : 'Speaker');
        return `${speaker}: ${caption.text}`;
      })
      .join('\n');

    const notes = await callAssemblyAIMeetingNotes(combined);

    if (!notes.summary) {
      notes.summary = fallbackSummarize(captions).summary;
    }

    publishSummary(meetingId, notes);
  } catch (err) {
    console.error('[summarizer] error summarizing meeting', meetingId, err.message || err);

    try {
      publishSummary(meetingId, fallbackSummarize(captions));
    } catch (fallbackError) {
      console.error('[summarizer] fallback error', fallbackError && fallbackError.message);
    }
  }
}

function fallbackSummarize(captions) {
  const first = captions[0]?.text || '';
  const last = captions[captions.length - 1]?.text || '';
  const summary = [first, last]
    .map((text) => String(text).split('.').slice(0, 1).join('.').trim())
    .filter(Boolean)
    .join('. ');
  const keyNotes = captions
    .slice(-5)
    .map((caption) => `${caption.speaker || 'Speaker'}: ${caption.text}`)
    .filter((text) => text.trim().length > 0);
  const actionKeywords = ['action', 'todo', 'follow up', 'follow-up', 'deadline', 'will', 'please', 'assign', 'assign to'];
  const actionItems = captions
    .filter((caption) => actionKeywords.some((keyword) => String(caption.text || '').toLowerCase().includes(keyword)))
    .map((caption) => ({ description: String(caption.text || '').trim(), assignee: undefined }))
    .filter((item) => item.description.length > 0);

  return {
    summary: summary.trim(),
    keyNotes,
    keyDecisions: [],
    actionItems,
  };
}

function publishSummary(meetingId, notes) {
  const timestamp = Date.now();
  const payload = {
    type: 'summary',
    meetingId,
    summary: String(notes.summary || '').trim(),
    keyNotes: Array.isArray(notes.keyNotes) ? notes.keyNotes : [],
    keyDecisions: Array.isArray(notes.keyDecisions) ? notes.keyDecisions : [],
    actionItems: Array.isArray(notes.actionItems) ? notes.actionItems : [],
    actions: Array.isArray(notes.actionItems) ? notes.actionItems : [],
    timestamp,
  };

  broadcast(meetingId, payload);
  lastSummaries.set(meetingId, {
    summary: payload.summary,
    keyNotes: payload.keyNotes,
    keyDecisions: payload.keyDecisions,
    actionItems: payload.actionItems,
    actions: payload.actions,
    timestamp,
  });
}

function scheduleSummarize(meetingId) {
  const buffer = ensureBuffer(meetingId);
  if (buffer.timer) return;

  buffer.timer = setTimeout(async () => {
    const captions = buffer.captions.splice(0, buffer.captions.length);
    buffer.timer = null;
    if (captions.length === 0) return;
    await summarizeMeeting(meetingId, captions);
  }, 30_000);
}

async function addCaption(meetingId, payload) {
  try {
    const buffer = ensureBuffer(meetingId);
    buffer.captions.push({
      speaker: payload.speaker || 'Speaker',
      speakerId: payload.speakerId || undefined,
      text: payload.text || '',
    });

    if (buffer.captions.length >= 20) {
      const captions = buffer.captions.splice(0, buffer.captions.length);
      if (buffer.timer) {
        clearTimeout(buffer.timer);
        buffer.timer = null;
      }

      await summarizeMeeting(meetingId, captions);
      return;
    }

    scheduleSummarize(meetingId);
  } catch (err) {
    console.error('[summarizer] addCaption error', err.message || err);
  }
}

async function flushMeeting(meetingId) {
  try {
    const buffer = ensureBuffer(meetingId);
    if (!buffer || !buffer.captions || buffer.captions.length === 0) {
      return getLastSummary(meetingId) || null;
    }

    const captions = buffer.captions.splice(0, buffer.captions.length);

    if (buffer.timer) {
      clearTimeout(buffer.timer);
      buffer.timer = null;
    }

    await summarizeMeeting(meetingId, captions);
    return getLastSummary(meetingId) || null;
  } catch (err) {
    console.error('[summarizer] flushMeeting error', err && err.message ? err.message : err);
    throw err;
  }
}

function getLastSummary(meetingId) {
  return lastSummaries.get(meetingId) || null;
}

module.exports = { addCaption, getLastSummary, flushMeeting };
