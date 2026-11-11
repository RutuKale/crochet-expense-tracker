import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { X, Clock, AlertCircle } from 'lucide-react';
import FormField from '../common/FormField.jsx';

export default function OrderFormModal({ isOpen, onClose }) {
  const { customers, createOrder } = useBusiness();

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [customerName, setCustomerName] = useState(customers[0]?.name || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [status, setStatus] = useState('inquiry');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCustomerChange = (e) => {
    const id = e.target.value;
    setCustomerId(id);
    const c = customers.find(cust => cust.id === id);
    if (c) setCustomerName(c.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Order title is required.');
      return;
    }

    const price = Number(agreedPrice);
    if (price <= 0) {
      setError('Please enter a valid agreed price.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder({
        customerId,
        customerName: customerName || 'Custom Client',
        title,
        description,
        agreedPrice: price,
        advancePaid: Number(advancePaid) || 0,
        dueDate,
        status,
        notes,
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
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Outfit']">New Custom Order</h3>
              <p className="text-xs text-brand-plum-200">Track client inquiries, deposits, and delivery dates</p>
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
          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Customer" required>
              <select
                value={customerId}
                onChange={handleCustomerChange}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-medium"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Target Delivery Date" required>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-medium"
                required
              />
            </FormField>
          </div>

          <FormField label="Order Title / Brief" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Custom Pastel Sunflower Baby Mobile Crib Hanger"
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 focus:ring-2 focus:ring-brand-plum-500/20"
              required
            />
          </FormField>

          <FormField label="Specifications & Notes">
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Color palette, custom sizing, hoop dimensions, gift wrap notes..."
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 resize-none"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3.5 bg-brand-cream-100 p-3.5 rounded-xl border border-brand-plum-100">
            <FormField label="Agreed Price (₹)" required>
              <input
                type="number"
                min="0"
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3 py-1.5 text-sm bg-white rounded-lg border border-brand-plum-200 font-bold"
                required
              />
            </FormField>

            <FormField label="Advance Paid (₹)">
              <input
                type="number"
                min="0"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3 py-1.5 text-sm bg-white rounded-lg border border-brand-plum-200 font-bold"
              />
            </FormField>
          </div>

          <FormField label="Initial Stage Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-medium"
            >
              <option value="inquiry">Inquiry / Consultation</option>
              <option value="awaiting_materials">Awaiting Materials / Yarn</option>
              <option value="in_progress">In Progress (Crocheting)</option>
              <option value="ready">Ready for Dispatch</option>
            </select>
          </FormField>

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
              {isSubmitting ? 'Creating...' : 'Create Custom Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
