'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings as SettingsIcon,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  HelpCircle,
  Clock,
  Timer as TimerIcon,
  Watch,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shuffle,
  Repeat,
} from 'lucide-react';
import { TimerRing } from './TimerRing';
import { AmbientPlayerBar } from './AmbientPlayerBar';
import { StopwatchView } from './StopwatchView';
import { CustomTimerView } from './CustomTimerView';
import { SettingsModal } from './SettingsModal';
import {
  THEMES,
  WALLPAPERS,
  DEFAULT_SETTINGS,
  AppSettings,
  ThemeOption,
  WallpaperItem,
} from '@/lib/themeData';
import { audioEngine } from '@/lib/audioEngine';

type TimerMode = 'pomodoro' | 'stopwatch' | 'custom';
type SessionType = 'focus' | 'shortBreak' | 'longBreak';

export default function DashtimerApp() {
  // Settings & Theme
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('dashtimer_settings');
        if (savedSettings) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [currentThemeId, setCurrentThemeId] = useState<'woody' | 'sky' | 'sand' | 'midnight'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('dashtimer_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.themeId && THEMES[parsed.themeId]) {
            return parsed.themeId;
          }
        }
      } catch {
        // fallback
      }
    }
    return 'woody';
  });

  const theme: ThemeOption = THEMES[currentThemeId] || THEMES.woody;

  // Active Mode
  const [mode, setMode] = useState<TimerMode>('pomodoro');

  // Wallpaper Carousel
  const [wallpaperIndex, setWallpaperIndex] = useState<number>(0);
  const [nextWallpaperIndex, setNextWallpaperIndex] = useState<number>(0);
  const [isCrossFading, setIsCrossFading] = useState<boolean>(false);
  const [showWallpaperDrawer, setShowWallpaperDrawer] = useState<boolean>(false);

  // Pomodoro Timer State
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('dashtimer_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.focusDuration) return parsed.focusDuration * 60;
        }
      } catch {
        // fallback
      }
    }
    return 25 * 60;
  });
  const [totalSeconds, setTotalSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('dashtimer_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.focusDuration) return parsed.focusDuration * 60;
        }
      } catch {
        // fallback
      }
    }
    return 25 * 60;
  });
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Task & Stats
  const [completedSessionsToday, setCompletedSessionsToday] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedStats = localStorage.getItem('dashtimer_daily_stats');
        if (savedStats) {
          const parsedStats = JSON.parse(savedStats);
          if (parsedStats.date === new Date().toDateString()) {
            return parsedStats.completed || 0;
          }
        }
      } catch {
        // fallback
      }
    }
    return 0;
  });
  const [totalFocusMinutesToday, setTotalFocusMinutesToday] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedStats = localStorage.getItem('dashtimer_daily_stats');
        if (savedStats) {
          const parsedStats = JSON.parse(savedStats);
          if (parsedStats.date === new Date().toDateString()) {
            return parsedStats.minutes || 0;
          }
        }
      } catch {
        // fallback
      }
    }
    return 0;
  });

  // UI Modes
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [showWallpaperTray, setShowWallpaperTray] = useState<boolean>(false);

  // Active Sound Mood & Stream
  const [activeSoundMood, setActiveSoundMood] = useState<string>('none');

  // Tilt Card Ref
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<{ transform: string }>({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });

  // Volume State for Player Bar
  const [ambientVolume, setAmbientVolume] = useState<number>(0.5);

  // Dynamic Page Title
  useEffect(() => {
    if (mode === 'pomodoro') {
      const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
      const s = (remainingSeconds % 60).toString().padStart(2, '0');
      const typeLabel = sessionType === 'focus' ? 'Focus' : sessionType === 'shortBreak' ? 'Short Break' : 'Long Break';
      document.title = `${m}:${s} - ${typeLabel} | Dashtimer`;
    } else if (mode === 'stopwatch') {
      document.title = `Stopwatch | Dashtimer`;
    } else {
      document.title = `Custom Timer | Dashtimer`;
    }
  }, [remainingSeconds, mode, sessionType]);

  // Wallpaper Auto-Cycle and Transitions
  const changeWallpaper = useCallback((targetIndex: number) => {
    if (targetIndex === wallpaperIndex || isCrossFading) return;
    if (audioEngine) audioEngine.playClick();
    setNextWallpaperIndex(targetIndex);
    setIsCrossFading(true);

    setTimeout(() => {
      setWallpaperIndex(targetIndex);
      setIsCrossFading(false);
    }, 2000); // 2 second cross-fade
  }, [wallpaperIndex, isCrossFading]);

  // Calculate next wallpaper index based on queue strategy
  const getNextWallpaperIndex = useCallback((currentIndex: number): number => {
    const total = WALLPAPERS.length;
    if (settings.wallpaperQueueMode === 'shuffle') {
      let rand = Math.floor(Math.random() * total);
      if (rand === currentIndex) rand = (rand + 1) % total;
      return rand;
    }

    if (settings.wallpaperQueueMode === 'mood' && activeSoundMood !== 'none') {
      const matchingIndices: number[] = [];
      WALLPAPERS.forEach((wp, idx) => {
        if (wp.moodSounds.includes(activeSoundMood) || wp.moodSounds.includes('ambient')) {
          matchingIndices.push(idx);
        }
      });

      if (matchingIndices.length > 0) {
        const curPos = matchingIndices.indexOf(currentIndex);
        if (curPos >= 0 && matchingIndices.length > 1) {
          return matchingIndices[(curPos + 1) % matchingIndices.length];
        }
        const others = matchingIndices.filter((i) => i !== currentIndex);
        if (others.length > 0) {
          return others[Math.floor(Math.random() * others.length)];
        }
        return matchingIndices[0];
      }
    }

    // Default: sequential
    return (currentIndex + 1) % total;
  }, [settings.wallpaperQueueMode, activeSoundMood]);

  const advanceWallpaper = useCallback(() => {
    const nextIdx = getNextWallpaperIndex(wallpaperIndex);
    changeWallpaper(nextIdx);
  }, [getNextWallpaperIndex, wallpaperIndex, changeWallpaper]);

  const prevWallpaper = useCallback(() => {
    const total = WALLPAPERS.length;
    const prevIdx = (wallpaperIndex - 1 + total) % total;
    changeWallpaper(prevIdx);
  }, [wallpaperIndex, changeWallpaper]);

  // Track change handler for mood sync
  const handleTrackChange = useCallback((track: string) => {
    setActiveSoundMood(track);
    if (settings.wallpaperQueueMode === 'mood') {
      const matchIdx = WALLPAPERS.findIndex((wp) => wp.moodSounds.includes(track));
      if (matchIdx !== -1 && matchIdx !== wallpaperIndex) {
        changeWallpaper(matchIdx);
      }
    }
  }, [settings.wallpaperQueueMode, wallpaperIndex, changeWallpaper]);

  // Cycle interval timer (seconds-accurate)
  useEffect(() => {
    const cycleSecs = settings.wallpaperCycleSeconds !== undefined
      ? settings.wallpaperCycleSeconds
      : settings.wallpaperCycleIntervalMinutes * 60;
    if (cycleSecs <= 0) return;

    const intervalMs = cycleSecs * 1000;
    const timer = setInterval(() => {
      advanceWallpaper();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [settings.wallpaperCycleSeconds, settings.wallpaperCycleIntervalMinutes, advanceWallpaper]);

  // Pomodoro Timer Completion Handler
  const handleSessionComplete = useCallback(() => {
    if (audioEngine) audioEngine.playChime();

    if (sessionType === 'focus') {
      const newCompleted = completedSessionsToday + 1;
      const newMinutes = totalFocusMinutesToday + settings.focusDuration;
      setCompletedSessionsToday(newCompleted);
      setTotalFocusMinutesToday(newMinutes);

      try {
        localStorage.setItem(
          'dashtimer_daily_stats',
          JSON.stringify({
            date: new Date().toDateString(),
            completed: newCompleted,
            minutes: newMinutes,
          })
        );
      } catch {
        // ignore
      }

      // Check if long break or short break
      if (cycleCount >= settings.cyclesBeforeLongBreak) {
        setSessionType('longBreak');
        setCycleCount(1);
        const dur = settings.longBreakDuration * 60;
        setTotalSeconds(dur);
        setRemainingSeconds(dur);
        setIsRunning(settings.autoStartBreaks);
      } else {
        setSessionType('shortBreak');
        setCycleCount(prev => prev + 1);
        const dur = settings.shortBreakDuration * 60;
        setTotalSeconds(dur);
        setRemainingSeconds(dur);
        setIsRunning(settings.autoStartBreaks);
      }
    } else {
      // Break completed -> go back to focus
      setSessionType('focus');
      const dur = settings.focusDuration * 60;
      setTotalSeconds(dur);
      setRemainingSeconds(dur);
      setIsRunning(settings.autoStartFocus);
    }
  }, [
    sessionType,
    cycleCount,
    settings.cyclesBeforeLongBreak,
    settings.shortBreakDuration,
    settings.longBreakDuration,
    settings.focusDuration,
    settings.autoStartBreaks,
    settings.autoStartFocus,
    completedSessionsToday,
    totalFocusMinutesToday,
  ]);

  // Main Pomodoro Countdown Interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && mode === 'pomodoro') {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          if (audioEngine) audioEngine.playTick();
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, handleSessionComplete]);

  const handleStartPause = () => {
    if (audioEngine) audioEngine.playClick();
    if (remainingSeconds === 0) {
      setRemainingSeconds(totalSeconds);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (audioEngine) audioEngine.playClick();
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  const handleSkipSession = () => {
    if (audioEngine) audioEngine.playClick();
    setIsRunning(false);
    if (sessionType === 'focus') {
      setSessionType('shortBreak');
    } else {
      setSessionType('focus');
    }
  };

  const handleSwitchSessionType = (type: SessionType) => {
    if (audioEngine) audioEngine.playClick();
    setIsRunning(false);
    setSessionType(type);
    let dur = settings.focusDuration * 60;
    if (type === 'shortBreak') dur = settings.shortBreakDuration * 60;
    if (type === 'longBreak') dur = settings.longBreakDuration * 60;
    setTotalSeconds(dur);
    setRemainingSeconds(dur);
  };

  const toggleFullscreen = () => {
    if (audioEngine) audioEngine.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (!isRunning) {
      let dur = newSettings.focusDuration * 60;
      if (sessionType === 'shortBreak') dur = newSettings.shortBreakDuration * 60;
      if (sessionType === 'longBreak') dur = newSettings.longBreakDuration * 60;
      setTotalSeconds(dur);
      setRemainingSeconds(dur);
    }
    try {
      localStorage.setItem('dashtimer_settings', JSON.stringify(newSettings));
    } catch {
      // quiet
    }
  };

  // Keyboard Shortcuts (Space, R, S, Z, F, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in input or modal open, ignore
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (mode === 'pomodoro') {
          if (audioEngine) audioEngine.playClick();
          setIsRunning((prev) => !prev);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (mode === 'pomodoro') {
          if (audioEngine) audioEngine.playClick();
          setIsRunning(false);
          setRemainingSeconds(totalSeconds);
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (mode === 'pomodoro') {
          handleSkipSession();
        }
      } else if (e.key === 'z' || e.key === 'Z') {
        setIsZenMode((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'w' || e.key === 'W') {
        advanceWallpaper();
      } else if (e.key === '?') {
        setShowShortcuts((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsZenMode(false);
        setShowSettings(false);
        setShowShortcuts(false);
        setShowWallpaperTray(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // 3D Card Tilt on Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || window.innerWidth < 768) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / rect.height) * 8;
    const rotateY = (x / rect.width) * 8;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    });
  };

  const handleThemeChange = (newThemeId: 'woody' | 'sky' | 'sand' | 'midnight') => {
    setCurrentThemeId(newThemeId);
    const updated = { ...settings, themeId: newThemeId };
    saveSettings(updated);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Image quality preset CSS filter
  const getQualityFilter = () => {
    switch (settings.wallpaperQuality) {
      case 'vibrant':
        return 'contrast(106%) saturate(120%) brightness(102%)';
      case 'cinema':
        return 'contrast(98%) brightness(96%) sepia(8%) saturate(106%)';
      case 'monochrome':
        return 'grayscale(100%) contrast(112%) brightness(98%)';
      case 'crisp':
      default:
        return 'contrast(102%) saturate(103%) brightness(101%)';
    }
  };

  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const currentWallpaper = WALLPAPERS[wallpaperIndex] || WALLPAPERS[0];
  const nextWallpaper = WALLPAPERS[nextWallpaperIndex] || WALLPAPERS[0];

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between overflow-x-hidden text-white font-sans antialiased select-none">
      {/* ========================================================
          BACKGROUND WALLPAPER CAROUSEL WITH 2S CROSS-FADE
      ======================================================== */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Primary Base Wallpaper Layer */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-out ${
            settings.wallpaperMotion === 'kenburns' ? 'animate-kenburns' : ''
          }`}
          style={{
            backgroundImage: `url(${currentWallpaper.path}), ${currentWallpaper.fallbackGradient}`,
            filter: getQualityFilter(),
            imageRendering: 'auto',
          }}
        />

        {/* Cross-fade Secondary Layer */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-2000 ease-in-out ${
            isCrossFading ? 'opacity-100' : 'opacity-0'
          } ${settings.wallpaperMotion === 'kenburns' ? 'animate-kenburns' : ''}`}
          style={{
            backgroundImage: `url(${nextWallpaper.path}), ${nextWallpaper.fallbackGradient}`,
            filter: getQualityFilter(),
            imageRendering: 'auto',
          }}
        />

        {/* Organic Atmosphere Scrim Overlay (Tinted & User-controlled) */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            backgroundColor: '#0a0b0d',
            opacity: settings.scrimDimLevel,
          }}
        />

        {/* Subtle Vignette & Grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 45%, transparent 40%, rgba(5,6,8,0.55) 100%)',
          }}
        />
      </div>

      {/* ========================================================
          TOP NAVIGATION BAR (COMPLIANT WITH TOP BAR CONTRACT)
          Zone 1: Brand title (one line)
          Zone 2: 3-mode clean text segmented navigation
          Zone 3: 1-2 primary actions (Zen mode, Settings, Fullscreen)
      ======================================================== */}
      <header
        className={`relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300 ${
          isZenMode ? 'opacity-0 pointer-events-none -translate-y-4' : 'opacity-100'
        }`}
      >
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-serif italic">
            Dashtimer
          </span>
        </div>

        {/* Zone 2: Navigation Links / Segmented Mode Controls */}
        <nav className="flex items-center gap-1 p-1 rounded-xl glass-panel-subtle border border-white/10 shadow-sm shrink-0">
          <button
            onClick={() => {
              if (audioEngine) audioEngine.playClick();
              setMode('pomodoro');
            }}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              mode === 'pomodoro'
                ? 'bg-white/15 text-white font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            style={mode === 'pomodoro' ? { color: theme.accentLight } : {}}
          >
            Pomodoro
          </button>
          <button
            onClick={() => {
              if (audioEngine) audioEngine.playClick();
              setMode('stopwatch');
            }}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              mode === 'stopwatch'
                ? 'bg-white/15 text-white font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            style={mode === 'stopwatch' ? { color: theme.accentLight } : {}}
          >
            Stopwatch
          </button>
          <button
            onClick={() => {
              if (audioEngine) audioEngine.playClick();
              setMode('custom');
            }}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              mode === 'custom'
                ? 'bg-white/15 text-white font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            style={mode === 'custom' ? { color: theme.accentLight } : {}}
          >
            <span className="inline sm:hidden">Custom</span>
            <span className="hidden sm:inline">Custom Timer</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Zen Mode Button */}
          <button
            onClick={() => {
              if (audioEngine) audioEngine.playClick();
              setIsZenMode(true);
            }}
            className="w-9 h-9 rounded-xl glass-button flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
            title="Zen / Minimalist Mode (Z)"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Wallpaper Quick Switcher Button */}
          <button
            onClick={() => {
              if (audioEngine) audioEngine.playClick();
              setShowWallpaperTray((prev) => !prev);
            }}
            className={`w-9 h-9 rounded-xl glass-button flex items-center justify-center cursor-pointer relative transition-all ${
              showWallpaperTray ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
            }`}
            title="Wallpapers & Atmosphere (W)"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 px-1 rounded-full bg-white/30 text-[9px] font-mono text-white leading-tight">
              {wallpaperIndex + 1}
            </span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex w-9 h-9 rounded-xl glass-button items-center justify-center text-white/70 hover:text-white cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={() => {
              if (audioEngine) audioEngine.playClick();
              setShowShortcuts(true);
            }}
            className="hidden sm:flex w-9 h-9 rounded-xl glass-button items-center justify-center text-white/70 hover:text-white cursor-pointer"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              if (audioEngine) audioEngine.playClick();
              setShowSettings(true);
            }}
            className="w-9 h-9 rounded-xl glass-button flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
            title="Settings & Themes"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Zen Mode Exit Button (when Zen mode is enabled) */}
      {isZenMode && (
        <button
          onClick={() => {
            if (audioEngine) audioEngine.playClick();
            setIsZenMode(false);
          }}
          className="fixed top-6 right-6 z-40 px-3.5 py-1.5 rounded-full glass-panel text-xs text-white/70 hover:text-white flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg"
          title="Exit Zen Mode (Esc or Z)"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Exit Zen</span>
        </button>
      )}

      {/* ========================================================
          CENTRAL CONTENT VIEWPORT (WITH 3D TILT EFFECT)
      ======================================================== */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 w-full max-w-4xl mx-auto">
        {/* 3D Glass Surface Card */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full max-w-xl p-6 sm:p-8 rounded-3xl glass-panel flex flex-col items-center justify-center transition-transform duration-200 ease-out will-change-transform shadow-2xl"
          style={{
            ...tiltStyle,
            borderColor: theme.glassBorder,
            backgroundColor: theme.glassBg,
            boxShadow: `0 35px 70px -15px rgba(0,0,0,0.55), 0 0 0 1px ${theme.glassBorder} inset`,
          }}
        >
          {/* MODE 1: POMODORO MODE */}
          {mode === 'pomodoro' && (
            <div className="w-full flex flex-col items-center">
              {/* Session Type Segmented Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl glass-panel-subtle border border-white/10 mb-6">
                <button
                  onClick={() => handleSwitchSessionType('focus')}
                  className={`px-3.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    sessionType === 'focus'
                      ? 'bg-white/20 text-white font-semibold shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                  style={sessionType === 'focus' ? { color: theme.accentLight } : {}}
                >
                  Focus
                </button>
                <button
                  onClick={() => handleSwitchSessionType('shortBreak')}
                  className={`px-3.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    sessionType === 'shortBreak'
                      ? 'bg-white/20 text-white font-semibold shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                  style={sessionType === 'shortBreak' ? { color: theme.accentLight } : {}}
                >
                  Short Break
                </button>
                <button
                  onClick={() => handleSwitchSessionType('longBreak')}
                  className={`px-3.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    sessionType === 'longBreak'
                      ? 'bg-white/20 text-white font-semibold shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                  style={sessionType === 'longBreak' ? { color: theme.accentLight } : {}}
                >
                  Long Break
                </button>
              </div>

              {/* High-Precision Circular Progress Dial */}
              <TimerRing
                progress={progress}
                size={320}
                strokeWidth={7}
                accentColor={theme.accent}
              >
                <div className="text-center flex flex-col items-center">
                  {/* Status Kicker (No pill box - clean unboxed typography) */}
                  <div className="text-[11px] font-medium tracking-widest text-white/50 uppercase mb-1">
                    {sessionType === 'focus'
                      ? `Cycle ${cycleCount} of ${settings.cyclesBeforeLongBreak}`
                      : sessionType === 'shortBreak'
                      ? 'Recharge & Breathe'
                      : 'Extended Rest'}
                  </div>

                  {/* Main Time Counter (Tabular Numerals) */}
                  <div className="font-mono text-6xl sm:text-7xl font-light tracking-tight text-white drop-shadow-md">
                    {formatCountdown(remainingSeconds)}
                  </div>

                  {/* Subtle Sub-kicker */}
                  <div className="text-xs text-white/45 mt-2 flex items-center gap-1.5 font-medium">
                    <span>{isRunning ? 'Flow active' : remainingSeconds === 0 ? 'Cycle finished' : 'Paused'}</span>
                    <span>·</span>
                    <span>{Math.ceil(remainingSeconds / 60)} min</span>
                  </div>
                </div>
              </TimerRing>

              {/* Primary Action Buttons */}
              <div className="flex items-center gap-5 mt-7 select-none">
                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="w-12 h-12 rounded-full glass-button flex items-center justify-center text-white/70 hover:text-white active:scale-95 cursor-pointer shadow-md"
                  title="Reset Session (R)"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* Main Play / Pause Button */}
                <button
                  onClick={handleStartPause}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-xl cursor-pointer"
                  style={{
                    backgroundColor: theme.accent,
                    color: '#1a1412',
                  }}
                  title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
                >
                  {isRunning ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current translate-x-0.5" />
                  )}
                </button>

                {/* Skip to Next Session */}
                <button
                  onClick={handleSkipSession}
                  className="w-12 h-12 rounded-full glass-button flex items-center justify-center text-white/70 hover:text-white active:scale-95 cursor-pointer shadow-md"
                  title="Skip to next session (S)"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: STOPWATCH MODE */}
          {mode === 'stopwatch' && (
            <StopwatchView theme={theme} />
          )}

          {/* MODE 3: CUSTOM TIMER MODE */}
          {mode === 'custom' && (
            <CustomTimerView
              theme={theme}
              onTimerComplete={() => {
                if (audioEngine) audioEngine.playChime();
              }}
            />
          )}
        </div>
      </main>

      {/* ========================================================
          BOTTOM AMBIENT AUDIO PLAYER DOCK (MULTI-MEDIA BAR)
      ======================================================== */}
      {!isZenMode && (
        <>
          {/* Floating Quick Wallpaper Controller (Bottom-left capsule) */}
          <div className="fixed bottom-24 left-4 z-30 hidden sm:flex items-center gap-1.5 p-1.5 pl-3 rounded-full glass-panel shadow-xl border border-white/10 text-xs backdrop-blur-md">
            <button
              onClick={() => {
                if (audioEngine) audioEngine.playClick();
                setShowWallpaperTray((prev) => !prev);
              }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer mr-1"
              title="Open 10 Wallpaper Switcher"
            >
              <ImageIcon className="w-3.5 h-3.5 text-white/60" />
              <span className="font-medium max-w-[130px] truncate text-[11px]">{currentWallpaper.title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 font-mono">
                {wallpaperIndex + 1}/10
              </span>
            </button>
            <div className="h-3 w-px bg-white/15" />
            <button
              onClick={prevWallpaper}
              className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Previous Background"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={advanceWallpaper}
              className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Next Background (or press W)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <AmbientPlayerBar
            theme={theme}
            ambientVolume={ambientVolume}
            onVolumeChange={setAmbientVolume}
            onTrackChange={handleTrackChange}
          />
        </>
      )}

      {/* ========================================================
          QUICK 10 WALLPAPERS POPUP TRAY
      ======================================================== */}
      {showWallpaperTray && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div
            className="w-full max-w-2xl rounded-3xl glass-panel p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            style={{
              borderColor: theme.glassBorder,
              backgroundColor: 'rgba(18, 20, 24, 0.95)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4" style={{ color: theme.accent }} />
                <div>
                  <h3 className="text-sm font-semibold text-white">4K Wallpapers & Atmosphere</h3>
                  <p className="text-[11px] text-white/50">10 high-resolution backgrounds with mood matching & auto-cycle</p>
                </div>
              </div>
              <button
                onClick={() => setShowWallpaperTray(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 10 Wallpapers Grid */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {WALLPAPERS.map((wp, idx) => {
                const isCurrent = wallpaperIndex === idx;
                return (
                  <button
                    key={wp.id}
                    onClick={() => {
                      changeWallpaper(idx);
                    }}
                    className={`group relative rounded-xl overflow-hidden aspect-video border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-white ring-2 ring-white/60 scale-[1.03] shadow-lg'
                        : 'border-white/10 hover:border-white/40 opacity-70 hover:opacity-100 hover:scale-[1.01]'
                    }`}
                    style={{
                      backgroundImage: `url(${wp.path}), ${wp.fallbackGradient}`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
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
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Controls Row */}
            <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              {/* Auto-Cycle Duration */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-white block">Auto-Cycle Duration</span>
                  <span className="text-[10px] text-white/50">Interval between background switches</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
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
                        const updated = {
                          ...settings,
                          wallpaperCycleSeconds: opt.secs,
                          wallpaperCycleIntervalMinutes: Math.round(opt.secs / 60) || 0,
                        };
                        saveSettings(updated);
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all ${
                        settings.wallpaperCycleSeconds === opt.secs
                          ? 'bg-white text-black font-semibold'
                          : 'bg-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Queue Strategy */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-white/5">
                <div>
                  <span className="text-xs font-medium text-white block">Queue Strategy</span>
                  <span className="text-[10px] text-white/50">Order of background progression</span>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'mood', label: 'Match Mood', icon: Sparkles },
                    { id: 'shuffle', label: 'Random', icon: Shuffle },
                    { id: 'sequential', label: 'In Order', icon: Repeat },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = settings.wallpaperQueueMode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          const updated = {
                            ...settings,
                            wallpaperQueueMode: m.id as 'mood' | 'shuffle' | 'sequential',
                          };
                          saveSettings(updated);
                        }}
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

              {/* Quality Preset */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-white/5">
                <div>
                  <span className="text-xs font-medium text-white block">Display Quality & Upscale</span>
                  <span className="text-[10px] text-white/50">Sharpening and color grading filter</span>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'crisp', label: 'Ultra Crisp' },
                    { id: 'vibrant', label: 'Vibrant' },
                    { id: 'cinema', label: 'Cinema' },
                    { id: 'monochrome', label: 'B&W Zen' },
                  ].map((q) => {
                    const isSelected = settings.wallpaperQuality === q.id;
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          const updated = {
                            ...settings,
                            wallpaperQuality: q.id as 'crisp' | 'vibrant' | 'cinema' | 'monochrome',
                          };
                          saveSettings(updated);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all ${
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
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-white/40">Tip: Press &apos;W&apos; on keyboard to jump to next wallpaper</span>
              <button
                onClick={() => {
                  setShowWallpaperTray(false);
                  setShowSettings(true);
                }}
                className="text-xs text-white/70 hover:text-white underline cursor-pointer"
              >
                More Wallpaper Settings &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SETTINGS & PREFERENCES MODAL
      ======================================================== */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSaveSettings={saveSettings}
        currentTheme={theme}
        onSelectTheme={handleThemeChange}
        currentWallpaperIndex={wallpaperIndex}
        onSelectWallpaper={changeWallpaper}
      />

      {/* ========================================================
          KEYBOARD SHORTCUTS MODAL
      ======================================================== */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div
            className="w-full max-w-md rounded-3xl glass-panel p-6 shadow-2xl relative"
            style={{
              borderColor: theme.glassBorder,
              backgroundColor: 'rgba(20, 22, 28, 0.95)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" style={{ color: theme.accent }} />
                <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1 rounded-lg text-white/50 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/70">Play / Pause Timer</span>
                <kbd className="px-2 py-1 rounded bg-white/10 font-mono text-white/90">Space</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/70">Reset Timer</span>
                <kbd className="px-2 py-1 rounded bg-white/10 font-mono text-white/90">R</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/70">Skip to Next Session</span>
                <kbd className="px-2 py-1 rounded bg-white/10 font-mono text-white/90">S</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/70">Toggle Zen / Minimalist Mode</span>
                <kbd className="px-2 py-1 rounded bg-white/10 font-mono text-white/90">Z</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/70">Toggle Fullscreen</span>
                <kbd className="px-2 py-1 rounded bg-white/10 font-mono text-white/90">F</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/70">Cycle Wallpaper</span>
                <kbd className="px-2 py-1 rounded bg-white/10 font-mono text-white/90">W</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-white/70">Close Modals / Exit Zen</span>
                <kbd className="px-2 py-1 rounded bg-white/10 font-mono text-white/90">Esc</kbd>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowShortcuts(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-md"
                style={{
                  backgroundColor: theme.accent,
                  color: '#1a1412',
                }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
