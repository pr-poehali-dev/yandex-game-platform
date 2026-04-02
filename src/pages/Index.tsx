import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

type Screen = "menu" | "levels" | "leaderboard" | "game" | "result";

// Время в секундах для получения звёзд: [3 звезды, 2 звезды, 1 звезда]
const LEVEL_TIME_THRESHOLDS: Record<number, [number, number, number]> = {};
for (let i = 1; i <= 15; i++) {
  const base = 20 + i * 5;
  LEVEL_TIME_THRESHOLDS[i] = [base, base * 1.6, base * 2.5];
}

type LevelProgress = { stars: number; bestTime: number | null };
type Progress = Record<number, LevelProgress>;

const LEVELS_CONFIG = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  world: Math.floor(i / 5) + 1,
}));

const GAME_MODES = [
  { id: "platformer", icon: "Footprints", label: "Платформер", color: "var(--pixel-green)", desc: "Прыжки и бег" },
  { id: "puzzle", icon: "Puzzle", label: "Головоломка", color: "var(--pixel-cyan)", desc: "Логика и мышление" },
  { id: "shooter", icon: "Crosshair", label: "Шутер", color: "var(--pixel-red)", desc: "Стрельба и экшн" },
  { id: "roguelike", icon: "Sword", label: "Рогалик", color: "var(--pixel-purple)", desc: "Случайные уровни" },
  { id: "strategy", icon: "Map", label: "Стратегия", color: "var(--pixel-yellow)", desc: "Тактика и ресурсы" },
];

const LEADERBOARD = [
  { rank: 1, name: "PIXEL_KING", score: 98750, level: 15, badge: "👑" },
  { rank: 2, name: "RETRO_ACE", score: 87200, level: 14, badge: "⚔️" },
  { rank: 3, name: "BYTE_HERO", score: 76400, level: 13, badge: "🛡️" },
  { rank: 4, name: "NEON_WOLF", score: 65100, level: 12, badge: "🐺" },
  { rank: 5, name: "GRID_SAGE", score: 54800, level: 11, badge: "🔮" },
  { rank: 6, name: "DARK_PIXEL", score: 43600, level: 10, badge: "💀" },
  { rank: 7, name: "STAR_RUN", score: 32900, level: 9, badge: "⭐" },
  { rank: 8, name: "BIT_STORM", score: 24100, level: 8, badge: "⚡" },
  { rank: 9, name: "ROGUE_X", score: 16700, level: 7, badge: "🎯" },
];

const ACHIEVEMENTS = [
  { id: 1, icon: "⚡", name: "Быстрый старт", desc: "Пройти уровень за 30 сек", check: (p: Progress) => Object.values(p).some(v => v.bestTime !== null && v.bestTime <= 30) },
  { id: 2, icon: "💎", name: "Коллекционер", desc: "Пройти 5 уровней", check: (p: Progress) => Object.values(p).filter(v => v.stars > 0).length >= 5 },
  { id: 3, icon: "🔥", name: "Без смертей", desc: "Получить 3★ хоть раз", check: (p: Progress) => Object.values(p).some(v => v.stars === 3) },
  { id: 4, icon: "🌟", name: "Мастер", desc: "3★ на 3 уровнях", check: (p: Progress) => Object.values(p).filter(v => v.stars === 3).length >= 3 },
  { id: 5, icon: "🏆", name: "Легенда", desc: "Пройти все 15 уровней", check: (p: Progress) => Object.values(p).filter(v => v.stars > 0).length >= 15 },
];

function calcStars(levelId: number, elapsed: number): number {
  const [t3, t2, t1] = LEVEL_TIME_THRESHOLDS[levelId];
  if (elapsed <= t3) return 3;
  if (elapsed <= t2) return 2;
  if (elapsed <= t1) return 1;
  return 1;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}м ${s}с` : `${s}с`;
}

// ─── Pixel character sprite ──────────────────────────────────────────────────
function PixelChar({ color = "var(--pixel-green)", size = 8 }: { color?: string; size?: number }) {
  const pixels = [
    0,0,1,1,1,1,0,0,
    0,1,1,1,1,1,1,0,
    0,1,0,1,1,0,1,0,
    0,1,1,1,1,1,1,0,
    0,0,1,0,0,1,0,0,
    0,1,1,1,1,1,1,0,
    0,1,0,0,0,0,1,0,
    0,0,1,0,0,1,0,0,
  ];
  return (
    <div className="animate-float" style={{ lineHeight: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(8, ${size}px)` }}>
        {pixels.map((px, i) => (
          <div key={i} style={{
            width: size, height: size,
            background: px ? color : 'transparent',
            boxShadow: px ? `0 0 4px ${color}` : 'none',
          }} />
        ))}
      </div>
    </div>
  );
}

