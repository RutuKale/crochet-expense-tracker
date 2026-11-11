import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { databaseService } from '../../services/databaseService.js';
import { formatINR } from '../../domain/formatters.js';
import { Plus, Trash2, Hammer, Save, FileText, CheckCircle2 } from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';
import FormField from '../common/FormField.jsx';

export default function RecipesView({ onOpenProduceBatch, initialProductId = null }) {
  const { products, recipes, rawMaterials, showToast } = useBusiness();
  const { businessProfile } = useAuth();

  const [selectedProductId, setSelectedProductId] = useState(initialProductId || products[0]?.id || '');
  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];
  const activeRecipe = recipes.find(r => r.productId === selectedProductId);

  // Editor states
  const [laborMinutes, setLaborMinutes] = useState(activeRecipe?.laborMinutes ?? 60);
  const [packagingCost, setPackagingCost] = useState(activeRecipe?.packagingCost ?? 0);
  const [otherDirectCost, setOtherDirectCost] = useState(activeRecipe?.otherDirectCost ?? 0);
  const [allocatedOverhead, setAllocatedOverhead] = useState(activeRecipe?.allocatedOverhead ?? 0);
  const [ingredients, setIngredients] = useState(activeRecipe?.ingredients || [
    { materialId: rawMaterials[0]?.id || '', quantityRequired: 1, unit: rawMaterials[0]?.unit || 'skein' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when switching product
  const handleProductSelect = (prodId) => {
    setSelectedProductId(prodId);
    const rec = recipes.find(r => r.productId === prodId);
    if (rec) {
      setLaborMinutes(rec.laborMinutes || 60);
      setPackagingCost(rec.packagingCost || 0);
      setOtherDirectCost(rec.otherDirectCost || 0);
      setAllocatedOverhead(rec.allocatedOverhead || 0);
      setIngredients(rec.ingredients || []);
    } else {
      setLaborMinutes(60);
      setPackagingCost(0);
      setOtherDirectCost(0);
      setAllocatedOverhead(0);
      setIngredients([
        { materialId: rawMaterials[0]?.id || '', quantityRequired: 1, unit: rawMaterials[0]?.unit || 'skein' }
      ]);
    }
  };

  const handleAddIngredient = () => {
    const defaultMat = rawMaterials[0];
    setIngredients(prev => [
      ...prev,
      {
        materialId: defaultMat?.id || '',
        quantityRequired: 1,
        unit: defaultMat?.unit || 'skein',
      }
    ]);
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    if (field === 'materialId') {
      const mat = rawMaterials.find(m => m.id === value);
      updated[index] = {
        ...updated[index],
        materialId: value,
        unit: mat ? mat.unit : updated[index].unit,
      };
    } else if (field === 'quantityRequired') {
      updated[index].quantityRequired = Math.max(0.01, Number(value) || 0);
    }
    setIngredients(updated);
  };

  // Live Cost Preview
  const hourlyLaborRate = businessProfile?.pricingDefaults?.hourlyLaborRate || 0;
  const laborCost = (Number(laborMinutes) / 60) * hourlyLaborRate;

  let totalMaterialCost = 0;
  const ingredientDetails = ingredients.map(ing => {
    const mat = rawMaterials.find(m => m.id === ing.materialId);
    const unitCost = mat ? Number(mat.averageUnitCost) : 0;
    const lineCost = Number(ing.quantityRequired) * unitCost;
    totalMaterialCost += lineCost;
    return {
      ...ing,
      materialName: mat ? mat.name : 'Unknown Material',
      unitCost,
      lineCost,
    };
  });

  const totalCalculatedCost =
    totalMaterialCost +
    laborCost +
    Number(packagingCost) +
    Number(otherDirectCost) +
    Number(allocatedOverhead);

  const handleSaveRecipe = async () => {
    if (!activeProduct) return;
    setIsSaving(true);
    try {
      await databaseService.saveRecipe({
        id: activeRecipe?.id,
        productId: activeProduct.id,
        productName: activeProduct.name,
        laborMinutes: Number(laborMinutes),
        packagingCost: Number(packagingCost),
        otherDirectCost: Number(otherDirectCost),
        allocatedOverhead: Number(allocatedOverhead),
        ingredients: ingredients.map(ing => {
          const mat = rawMaterials.find(m => m.id === ing.materialId);
          return {
            materialId: ing.materialId,
            materialName: mat?.name || '',
            quantityRequired: Number(ing.quantityRequired),
            unit: mat?.unit || ing.unit,
            unitCost: mat?.averageUnitCost || 0,
          };
        }),
      });

      // Update product estimated unit cost as well
      await databaseService.updateProduct(activeProduct.id, {
        costPerUnit: Math.round(totalCalculatedCost * 100) / 100,
      });

      showToast('success', `Recipe for "${activeProduct.name}" saved successfully!`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recipe & Bill of Materials (BOM)"
        subtitle="Specify exact yarn grams, accessories, and labor hours required to produce each crochet article."
        action={
          <button
            onClick={() => onOpenProduceBatch(selectedProductId)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Hammer className="w-4 h-4" />
            <span>Produce this Item</span>
          </button>
        }
      />

      {/* Product Selection Tab Bar */}
      <div className="bg-white p-3 rounded-2xl border border-brand-plum-100 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-plum-400 shrink-0 px-2">
          Select Design:
        </span>
        {products.map(p => {
          const hasRecipe = recipes.some(r => r.productId === p.id);
          const isSelected = p.id === selectedProductId;
          return (
            <button
              key={p.id}
              onClick={() => handleProductSelect(p.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${isSelected ? 'bg-brand-plum-900 text-white shadow-xs' : 'bg-brand-cream-100 text-brand-plum-800 hover:bg-brand-cream-200'}`}
            >
              <span>{p.name}</span>
              {hasRecipe && <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-rose-300' : 'text-brand-sage-600'}`} />}
            </button>
          );
        })}
      </div>

      {activeProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Ingredient Bill of Materials */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-brand-plum-100 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-brand-plum-950 font-['Outfit']">
                  Ingredients & Raw Supplies for "{activeProduct.name}"
                </h3>
                <p className="text-xs text-brand-plum-600">Material consumption per finished single unit</p>
              </div>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-rose-600 hover:text-brand-rose-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Raw Material
              </button>
            </div>

            <div className="border border-brand-plum-100 rounded-xl overflow-hidden divide-y divide-brand-plum-100">
              {ingredientDetails.map((ing, idx) => (
                <div key={idx} className="p-3 bg-brand-cream-50/40 flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 w-full sm:w-auto">
                    <select
                      value={ing.materialId}
                      onChange={(e) => handleIngredientChange(idx, 'materialId', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-brand-plum-200 font-medium text-brand-plum-950"
                    >
                      {rawMaterials.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({formatINR(m.averageUnitCost)} / {m.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={ing.quantityRequired}
                        onChange={(e) => handleIngredientChange(idx, 'quantityRequired', e.target.value)}
                        className="w-20 px-2 py-1.5 text-xs text-center bg-white rounded-lg border border-brand-plum-200 font-bold"
                        title="Quantity required per finished product"
                      />
                      <span className="text-[11px] text-brand-plum-500 font-medium w-16 truncate">
                        {ing.unit}
                      </span>
                    </div>

                    <div className="w-24 text-right text-xs font-bold text-brand-plum-950">
                      {formatINR(ing.lineCost)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      disabled={ingredients.length <= 1}
                      className="p-1.5 text-brand-plum-400 hover:text-brand-rose-600 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Direct Labor & Packaging Parameters */}
            <div className="pt-4 border-t border-brand-plum-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-plum-800 mb-3">
                Labor & Overhead Assumptions
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <FormField label="Labor (Minutes)">
                  <input
                    type="number"
                    min="0"
                    value={laborMinutes}
                    onChange={(e) => setLaborMinutes(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-brand-cream-50 rounded-lg border border-brand-plum-200 font-bold"
                  />
                  <span className="text-[10px] text-brand-plum-500 block mt-0.5">
                    @ ₹{hourlyLaborRate}/hr = {formatINR(laborCost)}
                  </span>
                </FormField>

                <FormField label="Packaging (₹)">
                  <input
                    type="number"
                    min="0"
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-brand-cream-50 rounded-lg border border-brand-plum-200 font-bold"
                  />
                </FormField>

                <FormField label="Other Direct (₹)">
                  <input
                    type="number"
                    min="0"
                    value={otherDirectCost}
                    onChange={(e) => setOtherDirectCost(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-brand-cream-50 rounded-lg border border-brand-plum-200 font-bold"
                  />
                </FormField>

                <FormField label="Overhead (₹)">
                  <input
                    type="number"
                    min="0"
                    value={allocatedOverhead}
                    onChange={(e) => setAllocatedOverhead(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-brand-cream-50 rounded-lg border border-brand-plum-200 font-bold"
                  />
                </FormField>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-brand-plum-900 hover:bg-brand-plum-950 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Recipe & Update Product Cost'}</span>
              </button>
            </div>
          </div>

          {/* Right 1 Col: Live Cost Breakdown & Pricing Reality Check */}
          <div className="bg-white rounded-2xl border border-brand-plum-100 p-6 shadow-sm space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-brand-plum-100">
                <FileText className="w-4 h-4 text-brand-rose-500" />
                <h3 className="text-sm font-bold text-brand-plum-950 font-['Outfit']">
                  Unit Cost Breakdown (BOM)
                </h3>
              </div>

              <div className="space-y-3 mt-4 text-xs">
                <div className="flex justify-between text-brand-plum-700">
                  <span>Raw Materials:</span>
                  <span className="font-bold">{formatINR(totalMaterialCost)}</span>
                </div>
                <div className="flex justify-between text-brand-plum-700">
                  <span>Direct Crochet Labor:</span>
                  <span className="font-bold">{formatINR(laborCost)}</span>
                </div>
                <div className="flex justify-between text-brand-plum-700">
                  <span>Packaging Box & Tags:</span>
                  <span className="font-bold">{formatINR(packagingCost)}</span>
                </div>
                <div className="flex justify-between text-brand-plum-700">
                  <span>Direct Sundries & Overhead:</span>
                  <span className="font-bold">{formatINR(Number(otherDirectCost) + Number(allocatedOverhead))}</span>
                </div>

                <div className="pt-3 border-t border-brand-plum-100 flex justify-between items-baseline">
                  <span className="font-extrabold text-sm text-brand-plum-950">Total Unit Cost:</span>
                  <span className="text-xl font-extrabold text-brand-plum-950 font-['Outfit']">
                    {formatINR(totalCalculatedCost)}
                  </span>
                </div>
              </div>

              {/* Compare with Current Selling Price */}
              <div className="mt-6 p-4 rounded-xl bg-brand-cream-100 border border-brand-plum-100 space-y-2 text-xs">
                <div className="flex justify-between text-brand-plum-700">
                  <span>Current Selling Price:</span>
                  <span className="font-bold">{formatINR(activeProduct.sellingPrice)}</span>
                </div>
                <div className="flex justify-between text-brand-plum-700">
                  <span>Profit per Unit Sold:</span>
                  <span className="font-bold text-brand-sage-700">
                    +{formatINR(activeProduct.sellingPrice - totalCalculatedCost)}
                  </span>
                </div>
                <div className="flex justify-between text-brand-plum-700 font-bold pt-1 border-t border-brand-plum-200">
                  <span>Gross Margin:</span>
                  <span className="text-brand-sage-700">
                    {activeProduct.sellingPrice > 0
                      ? Math.round(((activeProduct.sellingPrice - totalCalculatedCost) / activeProduct.sellingPrice) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenProduceBatch(selectedProductId)}
              className="w-full py-2.5 bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Hammer className="w-4 h-4" />
              <span>Produce Batch for {activeProduct.name}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
