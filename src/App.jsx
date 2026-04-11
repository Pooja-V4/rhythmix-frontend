import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppSidebar from './components/AppSidebar';
import TopBar from './components/TopBar';
import MusicPlayer from './components/MusicPlayer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Playlists from './pages/Playlists';
import Search from './pages/Search';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/search" element={<Search />} />
            </Routes>
          </main>
        </div>
        <MusicPlayer />
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;