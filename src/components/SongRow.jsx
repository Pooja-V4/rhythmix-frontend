import { Play, Pause, Heart } from 'lucide-react';
import { usePlayerStore, playSong } from '../lib/playerStore';

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SongRow({ song, index, queue, isFavorited, onFavorite, onUnfavorite }) {
  const { currentSong, isPlaying } = usePlayerStore();
  const isActive = currentSong?.id === song.id;

  return (
    <div
      className={`group flex items-center gap-4 px-4 py-2 rounded-md cursor-pointer transition-colors ${
        isActive ? 'bg-accent/60' : 'hover:bg-accent/30'
      }`}
      onClick={() => song.previewUrl && playSong(song, queue, index)}
    >
      {/* Index or play icon */}
      <div className="w-8 text-center text-sm text-muted-foreground">
        <span className="group-hover:hidden">
          {isActive && isPlaying ? '♫' : index + 1}
        </span>
        <span className="hidden group-hover:inline text-foreground">
          {isActive && isPlaying
            ? <Pause className="h-3.5 w-3.5 inline" />
            : <Play className="h-3.5 w-3.5 inline" />
          }
        </span>
      </div>

      {/* Art + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {song.albumArt ? (
          <img src={song.albumArt} alt="" className="h-10 w-10 rounded object-cover" />
        ) : (
          <div className="h-10 w-10 rounded bg-surface flex items-center justify-center text-lg">🎵</div>
        )}
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
            {song.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
        </div>
      </div>

      {/* Album — hidden on small screens */}
      <p className="hidden lg:block text-sm text-muted-foreground truncate w-[200px]">
        {song.album}
      </p>

      {/* Favorite button */}
      {(onFavorite || onUnfavorite) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            isFavorited ? onUnfavorite?.() : onFavorite?.();
          }}
          className={`opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
            isFavorited ? 'text-primary opacity-100' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      )}

      {/* Duration */}
      <span className="text-sm text-muted-foreground w-12 text-right">
        {formatDuration(song.durationSeconds)}
      </span>
    </div>
  );
}