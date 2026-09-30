// Decorative particle constellation. Pauses when the tab is hidden and is skipped
// entirely for users who prefer reduced motion.
import { debounce, prefersReducedMotion } from './util.js';

const LINK_DISTANCE = 140;

export function initBackground(canvas) {
  if (!canvas || prefersReducedMotion()) {
    if (canvas) canvas.hidden = true;
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let particles = [];
  let frame = null;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(55, Math.floor(width / 30));
    particles = Array.from({ length: count }, (_, i) => particles[i] || spawn());
  }

  function spawn() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2 + 1,
      rgb: Math.random() > 0.4 ? '212, 175, 55' : '16, 185, 129',
    };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const maxSq = LINK_DISTANCE * LINK_DISTANCE;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x = (p.x + p.vx + width) % width;
      p.y = (p.y + p.vy + height) % height;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.rgb}, 0.6)`;
      ctx.fill();
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < maxSq) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${p.rgb}, ${(1 - Math.sqrt(distSq) / LINK_DISTANCE) * 0.15})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }
    frame = requestAnimationFrame(draw);
  }

  function start() {
    if (frame === null) frame = requestAnimationFrame(draw);
  }
  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }

  resize();
  start();
  window.addEventListener('resize', debounce(resize, 200));
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}
