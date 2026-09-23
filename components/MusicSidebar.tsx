'use client';

import React, { useState } from 'react';
import {
  X,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Disc,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { ThemeOption } from '@/lib/themeData';

interface MusicSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeOption;
  currentTrack: string;
  isPlaying: boolean;
  activeTrackInfo: {
    title: string;
    artist: string;
    description: string;
  };
  onTogglePlay: () => void;
  onSelectTrack: (track: any) => void;
  ambientVolume: number;
  onVolumeChange: (vol: number) => void;
  onLoadCustomUrl: (url: string) => void;
  currentTime: number;
  duration: number;
  onSeek: (val: number) => void;
  hasScrubber: boolean;
  provider?: string;
  externalUrl?: string | null;
}

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

export const MusicSidebar: React.FC<MusicSidebarProps> = ({
  isOpen,
  onClose,
  theme,
  currentTrack,
  isPlaying,
  activeTrackInfo,
  onTogglePlay,
  onSelectTrack,
  ambientVolume,
  onVolumeChange,
  onLoadCustomUrl,
  currentTime,
  duration,
  onSeek,
  hasScrubber,
  externalUrl,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [prevVol, setPrevVol] = useState(ambientVolume);

  if (!isOpen) return null;

  const handleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVol > 0 ? prevVol : 0.5);
    } else {
      setPrevVol(ambientVolume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const handleSubmitUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;
    onLoadCustomUrl(inputUrl.trim());
    setInputUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Sidebar Panel */}
      <div
        className="w-full max-w-sm sm:max-w-md h-full glass-panel shadow-2xl flex flex-col overflow-hidden border-l animate-slideLeft"
        style={{
          borderColor: theme.glassBorder,
          backgroundColor: 'rgba(18, 20, 26, 0.96)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: `${theme.accent}25`, color: theme.accent }}
            >
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Music & Audio Sidebar</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Active Player Card */}
          <div
            className="p-4 rounded-2xl border bg-white/5 space-y-3.5"
            style={{ borderColor: theme.glassBorder }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-white/50 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Now Playing
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onTogglePlay}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-lg cursor-pointer transition-transform active:scale-90"
                style={{ backgroundColor: theme.accent, color: '#1a1412' }}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
              </button>

              <div className="flex-1 min-w-0 pr-1">
                <h3 className="text-sm font-semibold text-white truncate" title={activeTrackInfo.title}>
                  {activeTrackInfo.title}
                </h3>
                <p className="text-xs text-white/55 truncate" title={activeTrackInfo.artist}>
                  {activeTrackInfo.artist}
                </p>
              </div>

              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Open in native service"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Song Duration Slider */}
            {hasScrubber && (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration > 0 ? formatTime(duration) : 'LIVE'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration > 0 ? duration : 100}
                  step="0.5"
                  value={duration > 0 ? currentTime : 0}
                  disabled={duration <= 0}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/20 accent-amber-400 cursor-pointer disabled:opacity-40"
                  style={{ accentColor: theme.accent }}
                  title="Adjust song duration"
                />
              </div>
            )}

            {/* Volume Control */}
            <div className="pt-2 border-t border-white/10 flex items-center gap-2.5">
              <button
                onClick={handleMute}
                className="text-white/60 hover:text-white transition-colors cursor-pointer p-1"
              >
                {isMuted || ambientVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : ambientVolume}
                onChange={(e) => {
                  if (isMuted) setIsMuted(false);
                  onVolumeChange(parseFloat(e.target.value));
                }}
                className="w-full h-1.5 rounded-full appearance-none bg-white/20 accent-white cursor-pointer"
                title="Master Volume"
              />
              <span className="text-[11px] font-mono text-white/50 w-8 text-right">
                {Math.round((isMuted ? 0 : ambientVolume) * 100)}%
              </span>
            </div>
          </div>

          {/* Paste Music URL Form */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Paste Song or Playlist URL
              </span>
            </div>

            <form onSubmit={handleSubmitUrl} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Spotify, YouTube Music, Apple Music, YouTube..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-20 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/35 focus:outline-none focus:border-white/40"
                />
                <button
                  type="submit"
                  disabled={!inputUrl.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-30 transition-all shadow"
                  style={{ backgroundColor: theme.accent, color: '#1a1412' }}
                >
                  Stream
                </button>
              </div>
            </form>
          </div>

          {/* Procedural Soundscapes */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Procedural Soundscapes
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'lofi', label: 'Serene Lo-Fi' },
                { id: 'rain', label: 'Cedar Rain' },
                { id: 'forest', label: 'Forest Birds' },
                { id: 'whitenoise', label: 'White Noise' },
              ].map((s) => {
                const isActive = currentTrack === s.id && isPlaying;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectTrack(s.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-left flex items-center gap-2 cursor-pointer ${
                      isActive ? 'bg-white/15 font-semibold text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                    style={isActive ? { borderColor: theme.accent, color: theme.accentLight } : { borderColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <Disc className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'animate-spin' : 'opacity-60'}`} />
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
