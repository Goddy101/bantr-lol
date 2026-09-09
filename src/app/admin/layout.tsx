// src/app/admin/layout.tsx
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-neutral-800 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black tracking-tighter text-yellow-500">BANTR ADMIN</h2>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Command & Control</p>
          </div>

          <nav className="space-y-2 text-sm font-bold">
            <Link 
              href="/admin/withdrawals" 
              className="flex items-center px-4 py-3 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              💸 Payouts & Withdrawals
            </Link>
            <Link 
              href="/admin/disputes" 
              className="flex items-center px-4 py-3 rounded-xl text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
            >
              ⚔️ Dispute Resolution
            </Link>
            <Link 
              href="/admin/treasury" 
              className="flex items-center px-4 py-3 rounded-xl text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
            >
              📊 Treasury & Users
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-neutral-900">
          <Link href="/dashboard" className="text-xs font-bold text-neutral-500 hover:text-white transition-colors">
            ← Exit to App
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}