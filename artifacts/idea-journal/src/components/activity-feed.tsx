import { useGetProgressSummary, getGetProgressSummaryQueryKey, useListActivity, getListActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp, Zap, PlusCircle, Edit3, MessageSquare } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { ActivityItem } from "@workspace/api-client-react";

export function ActivityFeed() {
  const { data: activity, isLoading: isActivityLoading } = useListActivity({
    query: { queryKey: getListActivityQueryKey() }
  });

  const { data: summary, isLoading: isSummaryLoading } = useGetProgressSummary({
    query: { queryKey: getGetProgressSummaryQueryKey() }
  });

  if (isActivityLoading || isSummaryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summary && (
        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card">
          <CardHeader className="pb-4 border-b bg-muted/20">
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-5 h-5" />
              <CardTitle className="text-xl font-serif font-medium">Progress Pulse</CardTitle>
            </div>
            <CardDescription className="text-sm">Your recent momentum and habits.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <h4 className="text-sm font-medium text-foreground mb-1">Weekly Insight</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{summary.weeklySummary || "Not enough data to summarize yet."}</p>
                </div>
                <div className="space-y-3">
                  {summary.metrics && summary.metrics.map((metric, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-background border">
                      <div>
                        <div className="text-sm font-medium">{metric.label}</div>
                        <div className="text-xs text-muted-foreground">{metric.detail}</div>
                      </div>
                      <div className="text-lg font-serif font-medium text-primary">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Weekly Activity</h4>
                <div className="space-y-2">
                  {summary.weekly && summary.weekly.map((bucket, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{bucket.label}</span>
                        <span>{bucket.totalActivity} actions</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                        {bucket.ideasCreated > 0 && <div className="h-full bg-sky-500" style={{ width: `${(bucket.ideasCreated / Math.max(bucket.totalActivity, 1)) * 100}%` }} />}
                        {bucket.notesAdded > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(bucket.notesAdded / Math.max(bucket.totalActivity, 1)) * 100}%` }} />}
                        {bucket.ideasShared > 0 && <div className="h-full bg-violet-500" style={{ width: `${(bucket.ideasShared / Math.max(bucket.totalActivity, 1)) * 100}%` }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b bg-muted/20">
          <div className="flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-xl font-serif font-medium">Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {activity && activity.length > 0 ? (
              activity.map((item: ActivityItem) => (
                <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors flex gap-4 items-start">
                  <div className="mt-1 p-2 rounded-full bg-primary/10 text-primary shrink-0">
                    <ActivityIcon type={item.type} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{item.detail}</div>
                    <div className="text-xs text-muted-foreground mt-2 opacity-60">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No recent activity. Get started by planting a seed!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'idea_created': return <PlusCircle className="w-4 h-4 text-emerald-500" />;
    case 'idea_updated': return <Edit3 className="w-4 h-4 text-blue-500" />;
    case 'progress_added': return <MessageSquare className="w-4 h-4 text-amber-500" />;
    default: return <Zap className="w-4 h-4 text-primary" />;
  }
}
