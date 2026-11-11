import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { databaseService } from '../services/databaseService.js';
import { calculateProfitAndLoss, calculateInventoryValuation } from '../domain/financialLedger.js';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Global Toast notification system
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Global Date range filter
  // Options: 'all' | 'today' | '7days' | '30days' | 'month' | 'year'
  const [dateFilter, setDateFilter] = useState('all');

  const refreshData = useCallback(async () => {
    try {
      const [mats, prods, recs, custs, sls, ords, exps, pays] = await Promise.all([
        databaseService.getRawMaterials(),
        databaseService.getProducts(),
        databaseService.getRecipes(),
        databaseService.getCustomers(),
        databaseService.getSales(),
        databaseService.getOrders(),
        databaseService.getExpenses(),
        databaseService.getPayments(),
      ]);

      setRawMaterials(mats);
      setProducts(prods);
      setRecipes(recs);
      setCustomers(custs);
      setSales(sls);
      setOrders(ords);
      setExpenses(exps);
      setPayments(pays);
    } catch (err) {
      console.error('Failed to load business data:', err);
      showToast('error', `Failed to sync ledger: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshData();
    const unsubscribe = databaseService.subscribe(() => {
      refreshData();
    });
    return unsubscribe;
  }, [refreshData]);

  // Date filtered datasets
  const filteredSales = useMemo(() => {
    if (dateFilter === 'all') return sales;
    const now = new Date();
    return sales.filter(s => {
      const d = new Date(s.date);
      if (dateFilter === 'today') return d.toDateString() === now.toDateString();
      if (dateFilter === '7days') return (now - d) <= 7 * 24 * 60 * 60 * 1000;
      if (dateFilter === '30days') return (now - d) <= 30 * 24 * 60 * 60 * 1000;
      if (dateFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (dateFilter === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [sales, dateFilter]);

  const filteredExpenses = useMemo(() => {
    if (dateFilter === 'all') return expenses;
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (dateFilter === 'today') return d.toDateString() === now.toDateString();
      if (dateFilter === '7days') return (now - d) <= 7 * 24 * 60 * 60 * 1000;
      if (dateFilter === '30days') return (now - d) <= 30 * 24 * 60 * 60 * 1000;
      if (dateFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (dateFilter === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [expenses, dateFilter]);

  // Live P&L and Valuation
  const pnl = useMemo(() => {
    return calculateProfitAndLoss({
      sales: filteredSales,
      expenses: filteredExpenses,
      payments,
    });
  }, [filteredSales, filteredExpenses, payments]);

  const inventoryValuation = useMemo(() => {
    return calculateInventoryValuation(rawMaterials, products);
  }, [rawMaterials, products]);

  // Low stock alerts
  const lowStockMaterials = useMemo(() => {
    return rawMaterials.filter(m => Number(m.stockQuantity) <= Number(m.reorderThreshold || 5));
  }, [rawMaterials]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => Number(p.stockQuantity) <= Number(p.reorderThreshold || 2));
  }, [products]);

  // Pending custom orders
  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  }, [orders]);

  // Action methods
  const recordPurchase = async (data) => {
    try {
      const updated = await databaseService.recordMaterialPurchase(data);
      showToast('success', `Added ${data.quantity} units to inventory at ₹${data.unitCost}/unit.`);
      return updated;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const produceBatch = async (data) => {
    try {
      const batch = await databaseService.executeProductionBatch(data);
      showToast('success', `Batch ${batch.batchNumber} completed! Added ${batch.quantityProduced} finished units.`);
      return batch;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const createSale = async (data) => {
    try {
      const sale = await databaseService.createSale(data);
      showToast('success', `Invoice ${sale.invoiceNumber} finalized successfully!`);
      return sale;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const recordPayment = async (data) => {
    try {
      const updated = await databaseService.recordInvoicePayment(data);
      showToast('success', `Payment of ₹${data.amount} recorded.`);
      return updated;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const createOrder = async (data) => {
    try {
      const order = await databaseService.createOrder(data);
      showToast('success', `Custom order ${order.orderNumber} created!`);
      return order;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const addExpense = async (data) => {
    try {
      const exp = await databaseService.addExpense(data);
      showToast('success', `Operating expense of ₹${exp.amount} recorded.`);
      return exp;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const deleteRawMaterial = async (id) => {
    try {
      const deleted = await databaseService.deleteRawMaterial(id);
      showToast('info', `Material "${deleted.name}" deleted.`);
      return deleted;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const deleted = await databaseService.deleteProduct(id);
      showToast('info', `Product "${deleted.name}" deleted.`);
      return deleted;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const deleteOrder = async (id) => {
    try {
      const deleted = await databaseService.deleteOrder(id);
      showToast('info', `Order "${deleted.orderNumber || id}" deleted.`);
      return deleted;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      const deleted = await databaseService.deleteCustomer(id);
      showToast('info', `Customer "${deleted.name || id}" deleted.`);
      return deleted;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const deleteExpense = async (id) => {
    try {
      const deleted = await databaseService.deleteExpense(id);
      showToast('info', `Expense deleted.`);
      return deleted;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const deleteSale = async (id) => {
    try {
      const deleted = await databaseService.deleteSale(id);
      showToast('info', `Invoice "${deleted.invoiceNumber || id}" deleted.`);
      return deleted;
    } catch (err) {
      showToast('error', err.message);
      throw err;
    }
  };

  const resetAllData = async () => {
    try {
      await databaseService.clearAllData();
      showToast('info', 'All data cleared. Store is fresh and clean.');
    } catch (err) {
      showToast('error', err.message);
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        rawMaterials,
        products,
        recipes,
        customers,
        sales: filteredSales,
        allSales: sales,
        orders,
        pendingOrders,
        expenses: filteredExpenses,
        payments,
        pnl,
        inventoryValuation,
        lowStockMaterials,
        lowStockProducts,
        dateFilter,
        setDateFilter,
        loading,
        toasts,
        showToast,
        removeToast,
        recordPurchase,
        produceBatch,
        createSale,
        recordPayment,
        createOrder,
        addExpense,
        deleteRawMaterial,
        deleteProduct,
        deleteOrder,
        deleteCustomer,
        deleteExpense,
        deleteSale,
        resetAllData,
        refreshData,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within a BusinessProvider');
  return context;
}
