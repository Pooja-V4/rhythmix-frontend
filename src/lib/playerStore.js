import { useSyncExternalStore } from 'react';
import { searchiTunes } from './musicSearch';

let state = {
  currentSong: null,
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  progress: 0,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  loading: false,  // ← NEW: shows loading state
};

const listeners = new Set();
function emit() { listeners.forEach((l) => l()); }
function getState() { return state; }
function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

let audio = null;
if (typeof window !== 'undefined') {
  audio = new Audio();
  audio.volume = state.volume;

  audio.addEventListener('timeupdate', () => {
    state = {
      ...state,
      currentTime: audio.currentTime,
      duration: audio.duration || 0,
      progress: audio.duration ? (audio.currentTime / audio.duration) * 100 : 0,
    };
    emit();
  });

  audio.addEventListener('ended', () => { playNext(); });

  audio.addEventListener('play', () => {
    state = { ...state, isPlaying: true, loading: false };
    emit();
  });

  audio.addEventListener('pause', () => {
    state = { ...state, isPlaying: false };
    emit();
  });

  audio.addEventListener('waiting', () => {
    state = { ...state, loading: true };
    emit();
  });

  audio.addEventListener('canplay', () => {
    state = { ...state, loading: false };
    emit();
  });
}

// Fetch iTunes preview URL for a song by title + artist
async function fetchPreviewUrl(song) {
  try {
    const results = await searchiTunes(`${song.title} ${song.artist}`);
    if (results && results.length > 0) {
      // Find best match by title
      const match = results.find(
        (r) => r.title.toLowerCase().includes(song.title.toLowerCase())
      ) || results[0];
      return {
        previewUrl: match.previewUrl,
        albumArt: match.albumArt || song.albumArt,
      };
    }
  } catch (err) {
    console.error('iTunes lookup failed:', err);
  }
  return { previewUrl: null, albumArt: song.albumArt };
}


export async function playSong(song, queue, index) {
  if (!audio) return;

  // Update state immediately so UI shows loading
  state = {
    ...state,
    currentSong: song,
    queue: queue || state.queue,
    currentIndex: index ?? state.currentIndex,
    isPlaying: false,
    loading: true,
    progress: 0,
    currentTime: 0,
  };
  emit();

  let previewUrl = song.previewUrl;
  let albumArt = song.albumArt;

  // If no previewUrl stored — fetch from iTunes
  if (!previewUrl) {
    const fetched = await fetchPreviewUrl(song);
    previewUrl = fetched.previewUrl;
    albumArt = fetched.albumArt || albumArt;
  }

  if (!previewUrl) {
    // No preview found anywhere
    state = {
      ...state,
      loading: false,
      currentSong: { ...song, albumArt },
    };
    emit();

    // Try next song in queue automatically
    if (state.queue.length > 1) {
      const next = (state.currentIndex + 1) % state.queue.length;
      setTimeout(() => playSong(state.queue[next], state.queue, next), 500);
    }
    return;
  }

  // Update song with fetched data
  const enrichedSong = { ...song, previewUrl, albumArt };

  state = {
    ...state,
    currentSong: enrichedSong,
    isPlaying: true,
    loading: false,
    progress: 0,
    currentTime: 0,
  };

  audio.src = previewUrl;
  audio.volume = state.volume;
  audio.load();
  audio.play().catch((err) => {
    console.error('Playback error:', err);
    state = { ...state, isPlaying: false, loading: false };
    emit();
  });

  emit();
}

export function togglePlay() {
  if (!audio || !state.currentSong) return;
  if (state.isPlaying) {
    audio.pause();
  } else {
    audio.play().catch(console.error);
  }
}

export function playNext() {
  if (state.queue.length === 0) return;
  const next = (state.currentIndex + 1) % state.queue.length;
  playSong(state.queue[next], state.queue, next);
}

export function playPrev() {
  if (state.queue.length === 0) return;
  const prev = (state.currentIndex - 1 + state.queue.length) % state.queue.length;
  playSong(state.queue[prev], state.queue, prev);
}

export function seekTo(percent) {
  if (!audio || !state.duration) return;
  audio.currentTime = (percent / 100) * state.duration;
}

export function setVolume(v) {
  if (audio) audio.volume = v;
  state = { ...state, volume: v };
  emit();
}

export function usePlayerStore() {
  return useSyncExternalStore(subscribe, getState, getState);
}