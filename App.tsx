
import React, { useState, useEffect } from 'react';
import { GameScene, InputMode, GameTheme, PlayerAvatar, GameDifficulty, LeaderboardEntry } from './types';
import StartMenu from './components/StartMenu';
import HowToPlay from './components/HowToPlay';
import GameWorld from './components/GameWorld';
import GameOver from './components/GameOver';
import Leaderboard from './components/Leaderboard';

const AVATARS: PlayerAvatar[] = [
  { id: 'aero', name: 'Aero', emoji: '🧑‍🚀', color: '#60a5fa' },
  { id: 'nova', name: 'Nova', emoji: '👩‍🎤', color: '#f472b6' },
  { id: 'gears', name: 'Gears', emoji: '🤖', color: '#fbbf24' },
  { id: 'leaf', name: 'Leaf', emoji: '🧚', color: '#4ade80' }
];

const App: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<GameScene>(GameScene.START_MENU);
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.CURSOR);
  const [theme, setTheme] = useState<GameTheme>(GameTheme.COSMIC);
  const [difficulty, setDifficulty] = useState<GameDifficulty>(GameDifficulty.MEDIUM);
  const [selectedAvatar, setSelectedAvatar] = useState<PlayerAvatar>(AVATARS[0]);
  const [pilotName, setPilotName] = useState('PILOT_01');
  const [lastScore, setLastScore] = useState(0);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('visionGravity_leaderboard');
    return saved ? JSON.parse(saved) : [];
  });

  const highScore = leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.score)) : 0;

  useEffect(() => {
    localStorage.setItem('visionGravity_leaderboard', JSON.stringify(leaderboard));
  }, [leaderboard]);

  const handleGameOver = (score: number) => {
    setLastScore(score);
    const newEntry: LeaderboardEntry = {
      id: Math.random().toString(36).substr(2, 9),
      pilotName: pilotName || 'ANONYMOUS',
      avatarId: selectedAvatar.id,
      score: Math.floor(score),
      theme,
      difficulty,
      date: Date.now()
    };
    
    setLeaderboard(prev => [...prev, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
    );
    
    setCurrentScene(GameScene.GAME_OVER);
  };

  const handleStartGame = () => setCurrentScene(GameScene.GAMEPLAY);
  const handleShowHowToPlay = () => setCurrentScene(GameScene.HOW_TO_PLAY);
  const handleExit = () => setCurrentScene(GameScene.START_MENU);
  const handleShowLeaderboard = () => setCurrentScene(GameScene.LEADERBOARD);

  return (
    <div className={`w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-1000 bg-zinc-950`}>
      {currentScene === GameScene.START_MENU && (
        <StartMenu 
          inputMode={inputMode}
          setInputMode={setInputMode}
          theme={theme}
          setTheme={setTheme}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          avatars={AVATARS}
          selectedAvatar={selectedAvatar}
          setSelectedAvatar={setSelectedAvatar}
          pilotName={pilotName}
          setPilotName={setPilotName}
          onStart={handleShowHowToPlay}
          onShowLeaderboard={handleShowLeaderboard}
        />
      )}

      {currentScene === GameScene.HOW_TO_PLAY && (
        <HowToPlay 
          inputMode={inputMode}
          onStart={handleStartGame} 
        />
      )}

      {currentScene === GameScene.GAMEPLAY && (
        <GameWorld 
          inputMode={inputMode}
          theme={theme}
          gameDifficulty={difficulty}
          avatar={selectedAvatar}
          onGameOver={handleGameOver} 
          highScore={highScore}
        />
      )}

      {currentScene === GameScene.GAME_OVER && (
        <GameOver 
          score={lastScore} 
          highScore={highScore} 
          onRestart={handleStartGame} 
          onExit={handleExit}
          onShowLeaderboard={handleShowLeaderboard}
        />
      )}

      {currentScene === GameScene.LEADERBOARD && (
        <Leaderboard 
          entries={leaderboard} 
          avatars={AVATARS}
          onBack={handleExit} 
        />
      )}
    </div>
  );
};

export default App;
