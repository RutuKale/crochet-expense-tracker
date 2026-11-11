import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Package, 
  CreditCard 
} from 'lucide-react';

export default function StatusBadge({ status, label, size = 'md' }) {
  const configs = {
    // Sales / Invoices
    completed: {
      bg: 'bg-brand-sage-50 text-brand-sage-700 border-brand-sage-200',
      icon: CheckCircle2,
      text: label || 'Paid / Completed',
    },
    partially_paid: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: CreditCard,
      text: label || 'Partially Paid',
    },
    unpaid: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertTriangle,
      text: label || 'Unpaid',
    },
    voided: {
      bg: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: XCircle,
      text: label || 'Voided',
    },

    // Orders
    inquiry: {
      bg: 'bg-brand-lavender-100 text-brand-plum-700 border-brand-lavender-200',
      icon: Clock,
      text: label || 'Inquiry',
    },
    awaiting_materials: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
      text: label || 'Awaiting Materials',
    },
    in_progress: {
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: Package,
      text: label || 'In Progress',
    },
    ready: {
      bg: 'bg-brand-sage-50 text-brand-sage-700 border-brand-sage-200',
      icon: CheckCircle2,
      text: label || 'Ready for Dispatch',
    },
    delivered: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      text: label || 'Delivered',
    },
    cancelled: {
      bg: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: XCircle,
      text: label || 'Cancelled',
    },

    // Stock
    low_stock: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertTriangle,
      text: label || 'Low Stock',
    },
    in_stock: {
      bg: 'bg-brand-sage-50 text-brand-sage-700 border-brand-sage-200',
      icon: CheckCircle2,
      text: label || 'In Stock',
    },
  };

  const current = configs[status] || {
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
    text: label || status,
  };

  const Icon = current.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClasses} ${current.bg}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{current.text}</span>
    </span>
  );
}
