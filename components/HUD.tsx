
import React, { useEffect, useState } from 'react';
import { GameState } from '../types';

interface HUDProps {
  state: GameState;
}

const HUD: React.FC<HUDProps> = ({ state }) => {
  const [visValues, setVisValues] = useState<number[]>([]);

  // Simple animation for the visualizer
  useEffect(() => {
    if (state.isPaused) return;
    const interval = setInterval(() => {
      setVisValues(Array.from({length: 6}, () => 20 + Math.random() * 80));
    }, 100);
    return () => clearInterval(interval);
  }, [state.isPaused]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between">
      {/* Header Row */}
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-xl">
             <div className="text-zinc-500 text-[10px] font-black tracking-widest uppercase mb-1">Current Sync</div>
             <div className="text-5xl font-black text-white italic tracking-tighter">{Math.floor(state.score)}</div>
          </div>
          <div className="bg-black/40 px-4 py-2 rounded-2xl border border-white/5 w-fit">
            <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Global Record: </span>
            <span className="text-white font-black text-sm">{state.highScore}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-6">
          <div className="flex gap-1.5 bg-black/40 p-3 rounded-2xl border border-white/5">
            {[...Array(state.maxLives)].map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-10 rounded-md skew-x-[-15deg] transition-all duration-300 shadow-lg ${
                  i < Math.floor(state.lives) ? 'bg-green-500 shadow-green-500/20' : 'bg-white/5 border border-white/5'
                }`}
              />
            ))}
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center min-w-32 flex items-center justify-center gap-4">
            <div className="text-left">
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">Elapsed</p>
              <p className="text-xl font-black text-white font-mono">{formatTime(state.currentTime)}</p>
            </div>
            
            {/* Visualizer */}
            <div className="flex items-end gap-1 h-8">
              {visValues.map((v, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-green-500/60 rounded-full transition-all duration-100" 
                  style={{ height: `${v}%` }} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Row */}
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-4xl shadow-2xl">
             {state.avatar.emoji}
           </div>
           {state.combo > 1 && (
             <div className="animate-in slide-in-from-left duration-300">
               <div className="text-green-400 text-5xl font-black italic tracking-tighter drop-shadow-2xl">x{state.combo}</div>
               <div className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Multiplier Engaged</div>
             </div>
           )}
        </div>

        <div className="text-right space-y-1">
          <div className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase">Phase Status</div>
          <div className="text-3xl font-black text-white/40 italic flex items-baseline gap-2">
            <span className="text-white">LVL</span>
            <span className="text-4xl">{Math.floor(state.difficulty)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
