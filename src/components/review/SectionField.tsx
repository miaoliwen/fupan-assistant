"use client";

import Textarea from "@/components/ui/Textarea";

interface Section {
  id?: string;
  sectionTitle: string;
  prompt: string;
  placeholder: string;
  content: string;
  order: number;
}

interface SectionFieldProps {
  section: Section;
  onChange: (content: string) => void;
}

export default function SectionField({ section, onChange }: SectionFieldProps) {
  return (
    <div className="mb-6">
      <label
        className="block font-serif text-base mb-1"
        style={{ color: "var(--near-black)", fontWeight: 500 }}
      >
        {section.sectionTitle}
      </label>
      {section.prompt && (
        <p className="font-ui text-xs mb-2" style={{ color: "var(--stone-gray)" }}>
          {section.prompt}
        </p>
      )}
      <Textarea
        value={section.content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={section.placeholder || `请输入${section.sectionTitle}...`}
        rows={4}
      />
    </div>
  );
}
