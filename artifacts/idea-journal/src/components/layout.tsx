import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun, Search, CalendarDays, BookText, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { SearchDialog } from "@/components/search-dialog";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navItems = [
    { href: "/", label: "Board", icon: LayoutGrid },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/weekly-review", label: "Weekly", icon: BookText },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3 group transition-opacity hover:opacity-80 shrink-0">
              <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground shadow-sm flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-6 w-6" aria-hidden="true">
                  <path d="M10 27V9h10.2c4.1 0 7 2.7 7 6.6 0 3.8-2.9 6.5-7 6.5h-5.1V27H10Z" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" />
                  <path d="M15.1 14.3h4.7c1.2 0 2 .6 2 1.5s-.8 1.5-2 1.5h-4.7v-3Z" fill="currentColor" />
                  <circle cx="26" cy="26" r="2.2" fill="currentColor" />
                </svg>
              </div>
              <span className="font-serif text-xl font-medium tracking-tight text-foreground">Planora</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      location === href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="ml-1 hidden sm:inline-flex items-center rounded border px-1 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="sm:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
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

        <nav className="md:hidden flex items-center gap-1 px-4 pb-2 border-t pt-2 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  location === href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
