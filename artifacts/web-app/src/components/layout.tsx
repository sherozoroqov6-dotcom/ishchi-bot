import React from "react";
import { Link, useLocation } from "wouter";
import { Activity, UploadCloud, ScrollText, History, Settings, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Boshqaruv paneli", icon: Activity },
  { path: "/upload", label: "Excel yuklash", icon: UploadCloud },
  { path: "/logs", label: "Jonli loglar", icon: ScrollText },
  { path: "/history", label: "Tarix", icon: History },
  { path: "/settings", label: "Sozlamalar", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Database className="w-5 h-5 text-primary mr-3" />
          <h1 className="font-bold tracking-wider text-sm uppercase">Bot Panel</h1>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path} className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <Icon className={cn("w-4 h-4 mr-3", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        <header className="h-16 flex items-center px-6 border-b border-border bg-background shrink-0 md:hidden">
          <Database className="w-5 h-5 text-primary mr-3" />
          <h1 className="font-bold tracking-wider text-sm uppercase">Bot Panel</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
