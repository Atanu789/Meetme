import mongoose, { Schema, Document, Model } from 'mongoose';

interface IWhiteboard extends Document {
  meetingId: string;
  elements: unknown[];
  appState: Record<string, unknown>;
  sceneFiles: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const WhiteboardSchema = new Schema<IWhiteboard>(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    elements: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    appState: {
      type: Schema.Types.Mixed,
      default: {},
    },
    sceneFiles: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const ExistingWhiteboard = mongoose.models.Whiteboard as Model<IWhiteboard> | undefined;

if (ExistingWhiteboard && !ExistingWhiteboard.schema.path('sceneFiles')) {
  delete mongoose.models.Whiteboard;
}

const Whiteboard: Model<IWhiteboard> =
  mongoose.models.Whiteboard || mongoose.model<IWhiteboard>('Whiteboard', WhiteboardSchema);

export default Whiteboard;
