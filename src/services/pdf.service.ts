import { PDFParse } from "pdf-parse";
import fs from "fs/promises";
import "../config/cloudinary.js";

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const data = await parser.getText();
  return data.text.trim();
}
