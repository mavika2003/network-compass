import { NavLink, useLocation } from 'react-router-dom';
import { Map, MessageSquare, Search, Bell, User, LogOut, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AIContactInput from '@/components/ai/AIContactInput';

const navItems = [
  { path: '/', icon: Map, label: 'Mind Map' },
  { path: '/feed', icon: MessageSquare, label: 'Feed' },
  { path: '/network', icon: Users, label: 'Network' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/reminders', icon: Bell, label: 'Reminders' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <aside className="w-16 lg:w-56 h-screen bg-card border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">N</span>
          </div>
          <span className="text-foreground font-bold text-lg hidden lg:block">NetMind</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* AI inputs + sign out */}
      <div className="p-3 space-y-2 border-t border-border">
        <AIContactInput />
        <button
          onClick={signOut}
          className="flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