function Stars({ count, max = 3, size = 10 }: { count: number; max?: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{
          fontSize: size,
          color: i < count ? 'var(--pixel-yellow)' : '#333',
          textShadow: i < count ? '0 0 6px var(--pixel-yellow)' : 'none',
        }}>★</span>
      ))}
    </div>
  );
}

// ─── GAME SCREEN ─────────────────────────────────────────────────────────────
type Vec2 = { x: number; y: number };

const TILE = 32;
const GW = 20; // grid width
const GH = 14; // grid height
const CANVAS_W = GW * TILE;
const CANVAS_H = GH * TILE;
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const MOVE_SPEED = 4;

// Map: 0=air, 1=ground, 2=coin, 3=finish
function buildMap(levelId: number): number[][] {
  const map: number[][] = Array.from({ length: GH }, () => Array(GW).fill(0));
  // Floor
  for (let x = 0; x < GW; x++) map[GH - 1][x] = 1;
  // Platform pattern based on level
  const seed = levelId * 7;
  const numPlatforms = 3 + Math.floor(levelId / 3);
  for (let p = 0; p < numPlatforms; p++) {
    const px = 2 + ((seed * (p + 1) * 3) % (GW - 6));
    const py = GH - 3 - (p % 4) * 2;
    const len = 2 + (p % 3);
    for (let x = px; x < px + len && x < GW - 1; x++) map[py][x] = 1;
    // Coin above platform
    if (px + 1 < GW - 1) map[py - 1][px + 1] = 2;
  }
  // Extra coins on floor
  for (let x = 3; x < GW - 3; x += 4) map[GH - 2][x] = 2;
  // Finish flag at right
  map[GH - 2][GW - 2] = 3;
  return map;
}

function isSolid(map: number[][], tx: number, ty: number) {
  if (ty < 0 || ty >= GH || tx < 0 || tx >= GW) return false;
  return map[ty][tx] === 1;
}

interface GameState {
  pos: Vec2;
  vel: Vec2;
  onGround: boolean;
  coins: Set<string>;
  finished: boolean;
  map: number[][];
}

