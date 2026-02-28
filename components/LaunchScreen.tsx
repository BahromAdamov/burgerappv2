
import React from 'react';
import { StreetDogLogo } from './StreetDogLogo';
import { BRAND_ORANGE } from '../constants';
import { safeHaptic } from '../utils';
import { Flame } from 'lucide-react';

interface LaunchScreenProps {
  onStart: () => void;
}

const LaunchScreen: React.FC<LaunchScreenProps> = ({ onStart }) => {
  const tg = window.Telegram?.WebApp;

  const handleStart = () => {
    safeHaptic('heavy');
    if (tg && tg.expand) {
      tg.expand();
    }
    onStart();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between p-8 text-center animate-in fade-in duration-700" style={{ backgroundColor: BRAND_ORANGE }}>
      <div className="flex-grow flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <div className="absolute -inset-10 bg-white/20 blur-3xl rounded-full animate-pulse" />
          <StreetDogLogo className="h-32 drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10" iconColor="white" textColor="black" />
        </div>
        
      </div>

      <div className="w-full space-y-12 pb-12">
        <div className="flex justify-center gap-6 opacity-30">
          <Flame className="w-6 h-6 text-white" />
          <Flame className="w-6 h-6 text-white" />
          <Flame className="w-6 h-6 text-white" />
        </div>

        <button
          onClick={handleStart}
          className="group w-full bg-black py-10 rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] flex items-center justify-center active:scale-95 transition-all relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-4xl font-black italic uppercase tracking-wider" style={{ color: BRAND_ORANGE }}>
            НАЧАТЬ
          </span>
        </button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 pointer-events-none opacity-10">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-black">STREET DOG 2025</p>
      </div>
    </div>
  );
};

export default LaunchScreen;
