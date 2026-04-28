import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic2, X, Play, ChevronRight, MoreHorizontal,
  CheckCircle2, Shuffle, Plus, ListMusic
} from 'lucide-react';
import { searchiTunes } from '../lib/musicSearch';
import { playSong } from '../lib/playerStore';
import AddToPlaylistModal from './AddToPlaylistModal';

const SEED_ARTISTS = [
  'Arijit Singh', 'Shreya Ghoshal', 'A.R. Rahman', 'Anirudh Ravichander',
  'justin bieber', 'Diljit Dosanjh', 'Neha Kakkar', 'Sid Sriram',
  'The Weeknd', 'Dua Lipa', 'Taylor Swift', 'Jungkook',
];

const SPOTIFY_GREEN = '#1DB954';

const fetchArtistPhoto = async (name) => {
  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?` +
        new URLSearchParams({
          action: 'query', list: 'search', srsearch: name,
          format: 'json', origin: '*', srlimit: '3', srnamespace: '0',
        })
    );
    const searchData = await searchRes.json();
    const pages = searchData?.query?.search;
    if (!pages || pages.length === 0) return null;
    const bestPage =
      pages.find((p) => p.title.toLowerCase().includes(name.toLowerCase().split(' ')[0])) ||
      pages[0];
    const imageRes = await fetch(
      `https://en.wikipedia.org/w/api.php?` +
        new URLSearchParams({
          action: 'query', pageids: String(bestPage.pageid),
          prop: 'pageimages', format: 'json', origin: '*',
          pithumbsize: '800', pilimit: '1',
        })
    );
    const imageData = await imageRes.json();
    const page = imageData?.query?.pages?.[bestPage.pageid];
    return page?.thumbnail?.source || null;
  } catch {
    return null;
  }
};

