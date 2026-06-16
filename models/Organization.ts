import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISsoSettings {
  enabled: boolean;
  idpEntityId?: string;
  ssoUrl?: string;
  certificate?: string;
}

export interface IOrgPolicies {
  recordingAllowed: boolean;
  chatEnabled: boolean;
  requirePassword?: boolean;
}

export interface IOrganization extends Document {
  name: string;
  domain?: string;
  logoUrl?: string;
  billingPlan: string;
  ssoSettings: ISsoSettings;
  policies: IOrgPolicies;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      lowercase: true,
      index: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    billingPlan: {
      type: String,
      default: 'enterprise',
    },
    ssoSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },
      idpEntityId: {
        type: String,
        default: '',
      },
      ssoUrl: {
        type: String,
        default: '',
      },
      certificate: {
        type: String,
        default: '',
      },
    },
    policies: {
      recordingAllowed: {
        type: Boolean,
        default: true,
      },
      chatEnabled: {
        type: Boolean,
        default: true,
      },
      requirePassword: {
        type: Boolean,
        default: false,
      },
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

const Organization: Model<IOrganization> =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>('Organization', OrganizationSchema);

export default Organization;
