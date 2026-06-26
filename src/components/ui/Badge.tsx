import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger";
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: "var(--warm-sand)",
      color: "var(--charcoal-warm)",
    },
    success: {
      backgroundColor: "var(--warm-sand)",
      color: "var(--terracotta)",
    },
    warning: {
      backgroundColor: "#f0e8d8",
      color: "var(--charcoal-warm)",
    },
    danger: {
      backgroundColor: "#f0d8d8",
      color: "var(--error)",
    },
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-ui text-xs font-medium",
        className
      )}
      style={{
        ...variantStyles[variant],
        padding: "2px 8px",
        borderRadius: "24px",
        letterSpacing: "0.12px",
      }}
    >
      {children}
    </span>
  );
}
