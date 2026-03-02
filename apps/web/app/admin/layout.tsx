// app/admin/layout.tsx
import { Search } from 'lucide-react';
import SidebarNav from './approvals/components/SideBarNav'; // Import the new component

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0f0f0f] text-gray-300 font-sans overflow-hidden">
      
      <div className="w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col">
        <div className="p-6">
          <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-wider">
            ContestArena
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Admin OS</div>
        </div>

        <SidebarNav />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-gray-800 bg-[#1a1a1a] flex items-center justify-between px-8">
          <div className="font-medium text-white">Admin Dashboard</div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Search..." className="bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none w-64" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}