import { Card, CardContent } from "@/components/ui/card";
import { Bot } from "lucide-react";

const POINTERS = [
  "Say what Candora is, who it serves and where, in one sentence, near the top of the home page.",
  "Give each program its own page with what it is, who it is for and how to start.",
  "Answer the questions people ask at the front desk in a short FAQ on the site.",
];

// How the site reads to AI assistants, and the few things that change how they
// describe and recommend the organization.
export default function AiSearchCard({ notes }) {
  return (
    <Card className="border-primary/25 bg-primary/5 shadow-sm">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">How AI assistants see you</h2>
        </div>
        {notes ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{notes}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Run a review and this explains how ChatGPT and Google's AI answers describe Candora today.
          </p>
        )}
        <ul className="space-y-1.5 pt-1 border-t border-primary/20">
          {POINTERS.map((pointer) => (
            <li key={pointer} className="text-xs text-muted-foreground flex gap-2">
              <span className="text-primary font-bold">·</span>
              <span>{pointer}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}