import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import IdeaDetail from "@/pages/idea-detail";
import PublicPortfolio from "@/pages/public-portfolio";
import PublicIdea from "@/pages/public-idea";
import CalendarPage from "@/pages/calendar";
import WeeklyReviewPage from "@/pages/weekly-review";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ideas/:id" component={IdeaDetail} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/weekly-review" component={WeeklyReviewPage} />
      <Route path="/share" component={PublicPortfolio} />
      <Route path="/share/:id" component={PublicIdea} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
