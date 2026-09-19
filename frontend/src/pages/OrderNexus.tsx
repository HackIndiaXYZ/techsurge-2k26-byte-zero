import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Check, Truck, Zap, RefreshCw, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const QUICK_DELIVERY_DAYS = 5;
const NORMAL_DELIVERY_DAYS = 10;
const QUICK_PCT = 0.25;

interface OrderRow {
  id: number;
  product: string;
  store: string;
  recommendedQty: number;
  editedQty: number;
  quickQty: number;
  normalQty: number;
  orderByDate: string;
  vendor: string;
  priority: 'URGENT' | 'SOON' | 'PLANNED';
  checked: boolean;
  vendorOptions: any[];
  vendorOpen: boolean;
}

const priorityStyles = {
  URGENT: 'bg-destructive/20 text-destructive border-destructive/30',
  SOON: 'bg-warning/20 text-warning border-warning/30',
  PLANNED: 'bg-primary/20 text-primary border-primary/30',
};

const shopLabel = (raw: string) => {
  const map: Record<string, string> = { shop1: 'Shop 1', shop2: 'Shop 2', shop3: 'Shop 3' };
  return map[raw] || raw;
};

const InlineEdit = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const commit = (val: string) => {
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0) onChange(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        defaultValue={value}
        autoFocus
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-16 px-2 py-0.5 rounded bg-secondary border border-primary/50 text-primary text-sm font-display outline-none"
      />
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className="text-sm font-display text-primary hover:text-primary/80 underline decoration-dotted underline-offset-2 transition-colors"
      title="Click to edit"
    >
      {value}
    </button>
  );
};

