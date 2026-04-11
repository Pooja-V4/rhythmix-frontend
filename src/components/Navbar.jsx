import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // We'll store userId in localStorage for now
    // In Phase 5 we replace this with JWT token
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const userId = localStorage.getItem('userId');

  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo}>🎵 Rhythmix</h2>
      <div style={styles.links}>
        {userId ? (
          // Show these links only when logged in
          <>
            <Link to="/dashboard" style={styles.link}>Dashboard</Link>
            <Link to="/playlists" style={styles.link}>Playlists</Link>
            <Link to="/search" style={styles.link}>Search</Link>
            <button onClick={handleLogout} style={styles.button}>Logout</button>
          </>
        ) : (
          // Show these links when not logged in
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/signup" style={styles.link}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 32px',
    backgroundColor: '#1a1a2e',
    color: 'white',
  },
  logo: {
    margin: 0,
    color: '#e94560',
  },
  links: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '15px',
  },
  button: {
    backgroundColor: '#e94560',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default Navbar;