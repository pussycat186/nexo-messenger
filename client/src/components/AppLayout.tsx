import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Shield, Search, User, CheckCircle } from 'lucide-react';
import type { z } from 'zod';
import type { healthSchema } from '@shared/schema';

type Health = z.infer<typeof healthSchema>;

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  
  const { data: health } = useQuery<Health>({
    queryKey: ['/health'],
    refetchInterval: 30000,
  });

  const navItems = [
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/admin', label: 'Admin', icon: Shield },
    { path: '/audit', label: 'Audit', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-[#00BFA6] to-[#6C63FF] rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">NEXO</h1>
              <p className="text-xs text-muted-foreground">Private by Default</p>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span data-testid="text-connection-status">Connected</span>
            </div>
            <Button variant="ghost" size="sm" className="w-8 h-8 rounded-full p-0">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.path || (location === '/' && item.path === '/chat');
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent'}`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          
          <div className="px-4 py-6 border-t border-border mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">System Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Health</span>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3 text-primary" />
                  <span className="text-xs" data-testid="text-health-status">
                    {health?.status || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Users</span>
                <span className="text-xs font-medium" data-testid="text-users-count">
                  {health?.users_count?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">STH Count</span>
                <span className="text-xs font-medium" data-testid="text-sth-count">
                  {health?.sth_count?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
}
