"use client";

interface SponsorProps {
  sponsor: {
    brand_name: string;
    tagline: string;
    logo_url: string;
    link_url?: string;
  } | null;
}

export default function SponsorCard({ sponsor }: SponsorProps) {
  if (!sponsor) return null; // If no active sponsor, don't show the card at all

  return (
    <a 
      href={sponsor.link_url || "#"} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block w-full bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-5 relative overflow-hidden group shadow-lg hover:border-neutral-700 transition-all duration-500"
    >
      {/* Premium ambient glow */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all duration-700" />
      
      <div className="flex items-center gap-4 relative z-10">
        {/* Brand Logo Container */}
        <div className="w-16 h-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform duration-500">
          {/* Using standard img tag for external URLs without needing next.config.js whitelisting */}
          <img 
            src={sponsor.logo_url} 
            alt={sponsor.brand_name} 
            className="max-w-full max-h-full object-contain filter drop-shadow-md"
          />
        </div>

        {/* Ad Copy */}
        <div className="flex-1">
          <div className="text-[9px] text-yellow-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
            Official Matchday Partner
          </div>
          <h3 className="font-black text-white text-base leading-tight mb-1">
            {sponsor.brand_name}
          </h3>
          <p className="text-[11px] text-neutral-400 font-medium leading-snug line-clamp-2">
            {sponsor.tagline}
          </p>
        </div>
      </div>
    </a>
  );
}