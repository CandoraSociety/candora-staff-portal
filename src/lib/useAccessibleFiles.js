import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// The files the signed-in user is actually allowed to see.
// Filtering happens server-side (getAccessibleFiles) with the same rules that
// gate opening a file, so restricted records never reach the browser.
export default function useAccessibleFiles() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["accessible-files", user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAccessibleFiles", {});
      const files = res.data?.files ?? res.files ?? [];
      return Array.isArray(files) ? files : [];
    },
    enabled: !!user,
  });

  return { files: Array.isArray(data) ? data : [], isLoading };
}