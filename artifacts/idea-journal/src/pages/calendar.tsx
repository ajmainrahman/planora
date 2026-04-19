import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, getDay } from "date-fns";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, CalendarDays, BookOpen, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEntry {
  date: string;
  ideas: Array<{ id: number; title: string; status: string; dueDate: string | null; recurrenceType: string | null }>;
  notes: Array<{ id: number; ideaId: number; ideaTitle: string; content: string; mood: string }>;
}

function useCalendarData(month: string) {
  return useQuery<CalendarEntry[]>({
    queryKey: ["/api/calendar", month],
    queryFn: async () => {
      const res = await fetch(`/api/calendar?month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch calendar");
      return res.json();
    },
  });
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStr = format(currentDate, "yyyy-MM");
  const { data: entries, isLoading } = useCalendarData(monthStr);
  const [selected, setSelected] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const entryMap = new Map<string, CalendarEntry>();
  if (entries) {
    for (const entry of entries) {
      entryMap.set(entry.date, entry);
    }
  }

  const prevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
    setSelected(null);
  };

  const nextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
    setSelected(null);
  };

  const selectedEntry = selected ? entryMap.get(selected) : null;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-medium text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground mt-1">Your ideas and journal entries on a timeline</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">← Back to Board</Button>
          </Link>
        </div>

        <div className="bg-card border shadow-sm rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-serif font-medium">{format(currentDate, "MMMM yyyy")}</h2>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 border-b">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-3">
                {d}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-0">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-none" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] border-r border-b bg-muted/20" />
              ))}
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const entry = entryMap.get(key);
                const hasContent = entry && (entry.ideas.length > 0 || entry.notes.length > 0);
                const isSelected = selected === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : key)}
                    className={cn(
                      "min-h-[80px] p-2 border-r border-b text-left transition-colors relative",
                      isToday(day) && "bg-primary/5",
                      isSelected && "bg-primary/10 border-primary/30",
                      !isSameMonth(day, currentDate) && "opacity-30",
                      hasContent && "cursor-pointer hover:bg-muted/50",
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                      isToday(day) && "bg-primary text-primary-foreground",
                    )}>
                      {format(day, "d")}
                    </span>
                    {entry && (
                      <div className="mt-1 space-y-0.5">
                        {entry.ideas.slice(0, 2).map((idea) => (
                          <div key={idea.id} className="flex items-center gap-0.5">
                            {idea.recurrenceType && <Repeat className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                            <span className="text-[10px] leading-tight bg-primary/10 text-primary px-1 rounded truncate block">
                              {idea.title}
                            </span>
                          </div>
                        ))}
                        {entry.notes.slice(0, 2).map((note) => (
                          <span key={note.id} className="text-[10px] leading-tight bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1 rounded truncate block">
                            ✏ {note.ideaTitle}
                          </span>
                        ))}
                        {((entry.ideas.length + entry.notes.length) > 4) && (
                          <span className="text-[10px] text-muted-foreground">
                            +{entry.ideas.length + entry.notes.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedEntry && (
          <div className="bg-card border shadow-sm rounded-2xl p-6 space-y-4">
            <h3 className="font-serif text-lg font-medium text-foreground">
              {selected && format(parseISO(selected), "EEEE, MMMM d, yyyy")}
            </h3>

            {selectedEntry.ideas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  Tasks Due
                </div>
                {selectedEntry.ideas.map((idea) => (
                  <Link key={idea.id} href={`/ideas/${idea.id}`}>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      {idea.recurrenceType && <Repeat className="w-4 h-4 text-amber-500 shrink-0" />}
                      <span className="text-sm font-medium">{idea.title}</span>
                      <Badge variant="outline" className="ml-auto text-xs capitalize">{idea.status}</Badge>
                      {idea.recurrenceType && (
                        <Badge variant="secondary" className="text-xs capitalize">{idea.recurrenceType}</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {selectedEntry.notes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  Journal Entries
                </div>
                {selectedEntry.notes.map((note) => (
                  <Link key={note.id} href={`/ideas/${note.ideaId}`}>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 cursor-pointer hover:border-emerald-300 transition-colors">
                      <div className="text-xs text-muted-foreground mb-1">{note.ideaTitle} · {note.mood}</div>
                      <div
                        className="text-sm text-foreground leading-relaxed line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: note.content }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {selectedEntry.ideas.length === 0 && selectedEntry.notes.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing scheduled for this day.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
