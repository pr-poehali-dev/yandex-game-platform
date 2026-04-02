import { useState } from "react";
import { calcStars, type Screen, type Progress } from "@/components/game/gameTypes";
import { MenuScreen } from "@/components/game/MenuScreen";
import { LevelsScreen, LeaderboardScreen } from "@/components/game/LevelsScreen";
import { GameScreen, ResultScreen } from "@/components/game/GameScreen";

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
