import { Badge } from "@/components/ui/badge";

const typeConfig = {
  community: { label: "Community", class: "bg-blue-50 text-blue-700 border-blue-200" },
  skilled: { label: "Skilled", class: "bg-purple-50 text-purple-700 border-purple-200" },
  practicum: { label: "Practicum", class: "bg-amber-50 text-amber-700 border-amber-200" },
  corporate: { label: "Corporate Group", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  internal_placement: { label: "Pathways Internal Placement", class: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function VolunteerTypeBadge({ type }) {
  const config = typeConfig[type] || { label: type, class: "bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={`text-xs ${config.class}`}>{config.label}</Badge>;
}