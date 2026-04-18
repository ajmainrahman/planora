import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListIdeas, getListIdeasQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Moon, CheckCircle2, ArrowRight, SkipForward, BookOpen } from "lucide-react";
import { format } from "date-fns";

const END_OF_DAY_PROMPTS = [
  "What did you complete today? What's carrying over tomorrow?",
  "What's one thing you learned today that surprised you?",
  "Did today go the way you planned? What would you do differently?",
  "What are you proud of from today's work?",
  "What's the single most important thing for tomorrow?",
];

interface EndOfDayReviewProps {
  open: boolean;
  onClose: () => void;
}

export function EndOfDayReview({ open, onClose }: EndOfDayReviewProps) {
  const [step, setStep] = useState(0);
  const { data: ideas, isLoading } = useListIdeas({
    query: { queryKey: getListIdeasQueryKey(), enabled: open },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeIdeas = ideas?.filter((i) => i.status !== "shared") ?? [];
  const overdue = ideas?.filter(
    (i) => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== "shared",
  ) ?? [];

  const prompts = END_OF_DAY_PROMPTS;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <Moon className="w-5 h-5 text-indigo-500" />
            End-of-Day Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">What did you work on today?</h3>

              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                </div>
              ) : activeIdeas.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No active ideas yet.</p>
              ) : (
                <div className="space-y-2">
                  {activeIdeas.slice(0, 6).map((idea) => (
                    <Link key={idea.id} href={`/ideas/${idea.id}`} onClick={onClose}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{idea.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{idea.nextStep}</div>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize shrink-0">{idea.status}</Badge>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {overdue.length > 0 && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2">
                    ⚠ {overdue.length} overdue {overdue.length === 1 ? "task" : "tasks"}
                  </p>
                  {overdue.slice(0, 3).map((idea) => (
                    <div key={idea.id} className="text-xs text-amber-700 dark:text-amber-400 truncate">· {idea.title}</div>
                  ))}
                </div>
              )}

              <Button onClick={() => setStep(1)} className="w-full gap-2">
                Continue to Reflection
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Reflect on today</h3>
              <div className="space-y-3">
                {prompts.map((prompt, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground italic">"{prompt}"</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Open an idea above to add your reflections as a journal entry.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                  ← Back
                </Button>
                <Button onClick={onClose} className="flex-1 gap-2">
                  <SkipForward className="w-4 h-4" />
                  Done for Today
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
