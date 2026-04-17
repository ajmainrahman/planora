import { Link } from "wouter";
import type { Idea } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, BookmarkCheck, ArrowRight, Target, CalendarClock } from "lucide-react";
import { useBookmarks } from "@/hooks/use-bookmarks";

const statusColors: Record<string, string> = {
  seed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  planning: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800",
  building: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  shared: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800",
};

const priorityDot: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-amber-400",
  high: "bg-red-500",
};

const statusEmoji: Record<string, string> = {
  seed: "🌱",
  planning: "🗺️",
  building: "🔨",
  shared: "🚀",
};

export function IdeaFeedCard({ idea }: { idea: Idea }) {
  const { isBookmarked, toggle } = useBookmarks();
  const bookmarked = isBookmarked(idea.id);

  return (
    <article className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg select-none">
          {statusEmoji[idea.status] ?? "💡"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge
              variant="outline"
              className={`text-xs font-medium capitalize border px-2 py-0.5 rounded-full ${statusColors[idea.status]}`}
            >
              {idea.status}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[idea.priority]}`} />
              {idea.priority}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(idea.updatedAt), { addSuffix: true })}
            </span>
          </div>

          <Link href={`/ideas/${idea.id}`}>
            <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors leading-snug cursor-pointer">
              {idea.title}
            </h3>
          </Link>

          <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {idea.description}
          </p>

          {idea.nextStep && (
            <div className="mt-3 flex items-start gap-2 text-sm text-foreground/70 bg-primary/5 rounded-xl px-3 py-2">
              <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="italic line-clamp-2">{idea.nextStep}</span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md border">
                {idea.category}
              </span>
              {idea.dueDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(idea.dueDate), { addSuffix: true })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.preventDefault();
                  toggle(idea.id);
                }}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
              >
                {bookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>

              <Link href={`/ideas/${idea.id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                  aria-label="Open idea"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
