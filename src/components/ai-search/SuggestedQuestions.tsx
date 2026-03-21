'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  isMobile: boolean;
}

interface ThoughtBubble {
  textKey: string;
  triggerKey: string;
  position: { x: number; y: number }; // fraction of viewport
  mobilePosition: { x: number; y: number };
  animDelay: number;
  driftRange: number;
  driftDuration: number;
  cloudRadius: number; // base radius of the particle cloud
}

const THOUGHT_BUBBLES: ThoughtBubble[] = [
  {
    textKey: 'thought1',
    triggerKey: 'thought1Trigger',
    position: { x: 0.17, y: 0.22 },
    mobilePosition: { x: 0.12, y: 0.18 },
    animDelay: 0,
    driftRange: 8,
    driftDuration: 5,
    cloudRadius: 90,
  },
  {
    textKey: 'thought2',
    triggerKey: 'thought2Trigger',
    position: { x: 0.73, y: 0.17 },
    mobilePosition: { x: 0.62, y: 0.15 },
    animDelay: 0.4,
    driftRange: 7,
    driftDuration: 4.5,
    cloudRadius: 85,
  },
  {
    textKey: 'thought5',
    triggerKey: 'thought5Trigger',
    position: { x: 0.07, y: 0.48 },
    mobilePosition: { x: 0.05, y: 0.44 },
    animDelay: 0.7,
    driftRange: 6,
    driftDuration: 5.5,
    cloudRadius: 95,
  },
  {
    textKey: 'thought6',
    triggerKey: 'thought6Trigger',
    position: { x: 0.80, y: 0.50 },
    mobilePosition: { x: 0.68, y: 0.50 },
    animDelay: 1.0,
    driftRange: 9,
    driftDuration: 4.8,
    cloudRadius: 80,
  },
  {
    textKey: 'thought3',
    triggerKey: 'thought3Trigger',
    position: { x: 0.13, y: 0.74 },
    mobilePosition: { x: 0.08, y: 0.72 },
    animDelay: 0.5,
    driftRange: 7,
    driftDuration: 5.2,
    cloudRadius: 88,
  },
  {
    textKey: 'thought4',
    triggerKey: 'thought4Trigger',
    position: { x: 0.69, y: 0.76 },
    mobilePosition: { x: 0.58, y: 0.75 },
    animDelay: 0.8,
    driftRange: 8,
    driftDuration: 4.6,
    cloudRadius: 92,
  },
];

// ── Cloud particle system per thought bubble ──

interface CloudParticle {
  x: number;
  y: number;
  angle: number;
  orbit: number;
  r: number;
  alpha: number;
  speed: number;
  phase: number;
}

