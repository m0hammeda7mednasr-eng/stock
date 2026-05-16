import React, { useState, useEffect } from 'react';
import { 
  MapPin, User, Factory as FactoryIcon, PackageOpen, 
  MoreHorizontal, Plus, X, ArrowLeft, Truck, Package 
} from 'lucide-react';
import { streamCollection, addItem, updateItem, receiveDelivery } from '../services/dbService';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

interface Factory {
  id: string;
  name: string;
  location: string;
  contact: string;
  phone: string;
}

interface Fabric {
  id: string;
  name: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  sizes: Record<string, number>;
}

interface Order {
  id: string;
  factoryId: string;
  fabricId: string;
  productId: string;
  totalQty: number;
  receivedQty: number;
  expectedSizes: Record<string, number>;
  receivedSizes: Record<string, number>;
  status: 'Pending' | 'In Production' | 'Completed';
  cost: number;
  paidAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  orderDate: any;
}

interface Allocation {
  id: string;
  factoryId: string;
  fabricId: string;
  quantity: number;
  date: any;
}

export const Factories: React.FC = () => {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);

  // Form States
  const [factoryFormData, setFactoryFormData] = useState({ name: '', location: '', contact: '', phone: '' });
  const [allocationFormData, setAllocationFormData] = useState({ fabricId: '', quantity: 0 });
  const [orderFormData, setOrderFormData] = useState({ 
    productId: '', 
    fabricId: '', 
    totalQty: 0,
    cost: 0,
    paidAmount: 0,
    sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 } as Record<string, number>
  });
  const [deliveryData, setDeliveryData] = useState({ size: 'M', quantity: 0 });

  useEffect(() => {
    const unsubFactories = streamCollection('factories', setFactories);
    const unsubOrders = streamCollection('production_orders', setOrders);
    const unsubProducts = streamCollection('products', setProducts);
    const unsubFabrics = streamCollection('fabrics', setFabrics);
    const unsubAllocations = streamCollection('factory_allocations', setAllocations);
    return () => {
      unsubFactories(); unsubOrders(); unsubProducts(); unsubFabrics(); unsubAllocations();
    };
  }, []);

  const handleCreateFactory = async (e: React.FormEvent) => {
    e.preventDefault();
    await addItem('factories', factoryFormData);
    setShowModal(false);
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFactory || !allocationFormData.fabricId) return;

    const fabric = fabrics.find(f => f.id === allocationFormData.fabricId);
    if (!fabric || fabric.quantity < allocationFormData.quantity) {
      alert("Insufficient fabric stock!");
      return;
    }

    await addItem('factory_allocations', {
      factoryId: selectedFactory.id,
      fabricId: allocationFormData.fabricId,
      quantity: Number(allocationFormData.quantity),
      date: new Date()
    });

    const fabricRef = doc(db, 'fabrics', allocationFormData.fabricId);
    await updateDoc(fabricRef, {
      quantity: increment(-Number(allocationFormData.quantity))
    });

    setShowAllocationModal(false);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFactory) return;

    const cost = Number(orderFormData.cost);
    const paidAmount = Number(orderFormData.paidAmount);
    let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    
    if (paidAmount >= cost) paymentStatus = 'Paid';
    else if (paidAmount > 0) paymentStatus = 'Partial';

    await addItem('production_orders', {
      ...orderFormData,
      factoryId: selectedFactory.id,
      totalQty: Number(orderFormData.totalQty),
      cost,
      paidAmount,
      paymentStatus,
      receivedQty: 0,
      expectedSizes: orderFormData.sizes,
      receivedSizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
      status: 'Pending',
      orderDate: new Date()
    });
    setShowOrderModal(false);
    setOrderFormData({ 
      productId: '', 
      fabricId: '', 
      totalQty: 0,
      cost: 0,
      paidAmount: 0,
      sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 } as Record<string, number>
    });
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrder) return;

    const qty = Number(deliveryData.quantity);
    const size = deliveryData.size;

    try {
      const orderRef = doc(db, 'production_orders', targetOrder.id);
      await updateDoc(orderRef, {
        receivedQty: increment(qty),
        [`receivedSizes.${size}`]: increment(qty),
        status: (targetOrder.receivedQty + qty >= targetOrder.totalQty) ? 'Completed' : 'In Production'
      });

      const productRef = doc(db, 'products', targetOrder.productId);
      await updateDoc(productRef, {
        stockQty: increment(qty),
        [`sizes.${size}`]: increment(qty)
      });

      await addItem('deliveries', {
        orderId: targetOrder.id,
        quantityReceived: qty,
        size,
        date: new Date()
      });

      setShowDeliveryModal(false);
      setDeliveryData({ size: 'M', quantity: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const factoryOrders = orders.filter(o => o.factoryId === selectedFactory?.id);
  const factoryAllocations = allocations.filter(a => a.factoryId === selectedFactory?.id);

  if (selectedFactory) {
    return (
      <div className="space-y-10 pb-20 max-w-7xl mx-auto">
        <button onClick={() => setSelectedFactory(null)} className="flex items-center gap-2 text-secondary hover:text-accent transition-all font-bold text-xs uppercase tracking-widest mb-4">
          <ArrowLeft size={16} /> Partner Directory
        </button>

        <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="flex gap-8 items-center relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-accent text-white flex items-center justify-center shadow-xl shadow-accent/20">
              <FactoryIcon size={48} />
            </div>
            <div>
              <h2 className="text-5xl font-serif italic font-bold tracking-tight">{selectedFactory.name}</h2>
              <div className="flex gap-6 mt-4 text-sm text-slate-400 font-medium">
                <span className="flex items-center gap-2"><MapPin size={18} className="text-accent" /> {selectedFactory.location}</span>
                <span className="flex items-center gap-2"><User size={18} className="text-accent" /> {selectedFactory.contact}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 relative z-10">
            <button 
              onClick={() => setShowAllocationModal(true)}
              className="px-8 py-4 border border-white/10 bg-white/5 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all text-sm"
            >
              <PackageOpen size={20} /> Allocate Material
            </button>
            <button 
              onClick={() => setShowOrderModal(true)}
              className="bg-accent text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 text-sm"
            >
              <Plus size={20} /> Deploy Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex justify-between items-end mb-2">
               <div>
                  <h3 className="text-2xl font-bold tracking-tight">Production Pipeline</h3>
                  <p className="text-sm text-secondary">Real-time status of active batches and fulfillment progress.</p>
               </div>
               <div className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">{factoryOrders.length} active runs</div>
            </div>
            <div className="bg-white rounded-[2rem] border border-outline overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-outline text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                  <tr>
                    <th className="py-6 px-10">Asset / SKU</th>
                    <th className="py-6 px-6 text-center">Fulfillment</th>
                    <th className="py-6 px-6 text-right">Financial Exposure</th>
                    <th className="py-6 px-10 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline text-sm">
                  {factoryOrders.length === 0 ? (
                    <tr><td colSpan={4} className="py-20 text-center text-slate-400 italic font-medium">Static floor. No active production cycles.</td></tr>
                  ) : (
                    factoryOrders.map(order => {
                      const product = products.find(p => p.id === order.productId);
                      const progress = Math.min((order.receivedQty / order.totalQty) * 100, 100);
                      const balance = (order.cost || 0) - (order.paidAmount || 0);
                      return (
                        <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-10 py-8">
                            <div className="font-bold text-slate-900 text-base">{product?.name || 'Unknown Asset'}</div>
                            <div className="text-[10px] font-mono text-secondary uppercase tracking-widest mt-1">{product?.sku}</div>
                            <div className="flex gap-2 mt-4">
                               {Object.entries(order.expectedSizes).map(([size, qty]) => (qty as number) > 0 && (
                                 <span key={size} className="text-[10px] px-2 py-1 bg-white border border-outline rounded-lg text-slate-600 font-bold">
                                   {size} <span className="text-accent">{order.receivedSizes[size] || 0}</span><span className="text-slate-300">/</span>{qty}
                                 </span>
                               ))}
                            </div>
                          </td>
                          <td className="px-6 py-8">
                            <div className="flex flex-col items-center">
                              <div className="text-base font-mono font-bold text-slate-900">{order.receivedQty} <span className="text-slate-300">/</span> {order.totalQty}</div>
                              <div className="w-24 h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  className="bg-accent h-full rounded-full" 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-8 text-right">
                            <div className="text-base font-mono font-bold text-slate-900">${(order.cost || 0).toLocaleString()}</div>
                            <div className={`text-[10px] font-black uppercase mt-1 tracking-widest ${
                              order.paymentStatus === 'Paid' ? 'text-emerald-500' : 
                              order.paymentStatus === 'Partial' ? 'text-amber-500' : 'text-error'
                            }`}>
                              {order.paymentStatus} <span className="text-slate-300 mx-1">|</span> Bal: ${balance.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <button 
                              onClick={() => { setTargetOrder(order); setShowDeliveryModal(true); }}
                              disabled={order.status === 'Completed'}
                              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-accent transition-all text-xs disabled:opacity-10 whitespace-nowrap shadow-md"
                            >
                              Receive Asset
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <h3 className="text-2xl font-bold tracking-tight">Floor Inventory</h3>
            <div className="bg-white p-8 rounded-[2rem] border border-outline shadow-sm space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Material Allocations</div>
              {factoryAllocations.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 italic text-sm">No raw stock allocated.</div>
              ) : (
                factoryAllocations.map(a => {
                  const fabric = fabrics.find(f => f.id === a.fabricId);
                  return (
                    <div key={a.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-outline hover:bg-white transition-all group">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-outline group-hover:scale-110 transition-transform shadow-sm text-accent">
                          <PackageOpen size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{fabric?.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{a.date?.toDate ? new Date(a.date.toDate()).toLocaleDateString() : 'Active'}</div>
                        </div>
                      </div>
                      <div className="text-slate-900 font-mono font-bold">{a.quantity}u</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Allocation Modal - Redesigned */}
        <AnimatePresence>
          {showAllocationModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-outline">
                <div className="px-10 py-8 border-b border-outline flex justify-between items-center">
                  <h3 className="text-2xl font-bold tracking-tight">Allocate Stock</h3>
                  <button onClick={() => setShowAllocationModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
                </div>
                <form onSubmit={handleAllocate} className="p-10 space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Available Material</label>
                      <select 
                        required className="w-full px-5 py-4 rounded-2xl border border-outline outline-none focus:border-accent bg-slate-50 font-bold text-sm"
                        value={allocationFormData.fabricId}
                        onChange={e => setAllocationFormData({...allocationFormData, fabricId: e.target.value})}
                      >
                        <option value="">Select Resource...</option>
                        {fabrics.map(f => <option key={f.id} value={f.id}>{f.name} ({f.quantity} Available)</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Target Quantity</label>
                      <input type="number" required className="w-full px-5 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-accent/10 transition-all" value={allocationFormData.quantity} onChange={e => setAllocationFormData({...allocationFormData, quantity: Number(e.target.value)})} />
                    </div>
                  </div>
                  <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-accent transition-all shadow-xl shadow-slate-900/20 text-sm">Execute Material Transfer</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal Redesigns follow the same style... (Order & Delivery) */}
        {/* ... (Existing modals maintained but with updated classes) */}
        
        {/* Production Order Modal */}
        <AnimatePresence>
          {showOrderModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-outline">
                <div className="px-10 py-8 border-b border-outline flex justify-between items-center">
                  <h3 className="text-2xl font-bold tracking-tight">Deploy Production Cycle</h3>
                  <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
                </div>
                <form onSubmit={handleCreateOrder} className="p-10 space-y-10">
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Asset to Produce</label>
                        <select 
                          required className="w-full px-5 py-4 rounded-2xl border border-outline outline-none bg-slate-50 font-bold text-sm focus:border-accent transition-all"
                          value={orderFormData.productId}
                          onChange={e => setOrderFormData({...orderFormData, productId: e.target.value})}
                        >
                          <option value="">Choose Asset...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Batch Size</label>
                          <input type="number" required className="w-full px-5 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-sm bg-slate-50 focus:bg-white transition-all" value={orderFormData.totalQty} onChange={e => setOrderFormData({...orderFormData, totalQty: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Budgeted Cost</label>
                          <input type="number" required className="w-full px-5 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-sm bg-slate-50 focus:bg-white transition-all" value={orderFormData.cost} onChange={e => setOrderFormData({...orderFormData, cost: Number(e.target.value)})} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Initial Disbursement ($)</label>
                        <input type="number" required className="w-full px-5 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-lg text-accent bg-slate-50 focus:bg-white transition-all" value={orderFormData.paidAmount} onChange={e => setOrderFormData({...orderFormData, paidAmount: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Volume Distribution</label>
                       {Object.keys(orderFormData.sizes).map(size => (
                         <div key={size} className="flex items-center gap-6 group">
                           <span className="w-10 font-black text-xs text-slate-400 group-hover:text-accent transition-colors">{size}</span>
                           <input 
                             type="number" 
                             className="flex-1 px-4 py-2.5 rounded-xl border border-outline outline-none text-xs font-mono font-bold bg-slate-50 focus:bg-white transition-all"
                             value={orderFormData.sizes[size]}
                             onChange={(e) => setOrderFormData({
                               ...orderFormData, 
                               sizes: {...orderFormData.sizes, [size]: Number(e.target.value)}
                             })}
                           />
                         </div>
                       ))}
                    </div>
                  </div>
                  <button className="w-full bg-slate-900 text-white py-6 rounded-2xl font-bold hover:bg-accent transition-all shadow-2xl shadow-slate-900/20 text-sm">Authorize Production Run</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delivery Modal */}
        <AnimatePresence>
          {showDeliveryModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-outline">
                <div className="px-10 py-8 border-b border-outline flex justify-between items-center bg-slate-50">
                  <h3 className="text-2xl font-serif italic font-bold tracking-tight">Receipt of Goods</h3>
                  <button onClick={() => setShowDeliveryModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
                </div>
                <form onSubmit={handleReceiveStock} className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Size Batch</label>
                      <select 
                        required className="w-full px-5 py-4 rounded-2xl border border-outline outline-none font-bold bg-slate-50 text-sm"
                        value={deliveryData.size}
                        onChange={e => setDeliveryData({...deliveryData, size: e.target.value})}
                      >
                        {['S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Volume Received</label>
                      <input type="number" required className="w-full px-5 py-4 rounded-2xl border border-outline outline-none font-mono font-bold text-lg bg-slate-50 focus:bg-white transition-all" value={deliveryData.quantity} onChange={e => setDeliveryData({...deliveryData, quantity: Number(e.target.value)})} />
                    </div>
                  </div>
                  <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:bg-accent transition-all text-sm">Post to Inventory</button>
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-on-surface tracking-tight">Factories</h2>
          <p className="text-lg text-secondary mt-1 font-medium">Manage manufacturing partners and track production orders.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity soft-shadow"
        >
          <FactoryIcon size={20} />
          Add Factory
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {factories.length === 0 ? (
          <div className="col-span-3 py-20 text-center border-2 border-dashed border-outline-variant/30 rounded-3xl text-secondary italic font-medium">
            No factories added yet. Add your first manufacturing partner.
          </div>
        ) : (
          factories.map((f) => (
            <div 
              key={f.id} 
              onClick={() => setSelectedFactory(f)}
              className="bg-white p-8 rounded-3xl soft-shadow border border-outline-variant/30 hover:border-primary/50 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
                  {f.name.charAt(0)}
                </div>
                <div className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowLeft className="rotate-180" size={20} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-2">{f.name}</h3>
              <div className="flex items-center gap-2 text-secondary text-sm">
                <MapPin size={14} />
                {f.location}
              </div>
              
              <div className="mt-8 pt-6 border-t border-outline-variant/20 flex justify-between items-center text-secondary">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Workload</span>
                  <span className="text-sm font-bold text-on-surface">
                    {orders.filter(o => o.factoryId === f.id && o.status !== 'Completed').length} Orders
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Allocation</span>
                  <span className="text-sm font-bold text-primary">
                    {allocations.filter(a => a.factoryId === f.id).length.toLocaleString()} Units
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-outline">
              <div className="p-10 border-b border-outline flex justify-between items-center bg-slate-50">
                <h3 className="text-3xl font-serif italic font-bold tracking-tight">Onboard Partner</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={28} /></button>
              </div>
              <form onSubmit={handleCreateFactory} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Corporate Identifier (Name)</label>
                    <input required className="w-full px-6 py-4 rounded-2xl border border-outline bg-slate-50 focus:bg-white focus:border-accent transition-all outline-none font-bold text-lg" value={factoryFormData.name} onChange={e => setFactoryFormData({...factoryFormData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Executive Contact</label>
                    <input className="w-full px-6 py-4 rounded-2xl border border-outline bg-slate-50 focus:bg-white focus:border-accent transition-all outline-none font-medium" value={factoryFormData.contact} onChange={e => setFactoryFormData({...factoryFormData, contact: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Secure Line (Phone)</label>
                    <input className="w-full px-6 py-4 rounded-2xl border border-outline bg-slate-50 focus:bg-white focus:border-accent transition-all outline-none font-mono" value={factoryFormData.phone} onChange={e => setFactoryFormData({...factoryFormData, phone: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Logistics Hub (Location)</label>
                    <input className="w-full px-6 py-4 rounded-2xl border border-outline bg-slate-50 focus:bg-white focus:border-accent transition-all outline-none font-medium" value={factoryFormData.location} onChange={e => setFactoryFormData({...factoryFormData, location: e.target.value})} />
                  </div>
                </div>
                <button className="w-full bg-slate-900 text-white py-6 rounded-2xl font-bold shadow-2xl shadow-slate-900/20 hover:bg-accent transition-all mt-4 text-sm tracking-widest uppercase">Execute Registration</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
