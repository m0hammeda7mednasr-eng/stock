import React from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-bright flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-3xl soft-shadow border border-outline-variant/30 max-w-md w-full text-center space-y-8">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
          <LogIn size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Inventory OS</h1>
          <p className="text-secondary mt-2">Manage your global supply chain with real-time tracking and analytics.</p>
        </div>
        <button 
          onClick={signInWithGoogle}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>
        <p className="text-xs text-secondary italic">
          Sign-in is required to access the secure inventory database.
        </p>
      </div>
    </div>
  );
};
