import React, { useState, useEffect } from 'react';
import { 
  Users, Factory, Layers, Shirt, Store, 
  DollarSign, TrendingUp, AlertCircle, ShoppingCart, 
  Package, Truck, Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { streamCollection } from '../services/dbService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from 'recharts';

const dummyChartData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
];

export const Dashboard: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [factories, setFactories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [fabrics, setFabrics] = useState<any[]>([]);

  useEffect(() => {
    const unsubSuppliers = streamCollection('suppliers', setSuppliers);
    const unsubProducts = streamCollection('products', setProducts);
    const unsubFactories = streamCollection('factories', setFactories);
    const unsubOrders = streamCollection('production_orders', setOrders);
    const unsubPurchases = streamCollection('supplier_purchases', setPurchases);
    const unsubFabrics = streamCollection('fabrics', setFabrics);

    return () => {
      unsubSuppliers(); unsubProducts(); unsubFactories(); unsubOrders(); unsubPurchases(); unsubFabrics();
    };
  }, []);

  const inventoryValue = products.reduce((acc, p) => acc + ((p.stockQty || 0) * (p.price || 0)), 0);
  
  // Financial Calculations
  const totalPurchaseCost = purchases.reduce((acc, p) => acc + (p.cost || 0), 0);
  const totalPurchasePaid = purchases.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  
  const totalOrderCost = orders.reduce((acc, o) => acc + (o.cost || 0), 0);
  const totalOrderPaid = orders.reduce((acc, o) => acc + (o.paidAmount || 0), 0);

  const totalExpense = totalPurchaseCost + totalOrderCost;
  const totalPaid = totalPurchasePaid + totalOrderPaid;
  const totalOutstanding = totalExpense - totalPaid;

  const totalPendingStock = orders.reduce((acc, o) => acc + (o.totalQty - o.receivedQty), 0);
  const totalReceivedStock = orders.reduce((acc, o) => acc + o.receivedQty, 0);

  // Financial Chart Data - Comparing Total vs Paid per category
  const financialChartData = [
    { category: 'Sourcing', total: totalPurchaseCost, paid: totalPurchasePaid, hue: '#6366f1' },
    { category: 'Production', total: totalOrderCost, paid: totalOrderPaid, hue: '#2563eb' },
    { category: 'Inventory', total: inventoryValue, paid: inventoryValue, hue: '#10b981' }
  ];

  // Production Metrics for Last 5 Orders
  const productionMetrics = orders.slice(-5).map(o => {
    const prod = products.find(p => p.id === o.productId);
    return {
      name: prod?.name || 'Order',
      target: o.totalQty,
      actual: o.receivedQty,
      progress: Math.round((o.receivedQty / o.totalQty) * 100)
    };
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header>
        <h2 className="text-4xl font-bold text-on-surface tracking-tight">Overview</h2>
        <p className="text-lg text-secondary mt-1">Real-time performance metrics and financial tracking.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Commitments" 
          value={totalExpense} 
          icon={DollarSign} 
          trend="Aggregated Cost" 
          color="primary" 
        />
        <StatCard 
          label="Settled Payments" 
          value={totalPaid} 
          icon={TrendingUp} 
          trend={`${((totalPaid / (totalExpense || 1)) * 100).toFixed(1)}% Settled`} 
          color="success" 
        />
        <StatCard 
          label="Capital at Risk" 
          value={totalOutstanding} 
          icon={AlertCircle} 
          trend="Pending Settlement" 
          color="error" 
        />
        <StatCard 
          label="Inventory Value" 
          value={inventoryValue} 
          icon={Package} 
          trend="Stock Assets" 
          color="warning" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-6 rounded-3xl soft-shadow border border-outline-variant/30">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Financial Overview</h3>
                <p className="text-sm text-secondary">Budgeted vs Paid across categories</p>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 500}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    cursor={{fill: '#F8FAFC'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 soft-shadow rounded-xl border border-outline-variant/30">
                            <p className="text-xs font-bold text-on-surface mb-2">{payload[0].payload.category}</p>
                            <div className="space-y-1">
                              <div className="flex justify-between gap-4">
                                <span className="text-xs text-secondary">Total:</span>
                                <span className="text-xs font-bold">${payload[0].value?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-xs text-secondary">Paid:</span>
                                <span className="text-xs font-bold text-primary">${payload[1].value?.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="paid" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl soft-shadow border border-outline-variant/30">
             <h3 className="text-xl font-bold text-on-surface mb-6">Recent Production Progress</h3>
             <div className="space-y-6">
                {productionMetrics.map((m, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2">
                       <div>
                          <div className="text-sm font-bold text-on-surface">{m.name}</div>
                          <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">Target: {m.target} units</div>
                       </div>
                       <div className="text-right">
                          <div className="text-xs font-bold text-primary">{m.actual} / {m.target}</div>
                          <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">{m.progress}%</div>
                       </div>
                    </div>
                    <div className="w-full bg-surface-bright h-2 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${m.progress}%` }}
                        className="bg-primary h-full"
                       />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-6 rounded-3xl soft-shadow border border-outline-variant/30">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Efficiency Metrics
            </h3>
            
            <div className="space-y-6">
               <div>
                  <div className="flex justify-between text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">
                    <span>Payment Efficiency</span>
                    <span>{((totalPaid/totalExpense)*100 || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-surface-bright h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(totalPaid/totalExpense)*100}%` }}></div>
                   </div>
               </div>
               <div>
                  <div className="flex justify-between text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">
                    <span>Outstanding Ratio</span>
                    <span>{((totalOutstanding/totalExpense)*100 || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-surface-bright h-1.5 rounded-full overflow-hidden">
                    <div className="bg-error h-full" style={{ width: `${(totalOutstanding/totalExpense)*100}%` }}></div>
                   </div>
               </div>
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/20 space-y-4">
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-warning/10 text-warning rounded-lg">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface">Payment Alerts</div>
                  <p className="text-[10px] text-secondary mt-1">{orders.filter(o => o.paymentStatus !== 'Paid').length} invoices pending full payment.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl soft-shadow border border-outline-variant/30">
            <h3 className="text-lg font-bold text-on-surface mb-4">Partner Status</h3>
            <div className="space-y-4">
              {[
                { name: 'Loom-Global', type: 'Supplier', status: 'Active' },
                { name: 'Tex-Works', type: 'Factory', status: 'Active' },
                { name: 'Prime-Elite', type: 'Factory', status: 'Active' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-bright transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface">{p.name}</div>
                      <div className="text-[10px] font-bold text-secondary uppercase tracking-widest">{p.type}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">{p.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: number, icon: any, trend: string, color: 'primary' | 'success' | 'error' | 'warning' }> = ({ label, value, icon: Icon, trend, color }) => {
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    error: 'text-error bg-error/10 border-error/20',
    warning: 'text-amber-600 bg-amber-50 border-amber-100'
  };

  return (
    <div className="bg-white p-6 rounded-3xl soft-shadow border border-outline-variant/30 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
          <Icon size={24} />
        </div>
        <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">{label}</span>
      </div>
      <div>
        <div className="text-3xl font-bold text-on-surface mb-2">
          ${value.toLocaleString()}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-secondary uppercase tracking-widest">
          <TrendingUp size={14} className="text-outline-variant" />
          {trend}
        </div>
      </div>
    </div>
  );
};
