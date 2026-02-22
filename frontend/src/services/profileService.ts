import { AthleteProfile } from "@/types";

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

export const profileService = {
  getProfile(): AthleteProfile {
    try {
      const key = getStorageKey();
      const raw = localStorage.getItem(key);
      if (!raw) return { ...defaultProfile };
      return { ...defaultProfile, ...JSON.parse(raw) };
    } catch {
      return { ...defaultProfile };
    }
  },

  saveProfile(profile: AthleteProfile): void {
    localStorage.setItem(getStorageKey(), JSON.stringify(profile));
  },
};