function GameScreen({
  levelId,
  onFinish,
  onBack,
}: {
  levelId: number;
  onFinish: (elapsed: number, coins: number) => void;
  onBack: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({
    pos: { x: TILE, y: (GH - 2) * TILE },
    vel: { x: 0, y: 0 },
    onGround: false,
    coins: new Set(),
    finished: false,
    map: buildMap(levelId),
  });
  const keysRef = useRef<Set<string>>(new Set());
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const animRef = useRef<number>(0);
  const thresholds = LEVEL_TIME_THRESHOLDS[levelId];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const gs = stateRef.current;

    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid
    ctx.strokeStyle = 'rgba(0,255,65,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GW; x++) { ctx.beginPath(); ctx.moveTo(x * TILE, 0); ctx.lineTo(x * TILE, CANVAS_H); ctx.stroke(); }
    for (let y = 0; y <= GH; y++) { ctx.beginPath(); ctx.moveTo(0, y * TILE); ctx.lineTo(CANVAS_W, y * TILE); ctx.stroke(); }

    // Draw tiles
    for (let ty = 0; ty < GH; ty++) {
      for (let tx = 0; tx < GW; tx++) {
        const cell = gs.map[ty][tx];
        const px = tx * TILE; const py = ty * TILE;
        if (cell === 1) {
          ctx.fillStyle = '#1a4d1a';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = '#00ff41';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
          ctx.fillStyle = '#00ff4133';
          ctx.fillRect(px + 2, py + 2, TILE - 4, 4);
        } else if (cell === 2 && !gs.coins.has(`${tx},${ty}`)) {
          const t = Date.now() / 400;
          const cy = py + TILE / 2 + Math.sin(t + tx) * 3;
          ctx.fillStyle = '#ffd700';
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 8;
          ctx.fillRect(px + TILE / 2 - 5, cy - 5, 10, 10);
          ctx.shadowBlur = 0;
        } else if (cell === 3) {
          // Finish flag
          ctx.fillStyle = '#00ffff';
          ctx.fillRect(px + TILE / 2 - 1, py + 4, 3, TILE - 8);
          ctx.fillStyle = '#00ff41';
          ctx.shadowColor = '#00ff41';
          ctx.shadowBlur = 12;
          ctx.fillRect(px + TILE / 2 + 2, py + 4, 12, 8);
          ctx.shadowBlur = 0;
        }
      }
    }

    // Player
    const px = Math.round(gs.pos.x);
    const py = Math.round(gs.pos.y);
    const facing = gs.vel.x >= 0 ? 1 : -1;
    const sprite = [
      0,0,1,1,1,1,0,0,
      0,1,1,1,1,1,1,0,
      0,1,0,1,1,0,1,0,
      0,1,1,1,1,1,1,0,
      0,0,1,0,0,1,0,0,
      0,1,1,1,1,1,1,0,
      0,1,0,0,0,0,1,0,
      0,0,1,0,0,1,0,0,
    ];
    const pw = 4; const ph = 4;
    ctx.save();
    if (facing < 0) { ctx.translate(px + TILE, 0); ctx.scale(-1, 1); }
    sprite.forEach((bit, i) => {
      if (!bit) return;
      const sx = (facing < 0 ? 0 : px) + (i % 8) * pw;
      const sy = py + Math.floor(i / 8) * ph;
      ctx.fillStyle = '#00ff41';
      ctx.shadowColor = '#00ff41';
      ctx.shadowBlur = 4;
      ctx.fillRect(sx, sy, pw, ph);
    });
    ctx.shadowBlur = 0;
    ctx.restore();
  }, []);

  const tick = useCallback(() => {
    const gs = stateRef.current;
    if (gs.finished) return;
    const keys = keysRef.current;

    // Movement
    gs.vel.x = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) gs.vel.x = -MOVE_SPEED;
    if (keys.has('ArrowRight') || keys.has('KeyD')) gs.vel.x = MOVE_SPEED;
    if ((keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space')) && gs.onGround) {
      gs.vel.y = JUMP_FORCE;
      gs.onGround = false;
    }

    gs.vel.y += GRAVITY;
    if (gs.vel.y > 18) gs.vel.y = 18;

    // X movement + collision
    gs.pos.x += gs.vel.x;
    if (gs.pos.x < 0) gs.pos.x = 0;
    if (gs.pos.x > (GW - 1) * TILE) gs.pos.x = (GW - 1) * TILE;
    const txL = Math.floor(gs.pos.x / TILE);
    const txR = Math.floor((gs.pos.x + TILE - 1) / TILE);
    const tyT = Math.floor(gs.pos.y / TILE);
    const tyB = Math.floor((gs.pos.y + TILE - 1) / TILE);
    if (gs.vel.x > 0 && (isSolid(gs.map, txR, tyT) || isSolid(gs.map, txR, tyB))) {
      gs.pos.x = txR * TILE - TILE; gs.vel.x = 0;
    }
    if (gs.vel.x < 0 && (isSolid(gs.map, txL, tyT) || isSolid(gs.map, txL, tyB))) {
      gs.pos.x = (txL + 1) * TILE; gs.vel.x = 0;
    }

    // Y movement + collision
    gs.pos.y += gs.vel.y;
    const txL2 = Math.floor(gs.pos.x / TILE);
    const txR2 = Math.floor((gs.pos.x + TILE - 1) / TILE);
    const tyT2 = Math.floor(gs.pos.y / TILE);
    const tyB2 = Math.floor((gs.pos.y + TILE - 1) / TILE);
    gs.onGround = false;
    if (gs.vel.y > 0 && (isSolid(gs.map, txL2, tyB2) || isSolid(gs.map, txR2, tyB2))) {
      gs.pos.y = tyB2 * TILE - TILE; gs.vel.y = 0; gs.onGround = true;
    }
    if (gs.vel.y < 0 && (isSolid(gs.map, txL2, tyT2) || isSolid(gs.map, txR2, tyT2))) {
      gs.pos.y = (tyT2 + 1) * TILE; gs.vel.y = 0;
    }
    // Fall off bottom → respawn
    if (gs.pos.y > GH * TILE) { gs.pos = { x: TILE, y: (GH - 2) * TILE }; gs.vel = { x: 0, y: 0 }; }

    // Coin pickup
    const pcx = Math.floor((gs.pos.x + TILE / 2) / TILE);
    const pcy = Math.floor((gs.pos.y + TILE / 2) / TILE);
    const key = `${pcx},${pcy}`;
    if (gs.map[pcy]?.[pcx] === 2 && !gs.coins.has(key)) {
      gs.coins.add(key);
      setCoinCount(gs.coins.size);
    }

    // Finish
    if (gs.map[pcy]?.[pcx] === 3) {
      gs.finished = true;
      const secs = Math.floor((Date.now() - startRef.current) / 1000);
      onFinish(secs, gs.coins.size);
    }

    setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    draw();
    animRef.current = requestAnimationFrame(tick);
  }, [draw, onFinish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { keysRef.current.add(e.code); e.preventDefault(); };
    const offKey = (e: KeyboardEvent) => { keysRef.current.delete(e.code); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', offKey);
    animRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', offKey);
      cancelAnimationFrame(animRef.current);
    };
  }, [tick]);

  // Mobile controls
  const pressKey = (code: string) => keysRef.current.add(code);
  const releaseKey = (code: string) => keysRef.current.delete(code);

  const starColor = elapsed <= thresholds[0] ? 'var(--pixel-green)' : elapsed <= thresholds[1] ? 'var(--pixel-yellow)' : 'var(--pixel-red)';
  const starsPreview = elapsed <= thresholds[0] ? 3 : elapsed <= thresholds[1] ? 2 : 1;

  return (
    <div className="min-h-screen pixel-bg flex flex-col items-center">
      {/* HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2 border-b-2" style={{ borderColor: 'var(--pixel-border)', maxWidth: CANVAS_W }}>
        <button className="pixel-btn" style={{ fontSize: 7, padding: '6px 12px' }} onClick={onBack}>◀ ВЫЙТИ</button>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-green)' }}>УР. {levelId}</div>
        <div className="flex items-center gap-3">
          <div style={{ fontFamily: 'Roboto Mono', fontSize: 13, color: starColor, fontWeight: 700 }}>
            ⏱ {formatTime(elapsed)}
          </div>
          <Stars count={starsPreview} size={12} />
        </div>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-yellow)' }}>
          💎 {coinCount}
        </div>
      </div>

      {/* Timer thresholds hint */}
      <div className="flex gap-4 py-2 px-4" style={{ maxWidth: CANVAS_W, width: '100%' }}>
        {(['var(--pixel-green)', 'var(--pixel-yellow)', 'var(--pixel-red)'] as const).map((c, i) => (
          <div key={i} className="flex items-center gap-1">
            <Stars count={3 - i} size={8} />
            <span style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: c }}>
              {'< '}{formatTime(thresholds[i])}
            </span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div style={{ border: '2px solid var(--pixel-green)', boxShadow: '0 0 20px rgba(0,255,65,0.3)', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', maxWidth: '100%', imageRendering: 'pixelated' }}
        />
      </div>

      {/* Mobile controls */}
      <div className="flex justify-between w-full px-6 py-4 gap-4" style={{ maxWidth: CANVAS_W }}>
        <div className="flex gap-2">
          <button
            className="pixel-btn" style={{ fontSize: 16, padding: '12px 20px', userSelect: 'none' }}
            onPointerDown={() => pressKey('ArrowLeft')} onPointerUp={() => releaseKey('ArrowLeft')} onPointerLeave={() => releaseKey('ArrowLeft')}
          >◀</button>
          <button
            className="pixel-btn" style={{ fontSize: 16, padding: '12px 20px', userSelect: 'none' }}
            onPointerDown={() => pressKey('ArrowRight')} onPointerUp={() => releaseKey('ArrowRight')} onPointerLeave={() => releaseKey('ArrowRight')}
          >▶</button>
        </div>
        <button
          className="pixel-btn pixel-btn-yellow" style={{ fontSize: 14, padding: '12px 32px', userSelect: 'none' }}
          onPointerDown={() => pressKey('Space')} onPointerUp={() => releaseKey('Space')} onPointerLeave={() => releaseKey('Space')}
        >ПРЫЖОК</button>
      </div>
    </div>
  );
}

// ─── RESULT SCREEN ────────────────────────────────────────────────────────────
function ResultScreen({
  levelId,
  elapsed,
  coins,
  stars,
  prevStars,
  onContinue,
  onRetry,
}: {
  levelId: number;
  elapsed: number;
  coins: number;
  stars: number;
  prevStars: number;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i++; setShown(i); if (i >= stars) clearInterval(t); }, 400);
    return () => clearInterval(t);
  }, [stars]);

  const improved = stars > prevStars;
  const thresholds = LEVEL_TIME_THRESHOLDS[levelId];

  return (
    <div className="min-h-screen pixel-bg flex flex-col items-center justify-center gap-8 px-4">
      <div style={{ fontFamily: 'Press Start 2P', fontSize: 11, color: stars === 3 ? 'var(--pixel-yellow)' : stars === 2 ? 'var(--pixel-cyan)' : 'var(--pixel-green)', textShadow: `0 0 12px currentColor` }}>
        {stars === 3 ? '🏆 ОТЛИЧНО!' : stars === 2 ? '⭐ ХОРОШО!' : '✓ ПРОЙДЕН!'}
      </div>

      <div className="flex gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} style={{
            fontSize: 48,
            opacity: i < shown ? 1 : 0.15,
            transform: i < shown ? 'scale(1)' : 'scale(0.7)',
            transition: 'all 0.3s',
            filter: i < shown ? 'drop-shadow(0 0 8px var(--pixel-yellow))' : 'none',
          }}>★</div>
        ))}
      </div>

      <div className="pixel-border p-4 flex flex-col gap-3 w-full max-w-xs">
        <div className="flex justify-between" style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-green)' }}>
          <span>УРОВЕНЬ</span><span>{levelId}</span>
        </div>
        <div className="flex justify-between" style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-cyan)' }}>
          <span>ВРЕМЯ</span><span>{formatTime(elapsed)}</span>
        </div>
        <div className="flex justify-between" style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-yellow)' }}>
          <span>МОНЕТЫ</span><span>💎 {coins}</span>
        </div>
        {improved && (
          <div style={{ fontFamily: 'Press Start 2P', fontSize: 7, color: 'var(--pixel-yellow)', textAlign: 'center', marginTop: 4 }}>
            ↑ НОВЫЙ РЕКОРД ЗВЁЗД!
          </div>
        )}
      </div>

      <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: '#444', textAlign: 'center', lineHeight: 2 }}>
        3★ &lt; {formatTime(thresholds[0])} · 2★ &lt; {formatTime(thresholds[1])} · 1★ &lt; {formatTime(thresholds[2])}
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <button className="pixel-btn flex-1" style={{ fontSize: 8 }} onClick={onRetry}>↺ ЗАНОВО</button>
        <button className="pixel-btn pixel-btn-yellow flex-1" style={{ fontSize: 8 }} onClick={onContinue}>ДАЛЬШЕ ▶</button>
      </div>
    </div>
  );
}

