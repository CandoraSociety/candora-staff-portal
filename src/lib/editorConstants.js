import React from "react";
import { Pen, Eraser, Highlighter, Minus, Square, Circle, Type, StickyNote, PenLine, MousePointer2 } from "lucide-react";

export const DRAW_TOOLS = [
  { id: "scroll", icon: MousePointer2, label: "Scroll / Pan" },
  { id: "pen", icon: Pen, label: "Freehand Draw" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
  { id: "highlight", icon: Highlighter, label: "Highlight" },
  { id: "line", icon: Minus, label: "Line" },
  { id: "rect", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Ellipse" },
  { id: "text", icon: Type, label: "Add Text" },
  { id: "sticky", icon: StickyNote, label: "Sticky Note" },
  { id: "sign", icon: PenLine, label: "Signature" },
];

export const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];
export const COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ffffff"];
export const HIGHLIGHT_COLORS = ["#fef08a", "#86efac", "#93c5fd", "#fca5a5", "#d8b4fe"];
export const SIZES = [2, 4, 8, 14, 20];