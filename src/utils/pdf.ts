// PDF parsing disabled for serverless deployment to avoid DOM dependencies
export const extractTextFromPDF = async (
  input: string | Buffer
): Promise<string> => {
  try {
    console.log(
      "PDF parsing temporarily disabled for serverless compatibility - using stub response"
    );
    return "PDF text extraction is currently disabled in serverless environment. Please use local development for full functionality.";
  } catch (error) {
    console.error("Error in PDF extraction stub:", error);
    throw new Error("Failed to extract text from PDF");
  }
};
