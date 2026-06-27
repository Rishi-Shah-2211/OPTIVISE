"use client";

import { useState } from "react";

export function Copilot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: string; content: string }[]
  >([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    setInput("");

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "No response" },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* 🔥 Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 bg-[#fffaf1] text-black px-4 py-2 rounded-xl shadow-lg"
      >
        Copilot
      </button>

      {/* 🔥 Chat Panel */}
      {open && (
        <div className="fixed bottom-20 left-6 w-80 h-96 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col">
          <div className="p-3 border-b border-zinc-800 font-medium">
            AI Copilot
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-sm ${
                  m.role === "user"
                    ? "bg-[#fffaf1] text-black ml-auto"
                    : "bg-zinc-800 text-[#1b1d1b]"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-zinc-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2 bg-zinc-800 rounded-lg text-sm"
              placeholder="Ask something..."
            />
            <button
              onClick={sendMessage}
              className="px-3 bg-[#fffaf1] text-black rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}