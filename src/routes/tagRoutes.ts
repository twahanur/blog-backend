import express from "express";
import { createTag, getTags } from "../controllers/tagController";

const router = express.Router();

router.post("/", createTag);
router.get("/", getTags);

export default router;
