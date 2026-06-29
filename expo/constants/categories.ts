export type CategoryGroup = {
  id: string;
  title: string;
  freeAccess: boolean;
  cards: { id: string; label: string; image: string; members: string }[];
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "goals",
    title: "Relationship Goals",
    freeAccess: true,
    cards: [
      { id: "long", label: "Long-term partner", members: "1.2K", image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600" },
      { id: "long-open", label: "Long-term, open to short", members: "812", image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600" },
      { id: "short-open", label: "Short-term, open to long", members: "654", image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600" },
      { id: "short", label: "Short-term fun", members: "421", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600" },
    ],
  },
  {
    id: "lifestyle",
    title: "Similar plans and lifestyles",
    freeAccess: true,
    cards: [
      { id: "wants-kids", label: "Wants Kids", members: "612", image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600" },
      { id: "child-free", label: "Child-Free", members: "240", image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600" },
      { id: "family", label: "Family First", members: "510", image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600" },
    ],
  },
  {
    id: "religion",
    title: "Religion",
    freeAccess: false,
    cards: [
      { id: "christian", label: "Christian", members: "780", image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600" },
      { id: "catholic", label: "Catholic", members: "412", image: "https://images.unsplash.com/photo-1473177104440-ffee2f376098?w=600" },
      { id: "traditional", label: "Hmong Tradition", members: "660", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600" },
      { id: "none", label: "No Religion", members: "215", image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600" },
    ],
  },
  {
    id: "dialect",
    title: "Dialect",
    freeAccess: false,
    cards: [
      { id: "green", label: "Green Hmong", members: "920", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600" },
      { id: "white", label: "White Hmong", members: "1.1K", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600" },
    ],
  },
  {
    id: "state",
    title: "State",
    freeAccess: false,
    cards: [
      { id: "ca", label: "California", members: "2.1K", image: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600" },
      { id: "mn", label: "Minnesota", members: "3.4K", image: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=600" },
      { id: "wi", label: "Wisconsin", members: "1.6K", image: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600" },
      { id: "nc", label: "North Carolina", members: "780", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600" },
    ],
  },
  {
    id: "clan",
    title: "Clan",
    freeAccess: false,
    cards: ["Chang","Cheng","Fang","Her","Khang","Kong","Kue","Lee","Lor","Moua","Pha","Thao","Vang","Vue","Xiong","Yang","Hang","Cha"].map((c, i) => {
      // Rotate through a small pool of family / community / culture images so the
      // clan grid doesn't show the same woman portrait for every card.
      const images = [
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600", // family
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600", // generations
        "https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=600", // family hands
        "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600", // mountains/heritage
        "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=600", // group at table
        "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600", // textiles
        "https://images.unsplash.com/photo-1542338347-4fff3276af78?w=600", // crowd
        "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=600", // candlelight
      ];
      return { id: c.toLowerCase(), label: `${c} Clan`, members: `${100 + i * 30}`, image: images[i % images.length] };
    }),
  },
  {
    id: "work",
    title: "Work",
    freeAccess: false,
    cards: [
      { id: "ft", label: "Full-time job", members: "1.4K", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600" },
      { id: "wfh", label: "Work from home", members: "612", image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600" },
      { id: "pt", label: "Part-time job", members: "388", image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600" },
    ],
  },
  {
    id: "education",
    title: "Education",
    freeAccess: false,
    cards: [
      { id: "hs", label: "High School", members: "240", image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600" },
      { id: "college", label: "College", members: "910", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600" },
      { id: "bachelor", label: "Bachelor", members: "1.1K", image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600" },
      { id: "phd", label: "PhD", members: "120", image: "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=600" },
      { id: "masters", label: "Masters", members: "440", image: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600" },
      { id: "trade", label: "Trade School", members: "260", image: "https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=600" },
    ],
  },
  {
    id: "outdoor",
    title: "Outdoor",
    freeAccess: false,
    cards: [
      { id: "fishing", label: "Fishing", members: "510", image: "https://images.unsplash.com/photo-1545972154-9bb223aac798?w=600" },
      { id: "hiking", label: "Hiking", members: "812", image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600" },
      { id: "camping", label: "Camping", members: "640", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600" },
    ],
  },
  {
    id: "hmong-culture",
    title: "Hmong Culture",
    freeAccess: false,
    cards: [
      { id: "clan-trad", label: "Clan Traditions", members: "1.3K", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600" },
      { id: "hmong-food", label: "Hmong Food", members: "1.7K", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600" },
      { id: "outdoor-mkt", label: "Outdoor Markets", members: "510", image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600" },
    ],
  },
  {
    id: "food",
    title: "Food",
    freeAccess: false,
    cards: [
      { id: "pho", label: "Pho", members: "920", image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600" },
      { id: "bbq", label: "BBQ", members: "880", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600" },
      { id: "trucks", label: "Food Trucks", members: "440", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600" },
      { id: "boba", label: "Boba", members: "1.2K", image: "https://images.unsplash.com/photo-1558857563-c0c6ee6ff8a4?w=600" },
    ],
  },
  {
    id: "music",
    title: "Music",
    freeAccess: false,
    cards: [
      { id: "country", label: "Country", members: "320", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600" },
      { id: "gospel", label: "Gospel", members: "210", image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600" },
      { id: "rock", label: "Rock", members: "450", image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600" },
      { id: "hmong", label: "Hmong", members: "910", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600" },
      { id: "kpop", label: "K-Pop", members: "780", image: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=600" },
      { id: "hiphop", label: "Hip Hop and R&B", members: "640", image: "https://images.unsplash.com/photo-1571974599782-87624638275e?w=600" },
    ],
  },
  {
    id: "sports",
    title: "Sports",
    freeAccess: false,
    cards: [
      { id: "football", label: "Football", members: "660", image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600" },
      { id: "basketball", label: "Basketball", members: "840", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600" },
      { id: "baseball", label: "Baseball", members: "320", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600" },
      { id: "running", label: "Running", members: "510", image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600" },
      { id: "hmong-sports", label: "Hmong Sports", members: "440", image: "https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=600" },
    ],
  },
  {
    id: "daily",
    title: "Daily Activities",
    freeAccess: false,
    cards: [
      { id: "coffee", label: "Coffee", members: "920", image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=600" },
      { id: "workout", label: "Workout", members: "612", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600" },
      { id: "running2", label: "Running", members: "440", image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600" },
      { id: "smoking", label: "Smoking", members: "120", image: "https://images.unsplash.com/photo-1527015175922-36a306cf0e20?w=600" },
      { id: "drinking", label: "Drinking", members: "340", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600" },
    ],
  },
  {
    id: "pets",
    title: "Pets",
    freeAccess: false,
    cards: [
      { id: "dogs", label: "Dogs", members: "1.4K", image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600" },
      { id: "cats", label: "Cats", members: "920", image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600" },
      { id: "fish", label: "Fish", members: "210", image: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600" },
      { id: "birds", label: "Birds", members: "180", image: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=600" },
    ],
  },
];
