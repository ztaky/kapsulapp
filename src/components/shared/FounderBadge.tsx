import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FounderBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export function FounderBadge({ size = "md", className }: FounderBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full shadow-sm",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      <Sparkles className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      FONDATEUR
    </div>
  );
}
