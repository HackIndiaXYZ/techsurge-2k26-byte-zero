import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { Bell, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { role, selectedStore, reset } = useAppStore();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const hasAnomalies = true;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-[rgba(255,255,255,0.08)] px-6 py-3 flex items-center justify-between"
    >
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse-glow" />
        </div>
        <span className="font-display text-primary text-lg tracking-widest">SENSELOG</span>
      </Link>

      <div className="flex items-center gap-3 md:gap-4">
        {(!isLanding || role) && (
          <>
            <NavItem to="/owner" label="Commander" active={location.pathname === '/owner'} />
            <NavItem to={`/store/${selectedStore || 'A'}`} label="Store Ops" active={location.pathname.startsWith('/store')} />
            <NavItem to="/orders" label="Order Nexus" active={location.pathname === '/orders'} />

            {selectedStore && (
              <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-display tracking-wider bg-primary/10 text-primary border border-primary/20">
                Shop {selectedStore}
              </span>
            )}
            {role && (
              <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-body bg-secondary text-foreground/70 capitalize">
                {role}
              </span>
            )}
            <Link to="/owner" className="relative p-2 rounded-lg hover:bg-secondary transition-colors" title="Anomaly Alerts">
              <Bell size={18} className="text-foreground/60" />
              {hasAnomalies && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-pulse-glow" />}
            </Link>
            <button onClick={reset} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Reset Session">
              <LogOut size={18} className="text-foreground/60" />
            </button>
          </>
        )}
      </div>
    </motion.nav>
  );
};

const NavItem = ({ to, label, active }: { to: string; label: string; active: boolean }) => (
  <Link
    to={to}
    className={`px-3 py-1.5 rounded-lg text-sm font-body transition-all ${
      active ? 'bg-primary/10 text-primary' : 'text-foreground/50 hover:text-foreground/80'
    }`}
  >
    {label}
  </Link>
);

export default Navbar;
