import { Request, Response } from "express";
import Post from "../models/Post";
import { AuthRequest } from "../middleware/auth";
import { generateSlug } from "../utils/slugfy";
import mongoose from "mongoose";

/**
 * GET /api/posts
 */
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email")
      .populate("category", "name slug")
      .populate("tags", "name slug")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err });
  }
};

/**
 * GET /api/posts/:id
 */
export const getPostById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id))
    return res.status(400).json({ error: "Invalid ID" });

  try {
    const post = await Post.findById(id)
      .populate("author", "name email")
      .populate("category", "name slug")
      .populate("tags", "name slug");

    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err });
  }
};

/**
 * POST /api/posts
 * Protected - author or admin
 * multipart/form-data with optional image field named "image"
 */
export const addPost = async (req: AuthRequest, res: Response) => {
  try {
    // if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    console.log(req.body)
    const { title, slug, content, category, tags, seo, published } = req.body;

    if (!title || !content || !category || !seo) {
      return res
        .status(400)
        .json({ error: "title, content, category and seo are required" });
    }

    const finalSlug = slug ? slug.toString() : generateSlug(title);

    // Parse tags safely
    let parsedTags: any[] = [];
    if (tags) {
      if (typeof tags === "string") {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          return res.status(400).json({ error: "Invalid tags JSON" });
        }
      } else parsedTags = tags;
    }

    // Parse SEO safely
    let parsedSeo: object;
    if (typeof seo === "string") {
      try {
        parsedSeo = JSON.parse(seo);
      } catch {
        return res.status(400).json({ error: "Invalid SEO JSON" });
      }
    } else {
      parsedSeo = seo;
    }

    // Create post directly with Post.create (returns populated document type)
    const postDoc = await Post.create({
      title,
      slug: finalSlug,
      content,
      author: req.user?.id?req.user.id: "68ae1145a564344c2e6e03fb",
      category,
      tags: parsedTags,
      seo: parsedSeo,
      featuredImage: req.file?.path,
      published: published === "true" || published === true,
    });

    // Now populate safely
    const populatedPost = await Post.findById(postDoc._id)
      .populate("author", "name email")
      .populate("category", "name slug")
      .populate("tags", "name slug")
      .exec(); // exec() returns a Query, TypeScript is happy

    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(400).json({
      error: "Invalid data",
      details: err instanceof Error ? err.message : err,
    });
  }
};

/**
 * PUT /api/posts/:id
 * Protected - author or admin. If author, must own the post.
 */
export const updatePost = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const existing = await Post.findById(id);
    if (!existing) return res.status(404).json({ error: "Post not found" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (
      req.user.role !== "admin" &&
      existing.author.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { title, slug, content, category, tags, seo, published } = req.body;

    if (title) existing.title = title;
    if (slug) existing.slug = slug;
    if (content) existing.content = content;
    if (category) existing.category = category;

    // Tags
    if (tags) {
      if (typeof tags === "string") {
        try {
          existing.tags = JSON.parse(tags);
        } catch {
          return res.status(400).json({ error: "Invalid tags JSON" });
        }
      } else existing.tags = tags;
    }

    // SEO
    if (seo) {
      if (typeof seo === "string") {
        try {
          existing.seo = JSON.parse(seo);
        } catch {
          return res.status(400).json({ error: "Invalid SEO JSON" });
        }
      } else existing.seo = seo;
    }

    if (published !== undefined)
      existing.published = published === "true" || published === true;

    if (req.file?.path) existing.featuredImage = req.file.path;

    await existing.save();

    // Populate using a new query
    const populated = await Post.findById(existing._id)
      .populate("author", "name email")
      .populate("category", "name slug")
      .populate("tags", "name slug")
      .exec();

    res.json(populated);
  } catch (err) {
    res.status(400).json({
      error: "Invalid update request",
      details: err instanceof Error ? err.message : err,
    });
  }
};


/**
 * DELETE /api/posts/:id
 * Protected - admin or author (owner)
 */
export const deletePost = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id))
    return res.status(400).json({ error: "Invalid ID" });

  try {
    const existing = await Post.findById(id);
    if (!existing) return res.status(404).json({ error: "Post not found" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (
      req.user.role !== "admin" &&
      existing.author.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await Post.findByIdAndDelete(id);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err });
  }
};
