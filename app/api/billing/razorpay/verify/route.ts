export const dynamic = 'force-dynamic';

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Subscription from '../../../../../models/Subscription';
import { completeVerifiedPurchase, serializeMembership } from '../../../../../lib/membership';

export async function POST(req: NextRequest) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing verification payload' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!secret) {
      return NextResponse.json({ error: 'Razorpay secret is not configured' }, { status: 500 });
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(String(razorpaySignature));
    if (expectedBuffer.length !== suppliedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await dbConnect();
    const subscription = await Subscription.findOne({ razorpayOrderId });
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const updatedSubscription = await completeVerifiedPurchase(subscription, {
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    return NextResponse.json({ success: true, subscription: serializeMembership(updatedSubscription) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
