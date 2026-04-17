import { Layout } from "@/components/layout";
import { DashboardStats } from "@/components/dashboard-stats";
import { IdeaBoard } from "@/components/idea-board";
import { CreateIdeaDialog } from "@/components/create-idea-dialog";

export default function Home() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-12">
        <section className="flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-medium tracking-tight text-foreground">
              Planora
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Capture ideas, shape them into plans, and keep a clear journal of every step forward.
            </p>
          </div>
          <CreateIdeaDialog />
        </section>

        <DashboardStats />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-medium text-foreground">Planning Board</h2>
              <p className="text-sm text-muted-foreground">Search, filter, and follow ideas as they move from seed to shared.</p>
            </div>
          </div>
          <IdeaBoard />
        </div>
      </div>
    </Layout>
  );
}
