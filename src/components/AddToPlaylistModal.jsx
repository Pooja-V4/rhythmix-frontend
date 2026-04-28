import { useState, useEffect } from 'react';
import { X, Plus, ListMusic, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserPlaylists, createPlaylist, addSongToPlaylist, createSong } from '../api/axios';
import { getUserId } from '../lib/auth';
import { toast } from 'sonner';

function AddToPlaylistModal({ song, onClose }) {
  const userId = getUserId();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedTo, setAddedTo] = useState(new Set());
  const [addingTo, setAddingTo] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchPlaylists();
    // Close on Escape key
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

   const fetchPlaylists = async () => {
    try {
      const res = await getUserPlaylists(Number(userId));
      const data = res.data || [];
      setPlaylists(data);

      // Pre-check which playlists already contain this song (by title match)
      const alreadyIn = new Set();
      data.forEach((pl) => {
        const hasSong = pl.songs?.some(
          (s) =>
            s.title?.toLowerCase() === song.title?.toLowerCase() &&
            s.artist?.toLowerCase() === song.artist?.toLowerCase()
        );
        if (hasSong) alreadyIn.add(pl.id);
      });
      setAddedTo(alreadyIn);
    } catch {
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };
  // Save song to backend then add to playlist
  const handleAddToPlaylist = async (playlistId) => {
    if (addedTo.has(playlistId)) {
      toast.info('This song is already in this playlist!');
      return;
    }
    setAddingTo(playlistId);
    try {
      // Step 1 — save song to backend DB
      const songRes = await createSong({
        title: song.title,
        artist: song.artist,
        album: song.album || '',
        durationSeconds: song.durationSeconds || 0,
      });
      const songId = songRes.data.id;

      // Step 2 — add to playlist
      await addSongToPlaylist(playlistId, songId);
      setAddedTo((prev) => new Set([...prev, playlistId]));
      toast.success(`Added "${song.title}" to playlist!`);

      // Auto close after short delay
      setTimeout(() => onClose(), 800);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 409) {
        // Handle duplicate from backend
        setAddedTo((prev) => new Set([...prev, playlistId]));
        toast.info('This song is already in this playlist!');
      } else {
        toast.error(message || 'Could not add song.');
      }  
    } finally {
      setAddingTo(null);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newName.trim()) return;

    // Check duplicate name before calling API
    const nameExists = playlists.some(
      (pl) => pl.name.toLowerCase() === newName.trim().toLowerCase()
    );
    if (nameExists) {
      toast.error(`You already have a playlist named "${newName.trim()}"`);
      return;
    }
    
    setCreating(true);
    try {
      await createPlaylist(Number(userId), { name: newName });
      setNewName('');
      setShowCreate(false);
      toast.success('Playlist created!');
      fetchPlaylists();
    } catch {
      toast.error('Could not create playlist.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-border">
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="font-bold text-foreground text-lg">Add to Playlist</h3>
              <p className="text-muted-foreground text-sm truncate mt-0.5">
                "{song.title}" — {song.artist}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-10 px-4">
                <ListMusic className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-semibold">No playlists yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Create a playlist below to add this song
                </p>
              </div>
            ) : (
              <div className="py-2">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => handleAddToPlaylist(pl.id)}
                    disabled={addingTo !== null}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors text-left cursor-pointer disabled:opacity-60"
                  >
                    {/* Playlist icon */}
                    <div className="h-10 w-10 rounded-md bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center flex-shrink-0">
                      {addingTo === pl.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <ListMusic className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium text-sm truncate">{pl.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {pl.songs?.length || 0} songs
                      </p>
                    </div>
                    <span className="text-muted-foreground text-lg">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer — create new playlist */}
          <div className="p-4 border-t border-border">
            {showCreate ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  placeholder="Playlist name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                  className="flex-1 h-9 px-3 rounded-md bg-surface text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary border-none"
                />
                <button
                  onClick={handleCreatePlaylist}
                  disabled={creating || !newName.trim()}
                  className="h-9 px-4 bg-primary text-black font-bold rounded-md text-sm hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewName(''); }}
                  className="h-9 px-3 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors text-sm font-medium cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                New Playlist
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
export default AddToPlaylistModal;