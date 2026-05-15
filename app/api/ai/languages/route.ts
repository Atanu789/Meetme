import { NextResponse } from 'next/server';
import { SUPPORTED_LANGUAGES } from '@/lib/assemblyai';

/**
 * Get list of supported languages
 * GET /api/ai/languages
 */
export async function GET() {
  try {
    const languages = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
      code,
      name,
    }));

    return NextResponse.json(
      {
        success: true,
        languages,
        total: languages.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch languages' },
      { status: 500 }
    );
  }
}
