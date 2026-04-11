import { useState } from 'react';
import { Play, Pause, Heart, Plus } from 'lucide-react';
import { usePlayerStore, playSong } from '../lib/playerStore';
import { motion } from 'framer-motion';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

export default function SongCard({ song, index, queue, isFavorited, onFavorite }) {
  const { currentSong, isPlaying } = usePlayerStore();
  const isActive = currentSong?.id === song.id;
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="group relative bg-card hover:bg-accent/50 rounded-lg p-3 transition-all duration-300 cursor-pointer"
        onClick={() => song.previewUrl && playSong(song, queue, index)}
      >
        {/* Album Art */}
        <div className="relative mb-3">
          {song.albumArt ? (
            <img
              src={song.albumArt}
              alt={song.title}
              className="w-full aspect-square rounded-md object-cover shadow-lg"
            />
          ) : (
            <div className="w-full aspect-square rounded-md bg-surface flex items-center justify-center text-4xl">
              🎵
            </div>
          )}

          {/* Play overlay */}
          {song.previewUrl && (
            <button
              className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-primary shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                playSong(song, queue, index);
              }}
            >
              {isActive && isPlaying
                ? <Pause className="h-4 w-4 fill-current text-black" />
                : <Play className="h-4 w-4 fill-current text-black ml-0.5" />
              }
            </button>
          )}
        </div>

        <p className="text-sm font-semibold text-foreground truncate">{song.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{song.artist}</p>

        {/* Action buttons — show on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Favorite */}
          {onFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onFavorite(); }}
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isFavorited
                  ? 'text-primary bg-background/80'
                  : 'bg-background/80 text-muted-foreground hover:text-foreground'
              }`}
              title="Add to favorites"
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Add to playlist */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            className="h-7 w-7 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Add to playlist"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {!song.previewUrl && (
          <p className="text-[10px] text-destructive mt-1">No preview</p>
        )}
      </motion.div>

      {/* Playlist Modal */}
      {showModal && (
        <AddToPlaylistModal
          song={song}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}