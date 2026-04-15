import mongoose, { Schema, Document, Model } from 'mongoose';

interface IMeeting extends Document {
  meetingId: string;
  hostId: string;
  hostEmail: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    hostId: {
      type: String,
      required: true,
    },
    hostEmail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
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

const Meeting: Model<IMeeting> =
  mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);

export default Meeting;
