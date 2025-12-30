
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GameObject, ObjectType, InputMode, GameTheme, PlayerAvatar, GameDifficulty } from '../types';
import VisionTracker from './VisionTracker';
import HUD from './HUD';
import { audioEngine } from './AudioEngine';

interface GameWorldProps {
  onGameOver: (score: number) => void;
  highScore: number;
  inputMode: InputMode;
  theme: GameTheme;
  gameDifficulty: GameDifficulty;
  avatar: PlayerAvatar;
}

const THEME_DATA: Record<GameTheme, any> = {
  [GameTheme.COSMIC]: { accent: '#60a5fa', gravityMult: 0.9, background: 'radial-gradient(circle at center, #1e1b4b, #020617)', good: ['💎', '✨', '☄️'], bad: ['🪨', '🌑', '💥'] },
  [GameTheme.NEON_CITY]: { accent: '#f472b6', gravityMult: 1.1, background: 'linear-gradient(to bottom, #2e1065, #000000)', good: ['💾', '⚡', '🔋'], bad: ['👾', '💀', '🔥'] },
  [GameTheme.NATURE]: { accent: '#4ade80', gravityMult: 0.7, background: 'linear-gradient(to bottom, #ecfdf5, #064e3b)', good: ['🍎', '🍒', '🌻'], bad: ['🕸️', '🍂', '🥀'] },
  [GameTheme.URBAN_RAIN]: { accent: '#94a3b8', gravityMult: 1.3, background: 'linear-gradient(to bottom, #334155, #0f172a)', good: ['☂️', '☕', '💎'], bad: ['⚡', '🚧', '💥'] },
  [GameTheme.MIND_LAB]: { accent: '#c084fc', gravityMult: 1.0, background: 'radial-gradient(circle, #2d064e, #000000)', good: ['🧠', '🧩', '🧪'], bad: ['🛑', '⚠️', '📉'] },
  [GameTheme.RETRO]: { accent: '#fbbf24', gravityMult: 1.2, background: '#000000', good: ['⭐', '🍄', '🍒'], bad: ['👻', '💣', '👾'] }
};

const DIFFICULTY_SETTINGS = {
  [GameDifficulty.EASY]: { initialLives: 5, growth: 0.03, hazardPenalty: 1, spawnRateBase: 1200 },
  [GameDifficulty.MEDIUM]: { initialLives: 3, growth: 0.1, hazardPenalty: 1, spawnRateBase: 1000 },
  [GameDifficulty.HARD]: { initialLives: 1, growth: 0.25, hazardPenalty: 1, spawnRateBase: 700 }
};

