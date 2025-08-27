import { Schema, model, Document, Types } from "mongoose";

export interface ISEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

export interface IPost extends Document {
  title: string;
  slug: string;
  content: string;
  author: string;
  category: Types.ObjectId;
  tags: Types.ObjectId[];
  // featuredImage?: string;
  seo: ISEO;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const seoSchema = new Schema<ISEO>({
  metaTitle: { type: String, required: true, maxlength: 60 },
  metaDescription: { type: String, required: true, maxlength: 160 },
  keywords: [{ type: String }],
  canonicalUrl: { type: String },
  ogImage: { type: String },
});

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    seo: { type: seoSchema, required: true },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model<IPost>("Post", postSchema);
