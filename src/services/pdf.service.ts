// Temporarily disabled PDF parsing to fix serverless deployment
// import { PDFParse } from "pdf-parse";
// import fs from "fs/promises";
// import "../config/cloudinary.js";

export async function extractTextFromPDF(filePath: string): Promise<string> {
  // Temporary stub - PDF parsing disabled for serverless compatibility
  console.log("PDF parsing temporarily disabled for serverless deployment");
  return "PDF parsing is currently disabled";
  // const dataBuffer = await fs.readFile(filePath);
  // const parser = new PDFParse({ data: dataBuffer });
  // const data = await parser.getText();
  // return data.text.trim();
}
