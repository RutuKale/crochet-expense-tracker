import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatINR, formatDate } from '../../domain/formatters.js';
import { generateInvoicePDF } from '../../services/pdfService.js';
import { X, Download, Printer, CreditCard, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import FormField from '../common/FormField.jsx';

export default function InvoiceDetailModal({ isOpen, onClose, sale }) {
  const { recordPayment } = useBusiness();
  const { businessProfile } = useAuth();

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (!isOpen || !sale) return null;

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    if (amt <= 0 || amt > sale.balanceAmount) return;

    setIsSubmitting(true);
    try {
      await recordPayment({
        saleId: sale.id,
        amount: amt,
        paymentMethod,
        notes: paymentNotes,
      });
      setShowPaymentForm(false);
      setPaymentAmount('');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-plum-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-brand-plum-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-plum-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-['Outfit']">{sale.invoiceNumber}</span>
              <StatusBadge status={sale.status} size="sm" />
            </div>
            <p className="text-xs text-brand-plum-200 mt-0.5">Dated: {formatDate(sale.date, true)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-brand-plum-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer & Billing Info */}
          <div className="flex justify-between items-start text-xs border-b border-brand-plum-100 pb-4">
            <div>
              <span className="text-brand-plum-500 font-semibold block uppercase tracking-wider text-[10px]">Customer</span>
              <span className="text-sm font-bold text-brand-plum-950 block mt-0.5">{sale.customerName}</span>
              {sale.customerPhone && <span className="text-brand-plum-600 block">{sale.customerPhone}</span>}
            </div>
            <div className="text-right">
              <span className="text-brand-plum-500 font-semibold block uppercase tracking-wider text-[10px]">Payment Method</span>
              <span className="text-sm font-semibold text-brand-plum-950 block mt-0.5">{sale.paymentMethod || 'UPI'}</span>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="text-xs font-bold text-brand-plum-800 uppercase tracking-wider mb-2">Line Items</h4>
            <div className="border border-brand-plum-100 rounded-xl overflow-hidden divide-y divide-brand-plum-100 text-xs">
              {sale.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-brand-cream-50/50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-brand-plum-950 block">{item.productName}</span>
                    <span className="text-brand-plum-600">
                      {item.quantity} × {formatINR(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-extrabold text-brand-plum-950">
                    {formatINR(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-brand-cream-100 p-4 rounded-xl border border-brand-plum-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-brand-plum-700">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatINR(sale.subtotal)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-brand-rose-600">
                <span>Discount:</span>
                <span className="font-semibold">- {formatINR(sale.discountAmount)}</span>
              </div>
            )}
            {sale.shippingCharged > 0 && (
              <div className="flex justify-between text-brand-plum-700">
                <span>Shipping:</span>
                <span className="font-semibold">{formatINR(sale.shippingCharged)}</span>
              </div>
            )}
            <div className="flex justify-between text-brand-plum-950 font-bold text-sm pt-2 border-t border-brand-plum-200">
              <span>Total Bill:</span>
              <span className="font-['Outfit'] text-base font-extrabold">{formatINR(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-brand-sage-700 font-semibold pt-1">
              <span>Amount Paid:</span>
              <span>{formatINR(sale.paidAmount)}</span>
            </div>
            {sale.balanceAmount > 0 && (
              <div className="flex justify-between text-brand-rose-600 font-bold text-sm pt-1">
                <span>Balance Due:</span>
                <span className="font-['Outfit']">{formatINR(sale.balanceAmount)}</span>
              </div>
            )}
          </div>

          {/* Record Additional Payment Box */}
          {sale.balanceAmount > 0 && (
            <div>
              {!showPaymentForm ? (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="w-full py-2 px-3 text-xs font-bold text-brand-plum-900 bg-brand-lavender-100 hover:bg-brand-lavender-200 border border-brand-lavender-300 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <CreditCard className="w-4 h-4 text-brand-plum-700" />
                  <span>Record Payment Against Balance ({formatINR(sale.balanceAmount)})</span>
                </button>
              ) : (
                <form onSubmit={handleRecordPayment} className="p-3 bg-brand-lavender-50 rounded-xl border border-brand-lavender-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-plum-950">Record Received Payment</span>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="text-xs text-brand-plum-600 underline"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Amount (₹)">
                      <input
                        type="number"
                        min="1"
                        max={sale.balanceAmount}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder={`Max ${sale.balanceAmount}`}
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-brand-plum-200 font-bold"
                        required
                      />
                    </FormField>

                    <FormField label="Method">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-brand-plum-200 font-medium"
                      >
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="NetBanking">Net Banking</option>
                      </select>
                    </FormField>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-brand-plum-900 text-white rounded-lg text-xs font-bold hover:bg-brand-plum-950 transition"
                  >
                    {isSubmitting ? 'Recording...' : `Confirm Payment`}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-brand-plum-100 flex items-center justify-between">
            <button
              onClick={() => generateInvoicePDF(sale, businessProfile)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 rounded-xl transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-brand-plum-700 hover:bg-brand-cream-200 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
