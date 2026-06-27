import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

/**
 * True if the URI is already a Firebase Storage (or any https) URL.
 */
export function isRemoteUrl(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

/**
 * Upload a local image (file://...) to Firebase Storage at
 * `users/{userId}/photos/{photoId}.jpg`. Returns the public download URL.
 *
 * If the URI is already remote, it's returned as-is (no re-upload).
 */
export async function uploadPhotoAsync(
  userId: string,
  localUri: string,
  photoId: string
): Promise<string> {
  if (!userId) throw new Error("uploadPhotoAsync: missing userId");
  if (!localUri) throw new Error("uploadPhotoAsync: missing localUri");
  if (isRemoteUrl(localUri)) return localUri;

  // Fetch the file from the local URI and convert to a Blob.
  const response = await fetch(localUri);
  const blob = await response.blob();

  const path = `users/${userId}/photos/${photoId}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, { contentType: blob.type || "image/jpeg" });
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
