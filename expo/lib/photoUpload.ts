import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import * as ImageManipulator from "expo-image-manipulator";
import { storage } from "@/lib/firebase";

const MAX_WIDTH = 1280; // resize so the longest side is at most 1280px
const COMPRESS_QUALITY = 0.7; // 0.7 ≈ great quality, ~10x smaller than original

/**
 * True if the URI is already a Firebase Storage (or any https) URL.
 */
export function isRemoteUrl(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

/**
 * Resize + JPEG-compress a local image. PNG screenshots become JPEGs.
 * Returns a new local file:// URI of the compressed image.
 */
async function compressImageAsync(localUri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: MAX_WIDTH } }],
      {
        compress: COMPRESS_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch (e) {
    console.log("[photoUpload] compress failed, using original", e);
    return localUri;
  }
}

/**
 * Upload a local image (file://...) to Firebase Storage at
 * `users/{userId}/photos/{photoId}.jpg`. Returns the public download URL.
 *
 * The image is resized to max 1280px wide and compressed to ~70% JPEG quality
 * before upload. If the URI is already remote, it's returned as-is.
 */
export async function uploadPhotoAsync(
  userId: string,
  localUri: string,
  photoId: string
): Promise<string> {
  if (!userId) throw new Error("uploadPhotoAsync: missing userId");
  if (!localUri) throw new Error("uploadPhotoAsync: missing localUri");
  if (isRemoteUrl(localUri)) return localUri;

  // Compress before upload to save storage cost and speed up everything downstream.
  const compressedUri = await compressImageAsync(localUri);

  // Fetch the compressed file and convert to a Blob.
  const response = await fetch(compressedUri);
  const blob = await response.blob();

  const path = `users/${userId}/photos/${photoId}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

/**
 * Delete a previously-uploaded photo by its Storage path or download URL.
 * Best-effort; failures are swallowed.
 */
export async function deletePhotoAsync(pathOrUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, pathOrUrl);
    await deleteObject(storageRef);
  } catch (e) {
    console.log("[photoUpload] delete failed (ignored)", e);
  }
}

/**
 * Generate a short random id for a new photo (avoids collisions on rapid uploads).
 */
export function newPhotoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
