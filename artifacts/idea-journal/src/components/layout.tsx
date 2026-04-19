import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun, Search, CalendarDays, BookText, LayoutGrid, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { SearchDialog } from "@/components/search-dialog";
import { PlanoraLogo } from "@/components/planora-logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [location] = useLocation();
  const { user, signOut } = useAuth();

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
    { href: "/dashboard", label: "Board", icon: LayoutGrid },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/weekly-review", label: "Weekly", icon: BookText },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3 group transition-opacity hover:opacity-80 shrink-0">
              <PlanoraLogo size={36} />
              <span className="font-serif text-xl font-medium tracking-tight text-foreground">Planora</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <button className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    location === href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}>
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
              <kbd className="ml-1 hidden sm:inline-flex items-center rounded border px-1 font-mono text-[10px] font-medium text-muted-foreground">⌘K</kbd>
            </button>
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="sm:hidden" aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode" className="rounded-full">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {user && (
              <div className="flex items-center gap-2 pl-1 border-l border-border/50">
                <span className="hidden sm:block text-sm text-muted-foreground max-w-[120px] truncate">{user.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  aria-label="Sign out"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <nav className="md:hidden flex items-center gap-1 px-4 pb-2 border-t pt-2 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                location === href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}>
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
