import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profileService";
import { AthleteProfile } from "@/types";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.getProfile(),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: AthleteProfile) => profileService.saveProfile(profile),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
