'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Disc, Music, X, PanelRight } from 'lucide-react';
import { audioEngine } from '@/lib/audioEngine';
import { ThemeOption } from '@/lib/themeData';
import { parseStreamUrl, ParsedStream } from '@/lib/streamParser';
import { MusicSidebar } from './MusicSidebar';

interface AmbientPlayerBarProps {
  theme: ThemeOption;
  ambientVolume: number;
  onVolumeChange: (vol: number) => void;
  onTrackChange?: (track: string) => void;
}

type AmbientTrack = 'lofi' | 'rain' | 'forest' | 'coffee' | 'whitenoise' | 'custom' | 'none';

interface AmbientTrackItem {
  id: AmbientTrack;
  title: string;
  artist: string;
  description: string;
}

const TRACKS: AmbientTrackItem[] = [
  { id: 'lofi', title: 'Serene Lo-Fi', artist: 'Warm Keys', description: 'Smooth electric piano chords & mellow sub-bass with zero crackle' },
  { id: 'rain', title: 'Cedar Rain', artist: 'Rainfall', description: 'Gentle water drops and ambient precipitation' },
  { id: 'forest', title: 'Forest Birds', artist: 'Alpine Canopy', description: 'Canopy breeze with procedurally synthesized birdsong' },
  { id: 'whitenoise', title: 'White Noise', artist: 'Deep Focus', description: 'Calibrated acoustic masking for distraction-free concentration' },
];

