import { Link } from "wouter";
import { Show, useClerk, useUser } from "@clerk/react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const { signOut } = useClerk();
  const { user } = useUser();
  const displayName = user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "Your workspace";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-3 group transition-opacity hover:opacity-80">
            <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground shadow-sm flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
                <path d="M10 27V9h10.2c4.1 0 7 2.7 7 6.6 0 3.8-2.9 6.5-7 6.5h-5.1V27H10Z" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" />
                <path d="M15.1 14.3h4.7c1.2 0 2 .6 2 1.5s-.8 1.5-2 1.5h-4.7v-3Z" fill="currentColor" />
                <circle cx="26" cy="26" r="2.2" fill="currentColor" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="block font-serif text-xl font-medium tracking-tight text-foreground">Planora</span>
              <span className="hidden text-xs font-medium text-muted-foreground sm:block">Ideas into motion</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Show when="signed-in">
              <div className="hidden rounded-full border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm sm:block">
                {displayName}
              </div>
              <Button
                type="button"
                variant="outline"
                className="hidden rounded-full sm:inline-flex"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                Sign out
              </Button>
            </Show>
            <Show when="signed-out">
              <Button asChild variant="ghost" className="rounded-full">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </Show>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
