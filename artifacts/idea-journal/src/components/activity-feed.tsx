import { useListActivity, getListActivityQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { PlusCircle, Edit3, MessageSquare } from "lucide-react";
import { ActivityItem } from "@workspace/api-client-react";

export function ActivityFeed() {
  const { data: activities, isLoading } = useListActivity({
    query: { queryKey: getListActivityQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed">
        No activity yet. Start journaling!
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {activities.map((item: ActivityItem) => (
        <div key={item.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted/50 text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            <ActivityIcon type={item.type} />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border shadow-sm p-4 rounded-xl hover-elevate transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-foreground text-sm">{item.title}</span>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </time>
            </div>
            <p className="text-sm text-muted-foreground leading-snug">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'idea_created': return <PlusCircle className="w-4 h-4 text-emerald-500" />;
    case 'idea_updated': return <Edit3 className="w-4 h-4 text-blue-500" />;
    case 'progress_added': return <MessageSquare className="w-4 h-4 text-amber-500" />;
    default: return <div className="w-2 h-2 rounded-full bg-foreground" />;
  }
}
