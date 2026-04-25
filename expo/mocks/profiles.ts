export interface Profile {
  id: string;
  name: string;
  age: number;
  clan: string;
  location: string;
  distance: string;
  bio: string;
  photos: string[];
  interests: string[];
  languages: string[];
  lookingFor: string;
  isOnline: boolean;
  lastActive: string;
  verified: boolean;
}

export interface Match {
  id: string;
  profile: Profile;
  matchedAt: string;
  lastMessage?: string;
  unreadCount: number;
}

export interface Conversation {
  id: string;
  profile: Profile;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

const HMONG_CLANS = [
  'Vang', 'Yang', 'Xiong', 'Lee', 'Moua', 'Her', 'Thao', 'Vue',
  'Cha', 'Chang', 'Hang', 'Kong', 'Khang', 'Lo', 'Lor', 'Pha',
];

export const profiles: Profile[] = [
  {
    id: '1',
    name: 'Mai Lia',
    age: 24,
    clan: 'Vang',
    location: 'Minneapolis, MN',
    distance: '3 mi',
    bio: 'Proud Hmong woman who loves to cook traditional dishes and explore new cuisines. Looking for someone who values family and culture as much as I do.',
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
    ],
    interests: ['Cooking', 'Dancing', 'Hmong Embroidery', 'Hiking'],
    languages: ['Hmong', 'English'],
    lookingFor: 'Relationship',
    isOnline: true,
    lastActive: 'Now',
    verified: true,
  },
  {
    id: '2',
    name: 'Kao',
    age: 27,
    clan: 'Xiong',
    location: 'St. Paul, MN',
    distance: '5 mi',
    bio: 'Engineer by day, musician by night. I play the qeej and guitar. Family-oriented and love attending Hmong New Year festivals.',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop',
    ],
    interests: ['Music', 'Qeej', 'Engineering', 'Basketball'],
    languages: ['Hmong', 'English', 'Lao'],
    lookingFor: 'Relationship',
    isOnline: false,
    lastActive: '2h ago',
    verified: true,
  },
  {
    id: '3',
    name: 'Pa Nhia',
    age: 23,
    clan: 'Lee',
    location: 'Fresno, CA',
    distance: '12 mi',
    bio: 'Nursing student with a passion for helping my community. I enjoy story cloth art and teaching Hmong language to young kids on weekends.',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
    ],
    interests: ['Nursing', 'Story Cloth', 'Teaching', 'Yoga'],
    languages: ['Hmong', 'English'],
    lookingFor: 'Relationship',
    isOnline: true,
    lastActive: 'Now',
    verified: false,
  },
  {
    id: '4',
    name: 'Tou Ger',
    age: 26,
    clan: 'Moua',
    location: 'Sacramento, CA',
    distance: '8 mi',
    bio: 'Filmmaker telling Hmong stories. Documenting our elders and preserving our history through film. Also a huge foodie — take me to your favorite pho spot.',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
    ],
    interests: ['Filmmaking', 'Photography', 'Hmong History', 'Food'],
    languages: ['Hmong', 'English'],
    lookingFor: 'Relationship',
    isOnline: false,
    lastActive: '1h ago',
    verified: true,
  },
  {
    id: '5',
    name: 'Ying',
    age: 25,
    clan: 'Yang',
    location: 'Milwaukee, WI',
    distance: '2 mi',
    bio: 'Graphic designer with a love for blending Hmong textile patterns into modern art. Weekend warrior at Hmong soccer tournaments.',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
    ],
    interests: ['Design', 'Art', 'Soccer', 'Travel'],
    languages: ['Hmong', 'English'],
    lookingFor: 'Something Casual',
    isOnline: true,
    lastActive: 'Now',
    verified: true,
  },
  {
    id: '6',
    name: 'Xeng',
    age: 28,
    clan: 'Thao',
    location: 'Minneapolis, MN',
    distance: '6 mi',
    bio: 'Physical therapist who loves to stay active. I compete in Hmong volleyball tournaments and enjoy fishing with my dad on weekends.',
    photos: [
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop',
    ],
    interests: ['Volleyball', 'Fishing', 'Fitness', 'Cooking'],
    languages: ['Hmong', 'English'],
    lookingFor: 'Relationship',
    isOnline: false,
    lastActive: '30m ago',
    verified: true,
  },
  {
    id: '7',
    name: 'Nkauj Hli',
    age: 22,
    clan: 'Her',
    location: 'St. Paul, MN',
    distance: '4 mi',
    bio: 'Pre-med student and part-time Hmong dance performer. I love traditional paj ntaub and dream of opening a Hmong cultural center.',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop',
    ],
    interests: ['Medicine', 'Dancing', 'Paj Ntaub', 'Volunteering'],
    languages: ['Hmong', 'English'],
    lookingFor: 'Relationship',
    isOnline: true,
    lastActive: 'Now',
    verified: true,
  },
];

