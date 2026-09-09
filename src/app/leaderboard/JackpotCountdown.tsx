"use client";

import { useState, useEffect } from "react";

interface JackpotCountdownProps {
  amount: number;
  weekEnd: string;
}

export default function JackpotCountdown({ amount, weekEnd }: JackpotCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = new Date(weekEnd).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [weekEnd]);

  if (!mounted) return <div className="h-40 animate-pulse bg-neutral-900 rounded-3xl" />; // SSR placeholder

  return (
    <section className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center mb-8 group animate-in slide-in-from-top-8 duration-700">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all duration-700 pointer-events-none" />
      
      <div className="relative z-10">
        <h2 className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" /> Weekly Jackpot
        </h2>
        
        <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.2)]">
          <span className="text-3xl text-neutral-500">₦</span>
          {amount.toLocaleString()}
        </div>

        {/* Countdown Timer */}
        <div className="inline-flex bg-neutral-950 border border-neutral-800 rounded-xl p-3 shadow-inner">
          <div className="flex items-center gap-3 text-center">
            <div>
              <div className="text-xl font-black text-white w-8">{timeLeft.days}</div>
              <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Days</div>
            </div>
            <div className="text-neutral-700 font-black">:</div>
            <div>
              <div className="text-xl font-black text-white w-8">{timeLeft.hours}</div>
              <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Hrs</div>
            </div>
            <div className="text-neutral-700 font-black">:</div>
            <div>
              <div className="text-xl font-black text-white w-8">{timeLeft.mins}</div>
              <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Min</div>
            </div>
            <div className="text-neutral-700 font-black">:</div>
            <div>
              <div className="text-xl font-black text-yellow-500 w-8 animate-pulse">{timeLeft.secs}</div>
              <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Sec</div>
            </div>
          </div>
        </div>
        
        <p className="text-[10px] text-neutral-500 mt-4 font-bold uppercase tracking-widest">
          Pays out to the #1 ranked Odogwu
        </p>
      </div>
    </section>
  );
}