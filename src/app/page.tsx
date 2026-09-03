import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-400 uppercase tracking-widest mx-auto">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          The Arena is Live
        </div>

        {/* Hero Text */}
        <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter leading-[1.1]">
          Talk is cheap. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            Back it up.
          </span>
        </h1>

        <p className="text-lg text-neutral-400 font-medium max-w-md mx-auto">
          The first peer-to-peer banter platform. Put your money where your mouth is, cook your friends, and share the receipts.
        </p>

        {/* Call to Action */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login" className="w-full sm:w-auto">
            <button className="w-full bg-green-500 text-black font-black text-lg px-10 py-4 rounded-xl hover:bg-green-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              ENTER THE ARENA
            </button>
          </Link>
          
          <a href="#how-it-works" className="w-full sm:w-auto text-neutral-400 font-bold text-sm hover:text-white transition-colors py-4 px-6">
            How it works
          </a>
        </div>
        
      </div>

      {/* Footer / Social Proof */}
      <div className="absolute bottom-10 left-0 right-0 text-center text-xs font-bold text-neutral-600 uppercase tracking-widest">
        Powered by Bachs.io Escrow
      </div>
    </div>
  );
}