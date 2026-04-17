import { Link } from "wouter";
import { Idea } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Target } from "lucide-react";

export function IdeaCard({ idea }: { idea: Idea }) {
  const statusColors = {
    seed: "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300 border-stone-200 dark:border-stone-800",
    planning: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    building: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    shared: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
  };

  const priorityColors = {
    low: "text-stone-500",
    medium: "text-amber-500",
    high: "text-red-500"
  };

  return (
    <Link href={`/ideas/${idea.id}`}>
      <Card className="h-full border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer flex flex-col hover:-translate-y-1">
        <CardContent className="p-6 flex-1 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <Badge variant="outline" className={`font-medium ${statusColors[idea.status]} border capitalize px-2.5 py-0.5 rounded-full`}>
              {idea.status}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${priorityColors[idea.priority] || "bg-stone-500"}`} />
              <span className="capitalize">{idea.priority} Priority</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {idea.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {idea.description}
            </p>
          </div>
          
          {idea.nextStep && (
            <div className="mt-auto pt-4 flex items-start gap-2 text-sm">
              <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground/80 line-clamp-2 italic">"{idea.nextStep}"</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="px-6 py-4 bg-muted/20 border-t flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-md bg-background border shadow-sm">{idea.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Updated {formatDistanceToNow(new Date(idea.updatedAt), { addSuffix: true })}</span>
            <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
