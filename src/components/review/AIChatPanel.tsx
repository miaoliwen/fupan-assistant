"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  reviewId: string;
}

export default function AIChatPanel({ reviewId }: AIChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, messages: newMessages }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "请求失败" }));
        setMessages([
          ...newMessages,
          { role: "assistant", content: err.error || "抱歉，出了点问题，请稍后再试。" },
        ]);
        return;
      }
      const data = await res.json();
      if (data.reply) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "抱歉，出了点问题，请稍后再试。" },
      ]);
    }
    setLoading(false);
  };

  const quickPrompts = [
    "帮我深入反思这篇复盘",
    "我的改进计划具体吗？",
    "这段复盘里有什么模式？",
    "帮我补充行动项的细节",
  ];

  return (
    <div
      className="mt-6 font-ui"
      style={{
        backgroundColor: "var(--ivory)",
        borderRadius: "12px",
        border: "1px solid var(--border-cream)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div>
          <h3 className="font-serif" style={{ fontSize: "16px", fontWeight: 500, color: "var(--near-black)" }}>
            AI 复盘助手
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--stone-gray)" }}>
            与 AI 对话，深入反思这篇复盘内容
          </p>
        </div>
        <span className="text-sm" style={{ color: "var(--stone-gray)" }}>
          {open ? "收起" : "展开"}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {/* Messages */}
          <div
            className="mb-3 overflow-y-auto"
            style={{
              maxHeight: "320px",
              borderRadius: "8px",
              backgroundColor: "var(--warm-sand)",
              padding: messages.length > 0 ? "12px" : "0",
            }}
          >
            {messages.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm mb-3" style={{ color: "var(--olive-gray)" }}>
                  选择一个话题开始对话
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setInput(prompt);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs transition-colors active:scale-95"
                      style={{
                        backgroundColor: "var(--ivory)",
                        color: "var(--olive-gray)",
                        border: "1px solid var(--border-cream)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--terracotta)";
                        e.currentTarget.style.color = "var(--ivory)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--ivory)";
                        e.currentTarget.style.color = "var(--olive-gray)";
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-3 last:mb-0 ${msg.role === "user" ? "text-right" : "text-left"}`}
              >
                <div
                  className={`inline-block px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
                  style={{
                    backgroundColor: msg.role === "user" ? "var(--terracotta)" : "var(--ivory)",
                    color: msg.role === "user" ? "var(--ivory)" : "var(--near-black)",
                    borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  }}
                >
                  {msg.role === "assistant" ? (
                    <div className="markdown-content text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-left">
                <div
                  className="inline-block px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: "var(--ivory)",
                    color: "var(--stone-gray)",
                    borderRadius: "12px 12px 12px 2px",
                  }}
                >
                  思考中...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="输入你的问题或想法..."
              className="flex-1 font-ui text-sm px-3 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: "var(--warm-sand)",
                border: "1px solid var(--border-cream)",
                color: "var(--near-black)",
              }}
            />
            <Button size="sm" onClick={handleSend} disabled={loading || !input.trim()}>
              {loading ? "发送中..." : "发送"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
