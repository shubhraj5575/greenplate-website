"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { matchRule, SUGGESTIONS } from "./chatRules";

interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
}

let msgId = 0;

const WELCOME: Message = {
  id: ++msgId,
  role: "bot",
  text: "Hi! I can answer questions about GreenPlate — carbon scopes, data sources, how to use the app, and more.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    const userMsg: Message = { id: ++msgId, role: "user", text: msg };
    const botMsg: Message = { id: ++msgId, role: "bot", text: matchRule(msg) };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput("");
  }

  return (
    <>
      {/* Floating pill trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-forest-900 px-5 py-3 text-sm font-medium text-cream-50 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:bg-forest-700"
      >
        {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        {!open && "Ask GreenPlate"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 flex w-[360px] flex-col overflow-hidden rounded-[20px] border border-ink-900/10 bg-cream-50 shadow-[var(--shadow-card)]" style={{ height: 520 }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-forest-700/10 bg-forest-900 px-5 py-4">
            <div>
              <p className="font-display text-base text-cream-50">GreenPlate Assistant</p>
              <p className="text-xs text-cream-100/70">Rule-based · LLM answers coming soon</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-cream-100/70 hover:text-cream-50 transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map(m => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={[
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-forest-900 text-cream-50 rounded-br-sm"
                    : "bg-bone-100 text-ink-900 rounded-bl-sm",
                ].join(" ")}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions (only after welcome, before first user message) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-forest-700/20 px-3 py-1 text-xs text-forest-700 hover:bg-forest-700/5 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-forest-700/10 px-4 py-3 flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask a question…"
              className="flex-1 rounded-full border border-forest-700/15 bg-cream-100 px-4 py-2 text-sm text-ink-900 outline-none focus:border-forest-700"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 text-cream-50 transition hover:bg-forest-900 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
