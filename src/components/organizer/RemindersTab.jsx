import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Plus, Clock } from "lucide-react";
import { format } from "date-fns";

export default function RemindersTab({ reminders = [], onChange }) {
  const [newReminder, setNewReminder] = useState("");

  const handleAddReminder = () => {
    if (!newReminder.trim()) return;
    onChange([
      ...reminders,
      {
        id: `reminder_${Date.now()}`,
        text: newReminder.trim(),
        nudge_count: 0,
        last_nudged: null,
      },
    ]);
    setNewReminder("");
  };

  const deleteReminder = (id) => {
    onChange(reminders.filter(r => r.id !== id));
  };

  const resetReminder = (id) => {
    onChange(reminders.map(r =>
      r.id === id ? { ...r, nudge_count: 0, last_nudged: null } : r
    ));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Reminders</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Add a reminder"
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddReminder()}
            className="h-9"
          />
          <Button onClick={handleAddReminder} size="default">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No reminders set
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <Card key={reminder.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{reminder.text}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      Nudged {reminder.nudge_count || 0} times
                    </span>
                    {reminder.last_nudged && (
                      <span>Last: {format(new Date(reminder.last_nudged), "MMM d, h:mm a")}</span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => resetReminder(reminder.id)}>
                  Reset
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteReminder(reminder.id)}>
                  <Bell className="w-3 h-3 rotate-45" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}