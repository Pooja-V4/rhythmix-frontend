import { useState, useEffect, useRef } from 'react';
import { searchiTunes } from '../api/musicApi';
import MusicPlayer from '../components/MusicPlayer';
import API from '../api/axios';

function SongSearch() {
  const userId = localStorage.getItem('userId');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedIds, setSavedIds] = useState(new Set());

  // Playlist popup state
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [addingTo, setAddingTo] = useState(null); // which playlist is being added

  const debounceRef = useRef(null);

  // Fetch user's playlists on mount
  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await API.get(`/playlists/user/${userId}`);
      setPlaylists(res.data);
    } catch (err) {
      console.error('Could not fetch playlists:', err);
    }
  };

  // Live search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const songs = await searchiTunes(query);
        setResults(songs);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => {
      clearTimeout(debounceRef.current);
      setLoading(false);
    };
  }, [query]);

  const handlePlay = (song, index) => {
    setCurrentSong(song);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (!results.length) return;
    const next = (currentIndex + 1) % results.length;
    setCurrentSong(results[next]);
    setCurrentIndex(next);
  };

  const handlePrev = () => {
    if (!results.length) return;
    const prev = (currentIndex - 1 + results.length) % results.length;
    setCurrentSong(results[prev]);
    setCurrentIndex(prev);
  };

  // Step 1 — Save song to backend, return its DB id
  const saveSongToBackend = async (song) => {
    const res = await API.post('/songs', {
      title: song.title,
      artist: song.artist,
      album: song.album,
      durationSeconds: song.durationSeconds,
    });
    return res.data.id; // ← real DB id
  };

  // Step 2 — Open playlist picker for this song
  const handleOpenPlaylistModal = (song) => {
    setSelectedSong(song);
    setShowPlaylistModal(true);
  };

  // Step 3 — Save song to DB then add to chosen playlist
  const handleAddToPlaylist = async (playlistId) => {
    setAddingTo(playlistId);
    try {
      // First save song to backend
      const songId = await saveSongToBackend(selectedSong);

      // Then add to playlist
      await API.post(`/playlists/${playlistId}/songs/${songId}`);

      alert(`✅ "${selectedSong.title}" added to playlist!`);
      setShowPlaylistModal(false);
      setSelectedSong(null);
    } catch (err) {
      alert('Could not add to playlist. Song may already be in it!');
    } finally {
      setAddingTo(null);
    }
  };

  // Favorite — save to DB then favorite
  const handleFavorite = async (song) => {
    try {
      const songId = await saveSongToBackend(song);
      await API.post(`/favorites/${userId}/songs/${songId}`);
      alert(`❤️ "${song.title}" added to favorites!`);
    } catch (err) {
      alert('Already in favorites!');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Search Songs</h2>

      {/* Search box */}
      <div style={styles.searchBox}>
        <div style={styles.searchRow}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.input}
            placeholder="Type a song, artist or album..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && <span>⏳</span>}
          {query && !loading && (
            <button
              style={styles.clearBtn}
              onClick={() => { setQuery(''); setResults([]); }}
            >✕</button>
          )}
        </div>
        <div style={styles.statusRow}>
          {loading && <p style={styles.statusText}>Searching for "<strong>{query}</strong>"...</p>}
          {!loading && results.length > 0 && <p style={styles.statusText}>{results.length} results for "<strong>{query}</strong>"</p>}
          {!loading && query && results.length === 0 && <p style={styles.noResults}>No results for "{query}"</p>}
          {!query && <p style={styles.hintText}>Start typing to search millions of songs</p>}
        </div>
      </div>

      {/* Skeleton loader */}
      {loading && (
        <div style={styles.grid}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={styles.skeleton}>
              <div style={styles.skeletonImg} />
              <div style={styles.skeletonLine} />
              <div style={{ ...styles.skeletonLine, width: '60%' }} />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && (
        <div style={styles.grid}>
          {results.map((song, index) => (
            <div
              key={song.id}
              style={{
                ...styles.card,
                border: currentSong?.id === song.id
                  ? '2px solid #e94560'
                  : '2px solid transparent',
              }}
            >
              {song.albumArt ? (
                <img src={song.albumArt} alt={song.album} style={styles.albumArt} />
              ) : (
                <div style={styles.artPlaceholder}>🎵</div>
              )}

              <div style={styles.cardBody}>
                <h3 style={styles.title} title={song.title}>{song.title}</h3>
                <p style={styles.artist}>{song.artist}</p>
                <p style={styles.album}>{song.album}</p>
                <div style={styles.metaRow}>
                  <span style={styles.duration}>{formatDuration(song.durationSeconds)}</span>
                  {song.genre && <span style={styles.genre}>{song.genre}</span>}
                  {!song.previewUrl && <span style={styles.noPreviewBadge}>No preview</span>}
                </div>
              </div>

              {/* Action buttons */}
              <div style={styles.btnRow}>
                {/* Play */}
                <button
                  style={{
                    ...styles.playBtn,
                    opacity: song.previewUrl ? 1 : 0.4,
                    cursor: song.previewUrl ? 'pointer' : 'not-allowed',
                    backgroundColor: currentSong?.id === song.id ? '#c73652' : '#e94560',
                  }}
                  onClick={() => song.previewUrl && handlePlay(song, index)}
                >
                  {currentSong?.id === song.id ? '▶ Playing' : '▶ Play'}
                </button>

                {/* Favorite */}
                <button
                  style={styles.iconBtn}
                  onClick={() => handleFavorite(song)}
                  title="Add to favorites"
                >❤️</button>

                {/* Add to Playlist */}
                <button
                  style={{ ...styles.iconBtn, backgroundColor: '#e8f0fe' }}
                  onClick={() => handleOpenPlaylistModal(song)}
                  title="Add to playlist"
                >
                  ➕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== PLAYLIST PICKER MODAL ====== */}
      {showPlaylistModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            {/* Header */}
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Add to Playlist</h3>
                <p style={styles.modalSubtitle}>
                  "{selectedSong?.title}" by {selectedSong?.artist}
                </p>
              </div>
              <button
                style={styles.modalCloseBtn}
                onClick={() => setShowPlaylistModal(false)}
              >✕</button>
            </div>

            {/* Playlist list */}
            {playlists.length === 0 ? (
              <div style={styles.noPlaylists}>
                <p>You have no playlists yet.</p>
                <p style={{ color: '#888', fontSize: '13px' }}>
                  Go to Playlists page to create one first!
                </p>
              </div>
            ) : (
              <div style={styles.playlistList}>
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    style={{
                      ...styles.playlistItem,
                      opacity: addingTo === pl.id ? 0.6 : 1,
                    }}
                    onClick={() => handleAddToPlaylist(pl.id)}
                    disabled={addingTo !== null}
                  >
                    <span style={styles.playlistIcon}>🎵</span>
                    <div style={styles.playlistInfo}>
                      <span style={styles.playlistName}>{pl.name}</span>
                      <span style={styles.playlistCount}>
                        {pl.songs?.length || 0} songs
                      </span>
                    </div>
                    <span style={styles.addArrow}>
                      {addingTo === pl.id ? '⏳' : '→'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Create new playlist shortcut */}
            <div style={styles.modalFooter}>
              <p style={styles.modalFooterText}>
                Don't see your playlist?{' '}
                <span
                  style={styles.refreshLink}
                  onClick={fetchPlaylists}
                >
                  Refresh
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Player */}
      <MusicPlayer
        currentSong={currentSong}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: '32px',
    backgroundColor: '#f0f2f5',
    minHeight: '90vh',
    paddingBottom: '120px',
  },
  heading: { color: '#1a1a2e', marginBottom: '24px' },
  searchBox: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '16px 20px',
    marginBottom: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  searchRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  searchIcon: { fontSize: '20px', flexShrink: 0 },
  input: {
    flex: 1, border: 'none', outline: 'none',
    fontSize: '18px', color: '#1a1a2e', backgroundColor: 'transparent',
  },
  clearBtn: {
    background: 'none', border: 'none',
    fontSize: '16px', color: '#aaa', cursor: 'pointer',
  },
  statusRow: { marginTop: '8px' },
  statusText: { margin: 0, color: '#888', fontSize: '13px' },
  noResults: { margin: 0, color: '#e94560', fontSize: '13px' },
  hintText: { margin: 0, color: '#bbb', fontSize: '13px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  skeleton: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    paddingBottom: '12px',
  },
  skeletonImg: {
    width: '100%', height: '180px',
    backgroundColor: '#e0e0e0', marginBottom: '12px',
  },
  skeletonLine: {
    height: '12px', backgroundColor: '#e0e0e0',
    borderRadius: '6px', margin: '8px 12px', width: '90%',
  },
  card: {
    backgroundColor: 'white', borderRadius: '12px',
    overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    transition: 'border 0.2s', display: 'flex', flexDirection: 'column',
  },
  albumArt: { width: '100%', height: '180px', objectFit: 'cover' },
  artPlaceholder: {
    width: '100%', height: '180px', backgroundColor: '#f5f5f5',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '48px',
  },
  cardBody: { padding: '12px 12px 8px', flex: 1 },
  title: {
    margin: '0 0 4px', color: '#1a1a2e', fontSize: '14px', fontWeight: '600',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  artist: {
    margin: '0 0 2px', color: '#555', fontSize: '13px',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  album: {
    margin: '0 0 6px', color: '#888', fontSize: '12px',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  metaRow: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  duration: { color: '#aaa', fontSize: '11px' },
  genre: {
    fontSize: '10px', backgroundColor: '#f0f0f0',
    color: '#666', padding: '2px 6px', borderRadius: '10px',
  },
  noPreviewBadge: {
    fontSize: '10px', backgroundColor: '#fff0f0',
    color: '#e94560', padding: '2px 6px', borderRadius: '10px',
  },
  btnRow: { display: 'flex', gap: '6px', padding: '8px 12px 12px', marginTop: 'auto' },
  playBtn: {
    flex: 1, padding: '8px', color: 'white',
    border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '500',
  },
  iconBtn: {
    padding: '8px 10px', backgroundColor: '#f0f0f0',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    margin: '0 16px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 20px 16px',
    borderBottom: '1px solid #f0f0f0',
  },
  modalTitle: { margin: '0 0 4px', color: '#1a1a2e', fontSize: '18px' },
  modalSubtitle: { margin: 0, color: '#888', fontSize: '13px' },
  modalCloseBtn: {
    background: 'none', border: 'none',
    fontSize: '18px', cursor: 'pointer',
    color: '#aaa', padding: '4px',
  },
  noPlaylists: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#555',
  },
  playlistList: {
    overflowY: 'auto',
    flex: 1,
    padding: '8px 0',
  },
  playlistItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 20px',
    border: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'background 0.15s',
    textAlign: 'left',
  },
  playlistIcon: { fontSize: '24px', flexShrink: 0 },
  playlistInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  playlistName: { color: '#1a1a2e', fontSize: '15px', fontWeight: '500' },
  playlistCount: { color: '#aaa', fontSize: '12px' },
  addArrow: { color: '#e94560', fontSize: '18px', flexShrink: 0 },
  modalFooter: {
    padding: '12px 20px',
    borderTop: '1px solid #f0f0f0',
  },
  modalFooterText: { margin: 0, color: '#888', fontSize: '13px' },
  refreshLink: {
    color: '#e94560', cursor: 'pointer', textDecoration: 'underline',
  },
};

export default SongSearch;