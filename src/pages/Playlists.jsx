import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Music, ListMusic, Play, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserPlaylists, createPlaylist, removeSongFromPlaylist } from '../api/axios';
import { getUserId } from '../lib/auth';
import { playSong } from '../lib/playerStore';
import { usePlayerStore } from '../lib/playerStore';
import { toast } from 'sonner';

function formatDuration(sec) {
  if (!sec) return '0:00';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export default function Playlists() {
  const navigate = useNavigate();
  const userId = getUserId();
  const { currentSong, isPlaying } = usePlayerStore();

  const [playlists, setPlaylists] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getUserPlaylists(Number(userId));
      setPlaylists(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createPlaylist(Number(userId), { name: newName });
      setNewName('');
      toast.success('Playlist created!');
      fetchData();
    } catch {
      toast.error('Could not create playlist.');
    } finally {
      setCreating(false);
    }
  };

  const handlePlayPlaylist = (songs, startIndex = 0) => {
    if (!songs || songs.length === 0) {
      toast.error('No playable songs in this playlist');
      return;
    }

    // Convert backend songs to player format
    const queue = songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album || '',
      albumArt: null,           // backend songs don't store albumArt
      previewUrl: null,         // backend songs don't store previewUrl
      durationSeconds: s.durationSeconds || 0,
    }));

    // Find first song with previewUrl (they may not have it)
    // Since backend songs don't have previewUrl stored,
    // we just start — player will skip if no audio
    playSong(queue[startIndex], queue, startIndex);
    toast('Playing playlist...');
  };

  const handleRemoveSong = async (playlistId, songId) => {
    try {
      await removeSongFromPlaylist(playlistId, songId);
      toast.success('Song removed from playlist');
      fetchData();
    } catch {
      toast.error('Could not remove song');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-28 px-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Your Playlists</h1>
        <span className="text-muted-foreground text-sm">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Create playlist input */}
      <div className="flex gap-3 mb-8 max-w-md">
        <input
          placeholder="New playlist name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="flex-1 h-11 px-4 rounded-md bg-surface border-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="h-11 px-4 bg-primary text-black font-bold rounded-md flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {creating ? 'Creating...' : 'Create'}
        </button>
      </div>

      {/* Empty state */}
      {playlists.length === 0 ? (
        <div className="text-center py-20">
          <ListMusic className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground text-lg font-semibold">No playlists yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Create your first playlist above and add songs from Search
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {playlists.map((pl, idx) => {
            const isExpanded = expandedId === pl.id;
            const songs = pl.songs || [];
            const isCurrentPlaylist = songs.some((s) => s.id === currentSong?.id);

            return (
              <motion.div
                key={pl.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-card rounded-xl overflow-hidden transition-all ${
                  isCurrentPlaylist ? 'ring-1 ring-primary/50' : ''
                }`}
              >
                {/* Playlist header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : pl.id)}
                >
                  {/* Playlist art */}
                  <div className="h-14 w-14 rounded-md bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center flex-shrink-0 relative group">
                    <Music className="h-6 w-6 text-primary" />
                    {/* Play overlay on art */}
                    {songs.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPlaylist(songs, 0);
                        }}
                        className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="h-6 w-6 text-white fill-current" />
                      </button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{pl.name}</h3>
                      {isCurrentPlaylist && isPlaying && (
                        <span className="text-[10px] text-primary font-semibold uppercase tracking-wide">
                          Playing
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {songs.length} song{songs.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Play button */}
                  {songs.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPlaylist(songs, 0);
                      }}
                      className="h-10 w-10 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform cursor-pointer flex-shrink-0"
                    >
                      <Play className="h-4 w-4 text-black fill-current ml-0.5" />
                    </button>
                  )}

                  {/* Expand arrow */}
                  <span className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </div>

                {/* Song list — expandable */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border"
                    >
                      {songs.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <p className="text-muted-foreground text-sm">No songs yet</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Search for songs and add them using the + button
                          </p>
                        </div>
                      ) : (
                        <div className="py-2">
                          {songs.map((song, i) => {
                            const isActiveRow = currentSong?.id === song.id;
                            return (
                              <div
                                key={song.id}
                                className={`group flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors cursor-pointer ${
                                  isActiveRow ? 'bg-accent/40' : ''
                                }`}
                                onClick={() => handlePlayPlaylist(songs, i)}
                              >
                                {/* Index */}
                                <span className={`text-xs w-5 text-center flex-shrink-0 ${
                                  isActiveRow ? 'text-primary' : 'text-muted-foreground'
                                }`}>
                                  {isActiveRow && isPlaying ? '♫' : i + 1}
                                </span>

                                {/* Song info */}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${
                                    isActiveRow ? 'text-primary' : 'text-foreground'
                                  }`}>
                                    {song.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                                </div>

                                {/* Duration */}
                                <span className="text-xs text-muted-foreground">
                                  {formatDuration(song.durationSeconds)}
                                </span>

                                {/* Remove */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSong(pl.id, song.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all cursor-pointer flex-shrink-0"
                                  title="Remove from playlist"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}