import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Music2, Play, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFavorites, removeFavorite } from '../api/axios';
import { getUserId, isLoggedIn } from '../lib/auth';
import { playSong, usePlayerStore } from '../lib/playerStore';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import { toast } from 'sonner';

function formatDuration(sec) {
  if (!sec) return '0:00';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = getUserId();
  const { currentSong, isPlaying } = usePlayerStore();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalSong, setModalSong] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await getFavorites(Number(userId));
      setFavorites(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (songId) => {
    try {
      await removeFavorite(Number(userId), songId);
      setFavorites((prev) => prev.filter((f) => f.song?.id !== songId));
      toast.success('Removed from favorites');
    } catch {
      toast.error('Could not remove');
    }
  };

  // Convert backend favorites to player-compatible songs
  const favSongs = favorites
    .filter((f) => f.song)
    .map((f) => ({
      id: f.song.id,
      title: f.song.title,
      artist: f.song.artist,
      album: f.song.album || '',
      albumArt: null,
      previewUrl: null,
      durationSeconds: f.song.durationSeconds || 0,
    }));

  const handlePlayAll = () => {
    if (favSongs.length === 0) return;
    playSong(favSongs[0], favSongs, 0);
    toast('Playing liked songs...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="pb-28 px-6 pt-4">
        {/* Header */}
        <div className="flex items-end gap-6 mb-8 bg-gradient-to-b from-indigo-900/60 to-transparent p-6 -mx-6 -mt-4 rounded-b-xl">
          <div className="h-32 w-32 bg-gradient-to-br from-indigo-600 to-blue-400 rounded-lg flex items-center justify-center shadow-2xl flex-shrink-0">
            <Heart className="h-16 w-16 text-white fill-current" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Playlist</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mt-1">Liked Songs</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {favorites.length} song{favorites.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Play All button */}
        {favSongs.length > 0 && (
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handlePlayAll}
              className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
            >
              <Play className="h-6 w-6 text-black fill-current ml-1" />
            </button>
            <span className="text-muted-foreground text-sm">Play all</span>
          </div>
        )}

        {/* Song list */}
        {favorites.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-lg">
            <Music2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground text-lg font-semibold">Songs you like will appear here</p>
            <p className="text-muted-foreground text-sm mt-1">Save songs by clicking the ❤️ icon</p>
            <button
              className="mt-6 bg-primary text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform"
              onClick={() => navigate('/search')}
            >
              Find songs
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {favSongs.map((song, i) => {
              const isActive = currentSong?.id === song.id;
              return (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`group flex items-center gap-4 px-4 py-2 rounded-md transition-colors cursor-pointer ${
                    isActive ? 'bg-accent/60' : 'hover:bg-accent/30'
                  }`}
                  onClick={() => playSong(song, favSongs, i)}
                >
                  {/* Index */}
                  <span className={`w-8 text-center text-sm flex-shrink-0 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {isActive && isPlaying ? '♫' : i + 1}
                  </span>

                  {/* Art */}
                  <div className="h-10 w-10 rounded bg-surface flex items-center justify-center text-lg flex-shrink-0">
                    🎵
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {song.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  </div>

                  {/* Album */}
                  <p className="hidden lg:block text-sm text-muted-foreground truncate w-[200px]">
                    {song.album}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Add to playlist */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setModalSong(song); }}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Add to playlist"
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    {/* Remove favorite */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUnfavorite(song.id); }}
                      className="text-primary hover:text-destructive cursor-pointer transition-colors"
                      title="Remove from favorites"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </button>
                  </div>

                  {/* Duration */}
                  <span className="text-sm text-muted-foreground w-12 text-right flex-shrink-0">
                    {formatDuration(song.durationSeconds)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add to playlist modal */}
      {modalSong && (
        <AddToPlaylistModal
          song={modalSong}
          onClose={() => setModalSong(null)}
        />
      )}
    </>
  );
}