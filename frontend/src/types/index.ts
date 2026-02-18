export type UserRole = "admin" | "user";
export type AccountStatus = "pending" | "approved" | "rejected";
export type SportType = "cycling" | "running" | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
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
