'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { OrbState } from '@/types/ai-search';

interface AiOrbProps {
  state: OrbState;
  audioLevel?: number;
}

const STATE_COLORS: Record<OrbState, { r: number; g: number; b: number }> = {
  idle: { r: 0, g: 180, b: 200 },
  listening: { r: 153, g: 255, b: 255 },
  thinking: { r: 245, g: 166, b: 35 },
  speaking: { r: 92, g: 224, b: 210 },
  success: { r: 34, g: 197, b: 94 },
};

const STATE_ANIM: Record<OrbState, { scale: number[]; dur: number }> = {
  idle: { scale: [0.97, 1.03, 0.97], dur: 4 },
  listening: { scale: [0.88, 1.14, 0.88], dur: 1 },
  thinking: { scale: [0.96, 1.04, 0.96], dur: 0.9 },
  speaking: { scale: [0.93, 1.09, 0.93], dur: 0.6 },
  success: { scale: [1, 1.3, 1.2], dur: 0.5 },
};

// ── Canvas particle system with mouse interaction ──

interface Particle {
  x: number;
  y: number;
  baseOrbit: number;
  r: number;
  alpha: number;
  speed: number;
  angle: number;
  phase: number;
  layer: number; // 0=close, 1=mid, 2=far
}

function createParticles(count: number, cx: number, cy: number, orbR: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const layer = i % 3;
    const layerMin = layer === 0 ? 0.2 : layer === 1 ? 0.6 : 1.1;
    const layerMax = layer === 0 ? 0.7 : layer === 1 ? 1.3 : 2.2;
    const orbit = orbR * (layerMin + Math.random() * (layerMax - layerMin));

    particles.push({
      x: cx + Math.cos(Math.random() * Math.PI * 2) * orbit,
      y: cy + Math.sin(Math.random() * Math.PI * 2) * orbit,
      baseOrbit: orbit,
      r: layer === 0 ? 0.5 + Math.random() * 2 : 0.3 + Math.random() * 1.2,
      alpha: layer === 0 ? 0.3 + Math.random() * 0.6 : 0.1 + Math.random() * 0.4,
      speed: 0.15 + Math.random() * 0.7,
      angle: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      layer,
    });
  }
  return particles;
}

