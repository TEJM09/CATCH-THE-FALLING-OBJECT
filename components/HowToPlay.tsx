
import React from 'react';
import { InputMode } from '../types';

interface HowToPlayProps {
  onStart: () => void;
  inputMode: InputMode;
}

const HowToPlay: React.FC<HowToPlayProps> = ({ onStart, inputMode }) => {
  return (
    <div className="max-w-xl w-full bg-zinc-900/80 p-12 rounded-[3rem] border border-white/10 backdrop-blur-3xl shadow-2xl space-y-10 animate-in fade-in zoom-in duration-500">
      <div className="space-y-2 text-center">
        <h2 className="text-5xl font-black text-white italic tracking-tighter">MISSION BRIEF</h2>
        <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Initialization Protocol</p>
      </div>
      
      <div className="space-y-8">
        {inputMode === InputMode.VISION ? (
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center font-black flex-shrink-0 border border-green-500/20 text-xl italic">01</div>
            <div className="space-y-1">
              <p className="text-zinc-300 font-medium text-lg leading-snug">
                Raise your <span className="text-white font-black">Open Palm</span> roughly 2ft from the lens.
              </p>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Move Left/Right to slide the extractor.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center font-black flex-shrink-0 border border-blue-500/20 text-xl italic">01</div>
            <p className="text-zinc-300 font-medium text-lg leading-snug">Move your <span className="text-white font-black">Cursor</span> across the screen. The extractor follows your movement with <span className="text-white font-black">1:1 Precision</span>.</p>
          </div>
        )}

        <div className="flex items-start gap-6">
          <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center font-black flex-shrink-0 border border-purple-500/20 text-xl italic">02</div>
          <p className="text-zinc-300 font-medium text-lg leading-snug">Intercept <span className="text-green-400 font-black italic uppercase underline decoration-2 offset-4">Positive Matter</span>. Avoid hazardous anomalies.</p>
        </div>
      </div>

      <button 
        onClick={onStart}
        className="w-full py-6 bg-white text-zinc-950 font-black text-2xl rounded-[2rem] hover:bg-green-400 transition-all active:scale-95 shadow-2xl shadow-white/5"
      >
        GO LIVE
      </button>
    </div>
  );
};

export default HowToPlay;
