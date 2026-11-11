/**
 * Wooly Bloom - Pricing Formula Engine
 * 
 * Blueprint Specification:
 * Suggested List Price = C / ((1 - m) * (1 - f) * (1 - d))
 * where:
 *   C = material cost + labor cost + packaging + other direct costs + allocated overhead
 *   Labor cost = labor minutes / 60 * hourly labor rate
 *   m = target margin rate (0 to < 1.0)
 *   f = platform fee rate (0 to < 1.0)
 *   d = discount rate (0 to < 1.0)
 */

/**
 * Calculates direct unit cost C
 */
export function calculateDirectCost({
  materialCost = 0,
  laborMinutes = 0,
  hourlyLaborRate = 0,
  packagingCost = 0,
  otherDirectCost = 0,
  allocatedOverhead = 0,
}) {
  const laborCost = (Math.max(0, Number(laborMinutes) || 0) / 60) * Math.max(0, Number(hourlyLaborRate) || 0);
  const totalCost = 
    Math.max(0, Number(materialCost) || 0) +
    laborCost +
    Math.max(0, Number(packagingCost) || 0) +
    Math.max(0, Number(otherDirectCost) || 0) +
    Math.max(0, Number(allocatedOverhead) || 0);

  return {
    laborCost: Math.round(laborCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

/**
 * Computes suggested list price, rounding, and achieved margin
 */
export function calculatePriceRecommendation({
  materialCost = 0,
  laborMinutes = 0,
  hourlyLaborRate = 0,
  packagingCost = 0,
  otherDirectCost = 0,
  allocatedOverhead = 0,
  targetMarginPct = 30,     // e.g. 30%
  feePct = 0,               // e.g. 5% platform/payment fee
  discountPct = 0,          // e.g. 10% expected promotional discount
  minimumMarginPct = 15,    // warning threshold
  roundingRule = 'nearest10', // 'none' | 'nearest5' | 'nearest10' | 'ceil10' | 'charm9' (e.g. 149, 199)
}) {
  const { laborCost, totalCost: C } = calculateDirectCost({
    materialCost,
    laborMinutes,
    hourlyLaborRate,
    packagingCost,
    otherDirectCost,
    allocatedOverhead,
  });

  if (C <= 0) {
    return {
      directCost: 0,
      laborCost: 0,
      suggestedPrice: 0,
      roundedPrice: 0,
      minimumPrice: 0,
      premiumPrice: 0,
      achievedMarginPct: 0,
      belowMinimum: false,
      isValid: false,
      errorMessage: 'Total cost must be greater than zero.',
    };
  }

  const m = Math.min(0.99, Math.max(0, Number(targetMarginPct) || 0) / 100);
  const minM = Math.min(0.99, Math.max(0, Number(minimumMarginPct) || 0) / 100);
  const premM = Math.min(0.99, Math.max(m + 0.15, 0.45)); // Premium tier (+15% margin)
  const f = Math.min(0.90, Math.max(0, Number(feePct) || 0) / 100);
  const d = Math.min(0.90, Math.max(0, Number(discountPct) || 0) / 100);

  const denominator = (1 - m) * (1 - f) * (1 - d);
  const minDenominator = (1 - minM) * (1 - f) * (1 - d);
  const premDenominator = (1 - premM) * (1 - f) * (1 - d);

  if (denominator <= 0.001) {
    return {
      directCost: C,
      laborCost,
      suggestedPrice: 0,
      roundedPrice: 0,
      minimumPrice: 0,
      premiumPrice: 0,
      achievedMarginPct: 0,
      belowMinimum: false,
      isValid: false,
      errorMessage: 'Margin, fee, and discount rates exceed sustainable limits.',
    };
  }

  const rawSuggestedPrice = C / denominator;
  const rawMinPrice = C / minDenominator;
  const rawPremPrice = C / premDenominator;

  const roundPrice = (price, rule) => {
    switch (rule) {
      case 'nearest5':
        return Math.round(price / 5) * 5;
      case 'nearest10':
        return Math.round(price / 10) * 10;
      case 'ceil10':
        return Math.ceil(price / 10) * 10;
      case 'charm9':
        return Math.floor(price / 10) * 10 + 9;
      case 'none':
      default:
        return Math.round(price);
    }
  };

  const roundedPrice = Math.max(1, roundPrice(rawSuggestedPrice, roundingRule));
  const roundedMinPrice = Math.max(1, roundPrice(rawMinPrice, roundingRule));
  const roundedPremPrice = Math.max(1, roundPrice(rawPremPrice, roundingRule));

  // Recompute achieved net margin after fee and discount on rounded price
  // Net revenue = Price * (1 - d) * (1 - f)
  // Net profit = Net revenue - C
  // Achieved margin = Net profit / Net revenue
  const netRevenue = roundedPrice * (1 - d) * (1 - f);
  const achievedMarginPct = netRevenue > 0 
    ? Math.round(((netRevenue - C) / netRevenue) * 1000) / 10 
    : 0;

  return {
    directCost: C,
    laborCost,
    suggestedPrice: Math.round(rawSuggestedPrice * 100) / 100,
    roundedPrice,
    minimumPrice: roundedMinPrice,
    premiumPrice: roundedPremPrice,
    achievedMarginPct,
    belowMinimum: roundedPrice < roundedMinPrice,
    isValid: true,
    formulaVersion: '1.0',
    disclaimer: 'Cost-based pricing recommendation based on standard assumptions; review local market conditions before finalizing.',
  };
}