function ParticleCanvas({
  width,
  height,
  orbRadius,
  state,
  audioLevel,
  color,
  mouseX,
  mouseY,
  isHovered,
}: {
  width: number;
  height: number;
  orbRadius: number;
  state: OrbState;
  audioLevel: number;
  color: { r: number; g: number; b: number };
  mouseX: number;
  mouseY: number;
  isHovered: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const animRef = useRef(0);

  const cx = width / 2;
  const cy = height / 2;
  const isMobile = useIsMobile();
  const count = isMobile ? 800 : 2000;

  useEffect(() => {
    particlesRef.current = createParticles(count, cx, cy, orbRadius);
  }, [count, cx, cy, orbRadius]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.006;
    const t = timeRef.current;
    const particles = particlesRef.current;

    ctx.clearRect(0, 0, width, height);

    const isActive = state === 'listening' || state === 'speaking';
    const isThinking = state === 'thinking';
    const speedMult = isActive ? 2.5 + audioLevel * 5 : isThinking ? 2 : isHovered ? 1.6 : 1;
    const orbitPulse = isActive ? 1 + audioLevel * 0.5 : isHovered ? 1.08 : 1;

    // Mouse influence
    const mx = mouseX;
    const my = mouseY;
    const mouseActive = isHovered && mx > 0 && my > 0;
    const mouseInfluenceRadius = orbRadius * 1.5;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.angle += p.speed * speedMult * 0.0025;
      p.phase += 0.008;

      const breathe = Math.sin(t * 0.4 + p.phase) * orbRadius * 0.12;
      let targetOrbit = (p.baseOrbit + breathe) * orbitPulse;

      let targetX = cx + Math.cos(p.angle) * targetOrbit;
      let targetY = cy + Math.sin(p.angle) * targetOrbit;

      // Mouse interaction: particles are attracted then repelled
      if (mouseActive) {
        const dmx = p.x - mx;
        const dmy = p.y - my;
        const distToMouse = Math.sqrt(dmx * dmx + dmy * dmy);

        if (distToMouse < mouseInfluenceRadius) {
          const force = (1 - distToMouse / mouseInfluenceRadius);
          // Close particles scatter away, far particles attract
          if (p.layer === 0) {
            // Inner particles: scatter outward from mouse
            const pushForce = force * 25;
            targetX += (dmx / distToMouse) * pushForce;
            targetY += (dmy / distToMouse) * pushForce;
          } else {
            // Outer particles: gently attract toward mouse
            const pullForce = force * 12;
            targetX -= (dmx / distToMouse) * pullForce;
            targetY -= (dmy / distToMouse) * pullForce;
          }
        }
      }

      // Smooth follow with different speeds per layer
      const followSpeed = p.layer === 0 ? 0.06 : p.layer === 1 ? 0.035 : 0.02;
      p.x += (targetX - p.x) * followSpeed;
      p.y += (targetY - p.y) * followSpeed;

      // Turbulence
      p.x += Math.sin(t * 1.5 + i * 0.1) * 0.4;
      p.y += Math.cos(t * 1.5 + i * 0.07) * 0.4;

      // Alpha based on distance and state
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = orbRadius * 2.5;
      const distFade = Math.max(0, 1 - dist / maxDist);

      let finalAlpha = p.alpha * distFade;

      // Mouse proximity brightens particles
      if (mouseActive) {
        const dmx2 = p.x - mx;
        const dmy2 = p.y - my;
        const distM = Math.sqrt(dmx2 * dmx2 + dmy2 * dmy2);
        if (distM < mouseInfluenceRadius * 0.6) {
          const glow = (1 - distM / (mouseInfluenceRadius * 0.6)) * 0.5;
          finalAlpha = Math.min(1, finalAlpha + glow);
        }
      }

      // Pulse
      if (isActive) {
        finalAlpha *= 0.6 + audioLevel * 0.6;
      } else if (isHovered) {
        finalAlpha *= 0.7 + Math.sin(t * 2 + p.phase) * 0.3;
      } else {
        finalAlpha *= 0.4 + Math.sin(t + p.phase) * 0.25;
      }

      if (finalAlpha < 0.01) continue;

      // Size variation on hover
      const sizeBoost = isHovered ? 1.3 : 1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * sizeBoost, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${finalAlpha})`;
      ctx.fill();
    }

    // Draw connection lines between nearby particles (only close ones, hover state)
    if (mouseActive) {
      ctx.lineWidth = 0.3;
      const nearby = particles.filter(p => {
        const d = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        return d < mouseInfluenceRadius * 0.5;
      }).slice(0, 40);

      for (let i = 0; i < nearby.length; i++) {
        for (let j = i + 1; j < nearby.length; j++) {
          const a = nearby[i];
          const b = nearby[j];
          const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (d < 50) {
            const lineAlpha = (1 - d / 50) * 0.15;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${lineAlpha})`;
            ctx.stroke();
          }
        }
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, [width, height, cx, cy, orbRadius, state, audioLevel, color, mouseX, mouseY, isHovered]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
}

// ── Main orb ──

