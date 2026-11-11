# 🧶 Wooly Bloom — Crochet Business Management System

> A dedicated, build-ready business manager, BOM costing engine, inventory tracker, custom order ledger, and financial reporting system for the handmade crochet enterprise **Wooly Bloom**.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests (Formula verification, P&L, Inventory Valuation)
npm test

# 3. Start local development server
npm run dev

# 4. Compile production build
npm run build
```

---

## 🎨 Tech Stack & Architecture

- **Frontend**: React 19 + Vite 8 + JavaScript (JSX)
- **Styling**: Tailwind CSS + Custom Brand Tokens (Deep Plum, Muted Rose, Warm Cream, Sage Green, Lavender)
- **Icons**: Lucide React
- **PDF Invoicing**: jsPDF with brand layout
- **Test Runner**: Vitest (Unit tests for pricing formulas, margin analysis, and GAAP P&L)
- **Database & Backend**: Firebase (Firebase Auth, Cloud Firestore, Firebase Storage) with integrated zero-config Local Ledger engine for immediate offline demo capability.

---

## 📁 Repository Structure

```
expense_tracker/
├── firestore.rules          # Production Firebase Security Rules (business scoping & immutability)
├── storage.rules            # Firebase Storage Security Rules
├── firestore.indexes.json   # Composite query indexes (sales, expenses, inventory, orders)
├── .env.example             # Documented Firebase environment variables
├── src/
│   ├── domain/
│   │   ├── pricing.js           # Blueprint pricing formula engine (C / ((1-m)*(1-f)*(1-d)))
│   │   ├── financialLedger.js   # GAAP P&L, COGS, Cash Flow & Inventory Valuation
│   │   ├── formatters.js        # INR (₹) currency & Asia/Kolkata date formatters
│   │   └── test/
│   │       └── financial.test.js # Vitest test suite
│   ├── services/
│   │   ├── firebase.js          # Centralized Firebase initialization & credentials check
│   │   ├── databaseService.js   # Unified Firestore + local ledger service with atomic transactions
│   │   ├── seedData.js          # Crochet starter dataset (Milk cotton yarns, hats, teddies, orders)
│   │   └── pdfService.js        # Branded client-side PDF invoice generator
│   ├── context/
│   │   ├── AuthContext.jsx      # Authentication & business profile state
│   │   └── BusinessContext.jsx  # Live reactive business data feeds & toast alerts
│   ├── components/
│   │   ├── common/              # PageHeader, KpiCard, DataTable, StatusBadge, MoneyDisplay, Toast
│   │   ├── layout/              # Sidebar, Topbar, AppLayout
│   │   ├── dashboard/           # DashboardView (KPIs, recent sales, low stock alerts)
│   │   ├── inventory/           # RawMaterialsView, ProductsView, RecipesView, ProductionBatchesView
│   │   ├── operations/          # SalesView, OrdersView, CustomersView, ExpensesView
│   │   ├── intelligence/        # PriceCalculatorView, ReportsView (P&L)
│   │   └── settings/            # SettingsHubView, DataExportView, FirebaseConfigModal
│   ├── App.jsx
│   └── index.css
```

---

## 🔐 Firebase Configuration

By default, the application runs in **Local Ledger Mode** out of the box with realistic crochet seed data. To connect your live Firebase project:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate with your Firebase credentials from **Firebase Console → Project Settings**:
   ```ini
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=wooly-bloom.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=wooly-bloom
   VITE_FIREBASE_STORAGE_BUCKET=wooly-bloom.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```
3. Deploy Firestore & Storage rules using Firebase CLI:
   ```bash
   firebase deploy --only firestore:rules,storage:rules,firestore:indexes
   ```

---

## 📊 Core Business & Accounting Rules

1. **Inventory vs. Operating Expense**:
   - Purchasing raw materials (yarn, stuffing, safety eyes) increases **Asset Inventory** and is tracked under `materialPurchases` and `materialMovements`.
   - Raw material costs are recognized on the P&L as **Cost of Goods Sold (COGS)** upon finished product sales.
   - Operating expenses (studio rent, utilities, marketing, packaging mailers) are kept strictly separate to prevent double-counting.
2. **Pricing Recommendation Formula**:
   $$\text{List Price} = \frac{C}{(1 - m) \times (1 - f) \times (1 - d)}$$
   - $C$ = Direct unit cost (Materials + Labor @ Hourly Rate + Packaging + Overhead)
   - $m$ = Target margin %
   - $f$ = Platform / gateway fee %
   - $d$ = Expected customer discount %
3. **Atomic Stock Movements**:
   - Production batches check BOM requirements against available raw materials.
   - When a batch is committed, raw materials are atomically deducted and finished products are increased.
   - When a sale is finalized, finished stock is deducted and an immutable snapshot of line item costs and invoice totals is recorded.
