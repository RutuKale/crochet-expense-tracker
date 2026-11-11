import { describe, it, expect } from 'vitest';
import { calculatePriceRecommendation, calculateDirectCost } from '../pricing.js';
import { calculateProfitAndLoss, calculateInventoryValuation } from '../financialLedger.js';
import { formatINR, toPaise, toRupees } from '../formatters.js';

describe('Pricing Engine Calculations', () => {
  it('calculates direct cost accurately with labor and materials', () => {
    // 30 mins labor at ₹200/hr = ₹100
    // Material: ₹150, Packaging: ₹20, Overhead: ₹30
    // Total = ₹300
    const cost = calculateDirectCost({
      materialCost: 150,
      laborMinutes: 30,
      hourlyLaborRate: 200,
      packagingCost: 20,
      otherDirectCost: 0,
      allocatedOverhead: 30,
    });

    expect(cost.laborCost).toBe(100);
    expect(cost.totalCost).toBe(300);
  });

  it('computes suggested list price with target margin, fee, and discount', () => {
    // C = 300, m = 20% (0.2), f = 5% (0.05), d = 10% (0.1)
    // Suggested = 300 / ((1 - 0.2) * (1 - 0.05) * (1 - 0.1))
    // Denominator = 0.8 * 0.95 * 0.9 = 0.684
    // Suggested = 300 / 0.684 = 438.596 -> rounded nearest 10 = 440
    const rec = calculatePriceRecommendation({
      materialCost: 150,
      laborMinutes: 30,
      hourlyLaborRate: 200,
      packagingCost: 20,
      allocatedOverhead: 30,
      targetMarginPct: 20,
      feePct: 5,
      discountPct: 10,
      roundingRule: 'nearest10',
    });

    expect(rec.directCost).toBe(300);
    expect(rec.suggestedPrice).toBeCloseTo(438.6, 1);
    expect(rec.roundedPrice).toBe(440);
    expect(rec.achievedMarginPct).toBeGreaterThan(19);
    expect(rec.isValid).toBe(true);
  });

  it('flags warning when price is below minimum margin', () => {
    const rec = calculatePriceRecommendation({
      materialCost: 200,
      laborMinutes: 60,
      hourlyLaborRate: 100,
      targetMarginPct: 5,
      minimumMarginPct: 20,
      roundingRule: 'none',
    });

    expect(rec.belowMinimum).toBe(true);
  });
});

describe('Financial Ledger & P&L Engine', () => {
  it('correctly calculates Net Sales, COGS, Gross Profit, and Net Operating Profit', () => {
    const sales = [
      {
        id: 's1',
        subtotal: 1000,
        shippingCharged: 50,
        discountAmount: 100,
        refundedAmount: 0,
        totalCogs: 400,
        balanceAmount: 200,
        status: 'completed',
      },
      {
        id: 's2',
        subtotal: 500,
        shippingCharged: 0,
        discountAmount: 0,
        refundedAmount: 50,
        totalCogs: 200,
        balanceAmount: 0,
        status: 'refunded_partial',
      }
    ];

    const expenses = [
      { id: 'e1', amount: 150, category: 'Packaging Supplies', isInventoryPurchase: false },
      { id: 'e2', amount: 500, category: 'Yarn Lot Purchase', isInventoryPurchase: true }, // Should be excluded from OpEx!
    ];

    const payments = [
      { id: 'p1', amount: 750, type: 'payment' },
      { id: 'p2', amount: 500, type: 'payment' },
      { id: 'p3', amount: 50, type: 'refund' },
    ];

    const pnl = calculateProfitAndLoss({ sales, expenses, payments });

    // Gross Sales = (1000 + 50) + (500 + 0) = 1550
    expect(pnl.grossSales).toBe(1550);
    // Net Sales = 1550 - 100 - 50 = 1400
    expect(pnl.netSales).toBe(1400);
    // COGS = 400 + 200 = 600
    expect(pnl.cogs).toBe(600);
    // Gross Profit = 1400 - 600 = 800
    expect(pnl.grossProfit).toBe(800);
    // Operating Expenses = 150 (500 inventory purchase excluded!)
    expect(pnl.operatingExpenses).toBe(150);
    // Net Operating Profit = 800 - 150 = 650
    expect(pnl.netOperatingProfit).toBe(650);
    // Cash received = 750 + 500 - 50 = 1200
    expect(pnl.cashReceived).toBe(1200);
    // Receivables = 200
    expect(pnl.receivables).toBe(200);
  });

  it('calculates inventory valuation for raw and finished stock', () => {
    const raw = [
      { stockQuantity: 500, averageUnitCost: 2 }, // 1000
      { stockQuantity: 10, averageUnitCost: 50 },  // 500
    ];
    const products = [
      { stockQuantity: 5, costPerUnit: 250 },     // 1250
    ];

    const val = calculateInventoryValuation(raw, products);
    expect(val.rawMaterialsValuation).toBe(1500);
    expect(val.finishedProductsValuation).toBe(1250);
    expect(val.totalInventoryValuation).toBe(2750);
  });

  it('preserves exact totalCost valuation preventing 1 rupee rounding discrepancy', () => {
    // 200g for Rs 220 + 500g for Rs 150 = 700g for exact Rs 370
    // (If rounded unit cost 0.53 were multiplied by 700, it would incorrectly give 371)
    const raw = [
      { stockQuantity: 700, averageUnitCost: 0.52857142857, totalCost: 370 },
    ];
    const val = calculateInventoryValuation(raw, []);
    expect(val.rawMaterialsValuation).toBe(370);
    expect(val.totalInventoryValuation).toBe(370);
  });
});

describe('Formatters and Conversions', () => {
  it('converts correctly between paise and rupees', () => {
    expect(toPaise(120.50)).toBe(12050);
    expect(toRupees(12050)).toBe(120.50);
    expect(formatINR(120.5)).toBe('₹120.50');
    expect(formatINR(5000)).toBe('₹5,000');
  });
});
