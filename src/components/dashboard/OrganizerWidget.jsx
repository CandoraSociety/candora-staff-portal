import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import OrganizerPanel from "../organizer/OrganizerPanel";

export default function OrganizerWidget() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  if (!user) return null;

  return (
    <div className="w-full">
      <OrganizerPanel user={user} />
    </div>
  );
}