import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { searchiTunes } from '../lib/musicSearch';
import { createSong, addFavorite } from '../api/axios';
import { getUserId } from '../lib/auth';
import SongCard from '../components/SongCard';
import { toast } from 'sonner';

const CATEGORIES = [
  { name: 'Pop', color: 'from-pink-500 to-rose-600' },
  { name: 'Hip-Hop', color: 'from-orange-500 to-amber-600' },
  { name: 'Rock', color: 'from-red-600 to-red-800' },
  { name: 'Electronic', color: 'from-cyan-500 to-blue-600' },
  { name: 'R&B', color: 'from-purple-500 to-violet-700' },
  { name: 'Jazz', color: 'from-green-600 to-emerald-800' },
  { name: 'Classical', color: 'from-yellow-600 to-amber-800' },
  { name: 'Country', color: 'from-lime-600 to-green-800' },
];

export default function Search() {
  const userId = getUserId();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Support ?q= from genre cards on home
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, []);

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const songs = await searchiTunes(q);
      setResults(songs);
    } catch {
      console.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (song) => {
    if (!userId) return;
    try {
      const res = await createSong({
        title: song.title,
        artist: song.artist,
        album: song.album,
        durationSeconds: song.durationSeconds,
      });
      await addFavorite(Number(userId), res.data.id);
      toast.success(`"${song.title}" added to favorites!`);
    } catch {
      toast.error('Already in favorites!');
    }
  };

  const handleSave = async (song) => {
    try {
      await createSong({
        title: song.title,
        artist: song.artist,
        album: song.album,
        durationSeconds: song.durationSeconds,
      });
      toast.success(`"${song.title}" saved to library!`);
    } catch {
      toast.error('Could not save song.');
    }
  };

  return (
    <div className="pb-28 px-6 pt-4">
      {/* Search bar */}
      <div className="relative max-w-lg mb-8">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          placeholder="What do you want to listen to?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full pl-12 h-12 rounded-full bg-surface text-foreground border-none text-base font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Results</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((song, i) => (
              <SongCard
                key={song.id}
                song={song}
                index={i}
                queue={results}
                onFavorite={() => handleFavorite(song)}
                onSave={() => handleSave(song)}
              />
            ))}
          </div>
        </section>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-center text-muted-foreground mt-20 text-lg">
          No results found. Try another search!
        </p>
      )}

      {!searched && !loading && (
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <motion.div
                key={cat.name}
                whileHover={{ scale: 1.02 }}
                className={`bg-gradient-to-br ${cat.color} rounded-lg p-5 h-28 cursor-pointer overflow-hidden relative`}
                onClick={() => {
                  setQuery(cat.name);
                  handleSearch(cat.name);
                }}
              >
                <span className="text-lg font-bold text-white">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}