const OrderNexus = () => {
  const { selectedStore } = useAppStore();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [dispatchedIds, setDispatchedIds] = useState<number[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const updateOrder = (id: number, updates: Partial<OrderRow>) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));

  const onQtyChange = (id: number, newTotal: number) => {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    const safeQuick = Math.min(o.quickQty, newTotal);
    updateOrder(id, { editedQty: newTotal, quickQty: safeQuick, normalQty: newTotal - safeQuick });
  };

  const onQuickQtyChange = (id: number, newQuick: number) => {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    const safeQuick = Math.min(newQuick, o.editedQty);
    updateOrder(id, { quickQty: safeQuick, normalQty: o.editedQty - safeQuick });
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const liveOrders = await api.getOrders();
      // Keep track of existing vendors to avoid redundant API calls
      const existingVendors = new Map(orders.map(o => [o.product, { v: o.vendor, opts: o.vendorOptions }]));
      
      const rows: OrderRow[] = liveOrders.map((o: any, i: number) => {
        const qty = Number(o['Order Quantity']) || 0;
        const quickQty = Math.round(qty * QUICK_PCT);
        const product = o['Product Name'];
        const existing = existingVendors.get(product);
        
        return {
          id: i + 1,
          product,
          store: o['Shop'],
          recommendedQty: qty,
          editedQty: qty,
          quickQty,
          normalQty: qty - quickQty,
          orderByDate: o['Order Date'],
          vendor: existing?.v || 'Loading...',
          priority: 'URGENT' as const,
          checked: true,
          vendorOptions: existing?.opts || [],
          vendorOpen: false,
        };
      });
      setOrders(rows);

      const productsToFetch = [...new Set(rows.filter(r => r.vendor === 'Loading...').map(r => r.product))];
      await Promise.all(productsToFetch.map(async (prod) => {
        try {
          const v = await api.getVendors(prod);
          const topVendor = v && v.length > 0 ? v[0]['Vendor_Name'] : 'Standard Freight';
          setOrders(prev => prev.map(r =>
            r.product === prod ? { ...r, vendor: topVendor, vendorOptions: v || [] } : r
          ));
        } catch {}
      }));
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const toggleCheck = (id: number) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, checked: !o.checked } : o));

  const toggleVendorOpen = (id: number) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, vendorOpen: !o.vendorOpen } : o));

  const selectVendor = (id: number, vendorName: string) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, vendor: vendorName, vendorOpen: false } : o));

  const onConfirmAll = async () => {
    const checkedOrders = filteredOrders.filter(o => o.checked);
    if (!checkedOrders.length) return;
    
    setConfirming(true);
    setProcessingCount(0);
    setDispatchedIds([]);
    
    try {
      const uniqueProducts = [...new Set(checkedOrders.map(o => o.product))];
      const total = uniqueProducts.length;
      
      for (let i = 0; i < total; i++) {
        const product = uniqueProducts[i];
        await api.placeOrder(product);
        
        // Mark products as dispatched in the UI immediately
        const affectedIds = checkedOrders.filter(o => o.product === product).map(o => o.id);
        setDispatchedIds(prev => [...prev, ...affectedIds]);
        setProcessingCount(i + 1);
      }
      
      setConfirming(false);
      setConfirmed(true);
      setTimeout(() => {
        setConfirmed(false);
        setDispatchedIds([]);
      }, 4000);
      
      await loadOrders();
    } catch (err) {
      console.error('Dispatch failed:', err);
      setConfirming(false);
    }
  };

  const storeMapRev: Record<string, string> = { 'A': 'shop1', 'B': 'shop2', 'C': 'shop3' };
  const filteredOrders = !selectedStore 
    ? orders 
    : orders.filter(o => o.store === storeMapRev[selectedStore]);

  const checkedCount = filteredOrders.filter(o => o.checked).length;
  const totalUnits = filteredOrders.filter(o => o.checked).reduce((a, o) => a + o.editedQty, 0);
  const totalQuick = filteredOrders.filter(o => o.checked).reduce((a, o) => a + o.quickQty, 0);
  const totalNormal = filteredOrders.filter(o => o.checked).reduce((a, o) => a + o.normalQty, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="min-h-screen pt-20 pb-8 px-4 md:px-6 bg-background">
      <div className="max-w-[1500px] mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <motion.h1 variants={item} className="font-display text-xl text-primary tracking-widest">ORDER NEXUS</motion.h1>
            <motion.p variants={item} className="text-xs text-muted-foreground font-body mt-1">
              {checkedCount} orders selected · {totalUnits} total units · <span className="text-warning">{totalQuick} quick</span> · {totalNormal} standard
            </motion.p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button variants={item} onClick={loadOrders} className="p-2 glass-card rounded-lg hover:bg-white/5 transition-colors" title="Refresh">
              <RefreshCw size={16} className="text-muted-foreground" />
            </motion.button>
            <motion.button
              variants={item}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirmAll}
              disabled={confirming || checkedCount === 0}
              className={`flex items-center gap-2 text-sm px-6 py-2.5 rounded-lg font-display tracking-widest transition-all duration-500 ${
                confirmed 
                  ? 'bg-success/20 text-success border border-success/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                  : confirming
                    ? 'bg-warning/20 text-warning border border-warning/30 animate-pulse cursor-wait'
                    : 'glow-btn'
              }`}
            >
              <AnimatePresence mode="wait">
                {confirmed ? (
                  <motion.div key="conf" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <Check size={16} className="text-success" strokeWidth={3} /> Orders Dispatched!
                  </motion.div>
                ) : confirming ? (
                  <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin" /> 
                    Dispatching ({processingCount}/{[...new Set(filteredOrders.filter(o => o.checked).map(o => o.product))].length})...
                  </motion.div>
                ) : (
                  <motion.div key="def" className="flex items-center gap-2">
                    <Truck size={16} /> Dispatch Selected ({checkedCount})
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>  

        <motion.div variants={item} className="glass-card-glow overflow-visible mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 w-10"></th>
                  {['Product', 'Store', 'Order Qty', 'Order By', 'Priority', 'Quick Delivery ⚡', 'Normal Delivery 🚛'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-display tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground font-body">Loading intelligent orders...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground font-body">No orders found. Run the forecasting engine first.</td></tr>
                ) : filteredOrders.map(o => {
                  const isDispatched = dispatchedIds.includes(o.id);
                  return (
                  <tr key={o.id} className={`border-b border-white/4 transition-all duration-700 ${o.checked ? '' : 'opacity-40'} ${isDispatched ? 'bg-success/5 grayscale-[0.5] translate-x-1' : ''}`}>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleCheck(o.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${o.checked ? 'bg-primary border-primary' : 'border-white/20 hover:border-primary/50'}`}
                      >
                        {o.checked && <Check size={10} className="text-background" strokeWidth={3} />}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-sm font-body text-foreground font-medium relative">
                      {isDispatched && (
                        <motion.div 
                          initial={{ scaleX: 0 }} 
                          animate={{ scaleX: 1 }} 
                          className="absolute left-4 right-4 h-[1px] bg-success/50 top-1/2 -translate-y-1/2 origin-left" 
                        />
                      )}
                      <span className={isDispatched ? 'text-success/70 transition-colors' : ''}>{o.product}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-body text-foreground/60">{shopLabel(o.store)}</td>

                    {/* Editable Total Qty */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <InlineEdit value={o.editedQty} onChange={(v) => onQtyChange(o.id, v)} />
                        <span className="text-[10px] text-muted-foreground">units</span>
                        {o.editedQty !== o.recommendedQty && (
                          <span className="text-[9px] text-warning ml-1">(AI: {o.recommendedQty})</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs font-body text-foreground bg-secondary px-2.5 py-1 rounded-lg">{o.orderByDate}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-display tracking-wider px-2 py-1 rounded-full border ${priorityStyles[o.priority]}`}>
                        {o.priority}
                      </span>
                    </td>

                    {/* Quick Delivery — editable qty + vendor dropdown */}
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <Zap size={13} className="text-warning mt-0.5 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <InlineEdit value={o.quickQty} onChange={(v) => onQuickQtyChange(o.id, v)} />
                            <span className="text-[10px] text-muted-foreground">units · {QUICK_DELIVERY_DAYS}d</span>
                          </div>
                          <div className="relative">
                            <button
                              onClick={() => toggleVendorOpen(o.id)}
                              className="flex items-center gap-1 text-[10px] font-body text-primary/80 hover:text-primary transition-colors"
                            >
                              <span className="truncate max-w-[110px]">{o.vendor}</span>
                              <ChevronDown size={10} className={`shrink-0 transition-transform ${o.vendorOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                              {o.vendorOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                  className="absolute top-full left-0 mt-1 z-50 w-60 rounded-xl glass-card border border-white/10 shadow-2xl overflow-hidden"
                                >
                                  {o.vendorOptions.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-muted-foreground">No vendors found</div>
                                  ) : o.vendorOptions.map((v: any, vi: number) => (
                                    <button
                                      key={vi}
                                      onClick={() => selectVendor(o.id, v.Vendor_Name)}
                                      className={`w-full px-3 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0 ${o.vendor === v.Vendor_Name ? 'bg-primary/10' : ''}`}
                                    >
                                      <div>
                                        <div className="text-xs font-body text-foreground flex items-center gap-1.5">
                                          {v.Vendor_Name}
                                          {vi === 0 && <span className="text-[8px] font-display text-success bg-success/10 px-1 py-0.5 rounded-full border border-success/20">BEST</span>}
                                        </div>
                                        <div className="text-[9px] text-muted-foreground mt-0.5">{v.Delivery_Time}h lead · ₹{v.Cost}/unit · cap {v.Max_Capacity}</div>
                                      </div>
                                      <div className="text-right shrink-0 ml-2">
                                        <div className="text-xs font-display text-success">{(v.Reliability_Rating * 100).toFixed(0)}%</div>
                                        <div className="text-[8px] text-muted-foreground">reliable</div>
                                      </div>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Normal Delivery — display only, no vendor picker */}
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <Truck size={13} className="text-primary/50 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-display text-foreground/80">
                            {o.normalQty} <span className="text-[10px] text-muted-foreground font-body">units</span>
                          </div>
                          <div className="text-[9px] text-muted-foreground">Standard Freight · {NORMAL_DELIVERY_DAYS}d</div>
                        </div>
                      </div>
                    </td>

                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {checkedCount > 0 && (
          <motion.div variants={item} className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] font-display text-muted-foreground tracking-widest mb-1">TOTAL UNITS</p>
              <p className="text-2xl font-display text-primary">{totalUnits}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] font-display text-muted-foreground tracking-widest mb-1">QUICK DISPATCH ⚡</p>
              <p className="text-2xl font-display text-warning">{totalQuick}</p>
              <p className="text-[9px] text-muted-foreground">ETA {QUICK_DELIVERY_DAYS} days</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] font-display text-muted-foreground tracking-widest mb-1">NORMAL FREIGHT 🚛</p>
              <p className="text-2xl font-display text-foreground">{totalNormal}</p>
              <p className="text-[9px] text-muted-foreground">ETA {NORMAL_DELIVERY_DAYS} days</p>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default OrderNexus;

