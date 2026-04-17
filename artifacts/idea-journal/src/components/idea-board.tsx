import { useMemo, useState } from "react";
import { useListIdeas, getListIdeasQueryKey } from "@workspace/api-client-react";
import { IdeaCard } from "@/components/idea-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Star, X } from "lucide-react";
import type { Idea } from "@workspace/api-client-react";

const statusLanes = [
  { value: "seed", label: "Seed" },
  { value: "planning", label: "Planning" },
  { value: "building", label: "Building" },
  { value: "shared", label: "Shared" },
] as const;

export function IdeaBoard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const { data: ideas, isLoading } = useListIdeas({
    query: { queryKey: getListIdeasQueryKey() }
  });

  const categories = useMemo(() => {
    const unique = new Set((ideas ?? []).map((idea) => idea.category).filter(Boolean));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (ideas ?? []).filter((idea) => {
      const matchesSearch =
        !query ||
        idea.title.toLowerCase().includes(query) ||
        idea.description.toLowerCase().includes(query) ||
        idea.category.toLowerCase().includes(query) ||
        idea.nextStep.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || idea.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || idea.category === categoryFilter;
      const matchesPriority = !highPriorityOnly || idea.priority === "high";

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [categoryFilter, highPriorityOnly, ideas, search, statusFilter]);

  const activeFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    highPriorityOnly;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setHighPriorityOnly(false);
  };

  const ideasByStatus = statusLanes.map((lane) => ({
    ...lane,
    ideas: filteredIdeas.filter((idea) => idea.status === lane.value),
  }));

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
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ideas, categories, next steps..."
              className="h-11 rounded-xl bg-background pl-10"
              type="search"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statusLanes.map((lane) => (
              <Button
                key={lane.value}
                type="button"
                variant={statusFilter === lane.value ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setStatusFilter(statusFilter === lane.value ? "all" : lane.value)}
              >
                {lane.label}
              </Button>
            ))}
            <Button
              type="button"
              variant={highPriorityOnly ? "default" : "outline"}
              size="sm"
              className="rounded-full gap-2"
              onClick={() => setHighPriorityOnly((value) => !value)}
            >
              <Star className="h-3.5 w-3.5" />
              High Priority
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant={categoryFilter === "all" ? "default" : "outline"} className="cursor-pointer rounded-full" onClick={() => setCategoryFilter("all")}>
            All Categories
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              className="cursor-pointer rounded-full"
              onClick={() => setCategoryFilter(categoryFilter === category ? "all" : category)}
            >
              {category}
            </Badge>
          ))}
          {activeFilters ? (
            <Button type="button" variant="ghost" size="sm" className="rounded-full gap-1 text-muted-foreground" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {filteredIdeas.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/60 p-10 text-center">
          <h3 className="font-serif text-2xl font-medium text-foreground">No matching ideas</h3>
          <p className="mt-2 text-sm text-muted-foreground">Try changing your search or clearing a filter.</p>
          <Button type="button" variant="outline" className="mt-5 rounded-full" onClick={clearFilters}>
            Show all ideas
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {ideasByStatus.map((lane) => (
            <section key={lane.value} className="rounded-2xl border bg-card/50 p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="font-serif text-lg font-medium text-foreground">{lane.label}</h3>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{lane.ideas.length}</span>
              </div>
              <div className="space-y-3">
                {lane.ideas.length > 0 ? (
                  lane.ideas.map((idea: Idea) => <IdeaCard key={idea.id} idea={idea} compact />)
                ) : (
                  <div className="rounded-xl border border-dashed bg-background/50 p-5 text-center text-sm text-muted-foreground">
                    No ideas here yet
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
