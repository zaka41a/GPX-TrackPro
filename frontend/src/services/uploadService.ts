import { Activity, SportType } from "@/types";
import { getToken, parseApiError } from "./api";

type BackendMetrics = {
  distanceKm: number;
  durationSec: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  paceMinPerKm: number;
  elevGainM: number;
  elevLossM: number;
  avgHr: number;
  maxHr: number;
  avgCadence: number;
};

type BackendActivity = {
  id: number;
  name: string;
  sportType: SportType;
  activityDate: string;
  metrics: BackendMetrics;
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

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

export const uploadService = {
  async uploadGPX(file: File, sportType: SportType, onProgress: (pct: number) => void): Promise<Activity> {
    const token = getToken();
    if (!token) {
      throw new Error("Missing authentication token");
    }

    const form = new FormData();
    form.append("file", file);
    form.append("sportType", sportType);

    let currentProgress = 5;
    onProgress(currentProgress);

    const progressTimer = window.setInterval(() => {
      currentProgress = Math.min(currentProgress + 7, 90);
      onProgress(currentProgress);
    }, 180);

    const res = await fetch(`${API_BASE}/api/activities/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    window.clearInterval(progressTimer);

    if (!res.ok) {
      throw await parseApiError(res);
    }

    onProgress(100);
    const activity = (await res.json()) as BackendActivity;
    return mapActivity(activity);
  },
};
