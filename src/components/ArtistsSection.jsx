import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, X, Play, ChevronRight } from 'lucide-react';
import { searchiTunes } from '../lib/musicSearch';
import SongCard from './SongCard';

const SEED_ARTISTS = [
  'Arijit Singh', 'Shreya Ghoshal', 'A.R. Rahman', 'Anirudh Ravichander',
  'justin bieber', 'Diljit Dosanjh', 'Neha Kakkar', 'Sid Sriram',
  'The Weeknd', 'Dua Lipa', 'Taylor Swift', 'Jungkook',
];

const fetchArtistPhoto = async (name) => {
  try {
    // ✅ Direct Wikipedia search — no MusicBrainz needed
    // Search Wikipedia for the artist
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: name,
        format: 'json',
        origin: '*',
        srlimit: '3',
        srnamespace: '0',
      })
    );
    const searchData = await searchRes.json();
    const pages = searchData?.query?.search;

    if (!pages || pages.length === 0) return null;

    // Pick the best matching page
    // Prefer exact title match, then first result
    const bestPage = pages.find(
      (p) => p.title.toLowerCase().includes(name.toLowerCase().split(' ')[0])
    ) || pages[0];

    // ✅ Get the actual page image using pageid
    const imageRes = await fetch(
      `https://en.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: 'query',
        pageids: String(bestPage.pageid),
        prop: 'pageimages|images',
        format: 'json',
        origin: '*',
        pithumbsize: '500',
        pilimit: '1',
      })
    );
    const imageData = await imageRes.json();
    const page = imageData?.query?.pages?.[bestPage.pageid];
    const thumb = page?.thumbnail?.source;

    if (thumb) return thumb;

    return null;
  } catch (err) {
    console.warn(`Wikipedia fetch failed for ${name}:`, err.message);
    return null;
  }
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
        style={{
          transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow ring */}
        <div
          className="absolute -inset-1 rounded-full opacity-60 blur-xl group-hover:opacity-100 transition-opacity"
          style={{
            background: 'conic-gradient(from 0deg,#1D9E75,#a855f7,#ec4899,#1D9E75)',
          }}
        />

        {/* Photo or fallback */}
        <div
          className="relative w-full h-full rounded-full overflow-hidden border-2 shadow-2xl"
          style={{ borderColor: 'rgba(255,255,255,0.1)', transform: 'translateZ(40px)' }}
        >
          {artist.artwork ? (
            <img
              src={artist.artwork}
              alt={artist.name}
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            // ✅ Fallback — gradient with initials
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1D9E75,#534AB7)' }}
            >
              <span className="text-white font-bold text-2xl">
                {artist.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Sheen on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${t.gx}% ${t.gy}%,rgba(255,255,255,0.3),transparent 55%)`,
            }}
          />

          {/* Play badge */}
          <div
            className="absolute bottom-2 right-2 h-9 w-9 rounded-full flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
            style={{ background: '#1D9E75', transform: 'translateZ(60px)' }}
          >
            <Play className="h-4 w-4 fill-current text-black" />
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-foreground truncate max-w-[9rem]">
        {artist.name}
      </p>
      <p className="text-xs text-muted-foreground">Artist</p>
    </motion.button>
  );
}

/* ---------- Artist Modal ---------- */
function ArtistModal({ artist, onClose, isFav, onFavorite }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    searchiTunes(artist.name)
      .then((res) => {
        if (!alive) return;
        const filtered = res.filter(
          (s) => s.artist?.toLowerCase().includes(artist.name.toLowerCase())
        );
        setSongs((filtered.length ? filtered : res).slice(0, 12));
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [artist.name]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.92, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl bg-card rounded-2xl overflow-hidden border border-border shadow-2xl my-8"
        >
          {/* Hero header */}
          <div className="relative h-56 sm:h-64 overflow-hidden">
            {artist.artwork && (
              <img
                src={artist.artwork}
                alt=""
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative z-10 h-full flex items-end gap-5 p-6">
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl flex-shrink-0">
                {artist.artwork ? (
                  <img
                    src={artist.artwork}
                    alt={artist.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#1D9E75,#534AB7)' }}
                  >
                    <span className="text-white font-bold text-4xl">
                      {artist.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="pb-2">
                <p className="text-xs uppercase tracking-widest text-white/70">Artist</p>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow">
                  {artist.name}
                </h2>
                <p className="text-white/70 text-sm mt-1">Popular tracks</p>
              </div>
            </div>
          </div>

          {/* Songs grid */}
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-accent/30 rounded-lg p-3 animate-pulse">
                    <div className="w-full aspect-square rounded-md bg-accent/40 mb-3" />
                    <div className="h-3 bg-accent/40 rounded w-3/4 mb-2" />
                    <div className="h-2.5 bg-accent/30 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : songs.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No songs found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {songs.map((song, i) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    index={i}
                    queue={songs}
                    isFavorited={isFav?.(song.id)}
                    onFavorite={onFavorite ? () => onFavorite(song) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
        // ✅ Fetch all artist photos in parallel
        // We stagger requests slightly to be polite to Wikipedia/MusicBrainz APIs
        const results = await Promise.all(
          SEED_ARTISTS.map(async (name, i) => {
            // Small stagger to avoid rate limiting
            await new Promise((r) => setTimeout(r, i * 80));
            const photo = await fetchArtistPhoto(name);
            return { name, artwork: photo };
          })
        );
        if (alive) setArtists(results);
      } catch (err) {
        console.error('Failed to load artists:', err);
        // Fallback — show artists with no photo (initials shown)
        if (alive) {
          setArtists(SEED_ARTISTS.map((name) => ({ name, artwork: null })));
        }
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
            <TiltAvatar
              key={a.name}
              artist={a}
              index={i}
              onClick={() => setActive(a)}
            />
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