import React, { useState, useEffect } from 'react';
import { Store as StoreIcon, MapPin, Package, TrendingUp, MoreVertical, Plus, X, ArrowLeft, DollarSign, Send } from 'lucide-react';
import { streamCollection, addItem } from '../services/dbService';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { motion } from 'motion/react';

interface Store {
  id: string;
  name: string;
  location: string;
  manager: string;
  salesTotal: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQty: number;
  price: number;
}

interface Distribution {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  date: any;
  paymentStatus: string;
}

export const Stores: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);

  // Form State
  const [distFormData, setDistFormData] = useState({ productId: '', quantity: 0, amount: 0 });

  useEffect(() => {
    const unsubStores = streamCollection('stores', setStores);
    const unsubProducts = streamCollection('products', setProducts);
    const unsubDist = streamCollection('distributions', setDistributions);
    return () => {
      unsubStores();
      unsubProducts();
      unsubDist();
    };
  }, []);

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !distFormData.productId) return;

    try {
      // 1. Record distribution
      await addItem('distributions', {
        storeId: selectedStore.id,
        productId: distFormData.productId,
        quantity: Number(distFormData.quantity),
        totalAmount: Number(distFormData.amount),
        paymentStatus: 'Unpaid'
      });

      // 2. Deduct product stock
      const productRef = doc(db, 'products', distFormData.productId);
      await updateDoc(productRef, {
        stockQty: increment(-Number(distFormData.quantity))
      });

      // 3. Update store salesTotal (accrued)
      const storeRef = doc(db, 'stores', selectedStore.id);
      await updateDoc(storeRef, {
        salesTotal: increment(Number(distFormData.amount))
      });

      setShowDistributeModal(false);
      setDistFormData({ productId: '', quantity: 0, amount: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const storeDistributions = distributions.filter(d => d.storeId === selectedStore?.id);

  if (selectedStore) {
    return (
      <div className="space-y-8">
        <button onClick={() => setSelectedStore(null)} className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-bold text-sm">
          <ArrowLeft size={16} /> Back to Locations
        </button>

        <div className="bg-white p-8 rounded-2xl border border-outline-variant/30 soft-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <StoreIcon size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-on-surface">{selectedStore.name}</h2>
              <div className="flex gap-4 mt-2 text-sm text-secondary font-medium">
                <span className="flex items-center gap-1"><MapPin size={14} /> {selectedStore.location}</span>
                <span className="flex items-center gap-1"><DollarSign size={14} /> Total Distributions: ${selectedStore.salesTotal?.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowDistributeModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity soft-shadow"
          >
            <Send size={20} /> Distribute Stock
          </button>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-on-surface">Recent Distributions</h3>
          <div className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden soft-shadow">
            <table className="w-full text-left">
              <thead className="bg-surface-bright border-b border-outline-variant/30 text-[10px] uppercase font-bold text-secondary tracking-widest">
                <tr>
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6 text-center">Quantity</th>
                  <th className="py-4 px-6 text-center">Total Value</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {storeDistributions.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-secondary italic">No distributions recorded for this store.</td></tr>
                ) : (
                  storeDistributions.map(dist => {
                    const product = products.find(p => p.id === dist.productId);
                    return (
                      <tr key={dist.id} className="hover:bg-surface-bright/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-bold">{product?.name || 'Unknown'}</div>
                          <div className="text-xs text-secondary">{product?.sku}</div>
                        </td>
                        <td className="px-6 py-5 text-center font-bold">{dist.quantity}</td>
                        <td className="px-6 py-5 text-center font-bold text-on-surface">${dist.totalAmount}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            dist.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {dist.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right text-secondary font-medium">Jan 24, 2024</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribute Modal */}
        {showDistributeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl soft-shadow w-full max-w-md overflow-hidden">
              <div className="p-8 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
                <h3 className="text-2xl font-bold">Distribute to Store</h3>
                <button onClick={() => setShowDistributeModal(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleDistribute} className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">Select Product</label>
                  <select 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/50 outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                    value={distFormData.productId}
                    onChange={e => setDistFormData({...distFormData, productId: e.target.value})}
                  >
                    <option value="">Choose product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (In Stock: {p.stockQty})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">Quantity</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant/50 outline-none"
                      value={distFormData.quantity}
                      onChange={e => setDistFormData({...distFormData, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">Total Price (X)</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant/50 outline-none font-bold text-primary"
                      value={distFormData.amount}
                      onChange={e => setDistFormData({...distFormData, amount: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <button className="w-full bg-primary text-white py-4 rounded-xl font-bold soft-shadow hover:opacity-90 flex items-center justify-center gap-2">
                  <Send size={20} /> Authorize Distribution
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-bold text-on-surface tracking-tight">Retail Stores</h2>
          <p className="text-lg text-secondary mt-1">Manage physical locations and distribution history.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity soft-shadow">
          <StoreIcon size={20} /> Register Store
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stores.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-outline-variant/30 rounded-3xl text-secondary italic">
            No stores registered.
          </div>
        ) : (
          stores.map((store) => (
            <div key={store.id} className="bg-white rounded-3xl soft-shadow border border-outline-variant/30 overflow-hidden flex flex-col group hover:border-primary/50 transition-colors">
              <div className="p-6 border-b border-outline-variant/10 bg-surface-bright/30 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <StoreIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-lg">{store.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-secondary font-medium uppercase tracking-widest">
                      <MapPin size={12} /> {store.location}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">Stock Portfolio Value</span>
                  <span className="text-2xl font-bold text-on-surface">${store.salesTotal?.toLocaleString() || '0'}</span>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-surface-bright rounded-xl border border-outline-variant/20">
                  <Package size={16} className="text-outline-variant" />
                  <span className="text-xs font-bold text-on-surface">Manager: {store.manager}</span>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-surface-bright border-t border-outline-variant/20">
                <button onClick={() => setSelectedStore(store)} className="w-full text-sm font-bold text-primary hover:underline">Manage Distribution</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl soft-shadow w-full max-w-md overflow-hidden">
            <div className="p-8 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
              <h3 className="text-2xl font-bold">Register Store</h3>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              await addItem('stores', {
                name: target.name.value,
                location: target.location.value,
                manager: target.manager.value,
                salesTotal: 0
              });
              setShowModal(false);
            }} className="p-8 space-y-6">
              <div><label className="text-xs font-bold text-secondary uppercase mb-2 block">Store Name</label><input name="name" required className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Cairo Central" /></div>
              <div><label className="text-xs font-bold text-secondary uppercase mb-2 block">Location</label><input name="location" required className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Downtown" /></div>
              <div><label className="text-xs font-bold text-secondary uppercase mb-2 block">Manager</label><input name="manager" required className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Full Name" /></div>
              <button className="w-full bg-primary text-white py-4 rounded-xl font-bold">Register Location</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
