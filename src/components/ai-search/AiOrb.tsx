'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { OrbState } from '@/types/ai-search';

interface AiOrbProps {
  state: OrbState;
  audioLevel?: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

const STATE_COLORS: Record<OrbState, { r: number; g: number; b: number }> = {
  idle: { r: 0, g: 180, b: 200 },
  listening: { r: 153, g: 255, b: 255 },
  thinking: { r: 245, g: 166, b: 35 },
  speaking: { r: 92, g: 224, b: 210 },
  success: { r: 34, g: 197, b: 94 },
};

// Secondary color for gradient particles (purple/indigo)
const STATE_COLORS_ALT: Record<OrbState, { r: number; g: number; b: number }> = {
  idle: { r: 80, g: 100, b: 220 },
  listening: { r: 120, g: 160, b: 255 },
  thinking: { r: 200, g: 120, b: 60 },
  speaking: { r: 60, g: 160, b: 200 },
  success: { r: 80, g: 220, b: 120 },
};

const STATE_ANIM: Record<OrbState, { scale: number[]; dur: number }> = {
  idle: { scale: [0.97, 1.03, 0.97], dur: 4 },
  listening: { scale: [0.88, 1.14, 0.88], dur: 1 },
  thinking: { scale: [0.96, 1.04, 0.96], dur: 0.9 },
  speaking: { scale: [0.93, 1.09, 0.93], dur: 0.6 },
  success: { scale: [1, 1.3, 1.2], dur: 0.5 },
};

const INTENSITY = 0.7;
const SPIRAL_ARMS = 4;

// ── Particle types ──

interface Particle {
  x: number;
  y: number;
  baseOrbit: number;
  r: number;
  alpha: number;
  speed: number;
  angle: number;
  phase: number;
  layer: number;
  isSpiral: boolean;
  twinkleSpeed: number; // 0 = no twinkle, >0 = twinkle rate
  colorBlend: number;   // 0 = primary color, 1 = alt color
}

interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

// ── Creation functions ──

function createStars(count: number, w: number, h: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.3 + Math.random() * 1.2,
      alpha: 0.1 + Math.random() * 0.5,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.5 + Math.random() * 2,
    });
  }
  return stars;
}

function createParticles(count: number, cx: number, cy: number, maxRadius: number): Particle[] {
  const particles: Particle[] = [];
  const uniformCount = Math.floor(count * 0.65);

  for (let i = 0; i < count; i++) {
    const isSpiral = i >= uniformCount;
    const layer = i % 3;

    let orbit: number;
    let angle: number;

    if (isSpiral) {
      const arm = i % SPIRAL_ARMS;
      const armAngle = (arm / SPIRAL_ARMS) * Math.PI * 2;
      const spiralIdx = i - uniformCount;
      const spiralTotal = count - uniformCount;
      const t = spiralIdx / spiralTotal;
      orbit = maxRadius * (0.12 + t * 2.3);
      const spiralTightness = 0.5;
      const distRatio = orbit / (maxRadius * 2.5);
      const scatter = (Math.random() - 0.5) * Math.PI * 0.55 * (0.25 + distRatio * 0.75);
      angle = armAngle + distRatio * Math.PI * 2.5 * spiralTightness + scatter;
    } else {
      angle = Math.random() * Math.PI * 2;
      orbit = maxRadius * (0.06 + Math.sqrt(Math.random()) * 2.3);
    }

    const distRatio = orbit / (maxRadius * 2.3);
    const sizeMult = 1.0 - distRatio * 0.35;

    // Color blend: inner particles = primary, outer = alt color
    const colorBlend = Math.min(1, distRatio * 1.3 + (Math.random() - 0.5) * 0.3);

    // Some particles twinkle (10%)
    const twinkleSpeed = Math.random() < 0.1 ? 1.5 + Math.random() * 3 : 0;

    particles.push({
      x: cx + Math.cos(angle) * orbit,
      y: cy + Math.sin(angle) * orbit,
      baseOrbit: orbit,
      r: layer === 0
        ? (0.2 + Math.random() * 1.0) * sizeMult
        : (0.1 + Math.random() * 0.55) * sizeMult,
      alpha: layer === 0
        ? 0.2 + Math.random() * 0.5
        : 0.06 + Math.random() * 0.28,
      speed: 0.012 + Math.random() * 0.06,
      angle,
      phase: Math.random() * Math.PI * 2,
      layer,
      isSpiral,
      twinkleSpeed,
      colorBlend,
    });
  }
  return particles;
}

// ── Energy pulse ring ──
interface EnergyPulse {
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  width: number;
}

