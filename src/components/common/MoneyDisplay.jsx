import React from 'react';
import { formatINR } from '../../domain/formatters.js';

export default function MoneyDisplay({ 
  amount = 0, 
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  color = 'default', // 'default' | 'positive' | 'negative' | 'muted'
  includeSymbol = true 
}) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-lg font-bold font-[\'Outfit\']',
    xl: 'text-2xl font-extrabold font-[\'Outfit\']',
  };

  const colorClasses = {
    default: 'text-brand-plum-950',
    positive: 'text-brand-sage-600',
    negative: 'text-brand-rose-600',
    muted: 'text-brand-plum-600/70',
  };

  return (
    <span className={`${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.default}`}>
      {formatINR(amount, includeSymbol)}
    </span>
  );
}
