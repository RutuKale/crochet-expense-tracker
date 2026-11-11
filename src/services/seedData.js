/**
 * Wooly Bloom - Business Configuration Defaults
 * Static demo data removed. Collections start clean, connected to Cloud Firestore.
 */

export const INITIAL_BUSINESS_PROFILE = {
  id: 'crochet_business_profile',
  name: 'Wooly Bloom Crochet Studio',
  ownerName: 'Rutuja',
  email: 'hello@crochetstudio.com',
  phone: '+91 98765 43210',
  address: 'Studio 4, Pune, MH, India',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  pricingDefaults: {
    hourlyLaborRate: 250, // ₹250 / hour
    targetMarginPct: 35,  // 35%
    minimumMarginPct: 20, // 20%
    platformFeePct: 3,    // 3% payment gateway / stall fee
    discountPct: 5,       // 5% standard discount
    roundingRule: 'nearest10',
  },
  invoiceSettings: {
    prefix: 'WB-INV-',
    nextNumber: 101,
    footerNote: 'Handmade with love & care. Gentle hand wash cold.',
    enableLogo: true,
  },
  setupComplete: true,
};

// All collections start completely empty for real Firestore CRUD operations
export const INITIAL_RAW_MATERIALS = [];
export const INITIAL_PRODUCTS = [];
export const INITIAL_RECIPES = [];
export const INITIAL_CUSTOMERS = [];
export const INITIAL_SALES = [];
export const INITIAL_ORDERS = [];
export const INITIAL_EXPENSES = [];
