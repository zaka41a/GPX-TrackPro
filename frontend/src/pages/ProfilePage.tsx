import { useState, useRef, useMemo, useEffect } from "react";
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
import {
  Camera,
  Bike,
  Footprints,
  Dumbbell,
  Save,
  ImagePlus,
  Heart,
  Phone,
  Globe,
  Link2,
  Trash2,
  MapPin,
  User,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { apiFetch } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

const sportOptions: { value: SportType; label: string; icon: typeof Bike }[] = [
  { value: "cycling", label: "Cycling", icon: Bike },
  { value: "running", label: "Running", icon: Footprints },
  { value: "other", label: "Other", icon: Dumbbell },
];

const sportColors: Record<SportType, { bg: string; text: string }> = {
  cycling: { bg: "bg-accent/10", text: "text-accent" },
  running: { bg: "bg-success/10", text: "text-success" },
  other: { bg: "bg-warning/10", text: "text-warning" },
};

const experienceLevels = ["beginner", "intermediate", "advanced", "elite"] as const;

const socialLinks: {
  key: keyof AthleteProfile;
  label: string;
  icon: typeof Globe;
  placeholder: string;
  color: string;
  prefix?: string;
}[] = [
  {
    key: "websiteUrl",
    label: "Website",
    icon: Globe,
    placeholder: "https://yourwebsite.com",
    color: "text-foreground",
  },
  {
    key: "stravaUrl",
    label: "Strava",
    icon: Link2,
    placeholder: "https://www.strava.com/athletes/yourprofile",
    color: "text-orange-500",
  },
  {
    key: "instagramUrl",
    label: "Instagram",
    icon: Instagram,
    placeholder: "@yourhandle or https://instagram.com/...",
    color: "text-pink-500",
  },
  {
    key: "twitterUrl",
    label: "Twitter / X",
    icon: Twitter,
    placeholder: "@yourhandle or https://twitter.com/...",
    color: "text-sky-500",
  },
  {
    key: "youtubeUrl",
    label: "YouTube",
    icon: Youtube,
    placeholder: "https://youtube.com/@yourchannel",
    color: "text-red-500",
  },
  {
    key: "linkedinUrl",
    label: "LinkedIn",
    icon: Linkedin,
    placeholder: "https://linkedin.com/in/yourprofile",
    color: "text-blue-600",
  },
];

function filledSocialLinks(profile: AthleteProfile) {
  return socialLinks.filter((s) => {
    const v = profile[s.key];
    return v && String(v).trim() !== "";
  });
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const avatarRef = useRef<HTMLInputElement>(null);
  const sportPhotoRef = useRef<HTMLInputElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [profile, setProfile] = useState<AthleteProfile>({
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
    websiteUrl: "",
    stravaUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    youtubeUrl: "",
    linkedinUrl: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileService.getProfile().then(setProfile).catch(() => {
      toast.error("Failed to load profile");
    });
  }, []);

  const update = <K extends keyof AthleteProfile>(key: K, value: AthleteProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const resizeImage = (file: File, maxPx: number, quality = 0.8): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("canvas unavailable")); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "avatarUrl" | "sportPhotoUrl",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxPx = field === "avatarUrl" ? 256 : 800;
    resizeImage(file, maxPx, field === "avatarUrl" ? 0.85 : 0.8)
      .then((dataUrl) => update(field, dataUrl))
      .catch(() => {
        const reader = new FileReader();
        reader.onload = () => update(field, reader.result as string);
        reader.readAsDataURL(file);
      });
  };

  const handleDeleteAccount = async () => {
    try {
      await apiFetch("/api/users/me", { method: "DELETE" }, true);
      await logout();
      navigate("/");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileService.saveProfile(profile);
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
    const filled = fields.filter(({ key }) => {
      const v = profile[key];
      return v !== null && v !== undefined && v !== "";
    });
    const missing = fields
      .filter(({ key }) => {
        const v = profile[key];
        return v === null || v === undefined || v === "";
      })
      .map((f) => f.label);
    return { percentage: Math.round((filled.length / fields.length) * 100), missing };
  }, [profile]);

  const SportIcon =
    sportOptions.find((o) => o.value === profile.primarySport)?.icon ?? Dumbbell;
  const sportColor = sportColors[profile.primarySport] ?? sportColors.other;
  const activeSocials = filledSocialLinks(profile);

  return (
    <AppShell>
      <PageTransition>
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Your athlete identity — personal info, sport profile, and social links.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            <div className="glass-surface rounded-xl overflow-hidden h-fit sticky top-6">
              <div className="h-20 bg-gradient-to-br from-accent/40 via-accent/20 to-background relative">
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card/80 to-transparent" />
              </div>

              <div className="px-6 pb-6 -mt-12 flex flex-col items-center text-center gap-3">
                <button
                  onClick={() => avatarRef.current?.click()}
                  className="relative group"
                  aria-label="Upload avatar"
                >
                  <div className="h-24 w-24 rounded-full p-0.5 bg-gradient-to-br from-accent to-accent/50 shadow-lg">
                    <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-accent">
                          {user?.name?.charAt(0) ?? "U"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" />
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
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      user?.role === "admin"
                        ? "bg-accent/10 text-accent border-accent/20"
                        : "bg-success/10 text-success border-success/20",
                    )}
                  >
                    {user?.role === "admin" ? "Admin" : "Athlete"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-xs gap-1", sportColor.bg, sportColor.text)}
                  >
                    <SportIcon className="h-3 w-3" />
                    <span className="capitalize">{profile.primarySport}</span>
                  </Badge>
                </div>

                {(profile.city || profile.country) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[profile.city, profile.country].filter(Boolean).join(", ")}
                  </p>
                )}

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Member since {memberSince}</p>
                  {profile.experienceLevel && (
                    <p className="capitalize">{profile.experienceLevel} athlete</p>
                  )}
                </div>

                <div className="w-full pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-muted-foreground">Profile completion</p>
                    <span className="text-xs font-bold text-accent font-mono-data">
                      {completion.percentage}%
                    </span>
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

                {activeSocials.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                    {activeSocials.map(({ key, icon: Icon, color, label }) => {
                      const val = String(profile[key] ?? "");
                      const href = val.startsWith("http") ? val : `https://${val}`;
                      return (
                        <a
                          key={key}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={label}
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center bg-muted/60 hover:bg-muted transition-colors",
                            color,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      );
                    })}
                  </div>
                )}

                {profile.bio && (
                  <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-3 w-full text-center line-clamp-3">
                    "{profile.bio}"
                  </p>
                )}
              </div>
            </div>

            <div className="glass-surface rounded-xl p-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="w-full mb-6 grid grid-cols-3">
                  <TabsTrigger value="personal" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Personal
                  </TabsTrigger>
                  <TabsTrigger value="sport" className="flex items-center gap-1.5">
                    <Bike className="h-3.5 w-3.5" /> Sport
                  </TabsTrigger>
                  <TabsTrigger value="social" className="flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" /> Social
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell the community about yourself, your training goals..."
                      value={profile.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      className="resize-none h-24 bg-background/50"
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-md bg-accent/10 flex items-center justify-center">
                        <Phone className="h-3 w-3 text-accent" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Contact & Location</p>
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
                        <Select value={profile.gender} onValueChange={(v) => update("gender", v)}>
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          placeholder="France"
                          value={profile.country}
                          onChange={(e) => update("country", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="Paris"
                          value={profile.city}
                          onChange={(e) => update("city", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
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

                <TabsContent value="sport" className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Primary Sport</p>
                    <div className="flex gap-2">
                      {sportOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => update("primarySport", opt.value)}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-1.5 rounded-xl py-4 text-sm font-medium transition-all border-2",
                            profile.primarySport === opt.value
                              ? "bg-accent/10 border-accent/40 text-accent shadow-sm"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 bg-muted/20",
                          )}
                        >
                          <opt.icon className="h-5 w-5" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Experience Level</p>
                    <div className="flex rounded-xl border border-border overflow-hidden">
                      {experienceLevels.map((level, i) => (
                        <button
                          key={level}
                          onClick={() => update("experienceLevel", level)}
                          className={cn(
                            "flex-1 py-2.5 text-xs font-medium capitalize transition-colors",
                            i > 0 && "border-l border-border",
                            profile.experienceLevel === level
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="weeklyGoal">Weekly Training Goal (hours)</Label>
                    <Input
                      id="weeklyGoal"
                      type="number"
                      placeholder="10"
                      value={profile.weeklyGoalHours ?? ""}
                      onChange={(e) =>
                        update("weeklyGoalHours", e.target.value ? Number(e.target.value) : null)
                      }
                      className="max-w-[200px]"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Sport Photo</p>
                    <button
                      onClick={() => sportPhotoRef.current?.click()}
                      className="w-full h-44 rounded-xl border-2 border-dashed border-border hover:border-accent/40 transition-colors flex flex-col items-center justify-center gap-2 overflow-hidden relative group"
                      aria-label="Upload sport photo"
                    >
                      {profile.sportPhotoUrl ? (
                        <>
                          <img
                            src={profile.sportPhotoUrl}
                            alt="Sport"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
                            Click to upload a sport action photo
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

                <TabsContent value="social" className="space-y-5">
                  <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-xs text-muted-foreground">
                    Add your social profiles and website to let the community find you. Links
                    appear as icons on your athlete card.
                  </div>

                  {socialLinks.map(({ key, label, icon: Icon, placeholder, color }) => (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={key} className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", color)} />
                        {label}
                      </Label>
                      <Input
                        id={key}
                        placeholder={placeholder}
                        value={String(profile[key] ?? "")}
                        onChange={(e) => update(key, e.target.value as AthleteProfile[typeof key])}
                        className="text-sm"
                      />
                    </div>
                  ))}

                  {activeSocials.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground mb-3">Preview on card:</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeSocials.map(({ key, icon: Icon, color, label }) => (
                          <div
                            key={key}
                            className={cn(
                              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-muted/60",
                              color,
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="mt-6 pt-5 border-t border-border flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Changes are saved to your account and visible to the community.
                </p>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Permanently delete your account and all data. This cannot be undone.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/30 shrink-0"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete Account"
          description="Are you sure you want to permanently delete your account? All your data, activities, and profile information will be removed. This action cannot be undone."
          confirmLabel="Delete Account"
          variant="destructive"
          onConfirm={handleDeleteAccount}
        />
      </PageTransition>
    </AppShell>
  );
}
