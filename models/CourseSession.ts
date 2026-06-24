import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourseRecording {
  title: string;
  url?: string;
  storagePath?: string;
  createdAt: Date;
}

export interface ICourseSession extends Document {
  courseId: string;
  meetingId: string;
  meetingTitle: string;
  startsAt: Date;
  endsAt?: Date | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  recordings: ICourseRecording[];
  createdById: string;
  createdByEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const CourseRecordingSchema = new Schema<ICourseRecording>(
  {
    title: { type: String, required: true },
    url: { type: String, default: '' },
    storagePath: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CourseSessionSchema = new Schema<ICourseSession>(
  {
    courseId: { type: String, required: true, index: true },
    meetingId: { type: String, required: false, index: true },
    meetingTitle: { type: String, default: '' },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, default: null },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    notes: { type: String, default: '' },
    recordings: { type: [CourseRecordingSchema], default: [] },
    createdById: { type: String, required: true },
    createdByEmail: { type: String, required: true, lowercase: true },
  },
  { timestamps: true }
);

CourseSessionSchema.index({ courseId: 1, startsAt: 1 });
// allow sessions without a linked Meeting by making the compound index sparse
CourseSessionSchema.index({ courseId: 1, meetingId: 1 }, { unique: true, sparse: true });

const CourseSession: Model<ICourseSession> =
  mongoose.models.CourseSession || mongoose.model<ICourseSession>('CourseSession', CourseSessionSchema);

export default CourseSession;
