import { useState } from "react";
import { Stars } from "./GameScreen";
import {
  LEVELS_CONFIG, ACHIEVEMENTS, LEADERBOARD,
  LEVEL_TIME_THRESHOLDS, formatTime,
  type Screen, type Progress,
} from "./gameTypes";

// ─── LEVELS SCREEN ────────────────────────────────────────────────────────────

export function LevelsScreen({ onNavigate, onPlay, progress }: { onNavigate: (s: Screen) => void; onPlay: (id: number) => void; progress: Progress }) {
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

export function LeaderboardScreen({ onNavigate, progress }: { onNavigate: (s: Screen) => void; progress: Progress }) {
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
