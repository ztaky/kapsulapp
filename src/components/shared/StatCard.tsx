import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ColorVariant = "orange" | "pink" | "green" | "purple" | "blue" | "slate";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  colorVariant?: ColorVariant;
  isHighlighted?: boolean;
}

const colorVariants: Record<ColorVariant, { bg: string; icon: string }> = {
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-500",
  },
  pink: {
    bg: "bg-pink-50",
    icon: "text-pink-500",
  },
  green: {
    bg: "bg-emerald-50",
    icon: "text-emerald-500",
  },
  purple: {
    bg: "bg-violet-50",
    icon: "text-violet-500",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-500",
  },
  slate: {
    bg: "bg-slate-100",
    icon: "text-slate-500",
  },
};

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  colorVariant = "slate",
  isHighlighted = false
}: StatCardProps) {
  const colors = colorVariants[colorVariant];

  return (
    <div className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className={cn(
        "rounded-xl p-3 flex items-center justify-center",
        colors.bg
      )}>
        <Icon className={cn("h-5 w-5", colors.icon)} />
      </div>
      
      <div className="flex flex-col">
        <span className="text-sm font-medium text-muted-foreground mb-1">
          {title}
        </span>
        <span className={cn(
          "text-2xl font-bold tracking-tight",
          isHighlighted 
            ? "bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent" 
            : "text-foreground"
        )}>
          {value}
        </span>
        {description && (
          <span className="text-xs text-muted-foreground mt-1">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
