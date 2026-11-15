import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";

export type SuggestedCard = { id: string; groupId: string; label: string; status: "pending" | "approved" | "rejected"; createdBy: string };

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

export const usePendingCards = (isAdmin: boolean) => useCardQuery("status", isAdmin ? "pending" : null);

export async function suggestCard(groupId: string, label: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  await addDoc(collection(db, "interestCards"), { groupId, label: label.trim(), status: "pending", createdBy: uid, createdAt: serverTimestamp() });
}

export const reviewCard = (id: string, status: "approved" | "rejected") => updateDoc(doc(db, "interestCards", id), { status, reviewedAt: serverTimestamp() });
export const removeCard = (id: string) => deleteDoc(doc(db, "interestCards", id));

