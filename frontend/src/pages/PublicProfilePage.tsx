import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageTransition } from "@/components/PageTransition";
import { profileService } from "@/services/profileService";
import { PublicProfile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bike,
  Footprints,
  Dumbbell,
  MapPin,
  Globe,
  Link2,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Route,
  Activity,
  Calendar,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const sportIcons: Record<string, typeof Bike> = {
  cycling: Bike,
  running: Footprints,
  other: Dumbbell,
};

const sportColors: Record<string, { bg: string; text: string }> = {
  cycling: { bg: "bg-accent/10", text: "text-accent" },
  running: { bg: "bg-success/10", text: "text-success" },
  other: { bg: "bg-warning/10", text: "text-warning" },
};

const experienceColors: Record<string, string> = {
  beginner: "bg-muted text-muted-foreground",
  intermediate: "bg-accent/10 text-accent",
  advanced: "bg-warning/10 text-warning",
  elite: "bg-destructive/10 text-destructive",
};

type SocialKey = keyof Pick<
  PublicProfile,
  "websiteUrl" | "stravaUrl" | "instagramUrl" | "twitterUrl" | "youtubeUrl" | "linkedinUrl"
>;

const socialConfig: {
  key: SocialKey;
  label: string;
  icon: typeof Globe;
  color: string;
}[] = [
  { key: "websiteUrl", label: "Website", icon: Globe, color: "text-foreground" },
  { key: "stravaUrl", label: "Strava", icon: Link2, color: "text-orange-500" },
  { key: "instagramUrl", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { key: "twitterUrl", label: "Twitter", icon: Twitter, color: "text-sky-500" },
  { key: "youtubeUrl", label: "YouTube", icon: Youtube, color: "text-red-500" },
  { key: "linkedinUrl", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
];

function formatDistance(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)} Mm`;
  return `${km.toFixed(0)} km`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="glass-surface rounded-2xl overflow-hidden">
        <div className="h-28 bg-muted/40" />
        <div className="px-5 pb-5 -mt-10 space-y-3">
          <div className="h-20 w-20 rounded-full bg-muted/60 ring-4 ring-background" />
          <div className="h-5 w-40 rounded bg-muted/40" />
          <div className="h-3 w-24 rounded bg-muted/30" />
          <div className="h-10 w-full rounded bg-muted/20" />
        </div>
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const numericId = Number(userId);

  const { data: profile, isLoading, isError } = useQuery<PublicProfile>({
    queryKey: ["publicProfile", numericId],
    queryFn: () => profileService.getPublicProfile(numericId),
    enabled: !isNaN(numericId),
    staleTime: 60_000,
    retry: 1,
  });

  const filledSocials = socialConfig.filter((s) => {
    const v = profile?.[s.key];
    return v && v.trim() !== "";
  });

  const SportIcon = profile ? (sportIcons[profile.primarySport] ?? Dumbbell) : Bike;
  const sportColor = profile ? (sportColors[profile.primarySport] ?? sportColors.other) : sportColors.cycling;

  return (
    <AppShell>
      <PageTransition>
        <div className="max-w-2xl mx-auto space-y-4">
          <Button variant="ghost" size="sm" asChild className="-ml-1">
            <Link to="/community">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>

          {isLoading && <ProfileSkeleton />}

          {isError && (
            <div className="glass-surface rounded-2xl p-10 text-center space-y-3">
              <p className="text-lg font-semibold text-foreground">Profile not found</p>
              <p className="text-sm text-muted-foreground">
                This user may not exist or their profile is private.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/community">Go back to community</Link>
              </Button>
            </div>
          )}

          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="glass-surface rounded-2xl overflow-hidden">
                <div
                  className={cn(
                    "h-28 bg-gradient-to-br",
                    profile.primarySport === "cycling"
                      ? "from-accent/30 via-accent/10 to-transparent"
                      : profile.primarySport === "running"
                        ? "from-success/30 via-success/10 to-transparent"
                        : "from-warning/30 via-warning/10 to-transparent",
                  )}
                />
                <div className="px-5 pb-5 -mt-10">
                  <div className="flex items-end justify-between mb-3">
                    <div
                      className={cn(
                        "h-20 w-20 rounded-full ring-4 ring-background flex items-center justify-center overflow-hidden shrink-0",
                        profile.avatarUrl ? "bg-muted" : sportColor.bg,
                      )}
                    >
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <SportIcon className={cn("h-9 w-9", sportColor.text)} />
                      )}
                    </div>
                    <div className="flex gap-5 mb-1">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{profile.activityCount}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">activities</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">
                          {formatDistance(profile.totalDistanceKm)}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight">total</p>
                      </div>
                    </div>
                  </div>

                  <h1 className="text-xl font-bold text-foreground">{profile.name}</h1>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5 mb-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs gap-1.5 px-2 py-0.5",
                        sportColor.bg,
                        sportColor.text,
                        "border-transparent",
                      )}
                    >
                      <SportIcon className="h-3 w-3" />
                      {profile.primarySport}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs px-2 py-0.5 capitalize border-transparent",
                        experienceColors[profile.experienceLevel] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {profile.experienceLevel}
                    </Badge>

                    {(profile.city || profile.country) && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[profile.city, profile.country].filter(Boolean).join(", ")}
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Member since {formatDate(profile.memberSince)}
                    </span>
                  </div>

                  {profile.bio && (
                    <p className="text-sm text-muted-foreground italic leading-relaxed mb-3">
                      "{profile.bio}"
                    </p>
                  )}

                  {filledSocials.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {filledSocials.map(({ key, label, icon: Icon, color }) => (
                        <a
                          key={key}
                          href={profile[key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full",
                            "bg-muted/50 hover:bg-muted transition-colors border border-border/50",
                            color,
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="glass-surface rounded-xl p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Activity className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{profile.activityCount}</p>
                    <p className="text-xs text-muted-foreground">Activities</p>
                  </div>
                </div>
                <div className="glass-surface rounded-xl p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <Route className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {formatDistance(profile.totalDistanceKm)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total distance</p>
                  </div>
                </div>
              </div>

              {profile.sportPhotoUrl && (
                <div className="glass-surface rounded-2xl overflow-hidden">
                  <img
                    src={profile.sportPhotoUrl}
                    alt="Sport photo"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {profile.secondarySports.length > 0 && (
                <div className="glass-surface rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Also practices
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.secondarySports.map((sport) => {
                      const Icon = sportIcons[sport] ?? Dumbbell;
                      const col = sportColors[sport] ?? sportColors.other;
                      return (
                        <Badge
                          key={sport}
                          variant="outline"
                          className={cn("gap-1.5 text-xs border-transparent", col.bg, col.text)}
                        >
                          <Icon className="h-3 w-3" />
                          {sport}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
