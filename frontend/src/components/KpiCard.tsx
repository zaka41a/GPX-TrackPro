import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number | null;
  icon?: ReactNode;
  iconBg?: string;
  trend?: string;
  className?: string;
}

export function KpiCard({ title, value, icon, iconBg, trend, className }: KpiCardProps) {
  return (
    <Card className={cn("glass-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{title}</p>
            {value !== null ? (
              <p className="text-2xl font-bold font-mono-data text-foreground">{value}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No data yet</p>
            )}
            {trend && <p className="text-xs text-accent mt-1.5">{trend}</p>}
          </div>
          {icon && (
            <div className={cn("stat-icon-bg", iconBg || "bg-accent/10 text-accent")}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
