import { Activity, ActivityStatistics, HRZone, ClimbSegment } from "@/types";
import { apiFetch } from "./api";

type BackendPoint = {
  lat: number;
  lon: number;
  ele: number;
  time?: string;
  hr?: number;
  cadence?: number;
};

type BackendMetrics = {
  distanceKm: number;
  durationSec: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  paceMinPerKm: number;
  elevGainM: number;
  elevLossM: number;
  maxElevM: number;
  minElevM: number;
  avgHr: number;
  maxHr: number;
  avgCadence: number;
};

type BackendActivity = {
  id: number;
  fileName: string;
  sportType: "cycling" | "running" | "other";
  name: string;
  activityDate: string;
  metrics: BackendMetrics;
  points?: BackendPoint[];
  hrZones?: HRZone[];
  climbs?: ClimbSegment[];
};

function mapActivity(a: BackendActivity): Activity {
  return {
    id: String(a.id),
    name: a.name,
    sportType: a.sportType,
    date: a.activityDate,
    distance: a.metrics.distanceKm,
    duration: a.metrics.durationSec,
    avgSpeed: a.metrics.avgSpeedKmh,
    maxSpeed: a.metrics.maxSpeedKmh,
    elevationGain: a.metrics.elevGainM,
    elevationLoss: a.metrics.elevLossM,
    avgHeartRate: a.metrics.avgHr,
    maxHeartRate: a.metrics.maxHr,
    avgCadence: a.metrics.avgCadence,
    pace: a.metrics.paceMinPerKm,
  };
}

function mapStats(a: BackendActivity): ActivityStatistics {
  const base = mapActivity(a);
  const points = a.points ?? [];

  let cumulativeKm = 0;
  const elevationProfile = points.map((p, i) => {
    if (i > 0) {
      const prev = points[i - 1];
      cumulativeKm += haversineKm(prev.lat, prev.lon, p.lat, p.lon);
    }
    const pt: { distance: number; elevation: number; hr?: number } = {
      distance: Number(cumulativeKm.toFixed(3)),
      elevation: p.ele ?? 0,
    };
    if (p.hr && p.hr > 0) pt.hr = p.hr;
    return pt;
  });

  const coordinates = points.map((p, i) => {
    let speed: number | undefined;
    if (i > 0 && p.time && points[i - 1].time) {
      const prev = points[i - 1];
      const distKm = haversineKm(prev.lat, prev.lon, p.lat, p.lon);
      const deltaSec =
        (new Date(p.time).getTime() - new Date(prev.time!).getTime()) / 1000;
      if (deltaSec > 0 && deltaSec < 600) {
        const raw = distKm / (deltaSec / 3600);
        if (raw < 120) speed = Math.round(raw * 10) / 10;
      }
    }
    return { lat: p.lat, lng: p.lon, speed, hr: p.hr };
  });

  return {
    ...base,
    elevationProfile,
    coordinates,
    hrZones: a.hrZones,
    climbs: a.climbs,
  };
}

type PaginatedActivities = {
  items: BackendActivity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const activityService = {
  async getActivities(page = 1, pageSize = 100): Promise<Activity[]> {
    const result = await apiFetch<PaginatedActivities>(
      `/api/activities?page=${page}&pageSize=${pageSize}`,
      undefined,
      true,
    );
    return result.items.map(mapActivity);
  },

  async getActivitiesPage(
    page = 1,
    pageSize = 20,
  ): Promise<{ items: Activity[]; page: number; totalPages: number; total: number }> {
    const result = await apiFetch<PaginatedActivities>(
      `/api/activities?page=${page}&pageSize=${pageSize}`,
      undefined,
      true,
    );
    return {
      items: result.items.map(mapActivity),
      page: result.page,
      totalPages: result.totalPages,
      total: result.total,
    };
  },

  async getActivityById(id: string): Promise<ActivityStatistics | null> {
    try {
      const activity = await apiFetch<BackendActivity>(`/api/activities/${id}`, undefined, true);
      return mapStats(activity);
    } catch {
      return null;
    }
  },
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
}

function toRad(v: number): number {
  return (v * Math.PI) / 180;
}
