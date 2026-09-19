import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type StoreId } from '@/store/appStore';
import GlobeScene from '@/components/landing/GlobeScene';
import { 
  Brain, ShieldCheck, TrendingUp, Zap, Star, Quote, ChevronDown,
  Database, Activity, BrainCircuit, Truck, Network, Layers, GitMerge
} from 'lucide-react';

const tickerMessages = [
  '98.3% Forecast Accuracy',
  'Anomaly Guard: ACTIVE',
  '3 Stores Online',
  'Next Reorder: 2 days',
];

const stats = [
  { value: '98.3%', label: 'Forecast Accuracy', icon: Brain },
  { value: '3x', label: 'Faster Reordering', icon: Zap },
  { value: '₹2.1Cr', label: 'Inventory Optimized', icon: TrendingUp },
  { value: '24/7', label: 'Anomaly Monitoring', icon: ShieldCheck },
];

const features = [
  {
    icon: Brain,
    title: 'LSTM Demand Forecasting',
    description: 'Deep learning models predict 30-day demand with 98%+ accuracy across all SKUs.',
  },
  {
    icon: ShieldCheck,
    title: 'Anomaly Sentinel',
    description: 'Isolation Forest algorithms detect demand spikes and stock irregularities in real-time.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Reorder Engine',
    description: 'AI calculates exact quantities and optimal order dates factoring vendor lead times.',
  },
  {
    icon: Zap,
    title: 'Sentiment Intelligence',
    description: 'BERT-powered analysis of customer reviews drives store performance rankings.',
  },
];

const workflowSteps = [
  {
    icon: Database,
    title: '1. Data Sync',
    desc: 'Ingests real-time POS, inventory, and historical data.'
  },
  {
    icon: Activity,
    title: '2. Anomaly Scan',
    desc: 'Flags unnatural demand spikes and data errors instantly.'
  },
  {
    icon: BrainCircuit,
    title: '3. Neural Prediction',
    desc: 'LSTM maps 30-day trajectories factoring sentiment.'
  },
  {
    icon: Truck,
    title: '4. Auto-Reorder',
    desc: 'Generates POs based on dynamic lead-time pacing.'
  }
];

const testimonials = [
  {
    name: 'Arjun Mehta',
    role: 'Operations Head, RetailCorp',
    quote: 'SenseLog cut our stockouts by 74% in the first quarter. The AI forecasting is eerily accurate.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Store Manager, Shop B Delhi',
    quote: 'I used to spend hours on reorder calculations. Now the AI does it in seconds — and it\'s better than I ever was.',
    rating: 5,
  },
  {
    name: 'Vikram Patel',
    role: 'Supply Chain Director',
    quote: 'The anomaly detection caught a 340% demand spike before we even noticed. Saved us from a major stockout.',
    rating: 5,
  },
];

const integrations = ['SAP HANA', 'Oracle NetSuite', 'Shopify Plus', 'Microsoft Dynamics', 'Magento', 'Custom ERPs'];

