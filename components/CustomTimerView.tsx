'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { audioEngine } from '@/lib/audioEngine';
import { ThemeOption } from '@/lib/themeData';
import { TimerRing } from './TimerRing';

interface CustomTimerViewProps {
  theme: ThemeOption;
  onTimerComplete: () => void;
}

export const CustomTimerView: React.FC<CustomTimerViewProps> = ({
  theme,
  onTimerComplete,
}) => {
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(10);
  const [seconds, setSeconds] = useState<number>(0);

  const [totalSeconds, setTotalSeconds] = useState<number>(600);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync remaining seconds when hours/minutes/seconds change during non-running state
  const applyDuration = (h: number, m: number, s: number) => {
    const total = h * 3600 + m * 60 + s;
    const clamped = Math.max(1, Math.min(86399, total));
    setTotalSeconds(clamped);
    setRemainingSeconds(clamped);
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            if (audioEngine) audioEngine.playChime();
            onTimerComplete();
            return 0;
          }
          if (audioEngine) audioEngine.playTick();
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, onTimerComplete]);

  const handleStartPause = () => {
    if (audioEngine) audioEngine.playClick();
    if (remainingSeconds === 0) {
      setRemainingSeconds(totalSeconds);
    }
    setIsRunning(!isRunning);
    setIsEditing(false);
  };

  const handleReset = () => {
    if (audioEngine) audioEngine.playClick();
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  const handleAddMinutes = (min: number) => {
    if (audioEngine) audioEngine.playClick();
    setRemainingSeconds((prev) => prev + min * 60);
    setTotalSeconds((prev) => prev + min * 60);
  };

  const handleQuickPreset = (presetMinutes: number) => {
    if (audioEngine) audioEngine.playClick();
    setIsRunning(false);
    const h = Math.floor(presetMinutes / 60);
    const m = presetMinutes % 60;
    setHours(h);
    setMinutes(m);
    setSeconds(0);
    applyDuration(h, m, 0);
  };

  // Formatting
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto py-2">
      {/* Timer Dial Ring */}
      <TimerRing
        progress={progress}
        size={330}
        strokeWidth={7}
        accentColor={theme.accent}
      >
        <div className="text-center flex flex-col items-center">
          <div className="text-[11px] font-medium tracking-widest text-white/50 uppercase mb-1">
            Custom Countdown
          </div>

          <div
            onClick={() => {
              if (!isRunning) setIsEditing(!isEditing);
            }}
            className="font-mono text-5xl sm:text-6xl font-medium tracking-tight text-white drop-shadow-md cursor-pointer hover:opacity-90 transition-opacity"
            title={isRunning ? '' : 'Click to adjust time'}
          >
            {formatTime(remainingSeconds)}
          </div>

          <div className="text-xs text-white/45 mt-2 flex items-center gap-1.5 font-medium">
            <span>{isRunning ? 'Counting down' : remainingSeconds === 0 ? 'Finished' : 'Paused'}</span>
            <span>·</span>
            <span>{Math.ceil(remainingSeconds / 60)} min left</span>
          </div>
        </div>
      </TimerRing>

      {/* Manual Stepper Inputs (shown when not running or user clicked edit) */}
      {!isRunning && (
        <div
          className="mt-5 px-4 py-3 rounded-2xl glass-panel-subtle flex items-center justify-center gap-4 transition-all"
          style={{ borderColor: theme.glassBorder }}
        >
          {/* Hours */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase text-white/50 font-semibold mb-1">Hours</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const newH = Math.max(0, hours - 1);
                  setHours(newH);
                  applyDuration(newH, minutes, seconds);
                }}
                className="w-7 h-7 rounded-md glass-button flex items-center justify-center text-white/70 hover:text-white"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono text-sm font-semibold text-white">
                {hours.toString().padStart(2, '0')}
              </span>
              <button
                onClick={() => {
                  const newH = Math.min(23, hours + 1);
                  setHours(newH);
                  applyDuration(newH, minutes, seconds);
                }}
                className="w-7 h-7 rounded-md glass-button flex items-center justify-center text-white/70 hover:text-white"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <span className="text-white/30 font-bold self-end pb-1.5">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase text-white/50 font-semibold mb-1">Mins</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const newM = Math.max(0, minutes - 5);
                  setMinutes(newM);
                  applyDuration(hours, newM, seconds);
                }}
                className="w-7 h-7 rounded-md glass-button flex items-center justify-center text-white/70 hover:text-white"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono text-sm font-semibold text-white">
                {minutes.toString().padStart(2, '0')}
              </span>
              <button
                onClick={() => {
                  const newM = Math.min(59, minutes + 5);
                  setMinutes(newM);
                  applyDuration(hours, newM, seconds);
                }}
                className="w-7 h-7 rounded-md glass-button flex items-center justify-center text-white/70 hover:text-white"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <span className="text-white/30 font-bold self-end pb-1.5">:</span>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase text-white/50 font-semibold mb-1">Secs</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const newS = Math.max(0, seconds - 10);
                  setSeconds(newS);
                  applyDuration(hours, minutes, newS);
                }}
                className="w-7 h-7 rounded-md glass-button flex items-center justify-center text-white/70 hover:text-white"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono text-sm font-semibold text-white">
                {seconds.toString().padStart(2, '0')}
              </span>
              <button
                onClick={() => {
                  const newS = Math.min(59, seconds + 10);
                  setSeconds(newS);
                  applyDuration(hours, minutes, newS);
                }}
                className="w-7 h-7 rounded-md glass-button flex items-center justify-center text-white/70 hover:text-white"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Presets Strip */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5">
        {[5, 10, 15, 25, 45, 60].map((preset) => {
          const isCurrent = totalSeconds === preset * 60;
          return (
            <button
              key={preset}
              onClick={() => handleQuickPreset(preset)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isCurrent
                  ? 'shadow-sm font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              style={
                isCurrent
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
              {preset < 60 ? `${preset}m` : '1h'}
            </button>
          );
        })}
      </div>

      {/* Control Action Buttons */}
      <div className="flex items-center gap-4 mt-7 select-none">
        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-12 h-12 rounded-full glass-button flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Play / Pause */}
        <button
          onClick={handleStartPause}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg cursor-pointer"
          style={{
            backgroundColor: theme.accent,
            color: '#1a1412',
          }}
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? (
            <Pause className="w-7 h-7 fill-current" />
          ) : (
            <Play className="w-7 h-7 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Quick +5m addition */}
        <button
          onClick={() => handleAddMinutes(5)}
          className="w-12 h-12 rounded-full glass-button flex items-center justify-center text-xs font-semibold text-white/80 hover:text-white cursor-pointer"
          title="Add 5 minutes"
        >
          +5m
        </button>
      </div>
    </div>
  );
};
