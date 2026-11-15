import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove, serverTimestamp, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";

export type EventStatus = "pending" | "approved" | "rejected";
export type HmongEvent = {
  id: string;
  title: string;
  description: string;
  venue: string;
  city: string;
  state: string;
  dateText: string;
  timeText: string;
  startsAt: number;
  status: EventStatus;
  createdBy: string;
  going: string[];
  notGoing: string[];
  goingHidden: string[];
};

export type EventComment = { id: string; uid: string; text: string; parentId: string | null; replyTo: string | null; createdAt: number };

function toEvent(id: string, d: Record<string, any>): HmongEvent {
  return {
    id,
    title: d.title ?? "",
    description: d.description ?? "",
    venue: d.venue ?? "",
    city: d.city ?? "",
    state: d.state ?? "",
    dateText: d.dateText ?? "",
    timeText: d.timeText ?? "",
    startsAt: typeof d.startsAt === "number" ? d.startsAt : 0,
    status: d.status ?? "pending",
    createdBy: d.createdBy ?? "",
    going: Array.isArray(d.going) ? d.going : [],
    notGoing: Array.isArray(d.notGoing) ? d.notGoing : [],
    goingHidden: Array.isArray(d.goingHidden) ? d.goingHidden : [],
  };
}

/** Parse "MM/DD/YYYY" → local midnight millis, or null. */
export function parseEventDate(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return Number.isNaN(d.getTime()) || d.getMonth() !== Number(m[1]) - 1 ? null : d.getTime();
}

function useEventQuery(field: "status" | "createdBy", value: string | null) {
  const [events, setEvents] = useState<HmongEvent[]>([]);
  const { user } = useAuth();
  useEffect(() => {
    if (!user || !value) { setEvents([]); return; }
    return onSnapshot(
      query(collection(db, "events"), where(field, "==", value)),
      (snap) => setEvents(snap.docs.map((d) => toEvent(d.id, d.data())).sort((a, b) => a.startsAt - b.startsAt)),
      (e) => console.log("[events] query error", field, e)
    );
  }, [user?.uid, field, value]);
  return events;
}

export const useApprovedEvents = () => useEventQuery("status", "approved");
export const usePendingEvents = (isAdmin: boolean) => useEventQuery("status", isAdmin ? "pending" : null);
export const useMyEvents = () => useEventQuery("createdBy", auth.currentUser?.uid ?? null);

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  const [admin, setAdmin] = useState<boolean>(false);
  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    return onSnapshot(doc(db, "users", user.uid), (s) => setAdmin(s.data()?.isAdmin === true), () => setAdmin(false));
  }, [user?.uid]);
  return admin;
}

export async function suggestEvent(e: Omit<HmongEvent, "id" | "status" | "createdBy" | "going" | "notGoing" | "goingHidden">): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  await addDoc(collection(db, "events"), { ...e, status: "pending", createdBy: uid, going: [], createdAt: serverTimestamp() });
}

export type Rsvp = "going" | "notGoing" | null;

/** Going / not going (or clear); showProfile decides if I appear in "Who's going". */
export async function setRsvp(eventId: string, rsvp: Rsvp, showProfile = true): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(db, "events", eventId), {
    going: rsvp === "going" ? arrayUnion(uid) : arrayRemove(uid),
    notGoing: rsvp === "notGoing" ? arrayUnion(uid) : arrayRemove(uid),
    goingHidden: rsvp === "going" && !showProfile ? arrayUnion(uid) : arrayRemove(uid),
  });
}

export function useEventComments(eventId: string | undefined, enabled: boolean) {
  const [comments, setComments] = useState<EventComment[]>([]);
  const { user } = useAuth();
  useEffect(() => {
    if (!user || !eventId || !enabled) { setComments([]); return; }
    return onSnapshot(
      query(collection(db, "events", eventId, "comments"), orderBy("createdAt", "asc")),
      (snap) => setComments(snap.docs.map((d) => {
        const x = d.data();
        return { id: d.id, uid: x.uid ?? "", text: x.text ?? "", parentId: typeof x.parentId === "string" ? x.parentId : null, replyTo: typeof x.replyTo === "string" ? x.replyTo : null, createdAt: x.createdAt?.toMillis?.() ?? Date.now() };
      })),
      (e) => console.log("[events] comments error", e)
    );
  }, [user?.uid, eventId, enabled]);
  return comments;
}

/** parentId = top-level thread; replyTo = the exact comment answered (its author gets the push). */
export async function addEventComment(eventId: string, text: string, parentId: string | null, replyTo: string | null): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  await addDoc(collection(db, "events", eventId, "comments"), { uid, text: text.trim(), parentId, replyTo, createdAt: serverTimestamp() });
}

export const deleteEventComment = (eventId: string, commentId: string) => deleteDoc(doc(db, "events", eventId, "comments", commentId));

export const reviewEvent = (eventId: string, status: "approved" | "rejected") => updateDoc(doc(db, "events", eventId), { status, reviewedAt: serverTimestamp() });
export const removeEvent = (eventId: string) => deleteDoc(doc(db, "events", eventId));
