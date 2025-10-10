import { Router } from "express";
import * as resumeController from "../controller/resume.controller.js";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.use(authenticate);

// setup multer
const upload = multer({ dest: "uploads/" });

router.get("/:userId", resumeController.getResumes);
router.post(
  "/analyze",
  upload.single("resume"),
  resumeController.createAnalyis
);
router.get("/:userId/:id", resumeController.getResumeById);

export default router;
