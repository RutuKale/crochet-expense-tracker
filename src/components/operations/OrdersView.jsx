import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { databaseService } from '../../services/databaseService.js';
import { formatINR, formatDate } from '../../domain/formatters.js';
import { Plus, Clock, CheckCircle2, AlertTriangle, ArrowRight, ShoppingCart } from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

export default function OrdersView({ onOpenCreateOrder, onOpenCreateSale }) {
  const { orders, showToast } = useBusiness();
  const [filter, setFilter] = useState('all');

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const statuses = [
    { id: 'all', label: 'All Orders' },
    { id: 'inquiry', label: 'Inquiries' },
    { id: 'in_progress', label: 'Crocheting' },
    { id: 'ready', label: 'Ready for Dispatch' },
    { id: 'delivered', label: 'Delivered' },
  ];

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await databaseService.updateOrderStatus(orderId, newStatus);
      showToast('success', `Order status updated to ${newStatus.replace('_', ' ')}.`);
    } catch (err) {
      showToast('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Commissions & Orders"
        subtitle="Manage tailored client requests from initial inquiry and yarn selection through to finished delivery."
        action={
          <button
            onClick={onOpenCreateOrder}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Custom Order</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statuses.map(st => (
          <button
            key={st.id}
            onClick={() => setFilter(st.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${filter === st.id ? 'bg-brand-plum-900 text-white shadow-xs' : 'bg-white text-brand-plum-700 border border-brand-plum-200 hover:bg-brand-cream-50'}`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Order Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-brand-plum-200 text-brand-plum-500 text-sm">
          No custom orders found in this category. Click "New Custom Order" to begin logging client commissions.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map(order => {
            const balanceDue = (Number(order.agreedPrice) || 0) - (Number(order.advancePaid) || 0);

            return (
              <div 
                key={order.id}
                className="bg-white rounded-2xl border border-brand-plum-100 p-5 shadow-sm space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-brand-plum-400">{order.orderNumber}</span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <h3 className="text-base font-bold text-brand-plum-950 font-['Outfit'] mt-1">
                      {order.title}
                    </h3>
                    <p className="text-xs text-brand-plum-600 mt-0.5">
                      Client: <strong>{order.customerName}</strong>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-brand-plum-950 font-['Outfit'] block">
                      {formatINR(order.agreedPrice)}
                    </span>
                    <span className="text-[11px] text-brand-sage-700 font-medium block">
                      Advance: {formatINR(order.advancePaid)}
                    </span>
                    {balanceDue > 0 && (
                      <span className="text-[11px] text-brand-rose-600 font-bold block">
                        Bal: {formatINR(balanceDue)}
                      </span>
                    )}
                  </div>
                </div>

                {order.description && (
                  <p className="text-xs text-brand-plum-700 bg-brand-cream-50/70 p-3 rounded-xl border border-brand-plum-100/60 leading-relaxed">
                    {order.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-brand-plum-500 pt-1 border-t border-brand-plum-100">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-brand-plum-400" />
                    <span>Due: <strong>{order.dueDate || 'Flexible'}</strong></span>
                  </div>

                  {/* Status Progression Menu */}
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="px-2.5 py-1 text-xs bg-brand-cream-100 rounded-lg border border-brand-plum-200 font-bold text-brand-plum-900 cursor-pointer"
                    >
                      <option value="inquiry">Inquiry</option>
                      <option value="awaiting_materials">Awaiting Yarn</option>
                      <option value="in_progress">In Progress</option>
                      <option value="ready">Ready for Dispatch</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    {order.status === 'ready' && (
                      <button
                        onClick={onOpenCreateSale}
                        className="p-1.5 bg-brand-rose-600 text-white rounded-lg hover:bg-brand-rose-700 transition"
                        title="Bill final invoice"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