export default function AiOrb({ state, audioLevel = 0 }: AiOrbProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const animFrameRef = useRef<number>(0);
  const controls = useAnimation();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const containerSize = isMobile ? 340 : 560;
  const svgSize = isMobile ? 260 : 400;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = svgSize * 0.30;

  const color = STATE_COLORS[state];
  const anim = STATE_ANIM[state];

  const prefersReduced = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  // SVG turbulence
  useEffect(() => {
    if (prefersReduced || !turbulenceRef.current) return;
    let time = 0;

    function animate() {
      time += 0.004;
      if (turbulenceRef.current) {
        const base = state === 'idle' ? 0.012 : state === 'thinking' ? 0.03 : 0.02;
        const hoverBoost = isHovered ? 0.008 : 0;
        const audioBoost = state === 'listening' ? audioLevel * 0.03 : 0;
        const freq = base + Math.sin(time) * 0.006 + audioBoost + hoverBoost;
        turbulenceRef.current.setAttribute('baseFrequency', `${freq} ${freq * 0.7}`);
        turbulenceRef.current.setAttribute('seed', String(Math.floor(time * 3) % 200));
      }
      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [state, audioLevel, isHovered, prefersReduced]);

  // Scale animation
  useEffect(() => {
    if (prefersReduced) return;
    const hoverScale = isHovered && state === 'idle'
      ? { scale: [0.98, 1.06, 0.98], dur: 2.5 }
      : null;
    const a = hoverScale || anim;

    controls.start({
      scale: a.scale,
      transition: {
        duration: a.dur,
        repeat: state === 'success' ? 0 : Infinity,
        ease: 'easeInOut',
      },
    });
  }, [state, anim, controls, prefersReduced, isHovered]);

  const colorStr = `rgb(${color.r}, ${color.g}, ${color.b})`;
  const colorDim = `rgba(${color.r}, ${color.g}, ${color.b}, 0.25)`;

  // Orb leans slightly toward mouse
  const svgOffset = isHovered && !isMobile ? {
    x: (mousePos.x - containerSize / 2) * 0.03,
    y: (mousePos.y - containerSize / 2) * 0.03,
  } : { x: 0, y: 0 };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{ width: containerSize, height: containerSize }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}
    >
      {/* Canvas particle swarm */}
      {!prefersReduced && (
        <ParticleCanvas
          width={containerSize}
          height={containerSize}
          orbRadius={r * (containerSize / svgSize) * 1.2}
          state={state}
          audioLevel={audioLevel}
          color={color}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          isHovered={isHovered}
        />
      )}

      {/* Ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: svgSize * 1.6,
          height: svgSize * 1.6,
          background: `radial-gradient(circle, ${colorDim}, transparent 55%)`,
        }}
        animate={{
          scale: isHovered ? [1.05, 1.18, 1.05] : [1, 1.08, 1],
          opacity: isHovered ? [0.4, 0.7, 0.4] : [0.25, 0.45, 0.25],
        }}
        transition={{ duration: isHovered ? 1.5 : anim.dur * 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* SVG orb core — leans toward mouse */}
      <motion.svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        animate={controls}
        className="relative z-10"
        style={{
          transform: `translate(${svgOffset.x}px, ${svgOffset.y}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <defs>
          <filter id="orb-warp" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency="0.012 0.009"
              numOctaves={isMobile ? 2 : 4}
              seed="42"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={
                state === 'thinking' ? 24
                  : state === 'listening' ? 18 + audioLevel * 25
                  : isHovered ? 16
                  : 10
              }
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <radialGradient id="orb-grad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor={colorStr} stopOpacity="0.95" />
            <stop offset="45%" stopColor={colorDim} />
            <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0.85" />
          </radialGradient>

          <radialGradient id="orb-core" cx="42%" cy="38%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isHovered ? '0.6' : '0.4'} />
            <stop offset="100%" stopColor={colorStr} stopOpacity="0.05" />
          </radialGradient>

          <filter id="orb-blur">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main body */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="url(#orb-grad)"
          filter={prefersReduced ? undefined : 'url(#orb-warp)'}
          opacity={0.92}
        />

        {/* Glass core */}
        <circle
          cx={cx - r * 0.12} cy={cy - r * 0.15}
          r={r * 0.5}
          fill="url(#orb-core)"
          filter="url(#orb-blur)"
          opacity={isHovered ? 0.9 : 0.75}
        />

        {/* Shimmer */}
        <motion.circle
          cx={cx - r * 0.08} cy={cy - r * 0.22}
          r={r * 0.07}
          fill="white"
          animate={{ opacity: isHovered ? [0.5, 1, 0.5] : [0.3, 0.7, 0.3] }}
          transition={{ duration: isHovered ? 1.2 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Reactive rings */}
        {(state === 'listening' || state === 'speaking') && (
          <>
            <motion.circle
              cx={cx} cy={cy} r={r + 8} fill="none" stroke={colorStr} strokeWidth={1.5}
              animate={{ r: [r + 8, r + 40 + audioLevel * 30, r + 8], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.circle
              cx={cx} cy={cy} r={r + 20} fill="none" stroke={colorStr} strokeWidth={0.8}
              animate={{ r: [r + 20, r + 60 + audioLevel * 40, r + 20], opacity: [0.2, 0.05, 0.2] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
            />
          </>
        )}

        {/* Thinking rings */}
        {state === 'thinking' && (
          <>
            <motion.circle
              cx={cx} cy={cy} r={r + 15} fill="none" stroke={colorStr} strokeWidth={1.5}
              strokeDasharray="6 14" opacity={0.35}
              animate={{ rotate: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
            <motion.circle
              cx={cx} cy={cy} r={r + 28} fill="none" stroke={colorStr} strokeWidth={0.8}
              strokeDasharray="3 18" opacity={0.18}
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          </>
        )}

        {/* Success burst */}
        {state === 'success' && (
          <>
            <motion.circle
              cx={cx} cy={cy} r={r} fill="none" stroke="rgb(34,197,94)" strokeWidth={3}
              initial={{ r, opacity: 1 }} animate={{ r: r + 90, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <motion.circle
              cx={cx} cy={cy} r={r} fill="none" stroke="rgb(153,255,153)" strokeWidth={1.5}
              initial={{ r, opacity: 0.7 }} animate={{ r: r + 65, opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.12 }}
            />
          </>
        )}
      </motion.svg>
    </div>
  );
}
