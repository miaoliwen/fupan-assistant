"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import {
  PageTransition,
  FadeIn,
  StaggerReveal,
  StaggerItem,
  motion,
} from "@/components/motion/MotionElements";

const defaultSections = [
  { sectionTitle: "做了什么", content: "", order: 0 },
  { sectionTitle: "做得好的", content: "", order: 1 },
  { sectionTitle: "需改进的", content: "", order: 2 },
  { sectionTitle: "下一步", content: "", order: 3 },
];

export default function NewReviewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState(defaultSections);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, templateId: null, category: "custom", sections }),
    });

    if (res.ok) {
      const review = await res.json();
      router.push(`/reviews/${review.id}`);
    }
    setSaving(false);
  };

  const updateSection = (i: number, content: string) => {
    const next = [...sections];
    next[i] = { ...next[i], content };
    setSections(next);
  };

  const addSection = () => {
    setSections([...sections, { sectionTitle: `区块 ${sections.length + 1}`, content: "", order: sections.length }]);
  };

  const removeSection = (i: number) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx })));
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <FadeIn delay={0}>
          <h1
            className="font-serif mb-6 sm:mb-8"
            style={{ fontSize: "28px", fontWeight: 500, color: "var(--near-black)", lineHeight: 1.2 }}
          >
            新建复盘
          </h1>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="mb-6 sm:mb-8">
            <label
              className="block font-ui text-sm mb-2"
              style={{ color: "var(--charcoal-warm)", fontWeight: 500 }}
            >
              标题
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入复盘标题，例如：每周工作复盘 - 第 22 周"
            />
          </div>
        </FadeIn>

        <StaggerReveal>
          {sections.map((section, i) => (
            <StaggerItem key={i}>
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-1">
                  <input
                    value={section.sectionTitle}
                    onChange={(e) => {
                      const next = [...sections];
                      next[i] = { ...next[i], sectionTitle: e.target.value };
                      setSections(next);
                    }}
                    className="font-serif text-base bg-transparent outline-none border-b border-transparent focus:border-[var(--focus-blue)] transition-colors w-full max-w-[80%]"
                    style={{ color: "var(--near-black)", fontWeight: 500 }}
                  />
                  {sections.length > 1 && (
                    <motion.button
                      onClick={() => removeSection(i)}
                      className="font-ui text-xs shrink-0 ml-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ color: "var(--stone-gray)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--stone-gray)")}
                    >
                      移除
                    </motion.button>
                  )}
                </div>
                <Textarea
                  value={section.content}
                  onChange={(e) => updateSection(i, e.target.value)}
                  placeholder={`填写${section.sectionTitle}...`}
                  rows={4}
                />
              </div>
            </StaggerItem>
          ))}
        </StaggerReveal>

        <motion.button
          onClick={addSection}
          className="font-ui text-sm mb-8"
          whileHover={{ x: 4 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          style={{ color: "var(--terracotta)" }}
        >
          + 添加区块
        </motion.button>

        <motion.div
          className="flex gap-3 pt-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 24, delay: 0.3 }}
        >
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "保存中..." : "保存复盘"}
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>
            取消
          </Button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
