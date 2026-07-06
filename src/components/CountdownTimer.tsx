import React, { useState, useEffect } from 'react';
import { Clock, Flame, Percent } from 'lucide-react';

interface CountdownTimerProps {
  deadline: string;
  variant: 'tile' | 'banner';
  onExpire?: () => void;
  promoLabel?: string;
}

export default function CountdownTimer({ deadline, variant, onExpire, promoLabel }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(deadline) - +new Date();
      
      if (difference <= 0) {
        if (onExpire) onExpire();
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  if (timeLeft.isExpired) {
    const difference = +new Date() - +new Date(deadline);
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (difference > twentyFourHours) {
      return null;
    }

    if (variant === 'banner') {
      return (
        <div className="bg-rose-950 text-rose-200 border-b border-rose-900 py-3 px-6 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>L'offre de lancement est terminée — Tarif standard en vigueur</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border border-slate-200">
        <Clock className="w-3.5 h-3.5" />
        <span>Offre expirée</span>
      </div>
    );
  }

  const padZero = (num: number) => String(num).padStart(2, '0');

  if (variant === 'tile') {
    return (
      <div className="bg-gradient-to-br from-amber-500/12 via-orange-500/8 to-transparent border-2 border-amber-400/40 rounded-[2rem] p-5 flex flex-col gap-4 shadow-md shadow-amber-500/5 relative overflow-hidden group/timer scale-[1.02]">
        {/* Decorative subtle background elements */}
        <div className="absolute -top-8 -right-8 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover/timer:scale-150 transition-transform duration-500"></div>
        <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-orange-500/5 rounded-full blur-lg pointer-events-none"></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider">
            <Flame className="w-5 h-5 text-orange-500 animate-pulse shrink-0" />
            <span>Offre Limitée</span>
          </div>
          <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-orange-700 bg-orange-100 px-3 py-1 rounded-md animate-pulse border border-orange-200/50">
            {promoLabel || "Promo active"}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center relative z-10">
          <div className="bg-gradient-to-b from-amber-500/20 to-orange-500/10 border border-amber-500/15 rounded-2xl py-3 px-1.5 shadow-sm">
            <div className="text-xl md:text-2xl font-black text-orange-950 font-mono tracking-tight leading-none">{padZero(timeLeft.days)}</div>
            <div className="text-[9px] md:text-[10px] font-black uppercase text-amber-800 tracking-wider mt-1.5">Jours</div>
          </div>
          <div className="bg-gradient-to-b from-amber-500/20 to-orange-500/10 border border-amber-500/15 rounded-2xl py-3 px-1.5 shadow-sm">
            <div className="text-xl md:text-2xl font-black text-orange-950 font-mono tracking-tight leading-none">{padZero(timeLeft.hours)}</div>
            <div className="text-[9px] md:text-[10px] font-black uppercase text-amber-800 tracking-wider mt-1.5">Heures</div>
          </div>
          <div className="bg-gradient-to-b from-amber-500/20 to-orange-500/10 border border-amber-500/15 rounded-2xl py-3 px-1.5 shadow-sm">
            <div className="text-xl md:text-2xl font-black text-orange-950 font-mono tracking-tight leading-none">{padZero(timeLeft.minutes)}</div>
            <div className="text-[9px] md:text-[10px] font-black uppercase text-amber-800 tracking-wider mt-1.5">Min</div>
          </div>
          <div className="bg-gradient-to-b from-amber-500/25 to-orange-500/15 border border-amber-500/20 rounded-2xl py-3 px-1.5 shadow-sm animate-pulse">
            <div className="text-xl md:text-2xl font-black text-orange-600 font-mono tracking-tight leading-none">{padZero(timeLeft.seconds)}</div>
            <div className="text-[9px] md:text-[10px] font-black uppercase text-orange-700 tracking-wider mt-1.5">Sec</div>
          </div>
        </div>
      </div>
    );
  }

  // banner variant
  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 text-white py-3.5 px-6 shadow-xl border-b-2 border-orange-500/20 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 z-50 relative overflow-hidden">
      {/* Decorative vector overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none"></div>
      <div className="absolute -top-16 -left-16 w-36 h-36 bg-white/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-white/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}></div>

      <div className="flex items-center gap-3 relative z-10 text-center md:text-left flex-col sm:flex-row">
        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-sm animate-bounce">
          <Flame className="w-4 h-4 text-amber-300 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">{promoLabel || "Vente Flash active"}</span>
        </div>
        <p className="text-xs md:text-sm font-extrabold tracking-wide text-white drop-shadow-sm">
          Profitez du tarif préférentiel avant expiration de l'offre spéciale :
        </p>
      </div>

      <div className="flex items-center gap-2 relative z-10 font-mono">
        <div className="flex items-center gap-2 bg-slate-950/55 backdrop-blur-xl py-2 px-4 rounded-2xl border-2 border-white/15 shadow-2xl">
          
          <div className="flex flex-col items-center min-w-[36px]">
            <span className="text-base md:text-xl font-black tracking-tight text-amber-300 leading-none">{padZero(timeLeft.days)}</span>
            <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-wider">Jours</span>
          </div>
          
          <span className="text-amber-400 font-black text-base md:text-lg mb-2 leading-none animate-pulse">:</span>
          
          <div className="flex flex-col items-center min-w-[36px]">
            <span className="text-base md:text-xl font-black tracking-tight text-amber-300 leading-none">{padZero(timeLeft.hours)}</span>
            <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-wider">Heures</span>
          </div>
          
          <span className="text-amber-400 font-black text-base md:text-lg mb-2 leading-none animate-pulse">:</span>
          
          <div className="flex flex-col items-center min-w-[36px]">
            <span className="text-base md:text-xl font-black tracking-tight text-amber-300 leading-none">{padZero(timeLeft.minutes)}</span>
            <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-wider">Min</span>
          </div>
          
          <span className="text-amber-400 font-black text-base md:text-lg mb-2 leading-none animate-pulse">:</span>
          
          <div className="flex flex-col items-center min-w-[36px] animate-pulse">
            <span className="text-base md:text-xl font-black tracking-tight text-orange-400 leading-none">{padZero(timeLeft.seconds)}</span>
            <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-wider">Sec</span>
          </div>

        </div>
      </div>
    </div>
  );
}
