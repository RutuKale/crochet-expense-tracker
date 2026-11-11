import React from 'react';

export default function FormField({
  label,
  hint,
  error,
  required = false,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold tracking-wide text-brand-plum-900 uppercase">
          {label}
          {required && <span className="text-brand-rose-600 ml-1 font-bold">*</span>}
        </label>
      )}

      {children}

      {hint && !error && (
        <p className="text-xs text-brand-plum-600/70">{hint}</p>
      )}

      {error && (
        <p className="text-xs font-medium text-brand-rose-600">{error}</p>
      )}
    </div>
  );
}
