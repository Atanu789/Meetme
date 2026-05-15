import { NextResponse } from 'next/server';
import { getAssemblyAIService, SUPPORTED_LANGUAGES } from '@/lib/assemblyai';

/**
 * Translate text to target language
 * POST /api/ai/translate
 * Server-side translation to secure API key
 */
export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'text and targetLanguage are required' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_LANGUAGES[targetLanguage as any]) {
      return NextResponse.json(
        {
          error: `Unsupported language. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const assemblyai = getAssemblyAIService();
    const translatedText = await assemblyai.translateText(
      text,
      targetLanguage
    );

    return NextResponse.json(
      {
        success: true,
        original: text,
        translated: translatedText,
        language: targetLanguage,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    );
  }
}
