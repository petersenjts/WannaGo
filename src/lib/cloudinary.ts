import { v2 as cloudinary } from "cloudinary";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Uploads an image buffer to Cloudinary, resizing it down to a sane max
 * (large phone photos shouldn't slow down the portal or Explore) and letting
 * Cloudinary pick the best format/quality for the viewer. Returns the
 * delivery URL to store on whatever record owns the photo.
 */
export async function uploadImage(buffer: Buffer, folder: string): Promise<string> {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL environment variable is not set");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export function uploadShortlistPhoto(buffer: Buffer): Promise<string> {
  return uploadImage(buffer, "wannago/shortlist-options");
}

export function uploadExplorePhoto(buffer: Buffer): Promise<string> {
  return uploadImage(buffer, "wannago/explore-listings");
}
