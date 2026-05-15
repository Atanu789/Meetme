/**
 * EXAMPLE: Complete AI Assistant Integration Flow
 * 
 * This file shows how all AI components work together in a real meeting scenario
 */

// ============================================================================
// 1. SETUP: Environment Configuration
// ============================================================================

// Add to .env.local:
// ASSEMBLYAI_API_KEY=your_key_here

// ============================================================================
// 2. MEETING FLOW: Initialize AI in Navbar
// ============================================================================

import AIAssistant from '@/components/AIAssistant';

// In navbar room controls:
export function MeetingNavbar() {
  return (
    <nav>
      {/* AI Assistant button with language selection and live captions */}
      <AIAssistant meetingId="meeting-xyz" onAIToggle={(enabled) => {
        console.log('AI toggled:', enabled);
        // Could trigger audio capture setup here
      }} />
    </nav>
  );
}

// ============================================================================
// 3. DURING MEETING: Use useAI Hook for State Management
// ============================================================================

import { useAI } from '@/hooks/useAI';

export function MeetingControls() {
  const { state, enableAI, disableAI, processMeeting, translateText } = useAI('meeting-xyz');

  return (
    <div>
      <p>AI Status: {state.status}</p>
      <p>Language: {state.language}</p>
      {state.error && <p>Error: {state.error}</p>}
    </div>
  );
}

// ============================================================================
// 4. POST-MEETING: Process Recording and Generate AI Results
// ============================================================================

/**
 * Example: Process meeting after it ends
 * 
 * Trigger this when:
 * - Meeting ends
 * - Recording is available
 * - Jibri/recording bot has processed the audio
 */
export async function handleMeetingEnd(meetingId: string, recordingUrl: string) {
  try {
    const response = await fetch('/api/ai/process-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingId,
        recordingUrl, // from Jitsi recording
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('AI Results:', {
        summary: result.data.summary,
        decisions: result.data.keyDecisions,
        actionItems: result.data.actionItems,
        speakers: result.data.speakerLabels,
      });
      // Results are now saved in database under meeting.summary, etc.
    }
  } catch (error) {
    console.error('Failed to process meeting:', error);
  }
}

// ============================================================================
// 5. DISPLAY RESULTS: Show AI Content in Meeting History
// ============================================================================

import { AIResultsDisplay } from '@/components/AIResultsDisplay';
import { useMeeting } from '@/hooks/useMeeting';

export function MeetingHistoryCard() {
  const { meeting } = useMeeting('meeting-xyz');

  return (
    <div className="meeting-card">
      <h2>{meeting.title}</h2>
      <p>Duration: {meeting.duration}</p>

      {/* Display AI results if available */}
      <AIResultsDisplay
        meetingId={meeting.meetingId}
        summary={meeting.summary}
        keyDecisions={meeting.keyDecisions}
        actionItems={meeting.actionItems}
        transcript={meeting.transcript}
        speakerLabels={meeting.speakerLabels}
      />
    </div>
  );
}

// ============================================================================
// 6. API EXAMPLES: Direct API Usage
// ============================================================================

/**
 * Get list of supported languages
 */
export async function loadLanguages() {
  const response = await fetch('/api/ai/languages');
  const { languages } = await response.json();
  
  // Returns:
  // [
  //   { code: 'en', name: 'English' },
  //   { code: 'es', name: 'Spanish' },
  //   { code: 'fr', name: 'French' },
  //   ...
  // ]
}

/**
 * Enable AI for a specific meeting
 */
export async function enableAIForMeeting(meetingId: string, language = 'en') {
  const response = await fetch('/api/ai/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meetingId,
      language,
    }),
  });

  // Returns:
  // {
  //   success: true,
  //   meeting: {
  //     meetingId,
  //     aiEnabled: true,
  //     aiLanguage: 'en'
  //   }
  // }
}

/**
 * Translate caption text to another language
 */
export async function translateCaption(text: string, language = 'es') {
  const response = await fetch('/api/ai/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      targetLanguage: language,
    }),
  });

  const { translated } = await response.json();
  return translated;
  
  // Example: "Hello world" → "Hola mundo"
}

/**
 * Check transcription status
 */
export async function checkTranscriptionStatus(transcriptId: string) {
  const response = await fetch(`/api/ai/transcript-status?transcriptId=${transcriptId}`);

  // Returns:
  // {
  //   success: true,
  //   id: 'aai-123',
  //   status: 'completed' | 'queued' | 'processing',
  //   text: 'Full transcript text...',
  //   utterances: 45
  // }
}

// ============================================================================
// 7. BACKEND SERVICE: Direct Use (Server-side only)
// ============================================================================

import { getAssemblyAIService } from '@/lib/assemblyai';

