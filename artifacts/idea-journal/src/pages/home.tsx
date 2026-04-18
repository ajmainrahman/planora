import { useState } from "react";
import { Layout } from "@/components/layout";
import { DashboardStats } from "@/components/dashboard-stats";
import { IdeaBoard } from "@/components/idea-board";
import { ActivityFeed } from "@/components/activity-feed";
import { CreateIdeaDialog } from "@/components/create-idea-dialog";
import { EndOfDayReview } from "@/components/end-of-day-review";
import { Button } from "@/components/ui/button";
import { Moon } from "lucide-react";

export default function Home() {
  const [endOfDayOpen, setEndOfDayOpen] = useState(false);

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
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEndOfDayOpen(true)}
              className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/20"
            >
              <Moon className="w-4 h-4" />
              End-of-Day Review
            </Button>
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

      <EndOfDayReview open={endOfDayOpen} onClose={() => setEndOfDayOpen(false)} />
    </Layout>
  );
}
