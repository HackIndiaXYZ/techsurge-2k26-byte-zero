import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { sentimentAxes, storeNames, inventoryData, reviews as mockReviews, genForecast } from '@/data/mockData';
import GlassTooltip from '@/components/GlassTooltip';
import { Star, AlertCircle, ArrowUpRight, TrendingDown, TrendingUp, Package, ShieldAlert, Cpu } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore, type StoreId } from '@/store/appStore';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const StoreDashboard = () => {
  const navigate = useNavigate();
  const { setSelectedStore } = useAppStore();
  const { storeId: rawStoreId = 'A' } = useParams();
  const storeId = rawStoreId.toUpperCase();
  
  const initialInv = inventoryData[storeId] || inventoryData['A'] || [];
  const [forecast, setForecast] = useState<any[]>(() => {
    const raw = genForecast(storeId);
    return raw.map(d => ({ day: `Day ${d.day}`, forecast: d.forecast, actual: d.actual }));
  });
  const [inventory, setInventory] = useState<any[]>(initialInv);
  const [storeReviews, setStoreReviews] = useState<any[]>(mockReviews);
  const [selectedProduct, setSelectedProduct] = useState<string>(initialInv[0]?.product || 'Sofa');
  const [loading, setLoading] = useState(false);

  const storeName = storeNames[storeId] || `Shop ${storeId}`;

  useEffect(() => {
    if (storeId === 'A' || storeId === 'B' || storeId === 'C') {
      setSelectedStore(storeId as StoreId);
    }
  }, [storeId, setSelectedStore]);

  useEffect(() => {
    let isMounted = true;
    const loadStoreData = async () => {
      try {
        const [invRes, revsRes] = await Promise.allSettled([
          api.getInventory(storeId),
          api.getReviews(storeId)
        ]);
        if (!isMounted) return;
        if (invRes.status === 'fulfilled' && Array.isArray(invRes.value) && invRes.value.length > 0) {
          setInventory(invRes.value);
          setSelectedProduct(prev => {
            const exists = invRes.value.some((x: any) => x.product === prev);
            return exists ? prev : invRes.value[0].product;
          });
        }
        if (revsRes.status === 'fulfilled' && Array.isArray(revsRes.value) && revsRes.value.length > 0) {
          setStoreReviews(revsRes.value);
        }
      } catch (err) {
        console.error("Failed to load store data:", err);
      }
    };
    loadStoreData();
    return () => { isMounted = false; };
  }, [storeId]);

  const [forecastMetadata, setForecastMetadata] = useState<any>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      if (!selectedProduct) return;
      try {
        setLoading(true);
        const f = await api.getForecast(storeId, selectedProduct);
        setForecastMetadata({
           confidence: f.confidence_score,
           drivers: f.primary_drivers,
           review: f.review_recommendation,
           profit_margin: f.profit_margin_pct,
           total_demand: f.total_demand,
           visible_stock: f.predicted_visible_stock,
           inventory: f.predicted_inventory,
           daily_array: f.daily_demand_array || f.predictions || [],
           demand_shift: f.demand_shift_pct,
           forecast_range: f.forecast_range
        });

        // Use daily demand array if available, else weekly
        const dailyArr = f.daily_demand_array || f.predictions;
        if (dailyArr && dailyArr.length > 0) {
          const chartData = dailyArr.map((val: number, i: number) => ({
            day: `Day ${i + 1}`,
            forecast: val,
            actual: i < 5 ? Math.max(0, val - 1) : null
          }));
          setForecast(chartData);
        } else if (f.weekly_forecasts) {
          const weeklyChart = Object.entries(f.weekly_forecasts).map(([name, val]: [string, any], i: number) => ({
            day: name.replace('_', ' '),
            forecast: val,
            actual: i === 0 ? val - 2 : null
          }));
          setForecast(weeklyChart);
        }
      } catch (err) {
        console.error("Forecast failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [storeId, selectedProduct]);

  const radarData = sentimentAxes.map(a => ({ axis: a.axis, value: (a as any)[storeId] || 75 }));

  const stockOutDayIndex = useMemo(() => {
    if (!forecast || forecast.length === 0) return -1;
    const initialStock = (forecastMetadata?.visible_stock ?? 0) + (forecastMetadata?.inventory ?? 0);
    if (initialStock > 0) {
      let cum = 0;
      for (let i = 0; i < forecast.length; i++) {
        cum += (forecast[i].forecast || 0);
        if (cum >= initialStock) return i;
      }
    }
    const avg = forecast.reduce((acc, curr) => acc + (curr.forecast || 0), 0) / forecast.length;
    return forecast.findIndex(d => (d.forecast || 0) > avg * 1.3);
  }, [forecast, forecastMetadata]);

  const minDemand = forecast.length > 0 ? Math.min(...forecast.map(d => d.forecast || 0)) : 0;
  const maxDemand = forecast.length > 0 ? Math.max(...forecast.map(d => d.forecast || 0)) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="min-h-screen pt-24 pb-12 px-4 md:px-8 bg-[#030712] overflow-x-hidden">
      <div className="max-w-[1500px] mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/5 pb-6">
          <motion.div variants={item}>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-display text-primary tracking-widest uppercase">Live Node Active</span>
            </div>
            <h1 className="font-display text-3xl text-white tracking-widest">{storeName}</h1>
          </motion.div>
          
          <motion.div variants={item} className="flex flex-wrap items-center gap-3">
            {/* Store switcher pills */}
            <div className="flex items-center bg-[#030712]/50 backdrop-blur-md border border-white/10 p-1 rounded-xl">
              {(['A', 'B', 'C'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => navigate(`/store/${s}`)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all ${
                    storeId === s
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  Shop {s}
                </button>
              ))}
            </div>

            {/* SKU dropdown */}
            <div className="flex items-center gap-2 bg-[#030712]/50 backdrop-blur-md border border-white/10 p-2 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <span className="text-xs font-display text-muted-foreground tracking-widest pl-2">SKU:</span>
              <div className="relative">
                <select 
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="appearance-none bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-lg pl-4 pr-10 py-2 text-sm font-display tracking-wider text-primary outline-none transition-all cursor-pointer min-w-[180px]"
                >
                  {inventory.map(item => (
                    <option key={item.product} value={item.product} className="bg-[#030712]">{item.product}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        </div>

        {/* BENTO BOX GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Main Area: Forecast Chart (Spans 8 cols) */}
          <motion.div variants={item} className="xl:col-span-8 glass-card-glow p-6 md:p-8 flex flex-col relative overflow-hidden bg-gradient-to-br from-[#030712]/80 to-[#030712]/40 backdrop-blur-2xl border-white/10">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 z-10 relative">
               <div>
                 <h2 className="font-display text-xl tracking-widest text-white uppercase italic flex items-center gap-3">
                   <Cpu className="w-5 h-5 text-primary" />
                   LSTM Neural Forecast
                 </h2>
                 {forecastMetadata?.drivers && (
                   <div className="mt-3 flex flex-wrap gap-2">
                     <span className="text-[10px] text-muted-foreground font-display tracking-widest uppercase mt-1">DRIVERS:</span>
                     {(forecastMetadata.drivers || '').split('&').map((d: string, i: number) => (
                       <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-display text-primary/80 tracking-widest">
                         {d.trim()}
                       </span>
                     ))}
                   </div>
                 )}
               </div>

               {forecastMetadata?.review?.Required && (
                 <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/30 shadow-[0_0_20px_rgba(239,68,68,0.15)] shrink-0 group hover:bg-destructive/15 transition-colors">
                   <ShieldAlert className="w-5 h-5 text-destructive animate-pulse" />
                   <div className="flex flex-col">
                     <span className="text-[10px] font-display text-destructive tracking-widest uppercase mb-0.5">
                       Review Required
                     </span>
                     <span className="text-[10px] font-body text-destructive/80">
                       {forecastMetadata.review.Reason}
                     </span>
                   </div>
                 </div>
               )}
            </div>

            <div className="flex-1 min-h-[340px] z-10 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<GlassTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  {stockOutDayIndex >= 0 && (
                    <ReferenceLine x={forecast[stockOutDayIndex].day} stroke="#f59e0b" strokeDasharray="4 4" 
                      label={{ value: '⚠ RISK HORIZON', fill: '#f59e0b', fontSize: 10, fontFamily: 'Orbitron', position: 'insideTopLeft', dy: -5 }} 
                    />
                  )}
                  <Area type="monotone" dataKey="forecast" stroke="#22d3ee" strokeWidth={3} fill="url(#forecastGrad)" name="Forecast" activeDot={{ r: 6, fill: '#030712', stroke: '#22d3ee', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="actual" stroke="#cbd5e1" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Actual" connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Right Area: KPI Bento Cards (Spans 4 cols) */}
          <motion.div variants={item} className="xl:col-span-4 flex flex-col gap-6">
            
            {/* Top row of KPIs */}
            <div className="grid grid-cols-2 gap-6 flex-1">
              {/* Future Demand Shift */}
              <div className="glass-card flex flex-col justify-center p-6 relative overflow-hidden transition-all hover:border-primary/40 bg-secondary/10 group">
                <div className={`absolute top-0 right-0 w-24 h-24 blur-2xl transition-opacity group-hover:opacity-100 opacity-60 rounded-full ${forecastMetadata?.demand_shift > 0 ? 'bg-success/20' : 'bg-destructive/20'}`} />
                <p className="text-[10px] font-display text-muted-foreground tracking-widest mb-4 z-10 flex items-center justify-between">
                  SHIFT EST
                  {forecastMetadata?.demand_shift > 0 ? <ArrowUpRight className="w-3 h-3 text-success" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
                </p>
                <div className="flex flex-col justify-start z-10">
                  <span className={`text-3xl 2xl:text-4xl tracking-tight font-display mb-2 ${forecastMetadata?.demand_shift > 0 ? 'text-success' : 'text-destructive'} truncate`}>
                    {forecastMetadata?.demand_shift > 0 ? '+' : ''}{Number(forecastMetadata?.demand_shift || 0).toFixed(1).replace(/\.0$/, '')}%
                  </span>
                  <p className="text-[10px] text-muted-foreground font-body leading-relaxed">
                    Expected {forecastMetadata?.forecast_range?.Start} <br/> to {forecastMetadata?.forecast_range?.End}
                  </p>
                </div>
              </div>

              {/* Profit Margin */}
              <div className="glass-card flex flex-col justify-center p-6 relative overflow-hidden transition-all hover:border-primary/40 bg-secondary/10 group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-2xl transition-opacity opacity-60 group-hover:opacity-100 rounded-full" />
                <p className="text-[10px] font-display text-muted-foreground tracking-widest mb-4 z-10 flex items-center justify-between">
                  PROFIT EST
                  <TrendingUp className="w-3 h-3 text-primary" />
                </p>
                <div className="flex flex-col justify-start z-10">
                  <span className="text-3xl 2xl:text-4xl tracking-tight font-display text-primary mb-2 truncate">
                    {Number(forecastMetadata?.profit_margin || 0).toFixed(1).replace(/\.0$/, '')}%
                  </span>
                  <p className="text-[10px] text-muted-foreground font-body leading-relaxed">30-day projected aggregate profitability</p>
                </div>
              </div>
            </div>

            {/* Bottom Row of KPIs / Details */}
            <div className="glass-card p-6 bg-secondary/10 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                 <p className="text-[10px] font-display text-muted-foreground tracking-widest">NEURAL NETWORK CONFIDENCE</p>
                 <span className={`text-lg font-display ${parseInt(forecastMetadata?.confidence || '0') > 75 ? 'text-success' : 'text-warning'}`}>
                   {forecastMetadata?.confidence || '0%'}
                 </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-display text-muted-foreground tracking-widest mb-1">AGGREGATE DEMAND</p>
                  <p className="text-2xl font-display text-white">{forecastMetadata?.total_demand || 0}</p>
                </div>
                <div>
                  <p className="text-[9px] font-display text-muted-foreground tracking-widest mb-1">UNIT RANGE</p>
                  <p className="text-2xl font-display text-white">{minDemand} <span className="text-muted-foreground text-sm">-</span> {maxDemand}</p>
                </div>
              </div>
            </div>

          </motion.div>

          {/* Bottom Row of 3 Panels */}
          <motion.div variants={item} className="xl:col-span-4 glass-card-glow p-6 md:p-8 flex flex-col">
            <h2 className="font-display text-sm tracking-widest text-primary mb-6 flex items-center gap-2">
              <Package className="w-4 h-4" /> INVENTORY BURN
            </h2>
            <div className="space-y-6 flex-1 pr-2">
              {inventory.slice(0, 4).map((inv, i) => {
                const totalStock = inv.shelf + inv.backroom;
                const avgDemand = forecast.length > 0 
                  ? forecast.reduce((acc, d) => acc + (d.forecast || 0), 0) / forecast.length 
                  : 5;
                const daysOfStock = Math.round(totalStock / (avgDemand || 1));
                
                const shelfPct = Math.min(100, (inv.shelf / inv.maxCapacity) * 100);
                const backPct = Math.min(100, (inv.backroom / inv.maxCapacity) * 100);
                const barColor = daysOfStock < 3 ? 'bg-destructive' : daysOfStock < 7 ? 'bg-warning' : 'bg-success';
                const textColor = daysOfStock < 3 ? 'text-destructive' : daysOfStock < 7 ? 'text-warning' : 'text-success';

                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <div className="flex justify-between items-center mb-3">
                       <p className="text-sm font-display tracking-widest text-white/90 truncate mr-2">{inv.product}</p>
                       <span className={`text-[10px] font-display px-2 py-1 rounded-sm bg-white/5 border border-white/10 ${textColor}`}>
                         {daysOfStock} DAYS
                       </span>
                    </div>
                    {/* Stacked timeline look */}
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${shelfPct}%` }}
                        transition={{ duration: 1, delay: i * 0.15 }}
                        className={`h-full ${barColor}`}
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${backPct}%` }}
                        transition={{ duration: 1, delay: i * 0.15 + 0.1 }}
                        className="h-full bg-white/20 border-l border-black/20"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-muted-foreground font-body">Visible: {inv.shelf}</span>
                      <span className="text-[10px] text-muted-foreground font-body">Reserve: {inv.backroom}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={item} className="xl:col-span-4 glass-card-glow p-6 md:p-8 flex flex-col">
            <h2 className="font-display text-sm tracking-widest text-primary mb-6 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              SENTIMENT PULSE
            </h2>
            <div className="flex-1 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'DM Sans', letterSpacing: '1px' }} />
                  <Radar dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="#22d3ee" fillOpacity={0.15} activeDot={{ r: 4, fill: '#22d3ee' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={item} className="xl:col-span-4 glass-card-glow p-6 md:p-8 flex flex-col">
            <h2 className="font-display text-sm tracking-widest text-primary mb-6 flex items-center gap-2">
              <Star className="w-4 h-4" /> RECENT REVIEWS
            </h2>
            <div className="flex flex-col gap-4 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {storeReviews.map((r, i) => (
                  <motion.div 
                    key={`${r.name}-${i}`} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-display tracking-widest text-white">{r.name}</span>
                      <span className={`text-[9px] font-display tracking-widest uppercase px-2 py-0.5 rounded-full ${
                        r.sentiment === 'POSITIVE' ? 'bg-success/10 text-success border border-success/20' :
                        r.sentiment === 'NEGATIVE' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                        'bg-white/5 text-muted-foreground border border-white/10'
                      }`}>{r.sentiment}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star key={si} size={10} className={si < r.stars ? 'text-warning fill-warning' : 'text-muted-foreground/30'} />
                      ))}
                    </div>
                    <p className="text-[11px] text-foreground/60 font-body leading-relaxed">{r.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};

export default StoreDashboard;
