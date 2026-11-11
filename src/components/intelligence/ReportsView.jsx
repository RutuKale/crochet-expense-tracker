import React from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { formatINR, formatDate } from '../../domain/formatters.js';
import { Download, BarChart3, FileSpreadsheet, ShieldAlert, CheckCircle2 } from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';

export default function ReportsView() {
  const { pnl, inventoryValuation, expenses, sales, dateFilter } = useBusiness();

  const handleExportCSV = () => {
    // Generate simple standard CSV statement
    const rows = [
      ['Wooly Bloom - Profit & Loss Statement'],
      [`Period: ${dateFilter.toUpperCase()} | Timezone: Asia/Kolkata (IST)`],
      ['Generated:', new Date().toLocaleString('en-IN')],
      [''],
      ['FINANCIAL LINE ITEM', 'AMOUNT (INR)'],
      ['Gross Sales', pnl.grossSales],
      ['Less: Discounts Given', -pnl.discounts],
      ['Less: Refunds Issued', -pnl.refunds],
      ['NET SALES', pnl.netSales],
      ['Less: Cost of Goods Sold (COGS)', -pnl.cogs],
      ['GROSS PROFIT', pnl.grossProfit],
      [`Gross Margin %`, `${pnl.grossMarginPct}%`],
      [''],
      ['OPERATING EXPENSES (EXCLUDING INVENTORY)', ''],
      ...Object.entries(pnl.expensesByCategory || {}).map(([cat, amt]) => [`  ${cat}`, amt]),
      ['TOTAL OPERATING EXPENSES', pnl.operatingExpenses],
      [''],
      ['NET OPERATING PROFIT', pnl.netOperatingProfit],
      ['Net Profit Margin %', `${pnl.netProfitMarginPct}%`],
      [''],
      ['CASH & WORKING CAPITAL RECONCILIATION', ''],
      ['Cash Received in Period', pnl.cashReceived],
      ['Outstanding Receivables', pnl.receivables],
      ['Raw Material Inventory Valuation', inventoryValuation.rawMaterialsValuation],
      ['Finished Products Inventory Valuation', inventoryValuation.finishedProductsValuation],
      ['TOTAL ASSET INVENTORY VALUATION', inventoryValuation.totalInventoryValuation],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wooly_Bloom_P&L_${dateFilter}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports & P&L Statement"
        subtitle="GAAP-aligned profit and loss accounting with exact COGS tracking and cash flow reconciliation."
        action={
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-plum-900 hover:bg-brand-plum-950 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Download className="w-4 h-4 text-brand-rose-300" />
            <span>Export Financial CSV</span>
          </button>
        }
      />

      {/* Main Income Statement Table */}
      <div className="bg-white rounded-2xl border border-brand-plum-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-brand-plum-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-['Outfit']">Profit & Loss Statement (P&L)</h3>
            <p className="text-xs text-brand-plum-200">Reconciled to transaction-level invoices and verified costs</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-plum-800 text-brand-rose-200 font-mono">
            IST • Filter: {dateFilter.toUpperCase()}
          </span>
        </div>

        <div className="p-6 divide-y divide-brand-plum-100/75 text-sm">
          {/* Revenue Section */}
          <div className="pb-4 space-y-2">
            <h4 className="text-xs font-bold text-brand-plum-800 uppercase tracking-wider">
              1. Revenue & Sales
            </h4>
            <div className="flex justify-between text-brand-plum-700 text-xs">
              <span>Gross Invoiced Sales:</span>
              <span className="font-semibold">{formatINR(pnl.grossSales)}</span>
            </div>
            {pnl.discounts > 0 && (
              <div className="flex justify-between text-brand-rose-600 text-xs">
                <span>Less: Customer Discounts:</span>
                <span className="font-semibold">- {formatINR(pnl.discounts)}</span>
              </div>
            )}
            {pnl.refunds > 0 && (
              <div className="flex justify-between text-brand-rose-600 text-xs">
                <span>Less: Sales Returns & Refunds:</span>
                <span className="font-semibold">- {formatINR(pnl.refunds)}</span>
              </div>
            )}
            <div className="flex justify-between text-brand-plum-950 font-bold pt-1 border-t border-brand-plum-100">
              <span>Net Sales:</span>
              <span className="font-['Outfit'] text-base font-extrabold">{formatINR(pnl.netSales)}</span>
            </div>
          </div>

          {/* COGS & Gross Profit */}
          <div className="py-4 space-y-2">
            <h4 className="text-xs font-bold text-brand-plum-800 uppercase tracking-wider">
              2. Cost of Goods Sold (COGS)
            </h4>
            <div className="flex justify-between text-brand-plum-700 text-xs">
              <span>Direct Material & Labor Costs in Units Sold:</span>
              <span className="font-semibold">- {formatINR(pnl.cogs)}</span>
            </div>
            <div className="flex justify-between text-brand-sage-700 font-bold pt-1 border-t border-brand-plum-100">
              <span>Gross Profit:</span>
              <div className="text-right">
                <span className="font-['Outfit'] text-base font-extrabold block">{formatINR(pnl.grossProfit)}</span>
                <span className="text-[11px] font-normal text-brand-sage-600">
                  {pnl.grossMarginPct}% gross margin
                </span>
              </div>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="py-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-brand-plum-800 uppercase tracking-wider">
                3. Operating Expenses (OpEx)
              </h4>
              <span className="text-[11px] text-brand-plum-500 italic">Inventory purchases excluded</span>
            </div>

            {Object.keys(pnl.expensesByCategory || {}).length === 0 ? (
              <p className="text-xs text-brand-plum-500 italic">No classified operating expenses for this period.</p>
            ) : (
              Object.entries(pnl.expensesByCategory).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between text-brand-plum-700 text-xs pl-2">
                  <span>{cat}:</span>
                  <span className="font-semibold">{formatINR(amt)}</span>
                </div>
              ))
            )}

            <div className="flex justify-between text-brand-plum-950 font-bold pt-1 border-t border-brand-plum-100 text-xs">
              <span>Total Operating Expenses:</span>
              <span className="font-semibold">- {formatINR(pnl.operatingExpenses)}</span>
            </div>
          </div>

          {/* Net Operating Profit */}
          <div className="pt-4 flex justify-between items-baseline bg-brand-cream-50/50 p-4 rounded-xl border border-brand-plum-100">
            <div>
              <span className="text-base font-extrabold text-brand-plum-950 font-['Outfit'] block">
                Net Operating Profit
              </span>
              <span className="text-xs text-brand-plum-600">
                Studio bottom-line earnings after all costs
              </span>
            </div>

            <div className="text-right">
              <span className={`text-2xl font-extrabold font-['Outfit'] block ${pnl.netOperatingProfit >= 0 ? 'text-brand-sage-600' : 'text-brand-rose-600'}`}>
                {formatINR(pnl.netOperatingProfit)}
              </span>
              <span className="text-xs font-semibold text-brand-plum-500">
                {pnl.netProfitMarginPct}% net margin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Supplementary Statements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Working Capital & Cash Reconciliation */}
        <div className="bg-white rounded-2xl border border-brand-plum-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-plum-100">
            <CheckCircle2 className="w-4 h-4 text-brand-sage-600" />
            <h4 className="text-xs font-bold text-brand-plum-950 uppercase tracking-wider">
              Cash vs. Accrual Reconciliation
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-brand-plum-700">
              <span>Actual Cash Collected:</span>
              <span className="font-bold text-brand-sage-700">{formatINR(pnl.cashReceived)}</span>
            </div>
            <div className="flex justify-between text-brand-plum-700">
              <span>Outstanding Invoiced Receivables:</span>
              <span className="font-bold text-brand-rose-600">{formatINR(pnl.receivables)}</span>
            </div>
            <div className="flex justify-between text-brand-plum-700">
              <span>Total Invoiced Revenue:</span>
              <span className="font-bold text-brand-plum-950">{formatINR(pnl.netSales)}</span>
            </div>
          </div>
        </div>

        {/* Current Asset Inventory Valuation */}
        <div className="bg-white rounded-2xl border border-brand-plum-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-plum-100">
            <BarChart3 className="w-4 h-4 text-brand-rose-500" />
            <h4 className="text-xs font-bold text-brand-plum-950 uppercase tracking-wider">
              Current Inventory Balance Sheet
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-brand-plum-700">
              <span>Raw Materials (Yarns, Fibers, Eyes):</span>
              <span className="font-bold">{formatINR(inventoryValuation.rawMaterialsValuation)}</span>
            </div>
            <div className="flex justify-between text-brand-plum-700">
              <span>Finished Crochet Stock on Hand:</span>
              <span className="font-bold">{formatINR(inventoryValuation.finishedProductsValuation)}</span>
            </div>
            <div className="pt-2 border-t border-brand-plum-100 flex justify-between font-bold text-sm text-brand-plum-950">
              <span>Total Current Inventory Value:</span>
              <span className="font-['Outfit'] font-extrabold">{formatINR(inventoryValuation.totalInventoryValuation)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
