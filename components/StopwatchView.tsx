'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { audioEngine } from '@/lib/audioEngine';
import { ThemeOption } from '@/lib/themeData';

interface StopwatchViewProps {
  theme: ThemeOption;
}

interface LapItem {
  id: number;
  lapTime: number; // in milliseconds
  splitTime: number; // in milliseconds
}

export const StopwatchView: React.FC<StopwatchViewProps> = ({ theme }) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<LapItem[]>([]);

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const previousElapsedRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now() - previousElapsedRef.current;
      const update = () => {
        const now = performance.now();
        const currentElapsed = now - startTimeRef.current;
        setElapsedMs(currentElapsed);
        previousElapsedRef.current = currentElapsed;
        animationFrameRef.current = requestAnimationFrame(update);
      };
      animationFrameRef.current = requestAnimationFrame(update);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning]);

  const handleStartPause = () => {
    if (audioEngine) audioEngine.playClick();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (audioEngine) audioEngine.playClick();
    setIsRunning(false);
    setElapsedMs(0);
    previousElapsedRef.current = 0;
    setLaps([]);
  };

  const handleLap = () => {
    if (!isRunning) return;
    if (audioEngine) audioEngine.playLap();

    const previousSplit = laps.length > 0 ? laps[0].splitTime : 0;
    const currentLapTime = elapsedMs - previousSplit;

    const newLap: LapItem = {
      id: laps.length + 1,
      lapTime: currentLapTime,
      splitTime: elapsedMs,
    };

    setLaps([newLap, ...laps]);
  };

  // Format Helpers
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      min: pad(minutes),
      sec: pad(seconds),
      ms: pad(milliseconds),
    };
  };

  const formatted = formatTime(elapsedMs);

  // Find min & max lap times for highlights
  let minLapTime = Infinity;
  let maxLapTime = -Infinity;
  if (laps.length > 1) {
    laps.forEach(l => {
      if (l.lapTime < minLapTime) minLapTime = l.lapTime;
      if (l.lapTime > maxLapTime) maxLapTime = l.lapTime;
    });
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto py-2">
      {/* Modern Stopwatch Glass Disc */}
      <div
        className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full flex flex-col items-center justify-center p-6 border transition-all duration-300 shadow-2xl backdrop-blur-2xl"
        style={{
          backgroundColor: theme.glassBg,
          borderColor: theme.glassBorder,
          boxShadow: `0 25px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px ${theme.glassBorder} inset`,
        }}
      >
        {/* Subtle decorative concentric ring */}
        <div
          className="absolute inset-4 rounded-full border border-white/5 pointer-events-none"
        />

        {/* Stopwatch Numerical Display */}
        <div className="text-center z-10 flex flex-col items-center">
          <div className="text-[11px] font-medium tracking-widest text-white/50 uppercase mb-1">
            Precision Stopwatch
          </div>

          <div className="flex items-baseline font-mono font-medium tracking-tight text-white drop-shadow-md">
            <span className="text-5xl sm:text-6xl tabular-nums">
              {formatted.min}:{formatted.sec}
            </span>
            <span
              className="text-2xl sm:text-3xl ml-1 tabular-nums font-normal"
              style={{ color: theme.accentLight }}
            >
              .{formatted.ms}
            </span>
          </div>

          <div className="text-xs text-white/45 mt-2 flex items-center gap-1.5 font-medium">
            <span>{isRunning ? 'Timing active' : elapsedMs > 0 ? 'Paused' : 'Ready'}</span>
            {laps.length > 0 && (
              <>
                <span>·</span>
                <span>{laps.length} {laps.length === 1 ? 'lap' : 'laps'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Control Action Buttons */}
      <div className="flex items-center gap-4 mt-8 select-none">
        {/* Reset Button */}
        <button
          onClick={handleReset}
          disabled={elapsedMs === 0}
          className="w-12 h-12 rounded-full glass-button flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title="Reset Stopwatch"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Primary Start / Pause Button */}
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

        {/* Lap Button */}
        <button
          onClick={handleLap}
          disabled={!isRunning}
          className="w-12 h-12 rounded-full glass-button flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title="Record Lap"
        >
          <Flag className="w-5 h-5" />
        </button>
      </div>

      {/* Laps List with Staggered Entries */}
      {laps.length > 0 && (
        <div
          className="w-full mt-6 rounded-2xl glass-panel p-4 max-h-56 overflow-y-auto"
          style={{
            borderColor: theme.glassBorder,
            backgroundColor: 'rgba(18, 20, 24, 0.45)',
          }}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-white/40 uppercase pb-2 border-b border-white/10 px-2">
            <span>Lap</span>
            <span>Lap Split</span>
            <span>Total Time</span>
          </div>

          <div className="divide-y divide-white/5">
            {laps.map((lap) => {
              const lapFmt = formatTime(lap.lapTime);
              const splitFmt = formatTime(lap.splitTime);
              const isFastest = laps.length > 1 && lap.lapTime === minLapTime;
              const isSlowest = laps.length > 1 && lap.lapTime === maxLapTime;

              return (
                <div
                  key={lap.id}
                  className="flex items-center justify-between py-2.5 px-2 text-xs font-mono transition-colors hover:bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 font-sans text-xs">#{lap.id.toString().padStart(2, '0')}</span>
                    {isFastest && (
                      <span className="text-[10px] text-emerald-400 font-sans font-medium px-1.5 py-0.2 rounded bg-emerald-500/10">
                        Fastest
                      </span>
                    )}
                    {isSlowest && (
                      <span className="text-[10px] text-amber-300 font-sans font-medium px-1.5 py-0.2 rounded bg-amber-500/10">
                        Slowest
                      </span>
                    )}
                  </div>
                  <span className="tabular-nums text-white/90">
                    +{lapFmt.min}:{lapFmt.sec}.{lapFmt.ms}
                  </span>
                  <span className="tabular-nums text-white/50">
                    {splitFmt.min}:{splitFmt.sec}.{splitFmt.ms}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
