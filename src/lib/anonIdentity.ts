// Anonymous identity generation — deterministic from a stable anonId string.
// Each browser gets a unique anonId stored in a cookie; the same anonId always
// produces the same display name and avatar color.

const ADJECTIVES = [
  "Curious", "Quiet", "Clever", "Sleepy", "Brave", "Witty", "Happy",
  "Mellow", "Eager", "Jolly", "Zesty", "Nimble", "Silent", "Cosmic",
  "Dreamy", "Fuzzy", "Gentle", "Honest", "Lively", "Mighty", "Noble",
  "Playful", "Rowdy", "Sleek", "Swift", "Tame", "Vivid", "Wild",
  "Zany", "Bold", "Chill", "Dapper", "Fancy", "Grumpy", "Kind",
  "Loyal", "Merry", "Peaceful", "Quirky", "Rustic", "Shy", "Wise",
];

const ANIMALS = [
  "Wombat", "Fox", "Otter", "Panda", "Badger", "Lynx", "Moose",
  "Heron", "Falcon", "Raven", "Beaver", "Squirrel", "Hedgehog",
  "Weasel", "Platypus", "Koala", "Gecko", "Sloth", "Mongoose",
  "Ferret", "Newt", "Toad", "Raccoon", "Opossum", "Antelope",
  "Bison", "Capybara", "Dingo", "Emu", "Gazelle", "Hare", "Ibex",
  "Jaguar", "Kiwi", "Llama", "Marmot", "Narwhal", "Octopus",
  "Puffin", "Quokka", "Seal", "Tapir", "Vole", "Walrus", "Yak",
];

// 12 pleasant hues for avatar backgrounds
const AVATAR_COLORS = [
  "#8b5cf6", "#6366f1", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#84cc16", "#10b981", "#14b8a6", "#06b6d4",
  "#3b82f6", "#a855f7",
];

// Simple deterministic hash from a string
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0; // unsigned
}

export interface AnonIdentity {
  name: string;
  color: string;
  initial: string;
}

export function getAnonIdentity(anonId: string): AnonIdentity {
  const h1 = hash(anonId + ":adj");
  const h2 = hash(anonId + ":animal");
  const h3 = hash(anonId + ":color");

  const adj = ADJECTIVES[h1 % ADJECTIVES.length];
  const animal = ANIMALS[h2 % ANIMALS.length];
  const color = AVATAR_COLORS[h3 % AVATAR_COLORS.length];

  return {
    name: `${adj} ${animal}`,
    color,
    initial: animal.charAt(0),
  };
}

// Cookie helpers (client-side)
const ANON_ID_COOKIE = "cf_anon_id";

function makeAnonId(): string {
  // 12-char random id
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function getOrCreateAnonIdClient(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ANON_ID_COOKIE}=`));
  if (match) {
    return decodeURIComponent(match.substring(ANON_ID_COOKIE.length + 1));
  }
  const id = makeAnonId();
  // 1 year
  document.cookie = `${ANON_ID_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  return id;
}

// Anonymous avatar — stored client-side in localStorage as a data URL.
// Sent along with anonymous posts/comments so others can see it.
const ANON_AVATAR_KEY = "cf_anon_avatar";

export function getAnonAvatarClient(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ANON_AVATAR_KEY);
  } catch {
    return null;
  }
}

export function setAnonAvatarClient(dataUrl: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (dataUrl === null) {
      window.localStorage.removeItem(ANON_AVATAR_KEY);
    } else {
      window.localStorage.setItem(ANON_AVATAR_KEY, dataUrl);
    }
    // Notify listeners in this tab (storage event only fires for other tabs)
    window.dispatchEvent(new Event("cf-anon-avatar-changed"));
  } catch {
    // ignore quota errors
  }
}
