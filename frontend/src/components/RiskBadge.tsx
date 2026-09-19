import React from 'react';
import { RiskLevel } from '../types';
import { AlertTriangle, AlertCircle, Info, HelpCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showIcon = true,
}) => {
  const configs = {
    high: {
      bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-rose-500/30',
      label: 'HIGH RISK INTERACTION',
      icon: AlertTriangle,
    },
    moderate: {
      bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-amber-500/30',
      label: 'MODERATE RISK INTERACTION',
      icon: AlertCircle,
    },
    low: {
      bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-emerald-500/30',
      label: 'LOW RISK (SAFE / COMPATIBLE)',
      icon: Info,
    },
    unknown: {
      bg: 'bg-slate-700/40 text-slate-300 border-slate-600/50 ring-slate-500/20',
      label: 'UNRESOLVED MEDICATION',
      icon: HelpCircle,
    },
  };

  const config = configs[level] || configs.unknown;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-sm px-3.5 py-1.5 gap-1.5 font-semibold',
    lg: 'text-base px-5 py-2.5 gap-2 font-bold tracking-wide',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm transition-all ring-1 ${config.bg} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
    </span>
  );
};
