import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { Fabrics } from './components/Fabrics';
import { Factories } from './components/Factories';
import { Suppliers } from './components/Suppliers';
import { Stores } from './components/Stores';
import { Products } from './components/Products';
import { QuickScan } from './components/QuickScan';
import { motion, AnimatePresence } from 'motion/react';

import { AuthProvider, useAuth } from './components/AuthProvider';
import { Login } from './components/Login';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'fabrics': return <Fabrics />;
      case 'suppliers': return <Suppliers />;
      case 'stores': return <Stores />;
      case 'products': return <Products />;
      case 'factories': return <Factories />;
      case 'scan': return <QuickScan />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 md:ml-[260px] min-h-screen flex flex-col">
        <TopBar />
        
        <main className="flex-1 p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="w-full py-4 px-8 bg-white border-t border-outline-variant flex flex-col md:flex-row justify-between items-center text-xs font-medium text-secondary">
          <p>© 2024 LoomSystems Enterprise Textile Management. All rights reserved.</p>
          <div className="flex gap-6 mt-2 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">System Status</a>
            <a href="#" className="hover:text-primary transition-colors">API Docs</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
