import { AthleteProfile } from "@/types";

const STORAGE_KEY = "gpx_athlete_profile";

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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultProfile };
      return { ...defaultProfile, ...JSON.parse(raw) };
    } catch {
      return { ...defaultProfile };
    }
  },

  saveProfile(profile: AthleteProfile): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },
};
