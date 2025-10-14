import { Router } from "express";
import * as resumeController from "../controller/resume.controller.js";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.use(authenticate);

// setup multer for serverless environment (memory storage)
console.log(
  "Setting up multer with memory storage for serverless compatibility"
);
const upload = multer({ storage: multer.memoryStorage() });

router.get("/:userId", resumeController.getResumes);
router.post(
  "/analyze",
  upload.single("resume"),
  resumeController.createAnalysis
);

router.post("/:userId/:id/delete", resumeController.deleteResume);

router.get("/:userId/:id", resumeController.getResumeById);

export default router;
