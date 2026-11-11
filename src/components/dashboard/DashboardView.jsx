import React from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { formatINR, formatDate } from '../../domain/formatters.js';
import { 
  TrendingUp, 
  ShoppingBag, 
  Layers, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  Package, 
  CreditCard,
  FileText,
  Plus
} from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';
import KpiCard from '../common/KpiCard.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

export default function DashboardView({ 
  onNavigate, 
  onOpenCreateSale, 
  onOpenRecordPurchase,
  onSelectSale 
}) {
  const { 
    pnl, 
    inventoryValuation, 
    sales, 
    lowStockMaterials, 
    lowStockProducts, 
    pendingOrders,
    dateFilter 
  } = useBusiness();

  const filterNames = {
    all: 'All Time',
    today: 'Today',
    '7days': 'Last 7 Days',
    month: 'This Month',
    year: 'This Year',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crochet Studio Overview"
        subtitle={`Real-time studio KPIs, inventory valuations, active orders, and sales performance (${filterNames[dateFilter] || 'Active Period'}).`}
        action={
          <button
            onClick={onOpenCreateSale}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-rose-900/10 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sale / Bill</span>
          </button>
        }
      />

      {/* KPI Cards Row 1: Core Financials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Net Sales"
          value={formatINR(pnl.netSales)}
          subvalue={`${pnl.orderCount} sales`}
          icon={TrendingUp}
          variant="plum"
        />

        <KpiCard
          label="Gross Profit"
          value={formatINR(pnl.grossProfit)}
          subvalue={`${pnl.grossMarginPct}% gross margin`}
          icon={ShoppingBag}
          variant="sage"
        />

        <KpiCard
          label="Net Operating Profit"
          value={formatINR(pnl.netOperatingProfit)}
          subvalue={`${pnl.netProfitMarginPct}% net margin`}
          icon={TrendingUp}
          variant={pnl.netOperatingProfit >= 0 ? 'sage' : 'rose'}
        />

        <KpiCard
          label="Cash Received"
          value={formatINR(pnl.cashReceived)}
          subvalue={pnl.receivables > 0 ? `₹${pnl.receivables} pending` : 'All cleared'}
          icon={CreditCard}
          variant="lavender"
        />
      </div>

      {/* KPI Cards Row 2: Operational Health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-brand-plum-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-brand-plum-600 uppercase tracking-wider">
              Total Inventory Valuation
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-brand-plum-950 font-['Outfit']">
                {formatINR(inventoryValuation.totalInventoryValuation)}
              </span>
            </div>
            <div className="text-[11px] text-brand-plum-500 mt-1">
              Raw Yarn: {formatINR(inventoryValuation.rawMaterialsValuation)} • Finished: {formatINR(inventoryValuation.finishedProductsValuation)}
            </div>
          </div>
          <button
            onClick={() => onNavigate('materials')}
            className="p-2.5 rounded-xl bg-brand-cream-100 text-brand-plum-800 hover:bg-brand-cream-200 transition"
            title="Inspect Inventory"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-plum-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-brand-plum-600 uppercase tracking-wider">
              Active Custom Orders
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-brand-plum-950 font-['Outfit']">
                {pendingOrders.length} In Progress
              </span>
            </div>
            <div className="text-[11px] text-brand-plum-500 mt-1">
              Customer inquiries & commissions
            </div>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="p-2.5 rounded-xl bg-brand-cream-100 text-brand-plum-800 hover:bg-brand-cream-200 transition"
            title="Inspect Orders"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-plum-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-brand-plum-600 uppercase tracking-wider">
              Cost of Goods Sold (COGS)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-brand-plum-950 font-['Outfit']">
                {formatINR(pnl.cogs)}
              </span>
            </div>
            <div className="text-[11px] text-brand-plum-500 mt-1">
              Direct materials + labor in sold goods
            </div>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="p-2.5 rounded-xl bg-brand-cream-100 text-brand-plum-800 hover:bg-brand-cream-200 transition"
            title="View P&L Report"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Sales Invoices */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-brand-plum-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-brand-plum-950 font-['Outfit']">
                Recent Sales & Invoices
              </h3>
              <p className="text-xs text-brand-plum-600/80">Latest finalized customer transactions</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-bold text-brand-rose-600 hover:text-brand-rose-700 inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-plum-500 border border-dashed rounded-xl">
              No sales recorded for this period. Click "Create Sale" to issue an invoice.
            </div>
          ) : (
            <div className="divide-y divide-brand-plum-100">
              {sales.slice(0, 5).map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => onSelectSale(sale)}
                  className="py-3 flex items-center justify-between hover:bg-brand-cream-50/60 px-2 rounded-xl cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-plum-50 text-brand-plum-800 flex items-center justify-center font-bold text-xs">
                      🧾
                    </div>
                    <div>
                      <span className="text-xs font-bold text-brand-plum-950 block">{sale.invoiceNumber}</span>
                      <span className="text-[11px] text-brand-plum-500">
                        {sale.customerName} • {sale.items.length} items • {formatDate(sale.date)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-brand-plum-950 block font-['Outfit']">
                      {formatINR(sale.totalAmount)}
                    </span>
                    <StatusBadge status={sale.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Alerts & Quick Action Shortcuts */}
        <div className="space-y-5">
          {/* Low Stock Warning Card */}
          <div className="bg-white rounded-2xl border border-brand-plum-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Low Stock Alerts ({lowStockMaterials.length + lowStockProducts.length})
              </h3>
            </div>

            {lowStockMaterials.length === 0 && lowStockProducts.length === 0 ? (
              <p className="text-xs text-brand-sage-700 bg-brand-sage-50 p-3 rounded-xl border border-brand-sage-200">
                ✓ All yarn skeins and finished crochet pieces are above reorder thresholds!
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {lowStockMaterials.slice(0, 3).map((mat) => (
                  <div key={mat.id} className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-brand-plum-950 block">{mat.name}</span>
                      <span className="text-rose-600 text-[11px]">
                        Only {mat.stockQuantity} {mat.unit} left (Min: {mat.reorderThreshold})
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenRecordPurchase(mat.id)}
                      className="px-2 py-1 text-[10px] font-bold bg-white text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50"
                    >
                      Restock
                    </button>
                  </div>
                ))}

                {lowStockProducts.slice(0, 2).map((prod) => (
                  <div key={prod.id} className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-brand-plum-950 block">{prod.name}</span>
                      <span className="text-amber-700 text-[11px]">
                        Finished Stock: {prod.stockQuantity} pcs
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate('products')}
                      className="px-2 py-1 text-[10px] font-bold bg-white text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-50"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Studio Actions */}
          <div className="bg-brand-plum-900 text-white rounded-2xl p-5 space-y-3 shadow-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-rose-300">
              Studio Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('products')}
                className="p-3 bg-brand-plum-800 hover:bg-brand-plum-700/80 rounded-xl text-left transition border border-brand-plum-700/60"
              >
                <Sparkles className="w-4 h-4 text-brand-rose-400 mb-1" />
                <span className="text-xs font-bold block">Finished Goods</span>
                <span className="text-[10px] text-brand-plum-300 block">Catalog items</span>
              </button>

              <button
                onClick={onOpenRecordPurchase}
                className="p-3 bg-brand-plum-800 hover:bg-brand-plum-700/80 rounded-xl text-left transition border border-brand-plum-700/60"
              >
                <Package className="w-4 h-4 text-brand-rose-400 mb-1" />
                <span className="text-xs font-bold block">Buy Supplies</span>
                <span className="text-[10px] text-brand-plum-300 block">Restock yarn</span>
              </button>

              <button
                onClick={() => onNavigate('pricing')}
                className="p-3 bg-brand-plum-800 hover:bg-brand-plum-700/80 rounded-xl text-left transition border border-brand-plum-700/60"
              >
                <TrendingUp className="w-4 h-4 text-brand-rose-400 mb-1" />
                <span className="text-xs font-bold block">Calculate Price</span>
                <span className="text-[10px] text-brand-plum-300 block">Costing formula</span>
              </button>

              <button
                onClick={() => onNavigate('orders')}
                className="p-3 bg-brand-plum-800 hover:bg-brand-plum-700/80 rounded-xl text-left transition border border-brand-plum-700/60"
              >
                <Clock className="w-4 h-4 text-brand-rose-400 mb-1" />
                <span className="text-xs font-bold block">Custom Orders</span>
                <span className="text-[10px] text-brand-plum-300 block">Commission status</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
