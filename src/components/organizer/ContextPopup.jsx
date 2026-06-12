import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";

export default function ContextPopup({ notes = [], priorities = [] }) {
  const [visible, setVisible] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now());
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    return () => {
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
    };
  }, []);

  useEffect(() => {
    if (notes.length === 0 && priorities.length === 0) return;

    const interval = setInterval(() => {
      const minutesSinceActivity = (Date.now() - lastActivity) / 1000 / 60;
      if (minutesSinceActivity > 15 && minutesSinceActivity < 16) {
        setVisible(true);
        setTimeout(() => setVisible(false), 5000);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [notes.length, priorities.length, lastActivity]);

  if (!visible || (notes.length === 0 && priorities.length === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 left-4 z-50"
    >
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-start gap-2">
          <Bell className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Quick Reminder</p>
            <p className="text-xs text-muted-foreground mt-1">
              You have {notes.length} note{notes.length !== 1 ? "s" : ""} and {priorities.length} priorit{priorities.length !== 1 ? "ies" : "y"} saved.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}