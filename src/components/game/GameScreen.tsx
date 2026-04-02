import { useState, useEffect, useRef, useCallback } from "react";
import {
  LEVEL_TIME_THRESHOLDS, CANVAS_W, CANVAS_H, TILE, GW, GH,
  GRAVITY, JUMP_FORCE, MOVE_SPEED,
  buildMap, isSolid, formatTime,
  type GameState,
} from "./gameTypes";

// ─── Shared UI primitives ────────────────────────────────────────────────────

export function PixelChar({ color = "var(--pixel-green)", size = 8 }: { color?: string; size?: number }) {
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

export function Stars({ count, max = 3, size = 10 }: { count: number; max?: number; size?: number }) {
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

export function GameScreen({
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

export function ResultScreen({
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