const formatDuration = (seconds) => {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const formatPlays = (n) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

/* ---------- 3D tilt avatar ---------- */
function TiltAvatar({ artist, onClick, index }) {
  const ref = useRef(null);
  const [t, setT] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setT({ ry: (px - 0.5) * 22, rx: -(py - 0.5) * 22, gx: px * 100, gy: py * 100 });
  };
  const reset = () => setT({ rx: 0, ry: 0, gx: 50, gy: 50 });

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 120 }}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="group relative flex flex-col items-center text-center"
      style={{ perspective: 1000 }}
    >
      <div
        ref={ref}
        className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full transition-transform duration-200 will-change-transform"
        style={{ transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)`, transformStyle: 'preserve-3d' }}
      >
        <div
          className="absolute -inset-1 rounded-full opacity-60 blur-xl group-hover:opacity-100 transition-opacity"
          style={{ background: 'conic-gradient(from 0deg,#1DB954,#a855f7,#ec4899,#1DB954)' }}
        />
        <div
          className="relative w-full h-full rounded-full overflow-hidden border-2 shadow-2xl"
          style={{ borderColor: 'rgba(255,255,255,0.1)', transform: 'translateZ(40px)' }}
        >
          {artist.artwork ? (
            <img src={artist.artwork} alt={artist.name} className="w-full h-full object-cover object-top" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1DB954,#534AB7)' }}>
              <span className="text-white font-bold text-2xl">{artist.name.charAt(0)}</span>
            </div>
          )}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ background: `radial-gradient(circle at ${t.gx}% ${t.gy}%,rgba(255,255,255,0.3),transparent 55%)` }}
          />
          <div
            className="absolute bottom-2 right-2 h-9 w-9 rounded-full flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
            style={{ background: SPOTIFY_GREEN }}
          >
            <Play className="h-4 w-4 fill-current text-black" />
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground truncate max-w-[9rem]">{artist.name}</p>
      <p className="text-xs text-muted-foreground">Artist</p>
    </motion.button>
  );
}

/* ---------- Spotify-style Artist Modal ---------- */
function ArtistModal({ artist, onClose, isFav, onFavorite }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [modalSong, setModalSong] = useState(null); // ✅ playlist modal
  const scrollRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    searchiTunes(artist.name)
      .then((res) => {
        if (!alive) return;
        const filtered = res.filter((s) =>
          s.artist?.toLowerCase().includes(artist.name.toLowerCase())
        );
        setSongs((filtered.length ? filtered : res).slice(0, 10));
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [artist.name]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const onScroll = () => {
    if (!scrollRef.current) return;
    setScrolled(scrollRef.current.scrollTop > 220);
  };

  const handlePlay = (idx = 0) => {
    const song = songs[idx];
    if (!song) return;
    try { playSong(song, songs, idx); } catch (e) { console.warn(e); }
  };

  const handleShuffle = () => {
    if (!songs.length) return;
    const randomIdx = Math.floor(Math.random() * songs.length);
    setShuffled(true);
    handlePlay(randomIdx);
    setTimeout(() => setShuffled(false), 1000);
  };

  const playCounts = useMemo(
    () => songs.map((s) => {
      const seed = String(s.id || s.title).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return 5_000_000 + (seed * 137_731) % 900_000_000;
    }),
    [songs]
  );

  const monthlyListeners = formatPlays(
    28_500_000 + (artist.name.length * 1_274_913) % 30_000_000
  );

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl h-[100vh] sm:h-[90vh] sm:my-4 sm:rounded-xl overflow-hidden shadow-2xl flex flex-col"
            style={{ background: '#121212' }}
          >
            {/* ── Sticky top bar ── */}
            <div
              className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 transition-all duration-300"
              style={{
                background: scrolled
                  ? 'rgba(30,30,30,0.95)'
                  : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* ✅ Play + Shuffle always visible in sticky bar when scrolled */}
                <AnimatePresence>
                  {scrolled && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-3"
                    >
                      <button
                        onClick={() => handlePlay(0)}
                        className="h-9 w-9 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
                        style={{ background: SPOTIFY_GREEN }}
                      >
                        <Play className="h-4 w-4 fill-current text-black ml-0.5" />
                      </button>
                      <button
                        onClick={handleShuffle}
                        className="h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer"
                        style={{
                          background: shuffled ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.1)',
                          border: shuffled ? '1px solid rgba(29,185,84,0.5)' : '1px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        <Shuffle className="h-4 w-4" style={{ color: shuffled ? SPOTIFY_GREEN : '#fff' }} />
                      </button>
                      <h3 className="text-white font-bold text-lg truncate">{artist.name}</h3>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div
              ref={scrollRef}
              onScroll={onScroll}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
            >
              {/* HERO */}
              <div className="relative">
                <div className="relative h-[300px] sm:h-[380px] w-full overflow-hidden">
                  {artist.artwork ? (
                    <>
                      <img
                        src={artist.artwork}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover object-top"
                      />
                      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />
                      <div
                        className="absolute inset-x-0 bottom-0 h-3/4"
                        style={{ background: 'linear-gradient(to bottom,transparent,rgba(18,18,18,0.7) 60%,#121212)' }}
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#1DB954 0%,#191414 100%)' }} />
                  )}

                  {/* Hero text */}
                  <div className="absolute inset-x-0 bottom-0 px-4 sm:px-8 pb-4">
                    <div className="flex items-center gap-2 text-white/90 text-xs font-semibold mb-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: '#3D91F4' }} />
                      Verified Artist
                    </div>
                    <h2
                      className="text-white font-extrabold drop-shadow-2xl"
                      style={{
                        fontSize: 'clamp(2.2rem,7vw,5.5rem)',
                        lineHeight: 0.95,
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {artist.name}
                    </h2>
                    <p className="text-white/80 text-sm font-medium mt-2">
                      {monthlyListeners} monthly listeners
                    </p>
                  </div>
                </div>

                {/* Action bar — Play + Shuffle ALWAYS visible here */}
                <div
                  className="px-4 sm:px-8 pt-5 pb-4"
                  style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.3),#121212 70%)' }}
                >
                  <div className="flex items-center gap-4">
                    {/* Big green Play button */}
                    <button
                      onClick={() => handlePlay(0)}
                      disabled={!songs.length && !loading}
                      className="h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer flex-shrink-0"
                      style={{ background: SPOTIFY_GREEN }}
                      title="Play all"
                    >
                      <Play className="h-6 w-6 fill-current text-black ml-1" />
                    </button>

                    {/* Shuffle button — ALWAYS visible */}
                    <button
                      onClick={handleShuffle}
                      disabled={!songs.length && !loading}
                      className="h-10 w-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer flex-shrink-0"
                      style={{
                        background: shuffled ? 'rgba(29,185,84,0.15)' : 'rgba(255,255,255,0.08)',
                        border: shuffled
                          ? '1px solid rgba(29,185,84,0.5)'
                          : '1px solid rgba(255,255,255,0.15)',
                      }}
                      title="Shuffle"
                    >
                      <Shuffle
                        className="h-4 w-4 transition-colors"
                        style={{ color: shuffled ? SPOTIFY_GREEN : 'rgba(255,255,255,0.7)' }}
                      />
                    </button>

                  </div>
                </div>
              </div>

              {/* ── POPULAR TRACKS ── */}
              <div className="px-4 sm:px-8 pb-4">
                {/* Section header with column labels */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-xl font-bold tracking-tight">Popular</h3>
                </div>

                {/* Column header row */}
                <div
                  className="grid gap-4 px-2 pb-2 mb-1 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    gridTemplateColumns: '1.5rem 2.5rem 1fr 5rem 5rem 3rem',
                    color: 'rgba(255,255,255,0.4)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span className="text-center">#</span>
                  <span />
                  <span>Title</span>
                  <span className="text-right">Plays</span>
                  <span className="text-center">Actions</span>
                  <span className="text-right">
                    <svg className="h-4 w-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </span>
                </div>

                {/* Song rows */}
                {loading ? (
                  <div className="space-y-1 pt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-2 py-3 rounded-md animate-pulse">
                        <div className="w-6 h-3 bg-white/10 rounded" />
                        <div className="h-10 w-10 rounded bg-white/10" />
                        <div className="flex-1 h-3 bg-white/10 rounded w-1/3" />
                        <div className="h-3 w-16 bg-white/5 rounded" />
                        <div className="h-3 w-10 bg-white/5 rounded" />
                      </div>
                    ))}
                  </div>
                ) : songs.length === 0 ? (
                  <p className="text-white/50 text-center py-12">No songs found.</p>
                ) : (
                  <div className="pt-1">
                    {songs.map((song, i) => {
                      const isHover = hoverIdx === i;
                      const fav = isFav?.(song.id);
                      return (
                        <div
                          key={song.id}
                          onMouseEnter={() => setHoverIdx(i)}
                          onMouseLeave={() => setHoverIdx(null)}
                          onDoubleClick={() => handlePlay(i)}
                          className="grid gap-4 items-center px-2 py-2.5 rounded-md cursor-pointer transition-colors"
                          style={{
                            gridTemplateColumns: '1.5rem 2.5rem 1fr 5rem 5rem 3rem',
                            background: isHover ? 'rgba(255,255,255,0.07)' : 'transparent',
                          }}
                        >
                          {/* Index / play */}
                          <div className="flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                            {isHover ? (
                              <button
                                onClick={() => handlePlay(i)}
                                className="text-white cursor-pointer"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                              </button>
                            ) : (
                              <span className="tabular-nums">{i + 1}</span>
                            )}
                          </div>

                          {/* Artwork */}
                          <div className="h-10 w-10 rounded overflow-hidden bg-white/5 shadow-md flex-shrink-0">
                            {song.albumArt ? (
                              <img src={song.albumArt} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>♪</div>
                            )}
                          </div>

                          {/* Title + artist */}
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate" style={{ lineHeight: 1.3 }}>
                              {song.title}
                            </p>
                            <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                              {song.artist}
                            </p>
                          </div>

                          {/* Plays */}
                          <p className="text-sm tabular-nums text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {formatPlays(playCounts[i])}
                          </p>

                          {/* Action buttons — Favorite + Add to Playlist */}
                          <div className="flex items-center justify-center gap-2">
                            {/* Favorite heart */}
                            {onFavorite && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onFavorite(song); }}
                                className="transition-all cursor-pointer hover:scale-110"
                                style={{ opacity: isHover || fav ? 1 : 0 }}
                                title={fav ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 16 16"
                                  fill={fav ? SPOTIFY_GREEN : 'none'}
                                  stroke={fav ? SPOTIFY_GREEN : 'rgba(255,255,255,0.6)'}
                                  strokeWidth="1.5"
                                >
                                  <path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.269 4.269 0 0 0-3.622-1.13A4.313 4.313 0 0 0 .276 4.22c-.553 2.394.444 5.99 5.78 9.299a3.69 3.69 0 0 0 3.888 0c5.336-3.309 6.333-6.905 5.78-9.3z" />
                                </svg>
                              </button>
                            )}

                            {/* Add to Playlist button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setModalSong(song); }}
                              className="transition-all cursor-pointer hover:scale-110"
                              style={{ opacity: isHover ? 1 : 0 }}
                              title="Add to playlist"
                            >
                              <Plus className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                            </button>
                          </div>

                          {/* Duration */}
                          <span className="text-sm tabular-nums text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {formatDuration(song.durationSeconds)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── ABOUT section ── */}
              <div className="px-4 sm:px-8 pb-10 mt-6">
                <h3 className="text-white text-xl font-bold tracking-tight mb-4">About</h3>
                <div
                  className="relative rounded-xl overflow-hidden cursor-pointer group"
                  style={{ background: '#1f1f1f', minHeight: '180px' }}
                >
                  {artist.artwork && (
                    <img
                      src={artist.artwork}
                      alt={artist.name}
                      className="absolute inset-0 w-full h-full object-cover object-top opacity-50 group-hover:opacity-60 transition-opacity"
                    />
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.4) 50%,transparent 100%)' }} />
                  <div className="relative p-5 flex flex-col justify-end h-full min-h-[180px]">
                    <div className="mt-auto">
                      <p className="text-white font-bold text-2xl">{monthlyListeners}</p>
                      <p className="text-white/60 text-xs uppercase tracking-wider mt-1">Monthly listeners</p>
                      <p className="text-white/50 text-sm mt-3 max-w-md leading-relaxed">
                        One of the most streamed artists on the platform. Known for incredible vocals and timeless hits that span across genres.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Add to Playlist Modal — rendered outside the artist modal */}
      {modalSong && (
        <AddToPlaylistModal
          song={modalSong}
          onClose={() => setModalSong(null)}
        />
      )}
    </>
  );
}

/* ---------- Main Section ---------- */
export default function ArtistsSection({ isFav, onFavorite }) {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    let alive = true;
    const loadArtists = async () => {
      try {
        const results = await Promise.all(
          SEED_ARTISTS.map(async (name, i) => {
            await new Promise((r) => setTimeout(r, i * 80));
            const photo = await fetchArtistPhoto(name);
            return { name, artwork: photo };
          })
        );
        if (alive) setArtists(results);
      } catch {
        if (alive) setArtists(SEED_ARTISTS.map((name) => ({ name, artwork: null })));
      } finally {
        if (alive) setLoading(false);
      }
    };
    loadArtists();
    return () => { alive = false; };
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Mic2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Popular Artists</h2>
        </div>
        <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          Hover to tilt · Click to explore
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-accent/40 animate-pulse" />
              <div className="h-3 w-20 bg-accent/40 rounded mt-3 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {artists.map((a, i) => (
            <TiltAvatar key={a.name} artist={a} index={i} onClick={() => setActive(a)} />
          ))}
        </div>
      )}

      {active && (
        <ArtistModal
          artist={active}
          onClose={() => setActive(null)}
          isFav={isFav}
          onFavorite={onFavorite}
        />
      )}
    </section>
  );
}