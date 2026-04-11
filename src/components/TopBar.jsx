import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Music2 } from 'lucide-react';
import { isLoggedIn, clearUserId } from '../lib/auth';

export default function TopBar() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const handleLogout = () => {
    clearUserId();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 md:px-8 bg-background/80 backdrop-blur-md border-b border-border">
      {/* Mobile logo */}
      <div className="flex md:hidden items-center gap-2">
        <Music2 className="h-6 w-6 text-primary" />
        <span className="font-bold text-foreground">Rhythmix</span>
      </div>
      <div className="hidden md:block" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {loggedIn ? (
          <>
            <div className="flex md:hidden items-center gap-2">
              <Link to="/dashboard">
                <button className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Home</button>
              </Link>
              <Link to="/search">
                <button className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Search</button>
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-foreground border border-border rounded-full px-4 py-1.5 hover:bg-accent transition-colors"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/signup">
              <button className="text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5">
                Sign up
              </button>
            </Link>
            <Link to="/login">
              <button className="text-sm font-bold bg-foreground text-background rounded-full px-4 py-1.5 hover:scale-105 transition-transform">
                Log in
              </button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}