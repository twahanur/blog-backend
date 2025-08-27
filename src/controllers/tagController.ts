import { Request, Response } from "express";
import Tag, { ITag } from "../models/Tag";

export const createTag = async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }

    const exists = await Tag.findOne({ slug });
    if (exists) return res.status(400).json({ error: "Slug already exists" });

    const tag: ITag = new Tag({ name, slug });
    const saved = await tag.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err });
  }
};

export const getTags = async (req: Request, res: Response) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err });
  }
};
