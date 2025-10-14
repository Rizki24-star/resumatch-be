import { Request, Response } from "express";
import Resume from "../models/Resume.js";
import { analyzeResume } from "../services/ai.service.js";
import { uploadPDF } from "../services/storage.service.js";
import { ensureMongoDBConnection } from "../config/mongodb.js";
import * as pdfjslib from "pdfjs-dist/legacy/build/pdf.mjs";
import { TextItem } from "pdfjs-dist/types/src/display/api.js";
import { formatTextContent } from "../utils/pdf.js";

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
    // Ensure MongoDB connection before proceeding
    const isConnected = await ensureMongoDBConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: "Database connection failed. Please try again later.",
      });
    }

    const { companyName, jobTitle, jobDescription, userId, tenantId } =
      req.body;

    console.log("Request analysis: ", req.body);

    const preserveFormatting = true;

    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Resume file required" });
    }

    console.log(
      "Processing file in memory:",
      file.originalname,
      "size:",
      file.size
    );

    const data = file instanceof Buffer ? new Uint8Array(file) : file.buffer;

    console.log("Processing file in memory:", file.buffer);
    const loadingTask = pdfjslib.getDocument({
      data: new Uint8Array(file.buffer),
      useSystemFonts: true,
      useWorkerFetch: false,
      isEvalSupported: false,
      maxImageSize: 1024 * 1024 * 20,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = Math.min(pdfDocument.numPages, 5 /* max pages */);

    const textPages: string[] = [];

    let pageText = "";
    console.log("Staring extraction");
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      if (preserveFormatting) {
        // Preserve approximate layout
        pageText = formatTextContent(textContent.items as TextItem[]);
        textPages.push(pageText);
      } else {
        // Simple concatenation
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        textPages.push(pageText);
      }

      // Clean up page resources
      page.cleanup();
    }

    console.log("Starting uploading...");
    // // Use buffer directly instead of file path
    // const resumeText = await extractTextFromPDF(file.buffer);
    const { pdfUrl: resumePath, thumbnailUrl: imagePath } = await uploadPDF(
      file.buffer,
      file.originalname
    );

    // No need to delete temp file since we're using memory storage
    console.log("File processed from memory");

    const { feedback, metadata } = await analyzeResume({
      resumeText: pageText,
      jobTitle,
      jobDescription,
    });

    const resume = new Resume({
      userId: userId,
      tenantId: tenantId,
      companyName,
      jobTitle,
      jobDescription,
      resumePath,
      imagePath,
      feedback,
      ...metadata,
    });

    await resume.save();

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
      error: error.message,
    });
  }
};

export const getResumes = async (req: Request, res: Response) => {
  try {
    // Ensure MongoDB connection before proceeding
    const isConnected = await ensureMongoDBConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: "Database connection failed. Please try again later.",
      });
    }

    const { userId } = req.params;
    console.log("Getting resume by  user id", userId);
    const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });

    res.json({ succes: true, data: resumes });
  } catch (error: any) {
    console.error("Failed get resume by id: ", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getResumeById = async (req: Request, res: Response) => {
  try {
    // Ensure MongoDB connection before proceeding
    const isConnected = await ensureMongoDBConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: "Database connection failed. Please try again later.",
      });
    }

    const { userId, id } = req.params;
    const resume = await Resume.findOne({
      _id: id,
      userId: userId,
    });

    console.log("Get resume by id: ", resume);

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    res.json({ success: true, data: resume });
  } catch (error: any) {
    console.error("Failed get resume by id: ", error);
    res.status(500).json({ error: error.message });
  }
};
