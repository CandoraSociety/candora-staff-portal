import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { BarChart2, Activity, Megaphone, Clock, CheckSquare, TrendingUp, FileText, Users, Star, Bell, Brain, HelpCircle, CalendarClock, LayoutDashboard, Languages, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICON_MAP = {
  BarChart2, Activity, Megaphone, Clock, CheckSquare, TrendingUp, FileText,
  Users, Star, Bell, Brain, HelpCircle, CalendarClock, LayoutDashboard, Languages,
};

// ED-specific preference key stored in UserDashboardPreference as a JSON field
// We piggyback on a separate pref record with user_id + a custom marker
const ED_PREF_KEY = "ed_enabled_widgets";

export default function EDWidgetSettings({ onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: dbWidgets = [] } = useQuery({
    queryKey: ["dashboardWidgets"],
    queryFn: () => base44.entities.DashboardWidget.list(),
  });

  const { data: preferences } = useQuery({
    queryKey: ["dashboardPreferences", user?.id],
    queryFn: () => base44.entities.UserDashboardPreference.filter({ user_id: user?.id }).then(d => d[0]),
    enabled: !!user?.id,
  });

  const [enabled, setEnabled] = useState([]);

  useEffect(() => {
    if (preferences) {
      const saved = preferences.ed_enabled_widgets;
      setEnabled(Array.isArray(saved) ? saved : []);
    }
  }, [preferences]);

  const widgets = [...dbWidgets]
    .filter(w => w.show_in_add_functions || w.locked_to_dashboard)
    .filter(w => !w.required_role || w.required_role === "any" || (w.required_role === "admin" && user?.role === "admin"))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(w => ({
      id: w.widget_id,
      label: w.name,
      description: w.description || "",
      icon: ICON_MAP[w.icon] || LayoutDashboard,
      color: w.color || "#6366f1",
      locked: !!w.locked_to_dashboard,
      comingSoon: !!w.coming_soon,
    }));

  const toggle = async (id) => {
    const next = enabled.includes(id) ? enabled.filter(x => x !== id) : [...enabled, id];
    setEnabled(next);
    if (preferences) {
      await base44.entities.UserDashboardPreference.update(preferences.id, { ed_enabled_widgets: next });
    } else {
      await base44.entities.UserDashboardPreference.create({ user_id: user.id, ed_enabled_widgets: next });
    }
    queryClient.invalidateQueries({ queryKey: ["dashboardPreferences", user?.id] });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "hsl(230,50%,16%)" }}>
        <p className="text-xs font-semibold" style={{ color: "hsl(45,92%,53%)" }}>Dashboard Widgets</p>
        <button onClick={onClose} className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: "hsl(45,60%,88%)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {widgets.map(w => {
          const Icon = w.icon;
          const isOn = w.locked || enabled.includes(w.id);
          return (
            <button
              key={w.id}
              onClick={() => !w.locked && !w.comingSoon && toggle(w.id)}
              disabled={w.locked || w.comingSoon}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                w.locked ? "opacity-60 cursor-not-allowed" :
                w.comingSoon ? "opacity-40 cursor-not-allowed" :
                isOn ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: w.color + "33" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: w.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight truncate" style={{ color: "hsl(45,60%,90%)" }}>{w.label}</p>
                {w.comingSoon && <p className="text-[10px]" style={{ color: "hsl(230,30%,55%)" }}>Coming soon</p>}
              </div>
              {w.locked ? (
                <Lock className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(230,30%,55%)" }} />
              ) : (
                <div className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 transition-colors ${isOn ? "border-transparent" : "border-white/30"}`}
                  style={isOn ? { backgroundColor: "hsl(45,92%,53%)" } : {}} />
              )}
            </button>
          );
        })}
      </div>
      <div className="px-3 pb-3 pt-1">
        <p className="text-[10px] text-center" style={{ color: "hsl(230,30%,55%)" }}>
          {enabled.length} widget{enabled.length !== 1 ? "s" : ""} enabled on EA dashboard
        </p>
      </div>
    </div>
  );
}