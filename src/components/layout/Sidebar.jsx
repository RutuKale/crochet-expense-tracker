import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Sparkles, 
  ShoppingBag, 
  Clock, 
  Users, 
  Receipt, 
  Calculator, 
  BarChart3, 
  Settings, 
  Download,
  X
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  isOpen, 
  setIsOpen 
}) {
  const navSections = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      group: 'Inventory & Crafting',
      items: [
        { id: 'materials', label: 'Raw Materials', icon: Layers },
        { id: 'products', label: 'Finished Products', icon: Sparkles },
      ]
    },
    {
      group: 'Operations & Sales',
      items: [
        { id: 'sales', label: 'Sales & Invoices', icon: ShoppingBag },
        { id: 'orders', label: 'Custom Orders', icon: Clock },
        { id: 'customers', label: 'Customers CRM', icon: Users },
        { id: 'expenses', label: 'Operating Expenses', icon: Receipt },
      ]
    },
    {
      group: 'Insights & Pricing',
      items: [
        { id: 'pricing', label: 'Price Calculator', icon: Calculator },
        { id: 'reports', label: 'Reports & P&L', icon: BarChart3 },
      ]
    },
    {
      group: 'Administration',
      items: [
        { id: 'settings', label: 'Business Settings', icon: Settings },
        { id: 'export', label: 'Data Export & Backup', icon: Download },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-brand-plum-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-brand-plum-900 text-brand-cream-100 flex flex-col border-r border-brand-plum-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-brand-plum-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/wooly-bloom-logo.png" 
              alt="Wooly Bloom Logo" 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-gold-500/60 shadow-md"
            />
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white font-['Outfit'] block leading-none">
                Wooly Bloom
              </span>
              <span className="text-[10px] text-brand-gold-300/90 font-medium tracking-wider uppercase mt-1 block">
                Crochet Business Mgr
              </span>
            </div>
          </div>

          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-brand-plum-300 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.group}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-brand-plum-400/90 mb-2">
                {section.group}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${isActive ? 'bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 text-white font-semibold shadow-md shadow-brand-rose-950/20' : 'text-brand-cream-200/80 hover:bg-brand-plum-800/60 hover:text-white'}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-brand-rose-300/70'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="p-3.5 border-t border-brand-plum-800/80 text-[11px] text-brand-plum-400/80 flex items-center justify-between bg-brand-plum-950/40">
          <span>Version 1.0 • Blueprint</span>
          <span className="px-1.5 py-0.5 rounded bg-brand-plum-800 text-brand-rose-300 text-[10px]">INR / IST</span>
        </div>
      </aside>
    </>
  );
}