/* Helper to format seconds into mm:ss or hh:mm:ss */
function formatTime(secs: number): string {
  if (isNaN(secs) || secs < 0) return '0:00';
  const total = Math.floor(secs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const AmbientPlayerBar: React.FC<AmbientPlayerBarProps> = ({
  theme,
  ambientVolume,
  onVolumeChange,
  onTrackChange,
}) => {
  const [currentTrack, setCurrentTrack] = useState<AmbientTrack>('none');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [previousVolume, setPreviousVolume] = useState<number>(ambientVolume);

  // Notify parent component of track change for wallpaper mood sync
  useEffect(() => {
    if (onTrackChange && currentTrack !== 'none') {
      onTrackChange(currentTrack);
    }
  }, [currentTrack, onTrackChange]);

  // Custom Stream States
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customTrackTitle, setCustomTrackTitle] = useState<string>('Custom Audio Stream');
  const [customTrackArtist, setCustomTrackArtist] = useState<string>('Web Stream');
  const [parsedStream, setParsedStream] = useState<ParsedStream | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState<boolean>(false);

  // Playback Progress & Duration Scrubber
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [seekValue, setSeekValue] = useState<number>(0);

  // References to hidden background players
  const ytPlayerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Unified Volume Control:
  // Controls procedural ambient tracks, tactile one-shot SFX (clicks, ticks, chimes),
  // and custom streams (YouTube, Spotify full audio & direct audio) in one unified control.
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : ambientVolume;

    // 1. Procedural ambient audio & one-shot SFX
    if (audioEngine) {
      audioEngine.setAmbientVolume(effectiveVol);
      audioEngine.setSfxVolume(effectiveVol);
    }

    // 2. Custom YouTube player volume
    if (ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.setVolume === 'function') {
          ytPlayerRef.current.setVolume(effectiveVol * 100);
          if (effectiveVol === 0) {
            ytPlayerRef.current.mute();
          } else {
            ytPlayerRef.current.unMute();
          }
        }
      } catch (err) {
        console.warn('YT setVolume error', err);
      }
    }

    // 3. Custom direct audio volume
    if (audioElementRef.current) {
      audioElementRef.current.volume = effectiveVol;
      audioElementRef.current.muted = isMuted || effectiveVol === 0;
    }
  }, [ambientVolume, isMuted]);

  // Periodic polling for custom background stream progress and duration
  useEffect(() => {
    if (currentTrack !== 'custom' || !isPlaying || isSeeking) return;

    const interval = setInterval(() => {
      if (ytPlayerRef.current) {
        try {
          if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setCurrentTime(cur);
            if (dur > 0) setDuration(dur);
          }
        } catch {
          // quiet
        }
      } else if (parsedStream?.provider === 'audio' && audioElementRef.current) {
        setCurrentTime(audioElementRef.current.currentTime || 0);
        if (audioElementRef.current.duration) {
          setDuration(audioElementRef.current.duration);
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [currentTrack, isPlaying, isSeeking, parsedStream]);

  // Handle switching between procedural tracks or custom stream
  const handleTrackSelect = (trackId: AmbientTrack) => {
    if (audioEngine) audioEngine.playClick();

    if (trackId === 'custom') {
      setShowCustomModal(true);
      return;
    }

    // Stop custom stream if active
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.pauseVideo(); } catch { /* ignore */ }
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    if (currentTrack === trackId && isPlaying) {
      if (audioEngine) audioEngine.stopAmbient();
      setIsPlaying(false);
      setCurrentTrack('none');
    } else {
      if (audioEngine) audioEngine.playAmbient(trackId as 'lofi' | 'rain' | 'forest' | 'coffee' | 'whitenoise');
      setCurrentTrack(trackId);
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    if (audioEngine) audioEngine.playClick();

    if (currentTrack === 'custom') {
      if (isPlaying) {
        if (ytPlayerRef.current) {
          try { ytPlayerRef.current.pauseVideo(); } catch { /* ignore */ }
        }
        if (audioElementRef.current) {
          audioElementRef.current.pause();
        }
        setIsPlaying(false);
      } else {
        if (ytPlayerRef.current) {
          try { ytPlayerRef.current.playVideo(); } catch { /* ignore */ }
        }
        if (audioElementRef.current) {
          audioElementRef.current.play().catch(() => {});
        }
        setIsPlaying(true);
      }
      return;
    }

    if (isPlaying) {
      if (audioEngine) audioEngine.stopAmbient();
      setIsPlaying(false);
    } else {
      const target = currentTrack === 'none' ? 'lofi' : currentTrack;
      if (audioEngine) audioEngine.playAmbient(target as 'lofi' | 'rain' | 'forest' | 'coffee');
      setCurrentTrack(target);
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    if (audioEngine) audioEngine.playClick();
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(previousVolume > 0 ? previousVolume : 0.5);
    } else {
      setPreviousVolume(ambientVolume);
      setIsMuted(true);
    }
  };

  // Seeker Slider controls
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSeekValue(val);
  };

  const handleSeekCommit = () => {
    setIsSeeking(false);
    setCurrentTime(seekValue);

    if (ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.seekTo === 'function') {
          ytPlayerRef.current.seekTo(seekValue, true);
        }
      } catch {
        // quiet
      }
    } else if (parsedStream?.provider === 'audio' && audioElementRef.current) {
      audioElementRef.current.currentTime = seekValue;
    }
  };

  // Direct seek from sidebar
  const handleDirectSeek = (val: number) => {
    setCurrentTime(val);
    if (ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.seekTo === 'function') {
          ytPlayerRef.current.seekTo(val, true);
        }
      } catch {
        // quiet
      }
    } else if (parsedStream?.provider === 'audio' && audioElementRef.current) {
      audioElementRef.current.currentTime = val;
    }
  };

  // Mount/play background YouTube Audio Engine
  const playInHiddenYouTubeEngine = (videoId?: string, playlistId?: string) => {
    const initYT = () => {
      const win = window as any;
      if (!win.YT || !win.YT.Player) {
        if (!document.getElementById('yt-iframe-api')) {
          const tag = document.createElement('script');
          tag.id = 'yt-iframe-api';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }
        win.onYouTubeIframeAPIReady = () => {
          mountYTPlayer();
        };
      } else {
        mountYTPlayer();
      }
    };

    const mountYTPlayer = () => {
      const win = window as any;
      const effectiveVol = isMuted ? 0 : ambientVolume;

      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        try {
          if (playlistId) {
            ytPlayerRef.current.loadPlaylist({
              list: playlistId,
              listType: 'playlist',
            });
          } else if (videoId) {
            ytPlayerRef.current.loadVideoById(videoId);
          }
          ytPlayerRef.current.playVideo();
          ytPlayerRef.current.setVolume(effectiveVol * 100);
          return;
        } catch {
          // fall through to recreate
        }
      }

      try {
        const config: any = {
          width: '300',
          height: '200',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            iv_load_policy: 3,
            loop: 0,
          },
          events: {
            onReady: (event: any) => {
              event.target.playVideo();
              event.target.setVolume(effectiveVol * 100);
              if (effectiveVol === 0) event.target.mute();
              else event.target.unMute();
              setIsPlaying(true);
              const d = event.target.getDuration();
              if (d) setDuration(d);
              const data = event.target.getVideoData();
              if (data?.title) setCustomTrackTitle(data.title);
              if (data?.author) setCustomTrackArtist(data.author);
            },
            onStateChange: (event: any) => {
              if (event.data === 1) {
                setIsPlaying(true);
                const d = event.target.getDuration();
                if (d) setDuration(d);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
                setCurrentTime(0);
              }
            },
            onError: (event: any) => {
              console.warn('YouTube audio engine error:', event.data);
            },
          },
        };

        if (playlistId) {
          config.playerVars.listType = 'playlist';
          config.playerVars.list = playlistId;
        } else if (videoId) {
          config.videoId = videoId;
        }

        ytPlayerRef.current = new win.YT.Player('dashtimer-yt-hidden-player', config);
      } catch (e) {
        console.warn('Failed to mount background YouTube player:', e);
      }
    };

    initYT();
  };

  // Load custom stream URL (Spotify, YouTube Music, Apple Music, YouTube, Direct Audio)
  const handleSetCustomStream = async (url: string) => {
    if (!url.trim()) return;
    const clean = url.trim();

    setIsLoadingStream(true);

    const parsed = parseStreamUrl(clean);
    if (!parsed) {
      setIsLoadingStream(false);
      return;
    }

    setParsedStream(parsed);

    // Stop procedural ambience
    if (audioEngine) audioEngine.stopAmbient();

    // 1. YouTube & YouTube Music (Plays full audio in hidden engine, no preview)
    if (parsed.provider === 'youtube' || parsed.provider === 'ytmusic') {
      if (audioElementRef.current) audioElementRef.current.pause();

      setCustomTrackTitle(parsed.defaultTitle);
      setCustomTrackArtist(parsed.defaultArtist);
      setCurrentTrack('custom');
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(0);
      setShowCustomModal(false);
      setIsLoadingStream(false);

      playInHiddenYouTubeEngine(parsed.videoId, parsed.playlistId);
      return;
    }

    // 2. Spotify (Plays 100% FULL SONG via background engine - ZERO preview audio!)
    if (parsed.provider === 'spotify') {
      if (audioElementRef.current) audioElementRef.current.pause();

      setCurrentTrack('custom');
      setIsPlaying(true);
      setCustomTrackTitle(parsed.defaultTitle);
      setCustomTrackArtist('Spotify');
      setShowCustomModal(false);

      try {
        const metaRes = await fetch(`/api/stream-meta?url=${encodeURIComponent(clean)}`);
        if (metaRes.ok) {
          const meta = await metaRes.json();
          if (meta.title) setCustomTrackTitle(meta.title);
          if (meta.artist) setCustomTrackArtist(meta.artist);

          // Stream the FULL song without preview cutoff
          if (meta.matchedVideoId) {
            playInHiddenYouTubeEngine(meta.matchedVideoId);
          }
        }
      } catch {
        // quiet
      }
      setIsLoadingStream(false);
      return;
    }

    // 3. Apple Music (Plays 100% FULL SONG via background engine - ZERO preview audio!)
    if (parsed.provider === 'applemusic') {
      if (audioElementRef.current) audioElementRef.current.pause();

      setCurrentTrack('custom');
      setIsPlaying(true);
      setCustomTrackTitle('Apple Music Track');
      setCustomTrackArtist('Apple Music');
      setShowCustomModal(false);

      try {
        const metaRes = await fetch(`/api/stream-meta?url=${encodeURIComponent(clean)}`);
        if (metaRes.ok) {
          const meta = await metaRes.json();
          if (meta.title) setCustomTrackTitle(meta.title);
          if (meta.artist) setCustomTrackArtist(meta.artist);

          if (meta.matchedVideoId) {
            playInHiddenYouTubeEngine(meta.matchedVideoId);
          }
        }
      } catch {
        // quiet
      }
      setIsLoadingStream(false);
      return;
    }

    // 4. SoundCloud (Plays 100% FULL SONG via background engine - ZERO preview audio!)
    if (parsed.provider === 'soundcloud') {
      if (audioElementRef.current) audioElementRef.current.pause();

      setCurrentTrack('custom');
      setIsPlaying(true);
      setCustomTrackTitle('SoundCloud Track');
      setCustomTrackArtist('SoundCloud');
      setShowCustomModal(false);

      try {
        const metaRes = await fetch(`/api/stream-meta?url=${encodeURIComponent(clean)}`);
        if (metaRes.ok) {
          const meta = await metaRes.json();
          if (meta.title) setCustomTrackTitle(meta.title);
          if (meta.artist) setCustomTrackArtist(meta.artist);

          if (meta.matchedVideoId) {
            playInHiddenYouTubeEngine(meta.matchedVideoId);
          }
        }
      } catch {
        // quiet
      }
      setIsLoadingStream(false);
      return;
    }

    // 5. Direct Audio File / HTTP Stream fallback
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.pauseVideo(); } catch { /* ignore */ }
    }

    setCustomTrackTitle(parsed.defaultTitle);
    setCustomTrackArtist(parsed.defaultArtist);
    setCurrentTrack('custom');
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    setShowCustomModal(false);
    setIsLoadingStream(false);

    if (audioElementRef.current) {
      audioElementRef.current.src = clean;
      audioElementRef.current.volume = isMuted ? 0 : ambientVolume;
      audioElementRef.current.play().catch((err) => {
        console.warn('Audio play error:', err);
      });
    }
  };

  const activeTrackInfo = currentTrack === 'custom'
    ? {
        id: 'custom' as AmbientTrack,
        title: customTrackTitle,
        artist: customTrackArtist,
        description: 'Custom music stream with duration & master volume controls'
      }
    : TRACKS.find(t => t.id === currentTrack) || {
        id: 'none' as AmbientTrack,
        title: 'Ambient Soundscapes',
        artist: 'Web Audio Synth Engine',
        description: 'Select an organic backdrop track to cultivate deep focus'
      };

  // Has scrubber whenever custom stream has duration or is active
  const hasScrubber = currentTrack === 'custom' && (duration > 0 || currentTime > 0 || parsedStream !== null);

  return (
    <>
      {/* Background Audio Engine: In-viewport with valid dimensions to prevent 2-second anti-offscreen throttling */}
      <div
        id="dashtimer-yt-hidden-wrapper"
        aria-hidden="true"
        className="fixed bottom-0 right-0 w-[300px] h-[200px] pointer-events-none -z-50 overflow-hidden"
        style={{
          opacity: 0.001,
          visibility: 'visible',
          pointerEvents: 'none',
        }}
      >
        <div id="dashtimer-yt-hidden-player" className="w-full h-full" />
      </div>

      <audio
        ref={audioElementRef}
        aria-hidden="true"
        className="hidden"
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration || 0);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      {/* Music & Soundscapes Sidebar */}
      <MusicSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        theme={theme}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        activeTrackInfo={activeTrackInfo}
        onTogglePlay={handleTogglePlay}
        onSelectTrack={handleTrackSelect}
        ambientVolume={ambientVolume}
        onVolumeChange={onVolumeChange}
        onLoadCustomUrl={handleSetCustomStream}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleDirectSeek}
        hasScrubber={hasScrubber}
        provider={parsedStream?.provider}
        externalUrl={parsedStream?.originalUrl}
      />

      {/* Floating Bottom Glass Player */}
      <footer className="w-full max-w-5xl mx-auto px-3 sm:px-4 pb-4 select-none">
        <div
          className="relative px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl glass-panel flex flex-col items-center justify-between gap-2.5 sm:gap-3 transition-all duration-300 overflow-hidden"
          style={{
            borderColor: theme.glassBorder,
            boxShadow: `0 20px 45px -10px rgba(0,0,0,0.5), 0 0 0 1px ${theme.glassBorder} inset`,
          }}
        >
          {/* Main Controls Row */}
          <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
            {/* Left: Track Info & Playback Status */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-[130px] sm:max-w-[170px] md:max-w-[210px] lg:max-w-[240px] shrink">
              <button
                onClick={handleTogglePlay}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 shadow-md cursor-pointer"
                style={{
                  backgroundColor: theme.accent,
                  color: '#1a1412',
                }}
                title={isPlaying ? 'Pause audio' : 'Play audio'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
              </button>

              <div className="flex flex-col min-w-0 pr-1 overflow-hidden">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="text-xs font-semibold tracking-wide text-white truncate"
                    title={activeTrackInfo.title}
                  >
                    {activeTrackInfo.title}
                  </span>
                  {isPlaying && (
                    <div className="flex items-end gap-0.5 h-3 shrink-0" aria-label="Audio active">
                      <span className="w-0.5 bg-white/70 rounded-full animate-bar-1" />
                      <span className="w-0.5 bg-white/70 rounded-full animate-bar-2" />
                      <span className="w-0.5 bg-white/70 rounded-full animate-bar-3" />
                      <span className="w-0.5 bg-white/70 rounded-full animate-bar-4" />
                    </div>
                  )}
                </div>
                <span
                  className="text-[10px] text-white/55 truncate"
                  title={activeTrackInfo.artist}
                >
                  {activeTrackInfo.artist}
                </span>
              </div>
            </div>

            {/* Center: Track Selector Chips (Non-scrollable, perfectly fitted right in front of us) */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-nowrap shrink-0 overflow-visible">
              {TRACKS.map(t => {
                const isActive = currentTrack === t.id && isPlaying;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTrackSelect(t.id)}
                    className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                      isActive
                        ? 'shadow-sm font-semibold'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: theme.chipActiveBg,
                            border: `1px solid ${theme.chipActiveBorder}`,
                            color: theme.accentLight,
                          }
                        : {
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }
                    }
                  >
                    <Disc className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isActive ? 'animate-spin' : 'opacity-60'}`} style={{ animationDuration: '6s' }} />
                    <span>
                      {t.id === 'lofi' ? 'Lofi' : t.id === 'rain' ? 'Rain' : t.id === 'forest' ? (
                        <>
                          <span className="inline md:hidden">Forest</span>
                          <span className="hidden md:inline">Forest Birds</span>
                        </>
                      ) : (
                        <>
                          <span className="inline md:hidden">Noise</span>
                          <span className="hidden md:inline">White Noise</span>
                        </>
                      )}
                    </span>
                  </button>
                );
              })}

              {/* Custom Music Button */}
              <button
                onClick={() => handleTrackSelect('custom')}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  currentTrack === 'custom'
                    ? 'shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                style={
                  currentTrack === 'custom'
                    ? {
                        backgroundColor: theme.chipActiveBg,
                        border: `1px solid ${theme.chipActiveBorder}`,
                        color: theme.accentLight,
                      }
                    : {
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }
                }
                title="Paste Spotify, YouTube Music, Apple Music or Audio link"
              >
                <Music className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 opacity-60" />
                <span>
                  <span className="inline md:hidden">Custom</span>
                  <span className="hidden md:inline">Custom Music</span>
                </span>
              </button>
            </div>

            {/* Right: Master Volume Slider & Sidebar Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
              <button
                onClick={handleMuteToggle}
                className="text-white/60 hover:text-white transition-colors cursor-pointer p-1 rounded-md shrink-0"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || ambientVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-white/50" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : ambientVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (isMuted) setIsMuted(false);
                  onVolumeChange(val);
                }}
                className="w-14 sm:w-20 md:w-24 h-1.5 rounded-full appearance-none bg-white/20 accent-white cursor-pointer shrink-0"
                title="Master Volume"
              />

              {/* Sidebar Toggle Button */}
              <button
                onClick={() => {
                  if (audioEngine) audioEngine.playClick();
                  setShowSidebar(true);
                }}
                className="p-1.5 rounded-lg glass-button text-white/70 hover:text-white cursor-pointer shrink-0 ml-0.5"
                title="Open Music & Audio Sidebar"
              >
                <PanelRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Time Duration Scrubber Slider: Revealed when Custom Stream (Spotify, Apple Music, YouTube Music, YouTube, Audio) is active */}
          {hasScrubber && (
            <div className="w-full flex items-center gap-3 pt-2 border-t border-white/10 select-none animate-fadeIn">
              <span className="font-mono text-[11px] text-white/70 shrink-0 w-11 text-right tabular-nums">
                {formatTime(isSeeking ? seekValue : currentTime)}
              </span>

              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration > 0 ? duration : 100}
                  step="0.5"
                  value={isSeeking ? seekValue : (duration > 0 ? currentTime : 0)}
                  disabled={duration <= 0}
                  onChange={handleSeekChange}
                  onMouseDown={() => {
                    setIsSeeking(true);
                    setSeekValue(currentTime);
                  }}
                  onMouseUp={handleSeekCommit}
                  onTouchStart={() => {
                    setIsSeeking(true);
                    setSeekValue(currentTime);
                  }}
                  onTouchEnd={handleSeekCommit}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/20 accent-amber-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/30 transition-all"
                  style={{
                    accentColor: theme.accent,
                  }}
                  title={duration > 0 ? 'Drag slider to adjust song playing duration' : 'Live stream position'}
                />
              </div>

              <span className="font-mono text-[11px] text-white/70 shrink-0 min-w-11 tabular-nums">
                {duration > 0 ? (
                  formatTime(duration)
                ) : (
                  <span className="text-red-400 font-semibold tracking-wider flex items-center gap-1 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </footer>

      {/* Modal for Custom Stream Input */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div
            className="w-full max-w-lg rounded-2xl glass-panel p-6 shadow-2xl relative"
            style={{
              borderColor: theme.glassBorder,
              backgroundColor: 'rgba(22, 24, 30, 0.95)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5" style={{ color: theme.accent }} />
                <h3 className="text-base font-semibold text-white">Custom Music Stream</h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-white/65 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/70 mt-3 mb-4 leading-relaxed">
              Paste a link to any music from Spotify, YouTube Music, Apple Music, YouTube, or direct audio streams. Songs play in 100% full version with interactive duration scrubbing and master volume control.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="https://open.spotify.com/track/... or music.youtube.com/... or Apple Music link"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSetCustomStream(customUrl);
                }}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/15 text-sm text-white placeholder-white/35 focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white/70 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSetCustomStream(customUrl)}
                disabled={!customUrl.trim() || isLoadingStream}
                className="px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-40"
                style={{
                  backgroundColor: theme.accent,
                  color: '#1a1412',
                }}
              >
                {isLoadingStream ? 'Loading...' : 'Start Full Audio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
