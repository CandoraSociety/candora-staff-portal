import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle2, MousePointerClick } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const ANIMATION_VARIANTS = {
  fade_in: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } },
  slide_up: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } },
  slide_left: { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.4 } },
  drop_in: { initial: { opacity: 0, y: -40 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, type: "spring", bounce: 0.4 } },
  zoom_in: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4 } },
};

const CHART_COLORS = ["#f5c116", "#0f1f6b", "#2b2de8", "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

function parseChartData(rawData) {
  if (!rawData) return [];
  return rawData
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [label, value] = line.split(",").map(s => s.trim());
      return { label: label || "", value: parseFloat(value) || 0 };
    });
}

export default function DynamicBlockPreview({ data }) {
  const elements = data.elements || [];
  const [revealedCount, setRevealedCount] = useState(0);

  const allRevealed = revealedCount >= elements.length;
  const nextElement = elements[revealedCount];

  const revealNext = () => {
    if (allRevealed) return;
    setRevealedCount(c => c + 1);
  };

  if (elements.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
        No elements added yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.title && <p className="text-sm font-semibold text-muted-foreground">{data.title}</p>}

      <div className="space-y-3 min-h-[120px]">
        <AnimatePresence>
          {elements.slice(0, revealedCount).map((el, idx) => {
            const anim = ANIMATION_VARIANTS[el.animation] || ANIMATION_VARIANTS.fade_in;
            return (
              <motion.div
                key={el.id}
                initial={anim.initial}
                animate={anim.animate}
                transition={anim.transition}
              >
                <RenderedElement element={el} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Reveal button */}
      <div className="flex items-center justify-center">
        {allRevealed ? (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="w-4 h-4" /> All content revealed
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={revealNext} className="border-dashed">
            <MousePointerClick className="w-3.5 h-3.5 mr-1.5" />
            {revealedCount === 0 ? "Click to start" : "Reveal next"}
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </div>

      {/* Progress dots */}
      {elements.length > 1 && (
        <div className="flex items-center justify-center gap-1">
          {elements.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i < revealedCount ? "bg-primary" : "bg-muted-foreground/20"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RenderedElement({ element }) {
  if (element.type === "text") {
    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap">{element.content}</div>
    );
  }

  if (element.type === "image") {
    if (!element.url) return null;
    return (
      <img
        src={element.url}
        alt={element.alt_text || ""}
        className="rounded-lg border w-full max-h-80 object-contain"
      />
    );
  }

  if (element.type === "chart") {
    return <ChartElement element={element} />;
  }

  return null;
}

function ChartElement({ element }) {
  const chartData = useMemo(() => parseChartData(element.chart_data), [element.chart_data]);
  const chartType = element.chart_type || "bar";
  const hasData = chartData.length > 0;

  if (!hasData) {
    return (
      <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
        No chart data
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      {element.chart_title && <p className="text-xs font-medium text-center mb-1">{element.chart_title}</p>}
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "bar" ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        ) : chartType === "line" ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={({ label }) => label}>
              {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}