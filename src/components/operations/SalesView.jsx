import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatINR, formatDate } from '../../domain/formatters.js';
import { generateInvoicePDF } from '../../services/pdfService.js';
import { Plus, Download, Eye, FileText, ShoppingBag } from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';
import DataTable from '../common/DataTable.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

export default function SalesView({ onOpenCreateSale, onSelectSale }) {
  const { sales } = useBusiness();
  const { businessProfile } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredSales = statusFilter === 'all' 
    ? sales 
    : sales.filter(s => s.status === statusFilter);

  const totalSalesVolume = sales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  const totalPaid = sales.reduce((acc, s) => acc + (Number(s.paidAmount) || 0), 0);
  const totalReceivables = sales.reduce((acc, s) => acc + (Number(s.balanceAmount) || 0), 0);

  const columns = [
    {
      header: 'Invoice #',
      key: 'invoiceNumber',
      render: (s) => (
        <div>
          <span className="font-bold text-brand-plum-950 block">{s.invoiceNumber}</span>
          <span className="text-[11px] text-brand-plum-400">{formatDate(s.date)}</span>
        </div>
      )
    },
    {
      header: 'Customer',
      key: 'customerName',
      render: (s) => (
        <div>
          <span className="font-semibold text-brand-plum-950 block">{s.customerName}</span>
          {s.customerPhone && <span className="text-[11px] text-brand-plum-500">{s.customerPhone}</span>}
        </div>
      )
    },
    {
      header: 'Items Billed',
      key: 'items',
      render: (s) => (
        <span className="text-xs text-brand-plum-700">
          {s.items?.map(i => `${i.productName} (x${i.quantity})`).join(', ') || '—'}
        </span>
      )
    },
    {
      header: 'Total Bill',
      key: 'totalAmount',
      align: 'right',
      render: (s) => (
        <span className="font-extrabold text-brand-plum-950 font-['Outfit']">
          {formatINR(s.totalAmount)}
        </span>
      )
    },
    {
      header: 'Paid / Balance',
      key: 'paidAmount',
      align: 'right',
      render: (s) => (
        <div className="text-right">
          <span className="text-xs font-semibold text-brand-sage-700 block">{formatINR(s.paidAmount)}</span>
          {s.balanceAmount > 0 && (
            <span className="text-[11px] font-bold text-brand-rose-600 block">Due: {formatINR(s.balanceAmount)}</span>
          )}
        </div>
      )
    },
    {
      header: 'Payment Status',
      key: 'status',
      align: 'center',
      render: (s) => <StatusBadge status={s.status} size="sm" />
    },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onSelectSale(s)}
            className="p-1.5 text-xs font-semibold text-brand-plum-700 bg-brand-cream-100 hover:bg-brand-cream-200 rounded-lg flex items-center gap-1 transition"
            title="View Details & Payments"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
          <button
            onClick={() => generateInvoicePDF(s, businessProfile)}
            className="p-1.5 text-brand-rose-600 hover:text-brand-rose-700 hover:bg-brand-rose-50 rounded-lg transition"
            title="Download PDF Invoice"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Invoices"
        subtitle="Search and issue client invoices, track paid balances, and export branded PDF bills."
        action={
          <button
            onClick={onOpenCreateSale}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Bill / Sale</span>
          </button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-brand-plum-100 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-plum-500">Total Invoiced</span>
          <p className="text-2xl font-extrabold text-brand-plum-950 font-['Outfit'] mt-1">{formatINR(totalSalesVolume)}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-brand-plum-100 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-plum-500">Collected Cash</span>
          <p className="text-2xl font-extrabold text-brand-sage-600 font-['Outfit'] mt-1">{formatINR(totalPaid)}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-brand-plum-100 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-plum-500">Outstanding Receivables</span>
          <p className={`text-2xl font-extrabold font-['Outfit'] mt-1 ${totalReceivables > 0 ? 'text-brand-rose-600' : 'text-brand-sage-600'}`}>
            {formatINR(totalReceivables)}
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2">
        {['all', 'completed', 'partially_paid', 'unpaid'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${statusFilter === status ? 'bg-brand-plum-900 text-white border-brand-plum-900' : 'bg-white text-brand-plum-700 border-brand-plum-200 hover:bg-brand-cream-50'}`}
          >
            {status === 'all' ? 'All Invoices' : status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredSales}
        searchPlaceholder="Search invoices by number, customer, product..."
        searchKeys={['invoiceNumber', 'customerName', 'customerPhone']}
        initialSortKey="invoiceNumber"
        initialSortDirection="desc"
      />
    </div>
  );
}
