import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { formatINR } from '../../domain/formatters.js';
import { X, Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import FormField from '../common/FormField.jsx';

export default function CreateSaleModal({ isOpen, onClose }) {
  const { products, customers, createSale } = useBusiness();

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingCharged, setShippingCharged] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initial line item
  const [items, setItems] = useState([
    { productId: products[0]?.id || '', quantity: 1, unitPrice: products[0]?.sellingPrice || 0 }
  ]);

  if (!isOpen) return null;

  const handleCustomerSelect = (e) => {
    const cId = e.target.value;
    setCustomerId(cId);
    if (cId) {
      const c = customers.find(cust => cust.id === cId);
      if (c) {
        setCustomerName(c.name);
        setCustomerPhone(c.phone || '');
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  const handleProductChange = (index, prodId) => {
    const prod = products.find(p => p.id === prodId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: prodId,
      unitPrice: prod ? prod.sellingPrice : 0,
    };
    setItems(updated);
  };

  const handleQuantityChange = (index, qty) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, Number(qty) || 1);
    setItems(updated);
  };

  const handlePriceChange = (index, price) => {
    const updated = [...items];
    updated[index].unitPrice = Math.max(0, Number(price) || 0);
    setItems(updated);
  };

  const addLineItem = () => {
    const defaultProd = products[0];
    setItems(prev => [
      ...prev,
      { productId: defaultProd?.id || '', quantity: 1, unitPrice: defaultProd?.sellingPrice || 0 }
    ]);
  };

  const removeLineItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Live totals calculation
  const subtotal = items.reduce((acc, item) => {
    return acc + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
  }, 0);

  const discount = Math.max(0, Number(discountAmount) || 0);
  const shipping = Math.max(0, Number(shippingCharged) || 0);
  const totalAmount = Math.max(0, subtotal - discount + shipping);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    // Check stock availability
    for (const item of items) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        setError('Selected product is invalid.');
        return;
      }
      if ((Number(prod.stockQuantity) || 0) < Number(item.quantity)) {
        setError(`Insufficient finished stock for "${prod.name}". Available: ${prod.stockQuantity}, Requested: ${item.quantity}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createSale({
        customerId: customerId || null,
        customerName: customerName || 'Walk-in Customer',
        customerPhone,
        items,
        discountAmount: discount,
        shippingCharged: shipping,
        paidAmount: Math.min(totalAmount, Number(paidAmount) || 0),
        paymentMethod,
        notes,
        idempotencyKey: `sale_ui_${Date.now()}`,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-plum-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-brand-plum-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-brand-plum-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-plum-800 rounded-xl text-brand-rose-300">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Outfit']">Create New Sale / Bill</h3>
              <p className="text-xs text-brand-plum-200">Finalize sale, deduct stock, and generate invoice</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-brand-plum-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Existing Customer (Optional)">
              <select
                value={customerId}
                onChange={handleCustomerSelect}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 focus:ring-2 focus:ring-brand-plum-500/20 focus:border-brand-plum-600"
              >
                <option value="">Walk-in Customer (None)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone || c.city || 'No phone'})</option>
                ))}
              </select>
            </FormField>

            <FormField label="Customer Name">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 focus:ring-2 focus:ring-brand-plum-500/20 focus:border-brand-plum-600"
              />
            </FormField>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-plum-800">
                Products to Bill
              </label>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-rose-600 hover:text-brand-rose-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="border border-brand-plum-100 rounded-xl overflow-hidden divide-y divide-brand-plum-100">
              {items.map((item, index) => {
                const prod = products.find(p => p.id === item.productId);
                const availableStock = prod ? Number(prod.stockQuantity) : 0;
                const isOutOfStock = availableStock < item.quantity;

                return (
                  <div key={index} className="p-3 bg-brand-cream-50/50 flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full sm:w-auto">
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-brand-plum-200 font-medium text-brand-plum-950"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stockQuantity} pcs - {formatINR(p.sellingPrice)})
                          </option>
                        ))}
                      </select>
                      {isOutOfStock && (
                        <p className="text-[11px] text-brand-rose-600 font-medium mt-1">
                          Only {availableStock} in stock!
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          max={availableStock || 999}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs text-center bg-white rounded-lg border border-brand-plum-200 font-bold"
                          title="Quantity"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs text-right bg-white rounded-lg border border-brand-plum-200 font-bold"
                          title="Unit Price"
                        />
                      </div>

                      <div className="w-24 text-right text-xs font-bold text-brand-plum-950">
                        {formatINR((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-brand-plum-400 hover:text-brand-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Adjustments: Discount & Shipping */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-brand-cream-100 p-3.5 rounded-xl border border-brand-plum-100">
            <div>
              <span className="text-[11px] font-semibold text-brand-plum-600 block mb-1">Subtotal</span>
              <span className="text-sm font-bold text-brand-plum-950">{formatINR(subtotal)}</span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-brand-plum-600 block mb-1">Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs bg-white rounded-lg border border-brand-plum-200 font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-brand-plum-600 block mb-1">Shipping (₹)</label>
              <input
                type="number"
                min="0"
                value={shippingCharged}
                onChange={(e) => setShippingCharged(Number(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs bg-white rounded-lg border border-brand-plum-200 font-semibold"
              />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-brand-plum-600 block mb-1">Total Bill</span>
              <span className="text-base font-extrabold text-brand-plum-950 font-['Outfit']">{formatINR(totalAmount)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Amount Paid Now (₹)" required>
              <input
                type="number"
                min="0"
                max={totalAmount}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                placeholder="Enter paid amount"
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-bold focus:ring-2 focus:ring-brand-plum-500/20"
              />
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPaidAmount(totalAmount)}
                  className="text-[11px] text-brand-rose-600 font-semibold underline"
                >
                  Pay Full ({formatINR(totalAmount)})
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmount(0)}
                  className="text-[11px] text-brand-plum-500 font-semibold underline"
                >
                  Unpaid (Credit)
                </button>
              </div>
            </FormField>

            <FormField label="Payment Method">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-medium"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="NetBanking">Net Banking</option>
              </select>
            </FormField>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-brand-plum-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-brand-plum-700 hover:bg-brand-cream-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 rounded-xl transition shadow-md shadow-brand-rose-900/10 disabled:opacity-50"
            >
              {isSubmitting ? 'Finalizing...' : `Finalize & Bill ${formatINR(totalAmount)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
