import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { formatINR, formatDate } from '../../domain/formatters.js';
import { Plus, Receipt, AlertCircle, Filter } from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';
import DataTable from '../common/DataTable.jsx';

export default function ExpensesView({ onOpenAddExpense }) {
  const { expenses } = useBusiness();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredExpenses = selectedCategory === 'all'
    ? expenses
    : expenses.filter(e => e.category === selectedCategory);

  const totalOperatingCosts = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // Grouped category summary
  const categories = [
    'all',
    'Packaging & Shipping',
    'Studio & Tools',
    'Marketing & Events',
    'Software & Subscriptions',
    'Rent & Utilities',
    'General & Miscellaneous',
  ];

  const columns = [
    {
      header: 'Expense Description',
      key: 'description',
      render: (e) => (
        <div>
          <span className="font-bold text-brand-plum-950 block">{e.description}</span>
          <span className="text-[11px] text-brand-plum-400">{formatDate(e.date)}</span>
        </div>
      )
    },
    {
      header: 'Category',
      key: 'category',
      render: (e) => (
        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-lavender-100 text-brand-plum-800 border border-brand-lavender-200">
          {e.category || 'General'}
        </span>
      )
    },
    {
      header: 'Vendor / Payee',
      key: 'vendor',
      render: (e) => <span className="text-xs text-brand-plum-700">{e.vendor || '—'}</span>
    },
    {
      header: 'Payment Method',
      key: 'paymentMethod',
      render: (e) => <span className="text-xs text-brand-plum-600 font-medium">{e.paymentMethod || 'UPI'}</span>
    },
    {
      header: 'Amount',
      key: 'amount',
      align: 'right',
      render: (e) => (
        <span className="font-extrabold text-brand-plum-950 font-['Outfit']">
          {formatINR(e.amount)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operating Expenses Ledger"
        subtitle="Record studio overhead, shipping polymailers, stall registrations, and craft market fees."
        action={
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-brand-plum-100 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-plum-500">Total Operating Expenses</span>
          <p className="text-2xl font-extrabold text-brand-plum-950 font-['Outfit'] mt-1">{formatINR(totalOperatingCosts)}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-brand-plum-100 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-plum-500">Active Ledger Entries</span>
          <p className="text-2xl font-extrabold text-brand-plum-950 font-['Outfit'] mt-1">{expenses.length} Records</p>
        </div>
        <div className="p-4 bg-brand-cream-100/70 rounded-xl border border-brand-plum-100 shadow-2xs flex items-center">
          <div className="text-xs text-brand-plum-800 leading-relaxed">
            🛡️ <strong>Accounting Integrity Check</strong>: Raw material purchases (yarn, safety eyes, polyfill) are excluded from operating expenses and accounted under Inventory & COGS.
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 ${selectedCategory === cat ? 'bg-brand-plum-900 text-white shadow-xs' : 'bg-white text-brand-plum-700 border border-brand-plum-200 hover:bg-brand-cream-50'}`}
          >
            {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredExpenses}
        searchPlaceholder="Search expenses by description, vendor, or category..."
        searchKeys={['description', 'vendor', 'category']}
        initialSortKey="date"
        initialSortDirection="desc"
      />
    </div>
  );
}
