import { Link } from "wouter";
import type { Idea } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Bell, CalendarClock, ChevronRight, Target } from "lucide-react";

export function IdeaCard({ idea, compact = false }: { idea: Idea; compact?: boolean }) {
  const statusColors = {
    seed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    planning: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800",
    building: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    shared: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800",
  };

  const priorityDot = {
    low: "bg-slate-400",
    medium: "bg-amber-400",
    high: "bg-red-500",
  };

  return (
    <Link href={`/ideas/${idea.id}`}>
      <Card className="h-full border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer flex flex-col hover:-translate-y-0.5">
        <CardContent className={`${compact ? "p-4" : "p-6"} flex-1 flex flex-col gap-3`}>
          <div className="flex justify-between items-start">
            <Badge variant="outline" className={`font-medium border capitalize px-2.5 py-0.5 rounded-full text-xs ${statusColors[idea.status]}`}>
              {idea.status}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${priorityDot[idea.priority] ?? "bg-slate-400"}`} />
              <span className="capitalize">{idea.priority}</span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className={`font-serif font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 ${compact ? "text-base" : "text-xl"}`}>
              {idea.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {idea.description}
            </p>
          </div>

          {idea.nextStep && (
            <div className="mt-auto pt-3 flex items-start gap-2 text-sm">
              <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground/80 line-clamp-2 italic text-xs">"{idea.nextStep}"</span>
            </div>
          )}

          {(idea.dueDate || idea.reminderAt) && (
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
              {idea.dueDate ? (
                <span className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Due {formatDistanceToNow(new Date(idea.dueDate), { addSuffix: true })}
                </span>
              ) : null}
              {idea.reminderAt ? (
                <span className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1">
                  <Bell className="h-3.5 w-3.5" />
                  Reminder {formatDistanceToNow(new Date(idea.reminderAt), { addSuffix: true })}
                </span>
              ) : null}
            </div>
          )}
        </CardContent>
        <CardFooter className={`${compact ? "px-4 py-3" : "px-6 py-4"} bg-muted/20 border-t flex justify-between items-center text-xs text-muted-foreground`}>
          <span className="px-2 py-1 rounded-md bg-background border shadow-sm">{idea.category}</span>
          <div className="flex items-center gap-1">
            <span>Updated {formatDistanceToNow(new Date(idea.updatedAt), { addSuffix: true })}</span>
            <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
