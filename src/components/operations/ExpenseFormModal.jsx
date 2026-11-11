import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { X, Receipt, AlertCircle } from 'lucide-react';
import FormField from '../common/FormField.jsx';

export default function ExpenseFormModal({ isOpen, onClose }) {
  const { addExpense } = useBusiness();

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Packaging & Shipping');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amt = Number(amount);
    if (!description.trim()) {
      setError('Expense description is required.');
      return;
    }
    if (amt <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        description,
        category,
        amount: amt,
        vendor,
        paymentMethod,
        date,
        isInventoryPurchase: false, // Strictly operating expenses!
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
      <div className="bg-white rounded-2xl max-w-lg w-full border border-brand-plum-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-brand-plum-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-plum-800 rounded-xl text-brand-rose-300">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Outfit']">Record Operating Expense</h3>
              <p className="text-xs text-brand-plum-200">Track studio, marketing, utilities, and packaging costs</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormField label="Expense Description" required>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Courier polymailers 100 pcs, Studio lighting bulb"
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 focus:ring-2 focus:ring-brand-plum-500/20"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Category" required>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-medium"
              >
                <option value="Packaging & Shipping">Packaging & Shipping</option>
                <option value="Studio & Tools">Studio & Tools</option>
                <option value="Marketing & Events">Marketing & Events</option>
                <option value="Software & Subscriptions">Software & Subscriptions</option>
                <option value="Rent & Utilities">Rent & Utilities</option>
                <option value="General & Miscellaneous">General & Miscellaneous</option>
              </select>
            </FormField>

            <FormField label="Amount (₹)" required>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 450"
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-bold"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Vendor / Payee">
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Amazon, Local Stationer"
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950"
              />
            </FormField>

            <FormField label="Payment Method">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-medium"
              >
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
                <option value="NetBanking">Net Banking</option>
              </select>
            </FormField>
          </div>

          <FormField label="Expense Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950"
            />
          </FormField>

          <p className="text-[11px] text-brand-plum-500 bg-brand-cream-50 p-2.5 rounded-lg border border-brand-plum-100">
            💡 <strong>Accounting Guardrail</strong>: If you are purchasing raw materials (yarn, stuffing, safety eyes), please use <em>"Record Material Purchase"</em> instead. Raw materials are inventory assets recognized via COGS, not direct operating expenses.
          </p>

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
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-brand-plum-900 to-brand-plum-800 hover:from-brand-plum-950 hover:to-brand-plum-900 rounded-xl transition shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Operating Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
