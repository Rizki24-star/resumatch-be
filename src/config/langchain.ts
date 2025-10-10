import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

export const feedbackSchema = z.object({
  overallScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Overall resume score out of 100"),
  ATS: z
    .object({
      score: z.number().int().min(0).max(100),
      tips: z
        .array(
          z.object({
            type: z.enum(["good", "improve"]),
            tip: z.string().describe("Brief tip text"),
          })
        )
        .min(2)
        .describe("At least 2 tips required"),
    })
    .describe("ATS section; always include"),
  toneAndStyle: z
    .object({
      score: z.number().int().min(0).max(100),
      tips: z
        .array(
          z.object({
            type: z.enum(["good", "improve"]),
            tip: z
              .string()
              .describe("make it a short 'title' for the actual explanation"),
            explanation: z
              .string()
              .optional()
              .describe("Optional detailed explanation"),
          })
        )
        .min(2),
    })
    .describe("Tone and style section; always include"),
  content: z
    .object({
      score: z.number().int().min(0).max(100),
      tips: z
        .array(
          z.object({
            type: z.enum(["good", "improve"]),
            tip: z
              .string()
              .describe("make it a short 'title' for the actual explanation"),
            explanation: z.string(),
          })
        )
        .min(2),
    })
    .describe("Content section; always include"),
  structure: z
    .object({
      score: z.number().int().min(0).max(100),
      tips: z
        .array(
          z.object({
            type: z.enum(["good", "improve"]),
            tip: z
              .string()
              .describe("make it a short 'title' for the actual explanation"),
            explanation: z.string(),
          })
        )
        .min(2),
    })
    .describe("Structure section; always include"),
  skills: z
    .object({
      score: z.number().int().min(0).max(100),
      tips: z
        .array(
          z.object({
            type: z.enum(["good", "improve"]),
            tip: z
              .string()
              .describe("make it a short 'title' for the actual explanation"),
            explanation: z.string(),
          })
        )
        .min(2),
    })
    .describe("Skills section; always include"),
});

export const createLLM = (provider: string = "gemini") => {
  switch (provider) {
    case "gemini":
      return new ChatGoogleGenerativeAI({
        model: "gemini-2.5-pro",
        temperature: 0,
      });
    default:
      return new ChatGoogleGenerativeAI({
        model: "gemini-2.5-pro",
      });
  }
};

export const sampleFeedbackFormat = {
  overallScore: 85,
  ATS: {
    score: 80,
    tips: [
      { type: "good", tip: "Uses relevant keywords" },
      { type: "improve", tip: "Add more ATS-friendly formatting" },
    ],
  },
  toneAndStyle: {
    score: 90,
    tips: [
      {
        type: "good",
        tip: "Professional language (make it a short 'title' for the actual explanation)",
        explanation:
          "The resume uses formal and professional language throughout.",
      },
      {
        type: "improve",
        tip: "Vary sentence structure (make it a short 'title' for the actual explanation)",
        explanation:
          "Some sentences are repetitive; varying structure can improve readability.",
      },
      {
        type: "improve",
        tip: "Vary sentence structure (make it a short 'title' for the actual explanation)",
        explanation:
          "Some sentences are repetitive; varying structure can improve readability.",
      },
    ],
  },
  content: {
    score: 75,
    tips: [
      {
        type: "good",
        tip: "Clear achievements (make it a short 'title' for the actual explanation)",
        explanation: "Achievements are quantified and specific.",
      },
      {
        type: "improve",
        tip: "Include more details (make it a short 'title' for the actual explanation)",
        explanation:
          "Add more context to experiences to strengthen the content.",
      },
      {
        type: "improve",
        tip: "Include more details (make it a short 'title' for the actual explanation)",
        explanation:
          "Add more context to experiences to strengthen the content.",
      },
    ],
  },
  structure: {
    score: 88,
    tips: [
      {
        type: "good",
        tip: "Logical flow (make it a short 'title' for the actual explanation)",
        explanation: "Sections are organized in a logical order.",
      },
      {
        type: "improve",
        tip: "Use bullet points (make it a short 'title' for the actual explanation)",
        explanation: "Incorporate more bullet points for better scannability.",
      },
      {
        type: "improve",
        tip: "Use bullet points (make it a short 'title' for the actual explanation)",
        explanation: "Incorporate more bullet points for better scannability.",
      },
    ],
  },
  skills: {
    score: 82,
    tips: [
      {
        type: "good",
        tip: "Relevant skills listed (make it a short 'title' for the actual explanation)",
        explanation: "Skills match the job description well.",
      },
      {
        type: "improve",
        tip: "Prioritize key skills (make it a short 'title' for the actual explanation)",
        explanation: "Move the most important skills to the top.",
      },
      {
        type: "improve",
        tip: "Prioritize key skills (make it a short 'title' for the actual explanation)",
        explanation: "Move the most important skills to the top.",
      },
    ],
  },
};

export const resumePromptTemplate = PromptTemplate.fromTemplate(`
  You are an expert in ATS (Applicant Tracking System) and resume analysis.
  Please analyze and rate this resume and suggest how to improve it.
  The rating can be low if the resume is bad.
  Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
  If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.
  If available, use the job description for the job user is applying to to give more detailed feedback.
  If provided, take the job description into consideration.
  The job title is: {job_title}
  The job description is: {job_description}
  The resume text is: {resume_text}
  Provide feedback for ALL sections: overallScore (a number from 0-100), ATS, toneAndStyle, content, structure, skills.
  Even if the resume is poor, not a resume, or lacks relevant information, ALWAYS provide scores (0-100) and at least 2-3 tips (with type 'good' or 'improve', tip text but make it a short 'title' for the actual explanation, and optional explanation) for EACH section. Adapt tips to explain why the section is weak or missing.
  Return ONLY a valid JSON object with all required fields populated—no other text, markdown, or comments.
`);
