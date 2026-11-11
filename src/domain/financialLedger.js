/**
 * Wooly Bloom - Financial Ledger & Reconciliation Engine
 * Strictly follows the financial definitions on Page 22 of the Blueprint.
 */

/**
 * Computes P&L summary from transaction lists over a given period
 */
export function calculateProfitAndLoss({
  sales = [],
  expenses = [],
  payments = [],
}) {
  // 1. Filter out voided sales
  const validSales = sales.filter(s => s.status !== 'voided');

  // 2. Gross Sales = Sum of finalized sale line totals before discounts
  const grossSales = validSales.reduce((acc, sale) => {
    const subtotal = Number(sale.subtotal) || 0;
    const shipping = Number(sale.shippingCharged) || 0;
    return acc + subtotal + shipping;
  }, 0);

  // Total discounts given
  const totalDiscounts = validSales.reduce((acc, s) => acc + (Number(s.discountAmount) || 0), 0);

  // Sales refunds
  const totalRefunds = validSales.reduce((acc, s) => acc + (Number(s.refundedAmount) || 0), 0);

  // Net sales = Gross sales - discounts - refunds
  const netSales = Math.max(0, grossSales - totalDiscounts - totalRefunds);

  // 3. COGS = Cost of goods sold for units sold
  const totalCogs = validSales.reduce((acc, sale) => {
    const saleCogs = Number(sale.totalCogs) || 0;
    return acc + saleCogs;
  }, 0);

  // 4. Gross Profit = Net Sales - COGS
  const grossProfit = netSales - totalCogs;
  const grossMarginPct = netSales > 0 ? Math.round((grossProfit / netSales) * 1000) / 10 : 0;

  // 5. Operating Expenses:
  // EXCLUDES raw material inventory purchases (which are held on balance sheet as assets)
  const validExpenses = expenses.filter(e => !e.isInventoryPurchase && e.status !== 'voided');
  const totalOperatingExpenses = validExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // Breakdown by category
  const expensesByCategory = validExpenses.reduce((acc, exp) => {
    const cat = exp.category || 'General';
    acc[cat] = (acc[cat] || 0) + (Number(exp.amount) || 0);
    return acc;
  }, {});

  // 6. Net Operating Profit = Gross Profit - Operating Expenses
  const netOperatingProfit = grossProfit - totalOperatingExpenses;
  const netProfitMarginPct = netSales > 0 ? Math.round((netOperatingProfit / netSales) * 1000) / 10 : 0;

  // 7. Cash Received = Payments received during period (independent of accrual sales)
  const totalCashReceived = payments.reduce((acc, p) => {
    if (p.type === 'refund') {
      return acc - (Number(p.amount) || 0);
    }
    return acc + (Number(p.amount) || 0);
  }, 0);

  // 8. Accounts Receivable = Unpaid balances on finalized invoices
  const totalReceivables = validSales.reduce((acc, s) => acc + (Number(s.balanceAmount) || 0), 0);

  return {
    grossSales: Math.round(grossSales * 100) / 100,
    discounts: Math.round(totalDiscounts * 100) / 100,
    refunds: Math.round(totalRefunds * 100) / 100,
    netSales: Math.round(netSales * 100) / 100,
    cogs: Math.round(totalCogs * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossMarginPct,
    operatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
    expensesByCategory,
    netOperatingProfit: Math.round(netOperatingProfit * 100) / 100,
    netProfitMarginPct,
    cashReceived: Math.round(totalCashReceived * 100) / 100,
    receivables: Math.round(totalReceivables * 100) / 100,
    orderCount: validSales.length,
  };
}

/**
 * Calculates total valuation of current raw materials and finished products
 */
export function calculateInventoryValuation(rawMaterials = [], products = []) {
  const rawValuation = rawMaterials.reduce((acc, m) => {
    if (m.totalCost !== undefined && m.totalCost !== null && !isNaN(Number(m.totalCost))) {
      return acc + Number(m.totalCost);
    }
    const qty = Number(m.stockQuantity) || 0;
    const unitCost = Number(m.averageUnitCost) || 0;
    return acc + (qty * unitCost);
  }, 0);

  const finishedValuation = products.reduce((acc, p) => {
    const qty = Number(p.stockQuantity) || 0;
    const unitCost = Number(p.costPerUnit) || 0;
    return acc + (qty * unitCost);
  }, 0);

  return {
    rawMaterialsValuation: Math.round(rawValuation * 100) / 100,
    finishedProductsValuation: Math.round(finishedValuation * 100) / 100,
    totalInventoryValuation: Math.round((rawValuation + finishedValuation) * 100) / 100,
  };
}
