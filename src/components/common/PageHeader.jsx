import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  action = null, 
  secondaryAction = null 
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-brand-plum-700/70 font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-brand-plum-400" />}
                <span className={idx === breadcrumbs.length - 1 ? 'text-brand-plum-900 font-semibold' : 'hover:text-brand-plum-900'}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-brand-plum-950 sm:text-3xl font-['Outfit']">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-brand-plum-700/80 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-2.5 shrink-0">
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  );
}
