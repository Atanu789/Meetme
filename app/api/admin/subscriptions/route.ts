export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Subscription from '../../../../models/Subscription';
import { getAdminAuthorization } from '../../../../lib/admin-auth';

export async function GET(request: NextRequest) {
  const auth = await getAdminAuthorization(request);
  if (!auth.authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await dbConnect();
  const subscriptions = await Subscription.find({}).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ success: true, subscriptions });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAdminAuthorization(request);
  if (!auth.authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { subscriptionId, plan, status, cancelAtPeriodEnd, notes, amount, billingCycle } = body;
  if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });

  await dbConnect();
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  if (plan !== undefined) subscription.plan = plan;
  if (status !== undefined) subscription.status = status;
  if (cancelAtPeriodEnd !== undefined) subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;
  if (notes !== undefined) subscription.notes = notes;
  if (amount !== undefined) subscription.amount = amount;
  if (billingCycle !== undefined) subscription.billingCycle = billingCycle;

  await subscription.save();
  return NextResponse.json({ success: true, subscription });
}

export async function DELETE(request: NextRequest) {
  const auth = await getAdminAuthorization(request);
  if (!auth.authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const searchParams = request.nextUrl.searchParams;
  const subscriptionId = searchParams.get('subscriptionId');
  if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });

  await dbConnect();
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  subscription.status = 'canceled';
  subscription.cancelAtPeriodEnd = true;
  subscription.notes = 'Canceled by admin';
  await subscription.save();

  return NextResponse.json({ success: true, subscription });
}
