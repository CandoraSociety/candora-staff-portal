import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Send, Loader2 } from "lucide-react";

export default function BoardAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm the Candora Board Assistant. I can help with governance questions, meeting procedures, Robert's Rules of Order, nonprofit law, and board best practices. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    const history = [...messages, userMsg].map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the Candora Board Assistant — an expert in nonprofit governance, Robert's Rules of Order, board fiduciary duties, Canadian nonprofit law, and board best practices. Be concise, professional, and practical.

Conversation history:
${history}

Respond helpfully to the user's latest message.`,
    });
    setMessages(prev => [...prev, { role: "assistant", content: typeof result === "string" ? result : result?.response || "I'm sorry, I couldn't generate a response." }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      <div className="p-6 border-b border-border">
        <h1 className="font-heading text-3xl font-semibold">Board Assistant</h1>
        <p className="text-muted-foreground text-sm mt-1">AI-powered governance guidance and support</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border px-4 py-3 rounded-2xl flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 size={14} className="animate-spin" /> Thinking...
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask about governance, motions, board duties..."
            className="flex-1 border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={send} disabled={!input.trim() || loading} className="bg-primary text-primary-foreground px-4 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">AI guidance is for informational purposes. Consult legal counsel for formal advice.</p>
      </div>
    </div>
  );
}