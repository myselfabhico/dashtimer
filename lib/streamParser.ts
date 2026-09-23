export type StreamProvider =
  | 'youtube'
  | 'ytmusic'
  | 'spotify'
  | 'applemusic'
  | 'soundcloud'
  | 'audio';

export interface ParsedStream {
  provider: StreamProvider;
  originalUrl: string;
  // YouTube / YouTube Music specific
  videoId?: string;
  playlistId?: string;
  // Spotify / Apple Music / SoundCloud embed URL
  embedUrl?: string;
  // Spotify details
  spotifyType?: 'track' | 'playlist' | 'album' | 'artist' | 'episode';
  spotifyId?: string;
  // Display details
  defaultTitle: string;
  defaultArtist: string;
  // Whether this provider plays through the invisible YouTube Audio Engine
  isBackgroundAudioEngine: boolean;
}

export function parseStreamUrl(input: string): ParsedStream | null {
  const url = input.trim();
  if (!url) return null;

  // 1. YouTube Music / Standard YouTube
  // Check for YouTube Music first
  const isYtMusic = /music\.youtube\.com/i.test(url);
  const ytVideoMatch = url.match(
    /(?:music\.youtube\.com\/watch\?v=|youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i
  );
  const ytPlaylistMatch = url.match(
    /(?:music\.youtube\.com|youtube\.com)\/playlist\?list=([\w-]+)/i
  );

  if (ytVideoMatch && ytVideoMatch[1]) {
    const videoId = ytVideoMatch[1];
    const playlistId = ytPlaylistMatch ? ytPlaylistMatch[1] : undefined;
    return {
      provider: isYtMusic ? 'ytmusic' : 'youtube',
      originalUrl: url,
      videoId,
      playlistId,
      defaultTitle: isYtMusic ? 'YouTube Music Track' : 'YouTube Audio Stream',
      defaultArtist: isYtMusic ? 'YouTube Music' : 'YouTube',
      isBackgroundAudioEngine: true,
    };
  }

  if (ytPlaylistMatch && ytPlaylistMatch[1]) {
    const playlistId = ytPlaylistMatch[1];
    return {
      provider: isYtMusic ? 'ytmusic' : 'youtube',
      originalUrl: url,
      playlistId,
      defaultTitle: isYtMusic ? 'YouTube Music Playlist' : 'YouTube Playlist',
      defaultArtist: isYtMusic ? 'YouTube Music' : 'YouTube',
      isBackgroundAudioEngine: true,
    };
  }

  // 11-char standalone ID check (fallback for raw YouTube ID)
  if (/^[\w-]{11}$/.test(url)) {
    return {
      provider: 'youtube',
      originalUrl: url,
      videoId: url,
      defaultTitle: 'YouTube Audio',
      defaultArtist: 'YouTube',
      isBackgroundAudioEngine: true,
    };
  }

  // 2. Spotify (tracks, singles, playlists, albums, artists, episodes, international URLs)
  const spotifyMatch = url.match(
    /(?:open\.spotify\.com\/(?:intl-[a-z]{2,3}\/)?|spotify:)(track|playlist|album|artist|episode)[:/]([a-zA-Z0-9]+)/i
  );

  if (spotifyMatch) {
    const spotifyType = spotifyMatch[1].toLowerCase() as 'track' | 'playlist' | 'album' | 'artist' | 'episode';
    const spotifyId = spotifyMatch[2];
    const embedUrl = `https://open.spotify.com/embed/${spotifyType}/${spotifyId}?utm_source=generator&theme=0`;

    const labelMap: Record<string, string> = {
      track: 'Spotify Single / Track',
      playlist: 'Spotify Playlist',
      album: 'Spotify Album',
      artist: 'Spotify Artist',
      episode: 'Spotify Podcast Episode',
    };

    return {
      provider: 'spotify',
      originalUrl: url,
      spotifyType,
      spotifyId,
      embedUrl,
      defaultTitle: labelMap[spotifyType] || 'Spotify Audio',
      defaultArtist: 'Spotify',
      isBackgroundAudioEngine: false,
    };
  }

  // 3. Apple Music
  const appleMusicMatch = url.match(/music\.apple\.com\/(.+)/i);
  if (appleMusicMatch) {
    const path = appleMusicMatch[1];
    const embedUrl = `https://embed.music.apple.com/${path}`;
    return {
      provider: 'applemusic',
      originalUrl: url,
      embedUrl,
      defaultTitle: 'Apple Music',
      defaultArtist: 'Apple Music Stream',
      isBackgroundAudioEngine: false,
    };
  }

  // 4. SoundCloud
  const soundcloudMatch = url.match(/soundcloud\.com\/([\w-]+\/[\w-]+)/i);
  if (soundcloudMatch) {
    const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      url
    )}&color=%23d48b54&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
    return {
      provider: 'soundcloud',
      originalUrl: url,
      embedUrl,
      defaultTitle: 'SoundCloud Track',
      defaultArtist: 'SoundCloud',
      isBackgroundAudioEngine: false,
    };
  }

  // 5. Direct Audio File or Web Stream
  return {
    provider: 'audio',
    originalUrl: url,
    defaultTitle: url.split('/').pop()?.split('?')[0] || 'Direct Audio Stream',
    defaultArtist: 'Custom Audio Stream',
    isBackgroundAudioEngine: false,
  };
}
