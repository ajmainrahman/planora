import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Rocket, Share2, PenTool } from "lucide-react";

export function DashboardStats() {
  const { data: dashboard, isLoading } = useGetDashboard({
    query: { queryKey: getGetDashboardQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    );
  }

  if (!dashboard) return null;

  return (
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
