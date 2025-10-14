import { Request, Response } from "express";
import Resume from "../models/Resume.js";
import { analyzeResume } from "../services/ai.service.js";
import { uploadPDF } from "../services/storage.service.js";
import { ensureMongoDBConnection } from "../config/mongodb.js";
import { extractTextFromPDF, isValidPDF } from "../utils/pdf.js";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}

export const createAnalyis = async (req: Request, res: Response) => {
  try {
    const isConnected = await ensureMongoDBConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: "Database connection failed. Please try again later.",
      });
    }

    const { companyName, jobTitle, jobDescription, userId, tenantId } =
      req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Resume file required",
      });
    }

    console.log("Processing PDF:", file.originalname, "Size:", file.size);

    // Validate PDF
    if (!isValidPDF(file.buffer)) {
      return res.status(400).json({
        success: false,
        error: "Invalid PDF file",
      });
    }

    // Extract text from PDF
    console.log("Extracting text from PDF...");
    const resumeText = await extractTextFromPDF(file.buffer, {
      maxPages: 5,
      preserveFormatting: true,
    });

    console.log(`Extracted ${resumeText.length} characters from PDF`);

    // Upload to storage
    console.log("Uploading to storage...");
    const { pdfUrl: resumePath, thumbnailUrl: imagePath } = await uploadPDF(
      file.buffer,
      file.originalname
    );

    // Analyze with AI
    console.log("Analyzing resume with AI...");
    const { feedback, metadata } = await analyzeResume({
      resumeText,
      jobTitle,
      jobDescription,
    });

    // Save to database
    const resume = new Resume({
      userId,
      tenantId,
      companyName,
      jobTitle,
      jobDescription,
      resumePath,
      imagePath,
      feedback,
      ...metadata,
    });

    await resume.save();

    console.log("Analysis completed successfully");

    res.json({
      success: true,
      data: {
        id: resume._id,
        feedback: resume.feedback,
        resumePath,
        imagePath,
      },
    });
  } catch (error: any) {
    console.error("Analysis failed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze resume",
    });
  }
};

export const getResumes = async (req: Request, res: Response) => {
  try {
    const isConnected = await ensureMongoDBConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: "Database connection failed. Please try again later.",
      });
    }

    const { userId } = req.params;
    console.log("Getting resumes for user:", userId);

    const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });

    res.json({ success: true, data: resumes });
  } catch (error: any) {
    console.error("Failed to get resumes:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve resumes",
    });
  }
};

export const getResumeById = async (req: Request, res: Response) => {
  try {
    const isConnected = await ensureMongoDBConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: "Database connection failed. Please try again later.",
      });
    }

    const { userId, id } = req.params;
    const resume = await Resume.findOne({ _id: id, userId });

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: "Resume not found",
      });
    }

    res.json({ success: true, data: resume });
  } catch (error: any) {
    console.error("Failed to get resume:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve resume",
    });
  }
};
