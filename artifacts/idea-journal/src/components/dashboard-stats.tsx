import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Rocket, Share2, PenTool, Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardStats() {
  const { data: dashboard, isLoading } = useGetDashboard({
    query: { queryKey: getGetDashboardQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const currentStreak = (dashboard as any).currentStreak ?? 0;
  const longestStreak = (dashboard as any).longestStreak ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Ideas"
          value={dashboard.totalIdeas}
          icon={Lightbulb}
          colorClass="text-sky-600 bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400"
        />
        <StatCard
          title="Active Projects"
          value={dashboard.activeIdeas}
          icon={Rocket}
          colorClass="text-primary bg-primary/10"
        />
        <StatCard
          title="Shared Works"
          value={dashboard.sharedIdeas}
          icon={Share2}
          colorClass="text-violet-600 bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400"
        />
        <StatCard
          title="Journal Entries"
          value={dashboard.progressNotes}
          icon={PenTool}
          colorClass="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StreakCard
          title="Current Streak"
          value={currentStreak}
          icon={Flame}
          subtitle={currentStreak === 0 ? "Journal today to start!" : currentStreak === 1 ? "Day started — keep going!" : `${currentStreak} days in a row`}
          colorClass={cn(
            "text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400",
            currentStreak >= 7 && "text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400",
          )}
          accent={currentStreak >= 3}
        />
        <StreakCard
          title="Longest Streak"
          value={longestStreak}
          icon={Trophy}
          subtitle={longestStreak === 0 ? "No streak yet" : `Your personal best`}
          colorClass="text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: any, colorClass: string }) {
  return (
    <Card className="border-border/60 shadow-sm hover-elevate transition-all duration-300 rounded-2xl overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className={`p-3 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-serif font-medium text-foreground">{value}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StreakCard({
  title,
  value,
  icon: Icon,
  subtitle,
  colorClass,
  accent,
}: {
  title: string;
  value: number;
  icon: any;
  subtitle: string;
  colorClass: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn(
      "border-border/60 shadow-sm hover-elevate transition-all duration-300 rounded-2xl overflow-hidden group",
      accent && "border-orange-300/50 dark:border-orange-700/50",
    )}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn(`p-3 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`, colorClass)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-serif font-medium text-foreground">{value}</p>
              {value > 0 && <span className="text-sm text-muted-foreground">day{value !== 1 ? "s" : ""}</span>}
            </div>
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{subtitle}</p>
          </div>
        </div>
        {accent && value >= 3 && (
          <div className="mt-3 flex gap-1">
            {Array.from({ length: Math.min(value, 14) }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full bg-orange-400 dark:bg-orange-500"
                style={{ opacity: 0.4 + (i / Math.min(value, 14)) * 0.6 }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
