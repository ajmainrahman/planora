import { Layout } from "@/components/layout";
import { DashboardStats } from "@/components/dashboard-stats";
import { IdeaBoard } from "@/components/idea-board";
import { ActivityFeed } from "@/components/activity-feed";
import { CreateIdeaDialog } from "@/components/create-idea-dialog";

export default function Home() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-10">
        <section className="flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-medium tracking-tight text-foreground">
              Planora
            </h1>
            <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
              A quiet place to capture ideas, watch them grow, and share what matters.
            </p>
          </div>
          <div className="flex-shrink-0">
            <CreateIdeaDialog />
          </div>
        </section>

        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div>
              <h2 className="text-2xl font-serif font-medium text-foreground">Your Ideas</h2>
              <p className="text-sm text-muted-foreground mt-1">Browse by feed or board, filter by status, category, or priority.</p>
            </div>
            <IdeaBoard />
          </div>
          <div className="space-y-5">
             <ActivityFeed />
          </div>
        </div>
      </div>
    </Layout>
  );
}
