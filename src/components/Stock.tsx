import React, { useState, useEffect } from 'react';
import { Filter, Download, MoreVertical, Shirt, Package, Layers } from 'lucide-react';
import { streamCollection } from '../services/dbService';

interface Fabric {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQty: number;
  price: number;
  category: string;
  sizes: Record<string, number>;
}

interface StockItem {
  id: string;
  name: string;
  type: 'Fabric' | 'Product';
  code: string;
  qty: number;
  unit: string;
  cost: string;
  totalValue: string;
  location: string;
  status: string;
}

export const Stock: React.FC = () => {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [typeFilter, setTypeFilter] = useState('All Item Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [locationFilter, setLocationFilter] = useState('All Locations');

  useEffect(() => {
    const unsubFabrics = streamCollection('fabrics', setFabrics);
    const unsubProducts = streamCollection('products', setProducts);
    return () => { unsubFabrics(); unsubProducts(); };
  }, []);

  const stockItems: StockItem[] = [
    ...fabrics.map(f => ({
      id: f.id,
      name: f.name,
      type: 'Fabric' as const,
      code: f.sku || 'F-' + f.id.slice(0, 5).toUpperCase(),
      qty: f.quantity,
      unit: f.unit || 'Units',
      cost: `$${(f.costPerUnit || 0).toFixed(2)}`,
      totalValue: `$${(f.totalCost || 0).toFixed(2)}`,
      location: 'Central Warehouse',
      status: f.quantity > 100 ? 'In Stock' : f.quantity > 0 ? 'Low Stock' : 'Out of Stock'
    })),
    ...products.map(p => ({
      id: p.id,
      name: p.name,
      type: 'Product' as const,
      code: p.sku,
      qty: p.stockQty,
      unit: 'Units',
      cost: `$${(p.price || 0).toFixed(2)}`,
      totalValue: `$${((p.price || 0) * (p.stockQty || 0)).toFixed(2)}`,
      location: 'Showroom / Retail',
      status: p.stockQty > 50 ? 'In Stock' : p.stockQty > 0 ? 'Low Stock' : 'Out of Stock'
    }))
  ];

  const filteredData = stockItems.filter(item => {
    const matchesType = typeFilter === 'All Item Types' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'All Statuses' || item.status === statusFilter;
    const matchesLocation = locationFilter === 'All Locations' || item.location === locationFilter;
    return matchesType && matchesStatus && matchesLocation;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-4xl font-bold text-on-surface tracking-tight">Inventory Stock</h2>
          <p className="text-lg text-secondary mt-1">Status of fabrics and finished products across regions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-3 bg-white border border-outline-variant/30 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-surface-bright transition-all soft-shadow">
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl soft-shadow border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-6 border-b border-outline-variant/30 flex flex-wrap justify-between items-center gap-4 bg-surface-bright/30">
          <div className="flex flex-wrap items-center gap-4">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-outline-variant/50 rounded-xl text-xs bg-white outline-none cursor-pointer font-bold text-secondary"
            >
              <option>All Item Types</option>
              <option>Fabric</option>
              <option>Product</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-outline-variant/50 rounded-xl text-xs bg-white outline-none cursor-pointer font-bold text-secondary"
            >
              <option>All Statuses</option>
              <option>In Stock</option>
              <option>Low Stock</option>
              <option>Out of Stock</option>
            </select>
          </div>
          <div className="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-1 bg-surface-bright rounded-full">
            {filteredData.length} Items Listed
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-bright border-b border-outline-variant/30 text-[10px] font-bold text-secondary uppercase tracking-widest">
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-center">Quantity</th>
                <th className="px-6 py-4 text-right">Unit Value</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface divide-y divide-outline-variant/20">
              {filteredData.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-secondary italic font-medium">No inventory matches your search criteria.</td></tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-bright/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${row.type === 'Product' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                          {row.type === 'Product' ? <Package size={16} /> : <Layers size={16} />}
                        </div>
                        <div>
                          <div className="font-bold text-on-surface">{row.name}</div>
                          <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">{row.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-[10px] text-secondary">{row.code}</td>
                    <td className="px-6 py-5 text-center">
                      <div className={`font-bold ${row.status === 'Low Stock' ? 'text-error' : 'text-on-surface'}`}>{row.qty.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-secondary uppercase tracking-tighter">{row.unit}</div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="font-bold text-on-surface">{row.cost}</div>
                      <div className="text-xs text-primary font-bold">{row.totalValue} Total</div>
                    </td>
                    <td className="px-6 py-5 font-medium text-secondary text-xs">{row.location}</td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                        row.status === 'In Stock' ? 'bg-success/10 text-success' : 
                        row.status === 'Low Stock' ? 'bg-warning/10 text-warning' : 
                        'bg-error/10 text-error'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
