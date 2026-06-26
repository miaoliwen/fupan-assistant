"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ActionItemList from "@/components/review/ActionItemList";
import AIChatPanel from "@/components/review/AIChatPanel";
import { formatDate } from "@/lib/utils";
import { useAuthGuard } from "@/hooks";
import {
  PageTransition,
  FadeIn,
  motion,
} from "@/components/motion/MotionElements";

interface ReviewSection {
  id: string;
  sectionTitle: string;
  content: string;
  order: number;
}

interface ActionItem {
  id: string;
  content: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface Review {
  id: string;
  title: string;
  date: string;
  category: string;
  sections: ReviewSection[];
  actions: ActionItem[];
}

const categoryLabels: Record<string, string> = {
  work: "工作",
  project: "项目",
  personal: "个人",
  custom: "自定义",
};

function exportToMarkdown(review: Review) {
  const lines: string[] = [
    `# ${review.title}`,
    "",
    `> 分类: ${categoryLabels[review.category] || review.category} | 日期: ${formatDate(review.date)}`,
    "",
    "---",
    "",
  ];

  review.sections.forEach((s) => {
    lines.push(`## ${s.sectionTitle}`, "");
    lines.push(s.content || "_未填写_");
    lines.push("");
  });

  if (review.actions.length > 0) {
    lines.push("## 行动项", "");
    review.actions.forEach((a) => {
      const status = a.status === "done" ? "x" : " ";
      lines.push(`- [${status}] ${a.content}`);
    });
    lines.push("");
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${review.title}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [review, setReview] = useState<Review | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<ReviewSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const { user } = useAuthGuard();

  const fetchReview = () => {
    if (!user) return;
    fetch(`/api/reviews/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setReview(data);
        setTitle(data.title);
        setSections(data.sections);
      })
      .catch((err) => console.error("加载复盘失败:", err));
  };

  useEffect(() => {
    if (user) fetchReview();
  }, [id, user]);

  const handleSave = useCallback(async () => {
    if (!review) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sections }),
      });
      if (!res.ok) throw new Error("保存失败");
      setEditing(false);
      fetchReview();
    } catch (err) {
      console.error("保存复盘失败:", err);
    }
    setSaving(false);
  }, [id, title, sections, review]);

  const handleExport = useCallback(() => {
    if (review) exportToMarkdown(review);
  }, [review]);

  // Keyboard shortcuts
  useEffect(() => {
    const onSave = () => handleSave();
    const onExport = () => handleExport();
    document.addEventListener("shortcut-save", onSave);
    document.addEventListener("shortcut-export", onExport);
    return () => {
      document.removeEventListener("shortcut-save", onSave);
      document.removeEventListener("shortcut-export", onExport);
    };
  }, [handleSave, handleExport]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      router.push("/reviews");
    } catch (err) {
      console.error("删除复盘失败:", err);
    }
  };

  if (!review) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-ui"
        style={{ color: "var(--stone-gray)" }}
      >
        加载中...
      </motion.p>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <FadeIn delay={0}>
          <div className="flex flex-col sm:flex-row items-start justify-between mb-6 sm:mb-8 gap-3">
            <div className="min-w-0 w-full sm:flex-1">
              {editing ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-serif w-full pb-1 outline-none"
                  style={{
                    fontSize: "24px",
                    fontWeight: 500,
                    color: "var(--near-black)",
                    backgroundColor: "transparent",
                    borderBottom: "2px solid var(--focus-blue)",
                  }}
                />
              ) : (
                <h1
                  className="font-serif"
                  style={{ fontSize: "24px", fontWeight: 500, color: "var(--near-black)", lineHeight: 1.3 }}
                >
                  {review.title}
                </h1>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="font-ui text-xs" style={{ color: "var(--stone-gray)" }}>
                  {formatDate(review.date)}
                </span>
                <Badge>{categoryLabels[review.category] || review.category}</Badge>
                <span className="font-ui text-xs hidden sm:inline" style={{ color: "var(--stone-gray)", opacity: 0.5 }}>
                  Ctrl+S 保存 · Ctrl+E 导出
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap shrink-0 w-full sm:w-auto">
              {editing ? (
                <>
                  <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
                    {saving ? "保存中..." : "保存"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 sm:flex-none"
                    onClick={() => {
                      setEditing(false);
                      setTitle(review.title);
                      setSections(review.sections);
                    }}
                  >
                    取消
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => setEditing(true)} className="flex-1 sm:flex-none">
                    编辑
                  </Button>
                  <Button variant="secondary" onClick={handleExport} className="flex-1 sm:flex-none">
                    导出
                  </Button>
                  <Button variant="danger" onClick={() => setShowDelete(true)} className="flex-1 sm:flex-none">
                    删除
                  </Button>
                </>
              )}
            </div>
          </div>
        </FadeIn>

        <motion.div
          className="p-4 sm:p-6 mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 24, delay: 0.08 }}
          style={{
            backgroundColor: "var(--ivory)",
            borderRadius: "12px",
            border: "1px solid var(--border-cream)",
          }}
        >
          {editing
            ? sections.map((section, i) => (
                <div key={section.id} className="mb-5 sm:mb-6 last:mb-0">
                  <label
                    className="block font-serif text-base mb-1"
                    style={{ color: "var(--near-black)", fontWeight: 500 }}
                  >
                    {section.sectionTitle}
                  </label>
                  <Textarea
                    value={section.content}
                    onChange={(e) => {
                      const next = [...sections];
                      next[i] = { ...next[i], content: e.target.value };
                      setSections(next);
                    }}
                    rows={4}
                  />
                  {section.content && (
                    <details className="mt-1">
                      <summary
                        className="font-ui text-xs cursor-pointer"
                        style={{ color: "var(--stone-gray)" }}
                      >
                        预览 Markdown
                      </summary>
                      <div className="markdown-content mt-2 p-3 rounded-lg" style={{ backgroundColor: "var(--warm-sand)" }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {section.content}
                        </ReactMarkdown>
                      </div>
                    </details>
                  )}
                </div>
              ))
            : review.sections.map((section) => (
                <motion.div
                  key={section.id}
                  className="mb-5 sm:mb-6 last:mb-0"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 80, damping: 24, delay: 0.12 }}
                >
                  <h3
                    className="font-serif text-base mb-2"
                    style={{ color: "var(--near-black)", fontWeight: 500 }}
                  >
                    {section.sectionTitle}
                  </h3>
                  {section.content ? (
                    <div className="markdown-content font-ui text-sm" style={{ color: "var(--olive-gray)" }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p
                      className="font-ui text-sm italic"
                      style={{ color: "var(--stone-gray)" }}
                    >
                      未填写
                    </p>
                  )}
                </motion.div>
              ))}
        </motion.div>

        <motion.div
          className="p-4 sm:p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 24, delay: 0.15 }}
          style={{
            backgroundColor: "var(--ivory)",
            borderRadius: "12px",
            border: "1px solid var(--border-cream)",
          }}
        >
          <ActionItemList
            reviewId={review.id}
            actions={review.actions}
            onChange={fetchReview}
          />
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-cream)" }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  const res = await fetch("/api/ai/extract-actions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reviewId: review.id }),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: "请求失败" }));
                    alert(err.error || "AI 提取失败");
                    return;
                  }
                  const data = await res.json();
                  if (data.created?.length > 0) {
                    alert(`AI 提取了 ${data.created.length} 个行动项`);
                  } else {
                    alert("没有发现新的行动项");
                  }
                  fetchReview();
                } catch (err) {
                  console.error("AI 提取行动项失败:", err);
                  alert("AI 服务暂时不可用");
                }
              }}
            >
              AI 智能提取行动项
            </Button>
            <p className="text-xs mt-1.5 font-ui" style={{ color: "var(--stone-gray)", opacity: 0.7 }}>
              AI 分析复盘内容，自动提取可执行行动并设定截止日期
            </p>
          </div>
        </motion.div>

        <Modal
          open={showDelete}
          onClose={() => setShowDelete(false)}
          title="确认删除"
        >
          <p className="font-ui text-sm mb-6" style={{ color: "var(--olive-gray)", lineHeight: 1.6 }}>
            确定要删除这条复盘记录吗？此操作不可撤销。
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowDelete(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              确认删除
            </Button>
          </div>
        </Modal>

        <AIChatPanel reviewId={review.id} />
      </div>
    </PageTransition>
  );
}