export async function serverSideAIProcessing() {
  const assemblyai = getAssemblyAIService();

  // Submit audio for transcription
  const submitResult = await assemblyai.submitTranscription(
    'https://example.com/recording.mp3',
    { 
      language: 'en',
      speakerLabels: true 
    }
  );

  // Poll for completion
  let transcript = await assemblyai.getTranscription(submitResult.id);
  while (transcript.status !== 'completed') {
    await new Promise(r => setTimeout(r, 1000));
    transcript = await assemblyai.getTranscription(submitResult.id);
  }

  // Extract information
  const speakers = await assemblyai.getSpeakerLabels(submitResult.id);
  const details = await assemblyai.getDetailedTranscript(submitResult.id);
  
  // Generate summary
  const analysis = await assemblyai.generateSummary(submitResult.id);

  return {
    transcriptId: submitResult.id,
    speakers,
    transcript: details,
    summary: analysis.summary,
    keyDecisions: analysis.keyDecisions,
    actionItems: analysis.actionItems,
  };
}

// ============================================================================
// 8. WORKFLOW: Complete Meeting Lifecycle
// ============================================================================

/**
 * SCENARIO: User joins meeting and enables AI
 * 
 * 1. Meeting starts
 * 2. User clicks AI Assistant button in navbar
 * 3. AIAssistant component opens
 * 4. User selects language (e.g., Spanish)
 * 5. User clicks "Enable AI"
 * 6. POST /api/ai/init is called
 * 7. Meeting.aiEnabled = true
 * 8. Meeting.aiLanguage = 'es'
 * 9. Status indicator shows "Active"
 * 10. Live captions area appears (Phase 2)
 */

/**
 * SCENARIO: Recording is available after meeting ends
 * 
 * 1. Meeting ends
 * 2. Jitsi completes recording
 * 3. Recording URL is available
 * 4. Call POST /api/ai/process-meeting with recordingUrl
 * 5. Backend submits to AssemblyAI
 * 6. Backend polls for completion
 * 7. When done, generates summary using LeMUR API
 * 8. Results stored: transcript, summary, decisions, items
 * 9. Meeting card in dashboard shows "AI Results"
 * 10. User can expand and view all results
 * 11. User can download transcript as text file
 */

/**
 * SCENARIO: User wants translated captions
 * 
 * 1. AI is enabled with language 'en'
 * 2. Captions come through in English
 * 3. User also wants Spanish translation
 * 4. Each caption text is sent to POST /api/ai/translate
 * 5. Translation returned and displayed alongside
 * 6. Translated captions stored in meeting.translatedCaptions
 */

// ============================================================================
// 9. DATA MODEL: What Gets Stored
// ============================================================================

/**
 * When AI processes a meeting, these fields are populated:
 * 
 * meeting.aiEnabled: true
 * meeting.aiLanguage: 'en'
 * meeting.transcript: [
 *   {
 *     text: "The project is on schedule",
 *     timestamp: 125000,  // milliseconds
 *     speakerId: "Speaker 1",
 *     speaker: "Speaker 1"
 *   },
 *   ...
 * ]
 * meeting.summary: "The team discussed Q1 goals..."
 * meeting.keyDecisions: [
 *   "Approved new feature roadmap",
 *   "Extended deadline to March 15",
 *   ...
 * ]
 * meeting.actionItems: [
 *   { item: "Update documentation", owner: "Sarah" },
 *   { item: "Create PR for API changes", owner: "John" },
 *   ...
 * ]
 * meeting.speakerLabels: [
 *   { speakerId: "Speaker 1", name: "Speaker 1", color: "#FF6B6B" },
 *   { speakerId: "Speaker 2", name: "Speaker 2", color: "#4ECDC4" },
 * ]
 * meeting.translatedCaptions: [
 *   { language: 'es', text: 'El proyecto está en horario', timestamp: 125000, speakerId: "Speaker 1" },
 *   ...
 * ]
 */

// ============================================================================
// 10. NEXT STEPS: Phase 2 - Real-time Captions
// ============================================================================

/**
 * Phase 2 Implementation (Future):
 * 
 * 1. Add real-time caption streaming:
 *    - Browser captures audio chunks during meeting
 *    - Sends to backend relay
 *    - Backend streams to AssemblyAI RealtimeTranscriber
 *    - Captions pushed back via WebSocket
 * 
 * 2. Live caption overlay:
 *    - Real-time captions appear as user speaks
 *    - Speaker detection labels
 *    - Confidence scores
 *    - Final vs. partial captions
 * 
 * 3. Real-time translation:
 *    - Live captions in multiple languages
 *    - Simultaneous display
 *    - Language switching
 * 
 * 4. Integration points:
 *    - CaptionOverlay component updated
 *    - WebSocket handler for live captions
 *    - Audio capture from Jitsi
 *    - Streaming audio relay backend
 */

export default {
  EXAMPLE_IMPLEMENTATION: true,
};
