// E2E check of matching, likes inbox, chat delivery, gender filter, selfie verify against LIVE rules.
import { initializeApp as adminInit, cert } from "firebase-admin/app";
import { getAuth as adminAuth } from "firebase-admin/auth";
import { getFirestore as adminDb } from "firebase-admin/firestore";
import { getStorage as adminStorage } from "firebase-admin/storage";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, onSnapshot,
  addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, orderBy, deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { readFileSync } from "node:fs";

const svc = JSON.parse(readFileSync("/root/admin-tools/sa.json", "utf-8"));
adminInit({ credential: cert(svc), storageBucket: "hmong-date.firebasestorage.app" });
const cfg = {
  apiKey: "AIzaSyBQqlH0RZbce5tBTNenN7PA4u3uEwfBaVQ",
  authDomain: "hmong-date.firebaseapp.com",
  projectId: "hmong-date",
  storageBucket: "hmong-date.firebasestorage.app",
};
const PW = "QaTest!2026x";
const USERS = {
  m: { email: "qa_e2e_m@hmongdate.test", genders: ["man"], seeking: ["women"] },
  w: { email: "qa_e2e_w@hmongdate.test", genders: ["woman"], seeking: ["men"] },
  w2: { email: "qa_e2e_w2@hmongdate.test", genders: ["woman"], seeking: ["women"] },
  e: { email: "qa_e2e_e@hmongdate.test", genders: ["man"], seeking: ["everyone"] },
};
let fails = 0;
const ok = (label, cond, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"} ${label} ${extra}`); if (!cond) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const denied = async (p) => { try { await p; return false; } catch (e) { return e.code === "permission-denied"; } };

// Same logic as lib/discoverProfiles.ts fitsSeeking
const SEEK = { men: "man", women: "woman", beyond: "beyond" };
function fitsSeeking(mySeeking, theirGenders) {
  const seek = (mySeeking ?? []).map((x) => x.toLowerCase());
  if (seek.length === 0 || seek.includes("everyone")) return true;
  const g = (theirGenders ?? []).map((x) => x.toLowerCase());
  return seek.some((s) => g.includes(SEEK[s] ?? s));
}

const C = {};
async function setup() {
  for (const [k, u] of Object.entries(USERS)) {
    let rec;
    try { rec = await adminAuth().getUserByEmail(u.email); } catch { rec = await adminAuth().createUser({ email: u.email, password: PW }); }
    const app = initializeApp(cfg, `qa-${k}`);
    const auth = getAuth(app);
    await signInWithEmailAndPassword(auth, u.email, PW);
    C[k] = { uid: rec.uid, db: getFirestore(app), st: getStorage(app), ...u };
  }
}
async function cleanup() {
  const db = adminDb();
  const uids = Object.values(C).map((c) => c.uid);
  for (const uid of uids) {
    for (const sub of ["swipes", "likesReceived", "private", "blocked", "blockedBy"]) {
      const s = await db.collection(`users/${uid}/${sub}`).get();
      for (const d of s.docs) await d.ref.delete();
    }
    await db.doc(`users/${uid}`).delete().catch(() => {});
    await adminStorage().bucket().file(`users/${uid}/photos/verification-selfie.jpg`).delete().catch(() => {});
    await adminAuth().deleteUser(uid).catch(() => {});
  }
  if (uids.length) {
    const m = await db.collection("matches").where("userIds", "array-contains-any", uids).get();
    for (const d of m.docs) {
      const msgs = await d.ref.collection("messages").get();
      for (const x of msgs.docs) await x.ref.delete();
      await d.ref.delete();
    }
  }
}

// Same calls as recordSwipe()
async function recordSwipe(me, target, liked) {
  await setDoc(doc(me.db, "users", me.uid, "swipes", target.uid), { liked, likerId: me.uid, targetId: target.uid, createdAt: serverTimestamp() });
  const inbox = doc(me.db, "users", target.uid, "likesReceived", me.uid);
  if (liked) await setDoc(inbox, { likerId: me.uid, createdAt: serverTimestamp() });
  else await deleteDoc(inbox).catch(() => {});
  if (!liked) return false;
  const theirs = await getDoc(doc(me.db, "users", target.uid, "swipes", me.uid));
  if (theirs.exists() && theirs.data().liked === true) {
    const ids = [me.uid, target.uid].sort();
    await setDoc(doc(me.db, "matches", ids.join("_")), { userIds: ids, createdAt: serverTimestamp() }, { merge: true });
    return true;
  }
  return false;
}

async function main() {
  await setup();
  const { m, w, w2, e } = C;

  console.log("\n[1] Profiles + selfie verification before profile doc exists");
  const blob = new Uint8Array(readFileSync("/root/admin-tools/selfie.jpg"));
  const sref = ref(w2.st, `users/${w2.uid}/photos/verification-selfie.jpg`);
  await uploadBytes(sref, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(sref);
  await setDoc(doc(w2.db, "users", w2.uid), { photoVerified: true, verificationSelfie: url, verifiedAt: serverTimestamp() }, { merge: true });
  for (const c of Object.values(C)) {
    const payload = { name: c.email.split("@")[0], genders: c.genders, seeking: c.seeking, photos: ["https://placehold.co/600x800"], updatedAt: serverTimestamp() };
    if (c !== w2) payload.photoVerified = false;
    await setDoc(doc(c.db, "users", c.uid), payload, { merge: true });
  }
  const w2doc = (await getDoc(doc(w2.db, "users", w2.uid))).data();
  ok("selfie upload + verified flag saved", w2doc.photoVerified === true && !!w2doc.verificationSelfie);
  ok("later profile sync did not downgrade verification", w2doc.photoVerified === true);

  console.log("\n[2] Gender filter (same rule as Discover)");
  const all = await getDocs(collection(m.db, "users"));
  const qaIds = new Set(Object.values(C).map((c) => c.uid));
  const feed = (viewer) => all.docs.filter((d) => qaIds.has(d.id) && d.id !== viewer.uid && fitsSeeking(viewer.seeking, d.data().genders)).map((d) => d.id);
  const mFeed = feed(m), wFeed = feed(w), eFeed = feed(e);
  ok("man seeking women sees only women", mFeed.length === 2 && mFeed.includes(w.uid) && mFeed.includes(w2.uid));
  ok("woman seeking men sees only men", wFeed.length === 2 && wFeed.includes(m.uid) && wFeed.includes(e.uid));
  ok("seeking everyone sees men and women", eFeed.length === 3);
  ok("capitalised genders still match", fitsSeeking(["women"], ["Woman"]) && !fitsSeeking(["women"], ["Man"]));

  console.log("\n[3] Like -> Likes You inbox (live)");
  let wLikers = [];
  const unsubInbox = onSnapshot(collection(w.db, "users", w.uid, "likesReceived"), (s) => { wLikers = s.docs.map((d) => d.id); });
  let mMatches = [];
  const unsubM = onSnapshot(query(collection(m.db, "matches"), where("userIds", "array-contains", m.uid)), (s) => { mMatches = s.docs.map((d) => d.id); });
  const first = await recordSwipe(m, w, true);
  await wait(2000);
  ok("first like is not a match", first === false);
  ok("woman sees man in Likes You live", wLikers.includes(m.uid));
  ok("third user cannot read woman's inbox", await denied(getDocs(collection(e.db, "users", w.uid, "likesReceived"))));
  ok("third user cannot fake a like into inbox", await denied(setDoc(doc(e.db, "users", w.uid, "likesReceived", m.uid), { likerId: m.uid })));
  await recordSwipe(m, w2, true);
  ok("user cannot read someone else's swipe on a third person", await denied(getDoc(doc(w.db, "users", m.uid, "swipes", w2.uid))));

  console.log("\n[4] Like back -> match (both sides live)");
  const second = await recordSwipe(w, m, true);
  await wait(2500);
  const matchId = [m.uid, w.uid].sort().join("_");
  ok("like back creates match", second === true);
  ok("first liker sees new match live (no reload)", mMatches.includes(matchId));
  ok("outsider cannot read match", await denied(getDoc(doc(e.db, "matches", matchId))));
  ok("participant cannot change userIds", await denied(updateDoc(doc(m.db, "matches", matchId), { userIds: [m.uid, e.uid].sort() })));

  console.log("\n[5] Chat delivery (recipient live)");
  let wMsgs = [];
  const unsubMsgs = onSnapshot(query(collection(w.db, "matches", matchId, "messages"), orderBy("createdAt", "asc")), (s) => { wMsgs = s.docs.map((d) => ({ id: d.id, ...d.data() })); }, (err) => console.log("recipient listener error", err.code));
  await setDoc(doc(m.db, "matches", matchId), { userIds: [m.uid, w.uid].sort(), lastMessageAt: serverTimestamp() }, { merge: true });
  await addDoc(collection(m.db, "matches", matchId, "messages"), { senderId: m.uid, text: "Hi there!", createdAt: serverTimestamp(), readBy: [m.uid] });
  for (let i = 0; i < 20 && !wMsgs.some((x) => x.text === "Hi there!"); i++) await wait(500);
  ok("recipient receives message live", wMsgs.some((x) => x.text === "Hi there!"));
  if (wMsgs[0]) await updateDoc(doc(w.db, "matches", matchId, "messages", wMsgs[0].id), { readBy: arrayUnion(w.uid) });
  await addDoc(collection(w.db, "matches", matchId, "messages"), { senderId: w.uid, text: "Hello back", createdAt: serverTimestamp(), readBy: [w.uid] });
  const mRead = await getDocs(collection(m.db, "matches", matchId, "messages"));
  ok("reply delivered + read receipt saved", mRead.size === 2 && mRead.docs.some((d) => (d.data().readBy || []).includes(w.uid)));
  ok("outsider cannot read messages", await denied(getDocs(collection(e.db, "matches", matchId, "messages"))));
  ok("cannot send as someone else", await denied(addDoc(collection(m.db, "matches", matchId, "messages"), { senderId: w.uid, text: "spoof", createdAt: serverTimestamp() })));

  console.log("\n[6] Paid direct message to a non-match creates the thread for both");
  const dmId = [e.uid, w2.uid].sort().join("_");
  let w2Matches = [];
  const unsubW2 = onSnapshot(query(collection(w2.db, "matches"), where("userIds", "array-contains", w2.uid)), (s) => { w2Matches = s.docs.map((d) => d.id); });
  await setDoc(doc(e.db, "matches", dmId), { userIds: [e.uid, w2.uid].sort(), lastMessageAt: serverTimestamp() }, { merge: true });
  await addDoc(collection(e.db, "matches", dmId, "messages"), { senderId: e.uid, text: "DM", createdAt: serverTimestamp(), readBy: [e.uid] });
  await wait(2000);
  ok("recipient of direct message sees the thread live", w2Matches.includes(dmId));

  console.log("\n[7] Pass removes like from inbox");
  await recordSwipe(m, w2, false);
  const w2Inbox = await getDocs(collection(w2.db, "users", w2.uid, "likesReceived"));
  ok("passed user no longer in Likes You", !w2Inbox.docs.some((d) => d.id === m.uid));

  console.log("\n[8] Unfinished sign-up draft (resume where left off)");
  const draftRef = (c, owner) => doc(c.db, "users", owner.uid, "private", "onboarding");
  await setDoc(draftRef(e, e), { data: { name: "Draft", resumeStep: "hometown" }, updatedAt: serverTimestamp() });
  const back = await getDoc(draftRef(e, e));
  ok("owner can save + read sign-up draft", back.exists() && back.data().data.resumeStep === "hometown");
  ok("other users cannot read the draft", await denied(getDoc(draftRef(m, e))));
  ok("other users cannot overwrite the draft", await denied(setDoc(draftRef(m, e), { data: {} })));
  await deleteDoc(draftRef(e, e));
  ok("owner can delete draft after finishing", !(await getDoc(draftRef(e, e))).exists());

  console.log("\n[9] Blocking");
  const blk = async (me, other) => {
    await setDoc(doc(me.db, "users", me.uid, "blocked", other.uid), { name: "x", createdAt: serverTimestamp() });
    await setDoc(doc(me.db, "users", other.uid, "blockedBy", me.uid), { createdAt: serverTimestamp() });
    await updateDoc(doc(me.db, "matches", [me.uid, other.uid].sort().join("_")), { blockedBy: arrayUnion(me.uid) });
  };
  await blk(w, m);
  const mSeesBlockedBy = await getDocs(collection(m.db, "users", m.uid, "blockedBy"));
  ok("blocked person's app can see who blocked them (to hide them)", mSeesBlockedBy.docs.some((d) => d.id === w.uid));
  ok("nobody else can read my blocked list", await denied(getDocs(collection(m.db, "users", w.uid, "blocked"))));
  ok("blocked person cannot message the blocker", await denied(addDoc(collection(m.db, "matches", matchId, "messages"), { senderId: m.uid, text: "hey", createdAt: serverTimestamp() })));
  ok("blocker cannot message while block is on", await denied(addDoc(collection(w.db, "matches", matchId, "messages"), { senderId: w.uid, text: "hey", createdAt: serverTimestamp() })));
  ok("third user cannot fake a block on someone", await denied(setDoc(doc(e.db, "users", m.uid, "blockedBy", w.uid), { x: 1 })));
  // Unblock
  await deleteDoc(doc(w.db, "users", w.uid, "blocked", m.uid));
  await deleteDoc(doc(w.db, "users", m.uid, "blockedBy", w.uid));
  await updateDoc(doc(w.db, "matches", matchId), { blockedBy: arrayRemove(w.uid) });
  let afterUnblock = true;
  try { await addDoc(collection(m.db, "matches", matchId, "messages"), { senderId: m.uid, text: "back", createdAt: serverTimestamp() }); } catch { afterUnblock = false; }
  ok("after unblock, messaging works again", afterUnblock);

  console.log("\n[10] Match celebration shown once + presence");
  await updateDoc(doc(m.db, "matches", matchId), { celebratedBy: arrayUnion(m.uid) });
  const md = (await getDoc(doc(m.db, "matches", matchId))).data();
  ok("celebration recorded on match (won't show again)", md.celebratedBy.includes(m.uid) && !md.celebratedBy.includes(w.uid));
  await setDoc(doc(m.db, "users", m.uid), { lastActiveAt: serverTimestamp() }, { merge: true });
  const pres = (await getDoc(doc(w.db, "users", m.uid))).data();
  ok("active status saved and visible to others", !!pres.lastActiveAt && Date.now() - pres.lastActiveAt.toMillis() < 60000);
  ok("cannot write someone else's active status", await denied(setDoc(doc(w.db, "users", m.uid), { lastActiveAt: serverTimestamp() }, { merge: true })));

  unsubInbox(); unsubM(); unsubMsgs(); unsubW2();
}

main()
  .catch((err) => { console.error("FATAL", err); fails++; })
  .finally(async () => {
    await cleanup().catch((x) => console.log("cleanup warn", x.message));
    console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
    process.exit(fails ? 1 : 0);
  });
