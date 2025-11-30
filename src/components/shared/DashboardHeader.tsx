import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  highlight?: string;
  children?: ReactNode;
  className?: string;
}

export function DashboardHeader({ 
  title, 
  subtitle, 
  badge,
  highlight,
  children,
  className 
}: DashboardHeaderProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/30 p-10 border border-slate-100 shadow-sm",
      className
    )}>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {badge && (
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-base text-muted-foreground leading-relaxed">
          {subtitle}
          {highlight && (
            <span className="font-semibold text-primary ml-1">{highlight}</span>
          )}
        </p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
