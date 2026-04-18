import { useRoute, Link } from "wouter";
import { useGetPublicPortfolio, getGetPublicPortfolioQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowRight, Globe, TrendingUp, BookOpen, Lightbulb } from "lucide-react";

export default function PublicPortfolio() {
  const { data: portfolio, isLoading } = useGetPublicPortfolio({
    query: { queryKey: getGetPublicPortfolioQueryKey() }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-10 py-10">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <div className="space-y-6">
            {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!portfolio) {
    return (
      <Layout>
        <div className="text-center py-20 text-muted-foreground">Portfolio not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-12 py-10">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
            <Globe className="w-4 h-4" />
            Public Portfolio
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground">
            {portfolio.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            {portfolio.description}
          </p>
        </header>

        {portfolio.stats && portfolio.stats.length > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {portfolio.stats.map((stat, i) => (
              <div key={i} className="bg-card border rounded-2xl p-5 shadow-sm">
                <div className="text-3xl font-serif font-medium text-foreground">{stat.value}</div>
                <div className="text-sm font-medium text-foreground mt-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.detail}</div>
              </div>
            ))}
          </section>
        )}

        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b pb-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-serif font-medium">Shared Ideas & Projects</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portfolio.sharedIdeas && portfolio.sharedIdeas.length > 0 ? (
              portfolio.sharedIdeas.map(idea => (
                <Link key={idea.id} href={`/share/${idea.id}`}>
                  <Card className="h-full hover-elevate transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer border-border/60 shadow-sm group">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <Badge variant="outline" className="rounded-full bg-background font-normal capitalize">
                          {idea.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(idea.updatedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-serif font-medium group-hover:text-primary transition-colors leading-tight">
                        {idea.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm leading-relaxed mt-2">
                        {idea.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm font-medium text-primary mt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                        Read full story <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center border rounded-2xl border-dashed bg-muted/30">
                <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No shared projects yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
