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
  includedCredits: number;
  usedCredits: number;
  extraCredits: number;
  pendingPurchaseType?: 'plan' | 'credits' | '';
  pendingPlanKey?: string;
  pendingBillingCycle?: 'monthly' | 'annual' | '';
  pendingPlanAmount?: number;
  pendingCreditPackKey?: string;
  pendingCreditAmount?: number;
  pendingCreditQuantity?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  lastCreditResetAt?: Date | null;
  adminOverrideBy?: string;
  adminOverrideAt?: Date | null;
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
    includedCredits: { type: Number, default: 0 },
    usedCredits: { type: Number, default: 0 },
    extraCredits: { type: Number, default: 0 },
    pendingPurchaseType: { type: String, enum: ['plan', 'credits', ''], default: '' },
    pendingPlanKey: { type: String, default: '' },
    pendingBillingCycle: { type: String, enum: ['monthly', 'annual', ''], default: '' },
    pendingPlanAmount: { type: Number, default: 0 },
    pendingCreditPackKey: { type: String, default: '' },
    pendingCreditAmount: { type: Number, default: 0 },
    pendingCreditQuantity: { type: Number, default: 0 },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    lastCreditResetAt: { type: Date, default: null },
    adminOverrideBy: { type: String, default: '' },
    adminOverrideAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, plan: 1 });
SubscriptionSchema.index({ razorpayOrderId: 1 });

const Subscription: Model<ISubscription> = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;
