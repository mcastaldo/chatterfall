export interface UserPublic {
  id: string;
  username: string;
  displayName: string | null;
  profileImg: string | null;
}

export interface PostWithMeta {
  id: string;
  content: string;
  imageUrl: string | null;
  lat: number;
  lon: number;
  anonymous: boolean;
  anonId?: string | null;
  anonAvatar?: string | null;
  createdAt: string;
  author: UserPublic | null;
  _count: {
    comments: number;
    favorites: number;
    downvotes: number;
  };
  favorited?: boolean;
  downvoted?: boolean;
  distance?: number;
  locationName?: string | null;
  reactions?: Record<string, { count: number; reacted: boolean }>;
}

export interface CommentWithMeta {
  id: string;
  content: string;
  imageUrl: string | null;
  anonymous: boolean;
  anonId?: string | null;
  anonAvatar?: string | null;
  createdAt: string;
  author: UserPublic | null;
  postId: string;
  _count: {
    favorites: number;
    downvotes: number;
  };
  favorited?: boolean;
  downvoted?: boolean;
}

export interface ConversationPreview {
  user: UserPublic;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

export interface MessageData {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  senderId: string;
  receiverId: string;
  read: boolean;
}

export interface NotificationData {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  postId: string | null;
}

export interface UserStats {
  postCount: number;
  commentCount: number;
  totalFavorites: number;
  totalDownvotes: number;
  fameScore: number;
}

export interface FeedFilters {
  range: number; // meters, 0 = all
  postType: "all" | "text" | "image";
  userType: "all" | "registered";
  search: string;
}

// Socket.IO event types
export interface ServerToClientEvents {
  "new-post": (post: PostWithMeta) => void;
  "new-comment": (data: { postId: string; comment: CommentWithMeta }) => void;
  "favorite-update": (data: { postId: string; count: number }) => void;
  "downvote-update": (data: { postId: string; count: number }) => void;
  "reaction-update": (data: { postId: string; reactions: Record<string, number> }) => void;
  "comment-favorite-update": (data: { commentId: string; count: number }) => void;
  "comment-downvote-update": (data: { commentId: string; count: number }) => void;
  "new-message": (message: MessageData) => void;
  "notification": (notification: NotificationData) => void;
}

export interface ClientToServerEvents {
  "join": (data: { userId?: string; lat: number; lon: number }) => void;
  "update-location": (data: { lat: number; lon: number }) => void;
}
