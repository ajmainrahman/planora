import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useAuth,
  useClerk,
} from "@clerk/react";
import { Switch, Route, Router as WouterRouter, Redirect, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import IdeaDetail from "@/pages/idea-detail";
import PublicPortfolio from "@/pages/public-portfolio";
import PublicIdea from "@/pages/public-idea";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const signInPath = `${basePath}/sign-in`;
const signUpPath = `${basePath}/sign-up`;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#1f4f3f",
    colorBackground: "#fffaf0",
    colorInputBackground: "#fffdf7",
    colorText: "#1f2933",
    colorTextSecondary: "#64748b",
    colorInputText: "#1f2933",
    colorNeutral: "#d6a44f",
    borderRadius: "1rem",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontSize: "15px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "rounded-3xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/10 w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "#1f2933", fontFamily: "Georgia, serif", fontSize: "1.75rem", fontWeight: "500" },
    headerSubtitle: { color: "#64748b" },
    socialButtonsBlockButtonText: { color: "#1f2933", fontWeight: "600" },
    formFieldLabel: { color: "#334155", fontWeight: "600" },
    footerActionLink: { color: "#1f4f3f", fontWeight: "700" },
    footerActionText: { color: "#64748b" },
    dividerText: { color: "#64748b" },
    identityPreviewEditButton: { color: "#1f4f3f" },
    formFieldSuccessText: { color: "#1f4f3f" },
    alertText: { color: "#7f1d1d" },
    logoBox: "mb-2 h-14 justify-center",
    logoImage: "h-14 w-14 rounded-2xl",
    socialButtonsBlockButton: "rounded-xl border-stone-200 bg-stone-50 hover:bg-stone-100",
    formButtonPrimary: "rounded-xl bg-[#1f4f3f] text-white hover:bg-[#183d31] shadow-md shadow-emerald-950/10",
    formFieldInput: "rounded-xl border-stone-200 bg-white text-stone-900 focus:border-[#1f4f3f] focus:ring-[#1f4f3f]",
    footerAction: "bg-stone-50",
    dividerLine: "bg-stone-200",
    alert: "rounded-xl border-red-200 bg-red-50",
    otpCodeFieldInput: "rounded-xl border-stone-200",
    formFieldRow: "gap-3",
    main: "gap-5",
  },
};

function AuthLoading() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4">
      <div className="rounded-3xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-serif text-xl">
          P
        </div>
        <p className="text-sm font-medium text-muted-foreground">Preparing your workspace...</p>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <img src={`${basePath}/logo.svg`} alt="Planora" className="h-10 w-10 rounded-2xl" />
            <div>
              <div className="font-serif text-xl font-medium tracking-tight text-foreground">Planora</div>
              <div className="text-xs font-medium text-muted-foreground">Ideas into motion</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/share">Public portfolio</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto grid min-h-[calc(100dvh-4rem)] items-center gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          <div className="inline-flex rounded-full border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
            Personal research and idea journal
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl font-serif text-5xl font-medium tracking-tight text-foreground md:text-7xl">
              Capture rough ideas, track progress, and share the ones that grow.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Planora keeps your private idea workspace separate for each account, then lets you publish selected ideas to a clean public portfolio.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href="/sign-up">Create your account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </section>
        <section className="rounded-[2rem] border bg-card p-6 shadow-xl shadow-stone-950/5">
          <div className="space-y-4">
            {[
              ["Seed", "Save sparks before they disappear."],
              ["Plan", "Choose priorities and next steps."],
              ["Build", "Add progress notes as your research develops."],
              ["Share", "Publish finished thinking to a public portfolio."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border bg-background p-5">
                <div className="font-serif text-xl font-medium text-foreground">{title}</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">{description}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <SignIn routing="path" path={signInPath} signUpUrl={signUpPath} fallbackRedirectUrl={`${basePath}/app`} />
    </div>
  );
}

function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <SignUp routing="path" path={signUpPath} signInUrl={signInPath} fallbackRedirectUrl={`${basePath}/app`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/app" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function AuthTokenBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    setAuthTokenGetter(isSignedIn ? () => getToken() : null);
    setReady(true);
    return () => setAuthTokenGetter(null);
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded || !ready) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/app">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path="/ideas/:id">
        <ProtectedRoute>
          <IdeaDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/share" component={PublicPortfolio} />
      <Route path="/share/:id" component={PublicIdea} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl || undefined}
      appearance={clerkAppearance}
      localization={{
        signIn: {
          start: {
            title: "Welcome back to Planora",
            subtitle: "Sign in to return to your private idea workspace.",
          },
        },
        signUp: {
          start: {
            title: "Create your Planora account",
            subtitle: "Start a private research journal you can publish from when ready.",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <AuthTokenBridge>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthTokenBridge>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
