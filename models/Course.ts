import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourseEnrollment {
  userId?: string;
  email: string;
  name?: string;
  enrolledAt: Date;
}

export interface ICourseOutline {
  learnerLevel?: string;
  estimatedDuration?: string;
  learningOutcomes?: string[];
  modules?: Array<{
    title: string;
    description?: string;
    lessons?: Array<{ title: string; objective?: string; durationMinutes?: number; notes?: string; exercise?: string }>;
  }>;
  assessment?: string;
  instructorNotes?: string;
  markdown?: string;
  sourceUrl?: string;
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  code: string;
  instructorId: string;
  instructorEmail: string;
  instructorName: string;
  organizationId: string | null;
  status: 'draft' | 'active' | 'archived';
  enrolledStudents: ICourseEnrollment[];
  outline?: ICourseOutline;
  createdAt: Date;
  updatedAt: Date;
}

const CourseEnrollmentSchema = new Schema<ICourseEnrollment>(
  {
    userId: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true },
    name: { type: String, default: '' },
    enrolledAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    code: { type: String, required: true, index: true },
    instructorId: { type: String, required: true, index: true },
    instructorEmail: { type: String, required: true, lowercase: true, index: true },
    instructorName: { type: String, default: '' },
    organizationId: { type: String, default: null, index: true },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
    enrolledStudents: { type: [CourseEnrollmentSchema], default: [] },
    outline: {
      learnerLevel: { type: String, default: '' },
      estimatedDuration: { type: String, default: '' },
      learningOutcomes: { type: [String], default: [] },
      modules: { type: [Schema.Types.Mixed], default: [] },
      assessment: { type: String, default: '' },
      instructorNotes: { type: String, default: '' },
      markdown: { type: String, default: '' },
      sourceUrl: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

CourseSchema.index({ instructorEmail: 1, status: 1 });
CourseSchema.index({ 'enrolledStudents.email': 1 });

const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
