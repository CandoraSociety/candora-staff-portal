import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Sparkles, X } from "lucide-react";
import EAAssistantWidget from "./EAAssistantWidget";

// Only visible to Graham Currie (Executive Director)
const EA_AUTHORIZED_EMAIL = "graham.currie@candora.ca";
const EA_AUTHORIZED_NAME = "Graham Currie";

function isAuthorized(user) {
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  const name = (user.full_name || "").toLowerCase().trim();
  return (
    email === EA_AUTHORIZED_EMAIL.toLowerCase() ||
    email.includes("graham") ||
    name === EA_AUTHORIZED_NAME.toLowerCase() ||
    name.includes("graham currie")
  );
}

export default function EAFloatingWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!isAuthorized(user)) return null;

  return (
    <>
      {/* Floating chat window */}
      {open && (
        <div
          className="fixed bottom-52 right-4 z-[9999] w-[420px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-2xl"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          <div className="relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-lg hover:opacity-80 transition-opacity"
              style={{ background: "hsl(230,70%,12%)", border: "1px solid hsl(230,50%,25%)", color: "hsl(45,60%,75%)" }}
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <EAAssistantWidget />
          </div>
        </div>
      )}

      {/* Floating action button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-36 right-4 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{
          background: open
            ? "hsl(230,70%,15%)"
            : "linear-gradient(135deg, hsl(45,92%,53%), hsl(35,95%,60%))",
          border: "2px solid hsl(45,92%,53%)",
        }}
        title="Executive Assistant"
      >
        {open
          ? <X className="w-6 h-6" style={{ color: "hsl(45,92%,53%)" }} />
          : <Sparkles className="w-6 h-6" style={{ color: "hsl(230,70%,10%)" }} />
        }
      </button>
    </>
  );
}