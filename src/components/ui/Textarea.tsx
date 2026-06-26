import { cn } from "@/lib/utils";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export default function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full font-ui text-sm transition-all duration-200",
        "border resize-y min-h-[80px]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--focus-blue)]",
        "placeholder:font-ui",
        className
      )}
      style={{
        backgroundColor: "var(--pure-white)",
        borderColor: "var(--border-warm)",
        borderRadius: "12px",
        padding: "10px 12px",
        color: "var(--near-black)",
        lineHeight: "1.6",
      }}
      {...props}
    />
  );
}
