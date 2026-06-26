"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

interface ActionItem {
  id: string;
  content: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface ActionItemListProps {
  reviewId: string;
  actions: ActionItem[];
  onChange: () => void;
}

export default function ActionItemList({
  reviewId,
  actions,
  onChange,
}: ActionItemListProps) {
  const [newContent, setNewContent] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent,
          dueDate: newDueDate || null,
        }),
      });
      if (!res.ok) throw new Error("添加失败");
      setNewContent("");
      setNewDueDate("");
      setAdding(false);
      onChange();
    } catch (err) {
      console.error("添加行动项失败:", err);
    }
  };

  const handleToggle = async (action: ActionItem) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/actions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: action.id,
          status: action.status === "done" ? "pending" : "done",
        }),
      });
      if (!res.ok) throw new Error("更新失败");
      onChange();
    } catch (err) {
      console.error("更新行动项失败:", err);
    }
  };

  const handleDelete = async (actionId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/actions/${actionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("删除失败");
      onChange();
    } catch (err) {
      console.error("删除行动项失败:", err);
    }
  };

  const statusLabels: Record<string, { label: string; variant: "default" | "success" | "warning" }> = {
    pending: { label: "待完成", variant: "warning" },
    done: { label: "已完成", variant: "success" },
    deferred: { label: "已推迟", variant: "default" },
  };

  return (
    <div>
      <h3
        className="text-sm font-serif mb-4"
        style={{ color: "var(--near-black)", fontWeight: 500 }}
      >
        行动项
      </h3>
      <div className="space-y-2.5 mb-4">
        {actions.map((action) => {
          const status = statusLabels[action.status] || statusLabels.pending;
          return (
            <div
              key={action.id}
              className="flex items-start gap-3 p-3.5 font-ui"
              style={{
                backgroundColor: "var(--ivory)",
                borderRadius: "8px",
                border: "1px solid var(--border-cream)",
              }}
            >
              <input
                type="checkbox"
                checked={action.status === "done"}
                onChange={() => handleToggle(action)}
                className="mt-0.5 rounded"
                style={{
                  accentColor: "var(--terracotta)",
                }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm"
                  style={{
                    color: action.status === "done" ? "var(--stone-gray)" : "var(--near-black)",
                    textDecoration: action.status === "done" ? "line-through" : "none",
                  }}
                >
                  {action.content}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {action.dueDate && (
                    <span className="text-xs" style={{ color: "var(--stone-gray)" }}>
                      截止: {formatDateTime(action.dueDate)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(action.id)}
                className="text-sm font-ui transition-colors"
                style={{ color: "var(--stone-gray)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--stone-gray)")}
              >
                删除
              </button>
            </div>
          );
        })}
      </div>

      {adding ? (
        <div>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <Input
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="输入行动项内容..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="w-full"
            />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="font-ui text-sm px-3 py-2 rounded-lg outline-none w-full sm:w-auto"
              style={{
                backgroundColor: "var(--warm-sand)",
                border: "1px solid var(--border-cream)",
                color: "var(--olive-gray)",
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>
              添加
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setNewContent("");
                setNewDueDate("");
              }}
            >
              取消
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdding(true)}
        >
          + 添加行动项
        </Button>
      )}
    </div>
  );
}
