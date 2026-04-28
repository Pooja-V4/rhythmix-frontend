import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search as SearchIcon, X, Heart, Plus, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchiTunes } from '../lib/musicSearch';
import { createSong, addFavorite, getFavorites } from '../api/axios';
import { getUserId } from '../lib/auth';
import { usePlayerStore, playSong } from '../lib/playerStore';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import { toast } from 'sonner';

// ── Skeleton card ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Album art placeholder */}
      <div
        className="w-full aspect-square"
        style={{ background: 'rgba(255,255,255,0.08)', animation: 'rhythmix-pulse 1.4s ease-in-out infinite' }}
      />
      <div className="p-3 space-y-2">
        <div className="h-3 rounded-full" style={{ width: '75%', background: 'rgba(255,255,255,0.08)', animation: 'rhythmix-pulse 1.4s ease-in-out infinite 0.1s' }} />
        <div className="h-2.5 rounded-full" style={{ width: '50%', background: 'rgba(255,255,255,0.06)', animation: 'rhythmix-pulse 1.4s ease-in-out infinite 0.2s' }} />
        <div className="flex gap-2 pt-1">
          <div className="flex-1 h-7 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', animation: 'rhythmix-pulse 1.4s ease-in-out infinite 0.3s' }} />
          <div className="w-7 h-7 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', animation: 'rhythmix-pulse 1.4s ease-in-out infinite 0.4s' }} />
        </div>
      </div>
    </div>
  );
}

