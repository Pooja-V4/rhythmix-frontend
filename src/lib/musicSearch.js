export const searchiTunes = async (query) => {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=30`
    );
    const data = await response.json();
    return (data.results || []).map((track) => ({
      id: track.trackId,
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      albumArt: track.artworkUrl100?.replace('100x100', '500x500') || null,
      previewUrl: track.previewUrl || null,
      durationSeconds: Math.floor((track.trackTimeMillis || 0) / 1000),
    }));
  } catch (err) {
    console.error('iTunes search error:', err);
    return [];
  }
};