import React, { useState, useEffect } from 'react';
import { databaseService } from '../../services/databaseService.js';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatINR } from '../../domain/formatters.js';
import { 
  X, 
  Sparkles, 
  AlertCircle, 
  Trash2, 
  Edit2, 
  Check, 
  SlidersHorizontal,
  Layers,
  Plus,
  HelpCircle,
  Package,
  Clock
} from 'lucide-react';
import FormField from '../common/FormField.jsx';

const DEFAULT_CATEGORIES = [
  'Keychains',
  'Hair Accessories',
  'Bags & Backpacks',
  'Wearables',
  'Amigurumi & Plushies',
  'Home & Living',
  'Bespoke / Custom',
];

function getStoredCategories() {
  try {
    const stored = localStorage.getItem('wooly_bloom_product_categories');
    const parsed = stored ? JSON.parse(stored) : [];
    return [...new Set([...DEFAULT_CATEGORIES, ...parsed])];
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export default function ProductFormModal({ isOpen, onClose, productToEdit = null }) {
  const { showToast, rawMaterials = [], recipes = [] } = useBusiness();
  const { businessProfile } = useAuth();
  const defaultHourlyRate = businessProfile?.pricingDefaults?.hourlyLaborRate ?? 250;

  const [name, setName] = useState(productToEdit?.name || '');
  const sku = productToEdit?.sku || '';
  const [category, setCategory] = useState(productToEdit?.category || 'Keychains');
  const [availableCategories, setAvailableCategories] = useState(getStoredCategories);

  // Adding new custom category state
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Editing existing custom category state
  const [editingCategoryName, setEditingCategoryName] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [showManageCategories, setShowManageCategories] = useState(false);

  const [description, setDescription] = useState(productToEdit?.description || '');
  const [stockQuantity, setStockQuantity] = useState(productToEdit?.stockQuantity ?? 0);
  const [sellingPrice, setSellingPrice] = useState(productToEdit?.sellingPrice ?? 0);
  const [costPerUnit, setCostPerUnit] = useState(productToEdit?.costPerUnit ?? 0);
  const [reorderThreshold, setReorderThreshold] = useState(productToEdit?.reorderThreshold ?? 2);

  // Bill of Materials (BOM) & Hourly Labor State
  const [bomItems, setBomItems] = useState([]);
  const [laborHours, setLaborHours] = useState('');
  const [hourlyLaborRate, setHourlyLaborRate] = useState(defaultHourlyRate);
  const [packagingCost, setPackagingCost] = useState('');
  const [autoSyncCost, setAutoSyncCost] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Sync form fields whenever productToEdit or modal open state changes
  useEffect(() => {
    const currentStored = getStoredCategories();
    const existingRecipe = recipes?.find(r => r.productId === productToEdit?.id);

    if (productToEdit) {
      setName(productToEdit.name || '');
      const editCategory = productToEdit.category || 'Keychains';
      setCategory(editCategory);
      if (editCategory && !currentStored.includes(editCategory)) {
        setAvailableCategories([...currentStored, editCategory]);
      } else {
        setAvailableCategories(currentStored);
      }
      setDescription(productToEdit.description || '');
      setStockQuantity(productToEdit.stockQuantity ?? 0);
      setSellingPrice(productToEdit.sellingPrice ?? 0);
      setCostPerUnit(productToEdit.costPerUnit ?? 0);
      setReorderThreshold(productToEdit.reorderThreshold ?? 2);

      // Load BOM & Labor Price from product or existing recipe
      const rawBomItems = productToEdit.bom?.items || productToEdit.bomItems || existingRecipe?.items || [];
      setBomItems(
        rawBomItems.map((item, idx) => ({
          id: item.id || `bom_${Date.now()}_${idx}`,
          materialId: item.materialId || '',
          quantity: item.quantityNeeded ?? item.quantity ?? '',
        }))
      );

      const existingLaborHours = productToEdit.bom?.laborHours 
        ?? (productToEdit.bom?.laborMinutes ? (productToEdit.bom.laborMinutes / 60) : undefined)
        ?? (existingRecipe?.laborMinutes ? (existingRecipe.laborMinutes / 60) : '')
        ?? '';
      const existingLaborRate = productToEdit.bom?.hourlyLaborRate
        ?? existingRecipe?.hourlyLaborRate
        ?? defaultHourlyRate;

      setLaborHours(existingLaborHours !== '' ? existingLaborHours : '');
      setHourlyLaborRate(existingLaborRate);
      setPackagingCost(productToEdit.bom?.packagingCost ?? existingRecipe?.packagingCost ?? '');
      setAutoSyncCost(false);
    } else {
      setName('');
      setCategory('Keychains');
      setAvailableCategories(currentStored);
      setDescription('');
      setStockQuantity(0);
      setSellingPrice(0);
      setCostPerUnit(0);
      setReorderThreshold(2);
      setBomItems([]);
      setLaborHours('');
      setHourlyLaborRate(defaultHourlyRate);
      setPackagingCost('');
      setAutoSyncCost(true);
    }
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setEditingCategoryName(null);
    setEditingCategoryValue('');
    setShowManageCategories(false);
    setError('');
  }, [productToEdit, isOpen, recipes, defaultHourlyRate]);

  // Handle dropdown selection change
  const handleCategorySelectChange = (e) => {
    const val = e.target.value;
    if (val === '__other__') {
      setIsCustomCategory(true);
      setCustomCategoryInput('');
      setEditingCategoryName(null);
    } else {
      setIsCustomCategory(false);
      setCategory(val);
      setEditingCategoryName(null);
    }
  };

  // Add and save new custom category
  const handleSaveCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;

    const updated = availableCategories.includes(trimmed)
      ? availableCategories
      : [...availableCategories, trimmed];

    setAvailableCategories(updated);
    try {
      const customOnly = updated.filter(c => !DEFAULT_CATEGORIES.includes(c));
      localStorage.setItem('wooly_bloom_product_categories', JSON.stringify(customOnly));
    } catch (err) {
      console.warn('Could not save custom categories:', err);
    }

    setCategory(trimmed);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    showToast('success', `Added category "${trimmed}".`);
  };

  // Start editing a custom category
  const handleStartEditCategory = (catName) => {
    setEditingCategoryName(catName);
    setEditingCategoryValue(catName);
    setIsCustomCategory(false);
  };

  // Save renamed category
  const handleSaveEditedCategory = () => {
    const trimmed = editingCategoryValue.trim();
    if (!trimmed || !editingCategoryName) return;

    if (trimmed === editingCategoryName) {
      setEditingCategoryName(null);
      return;
    }

    const updated = availableCategories.map(c => c === editingCategoryName ? trimmed : c);
    setAvailableCategories(updated);

    if (category === editingCategoryName) {
      setCategory(trimmed);
    }

    try {
      const customOnly = updated.filter(c => !DEFAULT_CATEGORIES.includes(c));
      localStorage.setItem('wooly_bloom_product_categories', JSON.stringify(customOnly));
    } catch (err) {
      console.warn('Could not save custom categories:', err);
    }

    showToast('success', `Renamed category to "${trimmed}".`);
    setEditingCategoryName(null);
    setEditingCategoryValue('');
  };

  // Delete a custom category
  const handleDeleteCategory = (catName) => {
    if (DEFAULT_CATEGORIES.includes(catName)) {
      showToast('error', `Cannot delete default category "${catName}".`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      const updated = availableCategories.filter(c => c !== catName);
      setAvailableCategories(updated);

      try {
        const customOnly = updated.filter(c => !DEFAULT_CATEGORIES.includes(c));
        localStorage.setItem('wooly_bloom_product_categories', JSON.stringify(customOnly));
      } catch (err) {
        console.warn('Could not save custom categories:', err);
      }

      if (category === catName) {
        setCategory(DEFAULT_CATEGORIES[0] || 'Keychains');
      }

      if (editingCategoryName === catName) {
        setEditingCategoryName(null);
      }

      showToast('info', `Category "${catName}" deleted.`);
    }
  };

  const customCategories = availableCategories.filter(c => !DEFAULT_CATEGORIES.includes(c));
  const isSelectedCategoryCustom = !DEFAULT_CATEGORIES.includes(category) && category !== '__other__';

  // Real-time BOM Calculations
  const calculatedBomItems = bomItems.map(item => {
    const mat = rawMaterials?.find(m => m.id === item.materialId);
    const unitCost = Number(mat?.averageUnitCost ?? mat?.unitCost ?? 0);
    const qty = Number(item.quantity) || 0;
    const lineTotal = Math.round(qty * unitCost * 100) / 100;
    return {
      ...item,
      material: mat,
      unitCost,
      lineTotal,
    };
  });

  const totalMaterialsCost = calculatedBomItems.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
  const laborHoursNum = Number(laborHours) || 0;
  const hourlyRateNum = Number(hourlyLaborRate) || 0;
  const laborCost = Math.round(laborHoursNum * hourlyRateNum * 100) / 100;
  const packagingCostNum = Number(packagingCost) || 0;
  const totalBomCost = Math.round((totalMaterialsCost + laborCost + packagingCostNum) * 100) / 100;

  // Auto-sync BOM cost into costPerUnit when BOM items or labor change and autoSyncCost is true
  useEffect(() => {
    if (autoSyncCost && totalBomCost > 0) {
      setCostPerUnit(totalBomCost);
    }
  }, [totalBomCost, autoSyncCost]);

  // Handlers for BOM
  const handleAddBomItem = () => {
    const defaultMatId = rawMaterials && rawMaterials.length > 0 ? rawMaterials[0].id : '';
    setBomItems(prev => [
      ...prev,
      {
        id: `bom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        materialId: defaultMatId,
        quantity: '',
      }
    ]);
  };

  const handleUpdateBomItem = (id, field, value) => {
    setBomItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleRemoveBomItem = (id) => {
    setBomItems(prev => prev.filter(item => item.id !== id));
  };

  const handleApplyBomCostToUnitCost = () => {
    setCostPerUnit(totalBomCost);
    setAutoSyncCost(true);
    showToast('success', `Applied BOM cost (${formatINR(totalBomCost)}) to Estimated Unit Cost.`);
  };

  const effectiveUnitCost = Number(costPerUnit) > 0 ? Number(costPerUnit) : totalBomCost;
  const estimatedProfit = (Number(sellingPrice) || 0) - effectiveUnitCost;
  const profitMarginPct = Number(sellingPrice) > 0 ? Math.round((estimatedProfit / Number(sellingPrice)) * 100) : 0;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    let finalCategory = category;
    if (isCustomCategory) {
      const trimmed = customCategoryInput.trim();
      if (trimmed) {
        finalCategory = trimmed;
        const updated = availableCategories.includes(trimmed)
          ? availableCategories
          : [...availableCategories, trimmed];
        setAvailableCategories(updated);
        try {
          const customOnly = updated.filter(c => !DEFAULT_CATEGORIES.includes(c));
          localStorage.setItem('wooly_bloom_product_categories', JSON.stringify(customOnly));
        } catch (err) {
          console.warn('Could not save custom categories:', err);
        }
      } else {
        setError('Please enter a category name or select an existing one.');
        return;
      }
    }

    const validBomItems = calculatedBomItems
      .filter(item => item.materialId && Number(item.quantity) > 0)
      .map(item => ({
        materialId: item.materialId,
        materialName: item.material?.name || '',
        quantityNeeded: Number(item.quantity) || 0,
        unit: item.material?.unit || 'unit',
        unitCost: item.unitCost,
        lineCost: item.lineTotal,
      }));

    const bomData = {
      items: validBomItems,
      laborHours: laborHoursNum,
      laborMinutes: Math.round(laborHoursNum * 60),
      hourlyLaborRate: hourlyRateNum,
      laborCost,
      packagingCost: packagingCostNum,
      totalMaterialsCost: Math.round(totalMaterialsCost * 100) / 100,
      totalBomCost,
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      let targetProductId = productToEdit?.id;
      if (productToEdit) {
        await databaseService.updateProduct(productToEdit.id, {
          name,
          sku,
          category: finalCategory,
          description,
          sellingPrice: Number(sellingPrice) || 0,
          costPerUnit: Number(costPerUnit) || 0,
          reorderThreshold: Number(reorderThreshold) || 2,
          bom: bomData,
        });
        showToast('success', `Updated "${name}".`);
      } else {
        const created = await databaseService.addProduct({
          name,
          sku: sku || `PROD-${Date.now().toString().slice(-4)}`,
          category: finalCategory,
          description,
          stockQuantity: Number(stockQuantity) || 0,
          sellingPrice: Number(sellingPrice) || 0,
          costPerUnit: Number(costPerUnit) || 0,
          reorderThreshold: Number(reorderThreshold) || 2,
          bom: bomData,
        });
        targetProductId = created?.id;
        showToast('success', `Added product "${name}".`);
      }

      // Sync with recipes table if BOM has items, labor, or packaging cost
      if (validBomItems.length > 0 || packagingCostNum > 0 || laborCost > 0) {
        try {
          const existingRecipe = recipes?.find(r => r.productId === targetProductId);
          await databaseService.saveRecipe({
            id: existingRecipe?.id,
            productId: targetProductId,
            productName: name,
            items: validBomItems,
            laborMinutes: Math.round(laborHoursNum * 60),
            hourlyLaborRate: hourlyRateNum,
            laborCost,
            packagingCost: packagingCostNum,
            totalCost: totalBomCost,
          });
        } catch (rErr) {
          console.warn('Recipe sync warning:', rErr);
        }
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productToEdit) return;
    if (window.confirm(`Are you sure you want to delete "${productToEdit.name}"?`)) {
      try {
        await databaseService.deleteProduct(productToEdit.id);
        showToast('info', `Product "${productToEdit.name}" deleted.`);
        onClose();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-brand-plum-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-brand-plum-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 bg-brand-plum-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-brand-plum-800 rounded-xl text-brand-rose-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold font-['Outfit'] truncate">
                {productToEdit ? 'Edit Finished Product' : 'Add Finished Product'}
              </h3>
              <p className="text-[11px] sm:text-xs text-brand-plum-200 truncate">Catalog saleable handcrafted crochet creations</p>
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
            <FormField label="Product Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lavender Granny Square Tote"
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 focus:ring-2 focus:ring-brand-plum-500/20"
                required
              />
            </FormField>

            <FormField label="Category" required>
              <select
                value={isCustomCategory ? '__other__' : category}
                onChange={handleCategorySelectChange}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 focus:ring-2 focus:ring-brand-plum-500/20 font-medium"
              >
                {availableCategories.map(c => (
                  <option key={c} value={c}>
                    {c} {!DEFAULT_CATEGORIES.includes(c) ? '★' : ''}
                  </option>
                ))}
                <option value="__other__">+ Other (Add new...)</option>
              </select>

              {/* Add New Category Input Box */}
              {isCustomCategory && (
                <div className="mt-2 p-2.5 bg-brand-cream-50 rounded-xl border border-brand-plum-200 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-brand-plum-800">
                    <span>New Category:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(false);
                        setCustomCategoryInput('');
                      }}
                      className="text-brand-plum-500 hover:text-brand-plum-800 underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveCustomCategory();
                        }
                      }}
                      placeholder="e.g. Blankets & Throws"
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white rounded-lg border border-brand-plum-300 text-brand-plum-950 font-medium focus:outline-none focus:ring-1 focus:ring-brand-plum-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomCategory}
                      disabled={!customCategoryInput.trim()}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-brand-plum-900 hover:bg-brand-plum-950 rounded-lg transition disabled:opacity-40 shrink-0 shadow-2xs"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* Inline Edit Box for a Selected Category */}
              {editingCategoryName && (
                <div className="mt-2 p-2.5 bg-brand-cream-50 rounded-xl border border-brand-rose-200 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-brand-plum-800">
                    <span>Rename category "{editingCategoryName}":</span>
                    <button
                      type="button"
                      onClick={() => setEditingCategoryName(null)}
                      className="text-brand-plum-500 hover:text-brand-plum-800 underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingCategoryValue}
                      onChange={(e) => setEditingCategoryValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEditedCategory();
                        }
                      }}
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white rounded-lg border border-brand-plum-300 text-brand-plum-950 font-medium focus:outline-none focus:ring-1 focus:ring-brand-plum-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveEditedCategory}
                      disabled={!editingCategoryValue.trim()}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-brand-plum-900 hover:bg-brand-plum-950 rounded-lg transition disabled:opacity-40 shrink-0 shadow-2xs flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Update</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions Bar when Selected Category is a Custom Category */}
              {isSelectedCategoryCustom && !editingCategoryName && !isCustomCategory && (
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 bg-brand-cream-50/80 border border-brand-plum-200/70 rounded-lg">
                  <span className="text-[11px] text-brand-plum-700 font-medium truncate min-w-0">
                    Added category: <strong className="text-brand-plum-950 font-semibold">{category}</strong>
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEditCategory(category)}
                      className="text-[11px] font-semibold text-brand-plum-700 hover:text-brand-plum-950 flex items-center gap-1 hover:underline"
                      title="Edit this category"
                    >
                      <Edit2 className="w-3 h-3 text-brand-plum-600" />
                      <span>Edit</span>
                    </button>
                    <span className="text-brand-plum-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category)}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
                      title="Delete this category"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Toggle to view and manage all added custom categories */}
              {customCategories.length > 0 && !isCustomCategory && !editingCategoryName && (
                <div className="mt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowManageCategories(!showManageCategories)}
                    className="text-[11px] text-brand-plum-600 hover:text-brand-plum-950 font-medium underline flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>{showManageCategories ? 'Hide custom categories' : `Manage custom categories (${customCategories.length})`}</span>
                  </button>
                </div>
              )}

              {/* Expandable Manage Categories Panel */}
              {showManageCategories && customCategories.length > 0 && !isCustomCategory && (
                <div className="mt-2 p-2.5 bg-white rounded-xl border border-brand-plum-200 shadow-sm space-y-1.5 max-h-44 overflow-y-auto animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] font-bold text-brand-plum-800 px-1 border-b border-brand-plum-100 pb-1">
                    <span>Manage Custom Categories</span>
                    <button
                      type="button"
                      onClick={() => setShowManageCategories(false)}
                      className="text-[10px] text-brand-plum-500 hover:text-brand-plum-800 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                  {customCategories.map(cc => (
                    <div key={cc} className="flex items-center justify-between px-2 py-1 text-xs hover:bg-brand-cream-50 rounded-lg transition">
                      <span className="text-brand-plum-900 font-medium truncate">
                        {cc} {category === cc ? <span className="text-[10px] text-brand-rose-600 font-bold ml-1">(active)</span> : ''}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setShowManageCategories(false);
                            handleStartEditCategory(cc);
                          }}
                          className="p-1 text-brand-plum-600 hover:text-brand-plum-950 hover:bg-white rounded transition"
                          title={`Edit "${cc}"`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cc)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          title={`Delete "${cc}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FormField>

            <FormField label="Description">
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Design details, yarn blend, care instructions..."
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 resize-none"
              />
            </FormField>

            {/* Bill of Materials (BOM) Section */}
            <div className="bg-brand-cream-50/80 border border-brand-plum-200/90 rounded-2xl p-3.5 sm:p-4.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2 border-b border-brand-plum-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-rose-100 text-brand-rose-700 rounded-xl shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-brand-plum-950 font-['Outfit'] flex items-center gap-2">
                      Bill of Materials (BOM) & Recipe
                      {bomItems.length > 0 && (
                        <span className="px-2 py-0.5 text-[10px] bg-brand-rose-100 text-brand-rose-800 rounded-full font-bold">
                          {bomItems.length} {bomItems.length === 1 ? 'material' : 'materials'}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-brand-plum-600">
                      Required yarns, accessories & packaging to calculate exact crafting cost per unit
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddBomItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-plum-900 hover:bg-brand-plum-950 rounded-xl transition shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Material</span>
                </button>
              </div>

              {/* BOM Column Headers (visible on tablet/desktop) */}
              {bomItems.length > 0 && (
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-plum-500 bg-brand-cream-100/70 rounded-lg border border-brand-plum-200/60">
                  <div className="sm:col-span-6">Raw Material</div>
                  <div className="sm:col-span-3">Quantity Required</div>
                  <div className="sm:col-span-2 text-right">Line Cost</div>
                  <div className="sm:col-span-1 text-center">Action</div>
                </div>
              )}

              {/* BOM Materials List */}
              {bomItems.length === 0 ? (
                <div className="py-5 px-4 text-center rounded-2xl border-2 border-dashed border-brand-plum-200 bg-white/70 space-y-1.5">
                  <div className="w-9 h-9 mx-auto rounded-full bg-brand-cream-100 text-brand-plum-600 flex items-center justify-center">
                    <Package className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-xs font-bold text-brand-plum-800">No raw materials linked yet</p>
                  <p className="text-[11px] text-brand-plum-600 max-w-sm mx-auto">
                    Add yarns, threads, stuffing, or eyes. The system automatically multiplies the grams/units by the material's purchase rate.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddBomItem}
                    className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-brand-rose-700 bg-brand-rose-50 hover:bg-brand-rose-100 border border-brand-rose-200 rounded-xl transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Material</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {calculatedBomItems.map((item, index) => {
                    const mat = item.material;
                    const unitLabel = mat?.unit || 'unit';

                    return (
                      <div 
                        key={item.id} 
                        className="p-3 bg-white rounded-2xl border border-brand-plum-200/80 shadow-xs hover:border-brand-plum-300 transition space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center"
                      >
                        {/* Raw Material Select */}
                        <div className="sm:col-span-6 min-w-0">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-brand-plum-500 block mb-1 sm:hidden">
                            Material #{index + 1}
                          </label>
                          <select
                            value={item.materialId}
                            onChange={(e) => handleUpdateBomItem(item.id, 'materialId', e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-medium focus:ring-2 focus:ring-brand-plum-500/20 focus:border-brand-plum-500 transition"
                          >
                            <option value="">-- Select Raw Material --</option>
                            {rawMaterials?.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({formatINR(m.averageUnitCost || m.unitCost || 0)}/{m.unit || 'unit'})
                              </option>
                            ))}
                          </select>
                          {mat && (
                            <div className="mt-1 flex items-center justify-between text-[11px] text-brand-plum-600 px-1">
                              <span>Rate: <strong className="font-semibold text-brand-plum-900">{formatINR(item.unitCost)}</strong> / {unitLabel}</span>
                              <span className={mat.stockQuantity <= 0 ? 'text-rose-600 font-bold' : 'text-brand-plum-500'}>
                                Stock: {mat.stockQuantity} {unitLabel}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quantity Needed Input Group with Attached Unit Addon */}
                        <div className="sm:col-span-3 min-w-0">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-brand-plum-500 block mb-1 sm:hidden">
                            Quantity Required ({unitLabel})
                          </label>
                          <div className="flex items-center bg-white rounded-xl border border-brand-plum-200 focus-within:ring-2 focus-within:ring-brand-plum-500/20 focus-within:border-brand-plum-500 transition shadow-2xs overflow-hidden">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleUpdateBomItem(item.id, 'quantity', e.target.value)}
                              placeholder="0"
                              className="w-full min-w-0 px-3 py-2 text-sm font-bold text-brand-plum-950 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="shrink-0 px-2.5 py-2 text-xs font-bold text-brand-plum-700 bg-brand-cream-100/90 border-l border-brand-plum-200 select-none">
                              {unitLabel}
                            </span>
                          </div>
                        </div>

                        {/* Calculated Line Cost */}
                        <div className="flex items-center justify-between sm:justify-end sm:col-span-2 min-w-0">
                          <span className="text-[10px] font-bold uppercase text-brand-plum-500 sm:hidden">
                            Subtotal:
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-brand-plum-900 font-mono">
                              {formatINR(item.lineTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Remove item */}
                        <div className="flex justify-end sm:justify-center sm:col-span-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveBomItem(item.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                            title="Remove from BOM"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Direct Crafting Labor (Hourly Basis) */}
              <div className="pt-3 border-t border-brand-plum-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-plum-700" />
                    <span className="text-xs font-bold text-brand-plum-900 font-['Outfit']">
                      Direct Crafting Labor (Hourly Basis)
                    </span>
                  </div>
                  {laborHoursNum > 0 && (
                    <span className="text-[11px] font-semibold text-brand-plum-600 bg-brand-cream-100 px-2 py-0.5 rounded-md">
                      {Math.round(laborHoursNum * 60)} minutes crafting time
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center">
                  {/* Labor Hours Input */}
                  <div className="sm:col-span-4 min-w-0">
                    <label className="text-[11px] font-bold text-brand-plum-700 block mb-1">
                      Crafting Time (Hours)
                    </label>
                    <div className="flex items-center bg-white rounded-xl border border-brand-plum-200 focus-within:ring-2 focus-within:ring-brand-plum-500/20 focus-within:border-brand-plum-500 transition shadow-2xs overflow-hidden">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={laborHours}
                        onChange={(e) => setLaborHours(e.target.value)}
                        placeholder="0.0"
                        className="w-full min-w-0 px-3 py-2 text-sm font-bold text-brand-plum-950 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="shrink-0 px-2.5 py-2 text-xs font-bold text-brand-plum-700 bg-brand-cream-100/90 border-l border-brand-plum-200 select-none">
                        hrs
                      </span>
                    </div>
                  </div>

                  {/* Hourly Labor Rate Input */}
                  <div className="sm:col-span-4 min-w-0">
                    <label className="text-[11px] font-bold text-brand-plum-700 block mb-1">
                      Labor Rate (₹ / Hour)
                    </label>
                    <div className="flex items-center bg-white rounded-xl border border-brand-plum-200 focus-within:ring-2 focus-within:ring-brand-plum-500/20 focus-within:border-brand-plum-500 transition shadow-2xs overflow-hidden">
                      <span className="px-2.5 py-2 text-xs font-bold text-brand-plum-600 bg-brand-cream-100 border-r border-brand-plum-200 select-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={hourlyLaborRate}
                        onChange={(e) => setHourlyLaborRate(e.target.value)}
                        placeholder="250"
                        className="w-full min-w-0 px-3 py-2 text-sm font-bold text-brand-plum-950 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="shrink-0 px-2 py-2 text-xs font-bold text-brand-plum-700 bg-brand-cream-100 border-l border-brand-plum-200 select-none">
                        /hr
                      </span>
                    </div>
                  </div>

                  {/* Real-time Calculated Labor Cost */}
                  <div className="sm:col-span-4 min-w-0">
                    <label className="text-[11px] font-bold text-brand-plum-700 block mb-1">
                      Calculated Labor Price
                    </label>
                    <div className="px-3 py-2 bg-brand-cream-100/90 border border-brand-plum-200 rounded-xl flex items-center justify-between shadow-2xs min-h-[38px]">
                      <span className="text-[11px] font-medium text-brand-plum-600">
                        {laborHoursNum > 0 ? `${laborHoursNum}h @ ₹${hourlyRateNum}/h` : '₹0 / unit'}
                      </span>
                      <span className="text-sm font-extrabold font-mono text-brand-plum-950">
                        {formatINR(laborCost)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Packaging / Additional Direct Costs */}
              <div className="pt-3 border-t border-brand-plum-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="text-xs font-bold text-brand-plum-800 block mb-1">
                    Packaging & Finishing Costs (₹ per unit)
                  </label>
                  <div className="flex items-center bg-white rounded-xl border border-brand-plum-200 focus-within:ring-2 focus-within:ring-brand-plum-500/20 focus-within:border-brand-plum-500 transition shadow-2xs overflow-hidden">
                    <span className="px-3 py-2 text-xs font-bold text-brand-plum-600 bg-brand-cream-100 border-r border-brand-plum-200 select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={packagingCost}
                      onChange={(e) => setPackagingCost(e.target.value)}
                      placeholder="0.00 (dust bag, ribbon, tags)"
                      className="w-full px-3 py-2 text-xs sm:text-sm font-semibold text-brand-plum-950 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Total BOM Calculation Card */}
                <div className="bg-brand-plum-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-sm border border-brand-plum-800">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-brand-rose-300 tracking-wider">
                        Total BOM Cost / Unit
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-brand-plum-800 text-brand-plum-200 rounded-md font-semibold">
                        Auto
                      </span>
                    </div>
                    <div className="text-lg font-extrabold font-['Outfit'] text-white">
                      {formatINR(totalBomCost)}
                    </div>
                    <div className="text-[10px] text-brand-plum-300 truncate">
                      Mat: {formatINR(totalMaterialsCost)} + Labor: {formatINR(laborCost)} + Pack: {formatINR(packagingCostNum)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyBomCostToUnitCost}
                    disabled={totalBomCost === 0}
                    className="px-3 py-2 text-xs font-bold bg-gradient-to-r from-brand-rose-500 to-brand-rose-600 hover:from-brand-rose-600 hover:to-brand-rose-700 text-white rounded-xl transition shadow-xs disabled:opacity-40 shrink-0 flex items-center gap-1"
                    title="Copy BOM calculated cost into Estimated Unit Cost below"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Cost</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-brand-cream-100/80 p-3.5 sm:p-4 rounded-2xl border border-brand-plum-200/70">
              <FormField label="Default Selling Price" required>
                <div className="flex items-center bg-white rounded-xl border border-brand-plum-200 focus-within:ring-2 focus-within:ring-brand-plum-500/20 focus-within:border-brand-plum-500 transition shadow-2xs overflow-hidden">
                  <span className="px-3 py-2 text-sm font-bold text-brand-plum-600 bg-brand-cream-50 border-r border-brand-plum-200 select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm font-bold text-brand-plum-950 focus:outline-none bg-transparent"
                    required
                  />
                </div>
              </FormField>

              <FormField label="Estimated Unit Cost">
                <div className="flex items-center bg-white rounded-xl border border-brand-plum-200 focus-within:ring-2 focus-within:ring-brand-plum-500/20 focus-within:border-brand-plum-500 transition shadow-2xs overflow-hidden">
                  <span className="px-3 py-2 text-sm font-bold text-brand-plum-600 bg-brand-cream-50 border-r border-brand-plum-200 select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={costPerUnit}
                    onChange={(e) => {
                      setCostPerUnit(e.target.value);
                      setAutoSyncCost(false);
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm font-bold text-brand-plum-950 focus:outline-none bg-transparent"
                  />
                  {totalBomCost > 0 && Math.abs(Number(costPerUnit) - totalBomCost) < 0.01 && (
                    <span className="shrink-0 px-2 py-1 mr-2 rounded-lg bg-brand-sage-100 text-brand-sage-800 text-[10px] font-bold select-none">
                      ✓ BOM Synced
                    </span>
                  )}
                </div>
              </FormField>
            </div>

            {/* Profit Margin Preview Callout */}
            {Number(sellingPrice) > 0 && (
              <div className="p-3 rounded-2xl bg-white border border-brand-plum-200 shadow-2xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-brand-plum-600 font-medium">Estimated Gross Profit:</span>
                  <span className="text-sm font-extrabold text-brand-plum-950 font-['Outfit']">
                    {formatINR(estimatedProfit)}
                  </span>
                  <span className="text-[11px] text-brand-plum-500">
                    (₹{Number(sellingPrice) || 0} - ₹{effectiveUnitCost})
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${profitMarginPct >= 35 ? 'bg-brand-sage-100 text-brand-sage-800' : profitMarginPct >= 20 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                  {profitMarginPct}% Margin
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              {!productToEdit && (
                <FormField label="Initial Finished Stock">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-bold"
                  />
                </FormField>
              )}

              <FormField label="Low Stock Alert Threshold">
                <input
                  type="number"
                  min="0"
                  value={reorderThreshold}
                  onChange={(e) => setReorderThreshold(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950"
                />
              </FormField>
            </div>
          </div>

          <div className="shrink-0 p-3.5 sm:p-4 px-4 sm:px-6 border-t border-brand-plum-100 bg-brand-cream-50/50 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            {productToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full sm:w-auto justify-center px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Delete Product</span>
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
                {isSubmitting ? 'Saving...' : (productToEdit ? 'Save Changes' : 'Create Product')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
