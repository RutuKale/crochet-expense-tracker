import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { databaseService } from '../../services/databaseService.js';
import { calculatePriceRecommendation } from '../../domain/pricing.js';
import { formatINR } from '../../domain/formatters.js';
import { 
  Calculator, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Sliders
} from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';
import FormField from '../common/FormField.jsx';

export default function PriceCalculatorView() {
  const { products, showToast } = useBusiness();
  const { businessProfile } = useAuth();

  const pricingDefaults = businessProfile?.pricingDefaults || {};

  // Form Inputs
  const [materialCost, setMaterialCost] = useState(150);
  const [laborMinutes, setLaborMinutes] = useState(90); // 1.5 hrs
  const [hourlyLaborRate, setHourlyLaborRate] = useState(pricingDefaults.hourlyLaborRate || 250);
  const [packagingCost, setPackagingCost] = useState(35);
  const [otherDirectCost, setOtherDirectCost] = useState(15);
  const [allocatedOverhead, setAllocatedOverhead] = useState(20);

  const [targetMarginPct, setTargetMarginPct] = useState(pricingDefaults.targetMarginPct || 35);
  const [minimumMarginPct, setMinimumMarginPct] = useState(pricingDefaults.minimumMarginPct || 20);
  const [feePct, setFeePct] = useState(pricingDefaults.platformFeePct || 3);
  const [discountPct, setDiscountPct] = useState(pricingDefaults.discountPct || 5);
  const [roundingRule, setRoundingRule] = useState(pricingDefaults.roundingRule || 'nearest10');

  // Product linking state
  const [selectedProductId, setSelectedProductId] = useState('');

  // Live computation
  const result = useMemo(() => {
    return calculatePriceRecommendation({
      materialCost: Number(materialCost) || 0,
      laborMinutes: Number(laborMinutes) || 0,
      hourlyLaborRate: Number(hourlyLaborRate) || 0,
      packagingCost: Number(packagingCost) || 0,
      otherDirectCost: Number(otherDirectCost) || 0,
      allocatedOverhead: Number(allocatedOverhead) || 0,
      targetMarginPct: Number(targetMarginPct) || 30,
      minimumMarginPct: Number(minimumMarginPct) || 15,
      feePct: Number(feePct) || 0,
      discountPct: Number(discountPct) || 0,
      roundingRule,
    });
  }, [
    materialCost, 
    laborMinutes, 
    hourlyLaborRate, 
    packagingCost, 
    otherDirectCost, 
    allocatedOverhead, 
    targetMarginPct, 
    minimumMarginPct, 
    feePct, 
    discountPct, 
    roundingRule
  ]);

  const handleApplyToProduct = async () => {
    if (!selectedProductId) return;
    try {
      const prod = products.find(p => p.id === selectedProductId);
      if (!prod) return;

      await databaseService.updateProduct(prod.id, {
        sellingPrice: result.roundedPrice,
        costPerUnit: result.directCost,
      });

      showToast('success', `Updated "${prod.name}" selling price to ${formatINR(result.roundedPrice)}.`);
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const loadFromProduct = (prodId) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setMaterialCost(Math.round(prod.costPerUnit * 0.45));
      setLaborMinutes(prod.hourlyLaborMinutes || 60);
      setPackagingCost(25);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scientific Cost-Based Price Calculator"
        subtitle="Mathematical list price recommendation preserving your target profit margins after platform fees and discounts."
      />

      {/* Quick Autofill Selector */}
      <div className="bg-white p-4 rounded-2xl border border-brand-plum-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-rose-500" />
          <span className="text-xs font-bold text-brand-plum-950 uppercase tracking-wider">
            Autofill Assumptions from Existing Design:
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedProductId}
            onChange={(e) => loadFromProduct(e.target.value)}
            className="w-full sm:w-72 px-3 py-1.5 text-xs bg-brand-cream-50 rounded-xl border border-brand-plum-200 font-medium text-brand-plum-950"
          >
            <option value="">-- Choose a Product --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (Current: {formatINR(p.sellingPrice)})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Inputs */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-brand-plum-100 p-6 shadow-sm space-y-6">
          <div className="pb-3 border-b border-brand-plum-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-plum-950 uppercase tracking-wider">
              1. Direct Crafting Costs (C)
            </h3>
            <span className="text-xs font-mono font-bold text-brand-plum-700 bg-brand-cream-100 px-2 py-0.5 rounded">
              Base Cost C: {formatINR(result.directCost)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Raw Materials (₹)" hint="Yarn, stuffing, eyes, hardware">
              <input
                type="number"
                min="0"
                value={materialCost}
                onChange={(e) => setMaterialCost(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 font-bold text-brand-plum-950"
              />
            </FormField>

            <FormField label="Crochet Labor Minutes" hint={`@ ₹${hourlyLaborRate}/hr = ${formatINR(result.laborCost)}`}>
              <input
                type="number"
                min="0"
                value={laborMinutes}
                onChange={(e) => setLaborMinutes(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 font-bold text-brand-plum-950"
              />
            </FormField>

            <FormField label="Hourly Labor Rate (₹/hr)">
              <input
                type="number"
                min="0"
                value={hourlyLaborRate}
                onChange={(e) => setHourlyLaborRate(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 font-bold text-brand-plum-950"
              />
            </FormField>

            <FormField label="Packaging & Box (₹)">
              <input
                type="number"
                min="0"
                value={packagingCost}
                onChange={(e) => setPackagingCost(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 font-bold text-brand-plum-950"
              />
            </FormField>

            <FormField label="Other Direct (₹)">
              <input
                type="number"
                min="0"
                value={otherDirectCost}
                onChange={(e) => setOtherDirectCost(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 text-brand-plum-950"
              />
            </FormField>

            <FormField label="Allocated Overhead (₹)">
              <input
                type="number"
                min="0"
                value={allocatedOverhead}
                onChange={(e) => setAllocatedOverhead(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 text-brand-plum-950"
              />
            </FormField>
          </div>

          <div className="pb-3 border-b border-brand-plum-100 flex items-center justify-between pt-2">
            <h3 className="text-sm font-bold text-brand-plum-950 uppercase tracking-wider">
              2. Margin & Deductions Rates
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <FormField label="Target Margin %">
              <input
                type="number"
                min="0"
                max="95"
                value={targetMarginPct}
                onChange={(e) => setTargetMarginPct(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 font-bold text-brand-plum-950 text-center"
              />
            </FormField>

            <FormField label="Min Margin %">
              <input
                type="number"
                min="0"
                max="95"
                value={minimumMarginPct}
                onChange={(e) => setMinimumMarginPct(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 font-bold text-brand-plum-950 text-center"
              />
            </FormField>

            <FormField label="Platform Fee %">
              <input
                type="number"
                min="0"
                max="50"
                value={feePct}
                onChange={(e) => setFeePct(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 font-bold text-brand-plum-950 text-center"
              />
            </FormField>

            <FormField label="Expected Disc. %">
              <input
                type="number"
                min="0"
                max="50"
                value={discountPct}
                onChange={(e) => setDiscountPct(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 font-bold text-brand-plum-950 text-center"
              />
            </FormField>
          </div>

          <FormField label="Price Rounding Strategy">
            <select
              value={roundingRule}
              onChange={(e) => setRoundingRule(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 font-medium"
            >
              <option value="nearest10">Round to nearest ₹10 (e.g. ₹440) [Recommended]</option>
              <option value="nearest5">Round to nearest ₹5 (e.g. ₹435)</option>
              <option value="charm9">Charm Pricing ending in 9 (e.g. ₹449, ₹499)</option>
              <option value="ceil10">Round UP to nearest ₹10 (e.g. ₹450)</option>
              <option value="none">No rounding (Exact paise)</option>
            </select>
          </FormField>
        </div>

        {/* Right 5 Cols: Mathematical Scenarios & Recommendation */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Recommendation Card */}
          <div className="bg-gradient-to-br from-brand-plum-900 to-brand-plum-950 text-white rounded-2xl p-6 shadow-xl border border-brand-plum-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-rose-300">
                Recommended List Price
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-rose-500/20 text-brand-rose-200 border border-brand-rose-400/30">
                Formula v1.0
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-['Outfit'] tracking-tight text-white">
                {formatINR(result.roundedPrice)}
              </span>
              <span className="text-xs text-brand-plum-300">
                (raw: {formatINR(result.suggestedPrice)})
              </span>
            </div>

            <div className="p-3 bg-white/10 rounded-xl text-xs space-y-1.5 backdrop-blur-xs">
              <div className="flex justify-between text-brand-plum-200">
                <span>Direct Unit Cost (C):</span>
                <span className="font-bold text-white">{formatINR(result.directCost)}</span>
              </div>
              <div className="flex justify-between text-brand-plum-200">
                <span>Achieved Margin after fees & discount:</span>
                <span className="font-extrabold text-brand-sage-300">{result.achievedMarginPct}%</span>
              </div>
            </div>

            {/* Apply Button */}
            {selectedProductId && (
              <button
                onClick={handleApplyToProduct}
                className="w-full py-2.5 bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Price to Selected Design</span>
              </button>
            )}
          </div>

          {/* Scenario Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-4 bg-white rounded-2xl border border-brand-plum-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-brand-plum-500 uppercase">Minimum Floor</span>
              <p className="text-xl font-extrabold text-brand-plum-950 font-['Outfit']">
                {formatINR(result.minimumPrice)}
              </p>
              <p className="text-[10px] text-brand-plum-400">At {minimumMarginPct}% safety margin</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-brand-plum-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-brand-plum-500 uppercase">Premium Tier</span>
              <p className="text-xl font-extrabold text-brand-plum-950 font-['Outfit']">
                {formatINR(result.premiumPrice)}
              </p>
              <p className="text-[10px] text-brand-plum-400">At higher artisan margin</p>
            </div>
          </div>

          {/* Blueprint Formula Documentation Note */}
          <div className="p-4 bg-brand-cream-100 rounded-2xl border border-brand-plum-100 text-xs text-brand-plum-800 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-brand-plum-950">
              <Info className="w-4 h-4 text-brand-rose-600" />
              <span>Blueprint Costing Formula</span>
            </div>
            <p className="font-mono text-[11px] text-brand-plum-900 bg-white p-2 rounded-lg border border-brand-plum-200">
              List Price = C / ((1 - m) × (1 - f) × (1 - d))
            </p>
            <p className="text-[11px] text-brand-plum-600 leading-relaxed">
              Guarantees that after platform commission (f) and customer promo discounts (d) are deducted from gross invoice, your studio retains at least margin (m).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