// ─── MENU SCREEN ──────────────────────────────────────────────────────────────
function MenuScreen({ onNavigate, progress }: { onNavigate: (s: Screen) => void; progress: Progress }) {
  const [selectedMode, setSelectedMode] = useState(0);
  const [tick, setTick] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setTick(v => !v), 500);
    return () => clearInterval(t);
  }, []);

  const completedCount = Object.values(progress).filter(v => v.stars > 0).length;
  const totalStars = Object.values(progress).reduce((s, v) => s + v.stars, 0);
  const achievements = ACHIEVEMENTS.filter(a => a.check(progress));

  return (
    <div className="min-h-screen pixel-bg stars-bg flex flex-col items-center justify-between py-8 px-4">
      <div className="w-full flex justify-between items-start">
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-green)', opacity: 0.5 }}>v1.0.0</div>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-yellow)', opacity: 0.7 }}>★ {totalStars}/{15 * 3}</div>
      </div>

      <div className="flex flex-col items-center gap-6 animate-fade-up">
        <div className="flex items-center gap-8">
          <PixelChar color="var(--pixel-green)" />
          <div className="flex flex-col items-center gap-1">
            <div style={{ fontFamily: 'Press Start 2P', fontSize: 'clamp(20px,5vw,40px)', color: 'var(--pixel-green)', textShadow: '0 0 10px var(--pixel-green),0 0 30px rgba(0,255,65,0.4)', letterSpacing: 6 }}>PIXEL</div>
            <div style={{ fontFamily: 'Press Start 2P', fontSize: 'clamp(20px,5vw,40px)', color: 'var(--pixel-yellow)', textShadow: '0 0 10px var(--pixel-yellow),0 0 30px rgba(255,215,0,0.4)', letterSpacing: 6 }}>QUEST</div>
          </div>
          <PixelChar color="var(--pixel-yellow)" />
        </div>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-cyan)', opacity: tick ? 1 : 0, transition: 'opacity 0.1s', letterSpacing: 3 }}>▶ НАЖМИ ИГРАТЬ ◀</div>
      </div>

      <div className="w-full max-w-lg flex flex-col gap-3">
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 7, color: 'var(--pixel-green)', opacity: 0.7 }}>РЕЖИМ ИГРЫ:</div>
        <div className="grid grid-cols-5 gap-2">
          {GAME_MODES.map((mode, i) => (
            <button key={mode.id} onClick={() => setSelectedMode(i)}
              className="flex flex-col items-center gap-2 p-3 pixel-card transition-all"
              style={{ borderColor: i === selectedMode ? mode.color : '#1a4d1a', boxShadow: i === selectedMode ? `0 0 12px ${mode.color}66` : 'none', background: i === selectedMode ? `${mode.color}11` : 'var(--pixel-dark-2)' }}>
              <Icon name={mode.icon} fallback="Gamepad2" size={16} style={{ color: mode.color }} />
              <span style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: i === selectedMode ? mode.color : '#666', textAlign: 'center', lineHeight: 1.8 }}>{mode.label}</span>
            </button>
          ))}
        </div>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 7, color: GAME_MODES[selectedMode].color, textAlign: 'center' }}>{GAME_MODES[selectedMode].desc}</div>
      </div>

      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <button className="pixel-btn w-full" style={{ fontSize: 14 }} onClick={() => onNavigate("levels")}>▶ ИГРАТЬ</button>
        <div className="flex gap-3 w-full">
          <button className="pixel-btn pixel-btn-yellow flex-1" style={{ fontSize: 9 }} onClick={() => onNavigate("leaderboard")}>🏆 РЕЙТИНГ</button>
          <button className="pixel-btn flex-1" style={{ fontSize: 9, borderColor: 'var(--pixel-purple)', color: 'var(--pixel-purple)' }}>⚙ НАСТРОЙКИ</button>
        </div>
      </div>

      <div className="w-full max-w-lg pixel-border p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, background: 'var(--pixel-dark-3)', border: '2px solid var(--pixel-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎮</div>
          <div>
            <div style={{ fontFamily: 'Press Start 2P', fontSize: 7, color: 'var(--pixel-green)' }}>YOU</div>
            <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: '#555', marginTop: 4 }}>LVL {Math.max(1, completedCount)}</div>
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-1 max-w-36">
          <div className="flex justify-between" style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: 'var(--pixel-green)' }}>
            <span>ПРОГРЕСС</span><span>{completedCount}/15</span>
          </div>
          <div className="hp-bar"><div className="hp-fill" style={{ width: `${(completedCount / 15) * 100}%` }} /></div>
          <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: '#444', marginTop: 2 }}>★ {totalStars}/{15 * 3}</div>
        </div>
        <div className="flex gap-2">
          {achievements.slice(0, 3).map(a => (
            <div key={a.id} title={a.name} style={{ fontSize: 18, filter: 'drop-shadow(0 0 4px var(--pixel-yellow))' }}>{a.icon}</div>
          ))}
          {achievements.length === 0 && <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: '#333' }}>нет ещё</div>}
        </div>
      </div>
    </div>
  );
}

