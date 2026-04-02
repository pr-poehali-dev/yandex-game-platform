export type Screen = "menu" | "levels" | "leaderboard" | "game" | "result";

export type LevelProgress = { stars: number; bestTime: number | null };
export type Progress = Record<number, LevelProgress>;

export type Vec2 = { x: number; y: number };

export interface GameState {
  pos: Vec2;
  vel: Vec2;
  onGround: boolean;
  coins: Set<string>;
  finished: boolean;
  map: number[][];
}

// Время в секундах для получения звёзд: [3 звезды, 2 звезды, 1 звезда]
export const LEVEL_TIME_THRESHOLDS: Record<number, [number, number, number]> = {};
for (let i = 1; i <= 15; i++) {
  const base = 20 + i * 5;
  LEVEL_TIME_THRESHOLDS[i] = [base, base * 1.6, base * 2.5];
}

export const LEVELS_CONFIG = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  world: Math.floor(i / 5) + 1,
}));

export const GAME_MODES = [
  { id: "platformer", icon: "Footprints", label: "Платформер", color: "var(--pixel-green)", desc: "Прыжки и бег" },
  { id: "puzzle", icon: "Puzzle", label: "Головоломка", color: "var(--pixel-cyan)", desc: "Логика и мышление" },
  { id: "shooter", icon: "Crosshair", label: "Шутер", color: "var(--pixel-red)", desc: "Стрельба и экшн" },
  { id: "roguelike", icon: "Sword", label: "Рогалик", color: "var(--pixel-purple)", desc: "Случайные уровни" },
  { id: "strategy", icon: "Map", label: "Стратегия", color: "var(--pixel-yellow)", desc: "Тактика и ресурсы" },
];

export const LEADERBOARD = [
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

export const ACHIEVEMENTS = [
  { id: 1, icon: "⚡", name: "Быстрый старт", desc: "Пройти уровень за 30 сек", check: (p: Progress) => Object.values(p).some(v => v.bestTime !== null && v.bestTime <= 30) },
  { id: 2, icon: "💎", name: "Коллекционер", desc: "Пройти 5 уровней", check: (p: Progress) => Object.values(p).filter(v => v.stars > 0).length >= 5 },
  { id: 3, icon: "🔥", name: "Без смертей", desc: "Получить 3★ хоть раз", check: (p: Progress) => Object.values(p).some(v => v.stars === 3) },
  { id: 4, icon: "🌟", name: "Мастер", desc: "3★ на 3 уровнях", check: (p: Progress) => Object.values(p).filter(v => v.stars === 3).length >= 3 },
  { id: 5, icon: "🏆", name: "Легенда", desc: "Пройти все 15 уровней", check: (p: Progress) => Object.values(p).filter(v => v.stars > 0).length >= 15 },
];

export function calcStars(levelId: number, elapsed: number): number {
  const [t3, t2, t1] = LEVEL_TIME_THRESHOLDS[levelId];
  if (elapsed <= t3) return 3;
  if (elapsed <= t2) return 2;
  if (elapsed <= t1) return 1;
  return 1;
}

export function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}м ${s}с` : `${s}с`;
}

// Game engine constants
export const TILE = 32;
export const GW = 20;
export const GH = 14;
export const CANVAS_W = GW * TILE;
export const CANVAS_H = GH * TILE;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -13;
export const MOVE_SPEED = 4;

// Map: 0=air, 1=ground, 2=coin, 3=finish
export function buildMap(levelId: number): number[][] {
  const map: number[][] = Array.from({ length: GH }, () => Array(GW).fill(0));
  for (let x = 0; x < GW; x++) map[GH - 1][x] = 1;
  const seed = levelId * 7;
  const numPlatforms = 3 + Math.floor(levelId / 3);
  for (let p = 0; p < numPlatforms; p++) {
    const px = 2 + ((seed * (p + 1) * 3) % (GW - 6));
    const py = GH - 3 - (p % 4) * 2;
    const len = 2 + (p % 3);
    for (let x = px; x < px + len && x < GW - 1; x++) map[py][x] = 1;
    if (px + 1 < GW - 1) map[py - 1][px + 1] = 2;
  }
  for (let x = 3; x < GW - 3; x += 4) map[GH - 2][x] = 2;
  map[GH - 2][GW - 2] = 3;
  return map;
}

export function isSolid(map: number[][], tx: number, ty: number) {
  if (ty < 0 || ty >= GH || tx < 0 || tx >= GW) return false;
  return map[ty][tx] === 1;
}
