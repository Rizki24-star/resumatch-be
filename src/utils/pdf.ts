import { PDFParse } from "pdf-parse";
import { readFile } from "node:fs/promises";

export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  try {
    const buffer = await readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    return textResult.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
};
