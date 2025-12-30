
import React from 'react';
import { LeaderboardEntry, PlayerAvatar, GameTheme } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  avatars: PlayerAvatar[];
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, avatars, onBack }) => {
  const getAvatarEmoji = (id: string) => avatars.find(a => a.id === id)?.emoji || '👤';
  
  const themeIcons: Record<GameTheme, string> = {
    [GameTheme.COSMIC]: '🌌',
    [GameTheme.NEON_CITY]: '🌃',
    [GameTheme.NATURE]: '🍃',
    [GameTheme.URBAN_RAIN]: '🏙️',
    [GameTheme.MIND_LAB]: '🧠',
    [GameTheme.RETRO]: '🎮'
  };

  return (
    <div className="w-full max-w-4xl p-8 bg-zinc-900/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-end mb-12">
        <div className="space-y-2">
          <h2 className="text-5xl font-black italic tracking-tighter text-white">GLOBAL RECORDS</h2>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Neural Sync Hall of Fame</p>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
        >
          Close [ESC]
        </button>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
        {entries.length === 0 ? (
          <div className="py-20 text-center text-zinc-600 font-black uppercase tracking-widest opacity-50">
            No Records Logged in this sector
          </div>
        ) : (
          entries.map((entry, index) => (
            <div 
              key={entry.id}
              className={`flex items-center gap-6 p-4 rounded-2xl border transition-all ${
                index === 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="w-8 text-2xl font-black italic text-zinc-600 text-center">
                {index + 1}
              </div>
              <div className="text-3xl">{getAvatarEmoji(entry.avatarId)}</div>
              <div className="flex-1 text-left">
                <div className="text-white font-black tracking-widest text-sm uppercase">{entry.pilotName}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase px-2 py-0.5 bg-black/40 rounded-md border border-white/5">
                    {themeIcons[entry.theme]} {entry.theme.replace('_', ' ')}
                  </span>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 bg-black/40 rounded-md border border-white/5 ${
                    entry.difficulty === 'HARD' ? 'text-red-500' : entry.difficulty === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {entry.difficulty}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black italic text-white tracking-tighter">{entry.score}</div>
                <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Final Sync</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-12 p-6 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Decentralized Storage Encrypted</p>
        </div>
        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">V4.1 High Score Table</p>
      </div>
    </div>
  );
};

export default Leaderboard;
