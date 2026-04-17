import { Layout } from "@/components/layout";
import { DashboardStats } from "@/components/dashboard-stats";
import { ActivityFeed } from "@/components/activity-feed";
import { IdeaBoard } from "@/components/idea-board";
import { CreateIdeaDialog } from "@/components/create-idea-dialog";

export default function Home() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-12">
        <section className="flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-medium tracking-tight text-foreground">
              Your Thinking Space
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Capture your seeds of thought, plan their growth, and document the journey.
            </p>
          </div>
          <CreateIdeaDialog />
        </section>

        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-medium text-foreground">Active Ideas</h2>
            </div>
            <IdeaBoard />
          </div>
          
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xl font-serif font-medium text-foreground">Recent Activity</h2>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </Layout>
  );
}
