/**
 * Seed 5 fake user profiles into Firestore at /users/*.
 *
 * Setup (one-time):
 *   1) Go to Firebase Console → ⚙️ Project settings → Service accounts tab
 *      → click "Generate new private key" → save the JSON file as
 *      `service-account.json` in this folder (same dir as this script).
 *   2) Run from project root:
 *        node scripts/seed-profiles.mjs
 *
 * The service-account.json file is gitignored — never commit it.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVICE_ACCOUNT_PATH = resolve(__dirname, "service-account.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
} catch (e) {
  console.error(`\n❌ Could not read ${SERVICE_ACCOUNT_PATH}`);
  console.error("Please follow the setup steps at the top of this file.\n");
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const PROFILES = [
  {
    id: "seed-pamai-yang",
    name: "Pa Mai Yang",
    birthday: "03/12/1996",
    clan: "Yang",
    bio: "Coffee enthusiast, weekend hiker. Hmong food is my love language. Looking for someone to share quiet adventures with.",
    hometownCity: "St. Paul",
    hometownState: "MN",
    hometownCountry: "USA",
    interests: ["Cooking", "Hiking", "Coffee", "Reading"],
    dialect: "White Hmong",
    lookingFor: "Relationship",
    genders: ["Woman"],
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800",
    ],
    photoVerified: true,
  },
  {
    id: "seed-mai-vue",
    name: "Mai Vue",
    birthday: "08/25/1994",
    clan: "Vue",
    bio: "Nurse by day, foodie by night. I make a mean khaub poob. Coffee dates only on first meetings.",
    hometownCity: "Fresno",
    hometownState: "CA",
    hometownCountry: "USA",
    interests: ["Food", "Travel", "Photography", "Movies"],
    dialect: "Green Hmong",
    lookingFor: "Long-term",
    genders: ["Woman"],
    photos: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800",
    ],
    photoVerified: true,
  },
  {
    id: "seed-kalia-lor",
    name: "Kalia Lor",
    birthday: "11/05/1992",
    clan: "Lor",
    bio: "Teacher. Plant mom. Looking for someone who values family and isn't afraid of karaoke nights with the cousins.",
    hometownCity: "Milwaukee",
    hometownState: "WI",
    hometownCountry: "USA",
    interests: ["Gardening", "Karaoke", "Family", "Yoga"],
    dialect: "White Hmong",
    lookingFor: "Marriage",
    genders: ["Woman"],
    photos: [
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
    ],
    photoVerified: false,
  },
  {
    id: "seed-tou-thao",
    name: "Tou Thao",
    birthday: "06/18/1990",
    clan: "Thao",
    bio: "Software engineer, fisherman on weekends. Always down for a Hmong New Year trip. Bonus points if you can tolerate my dad jokes.",
    hometownCity: "Sacramento",
    hometownState: "CA",
    hometownCountry: "USA",
    interests: ["Fishing", "Coding", "BBQ", "Cars"],
    dialect: "White Hmong",
    lookingFor: "Relationship",
    genders: ["Man"],
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",
    ],
    photoVerified: true,
  },
  {
    id: "seed-chong-vang",
    name: "Chong Vang",
    birthday: "02/22/1988",
    clan: "Vang",
    bio: "Small business owner. Love taking road trips and trying new restaurants. Looking for someone who's ready to settle down.",
    hometownCity: "Minneapolis",
    hometownState: "MN",
    hometownCountry: "USA",
    interests: ["Road trips", "Food", "Soccer", "Family"],
    dialect: "Green Hmong",
    lookingFor: "Marriage",
    genders: ["Man"],
    photos: [
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800",
    ],
    photoVerified: true,
  },
];

async function run() {
  console.log(`Seeding ${PROFILES.length} profiles into /users …\n`);
  for (const p of PROFILES) {
    const { id, ...rest } = p;
    const data = {
      id,
      email: `${id}@seed.local`,
      seeking: [],
      orientations: [],
      showGender: true,
      showOrientation: true,
      genderDetail: null,
      mainPhotoIndex: 0,
      distance: null,
      distanceWorldwide: false,
      distanceUSOnly: true,
      dialectOther: null,
      workOther: null,
      work: null,
      religion: null,
      religionOther: null,
      education: null,
      lifestyle: {},
      extras: {},
      prompt: null,
      ...rest,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await db.collection("users").doc(id).set(data, { merge: true });
    console.log(`  ✓ ${p.name}  (${id})`);
  }
  console.log(`\n✅ Done. Open the app → Discover tab → swipe!`);
  process.exit(0);
}

run().catch((e) => {
  console.error("\n❌ Seed failed:", e);
  process.exit(1);
});
