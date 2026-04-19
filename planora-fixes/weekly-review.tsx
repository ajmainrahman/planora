import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfWeek, subWeeks } from "date-fns";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, BookOpen, Lightbulb, CheckCircle2, Tag, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface WeeklyReviewData {
  weekStart: string;
  weekEnd: string;
  tasksCompleted: number;
  notesWritten: number;
  ideasCreated: number;
  topIdeas: Array<{ id: number; title: string; status: string; progressCount: number; nextStep: string }>;
  recentNotes: Array<{
    id: number;
    ideaId: number;
    ideaTitle: string;
    content: string;
    mood: string;
    tags: string[];
    createdAt: string;
  }>;
  allTags: string[];
}

function useWeeklyReview(weekStart: string, enabled: boolean) {
  return useQuery<WeeklyReviewData>({
    queryKey: ["/api/weekly-review", weekStart],
    enabled,
    queryFn: async () => {
      const res = await fetch(`/api/weekly-review?week=${weekStart}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch weekly review");
      return res.json();
    },
  });
}

const STATUS_COLOR: Record<string, string> = {
  seed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  planning: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  building: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  shared: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "");

export default function WeeklyReviewPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = format(startOfWeek(subWeeks(new Date(), weekOffset)), "yyyy-MM-dd");
  const { user } = useAuth();
  const { data, isLoading } = useWeeklyReview(weekStart, !!user);

  const weekLabel = data
    ? `${format(parseISO(data.weekStart), "MMM d")} – ${format(parseISO(data.weekEnd), "MMM d, yyyy")}`
    : "Loading...";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-medium text-foreground">Weekly Review</h1>
            <p className="text-sm text-muted-foreground mt-1">A structured look at your week</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">← Back to Board</Button>
          </Link>
        </div>

        <div className="flex items-center justify-between bg-card border shadow-sm rounded-2xl px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => o + 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Week of</div>
            <div className="font-serif text-lg font-medium">{weekLabel}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => Math.max(0, o - 1))} disabled={weekOffset === 0}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Notes Written", value: data.notesWritten, icon: BookOpen, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400" },
                { label: "Ideas Created", value: data.ideasCreated, icon: Lightbulb, color: "text-sky-600 bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400" },
                { label: "Tasks Completed", value: data.tasksCompleted, icon: CheckCircle2, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-card border shadow-sm rounded-2xl p-5 text-center">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3", color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-3xl font-serif font-medium">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>

            {data.topIdeas.length > 0 && (
              <div className="bg-card border shadow-sm rounded-2xl p-6 space-y-4">
                <h2 className="font-serif text-lg font-medium flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Most Active Ideas
                </h2>
                <div className="space-y-3">
                  {data.topIdeas.map((idea, idx) => (
                    <Link key={idea.id} href={`/ideas/${idea.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                        <span className="text-2xl font-serif font-bold text-muted-foreground/50 w-8 shrink-0 text-center">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium group-hover:text-primary transition-colors truncate">{idea.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                            <Target className="w-3 h-3 shrink-0" />
                            {idea.nextStep}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{idea.progressCount} notes</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize", STATUS_COLOR[idea.status] ?? "")}>
                            {idea.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {data.recentNotes.length > 0 && (
              <div className="bg-card border shadow-sm rounded-2xl p-6 space-y-4">
                <h2 className="font-serif text-lg font-medium flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  This Week's Journal Entries
                </h2>
                <div className="space-y-3">
                  {data.recentNotes.map((note) => (
                    <Link key={note.id} href={`/ideas/${note.ideaId}`}>
                      <div className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-foreground">{note.ideaTitle}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground capitalize">{note.mood}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(note.createdAt), "MMM d")}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{stripHtml(note.content)}</p>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">#{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {data.allTags.length > 0 && (
              <div className="bg-card border shadow-sm rounded-2xl p-6 space-y-4">
                <h2 className="font-serif text-lg font-medium flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Tags Used This Period
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.allTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3">
              <h2 className="font-serif text-lg font-medium">Intentions for Next Week</h2>
              <p className="text-sm text-muted-foreground">Use these reflection prompts to set your focus:</p>
              <ul className="space-y-2">
                {[
                  "What's the one idea you want to move forward the most?",
                  "What habit or routine will support your progress?",
                  "Who could you reach out to for perspective or collaboration?",
                  "What did you miss this week that you'll prioritize next week?",
                ].map((prompt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
