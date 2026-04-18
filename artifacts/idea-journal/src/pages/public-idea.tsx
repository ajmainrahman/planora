import { useRoute, Link } from "wouter";
import { useGetPublicIdea, getGetPublicIdeaQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Tag, Hash } from "lucide-react";

export default function PublicIdea() {
  const [, params] = useRoute("/share/:id");
  const ideaId = params?.id ? parseInt(params.id, 10) : 0;

  const { data: idea, isLoading } = useGetPublicIdea(ideaId, {
    query: { enabled: !!ideaId, queryKey: getGetPublicIdeaQueryKey(ideaId) }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-8 py-10">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!idea) {
    return (
      <Layout>
        <div className="text-center py-20">Idea not found or not public.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-10">
        <div className="mb-8">
          <Link href="/share" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>
        </div>

        <article className="space-y-12">
          <header className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground leading-tight">
              {idea.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Started {format(new Date(idea.createdAt), "MMM yyyy")}</span>
              </div>
              <div className="w-px h-4 bg-border hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span className="capitalize">{idea.category}</span>
              </div>
              <div className="w-px h-4 bg-border hidden sm:block"></div>
              <Badge variant="secondary" className="rounded-full font-normal">
                {idea.status}
              </Badge>
            </div>
            
            <div className="text-lg md:text-xl text-foreground/80 leading-relaxed whitespace-pre-wrap mt-8 bg-muted/30 p-6 md:p-8 rounded-3xl border border-border/50 shadow-sm">
              {idea.description}
            </div>
          </header>

          <section className="space-y-8">
            <h2 className="text-2xl font-serif font-medium border-b pb-4">Journey & Progress</h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[5.5rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent pt-4">
              {idea.progressNotes && idea.progressNotes.length > 0 ? (
                idea.progressNotes.map((note) => (
                  <div key={note.id} className="relative flex items-start justify-between md:justify-normal">
                    <div className="hidden md:block w-20 shrink-0 text-right pr-6 pt-2">
                      <div className="text-xs font-medium text-muted-foreground leading-tight">
                        {format(new Date(note.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary/10 text-primary shadow shrink-0 z-10 absolute left-0 md:static">
                      <Hash className="w-4 h-4" />
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] ml-16 md:ml-6 md:w-full bg-card border shadow-sm p-5 md:p-6 rounded-2xl rounded-tl-none hover:border-primary/20 transition-colors">
                      <div className="md:hidden flex items-center justify-between mb-3 pb-3 border-b">
                        <span className="text-xs font-medium text-muted-foreground">
                          {format(new Date(note.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      
                      <div className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground ml-12 md:ml-28 italic">
                  No public updates shared yet.
                </div>
              )}
            </div>
          </section>
        </article>
      </div>
    </Layout>
  );
}
