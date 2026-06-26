"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(20, 20, 19, 0.5)" }}
        onClick={onClose}
      />
      <div
        className="relative font-ui w-full sm:max-w-lg sm:mx-4 max-h-[90dvh] overflow-auto rounded-t-2xl sm:rounded-2xl"
        style={{
          backgroundColor: "var(--pure-white)",
          boxShadow: "0px 0px 0px 1px var(--border-warm), rgba(0,0,0,0.05) 0px 4px 24px",
        }}
      >
        {title && (
          <div
            className="px-5 sm:px-6 py-4"
            style={{ borderBottom: "1px solid var(--border-cream)" }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-serif"
                style={{ color: "var(--near-black)", fontWeight: 500 }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-lg leading-none sm:hidden"
                style={{ color: "var(--stone-gray)" }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
