/**
 * Seed 10 fake user profiles into Firestore at /users/*.
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
  // ============================================================
  // Minnesota (your home state — will sort to top of Discover)
  // ============================================================
  {
    id: "seed-nou-xiong",
    name: "Nou Xiong",
    birthday: "05/14/1997",
    clan: "Xiong",
    bio: "ICU nurse. Boba addict. Sunday morning farmer's market crawler. Looking for someone kind, curious, and unafraid of bad karaoke.",
    hometownCity: "St. Paul",
    hometownState: "Minnesota",
    hometownCountry: "USA",
    interests: ["Cooking", "Boba", "Yoga", "Farmer's Market"],
    dialect: "White Hmong",
    lookingFor: "Long-term",
    genders: ["Woman"],
    photos: [
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
      "https://images.unsplash.com/photo-1521252659862-eec69941b071?w=800",
    ],
    photoVerified: true,
  },
  {
    id: "seed-blia-her",
    name: "Blia Her",
    birthday: "11/02/1995",
    clan: "Her",
    bio: "Graphic designer. Twin Cities lifer. Plant mom of 23 (and counting). Looking for partner-in-crime, not roommate.",
    hometownCity: "Minneapolis",
    hometownState: "Minnesota",
    hometownCountry: "USA",
    interests: ["Design", "Plants", "Bookstores", "Tea"],
    dialect: "Green Hmong",
    lookingFor: "Relationship",
    genders: ["Woman"],
    photos: [
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
    ],
    photoVerified: true,
  },
  {
    id: "seed-koua-thao",
    name: "Koua Thao",
    birthday: "07/30/1991",
    clan: "Thao",
    bio: "Mechanical engineer. Bow hunter in fall, ice fisherman in winter. Looking for someone who can keep up — or at least laugh at me trying.",
    hometownCity: "Brooklyn Park",
    hometownState: "Minnesota",
    hometownCountry: "USA",
    interests: ["Hunting", "Fishing", "Cars", "Family"],
    dialect: "White Hmong",
    lookingFor: "Marriage",
    genders: ["Man"],
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",
    ],
    photoVerified: true,
  },
  {
    id: "seed-tong-lee",
    name: "Tong Lee",
    birthday: "09/12/1993",
    clan: "Lee",
    bio: "Pharmacist. Marathon runner. Big fan of Sunday pho. Looking for someone with hobbies and a sense of humor.",
    hometownCity: "Maplewood",
    hometownState: "Minnesota",
    hometownCountry: "USA",
    interests: ["Running", "Pho", "Concerts", "Travel"],
    dialect: "White Hmong",
    lookingFor: "Relationship",
    genders: ["Man"],
    photos: [
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=800",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800",
    ],
    photoVerified: false,
  },
  // ============================================================
  // Wisconsin (neighboring state — second priority)
  // ============================================================
  {
    id: "seed-mai-yang-2",
    name: "Mai Yang",
    birthday: "01/24/1994",
    clan: "Yang",
    bio: "Social worker. Wisconsin cheese loyalist. Looking for someone with patience, ambition, and a love for road-tripping.",
    hometownCity: "Eau Claire",
    hometownState: "Wisconsin",
    hometownCountry: "USA",
    interests: ["Road Trips", "Hiking", "Cooking", "Community"],
    dialect: "White Hmong",
    lookingFor: "Long-term",
    genders: ["Woman"],
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
    ],
    photoVerified: true,
  },
  {
    id: "seed-vue-vang",
    name: "Vue Vang",
    birthday: "04/08/1989",
    clan: "Vang",
    bio: "Small business owner — coffee shop in downtown Wausau. Looking for someone family-oriented who knows their way around a kitchen.",
    hometownCity: "Wausau",
    hometownState: "Wisconsin",
    hometownCountry: "USA",
    interests: ["Coffee", "Cooking", "Family", "Soccer"],
    dialect: "Green Hmong",
    lookingFor: "Marriage",
    genders: ["Man"],
    photos: [
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    ],
    photoVerified: true,
  },
  // ============================================================
  // California (large diaspora — common matches)
  // ============================================================
  {
    id: "seed-pa-lor",
    name: "Pa Lor",
    birthday: "06/19/1998",
    clan: "Lor",
    bio: "UX designer in the Bay. Surf lessons every Sunday. Looking for a thoughtful person, ideally one who'll text me back same day.",
    hometownCity: "San Jose",
    hometownState: "California",
    hometownCountry: "USA",
    interests: ["Design", "Surfing", "Art", "Tech"],
    dialect: "White Hmong",
    lookingFor: "Relationship",
    genders: ["Woman"],
    photos: [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800",
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800",
    ],
    photoVerified: true,
  },
  {
    id: "seed-cha-moua",
    name: "Cha Moua",
    birthday: "10/03/1990",
    clan: "Moua",
    bio: "ER doctor. Reformed gym rat. Looking for someone grounded who'll keep me honest about work-life balance.",
    hometownCity: "Sacramento",
    hometownState: "California",
    hometownCountry: "USA",
    interests: ["Fitness", "Travel", "Photography", "Medicine"],
    dialect: "White Hmong",
    lookingFor: "Long-term",
    genders: ["Man"],
    photos: [
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800",
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=800",
    ],
    photoVerified: true,
  },
  // ============================================================
  // Outside USA / further states (tail of queue)
  // ============================================================
  {
    id: "seed-mee-vue",
    name: "Mee Vue",
    birthday: "02/15/1996",
    clan: "Vue",
    bio: "Elementary school teacher. Loves volleyball and homemade laab. Bilingual in Hmong + English. Looking for someone who values family.",
    hometownCity: "Denver",
    hometownState: "Colorado",
    hometownCountry: "USA",
    interests: ["Teaching", "Volleyball", "Cooking", "Karaoke"],
    dialect: "White Hmong",
    lookingFor: "Marriage",
    genders: ["Woman"],
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800",
    ],
    photoVerified: false,
  },
  {
    id: "seed-meng-thao",
    name: "Meng Thao",
    birthday: "12/01/1992",
    clan: "Thao",
    bio: "Real estate agent. Weekend mountain biker. Loves a good Hmong New Year reunion. Looking for someone adventurous and warm.",
    hometownCity: "Anchorage",
    hometownState: "Alaska",
    hometownCountry: "USA",
    interests: ["Mountain Biking", "Travel", "Real Estate", "Hiking"],
    dialect: "Green Hmong",
    lookingFor: "Relationship",
    genders: ["Man"],
    photos: [
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",
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
