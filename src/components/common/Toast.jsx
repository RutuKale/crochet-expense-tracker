import React from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useBusiness();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-brand-sage-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-brand-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-plum-600 shrink-0" />,
  };

  const borders = {
    success: 'border-brand-sage-300 bg-white text-brand-plum-950',
    error: 'border-brand-rose-300 bg-white text-brand-plum-950',
    info: 'border-brand-lavender-300 bg-white text-brand-plum-950',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-2 duration-200 ${borders[toast.type] || borders.info}`}
        >
          {icons[toast.type] || icons.info}
          <div className="flex-1 text-sm font-medium leading-snug">
            {toast.message}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-brand-plum-400 hover:text-brand-plum-700 transition-colors p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
