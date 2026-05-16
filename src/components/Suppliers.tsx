import React, { useState, useEffect } from 'react';
import { 
  Users, Mail, Phone, Globe, ExternalLink, ShieldCheck, 
  MoreHorizontal, Plus, X, ArrowLeft, Trash2, Edit 
} from 'lucide-react';
import { streamCollection, addItem, updateItem, db } from '../services/dbService';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
}

interface Fabric {
  id: string;
  name: string;
  color: string;
  unit: string;
}

interface Purchase {
  id: string;
  supplierId: string;
  fabricId: string;
  quantity: number;
  cost: number;
  paidAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  date: any;
}

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    location: '',
  });

  const [purchaseData, setPurchaseData] = useState({
    fabricId: '',
    quantity: 0,
    cost: 0,
    paidAmount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const unsubSuppliers = streamCollection('suppliers', setSuppliers);
    const unsubFabrics = streamCollection('fabrics', setFabrics);
    const unsubPurchases = streamCollection('supplier_purchases', setPurchases);
    return () => {
      unsubSuppliers();
      unsubFabrics();
      unsubPurchases();
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contact: '', email: '', phone: '', location: '' });
    setShowModal(true);
  };

  const handleEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({ ...s });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      await updateItem('suppliers', editingSupplier.id, formData);
    } else {
      await addItem('suppliers', formData);
    }
    setShowModal(false);
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !purchaseData.fabricId) return;

    try {
      const cost = Number(purchaseData.cost);
      const paidAmount = Number(purchaseData.paidAmount);
      
      // LOGIC: Automatically determine payment status
      let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
      if (paidAmount >= cost) {
        paymentStatus = 'Paid';
      } else if (paidAmount > 0) {
        paymentStatus = 'Partial';
      }

      // 1. Log purchase
      await addItem('supplier_purchases', {
        ...purchaseData,
        supplierId: selectedSupplier.id,
        quantity: Number(purchaseData.quantity),
        cost,
        paidAmount,
        paymentStatus,
        date: new Date(purchaseData.date)
      });

      // 2. Update Fabric stock
      const fabricRef = doc(db, 'fabrics', purchaseData.fabricId);
      await updateDoc(fabricRef, {
        quantity: increment(Number(purchaseData.quantity)),
        totalCost: increment(cost)
      });

      setShowPurchaseModal(false);
      setPurchaseData({ fabricId: '', quantity: 0, cost: 0, paidAmount: 0, date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      console.error(err);
    }
  };

  const supplierPurchases = purchases.filter(p => p.supplierId === selectedSupplier?.id);

  if (selectedSupplier) {
    return (
      <div className="space-y-10 pb-20 max-w-7xl mx-auto">
        <button 
          onClick={() => setSelectedSupplier(null)}
          className="flex items-center gap-2 text-secondary hover:text-accent transition-all font-bold text-xs uppercase tracking-widest mb-4"
        >
          <ArrowLeft size={16} /> Partner Directory
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-slate-900 p-12 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10 w-full md:w-auto">
            <h2 className="text-5xl font-serif italic font-bold tracking-tight">{selectedSupplier.name}</h2>
            <div className="flex flex-wrap gap-8 mt-6">
              <span className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                <Mail size={16} className="text-accent" /> {selectedSupplier.email}
              </span>
              <span className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                <Phone size={16} className="text-accent" /> {selectedSupplier.phone}
              </span>
              <span className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                <Globe size={16} className="text-accent" /> {selectedSupplier.location}
              </span>
            </div>
          </div>
          <div className="flex gap-4 relative z-10">
            <button 
              onClick={() => handleEdit(selectedSupplier)}
              className="p-4 border border-white/10 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors text-slate-400"
            >
              <Edit size={20} />
            </button>
            <button 
              onClick={() => setShowPurchaseModal(true)}
              className="bg-accent text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 text-sm"
            >
              <Plus size={20} /> New Purchase Order
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex justify-between items-end">
             <div>
                <h3 className="text-2xl font-bold tracking-tight">Purchase History</h3>
                <p className="text-sm text-secondary">A detailed log of all raw material acquisitions and financial status.</p>
             </div>
             <div className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">{supplierPurchases.length} transactions</div>
          </div>
          <div className="bg-white rounded-[2rem] border border-outline overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-outline text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                <tr>
                  <th className="py-6 px-10">Timestamp</th>
                  <th className="py-6 px-6">Resource Allocation</th>
                  <th className="py-6 px-6 text-center">Volume</th>
                  <th className="py-6 px-6 text-right">Commitment</th>
                  <th className="py-6 px-6 text-right">Disbursed</th>
                  <th className="py-6 px-6 text-right">Exposure</th>
                  <th className="py-6 px-10 text-center">Lifecycle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline text-sm">
                {supplierPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center text-slate-400 italic font-medium">
                      Zero-transaction partner. Record your first procurement log above.
                    </td>
                  </tr>
                ) : (
                  supplierPurchases.map(p => {
                    const fabric = fabrics.find(f => f.id === p.fabricId);
                    const remaining = p.cost - (p.paidAmount || 0);
                    return (
                      <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-8 px-10 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                          {p.date?.toDate ? new Date(p.date.toDate()).toLocaleDateString() : p.date}
                        </td>
                        <td className="py-8 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full border border-outline shadow-sm" style={{ backgroundColor: fabric?.color }}></div>
                            <span className="font-bold text-slate-900 text-base">{fabric?.name || 'Unknown SKU'}</span>
                          </div>
                        </td>
                        <td className="py-8 px-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-bold text-slate-900 text-base">{p.quantity}</span>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{fabric?.unit || 'units'}</span>
                          </div>
                        </td>
                        <td className="py-8 px-6 text-right font-mono font-bold text-slate-900 text-base">
                          ${p.cost.toLocaleString()}
                        </td>
                        <td className="py-8 px-6 text-right font-mono font-bold text-emerald-500 text-base">
                          ${(p.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-8 px-6 text-right font-mono font-bold text-error text-base">
                          ${remaining > 0 ? remaining.toLocaleString() : '0.00'}
                        </td>
                        <td className="py-8 px-10 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${
                            p.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            p.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Purchase Modal - Redesigned */}
        <AnimatePresence>
          {showPurchaseModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-outline"
              >
                <div className="px-10 py-8 border-b border-outline flex justify-between items-center bg-slate-50">
                  <h3 className="text-3xl font-serif italic font-bold tracking-tight">Post Inventory Log</h3>
                  <button onClick={() => setShowPurchaseModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={28} /></button>
                </div>
                <form onSubmit={handleAddPurchase} className="p-10 space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Resource Type</label>
                      <select 
                        required
                        className="w-full px-6 py-4 rounded-2xl border border-outline outline-none focus:border-accent bg-slate-50 font-bold text-sm transition-all"
                        value={purchaseData.fabricId}
                        onChange={e => setPurchaseData({...purchaseData, fabricId: e.target.value})}
                      >
                        <option value="">Select SKU...</option>
                        {fabrics.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.color})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Volume Acquisition</label>
                        <input 
                          type="number" 
                          required
                          step="0.01"
                          className="w-full px-6 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-sm bg-slate-50 focus:bg-white transition-all"
                          value={purchaseData.quantity}
                          onChange={e => setPurchaseData({...purchaseData, quantity: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Commitment (Total Cost)</label>
                        <input 
                          type="number" 
                          required
                          step="0.01"
                          className="w-full px-6 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-sm bg-slate-50 focus:bg-white transition-all"
                          value={purchaseData.cost}
                          onChange={e => setPurchaseData({...purchaseData, cost: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Current Disbursement ($)</label>
                        <input 
                          type="number" 
                          required
                          step="0.01"
                          className="w-full px-6 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-lg text-emerald-500 bg-slate-50 focus:bg-white transition-all"
                          value={purchaseData.paidAmount}
                          onChange={e => setPurchaseData({...purchaseData, paidAmount: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Procurement Date</label>
                        <input 
                          type="date" 
                          required
                          className="w-full px-6 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-xs bg-slate-50 focus:bg-white transition-all"
                          value={purchaseData.date}
                          onChange={e => setPurchaseData({...purchaseData, date: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-slate-900 rounded-[2rem] flex justify-between items-center text-white shadow-xl shadow-slate-900/10">
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Financial Exposure</div>
                      <div className="text-2xl font-mono font-bold text-error">
                        ${(Number(purchaseData.cost || 0) - Number(purchaseData.paidAmount || 0)).toLocaleString()}
                      </div>
                    </div>
                    <button className="bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all text-xs tracking-widest uppercase">Execute Log</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-4xl font-bold text-on-surface tracking-tight">Suppliers</h2>
          <p className="text-lg text-secondary mt-1 font-medium">Manage raw material vendors and fabric procurement.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-primary text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity soft-shadow"
        >
          <Plus size={20} />
          Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {suppliers.length === 0 ? (
          <div className="col-span-3 py-20 text-center border-2 border-dashed border-outline-variant/30 rounded-3xl text-secondary italic font-medium">
            No suppliers found. Add your first procurement partner.
          </div>
        ) : (
          suppliers.map((s) => (
            <div 
              key={s.id} 
              onClick={() => setSelectedSupplier(s)}
              className="bg-white p-8 rounded-3xl soft-shadow border border-outline-variant/30 hover:border-primary/50 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
                  {s.name.charAt(0)}
                </div>
                <div className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowLeft className="rotate-180" size={20} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-2">{s.name}</h3>
              <div className="flex items-center gap-2 text-secondary text-sm">
                <Globe size={14} />
                {s.location}
              </div>
              
              <div className="mt-8 pt-6 border-t border-outline-variant/20 flex justify-between items-center text-secondary">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Log</span>
                  <span className="text-sm font-bold text-on-surface">
                    {purchases.filter(p => p.supplierId === s.id).length} Purchases
                  </span>
                </div>
                <button className="text-xs font-bold text-primary group-hover:underline">View History</button>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-outline"
            >
              <div className="p-10 border-b border-outline flex justify-between items-center bg-slate-50">
                <h3 className="text-3xl font-serif italic font-bold tracking-tight">{editingSupplier ? 'Update Global Directory' : 'Onboard Partner'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={28} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Corporate Identity (Supplier Name)</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl border border-outline bg-slate-50 focus:bg-white focus:border-accent transition-all outline-none font-bold text-lg" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Account Manager</label>
                    <input 
                      value={formData.contact}
                      onChange={e => setFormData({...formData, contact: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl border border-outline bg-slate-50 focus:bg-white focus:border-accent transition-all outline-none font-medium" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Logistics Region</label>
                    <input 
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl border border-outline bg-slate-50 focus:bg-white focus:border-accent transition-all outline-none font-medium" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Secure Email</label>
                    <input 
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl border border-outline bg-slate-50 focus:bg-white focus:border-accent transition-all outline-none font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Primary Line (Phone)</label>
                    <input 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl border border-outline bg-slate-50 focus:bg-white focus:border-accent transition-all outline-none font-mono" 
                    />
                  </div>
                </div>
                <button className="w-full bg-slate-900 text-white py-6 rounded-2xl font-bold shadow-2xl shadow-slate-900/20 hover:bg-accent transition-all mt-4 text-sm uppercase tracking-widest">
                  {editingSupplier ? 'Authorize Protocol Update' : 'Execute Corporate Registration'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
