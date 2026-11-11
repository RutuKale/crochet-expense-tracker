import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { formatINR } from '../../domain/formatters.js';
import { X, PackagePlus, AlertCircle } from 'lucide-react';
import FormField from '../common/FormField.jsx';
import { getStoredSuppliers } from './MaterialFormModal.jsx';

export default function MaterialPurchaseModal({ isOpen, onClose, preselectedMaterialId = null }) {
  const { rawMaterials, recordPurchase } = useBusiness();

  const [materialId, setMaterialId] = useState(preselectedMaterialId || rawMaterials[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [totalCostInput, setTotalCostInput] = useState('');
  const [lastCalculatedFrom, setLastCalculatedFrom] = useState('unitCost');

  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Keep materialId, unitCost, and supplier synced when opening modal or preselectedMaterialId changes
  useEffect(() => {
    if (isOpen) {
      const targetId = preselectedMaterialId || rawMaterials[0]?.id || '';
      setMaterialId(targetId);

      const targetMat = rawMaterials.find(m => m.id === targetId) || (preselectedMaterialId ? rawMaterials.find(m => m.id === preselectedMaterialId) : rawMaterials[0]);
      if (targetMat) {
        setUnitCost(targetMat.averageUnitCost !== undefined && targetMat.averageUnitCost !== null ? String(targetMat.averageUnitCost) : '');
        setSupplier(targetMat.supplier || '');
      } else {
        setUnitCost('');
        setSupplier('');
      }
      setQuantity('');
      setTotalCostInput('');
      setLastCalculatedFrom('unitCost');
      setNotes('');
      setError('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, preselectedMaterialId, rawMaterials]);

  // Handle Quantity Change with Automatic Recalculation
  const handleQuantityChange = (val) => {
    setQuantity(val);
    const qty = Number(val);
    if (qty > 0) {
      if (lastCalculatedFrom === 'totalCost' && totalCostInput !== '') {
        const tot = Number(totalCostInput);
        if (!isNaN(tot) && tot >= 0) {
          setUnitCost(String(Math.round((tot / qty) * 100) / 100));
        }
      } else if (unitCost !== '') {
        const u = Number(unitCost);
        if (!isNaN(u) && u >= 0) {
          setTotalCostInput(String(Math.round(qty * u * 100) / 100));
        }
      }
    }
  };

  // Handle Total Price Change -> Automatically Calculate Unit Price
  const handleTotalCostChange = (val) => {
    setTotalCostInput(val);
    setLastCalculatedFrom('totalCost');
    const tot = Number(val);
    const qty = Number(quantity);
    if (val !== '' && !isNaN(tot) && qty > 0) {
      const u = Math.round((tot / qty) * 100) / 100;
      setUnitCost(String(u));
    } else if (val === '') {
      setUnitCost('');
    }
  };

  // Handle Unit Price Change -> Automatically Calculate Total Price
  const handleUnitCostChange = (val) => {
    setUnitCost(val);
    setLastCalculatedFrom('unitCost');
    const u = Number(val);
    const qty = Number(quantity);
    if (val !== '' && !isNaN(u) && qty > 0) {
      const tot = Math.round(qty * u * 100) / 100;
      setTotalCostInput(String(tot));
    } else if (val === '') {
      setTotalCostInput('');
    }
  };

  const handleMaterialChange = (newId) => {
    setMaterialId(newId);
    const targetMat = rawMaterials.find(m => m.id === newId);
    if (targetMat) {
      if (targetMat.averageUnitCost !== undefined && targetMat.averageUnitCost !== null) {
        setUnitCost(String(targetMat.averageUnitCost));
        const qty = Number(quantity);
        if (qty > 0) {
          setTotalCostInput(String(Math.round(qty * Number(targetMat.averageUnitCost) * 100) / 100));
        }
      }
      setSupplier(targetMat.supplier || '');
    }
  };

  const selectedMaterial = rawMaterials.find(m => m.id === materialId) || rawMaterials[0];
  const qtyNum = Number(quantity) || 0;
  const unitCostNum = Number(unitCost) || 0;
  const totalCalculated = Math.round(qtyNum * unitCostNum * 100) / 100;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = Number(quantity);
    const cost = Number(unitCost);
    const tot = totalCostInput !== '' && !isNaN(Number(totalCostInput))
      ? Number(totalCostInput)
      : Math.round(qty * cost * 100) / 100;

    if (!selectedMaterial) {
      setError('Please select a material.');
      return;
    }

    if (qty <= 0 || tot < 0 || isNaN(tot)) {
      setError('Please enter a valid positive quantity and price.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPurchase({
        materialId: selectedMaterial.id,
        quantity: qty,
        unitCost: qty > 0 ? (tot / qty) : cost,
        totalCost: tot,
        supplier: supplier || selectedMaterial.supplier || '',
        purchaseDate,
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
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Outfit']">Record Material Purchase</h3>
              <p className="text-xs text-brand-plum-200">Receive stock and update weighted average unit cost</p>
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
          <FormField label="Raw Material" required>
            <select
              value={selectedMaterial?.id || ''}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-medium"
            >
              {rawMaterials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.unit} • Current stock: {m.stockQuantity})
                </option>
              ))}
            </select>
          </FormField>

          {/* Quantity, Total Price & Auto-calculated Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <FormField label={`Quantity (${selectedMaterial?.unit || 'units'})`} required>
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="e.g. 10"
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-bold focus:ring-2 focus:ring-brand-plum-500/20"
                required
              />
            </FormField>

            <FormField label="Total Price (₹)" hint="Enter total bill amount" required>
              <input
                type="number"
                min="0"
                step="any"
                value={totalCostInput}
                onChange={(e) => handleTotalCostChange(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-bold focus:ring-2 focus:ring-brand-plum-500/20"
              />
            </FormField>

            <FormField label="Unit Price (₹)" hint="Auto-calculated" required>
              <input
                type="number"
                min="0"
                step="any"
                value={unitCost}
                onChange={(e) => handleUnitCostChange(e.target.value)}
                placeholder={selectedMaterial ? `Current: ₹${selectedMaterial.averageUnitCost}` : 'e.g. 150'}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-bold focus:ring-2 focus:ring-brand-plum-500/20"
                required
              />
            </FormField>
          </div>

          <div className="p-3 bg-brand-cream-100 rounded-xl border border-brand-plum-100 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-brand-plum-700 block">Purchase Cost Summary:</span>
              <span className="text-[11px] text-brand-plum-500">
                {qtyNum > 0 && unitCostNum > 0
                  ? `${qtyNum} ${selectedMaterial?.unit || 'units'} @ ₹${unitCostNum}/unit`
                  : 'Enter quantity and total price or unit price'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-brand-plum-500 block tracking-wider">Total Cost</span>
              <span className="text-base font-extrabold text-brand-plum-950 font-['Outfit']">
                {formatINR(totalCalculated)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Supplier / Vendor">
              <input
                type="text"
                list="purchase-suppliers-list"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder={selectedMaterial?.supplier || 'Select or enter supplier'}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-medium"
              />
              <datalist id="purchase-suppliers-list">
                {getStoredSuppliers().map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Purchase Date">
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950"
              />
            </FormField>
          </div>

          <FormField label="Notes / Invoice Ref">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bill #882, dye lot #09"
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950"
            />
          </FormField>

          <p className="text-[11px] text-brand-plum-500 italic">
            Note: Material purchases increase balance sheet inventory assets. They are recognized in Cost of Goods Sold (COGS) when finished products are sold, and not double-counted as operating expenses.
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
              {isSubmitting ? 'Recording...' : `Receive Stock (${formatINR(totalCalculated)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
