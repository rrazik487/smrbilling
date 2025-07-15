import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { 
  FileText, 
  Users, 
  Settings, 
  FolderOpen, 
  Receipt,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Create Invoice", href: "/", icon: FileText },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "View Invoices", href: "/invoices", icon: Receipt },
  { name: "Browse Files", href: "/files", icon: FolderOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={cn(
        "bg-card border-r border-border transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div>
                  <h1 className="text-lg font-bold text-foreground">SMR AGRO</h1>
                  <p className="text-sm text-muted-foreground">Billing System</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="ml-auto"
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive(item.href) && "bg-primary text-primary-foreground hover:bg-primary-hover"
                )}
              >
                <item.icon className="h-4 w-4" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}