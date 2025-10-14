import { TextItem } from "pdfjs-dist/types/src/display/api";

// PDF parsing disabled for serverless deployment to avoid DOM dependencies
// export const extractTextFromPDF = async (
//   input: string | Buffer
// ): Promise<string> => {
//   try {
//     console.log(
//       "PDF parsing temporarily disabled for serverless compatibility - using stub response"
//     );
//     return "PDF text extraction is currently disabled in serverless environment. Please use local development for full functionality.";
//   } catch (error) {
//     console.error("Error in PDF extraction stub:", error);
//     throw new Error("Failed to extract text from PDF");
//   }
// };

export function formatTextContent(items: TextItem[]): string {
  let lastY = -1;
  let text = "";

  items.forEach((item) => {
    // Check if it's a TextItem with transform property
    if ("transform" in item && Array.isArray(item.transform)) {
      const currentY = item.transform[5];

      // Add line break if Y position changed significantly
      if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
        text += "\n";
      }

      text += item.str;
      lastY = currentY;

      // Add space if the item ends without punctuation
      if (item.str && !item.str.match(/[.,:;!?\-\s]$/)) {
        text += " ";
      }
    } else {
      text += item.str + " ";
    }
  });

  return text.trim();
}
