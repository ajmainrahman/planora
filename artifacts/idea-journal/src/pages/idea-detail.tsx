import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetIdea, getGetIdeaQueryKey, 
  useUpdateIdea, 
  useDeleteIdea,
  getListIdeasQueryKey,
  IdeaStatus,
  IdeaPriority
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressTimeline } from "@/components/progress-timeline";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Save, Calendar, Tag, Target, Bell, Share2, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

export default function IdeaDetail() {
  const [, params] = useRoute("/ideas/:id");
  const ideaId = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useRoute("/");

  const { data: idea, isLoading } = useGetIdea(ideaId, {
    query: { enabled: !!ideaId, queryKey: getGetIdeaQueryKey(ideaId) }
  });

  const updateIdea = useUpdateIdea();
  const deleteIdea = useDeleteIdea();

  // Local state for debounced editing
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IdeaStatus>(IdeaStatus.seed);
  const [priority, setPriority] = useState<IdeaPriority>(IdeaPriority.medium);
  const [category, setCategory] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (idea && initializedForId.current !== idea.id) {
      initializedForId.current = idea.id;
      setTitle(idea.title);
      setDescription(idea.description);
      setStatus(idea.status as IdeaStatus);
      setPriority(idea.priority as IdeaPriority);
      setCategory(idea.category);
      setNextStep(idea.nextStep);
      setDueDate(
        idea.dueDate
          ? format(new Date(idea.dueDate), "yyyy-MM-dd'T'HH:mm")
          : "",
      );
      setReminderAt(
        idea.reminderAt
          ? format(new Date(idea.reminderAt), "yyyy-MM-dd'T'HH:mm")
          : "",
      );
    }
  }, [idea]);

  const handleSave = () => {
    updateIdea.mutate(
      { 
        id: ideaId, 
        data: {
          title,
          description,
          status,
          priority,
          category,
          nextStep,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
        },
      },
      {
        onSuccess: (updatedData) => {
          queryClient.setQueryData(getGetIdeaQueryKey(ideaId), (old: any) => 
            old ? { ...old, ...updatedData } : old
          );
          queryClient.invalidateQueries({ queryKey: getListIdeasQueryKey() });
          setIsEditing(false);
          toast({ title: "Idea updated successfully" });
        },
        onError: () => {
          toast({ title: "Failed to update idea", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = () => {
    deleteIdea.mutate({ id: ideaId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        toast({ title: "Idea deleted" });
        window.location.href = "/"; // wouter setLocation doesn't always trigger a re-render in this context, use window.location
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!idea) {
    return (
      <Layout>
        <div className="text-center py-20">Idea not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Board
          </Link>
          
          <div className="flex items-center gap-2">
            {!isEditing && idea.status === IdeaStatus.shared && (
              <Button variant="outline" asChild className="gap-2 text-primary border-primary/20 hover:bg-primary/10">
                <Link href={`/share/${idea.id}`} target="_blank">
                  <ExternalLink className="w-4 h-4" />
                  View Public Page
                </Link>
              </Button>
            )}
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Details
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={updateIdea.isPending} className="gap-2">
                {updateIdea.isPending ? <Spinner /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the idea
                    and all associated progress notes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleteIdea.isPending ? <Spinner className="mr-2" /> : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="bg-card border shadow-sm rounded-2xl p-6 md:p-8 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
          
          <div className="relative z-10 space-y-6">
            {isEditing ? (
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="text-3xl md:text-4xl font-serif font-medium h-auto py-2 border-transparent bg-muted/30 focus-visible:bg-background"
                placeholder="Idea title"
              />
            ) : (
              <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground">
                {title}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y py-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Planted on {format(new Date(idea.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="w-px h-4 bg-border hidden sm:block"></div>
              
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <Input 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="h-8 w-32"
                    placeholder="Category"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span className="bg-muted px-2 py-0.5 rounded-md">{category}</span>
                </div>
              )}
              
              <div className="w-px h-4 bg-border hidden sm:block"></div>
              
              {isEditing ? (
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <Select value={status} onValueChange={(val) => setStatus(val as IdeaStatus)}>
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="building">Building</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={priority} onValueChange={(val) => setPriority(val as IdeaPriority)}>
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                  <span className="capitalize px-2.5 py-0.5 border rounded-full text-xs font-medium">
                    Status: {status}
                  </span>
                  <span className="capitalize px-2.5 py-0.5 border rounded-full text-xs font-medium">
                    Priority: {priority}
                  </span>
                </div>
              )}

              <div className="w-px h-4 bg-border hidden sm:block"></div>

              {isEditing ? (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-8 w-48"
                  />
                  <Input
                    type="datetime-local"
                    value={reminderAt}
                    onChange={(e) => setReminderAt(e.target.value)}
                    className="h-8 w-48"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {idea.dueDate ? `Due ${format(new Date(idea.dueDate), "MMM d, yyyy h:mm a")}` : "No due date"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Bell className="w-4 h-4" />
                    {idea.reminderAt
                      ? `Remind ${format(new Date(idea.reminderAt), "MMM d, yyyy h:mm a")}`
                      : "No reminder"}
                  </span>
                </div>
              )}
            </div>

            <div className="prose prose-stone dark:prose-invert max-w-none">
              {isEditing ? (
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[150px] border-transparent bg-muted/30 focus-visible:bg-background resize-y text-base leading-relaxed"
                  placeholder="Elaborate on your idea..."
                />
              ) : (
                <div className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {description || <span className="text-muted-foreground italic">No description provided.</span>}
                </div>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="w-full space-y-2">
                  <h4 className="font-medium text-foreground">Immediate Next Step</h4>
                  {isEditing ? (
                    <Input 
                      value={nextStep} 
                      onChange={(e) => setNextStep(e.target.value)}
                      className="bg-background/50"
                      placeholder="What should you do next?"
                    />
                  ) : (
                    <p className="text-foreground/80 italic">{nextStep || "None set yet."}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-medium text-foreground">Progress Journal</h2>
          <ProgressTimeline
            ideaId={ideaId}
            initialNotes={idea.progressNotes}
            ideaTitle={idea.title}
            ideaNextStep={idea.nextStep}
          />
        </div>
      </div>
    </Layout>
  );
}
