import { useState } from "react";
import { Calendar, ListChecks, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MeetingListTab from "./meeting-manager/MeetingListTab";
import AgendaTab from "./meeting-manager/AgendaTab";
import MinutesTab from "./meeting-manager/MinutesTab";

const TABS = [
  { id: "meetings", label: "Meetings", icon: Calendar },
  { id: "agenda", label: "Agenda", icon: ListChecks },
  { id: "minutes", label: "Minutes", icon: FileText },
];

export default function MeetingManagerWidget() {
  const [activeTab, setActiveTab] = useState("meetings");
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-bold">Meeting Manager</h2>
        </div>

        <div className="flex gap-1 mb-4 border-b border-border">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "meetings" && (
          <MeetingListTab
            selectedMeetingId={selectedMeetingId}
            onSelectMeeting={setSelectedMeetingId}
            onSwitchToAgenda={() => setActiveTab("agenda")}
          />
        )}
        {activeTab === "agenda" && (
          <AgendaTab
            selectedMeetingId={selectedMeetingId}
            onSelectMeeting={setSelectedMeetingId}
          />
        )}
        {activeTab === "minutes" && (
          <MinutesTab
            selectedMeetingId={selectedMeetingId}
            onSelectMeeting={setSelectedMeetingId}
          />
        )}
      </CardContent>
    </Card>
  );
}