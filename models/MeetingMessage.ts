import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMeetingMessage extends Document {
  meetingId: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingMessageSchema = new Schema<IMeetingMessage>(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderEmail: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
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

const MeetingMessage: Model<IMeetingMessage> =
  mongoose.models.MeetingMessage || mongoose.model<IMeetingMessage>('MeetingMessage', MeetingMessageSchema);

export default MeetingMessage;