function createCloudParticles(count: number, radius: number): CloudParticle[] {
  const particles: CloudParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Gaussian-ish distribution: more particles near center
    const u = Math.random();
    const orbit = radius * (0.1 + Math.pow(u, 0.6) * 0.9);

    particles.push({
      x: Math.cos(angle) * orbit,
      y: Math.sin(angle) * orbit,
      angle,
      orbit,
      r: 0.3 + Math.random() * 1.2,
      alpha: 0.15 + Math.random() * 0.45,
      speed: 0.02 + Math.random() * 0.08,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return particles;
}

// ── Individual thought cloud with its own canvas ──

function ThoughtCloud({
  textKey,
  triggerKey,
  cx,
  cy,
  cloudRadius,
  animDelay,
  driftRange,
  driftDuration,
  isMobile,
  onSelect,
  isHovered: parentHovered,
}: {
  textKey: string;
  triggerKey: string;
  cx: number;
  cy: number;
  cloudRadius: number;
  animDelay: number;
  driftRange: number;
  driftDuration: number;
  isMobile: boolean;
  onSelect: (q: string) => void;
  isHovered: boolean;
}) {
  const t = useTranslations('aiSearch');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<CloudParticle[]>([]);
  const timeRef = useRef(animDelay * 10); // offset start time
  const animRef = useRef(0);
  const [hovered, setHovered] = useState(false);

  const mobileR = cloudRadius * 0.75;
  const r = isMobile ? mobileR : cloudRadius;
  const canvasSize = r * 2.6;
  const particleCount = isMobile ? 60 : 140;

  useEffect(() => {
    particlesRef.current = createCloudParticles(particleCount, r);
  }, [particleCount, r]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.008;
    const time = timeRef.current;
    const particles = particlesRef.current;
    const center = canvasSize / 2;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Breathing drift
    const driftY = Math.sin(time * 0.4) * driftRange;
    const breathScale = hovered ? 1.15 : 1 + Math.sin(time * 0.3) * 0.05;
    const glowIntensity = hovered ? 0.12 : 0.04 + Math.sin(time * 0.5) * 0.02;

    // Central nebula glow
    const cGrad = ctx.createRadialGradient(center, center + driftY, 0, center, center + driftY, r * 0.8);
    cGrad.addColorStop(0, `rgba(0, 180, 200, ${glowIntensity * 1.5})`);
    cGrad.addColorStop(0.4, `rgba(80, 100, 220, ${glowIntensity})`);
    cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(center, center + driftY, r * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Particles
    const activeAlphaMult = hovered ? 1.8 : 1;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.angle += p.speed * (hovered ? 1.5 : 1);
      p.phase += 0.01;

      const breathe = Math.sin(time * 0.5 + p.phase) * r * 0.08;
      const orbit = (p.orbit + breathe) * breathScale;

      const px = center + Math.cos(p.angle) * orbit;
      const py = center + driftY + Math.sin(p.angle) * orbit;

      // Distance fade from center
      const dx = px - center;
      const dy = py - (center + driftY);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const distFade = Math.max(0, 1 - dist / (r * 1.2));

      let alpha = p.alpha * distFade * activeAlphaMult;

      // Twinkle
      alpha *= 0.6 + 0.4 * Math.sin(time * 2 + p.phase * 3);

      if (alpha < 0.02) continue;

      // Color: cyan to purple gradient based on distance
      const colorT = Math.min(1, dist / r);
      const cr = Math.round(0 + colorT * 80);
      const cg = Math.round(180 - colorT * 80);
      const cb = Math.round(200 + colorT * 20);

      ctx.beginPath();
      ctx.arc(px, py, p.r * (hovered ? 1.3 : 1), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
      ctx.fill();

      // Glow halo on brighter particles
      if (alpha > 0.25 && p.r > 0.7) {
        ctx.beginPath();
        ctx.arc(px, py, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.1})`;
        ctx.fill();
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, [canvasSize, r, driftRange, hovered]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const fontSize = isMobile ? '0.68rem' : '0.82rem';
  const maxTextW = isMobile ? 110 : 150;

  return (
    <motion.div
      className="absolute pointer-events-auto"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        duration: 0.8,
        delay: animDelay * 0.5,
        ease: 'easeOut',
      }}
      style={{
        left: cx - canvasSize / 2,
        top: cy - canvasSize / 2,
        width: canvasSize,
        height: canvasSize,
      }}
    >
      {/* Particle cloud canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="absolute inset-0"
        style={{ pointerEvents: 'none' }}
      />

      {/* Clickable text area — centered in the cloud */}
      <motion.button
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(t(triggerKey))}
        whileHover={{ scale: 1.05 }}
        animate={{
          y: [0, -driftRange, 0],
        }}
        transition={{
          y: {
            duration: driftDuration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: animDelay,
          },
        }}
      >
        <span
          className="text-center italic transition-all duration-500 select-none"
          style={{
            fontSize,
            lineHeight: 1.4,
            maxWidth: maxTextW,
            color: hovered ? 'rgba(153, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.55)',
            textShadow: hovered
              ? '0 0 20px rgba(153, 255, 255, 0.4), 0 0 40px rgba(0, 180, 200, 0.2)'
              : '0 0 8px rgba(0, 180, 200, 0.15)',
          }}
        >
          {t(textKey)}
        </span>
      </motion.button>
    </motion.div>
  );
}

// ── Main component ──

export default function SuggestedQuestions({
  onSelect,
  isMobile,
}: SuggestedQuestionsProps) {
  const [vpSize, setVpSize] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const update = () => setVpSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <>
      {THOUGHT_BUBBLES.map((bubble, i) => {
        const pos = isMobile ? bubble.mobilePosition : bubble.position;
        const bx = pos.x * vpSize.w;
        const by = pos.y * vpSize.h;

        return (
          <ThoughtCloud
            key={i}
            textKey={bubble.textKey}
            triggerKey={bubble.triggerKey}
            cx={bx}
            cy={by}
            cloudRadius={isMobile ? bubble.cloudRadius * 0.7 : bubble.cloudRadius}
            animDelay={bubble.animDelay}
            driftRange={bubble.driftRange}
            driftDuration={bubble.driftDuration}
            isMobile={isMobile}
            onSelect={onSelect}
            isHovered={false}
          />
        );
      })}
    </>
  );
}
