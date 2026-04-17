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
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Hash } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const noteSchema = z.object({
  content: z.string().min(1, "Please write something"),
  mood: z.string().min(1, "Mood is required"),
});

const MOODS = [
  { value: "excited", label: "Excited" },
  { value: "focused", label: "Focused" },
  { value: "stuck", label: "Stuck" },
  { value: "breakthrough", label: "Breakthrough" },
  { value: "tired", label: "Tired" },
];

export function ProgressTimeline({ ideaId, initialNotes }: { ideaId: number, initialNotes?: ProgressNote[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createNote = useCreateProgressNote();

  const { data: notes, isLoading } = useListProgressNotes(ideaId, {
    query: { 
      enabled: !!ideaId, 
      queryKey: getListProgressNotesQueryKey(ideaId),
      initialData: initialNotes 
    }
  });

  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      content: "",
      mood: "focused",
    },
  });

  const onSubmit = (values: z.infer<typeof noteSchema>) => {
    createNote.mutate(
      { id: ideaId, data: values },
      {
        onSuccess: (newNote) => {
          queryClient.invalidateQueries({ queryKey: getListProgressNotesQueryKey(ideaId) });
          // Update the idea query to reflect the new note in the count if needed
          queryClient.invalidateQueries({ queryKey: getGetIdeaQueryKey(ideaId) });
          form.reset({ content: "", mood: "focused" });
          toast({ title: "Journal entry added" });
        },
        onError: () => {
          toast({ title: "Failed to add entry", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-card border shadow-sm rounded-2xl p-4 md:p-6 mb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="What progress did you make? Any thoughts?" 
                      className="resize-none border-transparent bg-muted/50 focus-visible:bg-background min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem className="w-[150px]">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 border-transparent bg-muted/50 text-xs">
                          <SelectValue placeholder="Mood" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOODS.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
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
          [1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl ml-12 md:ml-28" />)
        ) : notes?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground ml-12 md:ml-28">
            No journal entries yet.
          </div>
        ) : (
          notes?.map((note) => (
            <div key={note.id} className="relative flex items-start justify-between md:justify-normal group is-active">
              {/* Date label (desktop) */}
              <div className="hidden md:block w-20 shrink-0 text-right pr-6 pt-2">
                <div className="text-xs font-medium text-muted-foreground leading-tight">
                  {format(new Date(note.createdAt), "MMM d")}
                </div>
                <div className="text-[10px] text-muted-foreground/70">
                  {format(new Date(note.createdAt), "h:mm a")}
                </div>
              </div>
              
              {/* Timeline dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary/10 text-primary shadow shrink-0 z-10 absolute left-0 md:static">
                <Hash className="w-4 h-4" />
              </div>
              
              {/* Content card */}
              <div className="w-[calc(100%-4rem)] ml-16 md:ml-6 md:w-full bg-card border shadow-sm p-4 md:p-5 rounded-2xl rounded-tl-none group-hover:border-primary/30 transition-colors">
                {/* Date label (mobile) */}
                <div className="md:hidden flex items-center justify-between mb-2 pb-2 border-b">
                  <span className="text-xs font-medium text-muted-foreground">
                    {format(new Date(note.createdAt), "MMM d, h:mm a")}
                  </span>
                  <span className="text-xs capitalize bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {note.mood}
                  </span>
                </div>
                
                <div className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </div>
                
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
