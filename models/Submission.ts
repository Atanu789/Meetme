import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubmissionGrade {
  score?: number | null;
  feedback?: string;
  gradedById?: string;
  gradedByEmail?: string;
  gradedAt?: Date | null;
}

export interface ISubmission extends Document {
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  content: string;
  attachmentPaths: string[];
  status: 'draft' | 'submitted' | 'returned';
  submittedAt?: Date | null;
  grade: ISubmissionGrade;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    assignmentId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentEmail: { type: String, required: true, lowercase: true, index: true },
    studentName: { type: String, default: '' },
    content: { type: String, default: '' },
    attachmentPaths: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'submitted', 'returned'], default: 'submitted' },
    submittedAt: { type: Date, default: Date.now },
    grade: {
      score: { type: Number, default: null },
      feedback: { type: String, default: '' },
      gradedById: { type: String, default: '' },
      gradedByEmail: { type: String, default: '' },
      gradedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

SubmissionSchema.index({ assignmentId: 1, studentEmail: 1 }, { unique: true });

const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);

export default Submission;