export const matches: Match[] = [
  {
    id: 'm1',
    profile: profiles[0],
    matchedAt: '2 hours ago',
    unreadCount: 0,
  },
  {
    id: 'm2',
    profile: profiles[2],
    matchedAt: '1 day ago',
    lastMessage: 'Hey! Love your story cloth work 😊',
    unreadCount: 1,
  },
  {
    id: 'm3',
    profile: profiles[4],
    matchedAt: '3 days ago',
    lastMessage: 'Are you going to the New Year celebration?',
    unreadCount: 0,
  },
  {
    id: 'm4',
    profile: profiles[6],
    matchedAt: '5 days ago',
    unreadCount: 0,
  },
];

export const conversations: Conversation[] = [
  {
    id: 'c1',
    profile: profiles[2],
    lastMessage: 'Hey! Love your story cloth work 😊',
    lastMessageTime: '2m ago',
    unreadCount: 1,
    messages: [
      { id: 'msg1', senderId: 'me', text: 'Hi Pa Nhia! I saw you teach Hmong to kids, that\'s amazing!', timestamp: '10:30 AM', read: true },
      { id: 'msg2', senderId: '3', text: 'Thank you! It\'s really rewarding work 🥰', timestamp: '10:32 AM', read: true },
      { id: 'msg3', senderId: 'me', text: 'I\'d love to hear more about it sometime', timestamp: '10:35 AM', read: true },
      { id: 'msg4', senderId: '3', text: 'Hey! Love your story cloth work 😊', timestamp: '10:38 AM', read: false },
    ],
  },
  {
    id: 'c2',
    profile: profiles[4],
    lastMessage: 'Are you going to the New Year celebration?',
    lastMessageTime: '1h ago',
    unreadCount: 0,
    messages: [
      { id: 'msg5', senderId: '5', text: 'Hey! Saw your designs, they\'re incredible', timestamp: '9:00 AM', read: true },
      { id: 'msg6', senderId: 'me', text: 'Thanks Ying! I love how you blend traditional patterns', timestamp: '9:15 AM', read: true },
      { id: 'msg7', senderId: '5', text: 'Are you going to the New Year celebration?', timestamp: '9:20 AM', read: true },
    ],
  },
  {
    id: 'c3',
    profile: profiles[0],
    lastMessage: 'That sounds delicious! 🍜',
    lastMessageTime: '3h ago',
    unreadCount: 0,
    messages: [
      { id: 'msg8', senderId: 'me', text: 'Hi Mai Lia! What\'s your favorite dish to cook?', timestamp: '7:00 AM', read: true },
      { id: 'msg9', senderId: '1', text: 'Definitely laab! It reminds me of family gatherings', timestamp: '7:10 AM', read: true },
      { id: 'msg10', senderId: 'me', text: 'Same! My mom makes the best laab', timestamp: '7:15 AM', read: true },
      { id: 'msg11', senderId: '1', text: 'That sounds delicious! 🍜', timestamp: '7:20 AM', read: true },
    ],
  },
];

export const currentUser: Profile = {
  id: 'me',
  name: 'You',
  age: 25,
  clan: 'Vue',
  location: 'Minneapolis, MN',
  distance: '0 mi',
  bio: 'Hmong and proud. Love connecting with our community and keeping our traditions alive.',
  photos: [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=800&fit=crop',
  ],
  interests: ['Music', 'Cooking', 'Soccer', 'Hmong Culture'],
  languages: ['Hmong', 'English'],
  lookingFor: 'Relationship',
  isOnline: true,
  lastActive: 'Now',
  verified: true,
};

export { HMONG_CLANS };
