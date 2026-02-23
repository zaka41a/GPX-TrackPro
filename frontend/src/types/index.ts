export type UserRole = "admin" | "user";
export type AccountStatus = "pending" | "approved" | "rejected";
export type SportType = "cycling" | "running" | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  name: string;
  sportType: SportType;
  date: string;
  distance: number; // km
  duration: number; // seconds
  avgSpeed: number;
  maxSpeed: number;
  elevationGain: number;
  elevationLoss: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgCadence?: number;
  pace?: number; // min/km
}

export interface ActivityStatistics extends Activity {
  elevationProfile?: { distance: number; elevation: number }[];
  coordinates?: { lat: number; lng: number }[];
}

export interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
}

export interface AdminAction {
  id: string;
  action: string;
  targetUser: string;
  timestamp: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface CommunityPost {
  id: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  content: string;
  activityId?: number;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  reactions: { emoji: string; count: number; reacted: boolean }[];
  commentCount: number;
}

export interface CommunityComment {
  id: number;
  postId: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface CommunityBan {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  bannedBy: number;
  reason: string;
  createdAt: string;
}

export interface DMConversation {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface DMMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  readAt?: string;
  createdAt: string;
}

export interface AthleteProfile {
  bio: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  city: string;
  height: number | null;
  weight: number | null;
  primarySport: SportType;
  secondarySports: SportType[];
  experienceLevel: "beginner" | "intermediate" | "advanced" | "elite";
  weeklyGoalHours: number | null;
  avatarUrl: string;
  sportPhotoUrl: string;
}
