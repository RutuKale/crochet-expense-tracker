import React from 'react';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'Get started by creating your first record.',
  icon: Icon = PackageOpen,
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-dashed border-brand-plum-200/80 my-4">
      <div className="w-14 h-14 rounded-full bg-brand-cream-200 text-brand-plum-700 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-brand-plum-950 font-['Outfit']">
        {title}
      </h3>
      <p className="mt-1 text-sm text-brand-plum-600/80 max-w-sm mb-4">
        {description}
      </p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
