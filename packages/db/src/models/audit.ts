import { Schema, type Types } from 'mongoose';
import { defineModel } from './define';

/**
 * One thing an admin changed: a ban, a removed listing, an approval, a scrape started.
 * Kept so the team can see who did what and when. Never holds secrets or passwords.
 */
export interface IAdminAction {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  /** Copied at the time, so the log still reads well if the admin's handle changes. */
  adminHandle: string;
  /** Short verb, e.g. "listing.remove", "user.ban", "scrape.start". */
  action: string;
  /** What it was done to: "listing", "user", "thread", "report", "source", "scrape", … */
  targetType: string;
  targetId?: string;
  /** One readable line, e.g. "Removed “DevFest Pune”: duplicate". */
  summary: string;
  meta: Record<string, unknown>;
  createdAt: Date;
}

const adminActionSchema = new Schema<IAdminAction>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminHandle: { type: String, default: '', maxlength: 40 },
    action: { type: String, required: true, maxlength: 60 },
    targetType: { type: String, required: true, maxlength: 40 },
    targetId: { type: String, maxlength: 120 },
    summary: { type: String, default: '', maxlength: 500 },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, minimize: false }
);
adminActionSchema.index({ createdAt: -1 });
adminActionSchema.index({ adminId: 1, createdAt: -1 });
adminActionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
adminActionSchema.index({ action: 1, createdAt: -1 });

export const AdminAction = defineModel<IAdminAction>('AdminAction', adminActionSchema);
