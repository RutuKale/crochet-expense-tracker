import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KpiCard({
  label,
  value,
  subvalue,
  change,
  isPositive,
  icon: Icon,
  variant = 'default', // 'default' | 'plum' | 'rose' | 'sage' | 'lavender'
}) {
  const variantStyles = {
    default: {
      card: 'bg-white border-brand-plum-100 hover:border-brand-plum-200',
      iconBox: 'bg-brand-cream-200 text-brand-plum-800',
    },
    plum: {
      card: 'bg-brand-plum-900 text-white border-brand-gold-500/30 shadow-md',
      iconBox: 'bg-brand-gold-500/20 text-brand-gold-300 border border-brand-gold-500/30',
      label: 'text-brand-gold-300/90 font-bold',
      value: 'text-white',
    },
    gold: {
      card: 'bg-gradient-to-br from-white to-brand-gold-50/70 border-brand-gold-200/80',
      iconBox: 'bg-brand-gold-100 text-brand-gold-800',
    },
    rose: {
      card: 'bg-gradient-to-br from-white to-brand-rose-50 border-brand-rose-200/60',
      iconBox: 'bg-brand-rose-100 text-brand-rose-600',
    },
    sage: {
      card: 'bg-gradient-to-br from-white to-brand-sage-50 border-brand-sage-200/60',
      iconBox: 'bg-brand-sage-100 text-brand-sage-600',
    },
    lavender: {
      card: 'bg-gradient-to-br from-white to-brand-lavender-50 border-brand-lavender-200/60',
      iconBox: 'bg-brand-lavender-100 text-brand-plum-600',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md ${style.card}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold tracking-wider uppercase ${style.label || 'text-brand-plum-600/75'}`}>
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold tracking-tight font-['Outfit'] ${style.value || 'text-brand-plum-950'}`}>
              {value}
            </span>
            {subvalue && (
              <span className="text-xs text-brand-plum-500 font-medium">
                {subvalue}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl shrink-0 ${style.iconBox}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          {isPositive ? (
            <span className="flex items-center text-brand-sage-600">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              +{change}
            </span>
          ) : (
            <span className="flex items-center text-brand-rose-600">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              {change}
            </span>
          )}
          <span className="text-brand-plum-400">vs previous period</span>
        </div>
      )}
    </div>
  );
}
