import { useState, useRef, useMemo } from "react";
import { AppShell } from "@/layouts/AppShell";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { profileService } from "@/services/profileService";
import { AthleteProfile, SportType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Bike, Footprints, Dumbbell, Save, ImagePlus, User, Heart, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

const sportOptions: { value: SportType; label: string; icon: typeof Bike }[] = [
  { value: "cycling", label: "Cycling", icon: Bike },
  { value: "running", label: "Running", icon: Footprints },
  { value: "other", label: "Other", icon: Dumbbell },
];

const experienceLevels = ["beginner", "intermediate", "advanced", "elite"] as const;

export default function ProfilePage() {
  const { user } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);
  const sportPhotoRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<AthleteProfile>(() => profileService.getProfile());
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof AthleteProfile>(key: K, value: AthleteProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "avatarUrl" | "sportPhotoUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update(field, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSaving(true);
    try {
      profileService.saveProfile(profile);
      toast.success("Profile saved successfully");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  // Profile completion
  const completion = useMemo(() => {
    const fields: { key: keyof AthleteProfile; label: string }[] = [
      { key: "bio", label: "Bio" },
      { key: "phone", label: "Phone" },
      { key: "dateOfBirth", label: "Date of Birth" },
      { key: "gender", label: "Gender" },
      { key: "country", label: "Country" },
      { key: "city", label: "City" },
      { key: "height", label: "Height" },
      { key: "weight", label: "Weight" },
      { key: "primarySport", label: "Primary Sport" },
      { key: "experienceLevel", label: "Experience Level" },
    ];
    const filled = fields.filter((f) => {
      const val = profile[f.key];
      return val !== null && val !== undefined && val !== "";
    });
    const missing = fields.filter((f) => {
      const val = profile[f.key];
      return val === null || val === undefined || val === "";
    });
    return {
      percentage: Math.round((filled.length / fields.length) * 100),
      missing: missing.map((f) => f.label),
    };
  }, [profile]);

  return (
    <AppShell>
      <PageTransition>
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your athlete information and preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            {/* Left — Profile Card */}
            <div className="glass-surface rounded-xl overflow-hidden h-fit">
              <div className="h-1 bg-gradient-to-r from-accent to-accent/40" />
              <div className="p-6 flex flex-col items-center text-center gap-4">
                {/* Avatar */}
                <button
                  onClick={() => avatarRef.current?.click()}
                  className="relative group"
                  aria-label="Upload avatar"
                >
                  <div className="h-28 w-28 rounded-full p-1 bg-gradient-to-br from-accent to-accent/60">
                    <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-accent">
                          {user?.name?.charAt(0) ?? "U"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "avatarUrl")}
                  />
                </button>

                <div>
                  <h2 className="text-lg font-bold text-foreground">{user?.name}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-2 py-0.5",
                    user?.role === "admin"
                      ? "bg-accent/10 text-accent border-accent/20"
                      : "bg-success/10 text-success border-success/20"
                  )}
                >
                  {user?.role === "admin" ? "Admin" : "Athlete"}
                </Badge>

                <p className="text-xs text-muted-foreground">Member since {memberSince}</p>

                {/* Profile completion */}
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-muted-foreground">Profile completion</p>
                    <span className="text-xs font-bold text-accent font-mono-data">{completion.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${completion.percentage}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  {completion.missing.length > 0 && completion.missing.length <= 4 && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Missing: {completion.missing.join(", ")}
                    </p>
                  )}
                </div>

                <div className="w-full">
                  <Label htmlFor="bio" className="text-xs text-muted-foreground">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={profile.bio}
                    onChange={(e) => update("bio", e.target.value)}
                    className="mt-1 resize-none h-24 bg-background/50"
                  />
                </div>
              </div>
            </div>

            {/* Right — Tabs */}
            <div className="glass-surface rounded-xl p-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="personal" className="flex-1">
                    Personal Info
                  </TabsTrigger>
                  <TabsTrigger value="sport" className="flex-1">
                    Sport Profile
                  </TabsTrigger>
                </TabsList>

                {/* ── Personal Info ── */}
                <TabsContent value="personal" className="space-y-5">
                  {/* Contact Information sub-header */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-md bg-accent/10 flex items-center justify-center">
                      <Phone className="h-3 w-3 text-accent" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Contact Information</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="+1 234 567 890"
                        value={profile.phone}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={profile.dateOfBirth}
                        onChange={(e) => update("dateOfBirth", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={profile.gender}
                        onValueChange={(v) => update("gender", v)}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">
                            Prefer not to say
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        placeholder="Country"
                        value={profile.country}
                        onChange={(e) => update("country", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={profile.city}
                        onChange={(e) => update("city", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-5">
                    {/* Body Metrics sub-header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-md bg-success/10 flex items-center justify-center">
                        <Heart className="h-3 w-3 text-success" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Body Metrics</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="175"
                          value={profile.height ?? ""}
                          onChange={(e) =>
                            update("height", e.target.value ? Number(e.target.value) : null)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder="70"
                          value={profile.weight ?? ""}
                          onChange={(e) =>
                            update("weight", e.target.value ? Number(e.target.value) : null)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ── Sport Profile ── */}
                <TabsContent value="sport" className="space-y-6">
                  {/* Primary sport */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Primary Sport</p>
                    <div className="flex gap-2">
                      {sportOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => update("primarySport", opt.value)}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-1 rounded-lg py-3 text-sm font-medium transition-all border",
                            profile.primarySport === opt.value
                              ? "bg-accent/10 border-accent/30 text-accent"
                              : "glass-surface text-muted-foreground hover:text-foreground hover:border-border"
                          )}
                        >
                          <opt.icon className="h-5 w-5" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience level */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Experience Level</p>
                    <div className="flex rounded-lg border border-border overflow-hidden">
                      {experienceLevels.map((level) => (
                        <button
                          key={level}
                          onClick={() => update("experienceLevel", level)}
                          className={cn(
                            "flex-1 py-2.5 text-xs font-medium capitalize transition-colors",
                            profile.experienceLevel === level
                              ? "bg-accent text-accent-foreground"
                              : "bg-background/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weekly goal */}
                  <div className="space-y-1.5">
                    <Label htmlFor="weeklyGoal">Weekly Goal (hours)</Label>
                    <Input
                      id="weeklyGoal"
                      type="number"
                      placeholder="10"
                      value={profile.weeklyGoalHours ?? ""}
                      onChange={(e) =>
                        update(
                          "weeklyGoalHours",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="max-w-[200px]"
                    />
                  </div>

                  {/* Sport photo */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Sport Photo</p>
                    <button
                      onClick={() => sportPhotoRef.current?.click()}
                      className="w-full h-40 rounded-xl border-2 border-dashed border-border hover:border-accent/50 transition-colors flex flex-col items-center justify-center gap-2 overflow-hidden relative group"
                      aria-label="Upload sport photo"
                    >
                      {profile.sportPhotoUrl ? (
                        <>
                          <img
                            src={profile.sportPhotoUrl}
                            alt="Sport"
                            className="h-full w-full object-cover rounded-xl"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <div className="flex items-center gap-2 text-white">
                              <Camera className="h-5 w-5" />
                              <span className="text-sm font-medium">Change Photo</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Click to upload a sport photo
                          </span>
                        </>
                      )}
                    </button>
                    <input
                      ref={sportPhotoRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "sportPhotoUrl")}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Save */}
              <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground hidden sm:block">Changes saved locally</p>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
