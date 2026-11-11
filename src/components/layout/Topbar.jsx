import React from 'react';
import { 
  Menu, 
  Plus, 
  RotateCcw, 
  Cloud, 
  Database, 
  Calendar 
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Topbar({ 
  onToggleSidebar, 
  onOpenCreateSale, 
  onOpenRecordPurchase,
  onOpenFirebaseConfig 
}) {
  const { dateFilter, setDateFilter, resetAllData } = useBusiness();
  const { businessProfile, isDemoMode } = useAuth();

  const filterOptions = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: '7days', label: '7 Days' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-brand-plum-100/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Workspace Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-brand-plum-700 hover:bg-brand-cream-200 lg:hidden transition"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5">
          <img 
            src="/wooly-bloom-logo.png" 
            alt="Logo" 
            className="w-7 h-7 rounded-full object-cover ring-1 ring-brand-gold-500/50 shadow-2xs"
          />
          <span className="text-sm font-bold text-brand-plum-950 font-['Outfit']">
            {businessProfile?.name || 'Wooly Bloom'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold-50 text-brand-gold-900 border border-brand-gold-200/80 font-bold">
            Studio Ledger
          </span>
        </div>
      </div>

      {/* Center: Global Date Filter Pills */}
      <div className="hidden md:flex items-center bg-brand-cream-100 p-1 rounded-xl border border-brand-plum-100">
        <Calendar className="w-3.5 h-3.5 text-brand-plum-400 ml-2 mr-1" />
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setDateFilter(opt.id)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${dateFilter === opt.id ? 'bg-white text-brand-plum-950 shadow-xs border border-brand-plum-100' : 'text-brand-plum-600/80 hover:text-brand-plum-950'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Right: Mode Indicator & Quick Action Triggers */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync Mode Badge */}
        <button
          onClick={onOpenFirebaseConfig}
          className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${isDemoMode ? 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'}`}
          title="Click to view or connect Firebase Cloud Storage/Firestore"
        >
          {isDemoMode ? (
            <>
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>Local Ledger (Active)</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Firebase Cloud</span>
            </>
          )}
        </button>

        {/* Clear Data button */}
        <button
          onClick={() => {
            if (window.confirm('Clear all data from the database and start with a fresh ledger?')) {
              resetAllData();
            }
          }}
          className="p-2 text-brand-plum-600 hover:text-brand-plum-950 hover:bg-brand-cream-200 rounded-xl transition"
          title="Clear all store records"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* New Sale Button */}
        <button
          onClick={onOpenCreateSale}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 text-white text-xs font-bold shadow-sm shadow-brand-rose-900/10 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Bill / Sale</span>
        </button>
      </div>
    </header>
  );
}
