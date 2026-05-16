import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

import { useAuth } from './AuthProvider';

export const TopBar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header id="top-bar" className="flex justify-between items-center w-full px-8 h-20 bg-surface-bright/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-40">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-full max-w-lg hidden lg:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search assets, stock codes, or partners..." 
            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-outline-variant/20 rounded-2xl text-sm focus:bg-white focus:border-primary/30 transition-all outline-none"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          <button className="text-secondary hover:text-primary p-2 rounded-xl hover:bg-primary/5 transition-all relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface-bright"></span>
          </button>
          <button className="text-secondary hover:text-primary p-2 rounded-xl hover:bg-primary/5 transition-all">
            <Settings size={18} />
          </button>
        </div>

        <div className="h-10 w-10 rounded-full border border-outline-variant/30 overflow-hidden cursor-pointer">
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName}`} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};
