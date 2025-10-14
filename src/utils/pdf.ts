import PDFParser from "pdf2json";

export interface ExtractTextOptions {
  maxPages?: number;
  preserveFormatting?: boolean;
}

/**
 * Extracts text from PDF buffer using pdf2json (serverless compatible)
 */
export async function extractTextFromPDF(
  buffer: Buffer,
  options: ExtractTextOptions = {}
): Promise<string> {
  const { maxPages = Infinity } = options;

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      console.error("PDF parsing error:", errData.parserError);
      reject(new Error(`Failed to parse PDF: ${errData.parserError}`));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const pages = pdfData.Pages || [];
        const numPages = Math.min(pages.length, maxPages);
        const textPages: string[] = [];

        for (let i = 0; i < numPages; i++) {
          const page = pages[i];
          const texts = page.Texts || [];

          // Extract text from each text element
          const pageText = texts
            .map((text: any) => {
              try {
                // Decode URI-encoded text
                return decodeURIComponent(text.R?.[0]?.T || "");
              } catch (decodeError) {
                // If decoding fails, return the raw text
                console.warn(
                  "Failed to decode URI text, using raw text:",
                  decodeError
                );
                return text.R?.[0]?.T || "";
              }
            })
            .filter((t: string) => t.trim().length > 0)
            .join(" ");

          textPages.push(pageText);
        }

        const fullText = textPages.join("\n\n--- Page Break ---\n\n");
        resolve(fullText);
      } catch (error) {
        console.error("PDF text extraction error:", error);
        reject(
          new Error(
            `Failed to extract text from PDF: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          )
        );
      }
    });

    // Parse the PDF buffer
    pdfParser.parseBuffer(buffer);
  });
}

/**
 * Validate PDF buffer
 */
export function isValidPDF(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.toString("utf8", 0, 4) === "%PDF";
}

/**
 * Get PDF metadata using pdf2json
 */
export async function getPDFMetadata(buffer: Buffer): Promise<{
  numPages: number;
  info: any;
  metadata: any;
}> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(new Error(`Failed to get PDF metadata: ${errData.parserError}`));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const result = {
          numPages: pdfData.Pages?.length || 0,
          info: {
            Title: pdfData.Meta?.Title || "",
            Author: pdfData.Meta?.Author || "",
            Creator: pdfData.Meta?.Creator || "",
            Producer: pdfData.Meta?.Producer || "",
          },
          metadata: pdfData.Meta || {},
        };
        resolve(result);
      } catch (error) {
        reject(
          new Error(
            `Failed to extract metadata: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          )
        );
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}
