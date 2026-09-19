import React from 'react';

interface GlassTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

const GlassTooltip: React.FC<GlassTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card-glow p-3 min-w-[140px]">
      <p className="text-xs text-muted-foreground font-display mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-body" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default GlassTooltip;
