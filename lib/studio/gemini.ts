import type { CourseBlueprint, CourseLesson, CourseModule, StudioResult, StudioSource } from './types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_TRANSCRIPT_CHARACTERS = 48_000;

class GeminiStudioError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = 'GeminiStudioError';
  }
}

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiStudioError('Course Builder is not configured. Set GEMINI_API_KEY on the server.', 503);
  return { apiKey, model: process.env.GEMINI_STUDIO_MODEL?.trim() || 'gemini-2.5-flash' };
}

async function generateContent(payload: Record<string, unknown>) {
  const { apiKey, model } = getGeminiConfig();
  const response = await fetch(`${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new GeminiStudioError(String(body?.error?.message || 'Gemini could not process this source.'), response.status >= 400 && response.status < 500 ? response.status : 502);
  }
  const text = body?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: unknown }) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim();
  if (!text) throw new GeminiStudioError('Gemini returned an empty response. Try a different source.', 502);
  return text;
}

function cleanJson(value: string) {
  return value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

async function extractYouTubeTranscript(source: StudioSource) {
  if (!source.url) throw new GeminiStudioError('The YouTube source is missing its URL.', 400);
  const transcript = await generateContent({
    contents: [{ role: 'user', parts: [
      { file_data: { file_uri: source.url } },
      { text: 'Create a faithful, clean transcript of this public video for course design. Preserve chronological order and speaker wording where understandable. Add [MM:SS] markers only where clear. Do not summarize or add unsupported facts.' },
    ] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 16_384 },
  });
  return transcript.length > MAX_TRANSCRIPT_CHARACTERS ? `${transcript.slice(0, MAX_TRANSCRIPT_CHARACTERS)}\n\n[Transcript truncated for this workflow.]` : transcript;
}

function buildCoursePrompt(sourceText: string) {
  return [
    'You are Melanam Course Builder. Create a rigorous, teachable course from the source below.',
    'Use only source-supported facts. Make the sequence pedagogically sound and practical for an instructor to run live.',
    'Return only valid JSON with this exact shape:',
    '{"course":{"title":"string","description":"string","learnerLevel":"string","estimatedDuration":"string","learningOutcomes":["string"],"modules":[{"title":"string","description":"string","lessons":[{"title":"string","objective":"string","durationMinutes":45,"notes":"string","exercise":"string"}]}],"assessment":"string","instructorNotes":"string"},"markdown":"string"}',
    'Create 3 to 8 modules and 1 to 5 lessons per module. The markdown must contain the complete course, including outcomes, lessons, exercises, assessment, and instructor notes.',
    '', 'SOURCE:', sourceText,
  ].join('\n');
}

function normalizeLesson(value: any): CourseLesson | null {
  const title = String(value?.title || '').trim();
  const objective = String(value?.objective || '').trim();
  if (!title || !objective) return null;
  return {
    title,
    objective,
    durationMinutes: Math.max(5, Math.min(360, Math.round(Number(value?.durationMinutes) || 45))),
    notes: String(value?.notes || '').trim(),
    exercise: String(value?.exercise || '').trim(),
  };
}

function normalizeModule(value: any): CourseModule | null {
  const title = String(value?.title || '').trim();
  const lessons = Array.isArray(value?.lessons) ? value.lessons.map(normalizeLesson).filter(Boolean) as CourseLesson[] : [];
  if (!title || lessons.length === 0) return null;
  return { title, description: String(value?.description || '').trim(), lessons };
}

function normalizeResult(raw: string, source: StudioSource, transcript?: string): StudioResult {
  let parsed: any;
  try { parsed = JSON.parse(cleanJson(raw)); } catch { throw new GeminiStudioError('Gemini returned an unreadable course blueprint. Please try again.', 502); }
  const courseRaw = parsed?.course;
  const modules = Array.isArray(courseRaw?.modules) ? courseRaw.modules.map(normalizeModule).filter(Boolean) as CourseModule[] : [];
  const course: CourseBlueprint = {
    title: String(courseRaw?.title || '').trim(),
    description: String(courseRaw?.description || '').trim(),
    learnerLevel: String(courseRaw?.learnerLevel || '').trim(),
    estimatedDuration: String(courseRaw?.estimatedDuration || '').trim(),
    learningOutcomes: Array.isArray(courseRaw?.learningOutcomes) ? courseRaw.learningOutcomes.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 12) : [],
    modules,
    assessment: String(courseRaw?.assessment || '').trim(),
    instructorNotes: String(courseRaw?.instructorNotes || '').trim(),
  };
  const markdown = String(parsed?.markdown || '').trim();
  if (!course.title || !course.description || !course.learnerLevel || !course.estimatedDuration || !course.learningOutcomes.length || !course.modules.length || !markdown) {
    throw new GeminiStudioError('Gemini returned an incomplete course blueprint. Please try again.', 502);
  }
  return { course, markdown, transcriptPreview: transcript ? transcript.slice(0, 2_500) : undefined, source: { kind: source.kind, providerLabel: source.providerLabel, url: source.url } };
}

export async function createStudioResult(source: StudioSource): Promise<StudioResult> {
  if (source.kind !== 'prompt' && source.kind !== 'youtube') {
    throw new GeminiStudioError(`${source.providerLabel} support is being prepared. Use a public YouTube URL or a topic prompt today.`, 422);
  }
  const transcript = source.kind === 'youtube' ? await extractYouTubeTranscript(source) : undefined;
  const raw = await generateContent({
    contents: [{ role: 'user', parts: [{ text: buildCoursePrompt(transcript || source.value) }] }],
    generationConfig: { temperature: 0.25, maxOutputTokens: 16_384, responseMimeType: 'application/json' },
  });
  return normalizeResult(raw, source, transcript);
}

export { GeminiStudioError };
