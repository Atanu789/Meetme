'use strict';

// Simple in-memory mapping of meetingId -> speakerId -> displayName
const mappings = new Map();

function ensureMapping(meetingId) {
  if (!mappings.has(meetingId)) {
    mappings.set(meetingId, new Map());
  }
  return mappings.get(meetingId);
}

function addParticipant(meetingId, participantId, displayName) {
  const map = ensureMapping(meetingId);
  if (!participantId) return;
  map.set(String(participantId), String(displayName || '').trim());
}

function removeParticipant(meetingId, participantId) {
  const map = mappings.get(meetingId);
  if (!map) return;
  map.delete(String(participantId));
}

function resolveSpeaker(meetingId, speakerLabel) {
  // speakerLabel may be like 'Speaker 1' or a numeric id
  const map = mappings.get(meetingId);
  if (!map) return undefined;

  // Try direct match
  if (map.has(String(speakerLabel))) return map.get(String(speakerLabel));

  // If speakerLabel contains digits, try to match the numeric part
  const digits = (String(speakerLabel || '').match(/\d+/) || [])[0];
  if (digits && map.has(digits)) return map.get(digits);

  return undefined;
}

module.exports = { addParticipant, removeParticipant, resolveSpeaker };
