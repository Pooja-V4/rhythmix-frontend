import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Music2, TrendingUp, ChevronRight, Disc3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { isLoggedIn, getUserId } from '../lib/auth';
import { searchiTunes } from '../lib/musicSearch';
import { getFavorites, addFavorite, createSong } from '../api/axios';
import SongCard from '../Components/SongCard';
import { playSong } from '../lib/playerStore';
import { toast } from 'sonner';
import ArtistsSection from '../Components/ArtistsSection';


const TRENDING_QUERIES = [
  'bollywood hits 2025',
  'indian pop songs',
  'tamil songs',
  'telugu songs',
  'hindi trending songs'
];

const GENRE_MIXES = [
  { label: 'Chill Vibes', description: 'Relax and unwind', query: 'chill lofi', gradient: 'from-teal-600 to-emerald-800' },
  { label: 'Hip Hop Mix', description: 'Beats & bars', query: 'hip hop hits', gradient: 'from-orange-600 to-red-800' },
  { label: 'Pop Hits', description: 'Chart toppers', query: 'pop hits 2024', gradient: 'from-pink-500 to-purple-800' },
  { label: 'Rock Classics', description: 'Timeless legends', query: 'classic rock', gradient: 'from-slate-600 to-zinc-900' },
  { label: 'R&B Soul', description: 'Smooth grooves', query: 'r&b soul', gradient: 'from-violet-600 to-indigo-900' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function SkeletonGrid({ count }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg p-3 animate-pulse">
          <div className="w-full aspect-square rounded-md bg-accent/40 mb-3" />
          <div className="h-3 bg-accent/40 rounded w-3/4 mb-2" />
          <div className="h-2.5 bg-accent/30 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ icon, title, actionLabel, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const userId = getUserId();

  const [trending, setTrending] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const randomQuery = TRENDING_QUERIES[Math.floor(Math.random() * TRENDING_QUERIES.length)];
        const results = await searchiTunes(randomQuery);
        setTrending(results.slice(0, 12));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTrending(false);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    if (!loggedIn || !userId) return;
    getFavorites(Number(userId))
      .then((res) => setFavorites(res.data || []))
      .catch(console.error);
  }, [loggedIn, userId]);

  const isFav = (song) => favorites.some(
  (f) =>
    f.song?.title?.toLowerCase() === song?.title?.toLowerCase() &&
    f.song?.artist?.toLowerCase() === song?.artist?.toLowerCase()
  );

  const handleFavorite = async (song) => {
    if (!userId) { navigate('/login'); return; }

    // Check by title+artist — more reliable than ID
    const alreadyFavorited = favorites.some(
      (f) =>
        f.song?.title?.toLowerCase() === song.title?.toLowerCase() &&
        f.song?.artist?.toLowerCase() === song.artist?.toLowerCase()
    );

    if (alreadyFavorited) {
    toast.info('Already in your favorites!');
    return;
    }
    try {
      const res = await createSong({
        title: song.title,
        artist: song.artist,
        album: song.album || '',
        durationSeconds: song.durationSeconds || 0,
      });
      await addFavorite(Number(userId), res.data.id);
      // Refresh favorites
      const favRes = await getFavorites(Number(userId));
      setFavorites(favRes.data || []);
      toast.success(`❤️ "${song.title}" added to favorites!`);
    } catch {
      toast.error('Already in favorites!');
    }
  };

  // Not logged in — landing
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center px-4"
        >
          <Music2 className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight mb-4">
            Rhythmix
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto mb-10">
            Discover, play, and organize your favorite music.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="bg-primary text-black font-bold px-8 py-3 rounded-full text-base hover:scale-105 transition-transform"
            >
              Sign up free
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border border-border text-foreground font-bold px-8 py-3 rounded-full text-base hover:bg-accent transition-colors"
            >
              Log in
            </button>
          </div>
        </motion.div>

        {trending.length > 0 && (
          <div className="relative z-10 w-full max-w-6xl mx-auto mt-16 px-6">
            <SectionHeader
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
              title="Trending Now"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {trending.slice(0, 6).map((song, i) => (
                <SongCard key={song.id} song={song} index={i} queue={trending} />
              ))}
            </div>
            <div className="mt-12">
              <ArtistsSection />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Logged in
  return (
    <div className="pb-28">
      {/* Hero */}
      <div className="bg-gradient-to-b from-accent to-background pt-8 pb-10 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{greeting()}</h1>
          <p className="text-muted-foreground mt-1">Welcome back to Rhythmix</p>
        </motion.div>

        {/* Quick-play favorites */}
        {favorites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            <Link
              to="/dashboard"
              className="flex items-center bg-accent/50 hover:bg-accent/70 rounded-md overflow-hidden transition-colors"
            >
              <div className="h-14 w-14 bg-gradient-to-br from-indigo-600 to-blue-400 flex items-center justify-center flex-shrink-0">
                <Disc3 className="h-5 w-5 text-white" />
              </div>
              <span className="px-4 font-bold text-sm text-foreground">Liked Songs</span>
            </Link>
            {favorites.slice(0, 5).map((f) => (
              <div
                key={f.id || f.song?.id}
                className="flex items-center bg-accent/50 hover:bg-accent/70 rounded-md overflow-hidden transition-colors cursor-pointer"
                onClick={() => {
                  if (f.song) {
                    playSong({
                      id: f.song.id,
                      title: f.song.title,
                      artist: f.song.artist,
                      album: f.song.album || '',
                      albumArt: null,
                      previewUrl: null,
                      durationSeconds: f.song.durationSeconds || 0,
                    }, [], 0);
                  }
                }}
              >
                <div className="h-14 w-14 bg-surface flex items-center justify-center text-xl flex-shrink-0">🎵</div>
                <span className="px-4 font-bold text-sm text-foreground truncate">{f.song?.title || 'Song'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 mt-6 space-y-10">
        {/* Trending — with full card functionality */}
        <section>
          <SectionHeader
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            title="Trending Now"
            actionLabel="Show all"
            onAction={() => navigate('/search')}
          />
          {loadingTrending ? (
            <SkeletonGrid count={6} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {trending.map((song, i) => (
                <SongCard
                  key={song.id}
                  song={song}
                  index={i}
                  queue={trending}
                  isFavorited={isFav(song)}
                  onFavorite={() => handleFavorite(song)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Popular Artists */}
        <ArtistsSection isFav={isFav} onFavorite={handleFavorite} />

        {/* Genre Mixes */}
        <section>
          <SectionHeader title="Made For You" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {GENRE_MIXES.map((mix, i) => (
              <motion.div
                key={mix.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group relative rounded-lg overflow-hidden cursor-pointer aspect-square bg-gradient-to-br ${mix.gradient}`}
                onClick={() => navigate(`/search?q=${encodeURIComponent(mix.query)}`)}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="relative h-full flex flex-col justify-end p-4">
                  <p className="text-white font-bold text-lg leading-tight">{mix.label}</p>
                  <p className="text-white/70 text-xs mt-1">{mix.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}