"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import "./globals.css";

// 抑制 Framer Motion 的 releasePointerCapture 已知无害错误
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    if (e.message?.includes("releasePointerCapture")) {
      e.preventDefault();
    }
  });
}

function KeyboardShortcuts({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          router.push("/reviews/new");
          break;
        case "e":
          if (pathname.match(/^\/reviews\/[\w]+$/)) {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent("shortcut-export"));
          }
          break;
        case "s":
          if (pathname.match(/^\/reviews\/[\w]+$/)) {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent("shortcut-save"));
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, pathname]);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased" style={{ backgroundColor: "var(--parchment)" }}>
        <ThemeProvider>
          <KeyboardShortcuts>
            <div className="flex min-h-[100dvh]">
              <Sidebar />
              <main className="flex-1 px-4 sm:px-6 md:px-12 py-5 md:py-10 overflow-auto pb-20 md:pb-10">
                {children}
              </main>
            </div>
            <BottomNav />
          </KeyboardShortcuts>
        </ThemeProvider>
      </body>
    </html>
  );
}
