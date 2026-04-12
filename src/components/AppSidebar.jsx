import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, Heart, Music2, User } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/playlists', icon: Library, label: 'Your Playlists' },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-[240px] bg-sidebar text-sidebar-foreground h-screen sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-2">
          <Music2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground tracking-tight">Rhythmix</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors',
                active
                  ? 'text-foreground bg-sidebar-accent'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-6 my-4 h-px bg-border" />

      {/* Quick links */}
      <div className="px-3 space-y-1 flex-1 overflow-y-auto">
        <Link
          to="/dashboard"
          className="flex items-center gap-4 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="h-6 w-6 rounded-sm bg-gradient-to-br from-indigo-500 to-blue-300 flex items-center justify-center">
            <Heart className="h-3 w-3 text-white" />
          </div>
          <span className="font-medium">Liked Songs</span>
        </Link>
      </div>

      {/* Profile link at bottom */}
      <div className="px-3 pb-4 border-t border-border pt-4">
        <Link
          to="/profile"
          className={cn(
            'flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors',
            location.pathname === '/profile'
              ? 'text-foreground bg-sidebar-accent'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-black" />
          </div>
          <span>Profile</span>
        </Link>
      </div>
    </aside>
  );
}