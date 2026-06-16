import mongoose, { Schema, Document, Model } from 'mongoose';

export type SubscriptionPlan = 'free' | 'pro' | 'business' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'pending';

export interface ISubscription extends Document {
  userId: string;
  userEmail: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'annual';
  amount: number;
  currency: 'INR' | 'USD';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, lowercase: true, index: true },
    plan: { type: String, enum: ['free', 'pro', 'business', 'enterprise'], default: 'free', index: true },
    status: { type: String, enum: ['active', 'trialing', 'past_due', 'canceled', 'pending'], default: 'pending', index: true },
    billingCycle: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
    amount: { type: Number, default: 0 },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, plan: 1 });

const Subscription: Model<ISubscription> = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;
