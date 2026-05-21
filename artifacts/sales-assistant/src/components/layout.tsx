import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Megaphone, Mail, Settings, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Prospects", href: "/prospects", icon: Users },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Emails", href: "/emails", icon: Mail },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white flex flex-col flex-shrink-0 relative z-20 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="flex items-center gap-2 font-bold text-primary text-lg tracking-tight">
            <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            Avion AI
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}>
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-white flex items-center px-8 justify-end flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-sm">
              JD
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
