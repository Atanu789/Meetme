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

  const normalizedId = String(participantId).trim();
  const normalizedName = String(displayName || '').trim();

  if (!normalizedName) {
    removeParticipant(meetingId, normalizedId);
    return;
  }

  map.set(normalizedId, normalizedName);
  map.set(`Speaker ${normalizedId}`, normalizedName);
  map.set(`speaker:${normalizedId}`, normalizedName);
  map.set(`speaker-${normalizedId}`, normalizedName);
}

function removeParticipant(meetingId, participantId) {
  const map = mappings.get(meetingId);
  if (!map) return;

  const normalizedId = String(participantId || '').trim();
  map.delete(normalizedId);
  map.delete(`Speaker ${normalizedId}`);
  map.delete(`speaker:${normalizedId}`);
  map.delete(`speaker-${normalizedId}`);
}

function resolveSpeaker(meetingId, speakerLabel) {
  // speakerLabel may be like 'Speaker 1' or a numeric id
  const map = mappings.get(meetingId);
  if (!map) return undefined;

  // Try direct match
  const normalizedLabel = String(speakerLabel || '').trim();
  const directMatch = map.get(normalizedLabel);
  if (directMatch) return directMatch;

  // If speakerLabel contains digits, try to match the numeric part
  const speakerMatch = normalizedLabel.match(/^speaker\s+(.+)$/i);
  const speakerAlias = speakerMatch?.[1]?.trim();
  if (speakerAlias) {
    const speakerAliasMatch = map.get(speakerAlias);
    if (speakerAliasMatch) return speakerAliasMatch;
  }

  const digits = (normalizedLabel.match(/\d+/) || [])[0];
  if (digits) {
    const digitMatch = map.get(digits);
    if (digitMatch) return digitMatch;
  }

  return undefined;
}

module.exports = { addParticipant, removeParticipant, resolveSpeaker };
