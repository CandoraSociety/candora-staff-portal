import React, { useEffect } from "react";
import { daysUntilDueLocal } from "@/lib/dateUtils";

export default function PriorityDeadlineNotifier({ priorities = [] }) {
  useEffect(() => {
    if (!("Notification" in window)) return;

    const checkDeadlines = () => {
      priorities.forEach(priority => {
        if (!priority.due_date) return;

        const daysUntil = daysUntilDueLocal(priority.due_date);
        const thresholds = [0, 1, 3];

        if (thresholds.includes(daysUntil)) {
          const message = daysUntil === 0
            ? `Due today: ${priority.title}`
            : daysUntil === 1
            ? `Due tomorrow: ${priority.title}`
            : `Due in ${daysUntil} days: ${priority.title}`;

          if (Notification.permission === "granted") {
            new Notification("Priority Deadline", { body: message, icon: "/favicon.ico" });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                new Notification("Priority Deadline", { body: message });
              }
            });
          }
        }
      });
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 3600000);
    return () => clearInterval(interval);
  }, [priorities]);

  return null;
}