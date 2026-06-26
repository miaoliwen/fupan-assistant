"use client";

import { motion, AnimatePresence } from "framer-motion";
import React from "react";

/* ============================
   Spring 物理参数
   ============================ */
export const spring = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  mass: 1,
};

export const springSnap = {
  type: "spring" as const,
  stiffness: 200,
  damping: 18,
};

export const springGentle = {
  type: "spring" as const,
  stiffness: 80,
  damping: 24,
};

export const springOvershoot = {
  type: "spring" as const,
  stiffness: 300,
  damping: 12,
};

/* ============================
   Stagger 容器 — 子元素瀑布式入场
   ============================ */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
};

/* ============================
   Motion Wrappers (保持 Server Components 纯净)
   ============================ */
export function MotionDiv({
  children,
  className,
  style,
  ...props
}: React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div className={className} style={style} {...props}>
      {children}
    </motion.div>
  );
}

export function MotionSpan({
  children,
  className,
  style,
  ...props
}: React.ComponentProps<typeof motion.span>) {
  return (
    <motion.span className={className} style={style} {...props}>
      {children}
    </motion.span>
  );
}

/* ============================
   StaggerReveal — 列表瀑布入场
   ============================ */
export function StaggerReveal({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div className={className} style={style} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

/* ============================
   页面过渡包装器
   ============================ */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springGentle}
    >
      {children}
    </motion.div>
  );
}

/* ============================
   FadeIn 组件 — 淡入上升入场
   ============================ */
export function FadeIn({
  children,
  delay = 0,
  className,
  style,
  once = true,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once }}
      transition={{ ...springGentle, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ============================
   HoverScale — 卡片悬浮微交互
   ============================ */
export function HoverCard({
  children,
  className,
  style,
  as = "div",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "a";
  href?: string;
}) {
  const Tag = as === "a" ? motion.a : motion.div;
  return (
    <Tag
      className={className}
      style={style}
      whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
      whileTap={{ scale: 0.99 }}
      transition={springSnap}
      {...(as === "a" && href ? { href } : {})}
    >
      {children}
    </Tag>
  );
}

/* ============================
   MagneticButton — 磁吸物理按钮
   ============================ */
export function MagneticButton({
  children,
  className,
  style,
  onClick,
  disabled,
  type,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const x = React.useRef(0);
  const y = React.useRef(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.current = (e.clientX - centerX) * 0.15;
    y.current = (e.clientY - centerY) * 0.15;
    ref.current.style.transform = `translate(${x.current}px, ${y.current}px)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    x.current = 0;
    y.current = 0;
    ref.current.style.transform = "translate(0, 0)";
    ref.current.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    setTimeout(() => {
      if (ref.current) ref.current.style.transition = "";
    }, 400);
  };

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={className}
      style={style}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onPointerDown={() => {
        if (ref.current)
          ref.current.style.transform = "scale(0.97)";
      }}
      onPointerUp={() => {
        if (ref.current) {
          ref.current.style.transform = `translate(${x.current}px, ${y.current}px)`;
        }
      }}
    >
      {children}
    </button>
  );
}

/* ============================
   NumberTicker — 数字滚动计数器
   ============================ */
export function NumberTicker({
  value,
  className,
  style,
}: {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [display, setDisplay] = React.useState(0);
  const prev = React.useRef(0);
  const frame = React.useRef(0);

  React.useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    const duration = 60; // frames
    let frameCount = 0;

    const animate = () => {
      frameCount++;
      const progress = Math.min(frameCount / duration, 1);
      // spring-like easing
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) {
        frame.current = requestAnimationFrame(animate);
      } else {
        prev.current = value;
      }
    };

    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [value]);

  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}

/* ============================
   AnimatedPresenceWrapper — 进出场动画容纳器
   ============================ */
export { motion, AnimatePresence };