const cubicEase = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: cubicEase as unknown as [number, number, number, number] },
  }),
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: cubicEase as unknown as [number, number, number, number] },
  }),
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: cubicEase as unknown as [number, number, number, number] },
  }),
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { setRole, setSelectedStore } = useAppStore();
  const [selectedRole, setSelectedRoleLocal] = useState<'owner' | 'manager' | null>(null);
  const [selectedStoreLocal, setSelectedStoreLocal] = useState<StoreId | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  useEffect(() => {
    const interval = setInterval(() => setTickerIndex(i => (i + 1) % tickerMessages.length), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    if (!selectedRole) return;
    setRole(selectedRole);
    if (selectedRole === 'owner') {
      navigate('/owner');
    } else if (selectedStoreLocal) {
      setSelectedStore(selectedStoreLocal);
      navigate(`/store/${selectedStoreLocal}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-foreground font-body">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-[100svh] overflow-x-hidden flex flex-col items-center justify-start pt-32 pb-16"
      >
        <div className="absolute inset-0 z-0">
          <GlobeScene />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#030712] to-transparent z-10" />
        </div>

        {/* AI Pulse Card */}
        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
          className="absolute top-28 right-8 glass-card-glow p-5 w-72 z-20"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-display text-primary tracking-widest">AI CORE STATUS</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={tickerIndex}
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.4 }}
              className="text-foreground font-body text-sm"
            >
              {tickerMessages[tickerIndex]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Central Hero Content */}
        <div className="z-20 text-center max-w-4xl px-4 mt-12 md:mt-16 mb-10">
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl md:text-6xl leading-[1.4] font-display font-semibold tracking-tight text-white mb-6"
          >
            Cognitive Supply Chain
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-[hsl(260,60%,60%)] mt-2 md:mt-4 pb-2">
              Operations Center
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12"
          >
            End-to-end predictive logistics powered by advanced neural networks. Eliminate stockouts, automate purchasing, and protect your margins.
          </motion.p>
        </div>

        {/* Login Card flex shrink */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-20 glass-card-glow border border-primary/20 p-8 w-full max-w-[440px] mx-4 shrink-0 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#030712]/60 backdrop-blur-xl"
        >
          <div className="text-center mb-6">
            <h2 className="font-display text-xl text-primary tracking-widest">ACCESS SENSELOG</h2>
            <p className="text-muted-foreground text-xs mt-1">Authenticate Identity</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {(['owner', 'manager'] as const).map(r => (
              <motion.button
                key={r}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedRoleLocal(r); if (r === 'owner') setSelectedStoreLocal(null); }}
                className={`p-4 rounded-xl border transition-all duration-300 text-center font-display text-sm tracking-wider flex flex-col items-center gap-2 ${
                  selectedRole === r
                    ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground/60 hover:bg-accent'
                }`}
              >
                {r === 'owner' ? <Layers className="w-5 h-5 mb-1" /> : <Network className="w-5 h-5 mb-1" />}
                {r === 'owner' ? 'Global Owner' : 'Store Manager'}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {selectedRole === 'manager' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden mb-4"
              >
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {(['A', 'B', 'C'] as const).map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedStoreLocal(s)}
                      className={`p-3 rounded-lg border text-xs font-display tracking-wider transition-all ${
                        selectedStoreLocal === s
                          ? 'border-primary/50 bg-primary/15 text-primary'
                          : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground/50 hover:bg-accent'
                      }`}
                    >
                      Shop {s}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEnter}
            disabled={!selectedRole || (selectedRole === 'manager' && !selectedStoreLocal)}
            className="w-full glow-btn disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2 py-4 text-sm tracking-widest"
          >
            INITIALIZE SESSION
          </motion.button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-6 h-6 text-primary/50" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Stats Ribbon */}
      <section className="relative z-10 border-y border-white/5 bg-secondary/20 backdrop-blur-md overflow-hidden py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={fadeInScale}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/5 border border-primary/10 mb-4 group-hover:bg-primary/10 transition-colors">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <p className={`text-3xl md:text-4xl font-semibold text-white tracking-tight ${stat.value === '24/7' ? 'font-body' : 'font-display'}`}>{stat.value}</p>
              <p className="text-primary text-sm font-display tracking-widest mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Pipeline */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-28 overflow-hidden">
        <motion.div
          variants={fadeUp}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-20"
        >
          <h2 className="font-display text-2xl md:text-3xl text-white tracking-tight mb-4">THE SENSELOG PIPELINE</h2>
          <p className="text-muted-foreground font-body max-w-2xl mx-auto text-lg pt-2">From raw retail data to fully autonomous supply chain command in four automated steps.</p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />

          {workflowSteps.map((step, i) => (
            <motion.div
              key={step.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="flex flex-col items-center text-center relative"
            >
              <div className="w-24 h-24 rounded-full bg-[#030712] border border-primary/20 shadow-[0_0_30px_rgba(34,211,238,0.1)] flex items-center justify-center mb-6 z-10 relative group hover:border-primary/50 transition-all">
                <div className="absolute inset-0 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                <step.icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="font-display text-lg text-white mb-3 tracking-wider">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 bg-secondary/10 border-y border-white/5 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-2xl md:text-3xl text-white tracking-tight mb-4">INTELLIGENCE MODULES</h2>
            <p className="text-muted-foreground font-body max-w-xl mx-auto text-lg pt-2">Four AI engines working in concert to optimize your retail network.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                custom={i}
                variants={i % 2 === 0 ? slideInLeft : slideInRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-card-glow p-8 group transition-all duration-300 bg-[#030712]/50 backdrop-blur-xl border border-white/10 hover:border-primary/30"
              >
                <div className="flex items-start gap-5">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors"
                  >
                    <feat.icon className="w-6 h-6" />
                  </motion.div>
                  <div>
                    <h3 className="font-display text-lg tracking-wider text-white mb-2">{feat.title}</h3>
                    <p className="text-muted-foreground text-[15px] font-body leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Ecosystem Marquee */}
      <section className="relative z-10 py-16 overflow-hidden border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 text-center mb-10">
          <p className="text-sm font-display tracking-widest text-primary/70 uppercase">Seamless Enterprise Integrations</p>
        </div>
        <div className="flex gap-8 items-center justify-center flex-wrap max-w-5xl mx-auto opacity-60 hover:opacity-100 transition-opacity duration-500">
          {integrations.map((integration, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <GitMerge className="w-4 h-4 text-primary" />
              <span className="font-display text-sm tracking-wider text-white">{integration}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-2xl md:text-3xl text-white tracking-tight mb-4">TRUSTED BY OPERATORS</h2>
            <p className="text-muted-foreground font-body max-w-lg mx-auto text-lg pt-2">Real results from logistics teams transforming their supply chains.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="glass-card-glow p-8 flex flex-col bg-[#030712]/50 border-white/10 hover:border-primary/40 transition-all"
              >
                <Quote className="w-10 h-10 text-primary/20 mb-6" />
                <p className="text-foreground/90 font-body text-base leading-relaxed flex-1 italic mb-6">"{t.quote}"</p>
                <div className="mt-auto border-t border-white/5 pt-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 + j * 0.05 }}
                      >
                        <Star className="w-4 h-4 fill-[#22d3ee] text-[#22d3ee]" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="font-display text-sm tracking-widest text-white mb-1">{t.name}</p>
                  <p className="text-primary/70 text-xs font-display tracking-widest">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expanded SaaS Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-t border-white/10 bg-secondary/30 pt-20 pb-10"
      >
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <h3 className="font-display text-xl text-primary tracking-widest mb-4">SENSELOG</h3>
            <p className="text-muted-foreground text-sm font-body leading-relaxed max-w-xs">
              Next-generation supply chain operations center powered by deep learning and predictive analytics.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm text-white tracking-widest mb-4">PRODUCT</h4>
            <ul className="space-y-3">
              {['Demand Forecasting', 'Anomaly Sentinel', 'Smart Reorder', 'Sentiment AI'].map(item => (
                <li key={item} className="text-muted-foreground text-sm hover:text-primary transition-colors cursor-pointer">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm text-white tracking-widest mb-4">RESOURCES</h4>
            <ul className="space-y-3">
              {['Documentation', 'API Reference', 'Case Studies', 'AI Whitepapers'].map(item => (
                <li key={item} className="text-muted-foreground text-sm hover:text-primary transition-colors cursor-pointer">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm text-white tracking-widest mb-4">COMPANY</h4>
            <ul className="space-y-3">
              {['About Us', 'Careers', 'Contact Sales', 'Terms of Service'].map(item => (
                <li key={item} className="text-muted-foreground text-sm hover:text-primary transition-colors cursor-pointer">{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
          <p>© 2026 SenseLog Intelligence Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Security Setup</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default LandingPage;
