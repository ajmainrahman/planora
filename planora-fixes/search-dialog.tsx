import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Lightbulb, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  ideas: Array<{
    id: number;
    title: string;
    description: string;
    status: string;
    category: string;
  }>;
  notes: Array<{
    id: number;
    ideaId: number;
    ideaTitle: string;
    content: string;
    mood: string;
    tags: string[];
  }>;
}

function useSearch(q: string) {
  return useQuery<SearchResult>({
    queryKey: ["/api/search", q],
    queryFn: async () => {
      if (!q.trim()) return { ideas: [], notes: [] };
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: q.trim().length > 1,
    staleTime: 30_000,
  });
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [q, setQ] = useState("");
  const [, setLocation] = useLocation();
  const { data, isLoading } = useSearch(q);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      onClose();
      setLocation(href);
    },
    [onClose, setLocation],
  );

  const hasResults = data && (data.ideas.length > 0 || data.notes.length > 0);

  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "");

  const statusColor: Record<string, string> = {
    seed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    planning: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    building: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    shared: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <div className="flex items-center border-b px-4 py-3 gap-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ideas and journal entries..."
            className="border-0 p-0 h-auto text-base focus-visible:ring-0 bg-transparent"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {!q.trim() && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Type to search your ideas and journal entries
            </div>
          )}

          {q.trim().length > 0 && isLoading && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Searching...</div>
          )}

          {q.trim().length > 0 && !isLoading && !hasResults && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for "{q}"
            </div>
          )}

          {hasResults && (
            <div className="divide-y">
              {data.ideas.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50 flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3" />
                    Ideas
                  </div>
                  {data.ideas.map((idea) => (
                    <button
                      key={idea.id}
                      type="button"
                      onClick={() => navigate(`/ideas/${idea.id}`)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{idea.title}</div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">{idea.description}</div>
                      </div>
                      <div className="flex gap-1.5 items-center shrink-0">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize", statusColor[idea.status] ?? "")}>{idea.status}</span>
                        <span className="text-[10px] text-muted-foreground">{idea.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {data.notes.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    Journal Entries
                  </div>
                  {data.notes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => navigate(`/ideas/${note.ideaId}`)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">{note.ideaTitle}</span>
                        <span className="text-[10px] text-muted-foreground">· {note.mood}</span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{stripHtml(note.content)}</div>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {note.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">#{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30">
          <span>Press Esc to close</span>
          <span>{hasResults ? `${data!.ideas.length + data!.notes.length} results` : ""}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
