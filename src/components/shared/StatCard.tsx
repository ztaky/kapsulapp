import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  isHighlighted?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  isHighlighted = false
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground tracking-tight">
          {title}
        </CardTitle>
        <div className="rounded-2xl p-3 w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-600">
          <Icon className="h-6 w-6" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className={cn(
          "text-4xl font-bold tracking-tight mb-1",
          isHighlighted ? "bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent" : "text-foreground"
        )}>
          {value}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