// ─── LEVELS SCREEN ────────────────────────────────────────────────────────────
function LevelsScreen({ onNavigate, onPlay, progress }: { onNavigate: (s: Screen) => void; onPlay: (id: number) => void; progress: Progress }) {
  const [selectedWorld, setSelectedWorld] = useState(1);
  const worldColors = ['var(--pixel-green)', 'var(--pixel-cyan)', 'var(--pixel-purple)'];
  const worldNames = ['🌲 ЛЕСНОЙ МИР', '❄️ ЛЕДЯНОЙ МИР', '🌑 ТЁМНЫЙ МИР'];
  const worldLevels = LEVELS_CONFIG.filter(l => l.world === selectedWorld);
  const completedTotal = Object.values(progress).filter(v => v.stars > 0).length;
  const totalStars = Object.values(progress).reduce((s, v) => s + v.stars, 0);

  function isLocked(levelId: number) {
    if (levelId === 1) return false;
    return !(progress[levelId - 1]?.stars > 0);
  }

  return (
    <div className="min-h-screen pixel-bg flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: 'var(--pixel-border)' }}>
        <button className="pixel-btn" style={{ fontSize: 9, padding: '8px 16px' }} onClick={() => onNavigate("menu")}>◀ МЕНЮ</button>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 10, color: 'var(--pixel-green)' }}>УРОВНИ</div>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 9, color: 'var(--pixel-yellow)' }}>★ {totalStars}/{15 * 3}</div>
      </div>

      <div className="px-6 py-3 flex items-center gap-4 border-b" style={{ borderColor: '#1a3a1a' }}>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 7, color: '#555', whiteSpace: 'nowrap' }}>{completedTotal}/15</div>
        <div className="hp-bar flex-1" style={{ height: 10 }}>
          <div className="hp-fill" style={{ width: `${(completedTotal / 15) * 100}%`, background: 'linear-gradient(90deg,var(--pixel-cyan),var(--pixel-green))' }} />
        </div>
      </div>

      <div className="flex px-6 pt-4 gap-2">
        {[1, 2, 3].map((w, i) => (
          <button key={w} onClick={() => setSelectedWorld(w)} className="pixel-btn flex-1" style={{
            fontSize: 7, padding: '8px 4px',
            borderColor: selectedWorld === w ? worldColors[i] : '#333',
            color: selectedWorld === w ? worldColors[i] : '#555',
            background: selectedWorld === w ? `${worldColors[i]}11` : 'var(--pixel-dark-2)',
            boxShadow: selectedWorld === w ? `0 0 10px ${worldColors[i]}44` : 'none',
          }}>МИР {w}</button>
        ))}
      </div>

      <div className="px-6 py-3">
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 9, color: worldColors[selectedWorld - 1], textShadow: `0 0 8px ${worldColors[selectedWorld - 1]}` }}>
          {worldNames[selectedWorld - 1]}
        </div>
      </div>

      <div className="flex-1 px-6 pb-4">
        <div className="grid grid-cols-5 gap-6">
          {worldLevels.map((level) => {
            const locked = isLocked(level.id);
            const lp = progress[level.id];
            const stars = lp?.stars ?? 0;
            const bestTime = lp?.bestTime ?? null;
            const thresholds = LEVEL_TIME_THRESHOLDS[level.id];
            return (
              <div key={level.id} className="flex flex-col items-center gap-2">
                <Stars count={stars} />
                <div
                  className={`level-node ${locked ? 'locked' : ''} ${stars > 0 ? 'completed' : ''}`}
                  onClick={() => !locked && onPlay(level.id)}
                >
                  {locked ? '🔒' : stars > 0 ? '★' : level.id}
                </div>
                <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: locked ? '#333' : '#555' }}>УР. {level.id}</div>
                {bestTime !== null && (
                  <div style={{ fontFamily: 'Roboto Mono', fontSize: 9, color: bestTime <= thresholds[0] ? 'var(--pixel-green)' : bestTime <= thresholds[1] ? 'var(--pixel-yellow)' : '#888' }}>
                    ⏱{formatTime(bestTime)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="px-6 pb-6">
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-yellow)', marginBottom: 12 }}>🏆 ДОСТИЖЕНИЯ</div>
        <div className="grid grid-cols-5 gap-2">
          {ACHIEVEMENTS.map(a => {
            const unlocked = a.check(progress);
            return (
              <div key={a.id} className="pixel-card p-3 flex flex-col items-center gap-2" style={{ borderColor: unlocked ? 'var(--pixel-yellow)' : '#333', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(1)' }}>
                <div style={{ fontSize: 22 }}>{a.icon}</div>
                <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: unlocked ? 'var(--pixel-yellow)' : '#444', textAlign: 'center', lineHeight: 1.8 }}>{a.name}</div>
                <div style={{ fontFamily: 'Roboto Mono', fontSize: 9, color: '#555', textAlign: 'center', lineHeight: 1.4 }}>{a.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD SCREEN ───────────────────────────────────────────────────────
function LeaderboardScreen({ onNavigate, progress }: { onNavigate: (s: Screen) => void; progress: Progress }) {
  const [filter, setFilter] = useState<'all' | 'week' | 'day'>('all');
  const rankColors = ['var(--pixel-yellow)', '#aaaaaa', '#cd7f32'];
  const totalStars = Object.values(progress).reduce((s, v) => s + v.stars, 0);
  const completedCount = Object.values(progress).filter(v => v.stars > 0).length;
  const playerScore = totalStars * 1000 + completedCount * 500;

  const allPlayers = [
    ...LEADERBOARD,
    { rank: 0, name: "YOU", score: playerScore, level: Math.max(1, completedCount), badge: "🎮", isPlayer: true },
  ].sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 }));

  return (
    <div className="min-h-screen pixel-bg flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: 'var(--pixel-border)' }}>
        <button className="pixel-btn" style={{ fontSize: 9, padding: '8px 16px' }} onClick={() => onNavigate("menu")}>◀ НАЗАД</button>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 10, color: 'var(--pixel-yellow)', textShadow: '0 0 8px var(--pixel-yellow)' }}>🏆 ЛИДЕРБОРД</div>
        <div style={{ width: 80 }} />
      </div>

      <div className="flex px-6 pt-4 gap-2">
        {(['all', 'week', 'day'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className="pixel-btn flex-1" style={{ fontSize: 8, padding: '8px', borderColor: filter === f ? 'var(--pixel-yellow)' : '#333', color: filter === f ? 'var(--pixel-yellow)' : '#555', background: filter === f ? 'rgba(255,215,0,0.1)' : 'var(--pixel-dark-2)' }}>
            {f === 'all' ? 'ВСЁ ВРЕМЯ' : f === 'week' ? 'НЕДЕЛЯ' : 'СЕГОДНЯ'}
          </button>
        ))}
      </div>

      {/* Podium top 3 */}
      <div className="px-6 py-6 flex items-end justify-center gap-6">
        {[allPlayers[1], allPlayers[0], allPlayers[2]].map((player, podIdx) => {
          const heights = [44, 60, 32];
          const sizes = [60, 76, 60];
          const colors = ['#aaa', 'var(--pixel-yellow)', '#cd7f32'];
          const emojis = ['🤖', '👾', '🦊'];
          const col = colors[podIdx];
          const sz = sizes[podIdx];
          const ht = heights[podIdx];
          return (
            <div key={player.rank} className="flex flex-col items-center gap-2">
              {podIdx === 1 && <div style={{ fontSize: 22 }}>👑</div>}
              <div style={{ fontSize: 18 }}>{player.badge}</div>
              <div style={{ width: sz, height: sz, background: podIdx === 1 ? 'rgba(255,215,0,0.1)' : 'var(--pixel-dark-2)', border: `3px solid ${col}`, boxShadow: podIdx === 1 ? `0 0 20px ${col}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: podIdx === 1 ? 36 : 28 }}>
                {player.isPlayer ? '😎' : emojis[podIdx]}
              </div>
              <div style={{ width: sz, height: ht, background: podIdx === 1 ? `rgba(255,215,0,0.15)` : `rgba(0,0,0,0.2)`, border: `2px solid ${col}`, boxShadow: podIdx === 1 ? `0 0 12px ${col}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Press Start 2P', fontSize: podIdx === 1 ? 18 : 14, color: col, textShadow: podIdx === 1 ? `0 0 8px ${col}` : 'none' }}>{player.rank}</span>
              </div>
              <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: col, textAlign: 'center', textShadow: podIdx === 1 ? `0 0 6px ${col}` : 'none' }}>{player.name}</div>
              <div style={{ fontFamily: 'Roboto Mono', fontSize: podIdx === 1 ? 11 : 10, color: podIdx === 1 ? col : '#666' }}>{player.score.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      <div className="px-6 pb-6 flex flex-col gap-1">
        <div className="grid mb-2 px-2" style={{ gridTemplateColumns: '36px 1fr 40px 90px' }}>
          {['#', 'ИГРОК', 'УР', 'ОЧКИ'].map(h => <div key={h} style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: '#333' }}>{h}</div>)}
        </div>
        {allPlayers.map((player) => (
          <div key={`${player.rank}-${player.name}`} className="grid items-center gap-2 p-2 pixel-card" style={{
            gridTemplateColumns: '36px 1fr 40px 90px',
            borderColor: player.isPlayer ? 'var(--pixel-cyan)' : player.rank <= 3 ? rankColors[player.rank - 1] : '#1a4d1a',
            background: player.isPlayer ? 'rgba(0,255,255,0.05)' : 'var(--pixel-dark-2)',
            boxShadow: player.isPlayer ? '0 0 10px rgba(0,255,255,0.2)' : 'none',
          }}>
            <div style={{ fontFamily: 'Press Start 2P', fontSize: 9, color: player.rank <= 3 ? rankColors[player.rank - 1] : '#333' }}>
              {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : player.rank}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ fontSize: 14 }}>{player.badge}</span>
              <span style={{ fontFamily: 'Press Start 2P', fontSize: 7, color: player.isPlayer ? 'var(--pixel-cyan)' : player.rank <= 3 ? rankColors[player.rank - 1] : 'var(--pixel-green)', textShadow: player.isPlayer ? '0 0 6px var(--pixel-cyan)' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
              {player.isPlayer && <span style={{ fontFamily: 'Press Start 2P', fontSize: 5, color: 'var(--pixel-cyan)', border: '1px solid var(--pixel-cyan)', padding: '1px 3px', whiteSpace: 'nowrap' }}>ВЫ</span>}
            </div>
            <div style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: '#444' }}>{player.level}</div>
            <div style={{ fontFamily: 'Roboto Mono', fontSize: 11, color: player.rank <= 3 ? rankColors[player.rank - 1] : '#777', textAlign: 'right' }}>{player.score.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [progress, setProgress] = useState<Progress>({});
  const [lastResult, setLastResult] = useState<{ elapsed: number; coins: number; stars: number; prevStars: number } | null>(null);

  function handlePlay(levelId: number) {
    setCurrentLevel(levelId);
    setScreen("game");
  }

  function handleFinish(elapsed: number, coins: number) {
    const stars = calcStars(currentLevel, elapsed);
    const prevStars = progress[currentLevel]?.stars ?? 0;
    const prevBest = progress[currentLevel]?.bestTime ?? null;
    const newBest = prevBest === null ? elapsed : Math.min(prevBest, elapsed);
    setProgress(prev => ({
      ...prev,
      [currentLevel]: {
        stars: Math.max(stars, prevStars),
        bestTime: newBest,
      },
    }));
    setLastResult({ elapsed, coins, stars, prevStars });
    setScreen("result");
  }

  function handleContinue() {
    const next = currentLevel + 1;
    if (next <= 15) {
      setCurrentLevel(next);
      setScreen("levels");
    } else {
      setScreen("levels");
    }
  }

  return (
    <div key={screen} className="animate-fade-up">
      {screen === "menu" && <MenuScreen onNavigate={setScreen} progress={progress} />}
      {screen === "levels" && <LevelsScreen onNavigate={setScreen} onPlay={handlePlay} progress={progress} />}
      {screen === "leaderboard" && <LeaderboardScreen onNavigate={setScreen} progress={progress} />}
      {screen === "game" && (
        <GameScreen
          levelId={currentLevel}
          onFinish={handleFinish}
          onBack={() => setScreen("levels")}
        />
      )}
      {screen === "result" && lastResult && (
        <ResultScreen
          levelId={currentLevel}
          elapsed={lastResult.elapsed}
          coins={lastResult.coins}
          stars={lastResult.stars}
          prevStars={lastResult.prevStars}
          onContinue={handleContinue}
          onRetry={() => setScreen("game")}
        />
      )}
    </div>
  );
}
