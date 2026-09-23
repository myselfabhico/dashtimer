'use client';

import React from 'react';
import { X, Sliders, Volume2, Clock, Palette, Image as ImageIcon, BellRing, Sparkles, Shuffle, Repeat, Zap } from 'lucide-react';
import { AppSettings, THEMES, ThemeOption, WALLPAPERS } from '@/lib/themeData';
import { audioEngine } from '@/lib/audioEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  currentTheme: ThemeOption;
  onSelectTheme: (themeId: 'woody' | 'sky' | 'sand' | 'midnight') => void;
  currentWallpaperIndex?: number;
  onSelectWallpaper?: (idx: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  currentTheme,
  onSelectTheme,
  currentWallpaperIndex = 0,
  onSelectWallpaper,
}) => {
  if (!isOpen) return null;

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (audioEngine) audioEngine.playClick();
    const updated = { ...settings, [key]: value };
    onSaveSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-xl max-h-[90vh] rounded-3xl glass-panel p-6 shadow-2xl flex flex-col overflow-hidden"
        style={{
          borderColor: currentTheme.glassBorder,
          backgroundColor: 'rgba(20, 22, 28, 0.92)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${currentTheme.accent}30`, color: currentTheme.accent }}
            >
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Preferences & Settings</h2>
              <p className="text-xs text-white/50">Personalize Dashtimer to your ideal focus ritual</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (audioEngine) audioEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Section: Themes */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60 mb-3">
              <Palette className="w-3.5 h-3.5" />
              <span>Aesthetic Theme</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.values(THEMES).map((t) => {
                const isSelected = settings.themeId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (audioEngine) audioEngine.playClick();
                      onSelectTheme(t.id);
                      updateSetting('themeId', t.id);
                    }}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-white/40 shadow-lg'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: t.glassBg,
                            borderColor: t.accent,
                          }
                        : {}
                    }
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="text-xs font-semibold text-white">{t.name}</span>
                      <span
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: t.accent }}
                      />
                    </div>
                    <span className="text-[11px] text-white/50 line-clamp-1">{t.tagline}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Pomodoro Durations */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60 mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>Pomodoro Intervals (Minutes)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* Focus */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <label className="text-[11px] text-white/60 block mb-1">Focus</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={settings.focusDuration}
                  onChange={(e) => updateSetting('focusDuration', Math.max(1, parseInt(e.target.value) || 25))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-sm font-mono text-white text-center"
                />
              </div>

              {/* Short Break */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <label className="text-[11px] text-white/60 block mb-1">Short Break</label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={settings.shortBreakDuration}
                  onChange={(e) => updateSetting('shortBreakDuration', Math.max(1, parseInt(e.target.value) || 5))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-sm font-mono text-white text-center"
                />
              </div>

              {/* Long Break */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <label className="text-[11px] text-white/60 block mb-1">Long Break</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.longBreakDuration}
                  onChange={(e) => updateSetting('longBreakDuration', Math.max(1, parseInt(e.target.value) || 15))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-sm font-mono text-white text-center"
                />
              </div>
            </div>

            {/* Cycles before Long Break */}
            <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/80">Cycles before Long Break</span>
              <div className="flex items-center gap-1.5">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => updateSetting('cyclesBeforeLongBreak', num)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      settings.cyclesBeforeLongBreak === num
                        ? 'bg-white text-black font-semibold'
                        : 'text-white/60 hover:text-white bg-white/10'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Automation */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60 mb-3">
              <BellRing className="w-3.5 h-3.5" />
              <span>Automation & Transitions</span>
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Auto-start Breaks</div>
                  <div className="text-[11px] text-white/50">Automatically begin short/long breaks when focus ends</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoStartBreaks}
                  onChange={(e) => updateSetting('autoStartBreaks', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 accent-[#d48b54] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Auto-start Focus Sessions</div>
                  <div className="text-[11px] text-white/50">Automatically begin work session when break ends</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoStartFocus}
                  onChange={(e) => updateSetting('autoStartFocus', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 accent-[#d48b54] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section: Sound & Haptics */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60 mb-3">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Tactile Audio (Web Audio API)</span>
            </div>
            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Tactile Click & Chime Feedback</div>
                  <div className="text-[11px] text-white/50">Synthesizes woodblock clicks & singing bowl bell on complete</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sfxEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    if (audioEngine) audioEngine.setSfxEnabled(enabled);
                    updateSetting('sfxEnabled', enabled);
                  }}
                  className="w-4 h-4 rounded border-white/20 accent-[#d48b54] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Mechanical Clock Tick Sound</div>
                  <div className="text-[11px] text-white/50">Soft acoustic seconds pulse while timer is active</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.tickEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    if (audioEngine) audioEngine.setTickEnabled(enabled);
                    updateSetting('tickEnabled', enabled);
                  }}
                  className="w-4 h-4 rounded border-white/20 accent-[#d48b54] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section: 10 Wallpaper Backgrounds & Carousel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Background Wallpapers & Cycle (10 Themes)</span>
              </div>
              <span className="text-[11px] text-white/50">4K Upscaled · 16:9</span>
            </div>

            <div className="space-y-3.5">
              {/* Wallpaper Gallery Grid (10 wallpapers) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1 p-2 rounded-2xl bg-black/40 border border-white/10">
                {WALLPAPERS.map((wp, idx) => {
                  const isCurrent = currentWallpaperIndex === idx;
                  return (
                    <button
                      key={wp.id}
                      onClick={() => {
                        if (audioEngine) audioEngine.playClick();
                        if (onSelectWallpaper) onSelectWallpaper(idx);
                      }}
                      className={`group relative rounded-xl overflow-hidden aspect-video border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-white ring-2 ring-white/60 scale-[1.02] shadow-lg'
                          : 'border-white/10 hover:border-white/40 opacity-75 hover:opacity-100'
                      }`}
                      style={{
                        backgroundImage: `url(${wp.path}), ${wp.fallbackGradient}`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                      title={`${wp.title} - ${wp.subtitle}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-1.5 flex flex-col justify-end">
                        <span className="text-[10px] font-semibold text-white leading-tight line-clamp-1">
                          {wp.title}
                        </span>
                        <span className="text-[8px] text-white/60 leading-none truncate">
                          {wp.moodSounds.join(', ')}
                        </span>
                      </div>
                      {isCurrent && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Cycle Duration & Interval */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-white block">Cycle Duration</span>
                    <span className="text-[11px] text-white/50">Time before transitioning to next background</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {[
                      { label: 'Off', secs: 0 },
                      { label: '30s', secs: 30 },
                      { label: '1m', secs: 60 },
                      { label: '2m', secs: 120 },
                      { label: '5m', secs: 300 },
                      { label: '10m', secs: 600 },
                      { label: '15m', secs: 900 },
                    ].map((opt) => (
                      <button
                        key={opt.secs}
                        onClick={() => {
                          updateSetting('wallpaperCycleSeconds', opt.secs);
                          updateSetting('wallpaperCycleIntervalMinutes', Math.round(opt.secs / 60) || 0);
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all ${
                          settings.wallpaperCycleSeconds === opt.secs
                            ? 'bg-white text-black font-semibold shadow-sm'
                            : 'bg-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Queue Transition Strategy */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-xs font-medium text-white block">Queue Strategy</span>
                    <span className="text-[11px] text-white/50">How wallpapers are ordered in the cycle</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'mood', label: 'Match Mood', icon: Sparkles, hint: 'Selects wallpaper matching active sound' },
                      { id: 'shuffle', label: 'Random', icon: Shuffle, hint: 'Shuffles randomly through all 10' },
                      { id: 'sequential', label: 'In Order', icon: Repeat, hint: 'Cycles 1 through 10 in sequence' },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = settings.wallpaperQueueMode === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => updateSetting('wallpaperQueueMode', m.id as 'mood' | 'shuffle' | 'sequential')}
                          title={m.hint}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-white text-black font-semibold'
                              : 'bg-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upscaling & Visual Quality Tuning */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-xs font-medium text-white block">Quality & Upscale Preset</span>
                    <span className="text-[11px] text-white/50">Display tuning and image sharpness</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'crisp', label: 'Ultra Crisp', hint: 'Max sharpness & original 4K clarity' },
                      { id: 'vibrant', label: 'Vibrant', hint: 'Enhanced saturation & contrast' },
                      { id: 'cinema', label: 'Cinema', hint: 'Soft warm film aesthetic' },
                      { id: 'monochrome', label: 'B&W Zen', hint: 'Pure monochrome focus' },
                    ].map((q) => {
                      const isSelected = settings.wallpaperQuality === q.id;
                      return (
                        <button
                          key={q.id}
                          onClick={() => updateSetting('wallpaperQuality', q.id as 'crisp' | 'vibrant' | 'cinema' | 'monochrome')}
                          title={q.hint}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-white text-black font-semibold'
                              : 'bg-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {q.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Motion Style */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-xs font-medium text-white block">Motion / Zoom</span>
                    <span className="text-[11px] text-white/50">Wallpaper scaling style</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'static', label: 'Fit Cover (Static)' },
                      { id: 'kenburns', label: 'Ken Burns (Parallax)' },
                    ].map((mot) => {
                      const isSelected = settings.wallpaperMotion === mot.id;
                      return (
                        <button
                          key={mot.id}
                          onClick={() => updateSetting('wallpaperMotion', mot.id as 'static' | 'kenburns')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-white text-black font-semibold'
                              : 'bg-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {mot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scrim Darkness Slider */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-xs font-medium text-white block">Atmosphere Contrast / Dim</span>
                    <span className="text-[11px] text-white/50">Dim background for text readability</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.75"
                    step="0.05"
                    value={settings.scrimDimLevel}
                    onChange={(e) => updateSetting('scrimDimLevel', parseFloat(e.target.value))}
                    className="w-32 h-1.5 rounded-full appearance-none bg-white/20 accent-white cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={() => {
              if (audioEngine) audioEngine.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
            style={{
              backgroundColor: currentTheme.accent,
              color: '#1a1412',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
