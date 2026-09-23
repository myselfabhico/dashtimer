import { NextRequest, NextResponse } from 'next/server';

// Server-side helper to find matching YouTube audio for full-length playback
async function searchYouTubeVideo(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' audio')}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();
    // Match valid 11-char video IDs, avoid shorts if possible
    const matches = Array.from(html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g));
    if (matches.length > 0) {
      // Pick the first match
      return matches[0][1];
    }
    return null;
  } catch (err) {
    console.warn('YouTube search fallback error:', err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const cleanUrl = url.trim();

  try {
    // 1. Spotify Tracks / Albums / Playlists
    if (cleanUrl.includes('spotify.com') || cleanUrl.startsWith('spotify:')) {
      let title = 'Spotify Track';
      let artist = '';
      let thumbnail: string | null = null;

      // Fetch HTML for accurate song & artist metadata
      try {
        const pageRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (pageRes.ok) {
          const pageHtml = await pageRes.text();
          const titleMatch = pageHtml.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
          const artistMatch =
            pageHtml.match(/<meta\s+name="music:musician_description"\s+content="([^"]+)"/i) ||
            pageHtml.match(/<meta\s+property="og:description"\s+content="([^·"]+)·/i);
          const imgMatch = pageHtml.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);

          if (titleMatch) title = titleMatch[1];
          if (artistMatch) artist = artistMatch[1].trim();
          if (imgMatch) thumbnail = imgMatch[1];
        }
      } catch (e) {
        console.warn('Spotify direct page scrape error:', e);
      }

      // Fallback to official Spotify oEmbed if needed
      if (!artist || title === 'Spotify Track') {
        try {
          const oembedEndpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
          const res = await fetch(oembedEndpoint, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Dashtimer/1.0)',
              Accept: 'application/json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.title && title === 'Spotify Track') title = data.title;
            if (data.author_name && !artist) artist = data.author_name;
            if (data.thumbnail_url && !thumbnail) thumbnail = data.thumbnail_url;
          }
        } catch {
          // fallback
        }
      }

      const searchQuery = artist ? `${artist} ${title}` : title;
      const matchedVideoId = await searchYouTubeVideo(searchQuery);

      return NextResponse.json({
        provider: 'spotify',
        title,
        artist: artist || 'Spotify',
        thumbnail,
        matchedVideoId,
      });
    }

    // 2. Apple Music metadata
    if (cleanUrl.includes('music.apple.com')) {
      try {
        const res = await fetch(cleanUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if (res.ok) {
          const html = await res.text();
          const titleMatch =
            html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
            html.match(/<title>([^<]+)<\/title>/i);
          const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);

          let rawTitle = titleMatch ? titleMatch[1] : 'Apple Music Track';
          rawTitle = rawTitle.replace(' on Apple Music', '').replace(' - Apple Music', '');
          const parts = rawTitle.split(' - Song by ');
          const title = parts[0] || rawTitle;
          const artist = parts[1] || 'Apple Music';

          const matchedVideoId = await searchYouTubeVideo(`${artist} ${title}`);

          return NextResponse.json({
            provider: 'applemusic',
            title,
            artist,
            thumbnail: imageMatch ? imageMatch[1] : null,
            matchedVideoId,
          });
        }
      } catch (err) {
        console.warn('Apple Music metadata fetch error:', err);
      }
    }

    // 3. SoundCloud oEmbed
    if (cleanUrl.includes('soundcloud.com')) {
      const oembedEndpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(cleanUrl)}`;
      const res = await fetch(oembedEndpoint, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        const title = data.title || 'SoundCloud Track';
        const artist = data.author_name || 'SoundCloud';

        const matchedVideoId = await searchYouTubeVideo(`${artist} ${title}`);

        return NextResponse.json({
          provider: 'soundcloud',
          title,
          artist,
          thumbnail: data.thumbnail_url || null,
          matchedVideoId,
        });
      }
    }

    // Fallback generic
    return NextResponse.json({
      provider: 'generic',
      title: 'Custom Stream',
      artist: 'Audio Stream',
      matchedVideoId: null,
    });
  } catch (error) {
    console.warn('Stream meta lookup error:', error);
    return NextResponse.json({
      provider: 'generic',
      title: 'Custom Audio',
      artist: 'Web Stream',
      matchedVideoId: null,
    });
  }
}
