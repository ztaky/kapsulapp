import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  colorVariant?: "slate" | "amber";
  isHighlighted?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  colorVariant = "slate",
  isHighlighted = false
}: StatCardProps) {
  return (
    <div className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="rounded-xl p-3 flex items-center justify-center bg-amber-50">
        <Icon className="h-5 w-5 text-slate-600" />
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
