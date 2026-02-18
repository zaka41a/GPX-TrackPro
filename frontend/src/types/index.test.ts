import { describe, it, expect } from "vitest";
import type { Activity, ActivityStatistics, User, SportType } from "./index";

describe("Type contracts", () => {
  it("Activity type has required fields", () => {
    const activity: Activity = {
      id: "1",
      name: "Test Run",
      sportType: "running",
      date: "2026-02-15",
      distance: 5.2,
      duration: 1800,
      avgSpeed: 10.4,
      maxSpeed: 14.2,
      elevationGain: 120,
      elevationLoss: 115,
    };
    expect(activity.id).toBe("1");
    expect(activity.sportType).toBe("running");
    expect(activity.distance).toBeGreaterThan(0);
  });

  it("ActivityStatistics extends Activity with optional arrays", () => {
    const stats: ActivityStatistics = {
      id: "2",
      name: "Test Ride",
      sportType: "cycling",
      date: "2026-02-15",
      distance: 45,
      duration: 5400,
      avgSpeed: 30,
      maxSpeed: 52,
      elevationGain: 800,
      elevationLoss: 790,
      elevationProfile: [
        { distance: 0, elevation: 100 },
        { distance: 1, elevation: 120 },
      ],
      coordinates: [
        { lat: 48.57, lng: 7.75 },
        { lat: 48.58, lng: 7.76 },
      ],
    };
    expect(stats.elevationProfile).toHaveLength(2);
    expect(stats.coordinates).toHaveLength(2);
  });

  it("SportType accepts valid values", () => {
    const types: SportType[] = ["cycling", "running", "other"];
    expect(types).toHaveLength(3);
  });

  it("User type has required fields", () => {
    const user: User = {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      role: "user",
      status: "approved",
      createdAt: "2026-01-01",
    };
    expect(user.role).toBe("user");
    expect(user.status).toBe("approved");
  });
});
