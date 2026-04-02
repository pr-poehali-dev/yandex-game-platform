import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { PixelChar } from "./GameScreen";
import { GAME_MODES, ACHIEVEMENTS, type Screen, type Progress } from "./gameTypes";

export function MenuScreen({ onNavigate, progress }: { onNavigate: (s: Screen) => void; progress: Progress }) {
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
