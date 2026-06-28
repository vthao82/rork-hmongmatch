/**
 * Firestore integration smoke-test for Hmong Date core flows.
 *
 * Validates the Firestore data layer that the new RN code depends on:
 *   - Profile schema (hometownCity, hometownState, photoVerified)
 *   - Swipe + Match creation (deterministic matchId)
 *   - Chat: write to matches/{matchId}/messages and read back with onSnapshot-like query
 *   - Location-sort: cohort filter by hometownState
 *
 * Run: node /tmp/admin-test/integration.mjs
 *
 * Cleans up all test docs at the end.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const SVC_PATH = "/app/rork-hmongmatch/expo/scripts/service-account.json";
const svc = JSON.parse(readFileSync(SVC_PATH, "utf-8"));
const app = initializeApp({ credential: cert(svc) });
const db = getFirestore(app);

const TEST_PREFIX = "qa_int_";
const TEST_UIDS = [`${TEST_PREFIX}alice`, `${TEST_PREFIX}bob`, `${TEST_PREFIX}charlie`, `${TEST_PREFIX}dave`];

function ok(label, cond, extra = "") {
  const status = cond ? "PASS" : "FAIL";
  const icon = cond ? "✓" : "✗";
  console.log(`  ${icon} ${label} — ${status} ${extra}`);
  if (!cond) process.exitCode = 1;
}

function getMatchId(a, b) {
  return [a, b].sort().join("_");
}

async function cleanup() {
  console.log("\n[cleanup] removing test docs…");
  for (const uid of TEST_UIDS) {
    // Delete subcollection /users/{uid}/swipes
    const swipes = await db.collection("users").doc(uid).collection("swipes").get();
    for (const d of swipes.docs) await d.ref.delete();
    await db.collection("users").doc(uid).delete().catch(() => {});
  }
  // Delete matches between any of these uids
  const matches = await db.collection("matches").where("userIds", "array-contains-any", TEST_UIDS).get();
  for (const m of matches.docs) {
    // wipe message subcollection first
    const msgs = await m.ref.collection("messages").get();
    for (const md of msgs.docs) await md.ref.delete();
    await m.ref.delete();
  }
  console.log("[cleanup] done.");
}

async function main() {
  console.log("\n=== Firestore Integration Smoke Test ===\n");

  // 1) Pre-clean (in case of prior failed run)
  await cleanup();

  // 2) Seed 4 test users with varying hometownState
  console.log("\n[1] Seed users with hometown for location-sort test");
  const profiles = [
    { uid: TEST_UIDS[0], name: "Alice (MN)",   hometownCity: "Saint Paul", hometownState: "Minnesota", photos: ["https://placehold.co/600x800"], photoVerified: true },
    { uid: TEST_UIDS[1], name: "Bob (MN)",     hometownCity: "Minneapolis", hometownState: "Minnesota", photos: ["https://placehold.co/600x800"], photoVerified: false },
    { uid: TEST_UIDS[2], name: "Charlie (CA)", hometownCity: "Fresno",      hometownState: "California", photos: ["https://placehold.co/600x800"], photoVerified: true },
    { uid: TEST_UIDS[3], name: "Dave (WI)",    hometownCity: "Eau Claire",  hometownState: "Wisconsin", photos: ["https://placehold.co/600x800"], photoVerified: true },
  ];
  for (const p of profiles) {
    await db.collection("users").doc(p.uid).set({
      name: p.name,
      birthday: "01/01/1995",
      clan: "Vang",
      lookingFor: "long",
      interests: ["Music", "Food"],
      hometownCity: p.hometownCity,
      hometownState: p.hometownState,
      photos: p.photos,
      photoVerified: p.photoVerified,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  const aliceDoc = await db.collection("users").doc(TEST_UIDS[0]).get();
  ok("Alice profile created", aliceDoc.exists);
  ok("hometownState saved",   aliceDoc.data()?.hometownState === "Minnesota");
  ok("hometownCity saved",    aliceDoc.data()?.hometownCity === "Saint Paul");
  ok("photoVerified flag",    aliceDoc.data()?.photoVerified === true);

  // 3) Swipe + Match (Alice ↔ Bob mutual like)
  console.log("\n[2] Mutual swipe creates a match doc");
  const alice = TEST_UIDS[0], bob = TEST_UIDS[1];
  await db.collection("users").doc(alice).collection("swipes").doc(bob).set({ liked: true, createdAt: FieldValue.serverTimestamp() });
  await db.collection("users").doc(bob).collection("swipes").doc(alice).set({ liked: true, createdAt: FieldValue.serverTimestamp() });
  const matchId = getMatchId(alice, bob);
  await db.collection("matches").doc(matchId).set({ userIds: [alice, bob].sort(), createdAt: FieldValue.serverTimestamp() }, { merge: true });
  const mDoc = await db.collection("matches").doc(matchId).get();
  ok("match doc exists with deterministic id", mDoc.exists);
  ok("matchId is sorted-uid join", matchId === [alice, bob].sort().join("_"));
  const uids = mDoc.data()?.userIds ?? [];
  ok("userIds contains both",      uids.includes(alice) && uids.includes(bob));

  // 4) Chat: write message via Admin SDK, then read via query ordered by createdAt asc
  console.log("\n[3] Chat: messages roundtrip (write → ordered read)");
  const m1 = await db.collection("matches").doc(matchId).collection("messages").add({
    senderId: alice,
    text: "Hi Bob!",
    createdAt: FieldValue.serverTimestamp(),
    readBy: [alice],
  });
  await new Promise(r => setTimeout(r, 50));
  const m2 = await db.collection("matches").doc(matchId).collection("messages").add({
    senderId: bob,
    text: "Hey Alice!",
    createdAt: FieldValue.serverTimestamp(),
    readBy: [bob],
  });
  await new Promise(r => setTimeout(r, 50));
  const m3 = await db.collection("matches").doc(matchId).collection("messages").add({
    senderId: alice,
    text: "Want to meet up?",
    createdAt: FieldValue.serverTimestamp(),
    readBy: [alice],
  });

  const msgsSnap = await db.collection("matches").doc(matchId).collection("messages").orderBy("createdAt", "asc").get();
  ok("3 messages stored",            msgsSnap.size === 3);
  const ordered = msgsSnap.docs.map(d => d.data().text);
  ok("messages ordered by createdAt asc", ordered[0] === "Hi Bob!" && ordered[1] === "Hey Alice!" && ordered[2] === "Want to meet up?", `got ${JSON.stringify(ordered)}`);
  const first = msgsSnap.docs[0].data();
  ok("message has senderId field",   typeof first.senderId === "string");
  ok("message has text field",       typeof first.text === "string");
  ok("createdAt is Timestamp",       first.createdAt instanceof Timestamp);
  ok("readBy is array",              Array.isArray(first.readBy));

  // 5) Unread count semantics: Bob viewing thread → messages NOT in his readBy that he didn't send
  console.log("\n[4] Unread count (perspective of Bob)");
  let unreadForBob = 0;
  for (const d of msgsSnap.docs) {
    const r = d.data();
    if (r.senderId !== bob && !(r.readBy ?? []).includes(bob)) unreadForBob++;
  }
  ok("Bob has 2 unread from Alice", unreadForBob === 2, `got ${unreadForBob}`);

  // 6) Mark a message read (arrayUnion) — emulates markMessageRead() from lib/chat.ts
  console.log("\n[5] markMessageRead: arrayUnion adds uid without duplicates");
  await db.collection("matches").doc(matchId).collection("messages").doc(m1.id).update({ readBy: FieldValue.arrayUnion(bob) });
  await db.collection("matches").doc(matchId).collection("messages").doc(m1.id).update({ readBy: FieldValue.arrayUnion(bob) }); // idempotent
  const m1After = await db.collection("matches").doc(matchId).collection("messages").doc(m1.id).get();
  const readers = m1After.data()?.readBy ?? [];
  ok("Bob now in readBy",         readers.includes(bob));
  ok("Alice still in readBy",     readers.includes(alice));
  ok("no duplicate Bob",          readers.filter(r => r === bob).length === 1, `readers=${JSON.stringify(readers)}`);

  // 7) Latest-message thread query (used by useChatThreads): orderBy desc limit 20
  console.log("\n[6] Latest-message thread query");
  const latestSnap = await db.collection("matches").doc(matchId).collection("messages").orderBy("createdAt", "desc").limit(20).get();
  ok("latest first is 'Want to meet up?'", latestSnap.docs[0].data().text === "Want to meet up?");

  // 8) Matches query for current user (array-contains)
  console.log("\n[7] useMyMatches query for Alice");
  const aliceMatches = await db.collection("matches").where("userIds", "array-contains", alice).get();
  ok("Alice sees 1 match",       aliceMatches.size === 1);
  const otherUid = aliceMatches.docs[0].data().userIds.find(u => u !== alice);
  ok("other party is Bob",       otherUid === bob);

  // 9) Location-sort cohort verification (logic mirrors sortByLocation in discoverProfiles.ts)
  console.log("\n[8] Location sort cohorts (Alice in MN sees MN→others)");
  // Gather all candidate profiles (exclude Alice, exclude already-swiped Bob)
  const all = await db.collection("users").get();
  const aliceSwipes = await db.collection("users").doc(alice).collection("swipes").get();
  const swipedSet = new Set(aliceSwipes.docs.map(d => d.id));
  const candidates = [];
  all.forEach(d => {
    if (d.id === alice) return;
    if (swipedSet.has(d.id)) return;
    if (!d.id.startsWith(TEST_PREFIX)) return; // only score our test users
    candidates.push({ id: d.id, ...d.data() });
  });
  const norm = v => (v ?? "").toString().trim().toLowerCase();
  const me = { city: "saint paul", state: "minnesota" };
  const score = p => {
    const pc = norm(p.hometownCity), ps = norm(p.hometownState);
    if (pc === me.city && ps === me.state) return 3;
    if (ps === me.state) return 2;
    return 1;
  };
  const sorted = candidates.sort((a, b) => score(b) - score(a));
  ok("candidates exclude Alice & Bob", candidates.length === 2, `got ${candidates.length}`);
  // After Bob (the only MN candidate) is swiped, remaining (CA, WI) all score 1 — that's still correct sort order
  const hasMN = sorted.some(p => norm(p.hometownState) === me.state);
  ok("MN candidate (if present) is first",
    !hasMN || score(sorted[0]) >= 2,
    `top score=${sorted.length ? score(sorted[0]) : 'n/a'}, hasMN=${hasMN}`);
  ok("sort order is non-increasing by score",
    sorted.every((_, i) => i === 0 || score(sorted[i]) <= score(sorted[i - 1])));

  // 9b) Pre-swipe location-sort: Alice has not yet swiped anyone → Bob (MN) should be top
  console.log("\n[8b] Pre-swipe location-sort with Bob in pool");
  // Clear Alice's swipes to simulate fresh start
  const aliceSwipesAll = await db.collection("users").doc(alice).collection("swipes").get();
  for (const d of aliceSwipesAll.docs) await d.ref.delete();
  const all2 = await db.collection("users").get();
  const fresh = [];
  all2.forEach(d => {
    if (d.id === alice) return;
    if (!d.id.startsWith(TEST_PREFIX)) return;
    fresh.push({ id: d.id, ...d.data() });
  });
  const sortedFresh = fresh.sort((a, b) => score(b) - score(a));
  ok("Bob (MN) is at the top of fresh queue", sortedFresh[0]?.id === bob,
     `top=${sortedFresh[0]?.id} (score=${sortedFresh.length ? score(sortedFresh[0]) : 'n/a'})`);
  ok("score(MN) > score(CA)", score(fresh.find(p => p.id === bob)) > score(fresh.find(p => p.id === TEST_UIDS[2])));

  console.log("\n=== summary ===");
  if (process.exitCode === 1) {
    console.log("❌ Some checks FAILED — see above.");
  } else {
    console.log("✅ All Firestore integration checks passed.");
  }
}

main()
  .catch(e => {
    console.error("[FATAL]", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await cleanup(); } catch (e) { console.log("cleanup warn", e?.message); }
    process.exit(process.exitCode ?? 0);
  });
