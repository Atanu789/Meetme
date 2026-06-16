export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth-options';
import { BILLING_PLAN_MAP } from '../../../../../lib/billing-plans';
import dbConnect from '../../../../../lib/db';
import User from '../../../../../models/User';
import Subscription from '../../../../../models/Subscription';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

function toPaise(amountInr: number) {
  return Math.round(amountInr * 100);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planKey, billingCycle = 'monthly' } = await req.json();
    const plan = BILLING_PLAN_MAP[planKey as keyof typeof BILLING_PLAN_MAP];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const price = billingCycle === 'annual' ? plan.annualInr : plan.monthlyInr;
    if (price == null) {
      return NextResponse.json({ error: 'Custom plan requires sales contact' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const order = await razorpay.orders.create({
      amount: toPaise(price),
      currency: 'INR',
      receipt: `melanam_${planKey}_${Date.now()}`,
      notes: {
        planKey,
        billingCycle,
        userEmail: user.email,
      },
    });

    const subscription = await Subscription.findOneAndUpdate(
      { userEmail: user.email },
      {
        userId: user._id.toString(),
        userEmail: user.email,
        plan: planKey,
        status: 'pending',
        billingCycle,
        amount: price,
        currency: 'INR',
        razorpayOrderId: order.id,
        cancelAtPeriodEnd: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, order, subscription });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create Razorpay order' }, { status: 500 });
  }
}
