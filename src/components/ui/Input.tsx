import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full font-ui text-sm",
        "border transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-[var(--focus-blue)]",
        "placeholder:font-ui",
        className
      )}
      style={{
        backgroundColor: "var(--pure-white)",
        borderColor: "var(--border-warm)",
        borderRadius: "12px",
        padding: "8px 12px",
        color: "var(--near-black)",
      }}
      {...props}
    />
  );
}
