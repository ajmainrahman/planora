import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProgressNotes,
  getListProgressNotesQueryKey,
  useCreateProgressNote,
  getGetIdeaQueryKey
} from "@workspace/api-client-react";
import type { ProgressNote } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Controller } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Send, Hash, X, Lightbulb, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { RichTextEditor } from "@/components/rich-text-editor";

const DAILY_PROMPTS = [
  "What small step did you take toward your idea today?",
  "What surprised you about your work this week?",
  "What's the next obstacle you see coming? How might you get around it?",
  "What did you learn today that changed how you see this idea?",
  "What would you tell your past self about this project?",
  "What's one thing you're proud of in this work right now?",
  "What assumptions are you making that you haven't tested yet?",
  "Who could you talk to that would give you an honest outside view?",
  "What's the simplest version of this idea you could ship tomorrow?",
  "What made you smile or feel energized today?",
  "What's been harder than expected? What's been easier?",
  "If this idea had to be done in one week, what would you cut?",
  "What's the most important thing you haven't started yet?",
  "What feedback have you been avoiding?",
  "What does success look like for this idea in six months?",
];

const getPromptForDay = () => {
  const dayIndex = new Date().getDate() % DAILY_PROMPTS.length;
  return DAILY_PROMPTS[dayIndex]!;
};

const noteSchema = z.object({
  content: z.string().min(1, "Please write something"),
  mood: z.string().min(1, "Mood is required"),
  tags: z.array(z.string()).default([]),
});

const MOODS = [
  { value: "excited", label: "🚀 Excited" },
  { value: "focused", label: "🎯 Focused" },
  { value: "curious", label: "🔍 Curious" },
  { value: "stuck", label: "😤 Stuck" },
  { value: "breakthrough", label: "💡 Breakthrough" },
  { value: "tired", label: "😴 Tired" },
  { value: "proud", label: "🏆 Proud" },
  { value: "uncertain", label: "🤔 Uncertain" },
];

const SUGGESTED_TAGS = ["planning", "research", "building", "reflection", "design", "writing", "feedback", "milestone", "problem", "win"];

function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");

  const addTag = (tag: string) => {
    const cleaned = tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (cleaned && !value.includes(cleaned)) {
      onChange([...value, cleaned]);
    }
    setInputVal("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
            onClick={() => removeTag(tag)}
          >
            #{tag}
            <X className="w-2.5 h-2.5" />
          </Badge>
        ))}
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(inputVal);
            }
            if (e.key === "Backspace" && !inputVal && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder="Add tag..."
          className="h-6 w-24 text-xs border-transparent bg-transparent px-1 focus-visible:ring-0 focus-visible:border-border"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {SUGGESTED_TAGS.filter((t) => !value.includes(t)).map((tag) => (
          <button
            type="button"
            key={tag}
            onClick={() => addTag(tag)}
            className="text-[10px] px-1.5 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            +{tag}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProgressTimeline({
  ideaId,
  initialNotes,
  ideaTitle,
  ideaNextStep,
}: {
  ideaId: number;
  initialNotes?: ProgressNote[];
  ideaTitle?: string;
  ideaNextStep?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createNote = useCreateProgressNote();
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(getPromptForDay);
  const { user } = useAuth();

  const { data: notes, isLoading } = useListProgressNotes(ideaId, {
    query: {
      enabled: !!ideaId && !!user,
      queryKey: getListProgressNotesQueryKey(ideaId),
      initialData: initialNotes,
    },
  });

  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      content: "",
      mood: "focused",
      tags: [],
    },
  });

  const onSubmit = (values: z.infer<typeof noteSchema>) => {
    const plainText = values.content.replace(/<[^>]+>/g, "").trim();
    if (!plainText) {
      form.setError("content", { message: "Please write something" });
      return;
    }
    createNote.mutate(
      { id: ideaId, data: { ...values, tags: values.tags ?? [] } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProgressNotesQueryKey(ideaId) });
          queryClient.invalidateQueries({ queryKey: getGetIdeaQueryKey(ideaId) });
          form.reset({ content: "", mood: "focused", tags: [] });
          setShowPrompt(false);
          toast({ title: "Journal entry added" });
        },
        onError: () => {
          toast({ title: "Failed to add entry", variant: "destructive" });
        },
      },
    );
  };

  const refreshPrompt = () => {
    const idx = Math.floor(Math.random() * DAILY_PROMPTS.length);
    setCurrentPrompt(DAILY_PROMPTS[idx]!);
  };

  return (
    <div className="space-y-8">
      {ideaNextStep && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex items-start gap-2 text-sm">
          <span className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400">📌</span>
          <div>
            <span className="font-medium text-amber-800 dark:text-amber-300">Today's plan:</span>{" "}
            <span className="text-amber-700 dark:text-amber-400">{ideaNextStep}</span>
          </div>
        </div>
      )}

      <div className="bg-card border shadow-sm rounded-2xl p-4 md:p-6 mb-8">
        {!showPrompt ? (
          <button
            type="button"
            onClick={() => setShowPrompt(true)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-3"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Need inspiration? See today's prompt
          </button>
        ) : (
          <div className="flex items-start gap-2 mb-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-foreground italic">"{currentPrompt}"</p>
            </div>
            <button
              type="button"
              onClick={refreshPrompt}
              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
              title="New prompt"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Controller
                      control={form.control}
                      name="content"
                      render={({ field: controlledField }) => (
                        <RichTextEditor
                          value={controlledField.value}
                          onChange={controlledField.onChange}
                          placeholder="What progress did you make? Any thoughts..."
                          minHeight="120px"
                        />
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="tags"
              render={({ field }) => (
                <TagInput value={field.value} onChange={field.onChange} />
              )}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem className="w-[160px]">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 border-transparent bg-muted/50 text-xs">
                          <SelectValue placeholder="Mood" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={createNote.isPending} size="sm" className="rounded-full gap-2">
                {createNote.isPending ? <Spinner /> : <Send className="w-4 h-4" />}
                Post Entry
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[5.5rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {isLoading && !notes ? (
          [1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl ml-12 md:ml-28" />)
        ) : notes?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground ml-12 md:ml-28">
            No journal entries yet.
          </div>
        ) : (
          notes?.map((note) => (
            <div key={note.id} className="relative flex items-start justify-between md:justify-normal group is-active">
              <div className="hidden md:block w-20 shrink-0 text-right pr-6 pt-2">
                <div className="text-xs font-medium text-muted-foreground leading-tight">
                  {format(new Date(note.createdAt), "MMM d")}
                </div>
                <div className="text-[10px] text-muted-foreground/70">
                  {format(new Date(note.createdAt), "h:mm a")}
                </div>
              </div>

              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary/10 text-primary shadow shrink-0 z-10 absolute left-0 md:static">
                <Hash className="w-4 h-4" />
              </div>

              <div className="w-[calc(100%-4rem)] ml-16 md:ml-6 md:w-full bg-card border shadow-sm p-4 md:p-5 rounded-2xl rounded-tl-none group-hover:border-primary/30 transition-colors">
                <div className="md:hidden flex items-center justify-between mb-2 pb-2 border-b">
                  <span className="text-xs font-medium text-muted-foreground">
                    {format(new Date(note.createdAt), "MMM d, h:mm a")}
                  </span>
                  <span className="text-xs capitalize bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {note.mood}
                  </span>
                </div>

                <div
                  className="text-sm md:text-base text-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="hidden md:flex mt-3 pt-3 border-t items-center justify-end">
                  <span className="text-xs capitalize bg-muted/50 px-2.5 py-1 rounded-full text-muted-foreground font-medium">
                    Mood: {note.mood}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