const GameWorld: React.FC<GameWorldProps> = ({ onGameOver, highScore, inputMode, theme, gameDifficulty, avatar }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // High-Frequency Mutable State (Bypasses React rendering)
  const engine = useRef({
    score: 0,
    lives: DIFFICULTY_SETTINGS[gameDifficulty].initialLives,
    combo: 0,
    objects: [] as GameObject[],
    handX: 0.5,
    isHandDetected: true,
    difficulty: 1,
    spawnTimer: 0,
    lastTime: 0,
    startTime: Date.now()
  });

  // UI state for HUD only (Updates at 10Hz to save CPU)
  const [uiState, setUiState] = useState({ score: 0, lives: 0, combo: 0, difficulty: 1, currentTime: 0 });

  useEffect(() => {
    audioEngine.playThemeMusic(theme);
    return () => audioEngine.stopAll();
  }, [theme]);

  const handleHandUpdate = useCallback((x: number, detected: boolean) => {
    engine.current.handX = x;
    engine.current.isHandDetected = detected;
  }, []);

  useEffect(() => {
    if (inputMode !== InputMode.CURSOR) return;
    const handleMove = (e: MouseEvent) => {
      if (isPaused) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      engine.current.handX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [inputMode, isPaused]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    const settings = DIFFICULTY_SETTINGS[gameDifficulty];
    const tData = THEME_DATA[theme];

    const loop = (time: number) => {
      if (isPaused) {
        frameId = requestAnimationFrame(loop);
        return;
      }

      const dt = time - engine.current.lastTime;
      engine.current.lastTime = time;
      const step = Math.min(dt, 32) / 16.67; // Normalize to 60fps

      // Physics & Game Logic
      const e = engine.current;
      
      // Update Objects
      e.objects = e.objects.map(obj => ({
        ...obj,
        y: obj.y + obj.speed * step * tData.gravityMult * e.difficulty
      })).filter(obj => obj.y < 650);

      // Spawn Logic
      e.spawnTimer += dt;
      let spawnRate = Math.max(200, settings.spawnRateBase - (e.score * 3));
      if (e.spawnTimer > spawnRate) {
        e.spawnTimer = 0;
        const isBad = Math.random() < 0.22;
        e.objects.push({
          id: Math.random().toString(),
          x: Math.random() * 700 + 50,
          y: -50,
          radius: 20,
          speed: 4 + Math.random() * 3,
          type: isBad ? ObjectType.BAD : ObjectType.GOOD,
          variant: isBad ? tData.bad[Math.floor(Math.random()*3)] : tData.good[Math.floor(Math.random()*3)]
        });
      }

      // Collisions
      const pw = 140, ph = 24;
      const px = e.handX * 800 - pw/2, py = 600 - 110;

      e.objects = e.objects.filter(obj => {
        const hit = obj.x > px && obj.x < px + pw && obj.y > py && obj.y < py + ph;
        if (hit) {
          if (obj.type === ObjectType.GOOD) {
            e.score += 5 + Math.floor(e.combo / 4);
            e.combo++;
            audioEngine.playCollect(theme);
          } else {
            e.lives -= settings.hazardPenalty;
            e.combo = 0;
            audioEngine.playHazard(theme);
          }
          return false;
        }
        return true;
      });

      e.difficulty = 1 + (e.score / 500) + ((Date.now() - e.startTime) / 120000);

      if (e.lives <= 0) {
        onGameOver(Math.floor(e.score));
        return;
      }

      // --- RENDERING (Direct Canvas Calls - Zero React Overhead) ---
      ctx.clearRect(0, 0, 800, 600);
      
      // Render Paddle
      ctx.shadowBlur = e.isHandDetected ? 30 : 0;
      ctx.shadowColor = tData.accent;
      ctx.fillStyle = e.isHandDetected ? 'white' : '#333';
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 12);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Avatar
      ctx.font = '40px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(avatar.emoji, px + pw/2, py - 15);

      // Render Objects
      ctx.font = '32px Inter';
      e.objects.forEach(obj => {
        ctx.fillText(obj.variant, obj.x, obj.y);
      });

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    
    // Low-frequency UI sync (10 times per second)
    const uiInterval = setInterval(() => {
      const e = engine.current;
      setUiState({
        score: e.score,
        lives: e.lives,
        combo: e.combo,
        difficulty: e.difficulty,
        currentTime: (Date.now() - e.startTime) / 1000
      });
    }, 100);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(uiInterval);
    };
  }, [isPaused, theme, avatar, onGameOver, gameDifficulty]);

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto overflow-hidden">
      <div className="flex flex-col gap-6 w-full md:w-80">
        <div className={`p-1 rounded-3xl overflow-hidden border-2 transition-all ${engine.current.isHandDetected ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-zinc-800'}`}>
          {inputMode === InputMode.VISION ? (
            <VisionTracker onHandUpdate={handleHandUpdate} config={{sensitivity: 1, threshold: 0.1}} />
          ) : (
            <div className="w-full h-40 bg-zinc-950 flex flex-col items-center justify-center border border-white/5 rounded-2xl">
              <span className="text-4xl mb-2">🖱️</span>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Manual Override</p>
            </div>
          )}
        </div>
        
        <div className="bg-zinc-900/60 rounded-[2rem] border border-white/5 p-6 space-y-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">{avatar.emoji}</div>
             <div className="text-xs font-black uppercase tracking-widest text-zinc-400">{avatar.name}</div>
           </div>
           <button 
             onClick={() => setIsPaused(!isPaused)}
             className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
           >
             {isPaused ? 'RESUME LINK' : 'SUSPEND SYNC'}
           </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative bg-black rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />
        
        {/* Pass ONLY uiState to HUD to prevent high-frequency re-renders of the whole GameWorld */}
        <HUD state={{ 
            ...engine.current, 
            score: uiState.score, 
            lives: uiState.lives, 
            combo: uiState.combo, 
            difficulty: uiState.difficulty,
            currentTime: uiState.currentTime,
            highScore,
            maxLives: DIFFICULTY_SETTINGS[gameDifficulty].initialLives,
            inputMode,
            theme,
            avatar,
            isPaused,
            objects: []
          } as any} 
        />
        
        {isPaused && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center">
             <div className="text-white font-black text-6xl italic tracking-tighter animate-pulse">PAUSED</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameWorld;
