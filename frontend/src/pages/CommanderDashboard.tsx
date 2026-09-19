import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import GlassTooltip from '@/components/GlassTooltip';
import { Wifi, WifiOff } from 'lucide-react';
import { api } from '@/lib/api';
import { networkSalesData as mockSalesData } from '@/data/mockData';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const CommanderDashboard = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [rankings, setRankings] = useState<any[]>([]);
  const [anomalyFeed, setAnomalyFeed] = useState<any[]>([]);
  const [statusList, setStatusList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [r, a, s] = await Promise.all([
          api.getRankings(),
          api.getAnomalies(),
          api.getStatus()
        ]);
        setRankings(r);
        setAnomalyFeed(a);
        setStatusList(s);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const sorted = [...rankings].sort((a, b) => b.sentimentScore - a.sentimentScore);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="min-h-screen pt-20 pb-8 px-4 md:px-6 bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto">
        {/* Left Sidebar — Anomaly Feed */}
        <motion.div variants={item} className="lg:col-span-3 glass-card-alert p-4 h-[calc(100vh-6rem)] overflow-hidden relative">
          <h2 className="font-display text-sm tracking-widest text-destructive mb-4">ANOMALY SENTINEL</h2>
          <div className="space-y-3 overflow-hidden h-[calc(100%-3rem)]">
            <div className="animate-scroll-feed space-y-3" style={{ animation: 'scrollUp 20s linear infinite' }}>
              {(anomalyFeed.length > 0 ? [...anomalyFeed, ...anomalyFeed] : []).map((a, i) => (
                <div key={i} className="glass-card p-3 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-destructive mt-1.5 animate-pulse-glow shrink-0" />
                  <div>
                    <p className="text-xs font-body text-foreground">
                      <span className="text-destructive font-semibold">Shop {a.store}</span> — {a.item}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Spike: {a.spike} • {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="lg:col-span-6 space-y-4">
          {/* Rankings */}
          <motion.div variants={item} className="glass-card-glow p-5">
            <h2 className="font-display text-sm tracking-widest text-primary mb-4">STORE RANKINGS</h2>
            <div className="space-y-2">
              {sorted.map((s, i) => {
                const badges = ['🥇', '🥈', '🥉'];
                const isTop = i === 0;
                const isBottom = i === sorted.length - 1;
                return (
                  <div
                    key={s.store}
                    onClick={() => navigate(`/store/${s.store}`)}
                    className={`grid grid-cols-5 items-center p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] ${
                      isTop ? 'bg-primary/5 border border-primary/20' : isBottom ? 'bg-warning/5 border border-warning/20' : 'glass-card'
                    }`}
                  >
                    <span className="text-xl">{badges[i]}</span>
                    <span className="font-body text-sm text-foreground col-span-1">{s.name}</span>
                    <span className="text-sm font-display text-primary">{s.sentimentScore}</span>
                    <span className="text-sm font-body text-foreground/70">₹{(s.revenue7d / 1000).toFixed(1)}k</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.stockHealth > 70 ? 'bg-success' : s.stockHealth > 40 ? 'bg-warning' : 'bg-destructive'}`}
                          style={{ width: `${s.stockHealth}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{s.stockHealth}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Network Intelligence Chart */}
          <motion.div variants={item} className="glass-card-glow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm tracking-widest text-primary">NETWORK INTELLIGENCE</h2>
              <div className="flex gap-1">
                {['All', 'A', 'B', 'C'].map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-display transition-all ${
                      activeFilter === f ? 'bg-primary/20 text-primary' : 'text-foreground/40 hover:text-foreground/60'
                    }`}
                  >
                    {f === 'All' ? 'All' : `Shop ${f}`}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={mockSalesData[activeFilter]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'DM Sans' }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'DM Sans' }} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="actual" name="Actual Sales" fill="#22d3ee" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                <Line dataKey="predicted" name="Predicted" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Right Panel — Network Status */}
        <motion.div variants={item} className="lg:col-span-3 space-y-3">
          <h2 className="font-display text-sm tracking-widest text-primary mb-2">NETWORK STATUS</h2>
          {statusList.map(s => (
            <div key={s.store} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-sm text-foreground">{s.name}</span>
                {s.online ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
                    <Wifi size={14} className="text-success" />
                  </div>
                ) : (
                  <WifiOff size={14} className="text-destructive" />
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{s.activeSKUs} SKUs</span>
                <span>Synced: {s.lastSync}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CommanderDashboard;
