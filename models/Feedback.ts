import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeedback extends Document {
  meetingId: string;
  type: 'agree' | 'confused' | 'repeat' | 'interesting';
  userName?: string;
  userEmail?: string | null;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    meetingId: { type: String, required: true, index: true },
    type: { type: String, enum: ['agree', 'confused', 'repeat', 'interesting'], required: true },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: null },
  },
  { timestamps: true }
);

const Feedback: Model<IFeedback> = mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export default Feedback;
