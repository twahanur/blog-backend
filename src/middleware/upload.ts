import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "blog-images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: `blog_${Date.now()}`,
  }),
});

export const upload = multer({ storage });
