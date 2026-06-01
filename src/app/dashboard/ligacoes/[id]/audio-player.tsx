"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  function restart() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
    setPlaying(true);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrent(audio.currentTime);
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  }

  function cycleRate() {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const idx = rates.indexOf(rate);
    const next = rates[(idx + 1) % rates.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  // ---- waveform fake bars ----
  const bars = 48;
  const playingIndex = Math.floor((progress / 100) * bars);

  return (
    <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card to-muted/30">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="p-5 space-y-4">
        {/* Header: controls + meta */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background hover:scale-105 transition-transform shadow-lg"
          >
            {playing ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 translate-x-0.5" />
            )}
          </button>

          <button
            onClick={restart}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Recomeçar"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Gravação · Retell
            </p>
            <p className="font-mono tabular-nums text-sm mt-0.5">
              {formatTime(current)} <span className="text-muted-foreground">/ {formatTime(duration)}</span>
            </p>
          </div>

          <button
            onClick={cycleRate}
            className="font-mono text-[11px] font-medium rounded-full border border-border bg-card px-2.5 py-1 hover:bg-accent transition-colors"
            title="Velocidade"
          >
            {rate}×
          </button>

          <button
            onClick={toggleMute}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title={muted ? "Ativar som" : "Mutar"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Waveform visual */}
        <div className="relative h-14 flex items-center gap-[3px] px-0.5">
          {Array.from({ length: bars }).map((_, i) => {
            // pseudo-random heights baseado em seed
            const seed = Math.sin(i * 12.9898) * 43758.5453;
            const r = seed - Math.floor(seed);
            const env = Math.sin((i / bars) * Math.PI);
            const h = 8 + r * 30 * env;
            const isPlayed = i <= playingIndex;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  isPlayed
                    ? "bg-[oklch(0.5_0.22_275)] dark:bg-[oklch(0.72_0.18_275)]"
                    : "bg-foreground/15"
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
          {/* Slider invisível por cima pra seek */}
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={seek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            aria-label="Posição da gravação"
          />
        </div>
      </div>
    </Card>
  );
}

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
}
