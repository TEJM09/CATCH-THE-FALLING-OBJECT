
import React, { useMemo } from 'react';

interface GameOverProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onExit: () => void;
  onShowLeaderboard: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, highScore, onRestart, onExit, onShowLeaderboard }) => {
  const isNewHigh = score >= highScore && score > 0;

  const evaluation = useMemo(() => {
    if (score >= 3000) return { rank: 'S', title: 'SINGULARITY ENTITY', color: 'text-purple-400', desc: 'Transcended physical constraints.' };
    if (score >= 1500) return { rank: 'A', title: 'VOID ARCHITECT', color: 'text-blue-400', desc: 'Mastery of gravitational flux detected.' };
    if (score >= 750) return { rank: 'B', title: 'GRAVITY MASTER', color: 'text-emerald-400', desc: 'Superior neural coordination.' };
    if (score >= 250) return { rank: 'C', title: 'KINETIC PILOT', color: 'text-yellow-400', desc: 'Standard operational proficiency.' };
    return { rank: 'D', title: 'NEURAL NOVICE', color: 'text-zinc-500', desc: 'Neural synchronization failed early.' };
  }, [score]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center animate-in fade-in zoom-in duration-700 w-full max-w-2xl p-6">
      <div className="space-y-2">
        <h2 className="text-7xl font-black italic tracking-tighter text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          DE-SYNCED
        </h2>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] opacity-60">
          Mission Termination Protocol 0x442
        </p>
      </div>

      <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/10 p-1 rounded-[3.5rem] shadow-2xl w-full">
        <div className="bg-black/40 rounded-[3.4rem] p-10 space-y-8 border border-white/5">
          
          {/* Rank Section */}
          <div className="flex items-center justify-between px-4 pb-8 border-b border-white/5">
            <div className="text-left space-y-1">
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Performance Rank</p>
              <h3 className={`text-2xl font-black italic tracking-tight ${evaluation.color}`}>{evaluation.title}</h3>
              <p className="text-zinc-600 text-[10px] font-medium max-w-[200px] leading-tight">{evaluation.desc}</p>
            </div>
            <div className={`text-8xl font-black italic tracking-tighter ${evaluation.color} drop-shadow-2xl`}>
              {evaluation.rank}
            </div>
          </div>

          <div className="space-y-1 py-4">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Final Matter Extraction</p>
            <div className="flex items-baseline justify-center gap-3">
               <p className={`text-8xl font-black italic tracking-tighter ${isNewHigh ? 'text-green-400 animate-pulse' : 'text-white'}`}>
                {Math.floor(score)}
              </p>
              <span className="text-zinc-600 font-black text-xl italic tracking-tighter uppercase opacity-40">Units</span>
            </div>
            {isNewHigh && (
              <div className="mt-2 bg-green-500/10 border border-green-500/20 py-2 px-4 rounded-full inline-block">
                <p className="text-green-500 font-bold text-[9px] tracking-[0.2em] uppercase">New Sector High Score Established</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/5">
            <div className="text-left bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Previous Best</p>
              <p className="text-2xl font-black text-zinc-400 italic tracking-tighter">{highScore}</p>
            </div>
            <div className="flex flex-col items-stretch justify-center gap-2">
               <button 
                 onClick={onShowLeaderboard}
                 className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-green-400 transition-all"
               >
                 <span>📊</span> Hall of Fame
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <button 
          onClick={onRestart}
          className="group relative w-full py-7 bg-white text-zinc-950 font-black text-2xl rounded-[2.5rem] transition-all transform hover:scale-[1.02] active:scale-95 shadow-2xl shadow-white/5 overflow-hidden"
        >
          RE-INITIALIZE
          <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button 
          onClick={onExit}
          className="w-full py-4 text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all opacity-40 hover:opacity-100"
        >
          Abort Mission & Return to Core
        </button>
      </div>
    </div>
  );
};

export default GameOver;
