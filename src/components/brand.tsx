import { cn } from "@/lib/utils";

/**
 * Logo de voz — cinco barras pulsando como um equalizer, costurando
 * a ideia de "voz que liga". A central fica em destaque âmbar pra criar
 * tensão visual.
 */
export function BrandMark({
  className,
  animated = true,
  size = "md",
}: {
  className?: string;
  animated?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeMap = {
    sm: { box: "h-8 w-8 rounded-lg", w: 22, h: 14 },
    md: { box: "h-10 w-10 rounded-xl", w: 26, h: 16 },
    lg: { box: "h-14 w-14 rounded-2xl", w: 36, h: 22 },
    xl: { box: "h-20 w-20 rounded-[1.75rem]", w: 52, h: 32 },
  } as const;
  const s = sizeMap[size];

  // 5 barras com alturas relativas (max=1) — desenha um wave
  const bars = [0.45, 0.75, 1.0, 0.7, 0.4];

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-[oklch(0.32_0.12_280)] via-[oklch(0.5_0.22_275)] to-[oklch(0.62_0.18_265)]",
        "ring-1 ring-inset ring-white/15",
        "shadow-[0_18px_40px_-18px_oklch(0.5_0.22_275/0.5)]",
        s.box,
        className
      )}
    >
      {/* radial glow */}
      <span
        className="pointer-events-none absolute -top-1/2 left-1/2 h-[140%] w-[140%] -translate-x-1/2 bg-[radial-gradient(circle_at_center,oklch(0.96_0.04_85/0.45),transparent_60%)]"
        aria-hidden
      />
      <svg
        viewBox="0 0 50 32"
        width={s.w}
        height={s.h}
        className="relative z-10"
        aria-hidden
      >
        <g strokeLinecap="round" strokeWidth={4}>
          {bars.map((scale, i) => {
            const x = 5 + i * 10;
            const height = scale * 26;
            const y1 = 16 - height / 2;
            const y2 = 16 + height / 2;
            // central bar in warm amber for accent
            const isCenter = i === 2;
            return (
              <line
                key={i}
                x1={x}
                y1={y1}
                x2={x}
                y2={y2}
                stroke={isCenter ? "oklch(0.85 0.15 75)" : "white"}
                className={animated ? "brand-wave-bar" : undefined}
              />
            );
          })}
        </g>
      </svg>
    </span>
  );
}

/**
 * Wordmark editorial — Fluxia em serif, "v" italic em âmbar como assinatura.
 */
export function BrandWord({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl md:text-7xl",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display tracking-[-0.02em] leading-none",
        sizes[size],
        className
      )}
    >
      Fluxia
      <span className="italic text-[color:oklch(0.65_0.18_70)]">v</span>oice
    </span>
  );
}

/**
 * Onda sonora ornamental — barras decorativas que sugerem fala.
 */
export function SoundLine({
  className,
  bars = 32,
  variant = "wave",
}: {
  className?: string;
  bars?: number;
  variant?: "wave" | "fade";
}) {
  return (
    <svg
      viewBox={`0 0 ${bars * 6} 40`}
      className={cn("text-foreground/15", className)}
      aria-hidden
      fill="none"
      preserveAspectRatio="none"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const t = i / (bars - 1);
        let height: number;
        if (variant === "wave") {
          const wave = Math.sin(t * Math.PI * 3) * 0.6 + Math.sin(t * Math.PI * 5) * 0.3;
          height = Math.max(4, Math.abs(wave) * 30 + 6);
        } else {
          // fade — random-ish heights, taller at edges then quiet
          const seed = Math.sin(i * 12.9898) * 43758.5453;
          const r = seed - Math.floor(seed);
          const env = Math.sin(t * Math.PI);
          height = 6 + r * 22 * env + 4;
        }
        const y = 20 - height / 2;
        return (
          <rect
            key={i}
            x={i * 6 + 1.5}
            y={y}
            width={3}
            height={height}
            rx={1.5}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}

/**
 * Indicador "online / ligando" — bolinha verde pulsante editorial.
 */
export function LiveDot({
  className,
  tone = "emerald",
}: {
  className?: string;
  tone?: "emerald" | "amber" | "indigo";
}) {
  const toneClass = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    indigo: "bg-indigo-500",
  }[tone];
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)}>
      <span
        className={cn(
          "absolute inset-0 rounded-full opacity-60 animate-ping",
          toneClass
        )}
      />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", toneClass)} />
    </span>
  );
}
