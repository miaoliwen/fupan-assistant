import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/motion/MotionElements";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  magnetic?: boolean;
}

export default function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  magnetic = false,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-ui font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none";

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--terracotta)",
      color: "var(--ivory)",
      borderRadius: "8px",
      boxShadow: "0px 0px 0px 1px var(--terracotta)",
    },
    secondary: {
      backgroundColor: "var(--warm-sand)",
      color: "var(--charcoal-warm)",
      borderRadius: "8px",
      boxShadow: "0px 0px 0px 1px var(--warm-sand), 0px 0px 0px 2px var(--ring-warm)",
    },
    danger: {
      backgroundColor: "var(--error)",
      color: "var(--ivory)",
      borderRadius: "8px",
      boxShadow: "0px 0px 0px 1px var(--error)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--olive-gray)",
      borderRadius: "8px",
    },
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const hoverStyles: Record<string, string> = {
    primary: "var(--terracotta-hover)",
    secondary: "var(--border-warm)",
    ghost: "var(--border-cream)",
  };

  const variantBgReset: Record<string, string> = {
    primary: "var(--terracotta)",
    secondary: "var(--warm-sand)",
    ghost: "transparent",
  };

  if (magnetic) {
    return (
      <MagneticButton
        className={cn(base, sizes[size], className)}
        style={variantStyles[variant]}
        disabled={props.disabled}
        type={props.type}
        onClick={props.onClick}
        {...(props as any)}
      >
        {children}
      </MagneticButton>
    );
  }

  return (
    <button
      className={cn(base, sizes[size], className)}
      style={variantStyles[variant]}
      {...props}
      onMouseEnter={(e) => {
        if (!props.disabled) {
          const el = e.currentTarget;
          el.style.backgroundColor = hoverStyles[variant] || variantStyles[variant].backgroundColor as string;
          el.style.transform = "translateY(-1px)";
          el.style.boxShadow =
            variant === "primary"
              ? "0 4px 12px rgba(201, 100, 66, 0.3)"
              : "0 4px 12px rgba(0,0,0,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.backgroundColor = variantBgReset[variant];
        el.style.transform = "translateY(0)";
        el.style.boxShadow = variantStyles[variant].boxShadow as string;
      }}
      onPointerDown={(e) => {
        e.currentTarget.style.transform = "scale(0.97) translateY(0)";
        e.currentTarget.style.transition = "transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)";
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.transition = "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.transition = "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
      }}
    >
      {children}
    </button>
  );
}
