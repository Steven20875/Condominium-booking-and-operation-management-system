import React, { useEffect, useRef } from 'react';

type Props = {
  colors?: string[];
  speed?: number; // lower = slower
  scale?: number;
  turbulence?: number;
  glow?: number;
  opacity?: number;
  particles?: number;
};

export default function FerrofluidBackground({
  colors = ['#2563EB', '#0EA5E9', '#06B6D4'],
  speed = 0.25,
  scale = 2,
  turbulence = 0.6,
  glow = 1.2,
  opacity = 0.5,
  particles,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const runningRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let w = canvas.clientWidth || canvas.width;
    let h = canvas.clientHeight || canvas.height;
    const isMobile = window.innerWidth < 640 || 'ontouchstart' in window;
    const targetParticles = particles ?? (isMobile ? 6 : 12);

    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      w = canvas.clientWidth || canvas.width;
      h = canvas.clientHeight || canvas.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    // Simple particle blobs
    type P = { x: number; y: number; vx: number; vy: number; r: number; color: string; phase: number };
    const particlesArr: P[] = [];
    for (let i = 0; i < targetParticles; i++) {
      particlesArr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * (0.2 + speed),
        vy: (Math.random() - 0.5) * (0.15 + speed),
        r: (40 + Math.random() * 160) * (scale / 2),
        color: colors[i % colors.length],
        phase: Math.random() * Math.PI * 2,
      });
    }

    const maxFPS = 30; // cap fps for performance
    const frameInterval = 1000 / maxFPS;

    function draw(now: number) {
      if (!runningRef.current) return;
      if (!lastFrameRef.current) lastFrameRef.current = now;
      const delta = now - lastFrameRef.current;
      if (delta < frameInterval) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameRef.current = now;

      ctx.clearRect(0, 0, w, h);

      // soft background darken for contrast
      ctx.fillStyle = `rgba(6,10,16,${0.06 * (1 - opacity) + 0.12})`;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';

      particlesArr.forEach((p, idx) => {
        // simple oscillation for organic motion
        p.phase += 0.01 * (0.5 + speed);
        p.x += p.vx + Math.sin(p.phase * (0.5 + turbulence)) * 0.4;
        p.y += p.vy + Math.cos(p.phase * (0.6 + turbulence)) * 0.35;

        // wrap around
        if (p.x < -p.r) p.x = w + p.r;
        if (p.x > w + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = h + p.r;
        if (p.y > h + p.r) p.y = -p.r;

        const grad = ctx.createRadialGradient(p.x, p.y, Math.max(1, p.r * 0.05), p.x, p.y, p.r);
        grad.addColorStop(0, hexToRgba(p.color, 0.9 * opacity));
        grad.addColorStop(0.4, hexToRgba(p.color, 0.45 * opacity));
        grad.addColorStop(1, hexToRgba('#0b1220', 0));

        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // subtle blur/glow via CSS filter on canvas container (handled in inline styles)
      rafRef.current = requestAnimationFrame(draw);
    }

    // Visibility handling to reduce CPU
    function handleVisibility() {
      runningRef.current = !document.hidden;
      if (runningRef.current) {
        lastFrameRef.current = 0;
        rafRef.current = requestAnimationFrame(draw);
      } else if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      runningRef.current = false;
    };
  }, [colors, speed, scale, turbulence, glow, opacity, particles]);

  return (
    <div
      aria-hidden
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none ferrofluid-background-root"
    >
      <canvas
        ref={canvasRef}
        className="ferrofluid-background-canvas"
      />
    </div>
  );
}

function hexToRgba(hex: string, alpha = 1) {
  const sh = hex.replace('#', '');
  const bigint = parseInt(sh.length === 3 ? sh.split('').map(c => c + c).join('') : sh, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
