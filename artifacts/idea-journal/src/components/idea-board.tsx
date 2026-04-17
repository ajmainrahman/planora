import { useListIdeas, getListIdeasQueryKey } from "@workspace/api-client-react";
import { IdeaCard } from "@/components/idea-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Idea } from "@workspace/api-client-react";
import { Empty } from "@/components/ui/empty";

export function IdeaBoard() {
  const { data: ideas, isLoading } = useListIdeas({
    query: { queryKey: getListIdeasQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
      </div>
    );
  }

  if (!ideas || ideas.length === 0) {
    return (
      <Empty
        icon="lightbulb"
        title="The board is empty"
        description="Plant your first seed to start growing your ideas."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {ideas.map((idea: Idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  );
}
