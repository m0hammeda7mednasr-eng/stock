import React from 'react';
import { 
  LineChart, 
  Database, 
  Package, 
  Layers, 
  Store, 
  Scan, 
  HelpCircle, 
  LogOut,
  Plus,
  Warehouse,
  Users
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { signOut } from '../lib/firebase';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LineChart },
  { id: 'fabrics', label: 'Fabrics', icon: Database },
  { id: 'suppliers', label: 'Suppliers', icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'factories', label: 'Factories', icon: Warehouse },
  { id: 'stores', label: 'Stores', icon: Store },
  { id: 'scan', label: 'Scan', icon: Scan },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();

  return (
    <aside id="sidebar" className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[280px] bg-white p-6 z-50 border-r border-outline-variant/30">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Warehouse className="text-white" size={24} />
        </div>
        <h1 className="font-bold text-2xl text-on-surface tracking-tight leading-none">Loom<span className="text-primary italic">Sync</span></h1>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-primary text-white soft-shadow' 
                : 'text-secondary hover:bg-primary/5 hover:text-primary'
            }`}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-sm font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-6 border-t border-outline-variant/20">
        <div className="flex items-center gap-3 px-2 mb-4">
          <img src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName}`} className="w-10 h-10 rounded-full border border-outline-variant/30" alt="User" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-on-surface truncate">{user?.displayName}</div>
            <div className="text-[10px] text-secondary truncate">{user?.email}</div>
          </div>
        </div>
        
        <button 
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary hover:bg-error/10 hover:text-error transition-all"
        >
          <LogOut size={20} />
          <span className="text-sm font-bold">Logout Session</span>
        </button>
      </div>
    </aside>
  );
};
