import { Schema, type Types } from 'mongoose';
import type { ThemeSlug } from '@hackathonfinder/shared';
import { defineModel } from './define';

export type WinResult = 'winner' | 'runner-up' | 'finalist';

/** A student's write-up of how they won (or made the finals). */
export interface IWin {
  _id: Types.ObjectId;
  /** Readable id used in URLs (/wins/[slug]). */
  slug: string;
  authorId: Types.ObjectId;
  hackathon: string;
  hackathonSlug?: string;
  city?: string;
  result: WinResult;
  prize: string;
  projectName: string;
  tagline: string;
  themes: ThemeSlug[];
  techStack: string[];
  team: string[];
  sections: { problem: string; built: string; won: string; lessons: string };
  links: { demo?: string; github?: string };
  coverUrl?: string;
  cheers: number;
  deletedAt?: Date | null;
  /** Who removed it: the author, or an admin moderating. */
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICheer {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  winId: Types.ObjectId;
  createdAt: Date;
}

const sectionText = { type: String, trim: true, maxlength: 4000, default: '' };

const winSchema = new Schema<IWin>(
  {
    slug: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hackathon: { type: String, required: true, trim: true, maxlength: 120 },
    hackathonSlug: { type: String, trim: true },
    city: { type: String, trim: true },
    result: { type: String, enum: ['winner', 'runner-up', 'finalist'], required: true },
    prize: { type: String, trim: true, maxlength: 120, default: '' },
    projectName: { type: String, required: true, trim: true, maxlength: 80 },
    tagline: { type: String, trim: true, maxlength: 160, default: '' },
    themes: { type: [String], default: [] },
    techStack: { type: [String], default: [] },
    team: { type: [String], default: [] },
    sections: {
      problem: sectionText,
      built: sectionText,
      won: sectionText,
      lessons: sectionText,
    },
    links: {
      demo: { type: String, trim: true },
      github: { type: String, trim: true },
    },
    coverUrl: { type: String, trim: true },
    cheers: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);
winSchema.index({ slug: 1 }, { unique: true });
winSchema.index({ deletedAt: 1, createdAt: -1 });
winSchema.index({ authorId: 1, createdAt: -1 });
winSchema.index({ result: 1, city: 1 });
winSchema.index({ projectName: 'text', hackathon: 'text', tagline: 'text', techStack: 'text' }, { name: 'win_text' });

const cheerSchema = new Schema<ICheer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    winId: { type: Schema.Types.ObjectId, ref: 'Win', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
cheerSchema.index({ userId: 1, winId: 1 }, { unique: true });

export const Win = defineModel<IWin>('Win', winSchema);
export const Cheer = defineModel<ICheer>('Cheer', cheerSchema);
