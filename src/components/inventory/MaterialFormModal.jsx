import React, { useState, useEffect } from 'react';
import { databaseService } from '../../services/databaseService.js';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { X, Layers, AlertCircle, Trash2, Edit2, Check, SlidersHorizontal } from 'lucide-react';
import FormField from '../common/FormField.jsx';

const DEFAULT_UNITS = [
  'g',
  'pair',
  'pcs',
  'meter',
];

export const DEFAULT_SUPPLIERS = [
  'Anurag Store',
  'Sahuji Shop',
  'Amazon',
  'Meesho',
  'Flipkart'
];

function getStoredUnits() {
  try {
    const stored = localStorage.getItem('wooly_bloom_custom_units');
    const parsed = stored ? JSON.parse(stored) : [];
    return [...new Set([...DEFAULT_UNITS, ...parsed])];
  } catch {
    return DEFAULT_UNITS;
  }
}

export function getStoredSuppliers() {
  try {
    const stored = localStorage.getItem('wooly_bloom_raw_material_suppliers');
    const parsed = stored ? JSON.parse(stored) : [];
    return [...new Set([...DEFAULT_SUPPLIERS, ...parsed])];
  } catch {
    return DEFAULT_SUPPLIERS;
  }
}

export default function MaterialFormModal({ isOpen, onClose, materialToEdit = null }) {
  const { showToast } = useBusiness();

  const [name, setName] = useState(materialToEdit?.name || '');
  const sku = materialToEdit?.sku || '';
  const [category, setCategory] = useState(materialToEdit?.category || 'Yarn');
  const [unit, setUnit] = useState(materialToEdit?.unit || DEFAULT_UNITS[0] || 'g');
  const [availableUnits, setAvailableUnits] = useState(getStoredUnits);

  // Adding new custom unit state
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState('');

  // Editing existing custom unit state
  const [editingUnitName, setEditingUnitName] = useState(null);
  const [editingUnitValue, setEditingUnitValue] = useState('');
  const [showManageUnits, setShowManageUnits] = useState(false);

  const [stockQuantity, setStockQuantity] = useState(materialToEdit?.stockQuantity ?? 0);
  const [averageUnitCost, setAverageUnitCost] = useState(materialToEdit?.averageUnitCost ?? 0);
  const [totalCost, setTotalCost] = useState('');
  const [lastCostCalculatedFrom, setLastCostCalculatedFrom] = useState('unitCost');

  const [reorderThreshold, setReorderThreshold] = useState(materialToEdit?.reorderThreshold ?? 5);
  const [availableSuppliers, setAvailableSuppliers] = useState(getStoredSuppliers);
  const [supplier, setSupplier] = useState(materialToEdit?.supplier || DEFAULT_SUPPLIERS[0]);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [customSupplierInput, setCustomSupplierInput] = useState('');
  const [notes, setNotes] = useState(materialToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Sync form fields whenever materialToEdit or modal open state changes
  useEffect(() => {
    const currentStored = getStoredUnits();
    const currentSuppliers = getStoredSuppliers();
    if (materialToEdit) {
      setName(materialToEdit.name || '');
      setCategory(materialToEdit.category || 'Yarn');
      const editUnit = materialToEdit.unit || DEFAULT_UNITS[0] || 'g';
      setUnit(editUnit);
      if (editUnit && !currentStored.includes(editUnit)) {
        setAvailableUnits([...currentStored, editUnit]);
      } else {
        setAvailableUnits(currentStored);
      }

      const editSupplier = materialToEdit.supplier || DEFAULT_SUPPLIERS[0];
      setSupplier(editSupplier);
      if (editSupplier && !currentSuppliers.includes(editSupplier)) {
        setAvailableSuppliers([...currentSuppliers, editSupplier]);
      } else {
        setAvailableSuppliers(currentSuppliers);
      }

      const qty = Number(materialToEdit.stockQuantity) || 0;
      const uCost = Number(materialToEdit.averageUnitCost) || 0;
      const storedTotal = materialToEdit.totalCost !== undefined && materialToEdit.totalCost !== null && !isNaN(Number(materialToEdit.totalCost))
        ? Number(materialToEdit.totalCost)
        : (qty > 0 && uCost > 0 ? Math.round(qty * uCost * 100) / 100 : '');
      setStockQuantity(qty);
      setAverageUnitCost(uCost > 0 ? (Math.round(uCost * 100) / 100) : uCost);
      setTotalCost(storedTotal !== '' ? String(storedTotal) : '');
      setLastCostCalculatedFrom(materialToEdit.totalCost !== undefined ? 'totalCost' : 'unitCost');
      setReorderThreshold(materialToEdit.reorderThreshold ?? 5);
      setNotes(materialToEdit.notes || '');
    } else {
      setName('');
      setCategory('Yarn');
      setUnit(DEFAULT_UNITS[0] || 'g');
      setAvailableUnits(currentStored);
      setSupplier(DEFAULT_SUPPLIERS[0]);
      setAvailableSuppliers(currentSuppliers);
      setStockQuantity(0);
      setAverageUnitCost(0);
      setTotalCost('');
      setLastCostCalculatedFrom('unitCost');
      setReorderThreshold(5);
      setNotes('');
    }
    setIsCustomUnit(false);
    setCustomUnitInput('');
    setEditingUnitName(null);
    setEditingUnitValue('');
    setShowManageUnits(false);
    setIsCustomSupplier(false);
    setCustomSupplierInput('');
    setError('');
  }, [materialToEdit, isOpen]);

  const handleSupplierSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__other__') {
      setIsCustomSupplier(true);
      setCustomSupplierInput('');
    } else {
      setIsCustomSupplier(false);
      setSupplier(val);
    }
  };

  const handleSaveCustomSupplier = () => {
    const trimmed = customSupplierInput.trim();
    if (!trimmed) return;

    const updated = availableSuppliers.includes(trimmed)
      ? availableSuppliers
      : [...availableSuppliers, trimmed];

    setAvailableSuppliers(updated);
    try {
      const customOnly = updated.filter(s => !DEFAULT_SUPPLIERS.includes(s));
      localStorage.setItem('wooly_bloom_raw_material_suppliers', JSON.stringify(customOnly));
    } catch (err) {
      console.warn('Could not save custom suppliers:', err);
    }

    setSupplier(trimmed);
    setIsCustomSupplier(false);
    setCustomSupplierInput('');
    showToast('success', `Added supplier "${trimmed}".`);
  };

  // Bidirectional Cost & Quantity calculation handlers
  const handleStockQuantityChange = (val) => {
    setStockQuantity(val);
    const qty = Number(val);
    if (qty > 0) {
      if (lastCostCalculatedFrom === 'totalCost' && totalCost !== '') {
        const tot = Number(totalCost);
        if (!isNaN(tot) && tot >= 0) {
          setAverageUnitCost(Math.round((tot / qty) * 100) / 100);
        }
      } else if (averageUnitCost !== '') {
        const u = Number(averageUnitCost);
        if (!isNaN(u) && u >= 0) {
          setTotalCost(String(Math.round(qty * u * 100) / 100));
        }
      }
    }
  };

  const handleTotalCostChange = (val) => {
    setTotalCost(val);
    setLastCostCalculatedFrom('totalCost');
    const tot = Number(val);
    const qty = Number(stockQuantity);
    if (val !== '' && !isNaN(tot) && qty > 0) {
      setAverageUnitCost(Math.round((tot / qty) * 100) / 100);
    } else if (val === '') {
      setAverageUnitCost('');
    }
  };

  const handleAverageUnitCostChange = (val) => {
    setAverageUnitCost(val);
    setLastCostCalculatedFrom('unitCost');
    const u = Number(val);
    const qty = Number(stockQuantity);
    if (val !== '' && !isNaN(u) && qty > 0) {
      setTotalCost(String(Math.round(qty * u * 100) / 100));
    } else if (val === '') {
      setTotalCost('');
    }
  };

  // Handle dropdown selection change
  const handleUnitSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__other__') {
      setIsCustomUnit(true);
      setCustomUnitInput('');
      setEditingUnitName(null);
    } else {
      setIsCustomUnit(false);
      setUnit(val);
      setEditingUnitName(null);
    }
  };

  // Add and save new measurement unit
  const handleSaveCustomUnit = () => {
    const trimmed = customUnitInput.trim();
    if (!trimmed) return;

    const updated = availableUnits.includes(trimmed)
      ? availableUnits
      : [...availableUnits, trimmed];

    setAvailableUnits(updated);
    try {
      const customOnly = updated.filter(u => !DEFAULT_UNITS.includes(u));
      localStorage.setItem('wooly_bloom_custom_units', JSON.stringify(customOnly));
    } catch (err) {
      console.warn('Could not save custom units:', err);
    }

    setUnit(trimmed);
    setIsCustomUnit(false);
    setCustomUnitInput('');
    showToast('success', `Added unit "${trimmed}".`);
  };

  // Start editing a custom unit
  const handleStartEditUnit = (unitName) => {
    setEditingUnitName(unitName);
    setEditingUnitValue(unitName);
    setIsCustomUnit(false);
  };

  // Save renamed unit
  const handleSaveEditedUnit = () => {
    const trimmed = editingUnitValue.trim();
    if (!trimmed || !editingUnitName) return;

    if (trimmed === editingUnitName) {
      setEditingUnitName(null);
      return;
    }

    const updated = availableUnits.map(u => u === editingUnitName ? trimmed : u);
    setAvailableUnits(updated);

    if (unit === editingUnitName) {
      setUnit(trimmed);
    }

    try {
      const customOnly = updated.filter(u => !DEFAULT_UNITS.includes(u));
      localStorage.setItem('wooly_bloom_custom_units', JSON.stringify(customOnly));
    } catch (err) {
      console.warn('Could not update custom units in localStorage:', err);
    }

    setEditingUnitName(null);
    setEditingUnitValue('');
    showToast('success', `Renamed unit "${editingUnitName}" to "${trimmed}".`);
  };

  // Delete a custom unit
  const handleDeleteUnit = (unitToDelete) => {
    if (window.confirm(`Delete measurement unit "${unitToDelete}" from dropdown?`)) {
      const updated = availableUnits.filter(u => u !== unitToDelete);
      setAvailableUnits(updated);

      if (unit === unitToDelete) {
        setUnit(DEFAULT_UNITS[0] || 'g');
      }

      try {
        const customOnly = updated.filter(u => !DEFAULT_UNITS.includes(u));
        localStorage.setItem('wooly_bloom_custom_units', JSON.stringify(customOnly));
      } catch (err) {
        console.warn('Could not remove custom unit from localStorage:', err);
      }

      if (editingUnitName === unitToDelete) {
        setEditingUnitName(null);
      }

      showToast('info', `Removed unit "${unitToDelete}".`);
    }
  };

  if (!isOpen) return null;

  const customUnits = availableUnits.filter(u => !DEFAULT_UNITS.includes(u));
  const isSelectedUnitCustom = !DEFAULT_UNITS.includes(unit) && unit !== '__other__';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Material name is required.');
      return;
    }

    let finalUnit = unit;
    if (isCustomUnit) {
      const trimmed = customUnitInput.trim();
      if (trimmed) {
        finalUnit = trimmed;
        const updated = availableUnits.includes(trimmed)
          ? availableUnits
          : [...availableUnits, trimmed];
        setAvailableUnits(updated);
        try {
          const customOnly = updated.filter(u => !DEFAULT_UNITS.includes(u));
          localStorage.setItem('wooly_bloom_custom_units', JSON.stringify(customOnly));
        } catch (err) {
          console.warn('Could not save custom units:', err);
        }
      } else {
        setError('Please enter a measurement unit or select an existing one.');
        return;
      }
    }

    let finalSupplier = supplier;
    if (isCustomSupplier) {
      const trimmed = customSupplierInput.trim();
      if (trimmed) {
        finalSupplier = trimmed;
        const updated = availableSuppliers.includes(trimmed)
          ? availableSuppliers
          : [...availableSuppliers, trimmed];
        setAvailableSuppliers(updated);
        try {
          const customOnly = updated.filter(s => !DEFAULT_SUPPLIERS.includes(s));
          localStorage.setItem('wooly_bloom_raw_material_suppliers', JSON.stringify(customOnly));
        } catch (err) {
          console.warn('Could not save custom suppliers:', err);
        }
      }
    }

    const qtyNum = Number(stockQuantity) || 0;
    const totalCostNum = totalCost !== '' && !isNaN(Number(totalCost))
      ? Number(totalCost)
      : Math.round(qtyNum * (Number(averageUnitCost) || 0) * 100) / 100;
    const unitCostNum = qtyNum > 0 ? (totalCostNum / qtyNum) : (Number(averageUnitCost) || 0);

    setIsSubmitting(true);
    try {
      if (materialToEdit) {
        await databaseService.updateRawMaterial(materialToEdit.id, {
          name,
          sku: materialToEdit.sku,
          category,
          unit: finalUnit,
          stockQuantity: qtyNum,
          totalCost: totalCostNum,
          averageUnitCost: unitCostNum,
          reorderThreshold: Number(reorderThreshold) || 5,
          supplier: finalSupplier,
          notes,
        });
        showToast('success', `Updated "${name}".`);
      } else {
        await databaseService.addRawMaterial({
          name,
          sku: sku || `MAT-${Date.now().toString().slice(-4)}`,
          category,
          unit: finalUnit,
          stockQuantity: qtyNum,
          totalCost: totalCostNum,
          averageUnitCost: unitCostNum,
          reorderThreshold: Number(reorderThreshold) || 5,
          supplier: finalSupplier,
          notes,
        });
        showToast('success', `Added new material "${name}".`);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!materialToEdit) return;
    if (window.confirm(`Are you sure you want to delete "${materialToEdit.name}"?`)) {
      try {
        await databaseService.deleteRawMaterial(materialToEdit.id);
        showToast('info', `Material "${materialToEdit.name}" deleted.`);
        onClose();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-brand-plum-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-brand-plum-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] sm:max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 bg-brand-plum-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-brand-plum-800 rounded-xl text-brand-rose-300 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold font-['Outfit'] truncate">
                {materialToEdit ? 'Edit Material Definition' : 'Add New Raw Material'}
              </h3>
              <p className="text-[11px] sm:text-xs text-brand-plum-200 truncate">Catalog supplies, units, and reorder levels</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-plum-300 hover:text-white hover:bg-brand-plum-800 transition shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-3.5 sm:space-y-4">
            <FormField label="Material Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Combed Milk Cotton (Sky Blue)"
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 focus:ring-2 focus:ring-brand-plum-500/20"
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <FormField label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950"
                >
                  <option value="Yarn">Yarn</option>
                  <option value="Accessories & Stuffing">Accessories & Stuffing</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Tools">Tools</option>
                </select>
              </FormField>

              <FormField label="Measurement Unit" required>
                <select
                  value={isCustomUnit ? '__other__' : unit}
                  onChange={handleUnitSelectChange}
                  className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 focus:ring-2 focus:ring-brand-plum-500/20 font-medium"
                >
                  {availableUnits.map(u => (
                    <option key={u} value={u}>
                      {u} {!DEFAULT_UNITS.includes(u) ? '★' : ''}
                    </option>
                  ))}
                  <option value="__other__">+ Other (Add new...)</option>
                </select>

                {/* Add New Unit Input Box */}
                {isCustomUnit && (
                  <div className="mt-2 p-2.5 bg-brand-cream-50 rounded-xl border border-brand-plum-200 space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-brand-plum-800">
                      <span>New Measurement Unit:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomUnit(false);
                          setCustomUnitInput('');
                        }}
                        className="text-brand-plum-500 hover:text-brand-plum-800 underline"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={customUnitInput}
                        onChange={(e) => setCustomUnitInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveCustomUnit();
                          }
                        }}
                        placeholder="e.g. cone (250g)"
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white rounded-lg border border-brand-plum-300 text-brand-plum-950 font-medium focus:outline-none focus:ring-1 focus:ring-brand-plum-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomUnit}
                        disabled={!customUnitInput.trim()}
                        className="px-2.5 py-1.5 text-xs font-bold text-white bg-brand-plum-900 hover:bg-brand-plum-950 rounded-lg transition disabled:opacity-40 shrink-0 shadow-2xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Edit Box for a Selected Unit */}
                {editingUnitName && (
                  <div className="mt-2 p-2.5 bg-brand-cream-50 rounded-xl border border-brand-rose-200 space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-brand-plum-800">
                      <span>Rename unit "{editingUnitName}":</span>
                      <button
                        type="button"
                        onClick={() => setEditingUnitName(null)}
                        className="text-brand-plum-500 hover:text-brand-plum-800 underline"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editingUnitValue}
                        onChange={(e) => setEditingUnitValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEditedUnit();
                          }
                        }}
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white rounded-lg border border-brand-plum-300 text-brand-plum-950 font-medium focus:outline-none focus:ring-1 focus:ring-brand-plum-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditedUnit}
                        disabled={!editingUnitValue.trim()}
                        className="px-2.5 py-1.5 text-xs font-bold text-white bg-brand-plum-900 hover:bg-brand-plum-950 rounded-lg transition disabled:opacity-40 shrink-0 shadow-2xs flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Update</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Actions Bar when Selected Unit is an Added Custom Unit */}
                {isSelectedUnitCustom && !editingUnitName && !isCustomUnit && (
                  <div className="mt-1.5 flex items-center justify-between text-xs px-2.5 py-1.5 bg-brand-cream-50/80 border border-brand-plum-200/70 rounded-lg">
                    <span className="text-[11px] text-brand-plum-700 font-medium truncate">
                      Added unit: <strong className="text-brand-plum-950 font-semibold">{unit}</strong>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditUnit(unit)}
                        className="text-[11px] font-semibold text-brand-plum-700 hover:text-brand-plum-950 flex items-center gap-1 hover:underline"
                        title="Edit this measurement unit"
                      >
                        <Edit2 className="w-3 h-3 text-brand-plum-600" />
                        <span>Edit</span>
                      </button>
                      <span className="text-brand-plum-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteUnit(unit)}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
                        title="Delete this measurement unit"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Toggle to view and manage all added units */}
                {customUnits.length > 0 && !isCustomUnit && !editingUnitName && (
                  <div className="mt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowManageUnits(!showManageUnits)}
                      className="text-[11px] text-brand-plum-600 hover:text-brand-plum-950 font-medium underline flex items-center gap-1"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>{showManageUnits ? 'Hide custom units' : `Manage custom units (${customUnits.length})`}</span>
                    </button>
                  </div>
                )}

                {/* Expandable Manage Units Panel */}
                {showManageUnits && customUnits.length > 0 && !isCustomUnit && (
                  <div className="mt-2 p-2.5 bg-white rounded-xl border border-brand-plum-200 shadow-sm space-y-1.5 max-h-44 overflow-y-auto animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] font-bold text-brand-plum-800 px-1 border-b border-brand-plum-100 pb-1">
                      <span>Manage Added Units</span>
                      <button
                        type="button"
                        onClick={() => setShowManageUnits(false)}
                        className="text-[10px] text-brand-plum-500 hover:text-brand-plum-800 font-semibold"
                      >
                        Close
                      </button>
                    </div>
                    {customUnits.map(cu => (
                      <div key={cu} className="flex items-center justify-between px-2 py-1 text-xs hover:bg-brand-cream-50 rounded-lg transition">
                        <span className="text-brand-plum-900 font-medium truncate">
                          {cu} {unit === cu ? <span className="text-[10px] text-brand-rose-600 font-bold ml-1">(active)</span> : ''}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setShowManageUnits(false);
                              handleStartEditUnit(cu);
                            }}
                            className="p-1 text-brand-plum-600 hover:text-brand-plum-950 hover:bg-white rounded transition"
                            title={`Edit "${cu}"`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUnit(cu)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                            title={`Delete "${cu}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>
            </div>

            <FormField label="Reorder Threshold" hint="Alert when stock falls below">
              <input
                type="number"
                min="0"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950"
              />
            </FormField>

            <div className="bg-brand-cream-100 p-3.5 rounded-xl border border-brand-plum-100 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label={materialToEdit ? 'Current On-Hand Stock' : 'Initial Opening Stock'}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={stockQuantity}
                    onChange={(e) => handleStockQuantityChange(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-1.5 text-sm bg-white rounded-lg border border-brand-plum-200 font-bold focus:ring-2 focus:ring-brand-plum-500/20"
                  />
                </FormField>

                <FormField label="Total Cost (₹)" hint="Enter total stock price">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={totalCost}
                    onChange={(e) => handleTotalCostChange(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-1.5 text-sm bg-white rounded-lg border border-brand-plum-200 font-bold focus:ring-2 focus:ring-brand-plum-500/20"
                  />
                </FormField>

                <FormField label={materialToEdit ? 'Average Unit Cost (₹)' : 'Opening Unit Cost (₹)'} hint="Auto-calculated">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={averageUnitCost}
                    onChange={(e) => handleAverageUnitCostChange(e.target.value)}
                    placeholder="e.g. 120"
                    className="w-full px-3 py-1.5 text-sm bg-white rounded-lg border border-brand-plum-200 font-bold focus:ring-2 focus:ring-brand-plum-500/20"
                  />
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <FormField label="Supplier / Vendor">
                <select
                  value={isCustomSupplier ? '__other__' : supplier}
                  onChange={handleSupplierSelectChange}
                  className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-medium focus:ring-2 focus:ring-brand-plum-500/20"
                >
                  {availableSuppliers.map(s => (
                    <option key={s} value={s}>
                      {s} {!DEFAULT_SUPPLIERS.includes(s) ? '★' : ''}
                    </option>
                  ))}
                  <option value="__other__">+ Other (Add new supplier...)</option>
                </select>

                {isCustomSupplier && (
                  <div className="mt-2 p-2.5 bg-brand-cream-50 rounded-xl border border-brand-plum-200 space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-brand-plum-800">
                      <span>New Supplier Name:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomSupplier(false);
                          setCustomSupplierInput('');
                        }}
                        className="text-brand-plum-500 hover:text-brand-plum-800 underline"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={customSupplierInput}
                        onChange={(e) => setCustomSupplierInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveCustomSupplier();
                          }
                        }}
                        placeholder="e.g. Local Yarn Depot"
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white rounded-lg border border-brand-plum-300 text-brand-plum-950 font-medium focus:outline-none focus:ring-1 focus:ring-brand-plum-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomSupplier}
                        disabled={!customSupplierInput.trim()}
                        className="px-2.5 py-1.5 text-xs font-bold text-white bg-brand-plum-900 hover:bg-brand-plum-950 rounded-lg transition disabled:opacity-40 shrink-0 shadow-2xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </FormField>

              <FormField label="Notes">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 100% cotton, dye lot 4"
                  className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950"
                />
              </FormField>
            </div>
          </div>

          <div className="shrink-0 p-3.5 sm:p-4 px-4 sm:px-6 border-t border-brand-plum-100 bg-brand-cream-50/50 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            {materialToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full sm:w-auto justify-center px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Delete Material</span>
              </button>
            ) : <div className="hidden sm:block" />}

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial justify-center px-4 py-2 text-sm font-semibold text-brand-plum-700 hover:bg-brand-cream-200 rounded-xl transition text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial justify-center px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-brand-plum-900 to-brand-plum-800 hover:from-brand-plum-950 hover:to-brand-plum-900 rounded-xl transition shadow-md disabled:opacity-50 text-center flex items-center gap-1.5"
              >
                {isSubmitting ? 'Saving...' : (materialToEdit ? 'Save Changes' : 'Create Material')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
