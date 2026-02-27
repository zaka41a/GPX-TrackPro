import { AthleteProfile } from "@/types";
import { apiFetch } from "./api";

const STORAGE_PREFIX = "gpx_athlete_profile_";

function getStorageKey(): string {
  try {
    const raw = localStorage.getItem("gpx_auth_user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user.id) return STORAGE_PREFIX + user.id;
    }
  } catch {
    return STORAGE_PREFIX + "default";
  }
  return STORAGE_PREFIX + "default";
}

const defaultProfile: AthleteProfile = {
  bio: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  country: "",
  city: "",
  height: null,
  weight: null,
  primarySport: "cycling",
  secondarySports: [],
  experienceLevel: "intermediate",
  weeklyGoalHours: null,
  avatarUrl: "",
  sportPhotoUrl: "",
};

// Backend profile shape (field names from Go JSON tags)
type BackendProfile = {
  userId?: number;
  bio?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  city?: string;
  height?: number | null;
  weight?: number | null;
  primarySport?: string;
  secondarySports?: string[];
  experienceLevel?: string;
  weeklyGoalHours?: number | null;
  avatarUrl?: string;
  sportPhotoUrl?: string;
};

function mapBackendProfile(bp: BackendProfile): AthleteProfile {
  return {
    bio: bp.bio ?? "",
    phone: bp.phone ?? "",
    dateOfBirth: bp.dateOfBirth ?? "",
    gender: bp.gender ?? "",
    country: bp.country ?? "",
    city: bp.city ?? "",
    height: bp.height ?? null,
    weight: bp.weight ?? null,
    primarySport: (bp.primarySport as AthleteProfile["primarySport"]) ?? "cycling",
    secondarySports: (bp.secondarySports ?? []) as AthleteProfile["secondarySports"],
    experienceLevel: (bp.experienceLevel as AthleteProfile["experienceLevel"]) ?? "intermediate",
    weeklyGoalHours: bp.weeklyGoalHours ?? null,
    avatarUrl: bp.avatarUrl ?? "",
    sportPhotoUrl: bp.sportPhotoUrl ?? "",
  };
}

export const profileService = {
  async getProfile(): Promise<AthleteProfile> {
    try {
      const bp = await apiFetch<BackendProfile>("/api/profile", undefined, true);
      const profile = mapBackendProfile(bp);
      // Cache locally as fallback
      localStorage.setItem(getStorageKey(), JSON.stringify(profile));
      return profile;
    } catch {
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem(getStorageKey());
        if (raw) return { ...defaultProfile, ...JSON.parse(raw) };
      } catch {
        // ignore
      }
      return { ...defaultProfile };
    }
  },

  async saveProfile(profile: AthleteProfile): Promise<void> {
    const bp = await apiFetch<BackendProfile>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }, true);
    const saved = mapBackendProfile(bp);
    localStorage.setItem(getStorageKey(), JSON.stringify(saved));
  },
};
