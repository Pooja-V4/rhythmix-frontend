import { Link, useNavigate } from 'react-router-dom';
import { Music2 } from 'lucide-react';
import { isLoggedIn, clearUserId, getUserName } from '../lib/auth';

export default function TopBar() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const userName = getUserName();

  const handleLogout = () => {
    clearUserId();
    navigate('/login');
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 md:px-8 border-b border-border"
      style={{ backgroundColor: 'oklch(0.13 0.005 270)' }}
    >
      <div className="flex md:hidden items-center gap-2">
        <Music2 className="h-6 w-6 text-primary" />
        <span className="font-bold text-foreground">Rhythmix</span>
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        {loggedIn ? (
          <>
            {/* Show username */}
            {userName && (
              <span className="hidden md:block text-sm text-muted-foreground">
                👋 {userName}
              </span>
            )}
            <div className="flex md:hidden items-center gap-2">
              <Link to="/dashboard">
                <button className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">
                  Home
                </button>
              </Link>
              <Link to="/search">
                <button className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">
                  Search
                </button>
              </Link>
            </div>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'white',
                color: 'black',
                border: 'none',
                borderRadius: '9999px',
                padding: '6px 20px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
              }}
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
              <button
                style={{
                  backgroundColor: 'white',
                  color: 'black',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '6px 20px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Log in
              </button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}