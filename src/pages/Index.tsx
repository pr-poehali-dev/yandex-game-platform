import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Screen = "menu" | "levels" | "leaderboard";

const GAME_MODES = [
  { id: "platformer", icon: "Footprints", label: "Платформер", color: "var(--pixel-green)", desc: "Прыжки и бег" },
  { id: "puzzle", icon: "Puzzle", label: "Головоломка", color: "var(--pixel-cyan)", desc: "Логика и мышление" },
  { id: "shooter", icon: "Crosshair", label: "Шутер", color: "var(--pixel-red)", desc: "Стрельба и экшн" },
  { id: "roguelike", icon: "Sword", label: "Рогалик", color: "var(--pixel-purple)", desc: "Случайные уровни" },
  { id: "strategy", icon: "Map", label: "Стратегия", color: "var(--pixel-yellow)", desc: "Тактика и ресурсы" },
];

const LEVELS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  stars: i < 5 ? 3 : i < 8 ? 2 : i < 10 ? 1 : 0,
  locked: i >= 10,
  world: Math.floor(i / 5) + 1,
}));

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
  { rank: 10, name: "YOU", score: 8450, level: 6, badge: "🎮", isPlayer: true },
];

const ACHIEVEMENTS = [
  { id: 1, icon: "⚡", name: "Быстрый старт", desc: "Пройти уровень за 30 сек", unlocked: true },
  { id: 2, icon: "💎", name: "Коллекционер", desc: "Собрать 100 монет", unlocked: true },
  { id: 3, icon: "🔥", name: "Без смертей", desc: "Пройти мир без потерь", unlocked: true },
  { id: 4, icon: "🌟", name: "Мастер", desc: "3 звезды на 10 уровнях", unlocked: false },
  { id: 5, icon: "🏆", name: "Легенда", desc: "Пройти все уровни", unlocked: false },
];

function PixelChar({ color = "var(--pixel-green)" }: { color?: string }) {
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 8px)' }}>
        {pixels.map((px, i) => (
          <div key={i} style={{
            width: 8, height: 8,
            background: px ? color : 'transparent',
            boxShadow: px ? `0 0 4px ${color}` : 'none',
          }} />
        ))}
      </div>
    </div>
  );
}

function Stars({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{
          fontSize: 10,
          color: i < count ? 'var(--pixel-yellow)' : '#333',
          textShadow: i < count ? '0 0 6px var(--pixel-yellow)' : 'none',
        }}>★</span>
      ))}
    </div>
  );
}

function MenuScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [selectedMode, setSelectedMode] = useState(0);
  const [tick, setTick] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTick(v => !v), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen pixel-bg stars-bg flex flex-col items-center justify-between py-8 px-4">
      {/* Header */}
      <div className="w-full flex justify-between items-start">
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-green)', opacity: 0.5 }}>v1.0.0</div>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-yellow)', opacity: 0.7 }}>★ ЛУЧШИЙ: 98 750</div>
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center gap-6 animate-fade-up">
        <div className="flex items-center gap-8">
          <PixelChar color="var(--pixel-green)" />
          <div className="flex flex-col items-center gap-1">
            <div style={{
              fontFamily: 'Press Start 2P',
              fontSize: 'clamp(20px, 5vw, 40px)',
              color: 'var(--pixel-green)',
              textShadow: '0 0 10px var(--pixel-green), 0 0 30px rgba(0,255,65,0.4)',
              letterSpacing: 6,
            }}>PIXEL</div>
            <div style={{
              fontFamily: 'Press Start 2P',
              fontSize: 'clamp(20px, 5vw, 40px)',
              color: 'var(--pixel-yellow)',
              textShadow: '0 0 10px var(--pixel-yellow), 0 0 30px rgba(255,215,0,0.4)',
              letterSpacing: 6,
            }}>QUEST</div>
          </div>
          <PixelChar color="var(--pixel-yellow)" />
        </div>

        <div style={{
          fontFamily: 'Press Start 2P',
          fontSize: 8,
          color: 'var(--pixel-cyan)',
          opacity: tick ? 1 : 0,
          transition: 'opacity 0.1s',
          letterSpacing: 3,
        }}>▶ НАЖМИ ИГРАТЬ ◀</div>
      </div>

      {/* Mode selector */}
      <div className="w-full max-w-lg flex flex-col gap-3">
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 7, color: 'var(--pixel-green)', opacity: 0.7, marginBottom: 4 }}>
          РЕЖИМ ИГРЫ:
        </div>
        <div className="grid grid-cols-5 gap-2">
          {GAME_MODES.map((mode, i) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(i)}
              className="flex flex-col items-center gap-2 p-3 pixel-card transition-all"
              style={{
                borderColor: i === selectedMode ? mode.color : '#1a4d1a',
                boxShadow: i === selectedMode ? `0 0 12px ${mode.color}66` : 'none',
                background: i === selectedMode ? `${mode.color}11` : 'var(--pixel-dark-2)',
              }}
            >
              <Icon name={mode.icon} fallback="Gamepad2" size={16} style={{ color: mode.color }} />
              <span style={{
                fontFamily: 'Press Start 2P',
                fontSize: 6,
                color: i === selectedMode ? mode.color : '#666',
                textAlign: 'center',
                lineHeight: 1.8,
              }}>{mode.label}</span>
            </button>
          ))}
        </div>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 7, color: GAME_MODES[selectedMode].color, textAlign: 'center' }}>
          {GAME_MODES[selectedMode].desc}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <button className="pixel-btn w-full" style={{ fontSize: 14 }} onClick={() => onNavigate("levels")}>
          ▶ ИГРАТЬ
        </button>
        <div className="flex gap-3 w-full">
          <button className="pixel-btn pixel-btn-yellow flex-1" style={{ fontSize: 9 }} onClick={() => onNavigate("leaderboard")}>
            🏆 РЕЙТИНГ
          </button>
          <button className="pixel-btn flex-1" style={{ fontSize: 9, borderColor: 'var(--pixel-purple)', color: 'var(--pixel-purple)' }}>
            ⚙ НАСТРОЙКИ
          </button>
        </div>
      </div>

      {/* Player HUD */}
      <div className="w-full max-w-lg pixel-border p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36,
            background: 'var(--pixel-dark-3)',
            border: '2px solid var(--pixel-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🎮</div>
          <div>
            <div style={{ fontFamily: 'Press Start 2P', fontSize: 7, color: 'var(--pixel-green)' }}>YOU</div>
            <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: '#555', marginTop: 4 }}>LVL 6</div>
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-1 max-w-36">
          <div className="flex justify-between" style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: 'var(--pixel-green)' }}>
            <span>HP</span><span>72/100</span>
          </div>
          <div className="hp-bar"><div className="hp-fill" style={{ width: '72%' }} /></div>
          <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: '#444', marginTop: 2 }}>XP: 8 450</div>
        </div>
        <div className="flex gap-2">
          {ACHIEVEMENTS.filter(a => a.unlocked).slice(0, 3).map(a => (
            <div key={a.id} title={a.name} style={{ fontSize: 18, filter: 'drop-shadow(0 0 4px var(--pixel-yellow))' }}>{a.icon}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelsScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [selectedWorld, setSelectedWorld] = useState(1);
  const worldColors = ['var(--pixel-green)', 'var(--pixel-cyan)', 'var(--pixel-purple)'];
  const worldNames = ['🌲 ЛЕСНОЙ МИР', '❄️ ЛЕДЯНОЙ МИР', '🌑 ТЁМНЫЙ МИР'];
  const worldLevels = LEVELS.filter(l => l.world === selectedWorld);
  const completedTotal = LEVELS.filter(l => l.stars > 0).length;
  const totalStars = LEVELS.reduce((sum, l) => sum + l.stars, 0);

  return (
    <div className="min-h-screen pixel-bg flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: 'var(--pixel-border)' }}>
        <button className="pixel-btn" style={{ fontSize: 9, padding: '8px 16px' }} onClick={() => onNavigate("menu")}>
          ◀ МЕНЮ
        </button>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 10, color: 'var(--pixel-green)' }}>УРОВНИ</div>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 9, color: 'var(--pixel-yellow)' }}>★ {totalStars}/{LEVELS.length * 3}</div>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-3 flex items-center gap-4 border-b" style={{ borderColor: '#1a3a1a' }}>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 7, color: '#555', whiteSpace: 'nowrap' }}>
          {completedTotal}/{LEVELS.length}
        </div>
        <div className="hp-bar flex-1" style={{ height: 10 }}>
          <div className="hp-fill" style={{ width: `${(completedTotal / LEVELS.length) * 100}%`, background: 'linear-gradient(90deg, var(--pixel-cyan), var(--pixel-green))' }} />
        </div>
      </div>

      {/* World tabs */}
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

      {/* Level grid */}
      <div className="flex-1 px-6 pb-4">
        <div className="grid grid-cols-5 gap-6">
          {worldLevels.map((level) => (
            <div key={level.id} className="flex flex-col items-center gap-2">
              <Stars count={level.stars} />
              <div className={`level-node ${level.locked ? 'locked' : ''} ${level.stars > 0 ? 'completed' : ''}`}>
                {level.locked ? '🔒' : level.id}
              </div>
              <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: level.locked ? '#333' : '#555' }}>
                УР. {level.id}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="px-6 pb-6">
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: 'var(--pixel-yellow)', marginBottom: 12 }}>
          🏆 ДОСТИЖЕНИЯ
        </div>
        <div className="grid grid-cols-5 gap-2">
          {ACHIEVEMENTS.map(a => (
            <div key={a.id} className="pixel-card p-3 flex flex-col items-center gap-2" style={{
              borderColor: a.unlocked ? 'var(--pixel-yellow)' : '#333',
              opacity: a.unlocked ? 1 : 0.4,
              filter: a.unlocked ? 'none' : 'grayscale(1)',
            }}>
              <div style={{ fontSize: 22 }}>{a.icon}</div>
              <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: a.unlocked ? 'var(--pixel-yellow)' : '#444', textAlign: 'center', lineHeight: 1.8 }}>
                {a.name}
              </div>
              <div style={{ fontFamily: 'Roboto Mono', fontSize: 9, color: '#555', textAlign: 'center', lineHeight: 1.4 }}>
                {a.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [filter, setFilter] = useState<'all' | 'week' | 'day'>('all');
  const rankColors = ['var(--pixel-yellow)', '#aaaaaa', '#cd7f32'];

  return (
    <div className="min-h-screen pixel-bg flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: 'var(--pixel-border)' }}>
        <button className="pixel-btn" style={{ fontSize: 9, padding: '8px 16px' }} onClick={() => onNavigate("menu")}>
          ◀ НАЗАД
        </button>
        <div style={{ fontFamily: 'Press Start 2P', fontSize: 10, color: 'var(--pixel-yellow)', textShadow: '0 0 8px var(--pixel-yellow)' }}>
          🏆 ЛИДЕРБОРД
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Filter */}
      <div className="flex px-6 pt-4 gap-2">
        {(['all', 'week', 'day'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className="pixel-btn flex-1" style={{
            fontSize: 8, padding: '8px',
            borderColor: filter === f ? 'var(--pixel-yellow)' : '#333',
            color: filter === f ? 'var(--pixel-yellow)' : '#555',
            background: filter === f ? 'rgba(255,215,0,0.1)' : 'var(--pixel-dark-2)',
          }}>
            {f === 'all' ? 'ВСЁ ВРЕМЯ' : f === 'week' ? 'НЕДЕЛЯ' : 'СЕГОДНЯ'}
          </button>
        ))}
      </div>

      {/* Podium */}
      <div className="px-6 py-6 flex items-end justify-center gap-6">
        {/* 2nd */}
        <div className="flex flex-col items-center gap-2">
          <div style={{ fontSize: 18 }}>{LEADERBOARD[1].badge}</div>
          <div style={{ width: 60, height: 60, background: 'var(--pixel-dark-2)', border: '3px solid #aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🤖</div>
          <div style={{ width: 60, height: 44, background: 'rgba(170,170,170,0.1)', border: '2px solid #aaa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Press Start 2P', fontSize: 14, color: '#aaa' }}>2</span>
          </div>
          <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: '#aaa', textAlign: 'center' }}>{LEADERBOARD[1].name}</div>
          <div style={{ fontFamily: 'Roboto Mono', fontSize: 10, color: '#666' }}>{LEADERBOARD[1].score.toLocaleString()}</div>
        </div>
        {/* 1st */}
        <div className="flex flex-col items-center gap-2">
          <div style={{ fontSize: 22 }}>👑</div>
          <div style={{ width: 76, height: 76, background: 'rgba(255,215,0,0.1)', border: '3px solid var(--pixel-yellow)', boxShadow: '0 0 20px var(--pixel-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👾</div>
          <div style={{ width: 76, height: 60, background: 'rgba(255,215,0,0.15)', border: '2px solid var(--pixel-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px var(--pixel-yellow)' }}>
            <span style={{ fontFamily: 'Press Start 2P', fontSize: 18, color: 'var(--pixel-yellow)', textShadow: '0 0 8px var(--pixel-yellow)' }}>1</span>
          </div>
          <div style={{ fontFamily: 'Press Start 2P', fontSize: 7, color: 'var(--pixel-yellow)', textShadow: '0 0 6px var(--pixel-yellow)' }}>{LEADERBOARD[0].name}</div>
          <div style={{ fontFamily: 'Roboto Mono', fontSize: 11, color: 'var(--pixel-yellow)' }}>{LEADERBOARD[0].score.toLocaleString()}</div>
        </div>
        {/* 3rd */}
        <div className="flex flex-col items-center gap-2">
          <div style={{ fontSize: 18 }}>{LEADERBOARD[2].badge}</div>
          <div style={{ width: 60, height: 60, background: 'var(--pixel-dark-2)', border: '3px solid #cd7f32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🦊</div>
          <div style={{ width: 60, height: 32, background: 'rgba(205,127,50,0.1)', border: '2px solid #cd7f32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Press Start 2P', fontSize: 14, color: '#cd7f32' }}>3</span>
          </div>
          <div style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: '#cd7f32', textAlign: 'center' }}>{LEADERBOARD[2].name}</div>
          <div style={{ fontFamily: 'Roboto Mono', fontSize: 10, color: '#666' }}>{LEADERBOARD[2].score.toLocaleString()}</div>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 pb-6 flex flex-col gap-1">
        <div className="grid mb-2 px-2" style={{ gridTemplateColumns: '36px 1fr 40px 90px' }}>
          {['#', 'ИГРОК', 'УР', 'ОЧКИ'].map(h => (
            <div key={h} style={{ fontFamily: 'Press Start 2P', fontSize: 6, color: '#333' }}>{h}</div>
          ))}
        </div>
        {LEADERBOARD.map((player) => (
          <div key={player.rank} className="grid items-center gap-2 p-2 pixel-card" style={{
            gridTemplateColumns: '36px 1fr 40px 90px',
            borderColor: player.isPlayer ? 'var(--pixel-cyan)' : player.rank <= 3 ? rankColors[player.rank - 1] : '#1a4d1a',
            background: player.isPlayer ? 'rgba(0,255,255,0.05)' : 'var(--pixel-dark-2)',
            boxShadow: player.isPlayer ? '0 0 10px rgba(0,255,255,0.2)' : 'none',
          }}>
            <div style={{ fontFamily: 'Press Start 2P', fontSize: 9, color: player.rank <= 3 ? rankColors[player.rank - 1] : '#333' }}>
              {player.rank <= 3 ? ['🥇','🥈','🥉'][player.rank - 1] : player.rank}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ fontSize: 14 }}>{player.badge}</span>
              <span style={{
                fontFamily: 'Press Start 2P', fontSize: 7,
                color: player.isPlayer ? 'var(--pixel-cyan)' : player.rank <= 3 ? rankColors[player.rank - 1] : 'var(--pixel-green)',
                textShadow: player.isPlayer ? '0 0 6px var(--pixel-cyan)' : 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{player.name}</span>
              {player.isPlayer && (
                <span style={{ fontFamily: 'Press Start 2P', fontSize: 5, color: 'var(--pixel-cyan)', border: '1px solid var(--pixel-cyan)', padding: '1px 3px', whiteSpace: 'nowrap' }}>ВЫ</span>
              )}
            </div>
            <div style={{ fontFamily: 'Press Start 2P', fontSize: 8, color: '#444' }}>{player.level}</div>
            <div style={{ fontFamily: 'Roboto Mono', fontSize: 11, color: player.rank <= 3 ? rankColors[player.rank - 1] : '#777', textAlign: 'right' }}>
              {player.score.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>("menu");

  return (
    <div key={screen} className="animate-fade-up">
      {screen === "menu" && <MenuScreen onNavigate={setScreen} />}
      {screen === "levels" && <LevelsScreen onNavigate={setScreen} />}
      {screen === "leaderboard" && <LeaderboardScreen onNavigate={setScreen} />}
    </div>
  );
}