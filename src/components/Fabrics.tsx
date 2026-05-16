import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  X, 
  Search, 
  Filter, 
  DollarSign, 
  Scale, 
  Palette,
  ArrowRight,
  TrendingUp,
  History,
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { streamCollection, addItem } from '../services/dbService';
import { motion, AnimatePresence } from 'motion/react';

interface Fabric {
  id: string;
  name: string;
  unit: 'Kilogram' | 'Meter' | 'Ton' | 'Roll';
  quantity: number;
  totalCost: number;
  unitCost: number;
  color: string;
  sku: string;
  dateAdded: any;
}

export const Fabrics: React.FC = () => {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = streamCollection('fabrics', setFabrics);
    return unsub;
  }, []);

  const handleAddFabric = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as any;
    const qty = Number(target.quantity.value);
    const total = Number(target.totalCost.value);
    const unitCost = qty > 0 ? total / qty : 0;

    await addItem('fabrics', {
      name: target.name.value,
      unit: target.unit.value,
      quantity: qty,
      totalCost: total,
      unitCost: unitCost,
      color: target.color.value,
      sku: target.sku.value || `FAB-${Date.now().toString().slice(-6)}`,
      dateAdded: new Date()
    });
    setShowModal(false);
  };

  const filteredFabrics = fabrics.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.color.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = fabrics
    .filter(f => f.dateAdded)
    .map(f => ({
      ...f,
      normalizedDate: f.dateAdded.toDate ? f.dateAdded.toDate() : new Date(f.dateAdded)
    }))
    .sort((a, b) => a.normalizedDate.getTime() - b.normalizedDate.getTime())
    .reduce((acc: any[], current) => {
      const dateStr = current.normalizedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = acc.find(item => item.date === dateStr);
      if (existing) {
        existing.cost += current.totalCost;
      } else {
        acc.push({ date: dateStr, cost: current.totalCost, rawDate: current.normalizedDate });
      }
      return acc;
    }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold text-on-surface tracking-tight">Fabric Inventory</h2>
          <p className="text-lg text-secondary mt-1 font-medium">Track your raw material stock, costs, and availability.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity soft-shadow"
        >
          <Plus size={20} /> Add Fabric
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] soft-shadow border border-outline-variant/30">
          <div className="text-secondary text-xs uppercase font-bold tracking-widest mb-2">Total Value</div>
          <div className="text-3xl font-bold text-on-surface">
            ${fabrics.reduce((acc, f) => acc + (f.totalCost || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] soft-shadow border border-outline-variant/30">
          <div className="text-secondary text-xs uppercase font-bold tracking-widest mb-2">Unique Fabrics</div>
          <div className="text-3xl font-bold text-on-surface">{fabrics.length} Type(s)</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl soft-shadow border border-outline-variant/30">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-on-surface">Procurement Timeline</h3>
            <p className="text-sm text-secondary">Aggregate cost of materials added over time</p>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1rem', 
                  border: '1px solid #CBD5E1', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Cost']}
              />
              <Line 
                type="monotone" 
                dataKey="cost" 
                stroke="#4F46E5" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search and List - Redesigned */}
      <div className="bg-white rounded-3xl soft-shadow border border-outline-variant/30 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30 flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-bright/30">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, SKU, or color..."
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-outline-variant/30 outline-none focus:border-primary/30 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant/30 rounded-xl text-xs font-bold text-secondary hover:bg-white transition-all">
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-bright border-b border-outline-variant/30 text-[10px] uppercase font-bold text-secondary tracking-widest">
              <tr>
                <th className="py-4 px-6">Fabric Name</th>
                <th className="py-4 px-6">SKU</th>
                <th className="py-4 px-6">Unit</th>
                <th className="py-4 px-6 text-center">In Stock</th>
                <th className="py-4 px-6 text-center">Total Cost</th>
                <th className="py-4 px-6 text-right">Unit Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredFabrics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-secondary italic">
                    No fabrics matching your search.
                  </td>
                </tr>
              ) : (
                filteredFabrics.map((fabric) => (
                  <tr key={fabric.id} className="hover:bg-surface-bright/30 transition-colors">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg shadow-sm border border-outline-variant/30" style={{ backgroundColor: fabric.color }}></div>
                        <div>
                          <p className="font-bold text-on-surface">{fabric.name}</p>
                          <p className="text-[10px] text-secondary font-medium uppercase tracking-widest">{fabric.color}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 font-mono text-[10px] text-secondary">{fabric.sku}</td>
                    <td className="py-5 px-6 text-xs font-bold text-secondary capitalize">{fabric.unit}</td>
                    <td className="py-5 px-6 text-center">
                      <span className="font-bold text-on-surface">{fabric.quantity.toLocaleString()}</span>
                    </td>
                    <td className="py-5 px-6 text-center font-medium text-secondary">
                      ${fabric.totalCost.toLocaleString()}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <span className="px-2.5 py-1 bg-primary/5 text-primary rounded-lg font-bold text-xs">
                        ${fabric.unitCost.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Modal - Redesigned */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-outline"
            >
              <div className="p-10 border-b border-outline flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-3xl font-serif italic font-bold tracking-tight text-slate-900">Resource Registration</h3>
                  <p className="text-sm text-secondary font-medium mt-1">Log new raw material metrics into the global ERP baseline.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={32} />
                </button>
              </div>
              
              <form onSubmit={handleAddFabric} className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Resource Nomenclature</label>
                      <input 
                        name="name" 
                        required 
                        className="w-full px-6 py-4 rounded-2xl border border-outline outline-none focus:border-accent bg-slate-50 focus:bg-white transition-all font-bold text-lg" 
                        placeholder="e.g., Heavy Denim Canvas" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Metric Unit Classification</label>
                      <select 
                        name="unit" 
                        required 
                        className="w-full px-6 py-4 rounded-2xl border border-outline outline-none focus:border-accent bg-slate-50 focus:bg-white transition-all font-bold text-sm"
                      >
                        <option value="Kilogram">Kilogram (kg)</option>
                        <option value="Meter">Meter (m)</option>
                        <option value="Ton">Ton (t)</option>
                        <option value="Roll">Roll Specification</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Chromatic Profile Identification</label>
                      <div className="flex gap-6 items-center">
                        <input 
                          type="color" 
                          name="color" 
                          defaultValue="#2170E4"
                          className="w-16 h-16 rounded-2xl bg-white border border-outline cursor-pointer p-1"
                        />
                        <div className="flex-1">
                          <input 
                            name="color_name" 
                            className="w-full px-6 py-4 rounded-2xl border border-outline outline-none font-bold text-sm bg-slate-50 focus:bg-white transition-all" 
                            placeholder="e.g., Midnight Ultramarine" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Procurement Volume</label>
                      <div className="relative">
                        <Scale className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                        <input 
                          type="number" 
                          name="quantity" 
                          required 
                          step="0.01"
                          className="w-full pl-16 pr-6 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-lg bg-slate-50 focus:bg-white transition-all" 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Capital Commitment ($ Total)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-accent" size={20} />
                        <input 
                          type="number" 
                          name="totalCost" 
                          required 
                          step="0.01"
                          className="w-full pl-16 pr-6 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-2xl text-slate-900 bg-slate-50 focus:bg-white transition-all" 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Entity SKU / Batch Identification</label>
                      <input 
                        name="sku" 
                        className="w-full px-6 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-xs uppercase tracking-widest bg-slate-50 focus:bg-white transition-all" 
                        placeholder="e.g., FAB-LX-99" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-6">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 border border-outline transition-all"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-slate-900 hover:bg-accent shadow-2xl shadow-slate-900/10 transition-all flex items-center justify-center gap-3"
                  >
                    <Plus size={20} /> Authorize Resource Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
