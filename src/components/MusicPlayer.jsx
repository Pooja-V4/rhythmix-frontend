import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { usePlayerStore, togglePlay, playNext, playPrev, seekTo, setVolume } from '../lib/playerStore';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MusicPlayer() {
  const { currentSong, isPlaying, progress, currentTime, duration, volume } = usePlayerStore();

  if (!currentSong) return null;

  const openYouTube = () => {
    const q = encodeURIComponent(`${currentSong.title} ${currentSong.artist} official audio`);
    window.open(`https://www.youtube.com/results?search_query=${q}`, '_blank');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[90px] bg-player border-t border-border flex items-center px-4 z-50 animate-slide-up">

      {/* Left — Song info */}
      <div className="flex items-center gap-3 w-[250px] min-w-[180px]">
        {currentSong.albumArt ? (
          <img
            src={currentSong.albumArt}
            alt={currentSong.title}
            className="h-14 w-14 rounded-md object-cover shadow-lg"
          />
        ) : (
          <div className="h-14 w-14 rounded-md bg-surface flex items-center justify-center text-2xl">
            🎵
          </div>
        )}
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-foreground truncate">{currentSong.title}</p>
          <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
        </div>
      </div>

      {/* Center — Controls */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-[600px] mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={playPrev}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <SkipBack className="h-4 w-4 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
          >
            {isPlaying
              ? <Pause className="h-4 w-4 fill-current" />
              : <Play className="h-4 w-4 fill-current ml-0.5" />
            }
          </button>

          <button
            onClick={playNext}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <SkipForward className="h-4 w-4 fill-current" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-[11px] text-muted-foreground w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-1 bg-surface rounded-full cursor-pointer group relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = ((e.clientX - rect.left) / rect.width) * 100;
              seekTo(pct);
            }}
          >
            <div
              className="h-full bg-foreground rounded-full group-hover:bg-primary transition-colors relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground w-10">
            {formatTime(duration)}
          </span>
        </div>

        {currentSong.previewUrl && (
          <p className="text-[10px] text-muted-foreground">
            30s preview ·{' '}
            <button
              onClick={openYouTube}
              className="text-primary hover:underline cursor-pointer"
            >
              Full song on YouTube
            </button>
          </p>
        )}
      </div>

      {/* Right — Volume */}
      <div className="flex items-center gap-2 w-[200px] justify-end">
        <button onClick={openYouTube} className="text-muted-foreground hover:text-foreground cursor-pointer">
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
          className="text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {volume === 0
            ? <VolumeX className="h-4 w-4" />
            : <Volume2 className="h-4 w-4" />
          }
        </button>
        <div
          className="w-24 h-1 bg-surface rounded-full cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
          }}
        >
          <div
            className="h-full bg-foreground rounded-full group-hover:bg-primary transition-colors"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}