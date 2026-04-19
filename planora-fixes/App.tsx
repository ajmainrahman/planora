import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import IdeaDetail from "@/pages/idea-detail";
import PublicPortfolio from "@/pages/public-portfolio";
import PublicIdea from "@/pages/public-idea";
import CalendarPage from "@/pages/calendar";
import WeeklyReviewPage from "@/pages/weekly-review";
import SignIn from "@/pages/sign-in";
import SignUp from "@/pages/sign-up";
import { useEffect } from "react";

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

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/sign-in");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/ideas/:id" component={() => <ProtectedRoute component={IdeaDetail} />} />
      <Route path="/calendar" component={() => <ProtectedRoute component={CalendarPage} />} />
      <Route path="/weekly-review" component={() => <ProtectedRoute component={WeeklyReviewPage} />} />
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
