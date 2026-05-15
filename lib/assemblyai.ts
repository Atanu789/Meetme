/**
 * AssemblyAI integration service
 * Handles transcription, translation, summarization, and real-time captions
 * API key is only stored on the server, never exposed to the client
 */

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_BASE = 'https://api.assemblyai.com/v2';

// Supported languages for AssemblyAI
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese (Mandarin)',
  vi: 'Vietnamese',
  th: 'Thai',
  ko: 'Korean',
  tr: 'Turkish',
  hi: 'Hindi',
  ar: 'Arabic',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

class AssemblyAIService {
  private apiKey: string;
  private baseUrl: string = ASSEMBLYAI_API_BASE;

  constructor() {
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('ASSEMBLYAI_API_KEY environment variable is not set');
    }
    this.apiKey = ASSEMBLYAI_API_KEY;
  }

  private getHeaders() {
    return {
      Authorization: this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Submit audio file for transcription and translation
   */
  async submitTranscription(
    audioUrl: string,
    options: {
      language?: SupportedLanguage;
      detectLanguage?: boolean;
      speakerLabels?: boolean;
      wordBoost?: string[];
      redact?: string[]; // PII redaction
    } = {}
  ) {
    const body = {
      audio_url: audioUrl,
      language_code: options.language || 'en',
      speaker_labels: options.speakerLabels ?? true,
      auto_highlights: true,
      iab_categories: true,
      word_boost: options.wordBoost || [],
      content_safety: true,
      is_sensitive_content: true,
      redact_pii: options.redact || false,
      sentiment_analysis: true,
      entity_detection: true,
    };

    const response = await fetch(`${this.baseUrl}/transcript`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`AssemblyAI API error: ${error.error || error.message}`);
    }

    return response.json();
  }

  /**
   * Poll for transcription status
   */
  async getTranscription(transcriptId: string) {
    const response = await fetch(`${this.baseUrl}/transcript/${transcriptId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to fetch transcription: ${error.error || error.message}`);
    }

    return response.json();
  }

  /**
   * Translate transcript text
   */
  async translateText(
    text: string,
    targetLanguage: SupportedLanguage = 'en'
  ): Promise<string> {
    // AssemblyAI LeMUR API for translation
    const body = {
      context: {
        existing_transcript_ids: [], // Could pass transcript IDs for context
      },
      final_model: 'default',
      max_output_size: 4096,
      prompt: `Translate the following text to ${SUPPORTED_LANGUAGES[targetLanguage]}:\n\n${text}`,
    };

    const response = await fetch(`${this.baseUrl}/lemur/v3/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Translation failed: ${error.error || error.message}`);
    }

    const result = await response.json();
    return result.response;
  }

  /**
   * Generate meeting summary using LeMUR API
   */
  async generateSummary(transcriptId: string): Promise<{
    summary: string;
    keyDecisions: string[];
    actionItems: string[];
  }> {
    // Get full transcript first
    const transcript = await this.getTranscription(transcriptId);

    if (transcript.status !== 'completed') {
      throw new Error('Transcript not yet completed');
    }

    const fullText = transcript.text;

    // Generate summary
    const summaryPrompt = `Provide a concise summary of this meeting transcript:\n\n${fullText}`;
    const summaryResponse = await this.lemurGenerate(summaryPrompt);

    // Extract key decisions
    const decisionsPrompt = `Extract key decisions made in this meeting transcript as a bullet-point list:\n\n${fullText}`;
    const decisionsResponse = await this.lemurGenerate(decisionsPrompt);

    // Extract action items
    const actionPrompt = `Extract all action items from this meeting transcript as a bullet-point list with owner if mentioned:\n\n${fullText}`;
    const actionResponse = await this.lemurGenerate(actionPrompt);

    // Parse responses into structured format
    const keyDecisions = this.parseBulletList(decisionsResponse);
    const actionItems = this.parseBulletList(actionResponse);

    return {
      summary: summaryResponse,
      keyDecisions,
      actionItems,
    };
  }

  /**
   * Use LeMUR API for AI generation tasks
   */
  private async lemurGenerate(
    prompt: string,
    transcriptIds: string[] = []
  ): Promise<string> {
    const body = {
      context: {
        existing_transcript_ids: transcriptIds,
      },
      final_model: 'default',
      max_output_size: 4096,
      prompt,
    };

    const response = await fetch(`${this.baseUrl}/lemur/v3/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LeMUR generation failed: ${error.error || error.message}`);
    }

    const result = await response.json();
    return result.response;
  }

  /**
   * Parse bullet-point list from LLM response
   */
  private parseBulletList(text: string): string[] {
    return text
      .split('\n')
      .filter(line => line.trim().match(/^[-•*]/))
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Get speaker labels from transcript
   */
  async getSpeakerLabels(
    transcriptId: string
  ): Promise<Array<{ label: string; speaker: string }>> {
    const transcript = await this.getTranscription(transcriptId);

    if (!transcript.utterances) {
      return [];
    }

    // Extract unique speakers with their labels
    const speakers = new Map<string, string>();
    transcript.utterances.forEach((utterance: any) => {
      if (utterance.speaker && !speakers.has(utterance.speaker)) {
        speakers.set(utterance.speaker, `Speaker ${speakers.size + 1}`);
      }
    });

    return Array.from(speakers.entries()).map(([label, speaker]) => ({
      label,
      speaker,
    }));
  }

  /**
   * Get transcript with timestamps and speaker labels
   */
  async getDetailedTranscript(
    transcriptId: string
  ): Promise<
    Array<{
      text: string;
      start: number;
      end: number;
      speaker: string;
    }>
  > {
    const transcript = await this.getTranscription(transcriptId);

    if (!transcript.utterances) {
      return [];
    }

    return transcript.utterances.map((utterance: any) => ({
      text: utterance.text,
      start: utterance.start,
      end: utterance.end,
      speaker: `Speaker ${utterance.speaker}`,
    }));
  }
}

// Singleton instance
let assemblyaiInstance: AssemblyAIService | null = null;

export function getAssemblyAIService(): AssemblyAIService {
  if (!assemblyaiInstance) {
    assemblyaiInstance = new AssemblyAIService();
  }
  return assemblyaiInstance;
}

export default AssemblyAIService;
