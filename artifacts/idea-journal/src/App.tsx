import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import SignIn from "@/pages/sign-in";
import SignUp from "@/pages/sign-up";
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

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/sign-in");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      <Route path="/ideas/:id">
        {() => <ProtectedRoute component={IdeaDetail} />}
      </Route>
      <Route path="/calendar">
        {() => <ProtectedRoute component={CalendarPage} />}
      </Route>
      <Route path="/weekly-review">
        {() => <ProtectedRoute component={WeeklyReviewPage} />}
      </Route>
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
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
