import { useEffect, useMemo, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { CATEGORY_GROUPS } from "@/constants/categories";

export type SuggestedCard = { id: string; groupId: string; label: string; status: "pending" | "approved" | "rejected"; createdBy: string; image?: string };

function useCardQuery(field: "status" | "createdBy", value: string | null) {
  const { user } = useAuth();
  const [cards, setCards] = useState<SuggestedCard[]>([]);
  useEffect(() => {
    if (!user || !value) { setCards([]); return; }
    return onSnapshot(
      query(collection(db, "interestCards"), where(field, "==", value)),
      (snap) => setCards(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SuggestedCard, "id">) }))),
      (e) => console.log("[interestCards] query error", e)
    );
  }, [user?.uid, field, value]);
  return cards;
}

export const useApprovedCards = () => useCardQuery("status", "approved");
export const usePendingCards = (isAdmin: boolean) => useCardQuery("status", isAdmin ? "pending" : null);

/** Built-in groups plus admin-approved member suggestions (shared group photo). */
export function useCategoryGroups() {
  const approved = useApprovedCards();
  return useMemo(
    () =>
      CATEGORY_GROUPS.map((g) => {
        const extra = approved
          .filter((c) => c.groupId === g.id && !g.cards.some((x) => x.label.toLowerCase() === c.label.toLowerCase()))
          .map((c) => ({ id: `custom-${c.id}`, label: c.label, members: "New", image: c.image || g.cards[0]?.image || "" }));
        return extra.length ? { ...g, cards: [...g.cards, ...extra] } : g;
      }),
    [approved]
  );
}

export async function suggestCard(groupId: string, label: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  await addDoc(collection(db, "interestCards"), { groupId, label: label.trim(), status: "pending", createdBy: uid, createdAt: serverTimestamp() });
}

export const reviewCard = (id: string, status: "approved" | "rejected") => updateDoc(doc(db, "interestCards", id), { status, reviewedAt: serverTimestamp() });
export const removeCard = (id: string) => deleteDoc(doc(db, "interestCards", id));

/** Admin-only: AI-made photo for an approved card (Cloud Function, Gemini). */
export async function generateCardPhoto(cardId: string): Promise<string> {
  const res = await httpsCallable<{ cardId: string }, { image: string }>(functions, "generateCardPhoto", { timeout: 130000 })({ cardId });
  return res.data.image;
}
