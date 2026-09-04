/**
 * Account deletion — nukes everything associated with the current Firebase user.
 *
 * Steps (best-effort; each step swallows its own errors so a single failure
 * doesn't block the rest):
 *   1. Delete every photo the user uploaded (Firebase Storage).
 *   2. Delete every swipe subdoc under /users/{uid}/swipes/*.
 *   3. Delete the user's push token doc if present.
 *   4. Delete the /users/{uid} main doc.
 *   5. Delete the Firebase Auth user (requires a recent sign-in).
 *
 * We do NOT delete match documents or messages here — those are shared with the
 * other party. Instead, /users/{uid} vanishing causes the other side of any
 * match to fall back to a "deleted user" placeholder, per our Privacy Policy.
 *
 * Requires the user to have signed in recently (Firebase Auth's
 * `requires-recent-login` guard). If it throws with that code, the caller
 * should prompt the user to re-authenticate and retry.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { deleteUser, type User } from "firebase/auth";
import { ref, listAll, deleteObject } from "firebase/storage";

import { db, storage, auth } from "@/lib/firebase";
import { forgetRevenueCatUser } from "@/lib/revenuecat";

async function safeDeleteAllUserPhotos(uid: string): Promise<void> {
  try {
    const folderRef = ref(storage, `users/${uid}`);
    const listing = await listAll(folderRef);
    await Promise.all(
      listing.items.map((itemRef) =>
        deleteObject(itemRef).catch((e) => console.log("[delete-account] photo delete", itemRef.fullPath, e))
      )
    );
    // Recurse one level (folders like users/{uid}/verify/*)
    await Promise.all(
      listing.prefixes.map(async (folder) => {
        try {
          const sub = await listAll(folder);
          await Promise.all(sub.items.map((f) => deleteObject(f).catch(() => {})));
        } catch (e) {
          console.log("[delete-account] subfolder", folder.fullPath, e);
        }
      })
    );
  } catch (e) {
    console.log("[delete-account] listAll failed", e);
  }
}

async function safeDeleteSubcollection(uid: string, subPath: string): Promise<void> {
  try {
    const snap = await getDocs(collection(db, "users", uid, subPath));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
  } catch (e) {
    console.log(`[delete-account] subcollection ${subPath}`, e);
  }
}

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; code: "requires-recent-login" }
  | { ok: false; code: "not-signed-in" }
  | { ok: false; code: "unknown"; message: string };

export async function deleteMyAccount(): Promise<DeleteAccountResult> {
  const user: User | null = auth.currentUser;
  if (!user) return { ok: false, code: "not-signed-in" };

  const uid = user.uid;

  // 1. RevenueCat: log out first so anonymous purchases don't linger under this uid
  try { await forgetRevenueCatUser(); } catch (_e) {}

  // 2. Storage: all uploaded photos + verification selfies
  await safeDeleteAllUserPhotos(uid);

  // 3. Firestore: known subcollections under /users/{uid}
  await safeDeleteSubcollection(uid, "swipes");

  // 4. Firestore: push token document
  try {
    const tokenSnap = await getDoc(doc(db, "users", uid, "meta", "pushToken"));
    if (tokenSnap.exists()) await deleteDoc(tokenSnap.ref);
  } catch (e) {
    console.log("[delete-account] push token", e);
  }

  // 5. Firestore: main /users/{uid} doc
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (e) {
    console.log("[delete-account] main doc", e);
  }

  // 6. Firebase Auth user — MUST be last because it revokes the token
  try {
    await deleteUser(user);
    return { ok: true };
  } catch (e: any) {
    const code = e?.code === "auth/requires-recent-login"
      ? "requires-recent-login"
      : "unknown";
    console.log("[delete-account] auth delete", e);
    return code === "requires-recent-login"
      ? { ok: false, code: "requires-recent-login" }
      : { ok: false, code: "unknown", message: e?.message ?? "Delete failed" };
  }
}