// ── Song card ───────────────────────────────────────────────────────────────
function SongCard({ song, index, queue, onFavorite, onAddToPlaylist, isFavorited }) {
  const { currentSong, isPlaying } = usePlayerStore();
  const isActive = currentSong?.id === song.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.25 }}
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: isActive ? 'rgba(29,158,117,0.1)' : 'rgba(255,255,255,0.04)',
        border: isActive ? '1px solid rgba(29,158,117,0.35)' : '1px solid rgba(255,255,255,0.07)',
        transition: 'border 0.2s, background 0.2s',
      }}
      onClick={() => song.previewUrl && playSong(song, queue, index)}
    >
      {/* Album art */}
      <div className="relative w-full aspect-square overflow-hidden">
        {song.albumArt ? (
          <img
            src={song.albumArt}
            alt={song.title}
            className="w-full h-full object-cover"
            style={{ transition: 'transform 0.3s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            🎵
          </div>
        )}

        {/* Play overlay */}
        {song.previewUrl && (
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            <div className="h-11 w-11 rounded-full flex items-center justify-center" style={{ background: '#1D9E75' }}>
              {isActive && isPlaying
                ? <Pause className="h-5 w-5 text-black fill-current" />
                : <Play className="h-5 w-5 text-black fill-current ml-0.5" />
              }
            </div>
          </div>
        )}

        {/* Playing badge */}
        {isActive && isPlaying && (
          <div className="absolute top-2 left-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#1D9E75', color: '#000', fontSize: '10px', letterSpacing: '0.5px' }}>
              PLAYING
            </span>
          </div>
        )}

        {/* No preview badge */}
        {!song.previewUrl && (
          <div className="absolute top-2 right-2">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(233,69,96,0.2)', color: '#e94560', border: '1px solid rgba(233,69,96,0.3)', fontSize: '10px' }}>
              No preview
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold truncate mb-0.5" style={{ color: isActive ? '#1D9E75' : '#f3f4f6' }}>
          {song.title}
        </p>
        <p className="text-xs truncate mb-2.5" style={{ color: '#6b7280' }}>
          {song.artist}
        </p>

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* Play button */}
          <button
            onClick={(e) => { e.stopPropagation(); song.previewUrl && playSong(song, queue, index); }}
            disabled={!song.previewUrl}
            className="flex-1 h-7 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isActive ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.08)',
              color: isActive ? '#1D9E75' : '#d1d5db',
              border: isActive ? '1px solid rgba(29,158,117,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {isActive && isPlaying ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current ml-0.5" />}
            {isActive && isPlaying ? 'Pause' : 'Play'}
          </button>

          {/* Favorite button — shows filled/green if already favorited */}
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(song); }}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            style={{
              background: isFavorited ? 'rgba(233,69,96,0.15)' : 'rgba(255,255,255,0.06)',
              border: isFavorited ? '1px solid rgba(233,69,96,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}
            title={isFavorited ? 'Already in favorites' : 'Add to favorites'}
          >
            <Heart
              className="h-3.5 w-3.5"
              fill={isFavorited ? '#e94560' : 'none'}
              style={{ color: '#e94560' }}
            />
          </button>

          {/* Add to playlist button */}
          <button
            onClick={(e) => { e.stopPropagation(); onAddToPlaylist(song); }}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            title="Add to playlist"
          >
            <Plus className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Genre browse card ───────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Pop', query: 'pop hits', gradient: 'linear-gradient(135deg,#ec4899,#9333ea)' },
  { name: 'Hip-Hop', query: 'hip hop', gradient: 'linear-gradient(135deg,#f97316,#ea580c)' },
  { name: 'Rock', query: 'rock classic', gradient: 'linear-gradient(135deg,#dc2626,#7f1d1d)' },
  { name: 'Electronic', query: 'electronic', gradient: 'linear-gradient(135deg,#06b6d4,#2563eb)' },
  { name: 'R&B', query: 'r&b soul', gradient: 'linear-gradient(135deg,#8b5cf6,#4f46e5)' },
  { name: 'Jazz', query: 'jazz', gradient: 'linear-gradient(135deg,#10b981,#059669)' },
  { name: 'Classical', query: 'classical music', gradient: 'linear-gradient(135deg,#d97706,#92400e)' },
  { name: 'Country', query: 'country music', gradient: 'linear-gradient(135deg,#65a30d,#15803d)' },
];

// ── Main Search page ────────────────────────────────────────────────────────
export default function Search() {
  const userId = getUserId();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [modalSong, setModalSong] = useState(null);

  // Favorites state — was missing before
  const [favorites, setFavorites] = useState([]);

  const debounceRef = useRef(null);
  const controllerRef = useRef(null);
  const inputRef = useRef(null);

  // Load favorites on mount so heart icons show correct state
  useEffect(() => {
    if (!userId) return;
    getFavorites(Number(userId))
      .then((res) => setFavorites(res.data || []))
      .catch(console.error);
  }, [userId]);

  // Support ?q= from genre/home navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setQuery(q);
      triggerSearch(q);
    }
    inputRef.current?.focus();
  }, []);

  // Live debounced search on every keystroke
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      clearTimeout(debounceRef.current);
      return;
    }

    // Show skeleton immediately
    setLoading(true);
    setHasSearched(true);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      triggerSearch(query);
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const triggerSearch = async (q) => {
    // Cancel previous in-flight request
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    setLoading(true);
    try {
      const songs = await searchiTunes(q);
      setResults(songs);
    } catch (err) {
      if (err.name !== 'AbortError') setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Check by title+artist — reliable duplicate detection
  const isFav = (song) => favorites.some(
    (f) =>
      f.song?.title?.toLowerCase() === song?.title?.toLowerCase() &&
      f.song?.artist?.toLowerCase() === song?.artist?.toLowerCase()
  );

  const handleFavorite = async (song) => {
    if (!userId) return;

    // Block duplicate before API call
    if (isFav(song)) {
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

      // Refresh favorites list so heart updates immediately
      const favRes = await getFavorites(Number(userId));
      setFavorites(favRes.data || []);

      toast.success(`❤️ "${song.title}" added to favorites!`);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        toast.info('Already in your favorites!');
      } else {
        toast.error('Could not add to favorites.');
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes rhythmix-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div className="pb-28 px-6 pt-4">

        {/* ── Search bar ── */}
        <div className="relative max-w-xl mb-8">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {/* Search icon / spinner */}
            {loading ? (
              <div
                className="h-5 w-5 rounded-full border-2 flex-shrink-0"
                style={{
                  borderColor: 'rgba(29,158,117,0.3)',
                  borderTopColor: '#1D9E75',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <SearchIcon className="h-5 w-5 flex-shrink-0" style={{ color: '#6b7280' }} />
            )}

            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, albums..."
              className="flex-1 bg-transparent outline-none text-base font-medium"
              style={{ color: '#f3f4f6', caretColor: '#1D9E75' }}
              autoComplete="off"
              spellCheck="false"
            />

            {/* Live indicator + clear */}
            {query && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {loading && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(29,158,117,0.15)', color: '#1D9E75', fontSize: '10px' }}
                  >
                    LIVE
                  </span>
                )}
                <button
                  onClick={handleClear}
                  className="h-6 w-6 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <X className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} />
                </button>
              </div>
            )}
          </div>

          {/* Live search hint below bar */}
          <AnimatePresence>
            {query && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 mt-2 px-1"
              >
                {loading ? (
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    Searching for{' '}
                    <span style={{ color: '#1D9E75', fontWeight: 600 }}>"{query}"</span>...
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    {results.length > 0 ? (
                      <>
                        <span style={{ color: '#1D9E75', fontWeight: 600 }}>{results.length} results</span>
                        {' '}for "{query}"
                      </>
                    ) : (
                      <span style={{ color: '#e94560' }}>No results for "{query}"</span>
                    )}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Skeleton grid while loading ── */}
        {loading && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="h-3 w-3 rounded-full"
                style={{ background: '#1D9E75', animation: 'rhythmix-pulse 1s ease-in-out infinite' }}
              />
              <p className="text-sm font-medium" style={{ color: '#1D9E75' }}>Loading results...</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Results grid ── */}
        {!loading && results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Results</h2>
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)' }}
              >
                {results.length} songs
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {results.map((song, i) => (
                <SongCard
                  key={song.id}
                  song={song}
                  index={i}
                  queue={results}
                  onFavorite={handleFavorite}
                  onAddToPlaylist={setModalSong}
                  isFavorited={isFav(song)}   // ✅ pass correct state
                />
              ))}
            </div>
          </div>
        )}

        {/* ── No results ── */}
        {!loading && hasSearched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <SearchIcon className="h-9 w-9" style={{ color: '#4b5563' }} />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">
              No results for "{query}"
            </p>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              Try a different spelling or search for an artist name
            </p>
          </motion.div>
        )}

        {/* ── Browse categories (empty state) ── */}
        {!hasSearched && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-bold text-foreground mb-4">Browse all</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {CATEGORIES.map((cat, i) => (
                <motion.button
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setQuery(cat.query)}
                  className="relative h-24 rounded-2xl overflow-hidden text-left cursor-pointer"
                  style={{ background: cat.gradient }}
                >
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.15)' }} />
                  <div className="relative h-full flex flex-col justify-end p-4">
                    <p className="text-white font-bold text-base leading-tight">{cat.name}</p>
                  </div>
                  <div
                    className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Playlist modal */}
      {modalSong && (
        <AddToPlaylistModal
          song={modalSong}
          onClose={() => setModalSong(null)}
        />
      )}
    </>
  );
}