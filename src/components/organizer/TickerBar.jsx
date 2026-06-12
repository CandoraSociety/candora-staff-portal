import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Flag } from "lucide-react";

export default function TickerBar({ notes = [], priorities = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const weightedItems = [
      ...notes.slice(0, 5).map(n => ({ type: "note", content: n.subject || n.raw_entry.slice(0, 50), weight: 1 })),
      ...priorities.slice(0, 3).map(p => ({ type: "priority", content: p.title, weight: 2 })),
    ];

    const expanded = [];
    weightedItems.forEach(item => {
      for (let i = 0; i < item.weight; i++) {
        expanded.push(item);
      }
    });

    setItems(expanded);
  }, [notes, priorities]);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="overflow-hidden">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 text-xs"
      >
        {currentItem.type === "note" ? (
          <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : (
          <Flag className="w-3 h-3 text-amber-500 shrink-0" />
        )}
        <span className="truncate">{currentItem.content}</span>
      </motion.div>
    </div>
  );
}