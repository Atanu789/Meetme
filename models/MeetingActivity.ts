import mongoose, { Schema, Document, Model } from 'mongoose';

export type MeetingActivityType =
  | 'created'
  | 'joined'
  | 'left'
  | 'chat'
  | 'recording-started'
  | 'recording-stopped'
  | 'bot_started';

export interface IMeetingActivity extends Document {
  meetingId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  type: MeetingActivityType;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingActivitySchema = new Schema<IMeetingActivity>(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      required: true,
      enum: ['created', 'joined', 'left', 'chat', 'recording-started', 'recording-stopped', 'bot_started'],
    },
    details: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const MeetingActivity: Model<IMeetingActivity> =
  mongoose.models.MeetingActivity || mongoose.model<IMeetingActivity>('MeetingActivity', MeetingActivitySchema);

export default MeetingActivity;