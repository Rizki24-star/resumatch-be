import { TextItem } from "pdfjs-dist/types/src/display/api";

// Lazy load pdfjs setelah polyfill
let pdfjsLib: any = null;

// Define polyfill classes at module level
class ImageDataPolyfill {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  constructor(
    widthOrData: number | Uint8ClampedArray,
    heightOrWidth?: number,
    settings?: any
  ) {
    if (widthOrData instanceof Uint8ClampedArray) {
      this.data = widthOrData;
      this.width = heightOrWidth!;
      this.height = widthOrData.length / (4 * heightOrWidth!);
    } else {
      this.width = widthOrData;
      this.height = heightOrWidth!;
      this.data = new Uint8ClampedArray(widthOrData * heightOrWidth! * 4);
    }
  }
}

// Minimal polyfill - hanya untuk text extraction
function setupPolyfills() {
  if (typeof globalThis.DOMMatrix === "undefined") {
    class DOMMatrixPolyfill {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = 0;
      f = 0;
      constructor(init?: number[] | string) {
        if (Array.isArray(init) && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }
    }
    (globalThis as any).DOMMatrix = DOMMatrixPolyfill;
  }

  if (typeof globalThis.Path2D === "undefined") {
    class Path2DPolyfill {
      moveTo() {}
      lineTo() {}
      bezierCurveTo() {}
      quadraticCurveTo() {}
      arc() {}
      arcTo() {}
      ellipse() {}
      rect() {}
      closePath() {}
    }
    (globalThis as any).Path2D = Path2DPolyfill;
  }

  if (typeof globalThis.ImageData === "undefined") {
    (globalThis as any).ImageData = ImageDataPolyfill;
  }

  if (typeof globalThis.OffscreenCanvas === "undefined") {
    class OffscreenCanvasPolyfill {
      width: number;
      height: number;
      constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
      }
      getContext() {
        // Return minimal context for text extraction
        return {
          canvas: this,
          fillStyle: "",
          strokeStyle: "",
          fillRect() {},
          strokeRect() {},
          clearRect() {},
          fillText() {},
          strokeText() {},
          measureText() {
            return { width: 0 };
          },
          save() {},
          restore() {},
          scale() {},
          rotate() {},
          translate() {},
          transform() {},
          setTransform() {},
          resetTransform() {},
          drawImage() {},
          createImageData: (w: number, h: number) =>
            new ImageDataPolyfill(w, h),
          getImageData: (x: number, y: number, w: number, h: number) =>
            new ImageDataPolyfill(w, h),
          putImageData() {},
        };
      }
      convertToBlob() {
        return Promise.resolve(new Blob());
      }
    }
    (globalThis as any).OffscreenCanvas = OffscreenCanvasPolyfill;
  }
}

async function loadPdfJs() {
  if (!pdfjsLib) {
    setupPolyfills();
    pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
    // Set empty worker for text-only extraction
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
  }
  return pdfjsLib;
}

export interface ExtractTextOptions {
  maxPages?: number;
  preserveFormatting?: boolean;
}

/**
 * Extracts text from PDF buffer
 */
export async function extractTextFromPDF(
  buffer: Buffer,
  options: ExtractTextOptions = {}
): Promise<string> {
  const { maxPages = Infinity, preserveFormatting = true } = options;

  try {
    const pdfjs = await loadPdfJs();
    const data = new Uint8Array(buffer);

    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: true,
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
      standardFontDataUrl: undefined,
      maxImageSize: 1024 * 1024 * 20,
      // Explicitly disable worker
      disableWorker: true,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = Math.min(pdfDocument.numPages, maxPages);
    const textPages: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      let pageText: string;
      if (preserveFormatting) {
        pageText = formatTextContent(textContent.items as TextItem[]);
      } else {
        pageText = textContent.items.map((item: any) => item.str).join(" ");
      }

      textPages.push(pageText);
      page.cleanup();
    }

    await pdfDocument.destroy();
    return textPages.join("\n\n--- Page Break ---\n\n");
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(
      `Failed to extract text from PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Format text content with approximate layout preservation
 */
function formatTextContent(items: TextItem[]): string {
  let lastY = -1;
  let text = "";

  items.forEach((item) => {
    if ("transform" in item && Array.isArray(item.transform)) {
      const currentY = item.transform[5];

      if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
        text += "\n";
      }

      text += item.str;
      lastY = currentY;

      if (item.str && !item.str.match(/[.,:;!?\-\s]$/)) {
        text += " ";
      }
    } else {
      text += item.str + " ";
    }
  });

  return text.trim();
}

/**
 * Validate PDF buffer
 */
export function isValidPDF(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.toString("utf8", 0, 4) === "%PDF";
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(buffer: Buffer): Promise<{
  numPages: number;
  info: any;
  metadata: any;
}> {
  try {
    const pdfjs = await loadPdfJs();
    const data = new Uint8Array(buffer);

    const loadingTask = pdfjs.getDocument({
      data,
      useWorkerFetch: false,
      disableFontFace: true,
      disableWorker: true,
    });

    const pdfDocument = await loadingTask.promise;
    const metadataResult = await pdfDocument.getMetadata();

    const result = {
      numPages: pdfDocument.numPages,
      info: metadataResult.info,
      metadata: metadataResult.metadata,
    };

    await pdfDocument.destroy();
    return result;
  } catch (error) {
    throw new Error(
      `Failed to get PDF metadata: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
