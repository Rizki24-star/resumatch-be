import fs from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

export async function uploadFile(
  filePath: string,
  folder: "resumes" | "images",
  deleteAfter: boolean = true
): Promise<string> {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    console.log("Uploading file from:", absolutePath);

    // Check if file exists
    await fs.access(absolutePath);

    const result = await cloudinary.uploader.upload(absolutePath, {
      folder: `resume-analyzer/${folder}`,
      resource_type: folder === "resumes" ? "raw" : "image",
      use_filename: true,
      unique_filename: true,
    });

    // Only delete if flag is true
    if (deleteAfter) {
      await fs.unlink(absolutePath);
      console.log("Temp file deleted");
    }

    return result.secure_url;
  } catch (error: any) {
    console.error("File upload failed:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

export async function uploadPDF(
  filePath: string,
  deleteAfter: boolean = true
): Promise<{
  pdfUrl: string;
  thumbnailUrl: string;
}> {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    await fs.access(absolutePath);

    // Upload as raw for download
    const rawResult = await cloudinary.uploader.upload(absolutePath, {
      folder: `resume-analyzer/resume`,
      resource_type: "raw",
      use_filename: true,
      unique_filename: true,
    });

    // Upload as image for thumbnail generation
    const imageResult = await cloudinary.uploader.upload(absolutePath, {
      folder: `resume-analyzer/resume/thumbnails`,
      resource_type: "image",
      format: "pdf",
      use_filename: true,
      unique_filename: true,
    });

    // Generate thumbnail
    const thumbnailUrl = cloudinary.url(imageResult.public_id, {
      resource_type: "image",
      format: "jpg",
      transformation: [
        { page: 1 },
        { width: 800, height: 1200, crop: "fit" },
        { quality: "auto" },
      ],
    });

    // Only delete if requested
    if (deleteAfter) {
      await fs.unlink(absolutePath);
      console.log("Temp file deleted in uploadPDF");
    }

    return {
      pdfUrl: rawResult.secure_url,
      thumbnailUrl,
    };
  } catch (error: any) {
    console.error("File upload failed:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}
export async function uploadBuffer(
  buffer: Buffer,
  folder: "images",
  filename: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `resume-analyzer/${folder}`,
        public_id: filename,
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteFile(url: string): Promise<void> {
  try {
    // Extract public_id from URL
    const publicId = extractPublicId(url);
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("File deletion failed:", error);
  }
}

export function getSignedUrl(
  publicId: string,
  expiresIn: number = 3600
): string {
  const timestamp = Math.round(Date.now() / 1000) + expiresIn;

  return cloudinary.url(publicId, {
    sign_url: true,
    type: "authenticated",
    expires_at: timestamp,
  });
}

function extractPublicId(url: string): string {
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  const publicId = filename!.split(".")[0];
  return `resume-analyzer/${parts[parts.length - 2]}/${publicId}`;
}
