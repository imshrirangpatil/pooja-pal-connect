import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type MyPandit = {
  id: string;
  name: string;
  city: string | null;
  bio: string | null;
  fee_from: number | null;
  photo_url: string | null;
  experience: number | null;
  rating: number | null;
  reviews: number | null;
  initials: string | null;
  visible: boolean | null;
};

// Returns the pandit profile linked to the signed-in user, or null. Used to show
// the earnings entry point, the pandit portal, and to gate the payout screen.
export function useMyPandit() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my-pandit", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MyPandit | null> => {
      const { data, error } = await (supabase as any)
        .from("pandits")
        .select("id, name, city, bio, fee_from, photo_url, experience, rating, reviews, initials, visible")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as MyPandit) ?? null;
    },
  });
  return { pandit: q.data ?? null, loading: q.isLoading };
}
