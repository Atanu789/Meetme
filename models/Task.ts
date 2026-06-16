import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
  meetingId?: string;
  title: string;
  description?: string;
  ownerName?: string;
  ownerEmail?: string | null;
  status: 'open' | 'in_progress' | 'done';
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    meetingId: { type: String, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    ownerEmail: { type: String, default: null },
    status: { type: String, enum: ['open', 'in_progress', 'done'], default: 'open' },
  },
  { timestamps: true }
);

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