// ── Fullscreen particle canvas ──

function ParticleCanvas({
  width,
  height,
  orbRadius,
  state,
  audioLevel,
  color,
  altColor,
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
  altColor: { r: number; g: number; b: number };
  mouseX: number;
  mouseY: number;
  isHovered: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const pulsesRef = useRef<EnergyPulse[]>([]);
  const timeRef = useRef(0);
  const animRef = useRef(0);
  const lastPulseRef = useRef(0);

  const cx = width / 2;
  const cy = height / 2;
  const isMobile = useIsMobile();
  const count = isMobile ? 100000 : 400000;
  const starCount = isMobile ? 200 : 600;
  const maxRadius = Math.max(width, height) * 0.50;

  useEffect(() => {
    particlesRef.current = createParticles(count, cx, cy, maxRadius);
    starsRef.current = createStars(starCount, width, height);
  }, [count, starCount, cx, cy, maxRadius, width, height]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.005;
    const t = timeRef.current;
    const particles = particlesRef.current;
    const stars = starsRef.current;
    const pulses = pulsesRef.current;

    ctx.clearRect(0, 0, width, height);

    // ═══════════════════════════════════════
    // 1. BACKGROUND STARFIELD — twinkling
    // ═══════════════════════════════════════
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
      const a = s.alpha * twinkle;
      if (a < 0.03) continue;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${a})`;
      ctx.fill();

      // Bright stars get a soft cross/glow
      if (s.r > 0.9 && a > 0.3) {
        ctx.globalAlpha = a * 0.3;
        ctx.fillStyle = 'rgba(200, 230, 255, 1)';
        ctx.fillRect(s.x - s.r * 3, s.y - 0.3, s.r * 6, 0.6);
        ctx.fillRect(s.x - 0.3, s.y - s.r * 3, 0.6, s.r * 6);
        ctx.globalAlpha = 1;
      }
    }

    // ═══════════════════════════════════════
    // 2. NEBULA CLOUDS — big soft glows
    // ═══════════════════════════════════════
    const nebulaPhase = Math.sin(t * 0.3) * 0.012;
    const nebulaR = maxRadius * 0.5;
    const nebulae = [
      { x: cx - maxRadius * 0.6, y: cy - maxRadius * 0.5, a: 0.04 + nebulaPhase, cr: color.r, cg: color.g, cb: color.b },
      { x: cx + maxRadius * 0.6, y: cy - maxRadius * 0.4, a: 0.035 + nebulaPhase, cr: altColor.r, cg: altColor.g, cb: altColor.b },
      { x: cx - maxRadius * 0.5, y: cy + maxRadius * 0.55, a: 0.03 + nebulaPhase, cr: altColor.r, cg: altColor.g, cb: altColor.b },
      { x: cx + maxRadius * 0.55, y: cy + maxRadius * 0.5, a: 0.04 + nebulaPhase, cr: color.r, cg: color.g, cb: color.b },
      { x: cx, y: cy - maxRadius * 0.7, a: 0.025 + nebulaPhase, cr: color.r * 0.7, cg: color.g * 0.8, cb: color.b },
      { x: cx, y: cy + maxRadius * 0.7, a: 0.025 + nebulaPhase, cr: altColor.r * 0.8, cg: altColor.g, cb: altColor.b * 0.7 },
    ];

    for (const n of nebulae) {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, nebulaR);
      grad.addColorStop(0, `rgba(${n.cr}, ${n.cg}, ${n.cb}, ${n.a})`);
      grad.addColorStop(0.5, `rgba(${n.cr}, ${n.cg}, ${n.cb}, ${n.a * 0.4})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, nebulaR, 0, Math.PI * 2);
      ctx.fill();
    }

    // ═══════════════════════════════════════
    // 3. CENTRAL GLOW — warm inner aura
    // ═══════════════════════════════════════
    const centralGlowR = orbRadius * 3.5;
    const centralAlpha = 0.06 + Math.sin(t * 0.8) * 0.02;
    const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centralGlowR);
    cGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${centralAlpha * 1.5})`);
    cGrad.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${centralAlpha * 0.6})`);
    cGrad.addColorStop(0.7, `rgba(${altColor.r}, ${altColor.g}, ${altColor.b}, ${centralAlpha * 0.2})`);
    cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, centralGlowR, 0, Math.PI * 2);
    ctx.fill();

    // ═══════════════════════════════════════
    // 4. ENERGY PULSES — expanding rings
    // ═══════════════════════════════════════
    // Spawn pulses periodically (every ~4s idle, faster when active)
    const pulseInterval = state === 'listening' || state === 'speaking' ? 1.5 : state === 'thinking' ? 2 : 4;
    if (t - lastPulseRef.current > pulseInterval) {
      lastPulseRef.current = t;
      pulses.push({
        radius: orbRadius * 0.8,
        maxRadius: maxRadius * 1.5,
        alpha: 0.25,
        speed: state === 'listening' ? 2.5 : 1.2,
        width: state === 'listening' ? 2.5 : 1.5,
      });
    }

    // Draw and update pulses
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i];
      pulse.radius += pulse.speed;
      pulse.alpha *= 0.993;

      if (pulse.alpha < 0.005 || pulse.radius > pulse.maxRadius) {
        pulses.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(cx, cy, pulse.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${pulse.alpha})`;
      ctx.lineWidth = pulse.width;
      ctx.stroke();
    }

    // ═══════════════════════════════════════
    // 5. PARTICLES — the main swarm
    // ═══════════════════════════════════════
    const isActive = state === 'listening' || state === 'speaking';
    const isThinking = state === 'thinking';
    const speedMult = isActive ? 1.4 + audioLevel * 1.5 : isThinking ? 1.2 : isHovered ? 1.08 : 1;
    const orbitPulse = isActive ? 1 + audioLevel * 0.15 : isHovered ? 1.02 : 1;

    const mx = mouseX;
    const my = mouseY;
    const mouseActive = isHovered && mx > 0 && my > 0;
    const mouseInfluenceRadius = orbRadius * 1.2;

    const galaxyRot = t * 0.02;
    const maxDist = maxRadius * 2.8;
    const alphaSkip = isMobile ? 0.015 : 0.008;

    const turbSin = Math.sin(t * 1.1);
    const turbCos = Math.cos(t * 1.1);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Differential rotation — inner spins faster
      const distRatio = p.baseOrbit / maxDist;
      const diffSpeed = 1.0 + (1.0 - distRatio) * 0.3;

      p.angle += p.speed * speedMult * 0.0004 * diffSpeed + galaxyRot * 0.0002;
      p.phase += 0.005;

      const breathe = Math.sin(t * 0.35 + p.phase) * orbRadius * 0.08;
      const targetOrbit = (p.baseOrbit + breathe) * orbitPulse;

      let targetX = cx + Math.cos(p.angle) * targetOrbit;
      let targetY = cy + Math.sin(p.angle) * targetOrbit;

      // Mouse interaction
      if (mouseActive) {
        const dmx = p.x - mx;
        const dmy = p.y - my;
        if (Math.abs(dmx) < mouseInfluenceRadius && Math.abs(dmy) < mouseInfluenceRadius) {
          const distToMouse = Math.sqrt(dmx * dmx + dmy * dmy);
          if (distToMouse < mouseInfluenceRadius && distToMouse > 1) {
            const force = 1 - distToMouse / mouseInfluenceRadius;
            if (p.layer === 0) {
              targetX += (dmx / distToMouse) * force * 5;
              targetY += (dmy / distToMouse) * force * 5;
            } else {
              targetX -= (dmx / distToMouse) * force * 3;
              targetY -= (dmy / distToMouse) * force * 3;
            }
          }
        }
      }

      // Smooth follow — very gentle, peaceful drift
      const followSpeed = p.layer === 0 ? 0.015 : p.layer === 1 ? 0.01 : 0.006;
      p.x += (targetX - p.x) * followSpeed;
      p.y += (targetY - p.y) * followSpeed;

      // Subtle turbulence
      p.x += turbSin * 0.08 + ((i & 0xff) - 128) * 0.0003;
      p.y += turbCos * 0.08 + ((i >> 8 & 0xff) - 128) * 0.0003;

      // Skip offscreen
      if (p.x < -8 || p.x > width + 8 || p.y < -8 || p.y > height + 8) continue;

      // Distance-based alpha
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const distFade = Math.max(0, 1 - dist / maxDist);

      let finalAlpha = p.alpha * distFade;

      // Mouse glow
      if (mouseActive) {
        const dm2x = p.x - mx;
        const dm2y = p.y - my;
        if (Math.abs(dm2x) < mouseInfluenceRadius * 0.5 && Math.abs(dm2y) < mouseInfluenceRadius * 0.5) {
          const distM = Math.sqrt(dm2x * dm2x + dm2y * dm2y);
          if (distM < mouseInfluenceRadius * 0.5) {
            finalAlpha = Math.min(1, finalAlpha + (1 - distM / (mouseInfluenceRadius * 0.5)) * 0.15);
          }
        }
      }

      // State modulation
      if (isActive) {
        finalAlpha *= 0.6 + audioLevel * 0.55;
      } else if (isHovered) {
        finalAlpha *= 0.65 + Math.sin(t * 2 + p.phase) * 0.25;
      } else {
        finalAlpha *= 0.45 + Math.sin(t + p.phase) * 0.2;
      }

      // Twinkle effect — some particles flash brightly
      if (p.twinkleSpeed > 0) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * p.twinkleSpeed + p.phase * 3);
        finalAlpha *= 0.4 + twinkle * 1.2;
      }

      finalAlpha *= INTENSITY;

      if (finalAlpha < alphaSkip) continue;

      // Interpolate between primary and alt color based on distance
      const cr = Math.round(color.r + (altColor.r - color.r) * p.colorBlend);
      const cg = Math.round(color.g + (altColor.g - color.g) * p.colorBlend);
      const cb = Math.round(color.b + (altColor.b - color.b) * p.colorBlend);

      const sizeBoost = isHovered ? 1.2 : 1;
      const size = p.r * sizeBoost;

      // Use rects for all small particles (vast majority) — much faster than arc
      if (size < 1.0) {
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${finalAlpha})`;
        ctx.fillRect(p.x, p.y, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${finalAlpha})`;
        ctx.fill();
      }
    }

    // ═══════════════════════════════════════
    // 6. CONNECTION LINES — hover only
    // ═══════════════════════════════════════
    if (mouseActive && !isMobile) {
      ctx.lineWidth = 0.3;
      const mInflSq = (mouseInfluenceRadius * 0.35) ** 2;
      const nearby: Particle[] = [];
      for (let i = 0; i < particles.length && nearby.length < 25; i++) {
        const p = particles[i];
        const d2 = (p.x - mx) ** 2 + (p.y - my) ** 2;
        if (d2 < mInflSq) nearby.push(p);
      }

      for (let i = 0; i < nearby.length; i++) {
        for (let j = i + 1; j < nearby.length; j++) {
          const a = nearby[i];
          const b = nearby[j];
          const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (d < 30) {
            const lineAlpha = (1 - d / 30) * 0.12 * INTENSITY;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${lineAlpha})`;
            ctx.stroke();
          }
        }
      }
    }

    // ═══════════════════════════════════════
    // 7. VORTEX STREAKS — fast inner particles
    // ═══════════════════════════════════════
    const streakCount = isActive ? 6 : isThinking ? 4 : 3;
    for (let i = 0; i < streakCount; i++) {
      const streakAngle = t * (0.2 + i * 0.1) + (i * Math.PI * 2) / streakCount;
      const streakR = orbRadius * (0.6 + Math.sin(t * 0.5 + i) * 0.2);
      const sx = cx + Math.cos(streakAngle) * streakR;
      const sy = cy + Math.sin(streakAngle) * streakR;
      const tailLen = orbRadius * 0.4;
      const sx2 = cx + Math.cos(streakAngle - 0.3) * (streakR + tailLen);
      const sy2 = cy + Math.sin(streakAngle - 0.3) * (streakR + tailLen);

      const sGrad = ctx.createLinearGradient(sx, sy, sx2, sy2);
      const streakAlpha = 0.15 + (isActive ? audioLevel * 0.3 : 0);
      sGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${streakAlpha})`);
      sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx2, sy2);
      ctx.strokeStyle = sGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [width, height, cx, cy, orbRadius, state, audioLevel, color, altColor, mouseX, mouseY, isHovered, isMobile, maxRadius]);

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

export default function AiOrb({ state, audioLevel = 0, canvasWidth, canvasHeight }: AiOrbProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const animFrameRef = useRef<number>(0);
  const controls = useAnimation();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [viewportSize, setViewportSize] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const update = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const cw = canvasWidth ?? viewportSize.w;
  const ch = canvasHeight ?? viewportSize.h;

  const svgSize = isMobile ? 260 : 400;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = svgSize * 0.30;

  const color = STATE_COLORS[state];
  const altColor = STATE_COLORS_ALT[state];
  const anim = STATE_ANIM[state];

  const prefersReduced = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

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
  const altColorStr = `rgb(${altColor.r}, ${altColor.g}, ${altColor.b})`;

  const svgOffset = isHovered && !isMobile ? {
    x: (mousePos.x - cw / 2) * 0.02,
    y: (mousePos.y - ch / 2) * 0.02,
  } : { x: 0, y: 0 };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}
    >
      {/* Fullscreen particle canvas */}
      {!prefersReduced && (
        <ParticleCanvas
          width={cw}
          height={ch}
          orbRadius={r * (Math.min(cw, ch) / svgSize) * 0.6}
          state={state}
          audioLevel={audioLevel}
          color={color}
          altColor={altColor}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          isHovered={isHovered}
        />
      )}

      {/* Outer atmospheric glow — multi-layered */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: svgSize * 2.2,
          height: svgSize * 2.2,
          background: `radial-gradient(circle, rgba(${altColor.r}, ${altColor.g}, ${altColor.b}, 0.08), transparent 60%)`,
        }}
        animate={{
          scale: [1.02, 1.12, 1.02],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Inner ambient glow */}
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

      {/* SVG orb core */}
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
            <stop offset="30%" stopColor={colorStr} stopOpacity="0.6" />
            <stop offset="60%" stopColor={altColorStr} stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0.85" />
          </radialGradient>

          <radialGradient id="orb-core" cx="42%" cy="38%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isHovered ? '0.65' : '0.45'} />
            <stop offset="50%" stopColor={colorStr} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colorStr} stopOpacity="0.02" />
          </radialGradient>

          <filter id="orb-blur">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main orb body */}
        <circle cx={cx} cy={cy} r={r} fill="url(#orb-grad)" filter={prefersReduced ? undefined : 'url(#orb-warp)'} opacity={0.92} />

        {/* Inner depth layer */}
        <circle cx={cx + r * 0.05} cy={cy + r * 0.08} r={r * 0.7} fill={`rgba(${altColor.r}, ${altColor.g}, ${altColor.b}, 0.08)`} filter={prefersReduced ? undefined : 'url(#orb-warp)'} />

        {/* Glass core highlight */}
        <circle cx={cx - r * 0.12} cy={cy - r * 0.15} r={r * 0.5} fill="url(#orb-core)" filter="url(#orb-blur)" opacity={isHovered ? 0.9 : 0.75} />

        {/* Primary shimmer */}
        <motion.circle
          cx={cx - r * 0.08} cy={cy - r * 0.22} r={r * 0.07}
          fill="white"
          animate={{ opacity: isHovered ? [0.5, 1, 0.5] : [0.3, 0.7, 0.3] }}
          transition={{ duration: isHovered ? 1.2 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Secondary shimmer — smaller, offset */}
        <motion.circle
          cx={cx + r * 0.15} cy={cy - r * 0.1} r={r * 0.035}
          fill="white"
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />

        {/* Subtle rim light */}
        <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke={colorStr} strokeWidth={0.5} opacity={0.15} />

        {/* Reactive rings */}
        {(state === 'listening' || state === 'speaking') && (
          <>
            <motion.circle cx={cx} cy={cy} r={r + 8} fill="none" stroke={colorStr} strokeWidth={1.5}
              animate={{ r: [r + 8, r + 40 + audioLevel * 30, r + 8], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.circle cx={cx} cy={cy} r={r + 20} fill="none" stroke={colorStr} strokeWidth={0.8}
              animate={{ r: [r + 20, r + 60 + audioLevel * 40, r + 20], opacity: [0.2, 0.05, 0.2] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
            />
            <motion.circle cx={cx} cy={cy} r={r + 35} fill="none" stroke={altColorStr} strokeWidth={0.5}
              animate={{ r: [r + 35, r + 80 + audioLevel * 35, r + 35], opacity: [0.1, 0.03, 0.1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
          </>
        )}

        {/* Thinking rings */}
        {state === 'thinking' && (
          <>
            <motion.circle cx={cx} cy={cy} r={r + 15} fill="none" stroke={colorStr} strokeWidth={1.5}
              strokeDasharray="6 14" opacity={0.35}
              animate={{ rotate: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
            <motion.circle cx={cx} cy={cy} r={r + 28} fill="none" stroke={colorStr} strokeWidth={0.8}
              strokeDasharray="3 18" opacity={0.18}
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
            <motion.circle cx={cx} cy={cy} r={r + 42} fill="none" stroke={altColorStr} strokeWidth={0.4}
              strokeDasharray="2 22" opacity={0.1}
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          </>
        )}

        {/* Success burst */}
        {state === 'success' && (
          <>
            <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(34,197,94)" strokeWidth={3}
              initial={{ r, opacity: 1 }} animate={{ r: r + 90, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(153,255,153)" strokeWidth={1.5}
              initial={{ r, opacity: 0.7 }} animate={{ r: r + 65, opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.12 }}
            />
          </>
        )}
      </motion.svg>
    </div>
  );
}
