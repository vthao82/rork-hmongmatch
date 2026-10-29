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
  hometownCity?: string | null;
  hometownState?: string | null;
  genders?: string[];
  seeking?: string[];
  lastActiveAt?: number | null;
  showActiveStatus?: boolean;
  createdAtMs?: number | null;
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

// Real members only — no demo profiles ship with the app.
export const profiles: Profile[] = [];
export const matches: Match[] = [];
export const conversations: Conversation[] = [];

/** Neutral defaults for the signed-in member's own profile before their data loads. */
export const currentUser: Profile = {
  id: 'me',
  name: 'You',
  age: 0,
  clan: '',
  location: '',
  distance: '',
  bio: '',
  photos: [],
  interests: [],
  languages: [],
  lookingFor: '',
  isOnline: true,
  lastActive: 'Now',
  verified: false,
};

export { HMONG_CLANS };
