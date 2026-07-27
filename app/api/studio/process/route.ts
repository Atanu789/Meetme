import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getCreditBalance, requireFeatureAccess, requireCredits } from '@/lib/membership';
import { createStudioResult, GeminiStudioError } from '@/lib/studio/gemini';
import { parseStudioSource, StudioSourceError } from '@/lib/studio/source';
import type { StudioProcessRequest } from '@/lib/studio/types';

export const dynamic = 'force-dynamic';

const STUDIO_CREDIT_COST = 10;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = String(session?.user?.email || '').trim().toLowerCase();
    if (!userEmail) return NextResponse.json({ error: 'Sign in to use Learning Studio.' }, { status: 401 });

    const body = await request.json().catch(() => null) as StudioProcessRequest | null;
    if (!body || typeof body.source !== 'string') {
      return NextResponse.json({ error: 'A source is required.', code: 'SOURCE_REQUIRED' }, { status: 400 });
    }
    const source = parseStudioSource(body.source);
    const featureCheck = await requireFeatureAccess(userEmail, 'aiNotes');
    if (!featureCheck.ok) {
      return NextResponse.json({ error: featureCheck.error, code: featureCheck.code, membership: featureCheck.membership || null }, { status: featureCheck.status });
    }

    const balance = getCreditBalance(featureCheck.subscription);
    if (balance !== null && balance < STUDIO_CREDIT_COST) {
      return NextResponse.json({
        error: 'Not enough credits for Learning Studio. Buy extra credits or upgrade your plan.',
        code: 'CREDITS_REQUIRED',
        membership: featureCheck.membership,
      }, { status: 402 });
    }

    const result = await createStudioResult(source);
    const creditCheck = await requireCredits(userEmail, STUDIO_CREDIT_COST, 'Learning Studio output');
    if (!creditCheck.ok) {
      return NextResponse.json({ error: creditCheck.error, code: creditCheck.code, membership: creditCheck.membership || null }, { status: creditCheck.status });
    }

    return NextResponse.json({ success: true, result, membership: creditCheck.membership });
  } catch (error) {
    if (error instanceof StudioSourceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (error instanceof GeminiStudioError) {
      return NextResponse.json({ error: error.message, code: 'GEMINI_PROCESSING_FAILED' }, { status: error.status });
    }
    console.error('Learning Studio processing error:', error);
    return NextResponse.json({ error: 'Learning Studio could not process this source. Please try again.', code: 'STUDIO_PROCESSING_FAILED' }, { status: 500 });
  }
}
