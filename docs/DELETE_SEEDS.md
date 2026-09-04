# Delete Seed Profiles (Before Launch)

The `seed-*` profiles were used during development to fill Discover with fake profiles for solo-testing. As of commit-that-removed-them, the app **already filters them out of Discover** for real users (see the `startsWith("seed-")` guard in `expo/lib/discoverProfiles.ts`).

Deleting the actual docs from Firestore is optional but recommended before Play/App Store submission for cleanliness.

## Option 1 — Manual (Firebase Console, 2 min)

1. Open https://console.firebase.google.com → your Hmong Date project → **Firestore Database**.
2. Open the **`users`** collection.
3. Look for docs whose ID starts with `seed-` (e.g., `seed-mai`, `seed-panyia`).
4. Click each one → the `⋮` menu → **Delete document**.
5. Repeat for all 10 seed docs.

## Option 2 — Automated (Node script, 30 sec)

If `expo/scripts/service-account.json` still contains valid Firebase Admin credentials:

```bash
cd expo
node scripts/delete-seed-profiles.mjs
```

If that script doesn't exist yet, ask the agent to create it — it's a 15-line Admin SDK call.

## Also delete

- **Match docs** whose ID contains `seed-`. In `matches/` collection, look for IDs like `<youruid>_seed-mai`. Delete each. Their `messages/` subcollection is deleted with them.
- **Your own swipes on seed users**. In `users/<youruid>/swipes/`, delete docs whose ID starts with `seed-`.

## After deletion

Nothing else to do. The app will just show a "No more profiles right now" screen in Discover until real users sign up.

If you keep the seed profiles around for future dev/testing, the client filter will hide them from real users regardless — so there's no launch-blocker either way.
