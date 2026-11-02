// Shared labels for a staff member's training completion status.
export const STATUS_OPTIONS = ["not_started", "in_progress", "completed"];

export const STATUS_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export const STATUS_CLASSES = {
  not_started: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
};