import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
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

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/share" component={PublicPortfolio} />
      <Route path="/share/:id" component={PublicIdea} />
      <Route path="/">{user ? <Home /> : <Redirect to="/sign-in" />}</Route>
      <Route path="/dashboard">{user ? <Home /> : <Redirect to="/sign-in" />}</Route>
      <Route path="/ideas/:id">{user ? <IdeaDetail /> : <Redirect to="/sign-in" />}</Route>
      <Route path="/calendar">{user ? <CalendarPage /> : <Redirect to="/sign-in" />}</Route>
      <Route path="/weekly-review">{user ? <WeeklyReviewPage /> : <Redirect to="/sign-in" />}</Route>
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
            <AppRoutes />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
