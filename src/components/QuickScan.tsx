import React, { useState } from 'react';
import { Scan, Camera, X, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const QuickScan: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([
    { id: 'SCN-9023', code: 'PRD-DNM-201', type: 'Product', timestamp: '12:05 PM', status: 'success' },
    { id: 'SCN-9022', code: 'FAB-CT-88', type: 'Fabric', timestamp: '11:42 AM', status: 'error' },
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-4xl font-bold text-on-surface tracking-tight">Quick Scan</h2>
        <p className="text-lg text-secondary mt-1">Update inventory instantly via barcode or manual entry.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="aspect-video bg-on-surface rounded-3xl overflow-hidden relative border-4 border-outline-variant/20 flex items-center justify-center soft-shadow">
            {isScanning ? (
              <>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-primary rounded-3xl relative overflow-hidden">
                    <motion.div 
                      className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(79,70,229,0.8)]"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
                <div className="absolute bottom-6 flex gap-4">
                  <button 
                    onClick={() => setIsScanning(false)}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full backdrop-blur-md flex items-center gap-2 text-sm font-bold transition-all border border-white/20"
                  >
                    <X size={18} /> Stop Camera
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <Camera size={32} className="text-white/50" />
                </div>
                <h4 className="text-white text-xl font-bold mb-2">Camera Access</h4>
                <p className="text-white/60 text-sm max-w-xs mb-8">Grant camera permission to scan product codes and verify stock details on the fly.</p>
                <button 
                  onClick={() => setIsScanning(true)}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 hover:opacity-90 transition-opacity soft-shadow"
                >
                  <Scan size={24} /> Start Scanning
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-outline-variant/30 soft-shadow">
            <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-6">Device Pulse</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-4 bg-surface-bright rounded-2xl border border-outline-variant/20 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-success" />
                <span className="text-xs font-bold text-on-surface">Cloud Connected</span>
              </div>
              <div className="flex-1 p-4 bg-surface-bright rounded-2xl border border-outline-variant/20 flex items-center gap-3">
                <AlertCircle size={20} className="text-primary" />
                <span className="text-xs font-bold text-on-surface">Battery 82%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-outline-variant/30 flex flex-col overflow-hidden soft-shadow">
          <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-bright/30">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <History size={20} className="text-primary" />
              Recent Syncs
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recentScans.map((scan, i) => (
              <div key={scan.id} className="p-5 border-b border-outline-variant/10 last:border-0 hover:bg-surface-bright transition-colors flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    scan.status === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  }`}>
                    {scan.status === 'success' ? <Scan size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div>
                    <div className="font-bold text-on-surface text-sm">{scan.code}</div>
                    <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">{scan.type} • {scan.timestamp}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-outline-variant font-bold">
                  {scan.id}
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-surface-bright/50 border-t border-outline-variant/20">
            <button className="w-full bg-white border border-outline-variant text-on-surface py-3 rounded-xl text-sm font-bold hover:bg-surface-bright transition-colors soft-shadow">
              Manual Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
