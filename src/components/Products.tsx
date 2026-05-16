import React, { useState, useEffect } from 'react';
import { Package, Tag, Layers, ArrowUpRight, Plus, Filter, X } from 'lucide-react';
import { streamCollection, addItem } from '../services/dbService';
import { motion } from 'motion/react';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  material: string;
  stockQty: number;
  sizes: Record<string, number>;
  price: number;
  status: string;
  image: string;
}

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsub = streamCollection('products', setProducts);
    return unsub;
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as any;
    await addItem('products', {
      name: target.name.value,
      sku: target.sku.value,
      category: target.category.value,
      material: target.material.value,
      stockQty: 0,
      sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
      price: Number(target.price.value),
      status: 'Active',
      image: target.emoji.value || '📦'
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-4xl font-bold text-on-surface tracking-tight">Product Catalog</h2>
          <p className="text-lg text-secondary mt-1">Manage finished garment specifications and real-time inventory.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity soft-shadow" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Register New SKU
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-outline-variant/30 rounded-3xl text-secondary italic font-medium">
            Catalog is empty. Add your first product.
          </div>
        ) : (
          products.map((prd) => (
            <div key={prd.id} className="bg-white rounded-3xl soft-shadow border border-outline-variant/30 overflow-hidden group cursor-pointer hover:border-primary/50 transition-all">
              <div className="h-56 bg-surface-bright flex items-center justify-center relative">
                <span className="text-7xl group-hover:scale-110 transition-transform duration-300">{prd.image || '📦'}</span>
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full font-bold text-primary text-sm border border-outline-variant/20 shadow-sm">
                  ${prd.price}
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-on-surface text-xl">{prd.name}</h3>
                    <p className="text-xs text-secondary font-mono uppercase tracking-widest mt-1">{prd.sku}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">Inventory Multi-Size Status</span>
                    <div className="flex flex-wrap gap-2">
                       {Object.entries(prd.sizes || {}).map(([size, qty]) => (
                         <div key={size} className={`flex flex-col items-center px-2 py-1.5 rounded-lg border ${(qty as number) > 0 ? 'bg-primary/5 border-primary/20' : 'bg-surface-bright border-outline-variant/20'}`}>
                           <span className="text-[10px] font-bold text-secondary">{size}</span>
                           <span className={`text-xs font-bold ${(qty as number) > 0 ? 'text-primary' : 'text-outline-variant'}`}>{qty as number}</span>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center text-secondary">
                    <div className="flex items-center gap-2">
                      <Layers size={14} />
                      <span className="text-xs font-bold uppercase">{prd.category}</span>
                    </div>
                    <div className="text-sm font-bold text-on-surface">
                      Total: <span className="text-primary">{prd.stockQty || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-outline"
          >
            <div className="p-10 border-b border-outline flex justify-between items-center bg-slate-50">
              <h3 className="text-3xl font-serif italic font-bold tracking-tight text-slate-900">SKU Initialization</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-900 transition-colors"
                aria-label="Close modal"
              >
                <X size={32} />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Garment Nomenclature</label>
                  <input name="name" required className="w-full px-6 py-4 rounded-2xl border border-outline outline-none focus:border-accent bg-slate-50 focus:bg-white transition-all font-bold text-lg" placeholder="e.g., Premium Raw Denim 14oz" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Unique Identification (SKU)</label>
                  <input name="sku" required className="w-full px-6 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-sm bg-slate-50 focus:bg-white transition-all focus:border-accent" placeholder="ARTIFACT-001" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Retail Pricing ($)</label>
                  <input name="price" type="number" required className="w-full px-6 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-xl text-slate-900 bg-slate-50 focus:bg-white transition-all focus:border-accent" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Material Classification</label>
                  <input name="category" className="w-full px-6 py-4 rounded-2xl border border-outline outline-none bg-slate-50 focus:bg-white focus:border-accent transition-all font-bold text-sm" placeholder="Outerwear / Bottoms" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Composite Composition</label>
                  <input name="material" className="w-full px-6 py-4 rounded-2xl border border-outline outline-none bg-slate-50 focus:bg-white focus:border-accent transition-all font-bold text-sm" placeholder="100% Selvedge Cotton" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Aesthetic Identifier (Emoji Icon)</label>
                  <input name="emoji" className="w-full px-6 py-4 rounded-2xl border border-outline outline-none bg-slate-50 focus:bg-white focus:border-accent transition-all text-center text-3xl" placeholder="🧥" maxLength={2} />
                </div>
              </div>
              <button className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/10 hover:bg-accent transition-all">Launch Master Protocol</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
