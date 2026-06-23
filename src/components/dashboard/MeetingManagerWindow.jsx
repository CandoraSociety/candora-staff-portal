import { useState } from "react";
import { Calendar, ListChecks, FileText, Minimize2, Maximize2, X } from "lucide-react";
import MeetingListTab from "./meeting-manager/MeetingListTab";
import AgendaTab from "./meeting-manager/AgendaTab";
import MinutesTab from "./meeting-manager/MinutesTab";

const TABS = [
  { id: "meetings", label: "Meetings", icon: Calendar },
  { id: "agenda", label: "Agenda", icon: ListChecks },
  { id: "minutes", label: "Minutes", icon: FileText },
];

export default function MeetingManagerWindow({ onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState("meetings");
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Meeting Manager</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 bg-card border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden ${
        isFullscreen
          ? "inset-2"
          : "inset-x-4 bottom-4 top-20 md:inset-x-auto md:right-4 md:top-20 md:w-[640px] md:h-[520px]"
      }`}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Meeting Manager</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} title="Minimize" className="p-1.5 hover:bg-muted rounded transition-colors">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Restore" : "Fullscreen"} className="p-1.5 hover:bg-muted rounded transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} title="Close" className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "meetings" && (
          <MeetingListTab
            selectedMeetingId={selectedMeetingId}
            onSelectMeeting={setSelectedMeetingId}
            onSwitchToAgenda={() => setActiveTab("agenda")}
          />
        )}
        {activeTab === "agenda" && (
          <AgendaTab selectedMeetingId={selectedMeetingId} onSelectMeeting={setSelectedMeetingId} />
        )}
        {activeTab === "minutes" && (
          <MinutesTab selectedMeetingId={selectedMeetingId} onSelectMeeting={setSelectedMeetingId} />
        )}
      </div>
    </div>
  );
}