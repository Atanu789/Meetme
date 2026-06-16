import mongoose, { Schema, Document, Model } from 'mongoose';

interface IPollOption {
  id: string;
  label: string;
  votes: number;
}

export interface IPoll extends Document {
  meetingId: string;
  question: string;
  options: IPollOption[];
  createdBy?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema<IPollOption>({
  id: String,
  label: String,
  votes: { type: Number, default: 0 },
});

const PollSchema = new Schema<IPoll>(
  {
    meetingId: { type: String, required: true, index: true },
    question: { type: String, required: true },
    options: [PollOptionSchema],
    createdBy: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Poll: Model<IPoll> = mongoose.models.Poll || mongoose.model<IPoll>('Poll', PollSchema);

export default Poll;
