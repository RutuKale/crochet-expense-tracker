/**
 * Wooly Bloom - Unified Cloud Firestore & Responsive Ledger Service
 * 
 * Provides complete CRUD operations directly backed by Google Cloud Firestore.
 * Implements real-time collection synchronization (onSnapshot), atomic batch operations,
 * and optimistic local ledger mirroring for ultra-responsive UI updates.
 */

import { INITIAL_BUSINESS_PROFILE } from './seedData.js';
import { db, isFirebaseConfigured } from './firebase.js';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  onSnapshot
} from 'firebase/firestore';

const STORAGE_PREFIX = 'wooly_bloom_ledger_';

/**
 * Removes undefined values and ensures proper JSON serialization for Firestore.
 */
function cleanFirestoreData(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item);
  }
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
        cleaned[key] = cleanFirestoreData(val);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned;
}

class DatabaseService {
  constructor() {
    this.businessId = INITIAL_BUSINESS_PROFILE.id;
    this.subscribers = new Set();
    this.unsubscribeListeners = [];
    this.initLocalStorage();

    if (isFirebaseConfigured && db) {
      this.initFirestoreListeners();
    }
  }

  // Subscribe to changes for live UI reactivity across React components
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(cb => {
      try { cb(); } catch (err) { console.error('Notify subscriber error:', err); }
    });
  }

  // Initialize and clear out legacy static sample data
  initLocalStorage() {
    try {
      const isLiveV2 = localStorage.getItem(`${STORAGE_PREFIX}live_firebase_v2`);
      if (!isLiveV2) {
        // Purge old static sample mock items from local storage
        const collections = [
          'rawMaterials', 'products', 'recipes', 'customers', 
          'sales', 'orders', 'expenses', 'materialMovements', 
          'finishedStockMovements', 'productionBatches', 'payments'
        ];
        collections.forEach(col => {
          localStorage.setItem(`${STORAGE_PREFIX}${col}`, JSON.stringify([]));
        });
        localStorage.setItem(`${STORAGE_PREFIX}live_firebase_v2`, 'true');
      }

      if (!localStorage.getItem(`${STORAGE_PREFIX}profile`)) {
        localStorage.setItem(`${STORAGE_PREFIX}profile`, JSON.stringify(INITIAL_BUSINESS_PROFILE));
      }
    } catch (e) {
      console.warn('LocalStorage access warning:', e);
    }
  }

  // Set up real-time onSnapshot listeners for live multi-tab & multi-device sync
  initFirestoreListeners() {
    const collections = [
      'rawMaterials',
      'products',
      'recipes',
      'customers',
      'sales',
      'orders',
      'expenses',
      'payments',
      'productionBatches',
      'materialMovements',
      'finishedStockMovements'
    ];

    collections.forEach(colName => {
      try {
        const unsub = onSnapshot(collection(db, colName), (snapshot) => {
          const items = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

          // Sort by creation or completion date descending
          items.sort((a, b) => {
            const timeA = new Date(a.createdAt || a.date || a.completedAt || 0).getTime();
            const timeB = new Date(b.createdAt || b.date || b.completedAt || 0).getTime();
            return timeB - timeA;
          });

          this.setLocal(colName, items, false);
          this.notify();
        }, (error) => {
          console.warn(`Firestore onSnapshot error for [${colName}]:`, error.message);
        });

        this.unsubscribeListeners.push(unsub);
      } catch (err) {
        console.warn(`Could not attach listener for [${colName}]:`, err.message);
      }
    });

    // Listen to business profile document
    try {
      const unsubProfile = onSnapshot(doc(db, 'businesses', this.businessId), (snap) => {
        if (snap.exists()) {
          const profileData = { id: snap.id, ...snap.data() };
          localStorage.setItem(`${STORAGE_PREFIX}profile`, JSON.stringify(profileData));
          this.notify();
        }
      }, (err) => {
        console.warn('Profile onSnapshot error:', err.message);
      });
      this.unsubscribeListeners.push(unsubProfile);
    } catch (err) {
      console.warn('Could not attach profile listener:', err.message);
    }
  }

  // Local storage cache helpers
  getLocal(collectionName) {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${collectionName}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  setLocal(collectionName, items, shouldNotify = true) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${collectionName}`, JSON.stringify(items));
    } catch (e) {
      console.warn('SetLocal error:', e);
    }
    if (shouldNotify) {
      this.notify();
    }
  }

  // --------------------------------------------------------------------------
  // BUSINESS PROFILE & SETTINGS
  // --------------------------------------------------------------------------

  async getBusinessProfile() {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'businesses', this.businessId));
        if (snap.exists()) {
          const profile = { id: snap.id, ...snap.data() };
          localStorage.setItem(`${STORAGE_PREFIX}profile`, JSON.stringify(profile));
          return profile;
        } else {
          // Initialize in Firestore with clean defaults
          const initProfile = { ...INITIAL_BUSINESS_PROFILE, id: this.businessId };
          await setDoc(doc(db, 'businesses', this.businessId), cleanFirestoreData(initProfile));
          localStorage.setItem(`${STORAGE_PREFIX}profile`, JSON.stringify(initProfile));
          return initProfile;
        }
      } catch (err) {
        console.warn('Firestore profile fetch fallback to local:', err.message);
      }
    }
    const profile = localStorage.getItem(`${STORAGE_PREFIX}profile`);
    return profile ? JSON.parse(profile) : INITIAL_BUSINESS_PROFILE;
  }

  async updateBusinessProfile(updates) {
    const current = await this.getBusinessProfile();
    const updated = { 
      ...current, 
      ...updates, 
      id: this.businessId,
      updatedAt: new Date().toISOString() 
    };
    
    localStorage.setItem(`${STORAGE_PREFIX}profile`, JSON.stringify(updated));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'businesses', this.businessId), cleanFirestoreData(updated), { merge: true });
      } catch (err) {
        console.warn('Firestore update profile error:', err.message);
      }
    }

    this.notify();
    return updated;
  }

  // --------------------------------------------------------------------------
  // RAW MATERIALS & SUPPLIES (CRUD)
  // --------------------------------------------------------------------------

  async getRawMaterials() {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'rawMaterials'));
        const materials = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        materials.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        this.setLocal('rawMaterials', materials, false);
        return materials;
      } catch (err) {
        console.warn('Firestore getRawMaterials fallback to local:', err.message);
      }
    }
    return this.getLocal('rawMaterials');
  }

  async addRawMaterial(material) {
    const qty = Number(material.stockQuantity) || 0;
    const totCost = material.totalCost !== undefined && material.totalCost !== null && !isNaN(Number(material.totalCost))
      ? Number(material.totalCost)
      : Math.round(qty * (Number(material.averageUnitCost) || 0) * 100) / 100;
    const unitCost = qty > 0 ? (totCost / qty) : (Number(material.averageUnitCost) || 0);

    const newMaterial = {
      ...material,
      id: material.id || `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      stockQuantity: qty,
      totalCost: totCost,
      averageUnitCost: unitCost,
      reorderThreshold: Number(material.reorderThreshold) || 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'rawMaterials', newMaterial.id), cleanFirestoreData(newMaterial));
      } catch (err) {
        console.error('Firestore addRawMaterial error:', err);
        throw new Error(`Failed to save raw material to Firestore: ${err.message}`);
      }
    }

    const materials = this.getLocal('rawMaterials');
    materials.unshift(newMaterial);
    this.setLocal('rawMaterials', materials);
    return newMaterial;
  }

  async updateRawMaterial(id, updates) {
    const materials = this.getLocal('rawMaterials');
    const index = materials.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Material not found');

    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.stockQuantity !== undefined) cleanUpdates.stockQuantity = Number(updates.stockQuantity);
    if (updates.totalCost !== undefined) cleanUpdates.totalCost = Number(updates.totalCost);
    if (updates.averageUnitCost !== undefined) cleanUpdates.averageUnitCost = Number(updates.averageUnitCost);
    if (updates.reorderThreshold !== undefined) cleanUpdates.reorderThreshold = Number(updates.reorderThreshold);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'rawMaterials', id), cleanFirestoreData(cleanUpdates));
      } catch (err) {
        console.error('Firestore updateRawMaterial error:', err);
        throw new Error(`Failed to update raw material in Firestore: ${err.message}`);
      }
    }

    materials[index] = { ...materials[index], ...cleanUpdates };
    this.setLocal('rawMaterials', materials);
    return materials[index];
  }

  async deleteRawMaterial(id) {
    const materials = this.getLocal('rawMaterials');
    const index = materials.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Material not found');

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'rawMaterials', id));
      } catch (err) {
        console.error('Firestore deleteRawMaterial error:', err);
        throw new Error(`Failed to delete raw material from Firestore: ${err.message}`);
      }
    }

    const deleted = materials.splice(index, 1)[0];
    this.setLocal('rawMaterials', materials);
    return deleted;
  }

  // Record Material Purchase: Increases stock & updates weighted average cost
  async recordMaterialPurchase({ materialId, quantity, unitCost, totalCost, supplier, notes, purchaseDate }) {
    const qty = Number(quantity);
    const cost = Number(unitCost);
    if (qty <= 0 || cost < 0) throw new Error('Quantity and cost must be positive');

    const materials = this.getLocal('rawMaterials');
    const index = materials.findIndex(m => m.id === materialId);
    if (index === -1) throw new Error('Material not found');

    const m = materials[index];
    const currentQty = Number(m.stockQuantity) || 0;
    const currentCost = Number(m.averageUnitCost) || 0;
    const currentTotalCost = m.totalCost !== undefined && m.totalCost !== null && !isNaN(Number(m.totalCost))
      ? Number(m.totalCost)
      : Math.round(currentQty * currentCost * 100) / 100;

    const purchaseTotalCost = totalCost !== undefined && totalCost !== null && !isNaN(Number(totalCost))
      ? Number(totalCost)
      : Math.round(qty * cost * 100) / 100;

    // Weighted average cost basis calculation
    const totalNewQty = currentQty + qty;
    const newTotalCost = Math.round((currentTotalCost + purchaseTotalCost) * 100) / 100;
    const newAverageCost = totalNewQty > 0
      ? (newTotalCost / totalNewQty)
      : cost;

    const materialUpdates = {
      stockQuantity: totalNewQty,
      totalCost: newTotalCost,
      averageUnitCost: newAverageCost,
      supplier: supplier || m.supplier || '',
      updatedAt: new Date().toISOString(),
    };

    const movement = {
      id: `mov_mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      materialId,
      materialName: m.name,
      type: 'purchase',
      quantityDelta: qty,
      unitCost: qty > 0 ? (purchaseTotalCost / qty) : cost,
      totalCost: purchaseTotalCost,
      date: purchaseDate || new Date().toISOString(),
      supplier: supplier || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'rawMaterials', materialId), cleanFirestoreData(materialUpdates));
        batch.set(doc(db, 'materialMovements', movement.id), cleanFirestoreData(movement));
        await batch.commit();
      } catch (err) {
        console.error('Firestore recordMaterialPurchase error:', err);
        throw new Error(`Failed to record purchase in Firestore: ${err.message}`);
      }
    }

    materials[index] = { ...m, ...materialUpdates };
    this.setLocal('rawMaterials', materials);

    const movements = this.getLocal('materialMovements');
    movements.unshift(movement);
    this.setLocal('materialMovements', movements);

    return materials[index];
  }

  // --------------------------------------------------------------------------
  // FINISHED PRODUCTS CATALOG (CRUD)
  // --------------------------------------------------------------------------

  async getProducts() {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        this.setLocal('products', products, false);
        return products;
      } catch (err) {
        console.warn('Firestore getProducts fallback to local:', err.message);
      }
    }
    return this.getLocal('products');
  }

  async addProduct(product) {
    const newProduct = {
      ...product,
      id: product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      stockQuantity: Number(product.stockQuantity) || 0,
      costPerUnit: Number(product.costPerUnit) || 0,
      sellingPrice: Number(product.sellingPrice) || 0,
      reorderThreshold: Number(product.reorderThreshold) || 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'products', newProduct.id), cleanFirestoreData(newProduct));
      } catch (err) {
        console.error('Firestore addProduct error:', err);
        throw new Error(`Failed to add product to Firestore: ${err.message}`);
      }
    }

    const products = this.getLocal('products');
    products.unshift(newProduct);
    this.setLocal('products', products);
    return newProduct;
  }

  async updateProduct(id, updates) {
    const products = this.getLocal('products');
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.stockQuantity !== undefined) cleanUpdates.stockQuantity = Number(updates.stockQuantity);
    if (updates.costPerUnit !== undefined) cleanUpdates.costPerUnit = Number(updates.costPerUnit);
    if (updates.sellingPrice !== undefined) cleanUpdates.sellingPrice = Number(updates.sellingPrice);
    if (updates.reorderThreshold !== undefined) cleanUpdates.reorderThreshold = Number(updates.reorderThreshold);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'products', id), cleanFirestoreData(cleanUpdates));
      } catch (err) {
        console.error('Firestore updateProduct error:', err);
        throw new Error(`Failed to update product in Firestore: ${err.message}`);
      }
    }

    products[index] = { ...products[index], ...cleanUpdates };
    this.setLocal('products', products);
    return products[index];
  }

  async deleteProduct(id) {
    const products = this.getLocal('products');
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        console.error('Firestore deleteProduct error:', err);
        throw new Error(`Failed to delete product from Firestore: ${err.message}`);
      }
    }

    const deleted = products.splice(index, 1)[0];
    this.setLocal('products', products);
    return deleted;
  }

  // --------------------------------------------------------------------------
  // RECIPES / BILL OF MATERIALS (BOM) (CRUD)
  // --------------------------------------------------------------------------

  async getRecipes() {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'recipes'));
        const recipes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        this.setLocal('recipes', recipes, false);
        return recipes;
      } catch (err) {
        console.warn('Firestore getRecipes fallback to local:', err.message);
      }
    }
    return this.getLocal('recipes');
  }

  async saveRecipe(recipe) {
    const recipes = this.getLocal('recipes');
    let savedRecipe;

    if (recipe.id) {
      const idx = recipes.findIndex(r => r.id === recipe.id);
      savedRecipe = { 
        ...recipe, 
        version: (recipes[idx]?.version || 1) + 1, 
        updatedAt: new Date().toISOString() 
      };
      if (idx !== -1) recipes[idx] = savedRecipe;
      else recipes.push(savedRecipe);
    } else {
      savedRecipe = { 
        ...recipe, 
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, 
        version: 1, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      recipes.push(savedRecipe);
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'recipes', savedRecipe.id), cleanFirestoreData(savedRecipe), { merge: true });
      } catch (err) {
        console.error('Firestore saveRecipe error:', err);
        throw new Error(`Failed to save recipe to Firestore: ${err.message}`);
      }
    }

    this.setLocal('recipes', recipes);
    return savedRecipe;
  }

  async deleteRecipe(id) {
    const recipes = this.getLocal('recipes');
    const index = recipes.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Recipe not found');

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'recipes', id));
      } catch (err) {
        console.error('Firestore deleteRecipe error:', err);
        throw new Error(`Failed to delete recipe from Firestore: ${err.message}`);
      }
    }

    const deleted = recipes.splice(index, 1)[0];
    this.setLocal('recipes', recipes);
    return deleted;
  }

  // --------------------------------------------------------------------------
  // PRODUCTION BATCH (STOCK CONVERSION)
  // --------------------------------------------------------------------------

  async getProductionBatches() {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'productionBatches'));
        const batches = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        batches.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
        this.setLocal('productionBatches', batches, false);
        return batches;
      } catch (err) {
        console.warn('Firestore getProductionBatches fallback to local:', err.message);
      }
    }
    return this.getLocal('productionBatches');
  }

  async executeProductionBatch({ productId, quantityToProduce, customLaborMinutes, notes }) {
    const qty = Number(quantityToProduce);
    if (qty <= 0) throw new Error('Production quantity must be positive');

    const products = this.getLocal('products');
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');

    const recipes = this.getLocal('recipes');
    const recipe = recipes.find(r => r.productId === productId);
    if (!recipe) throw new Error(`No recipe found for "${product.name}". Please create a recipe first.`);

    const materials = this.getLocal('rawMaterials');
    const shortages = [];

    // Verify stock availability
    recipe.ingredients.forEach(ing => {
      const mat = materials.find(m => m.id === ing.materialId);
      const totalNeeded = ing.quantityRequired * qty;
      const available = mat ? Number(mat.stockQuantity) : 0;
      if (!mat || available < totalNeeded) {
        shortages.push({
          materialName: ing.materialName || mat?.name || 'Unknown',
          required: totalNeeded,
          available,
          unit: ing.unit,
        });
      }
    });

    if (shortages.length > 0) {
      const detail = shortages.map(s => `${s.materialName} (need ${s.required} ${s.unit}, available: ${s.available})`).join('; ');
      throw new Error(`Insufficient materials: ${detail}`);
    }

    // Atomically deduct materials
    let batchMaterialCost = 0;
    const materialMovements = this.getLocal('materialMovements');
    const newMaterialMovements = [];

    recipe.ingredients.forEach(ing => {
      const matIndex = materials.findIndex(m => m.id === ing.materialId);
      const totalNeeded = ing.quantityRequired * qty;
      const unitCost = Number(materials[matIndex].averageUnitCost) || 0;
      const ingredientCost = totalNeeded * unitCost;
      batchMaterialCost += ingredientCost;

      materials[matIndex].stockQuantity = Math.max(0, materials[matIndex].stockQuantity - totalNeeded);
      if (materials[matIndex].totalCost !== undefined && materials[matIndex].totalCost !== null) {
        materials[matIndex].totalCost = Math.max(0, Math.round(materials[matIndex].stockQuantity * unitCost * 100) / 100);
      }

      const mov = {
        id: `mov_mat_${Date.now()}_${ing.materialId}_${Math.random().toString(36).substring(2, 6)}`,
        materialId: ing.materialId,
        materialName: materials[matIndex].name,
        type: 'production_consumption',
        quantityDelta: -totalNeeded,
        unitCost,
        totalCost: ingredientCost,
        productId,
        productName: product.name,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      newMaterialMovements.push(mov);
      materialMovements.unshift(mov);
    });

    // Calculate labor & total batch unit cost
    const profile = await this.getBusinessProfile();
    const laborRate = profile.pricingDefaults?.hourlyLaborRate || 250;
    const laborMinutes = customLaborMinutes ?? (recipe.laborMinutes || 60);
    const laborCostPerUnit = (laborMinutes / 60) * laborRate;
    const totalLaborCost = laborCostPerUnit * qty;
    const otherCosts = ((recipe.packagingCost || 0) + (recipe.otherDirectCost || 0) + (recipe.allocatedOverhead || 0)) * qty;
    const totalBatchCost = batchMaterialCost + totalLaborCost + otherCosts;
    const costPerFinishedUnit = Math.round((totalBatchCost / qty) * 100) / 100;

    // Increment finished product stock & update product cost basis
    const prodIndex = products.findIndex(p => p.id === productId);
    products[prodIndex].stockQuantity = (Number(products[prodIndex].stockQuantity) || 0) + qty;
    products[prodIndex].costPerUnit = costPerFinishedUnit;

    // Finished stock movement ledger
    const finishedMovements = this.getLocal('finishedStockMovements');
    const finMovement = {
      id: `mov_fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId,
      productName: product.name,
      type: 'production',
      quantityDelta: qty,
      unitCost: costPerFinishedUnit,
      date: new Date().toISOString(),
      notes: notes || `Batch of ${qty} units completed`,
      createdAt: new Date().toISOString(),
    };
    finishedMovements.unshift(finMovement);

    // Save production batch record
    const batches = this.getLocal('productionBatches');
    const batchRecord = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      batchNumber: `WB-BAT-${batches.length + 101}`,
      productId,
      productName: product.name,
      quantityProduced: qty,
      materialCost: batchMaterialCost,
      laborCost: totalLaborCost,
      totalCost: totalBatchCost,
      costPerUnit: costPerFinishedUnit,
      recipeSnapshot: recipe,
      completedAt: new Date().toISOString(),
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };
    batches.unshift(batchRecord);

    // Perform atomic commit to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);

        // Deduct raw materials & add material movements
        recipe.ingredients.forEach(ing => {
          const mat = materials.find(m => m.id === ing.materialId);
          batch.update(doc(db, 'rawMaterials', ing.materialId), {
            stockQuantity: mat.stockQuantity,
            updatedAt: new Date().toISOString()
          });
        });

        newMaterialMovements.forEach(m => {
          batch.set(doc(db, 'materialMovements', m.id), cleanFirestoreData(m));
        });

        // Update product stock and cost
        batch.update(doc(db, 'products', productId), {
          stockQuantity: products[prodIndex].stockQuantity,
          costPerUnit: costPerFinishedUnit,
          updatedAt: new Date().toISOString()
        });

        // Add finished movement & batch record
        batch.set(doc(db, 'finishedStockMovements', finMovement.id), cleanFirestoreData(finMovement));
        batch.set(doc(db, 'productionBatches', batchRecord.id), cleanFirestoreData(batchRecord));

        await batch.commit();
      } catch (err) {
        console.error('Firestore executeProductionBatch error:', err);
        throw new Error(`Failed to commit production batch to Firestore: ${err.message}`);
      }
    }

    // Commit local state updates
    this.setLocal('rawMaterials', materials);
    this.setLocal('materialMovements', materialMovements);
    this.setLocal('products', products);
    this.setLocal('finishedStockMovements', finishedMovements);
    this.setLocal('productionBatches', batches);

    return batchRecord;
  }

  // --------------------------------------------------------------------------
  // SALES, INVOICING & PAYMENTS (CRUD)
  // --------------------------------------------------------------------------

  async getSales() {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'sales'));
        const sales = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        sales.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        this.setLocal('sales', sales, false);
        return sales;
      } catch (err) {
        console.warn('Firestore getSales fallback to local:', err.message);
      }
    }
    return this.getLocal('sales');
  }

  async createSale({
    customerId,
    customerName,
    customerPhone,
    items = [],
    discountAmount = 0,
    shippingCharged = 0,
    paidAmount = 0,
    paymentMethod = 'UPI',
    notes = '',
    idempotencyKey = null,
  }) {
    if (items.length === 0) throw new Error('Sale must contain at least one product item');

    const sales = this.getLocal('sales');
    if (idempotencyKey && sales.some(s => s.idempotencyKey === idempotencyKey)) {
      return sales.find(s => s.idempotencyKey === idempotencyKey);
    }

    const products = this.getLocal('products');
    const finishedMovements = this.getLocal('finishedStockMovements');

    // 1. Validate finished stock availability
    const stockErrors = [];
    items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const reqQty = Number(item.quantity) || 0;
      if (!prod || (Number(prod.stockQuantity) || 0) < reqQty) {
        stockErrors.push(`${item.productName || prod?.name || 'Item'}: requested ${reqQty}, available ${prod?.stockQuantity || 0}`);
      }
    });

    if (stockErrors.length > 0) {
      throw new Error(`Insufficient finished stock: ${stockErrors.join('; ')}`);
    }

    // 2. Deduct product stock & snapshot COGS
    let totalCogs = 0;
    let subtotal = 0;
    const newFinishedMovements = [];

    const snapshotItems = items.map(item => {
      const prodIndex = products.findIndex(p => p.id === item.productId);
      const p = products[prodIndex];
      const reqQty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || Number(p.sellingPrice) || 0;
      const unitCogs = Number(p.costPerUnit) || 0;

      // Deduct stock
      p.stockQuantity = Math.max(0, (Number(p.stockQuantity) || 0) - reqQty);

      // Ledger movement
      const mov = {
        id: `mov_fin_sale_${Date.now()}_${item.productId}_${Math.random().toString(36).substring(2, 6)}`,
        productId: item.productId,
        productName: p.name,
        type: 'sale',
        quantityDelta: -reqQty,
        unitCost: unitCogs,
        sellingPrice: unitPrice,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      newFinishedMovements.push(mov);
      finishedMovements.unshift(mov);

      const lineTotal = reqQty * unitPrice;
      const lineCogs = reqQty * unitCogs;
      subtotal += lineTotal;
      totalCogs += lineCogs;

      return {
        productId: item.productId,
        productName: p.name,
        sku: p.sku || '',
        quantity: reqQty,
        unitPrice,
        unitCogs,
        total: lineTotal,
      };
    });

    const discount = Math.max(0, Number(discountAmount) || 0);
    const shipping = Math.max(0, Number(shippingCharged) || 0);
    const totalAmount = Math.max(0, subtotal - discount + shipping);
    const paid = Math.min(totalAmount, Math.max(0, Number(paidAmount) || 0));
    const balance = totalAmount - paid;

    const profile = await this.getBusinessProfile();
    const nextInvNum = (profile.invoiceSettings?.nextNumber || 100) + 1;
    const invPrefix = profile.invoiceSettings?.prefix || 'WB-INV-';
    const invoiceNumber = `${invPrefix}${nextInvNum}`;

    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const saleRecord = {
      id: saleId,
      idempotencyKey,
      invoiceNumber,
      customerId: customerId || null,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      date: new Date().toISOString(),
      items: snapshotItems,
      subtotal,
      discountAmount: discount,
      shippingCharged: shipping,
      totalAmount,
      paidAmount: paid,
      balanceAmount: balance,
      totalCogs,
      paymentMethod,
      status: balance === 0 ? 'completed' : 'partially_paid',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    let paymentRecord = null;
    if (paid > 0) {
      paymentRecord = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        saleId,
        invoiceNumber,
        amount: paid,
        paymentMethod,
        type: 'payment',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    }

    const customers = this.getLocal('customers');
    let updatedCustomer = null;
    if (customerId) {
      const cIdx = customers.findIndex(c => c.id === customerId);
      if (cIdx !== -1) {
        customers[cIdx].totalPurchases = (Number(customers[cIdx].totalPurchases) || 0) + totalAmount;
        customers[cIdx].outstandingBalance = (Number(customers[cIdx].outstandingBalance) || 0) + balance;
        updatedCustomer = customers[cIdx];
      }
    }

    // Atomic write to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);

        // Deduct products
        items.forEach(item => {
          const p = products.find(prod => prod.id === item.productId);
          if (p) {
            batch.update(doc(db, 'products', p.id), {
              stockQuantity: p.stockQuantity,
              updatedAt: new Date().toISOString()
            });
          }
        });

        // Add finished movements
        newFinishedMovements.forEach(m => {
          batch.set(doc(db, 'finishedStockMovements', m.id), cleanFirestoreData(m));
        });

        // Add sale
        batch.set(doc(db, 'sales', saleRecord.id), cleanFirestoreData(saleRecord));

        // Add initial payment
        if (paymentRecord) {
          batch.set(doc(db, 'payments', paymentRecord.id), cleanFirestoreData(paymentRecord));
        }

        // Update customer balance if applicable
        if (updatedCustomer) {
          batch.update(doc(db, 'customers', updatedCustomer.id), {
            totalPurchases: updatedCustomer.totalPurchases,
            outstandingBalance: updatedCustomer.outstandingBalance,
            updatedAt: new Date().toISOString(),
          });
        }

        // Increment invoice sequence in profile
        batch.update(doc(db, 'businesses', this.businessId), {
          'invoiceSettings.nextNumber': nextInvNum,
          updatedAt: new Date().toISOString(),
        });

        await batch.commit();
      } catch (err) {
        console.error('Firestore createSale error:', err);
        throw new Error(`Failed to create sale in Firestore: ${err.message}`);
      }
    }

    // Update local states
    sales.unshift(saleRecord);
    this.setLocal('products', products);
    this.setLocal('finishedStockMovements', finishedMovements);
    this.setLocal('sales', sales);

    if (paymentRecord) {
      const payments = this.getLocal('payments');
      payments.unshift(paymentRecord);
      this.setLocal('payments', payments);
    }

    if (updatedCustomer) {
      this.setLocal('customers', customers);
    }

    // Update business profile locally
    await this.updateBusinessProfile({
      invoiceSettings: {
        ...profile.invoiceSettings,
        nextNumber: nextInvNum,
      }
    });

    return saleRecord;
  }

  async recordInvoicePayment({ saleId, amount, paymentMethod, notes }) {
    const payAmt = Number(amount);
    if (payAmt <= 0) throw new Error('Payment amount must be greater than zero');

    const sales = this.getLocal('sales');
    const idx = sales.findIndex(s => s.id === saleId);
    if (idx === -1) throw new Error('Invoice not found');

    const sale = sales[idx];
    if (sale.balanceAmount <= 0) throw new Error('Invoice is already fully paid');

    const newPaid = sale.paidAmount + payAmt;
    const newBalance = Math.max(0, sale.totalAmount - newPaid);

    const updatedSale = {
      ...sale,
      paidAmount: newPaid,
      balanceAmount: newBalance,
      status: newBalance === 0 ? 'completed' : 'partially_paid',
      updatedAt: new Date().toISOString(),
    };

    const paymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      saleId,
      invoiceNumber: sale.invoiceNumber,
      amount: payAmt,
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || '',
      type: 'payment',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const customers = this.getLocal('customers');
    let customerToUpdate = null;
    if (sale.customerId) {
      const cIdx = customers.findIndex(c => c.id === sale.customerId);
      if (cIdx !== -1) {
        customers[cIdx].outstandingBalance = Math.max(0, (Number(customers[cIdx].outstandingBalance) || 0) - payAmt);
        customerToUpdate = customers[cIdx];
      }
    }

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'sales', saleId), {
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: updatedSale.status,
          updatedAt: new Date().toISOString(),
        });
        batch.set(doc(db, 'payments', paymentRecord.id), cleanFirestoreData(paymentRecord));
        if (customerToUpdate) {
          batch.update(doc(db, 'customers', customerToUpdate.id), {
            outstandingBalance: customerToUpdate.outstandingBalance,
            updatedAt: new Date().toISOString(),
          });
        }
        await batch.commit();
      } catch (err) {
        console.error('Firestore recordInvoicePayment error:', err);
        throw new Error(`Failed to record invoice payment in Firestore: ${err.message}`);
      }
    }

    sales[idx] = updatedSale;
    this.setLocal('sales', sales);

    const payments = this.getLocal('payments');
    payments.unshift(paymentRecord);
    this.setLocal('payments', payments);

    if (customerToUpdate) {
      this.setLocal('customers', customers);
    }

    return updatedSale;
  }

  async deleteSale(id) {
    const sales = this.getLocal('sales');
    const index = sales.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Sale not found');

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'sales', id));
      } catch (err) {
        console.error('Firestore deleteSale error:', err);
        throw new Error(`Failed to delete sale from Firestore: ${err.message}`);
      }
    }

    const deleted = sales.splice(index, 1)[0];
    this.setLocal('sales', sales);
    return deleted;
  }

  async getPayments() {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'payments'));
        const payments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        payments.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        this.setLocal('payments', payments, false);
        return payments;
      } catch (err) {
        console.warn('Firestore getPayments fallback to local:', err.message);
      }
    }
    return this.getLocal('payments');
  }

  // --------------------------------------------------------------------------
  // CUSTOM COMMISSIONS & ORDERS (CRUD)
  // --------------------------------------------------------------------------

  async getOrders() {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'orders'));
        const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        this.setLocal('orders', orders, false);
        return orders;
      } catch (err) {
        console.warn('Firestore getOrders fallback to local:', err.message);
      }
    }
    return this.getLocal('orders');
  }

  async createOrder(orderData) {
    const orders = this.getLocal('orders');
    const newOrder = {
      ...orderData,
      id: orderData.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderNumber: `WB-ORD-${orders.length + 201}`,
      agreedPrice: Number(orderData.agreedPrice) || 0,
      advancePaid: Number(orderData.advancePaid) || 0,
      status: orderData.status || 'inquiry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'orders', newOrder.id), cleanFirestoreData(newOrder));
      } catch (err) {
        console.error('Firestore createOrder error:', err);
        throw new Error(`Failed to create custom order in Firestore: ${err.message}`);
      }
    }

    orders.unshift(newOrder);
    this.setLocal('orders', orders);
    return newOrder;
  }

  async updateOrderStatus(id, newStatus, notes) {
    const orders = this.getLocal('orders');
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found');

    const updatedNotes = notes ? `${orders[idx].notes || ''}\n[${new Date().toLocaleDateString()}] ${notes}` : orders[idx].notes;
    const updates = {
      status: newStatus,
      notes: updatedNotes || '',
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'orders', id), cleanFirestoreData(updates));
      } catch (err) {
        console.error('Firestore updateOrderStatus error:', err);
        throw new Error(`Failed to update order in Firestore: ${err.message}`);
      }
    }

    orders[idx] = { ...orders[idx], ...updates };
    this.setLocal('orders', orders);
    return orders[idx];
  }

  async deleteOrder(id) {
    const orders = this.getLocal('orders');
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found');

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'orders', id));
      } catch (err) {
        console.error('Firestore deleteOrder error:', err);
        throw new Error(`Failed to delete order from Firestore: ${err.message}`);
      }
    }

    const deleted = orders.splice(idx, 1)[0];
    this.setLocal('orders', orders);
    return deleted;
  }

  // --------------------------------------------------------------------------
  // CUSTOMERS (CRUD)
  // --------------------------------------------------------------------------

  async getCustomers() {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'customers'));
        const customers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        customers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        this.setLocal('customers', customers, false);
        return customers;
      } catch (err) {
        console.warn('Firestore getCustomers fallback to local:', err.message);
      }
    }
    return this.getLocal('customers');
  }

  async addCustomer(customer) {
    const newCustomer = {
      ...customer,
      id: customer.id || `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      totalPurchases: Number(customer.totalPurchases) || 0,
      outstandingBalance: Number(customer.outstandingBalance) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'customers', newCustomer.id), cleanFirestoreData(newCustomer));
      } catch (err) {
        console.error('Firestore addCustomer error:', err);
        throw new Error(`Failed to add customer to Firestore: ${err.message}`);
      }
    }

    const customers = this.getLocal('customers');
    customers.unshift(newCustomer);
    this.setLocal('customers', customers);
    return newCustomer;
  }

  async updateCustomer(id, updates) {
    const customers = this.getLocal('customers');
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');

    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'customers', id), cleanFirestoreData(cleanUpdates));
      } catch (err) {
        console.error('Firestore updateCustomer error:', err);
        throw new Error(`Failed to update customer in Firestore: ${err.message}`);
      }
    }

    customers[idx] = { ...customers[idx], ...cleanUpdates };
    this.setLocal('customers', customers);
    return customers[idx];
  }

  async deleteCustomer(id) {
    const customers = this.getLocal('customers');
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'customers', id));
      } catch (err) {
        console.error('Firestore deleteCustomer error:', err);
        throw new Error(`Failed to delete customer from Firestore: ${err.message}`);
      }
    }

    const deleted = customers.splice(idx, 1)[0];
    this.setLocal('customers', customers);
    return deleted;
  }

  // --------------------------------------------------------------------------
  // OPERATING EXPENSES (CRUD)
  // --------------------------------------------------------------------------

  async getExpenses() {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'expenses'));
        const expenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        expenses.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        this.setLocal('expenses', expenses, false);
        return expenses;
      } catch (err) {
        console.warn('Firestore getExpenses fallback to local:', err.message);
      }
    }
    return this.getLocal('expenses');
  }

  async addExpense(expense) {
    const amt = Number(expense.amount);
    if (amt <= 0) throw new Error('Expense amount must be positive');

    const newExpense = {
      ...expense,
      id: expense.id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      amount: amt,
      isInventoryPurchase: Boolean(expense.isInventoryPurchase),
      date: expense.date || new Date().toISOString(),
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'expenses', newExpense.id), cleanFirestoreData(newExpense));
      } catch (err) {
        console.error('Firestore addExpense error:', err);
        throw new Error(`Failed to record expense in Firestore: ${err.message}`);
      }
    }

    const expenses = this.getLocal('expenses');
    expenses.unshift(newExpense);
    this.setLocal('expenses', expenses);
    return newExpense;
  }

  async updateExpense(id, updates) {
    const expenses = this.getLocal('expenses');
    const idx = expenses.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Expense not found');

    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.amount !== undefined) cleanUpdates.amount = Number(updates.amount);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'expenses', id), cleanFirestoreData(cleanUpdates));
      } catch (err) {
        console.error('Firestore updateExpense error:', err);
        throw new Error(`Failed to update expense in Firestore: ${err.message}`);
      }
    }

    expenses[idx] = { ...expenses[idx], ...cleanUpdates };
    this.setLocal('expenses', expenses);
    return expenses[idx];
  }

  async deleteExpense(id) {
    const expenses = this.getLocal('expenses');
    const idx = expenses.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Expense not found');

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (err) {
        console.error('Firestore deleteExpense error:', err);
        throw new Error(`Failed to delete expense from Firestore: ${err.message}`);
      }
    }

    const deleted = expenses.splice(idx, 1)[0];
    this.setLocal('expenses', expenses);
    return deleted;
  }

  // --------------------------------------------------------------------------
  // STOCK MOVEMENTS AUDIT TRAILS
  // --------------------------------------------------------------------------

  async getMaterialMovements() {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'materialMovements'));
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        this.setLocal('materialMovements', items, false);
        return items;
      } catch (err) {
        console.warn('Firestore getMaterialMovements fallback to local:', err.message);
      }
    }
    return this.getLocal('materialMovements');
  }

  async getFinishedStockMovements() {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'finishedStockMovements'));
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        this.setLocal('finishedStockMovements', items, false);
        return items;
      } catch (err) {
        console.warn('Firestore getFinishedStockMovements fallback to local:', err.message);
      }
    }
    return this.getLocal('finishedStockMovements');
  }

  // --------------------------------------------------------------------------
  // CLEAR ALL DATA
  // --------------------------------------------------------------------------

  async clearAllData() {
    const collections = [
      'rawMaterials', 'products', 'recipes', 'customers', 
      'sales', 'orders', 'expenses', 'materialMovements', 
      'finishedStockMovements', 'productionBatches', 'payments'
    ];

    // Clear local storage
    collections.forEach(col => {
      localStorage.setItem(`${STORAGE_PREFIX}${col}`, JSON.stringify([]));
    });

    // If Firebase is active, delete existing documents from each collection
    if (isFirebaseConfigured && db) {
      for (const colName of collections) {
        try {
          const snap = await getDocs(collection(db, colName));
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.docs.forEach(docSnap => batch.delete(docSnap.ref));
            await batch.commit();
          }
        } catch (err) {
          console.warn(`Error clearing Firestore collection ${colName}:`, err.message);
        }
      }
    }

    this.notify();
  }
}

export const databaseService = new DatabaseService();
