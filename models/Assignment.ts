import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAssignment extends Document {
  courseId: string;
  title: string;
  description: string;
  instructions: string;
  dueAt?: Date | null;
  pointsPossible: number;
  status: 'draft' | 'published' | 'closed';
  createdById: string;
  createdByEmail: string;
  createdByName: string;
  attachmentPaths: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    courseId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' },
    dueAt: { type: Date, default: null },
    pointsPossible: { type: Number, default: 100 },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
    createdById: { type: String, required: true },
    createdByEmail: { type: String, required: true, lowercase: true },
    createdByName: { type: String, default: '' },
    attachmentPaths: { type: [String], default: [] },
  },
  { timestamps: true }
);

AssignmentSchema.index({ courseId: 1, dueAt: 1 });

const Assignment: Model<IAssignment> =
  mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;
