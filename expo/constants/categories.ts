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
      { id: "long", label: "Long-term partner", members: "1.2K", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/beb94d5f5bca7224157074880c0f407bbe04029c4dcec595a0a1f66483c30851.jpeg" },
      { id: "long-open", label: "Long-term, open to short", members: "812", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/b59a1345d288b38c569af6249a8b259d4e50e84f2f3cea629c4da601ee5f1c68.jpeg" },
      { id: "short-open", label: "Short-term, open to long", members: "654", image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600" },
      { id: "short", label: "Short-term fun", members: "421", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600" },
    ],
  },
  {
    id: "lifestyle",
    title: "Similar plans and lifestyles",
    freeAccess: true,
    cards: [
      { id: "wants-kids", label: "Wants Kids", members: "612", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/f7ec73090602a121c501b3d34cbffe9b666f65b16edb28b2a283c531808609b1.jpeg" },
      { id: "child-free", label: "Child-Free", members: "240", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/5b04b25479dd3a6a1ce84936742170691299cc40a961c929402681b34c6a9620.jpeg" },
      { id: "family", label: "Family First", members: "510", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/7116c10880122a3630df3a7d27230434dd1a26383919abbcef98345679eda40c.jpeg" },
    ],
  },
  {
    id: "religion",
    title: "Religion",
    freeAccess: false,
    cards: [
      { id: "christian", label: "Christian", members: "780", image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600" },
      { id: "catholic", label: "Catholic", members: "412", image: "https://images.unsplash.com/photo-1473177104440-ffee2f376098?w=600" },
      { id: "traditional", label: "Hmong Tradition", members: "660", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/a27d8e0563f47ab8321eea2d0abfd0de7631b1cab1ca4054149cddfa78d4e757.jpeg" },
      { id: "none", label: "No Religion", members: "215", image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600" },
    ],
  },
  {
    id: "dialect",
    title: "Dialect",
    freeAccess: false,
    cards: [
      { id: "green", label: "Green Hmong", members: "920", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/0ac256ca6befc952f0be94b9c3385c1066542316536a828a21862d3a885880e4.jpeg" },
      { id: "white", label: "White Hmong", members: "1.1K", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/c1756e62783f67f00d31b454d45be345a7ba7a0c61aae9ed360d3920379c16c9.jpeg" },
    ],
  },
  {
    id: "state",
    title: "State",
    freeAccess: false,
    cards: [
      { id: "ca", label: "California", members: "2.1K", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/ac1fee415dc430d3eec7ddb97ff72405051c2d41020a43249b7285e0b2907e8d.jpeg" },
      { id: "mn", label: "Minnesota", members: "3.4K", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/8689ce77c1f2615797cfa6c8a0ab8bb58dfeeae55ef7038709f7bee92d2f6c18.jpeg" },
      { id: "wi", label: "Wisconsin", members: "1.6K", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/a284c0e07c687311d899e9443f13eeef287c751638398bc96ffef400404f665f.jpeg" },
      { id: "nc", label: "North Carolina", members: "780", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/5e8b37f5f809a6420ec53b905f13d70b6481e1e042fd7dbe9b4c01ba65e31511.jpeg" },
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
        "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/f30185fd0b67e50e90bcfa9d1201ff0ef498895aef10225c3a6e773718393181.jpeg",
        "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/45b51ac7bc4a0286180789f270f4563bfea39b774f923afefabe8a838f461df3.jpeg",
        "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/eca47ba763746cd89fddfeab079449cf45d984903707d53ef48ec23ce0589dd8.jpeg",
        "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/fdc64f5c350ff9a66f94849d01449c26f6ef3e8c9c6e6859ac0ab79fce34e2c1.jpeg",
        "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/f4a8b2418cbd7c871de36a639b1eb798192193a51a6c85c23ca70741cd458c9f.jpeg",
        "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/f42f1b5978c10c4773f253726be85dfbf1b2e9cd47c95b4e15accfb7e6317ef9.jpeg",
      ];
      return { id: c.toLowerCase(), label: `${c} Clan`, members: `${100 + i * 30}`, image: images[i % images.length] };
    }),
  },
  {
    id: "work",
    title: "Work",
    freeAccess: false,
    cards: [
      { id: "ft", label: "Full-time job", members: "1.4K", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/edfe6d6841b6ac6710fa027d8e105a3e6bd95551fd207262a14033f73ee77d55.jpeg" },
      { id: "wfh", label: "Work from home", members: "612", image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600" },
      { id: "pt", label: "Part-time job", members: "388", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/dd256e52f46bcf073b8322443cbf6980119b96359b339646d35171aed4a68fb3.jpeg" },
    ],
  },
  {
    id: "education",
    title: "Education",
    freeAccess: false,
    cards: [
      { id: "hs", label: "High School", members: "240", image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600" },
      { id: "college", label: "College", members: "910", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/16c4fe31f2152eede16bfa59b17dc52c0eb236eff56d21090202e21ff89c7417.jpeg" },
      { id: "bachelor", label: "Bachelor", members: "1.1K", image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600" },
      { id: "phd", label: "PhD", members: "120", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/a39f8a2c7fdc65166612156574b08b4a7456ffe488c3ee8b71eddb0b0346151e.jpeg" },
      { id: "masters", label: "Masters", members: "440", image: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600" },
      { id: "trade", label: "Trade School", members: "260", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/2538cac1d928821a0edd02d9db88e7df1e084623d6035cc50c11a91994b64068.jpeg" },
    ],
  },
  {
    id: "outdoor",
    title: "Outdoor",
    freeAccess: false,
    cards: [
      { id: "fishing", label: "Fishing", members: "510", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/9bb32b29cf0ab6eb3bb30135a2f1094c8b6680d22765d517ae02c07fadd47c91.jpeg" },
      { id: "hiking", label: "Hiking", members: "812", image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600" },
      { id: "camping", label: "Camping", members: "640", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600" },
    ],
  },
  {
    id: "hmong-culture",
    title: "Hmong Culture",
    freeAccess: false,
    cards: [
      { id: "clan-trad", label: "Clan Traditions", members: "1.3K", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/5a165ec3c36986b015723390c98599853d8069e9c2d1da70e8312a23a6952d1a.jpeg" },
      { id: "hmong-food", label: "Hmong Food", members: "1.7K", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/61a67e53b402fd4a571ff1246cde6b428ba08f5908d8a7340e3114072c990814.jpeg" },
      { id: "outdoor-mkt", label: "Outdoor Markets", members: "510", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/97b8dad980d194dcaaa952bacddc1fbed074013ec8bf38c485362dbb848f022f.jpeg" },
    ],
  },
  {
    id: "food",
    title: "Food",
    freeAccess: false,
    cards: [
      { id: "pho", label: "Pho", members: "920", image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600" },
      { id: "bbq", label: "BBQ", members: "880", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600" },
      { id: "trucks", label: "Food Trucks", members: "440", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/6585c82f77d54d25251f6dee3913c47b41447f6604fe48af5dda0920e0d8afbc.jpeg" },
      { id: "boba", label: "Boba", members: "1.2K", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/afe3f31fc90127dfcf91a974b51ba35fb502dbf12d365664fe1a796c6829ca20.jpeg" },
    ],
  },
  {
    id: "music",
    title: "Music",
    freeAccess: false,
    cards: [
      { id: "country", label: "Country", members: "320", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600" },
      { id: "gospel", label: "Gospel", members: "210", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/7af8b347af817686fef5797a394c4a7b38d5bd1b4b6f19c2b1d9ebb938cbfa3e.jpeg" },
      { id: "rock", label: "Rock", members: "450", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/96bc5d8762199f73df5ef39b48ddecff8ac8226a3c6c87b13f6cf70bca962039.jpeg" },
      { id: "hmong", label: "Hmong", members: "910", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/255003250a0a4ca16cde735d2a7f33fec3ecdd0f172c79df6f97dcdd7e3c6ff2.jpeg" },
      { id: "kpop", label: "K-Pop", members: "780", image: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=600" },
      { id: "hiphop", label: "Hip Hop and R&B", members: "640", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/3861e6c4cbf6d3f4bcc79c280e24f9d2125d44caefdbd2bbafd7fedcd3684e7e.jpeg" },
    ],
  },
  {
    id: "sports",
    title: "Sports",
    freeAccess: false,
    cards: [
      { id: "football", label: "Football", members: "660", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/158f3ca26f104a579778ff4479bdaf3582c7e005a1fd026dfc843af71eedafad.jpeg" },
      { id: "basketball", label: "Basketball", members: "840", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600" },
      { id: "baseball", label: "Baseball", members: "320", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/676375c5333f174cc4ecf81e693119733b9d20acb60ab198dd1f0998f1d64f44.jpeg" },
      { id: "running", label: "Running", members: "510", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/89205c0c4223d637166b6773fcc4ef6042c6e7b6828ab4ae6fff21454096532f.jpeg" },
      { id: "hmong-sports", label: "Hmong Sports", members: "440", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/6264232ce9623ddaebc5215516fc9f5e73df08aeaa6db2900556c7f6177d37e7.jpeg" },
    ],
  },
  {
    id: "daily",
    title: "Daily Activities",
    freeAccess: false,
    cards: [
      { id: "coffee", label: "Coffee", members: "920", image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=600" },
      { id: "workout", label: "Workout", members: "612", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/83cda183ce7d8b1aca11431f5329f42cada15cacd4a6b8e15d3de7dfd06c7c68.jpeg" },
      { id: "running2", label: "Running", members: "440", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/5094ce2874fe155892be69785b2116b903c5b9a50554167b46b48ef11f26f620.jpeg" },
      { id: "smoking", label: "Smoking", members: "120", image: "https://static.prod-images.emergentagent.com/jobs/dac90db4-482a-4458-9b08-d5188ee46b56/images/0f54bc1997a9b20b5e1b0412127d35350c60b28ff8b3b5216e97524c4d130fb3.jpeg" },
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
