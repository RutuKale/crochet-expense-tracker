import React from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Download, Database, ShieldAlert, FileJson, CheckCircle2 } from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';

export default function DataExportView() {
  const { 
    rawMaterials, 
    products, 
    recipes, 
    customers, 
    allSales, 
    orders, 
    expenses, 
    payments 
  } = useBusiness();
  const { businessProfile } = useAuth();

  const handleExportJSON = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      businessId: businessProfile?.id || 'biz_wooly_bloom_01',
      businessProfile,
      rawMaterials,
      products,
      recipes,
      customers,
      sales: allSales,
      orders,
      expenses,
      payments,
      metadata: {
        schemaVersion: '1.0',
        recordCounts: {
          rawMaterials: rawMaterials.length,
          products: products.length,
          recipes: recipes.length,
          customers: customers.length,
          sales: allSales.length,
          orders: orders.length,
          expenses: expenses.length,
          payments: payments.length,
        }
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Wooly_Bloom_Backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Portability & Business Backup"
        subtitle="Download complete snapshots of your crochet business ledgers in standardized formats."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full JSON Export Card */}
        <div className="bg-white rounded-2xl border border-brand-plum-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-cream-100 rounded-xl text-brand-plum-800">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-plum-950 font-['Outfit']">
                Complete Studio Ledger Snapshot (.json)
              </h3>
              <p className="text-xs text-brand-plum-600">
                Exports all core operational collections with full relational linkage
              </p>
            </div>
          </div>

          <div className="p-4 bg-brand-cream-50 rounded-xl text-xs space-y-1.5 text-brand-plum-800">
            <div className="flex justify-between">
              <span>Raw Materials:</span>
              <span className="font-bold">{rawMaterials.length} records</span>
            </div>
            <div className="flex justify-between">
              <span>Finished Products:</span>
              <span className="font-bold">{products.length} records</span>
            </div>
            <div className="flex justify-between">
              <span>Customers:</span>
              <span className="font-bold">{customers.length} records</span>
            </div>
            <div className="flex justify-between">
              <span>Invoiced Sales:</span>
              <span className="font-bold">{allSales.length} records</span>
            </div>
            <div className="flex justify-between">
              <span>Custom Orders:</span>
              <span className="font-bold">{orders.length} records</span>
            </div>
            <div className="flex justify-between">
              <span>Expenses:</span>
              <span className="font-bold">{expenses.length} records</span>
            </div>
          </div>

          <button
            onClick={handleExportJSON}
            className="w-full py-2.5 bg-brand-plum-900 hover:bg-brand-plum-950 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-brand-rose-300" />
            <span>Download Complete JSON Backup</span>
          </button>
        </div>

        {/* Blueprint Backup Guidelines */}
        <div className="bg-brand-cream-100/70 rounded-2xl border border-brand-plum-100 p-6 space-y-4 text-xs text-brand-plum-800">
          <div className="flex items-center gap-2 font-bold text-brand-plum-950 text-sm">
            <ShieldAlert className="w-4 h-4 text-brand-rose-600" />
            <span>Blueprint Security & Backup Disclosure</span>
          </div>

          <p className="leading-relaxed">
            As specified in Section 02 & 08 of the Wooly Bloom Blueprint:
          </p>

          <ul className="list-disc pl-4 space-y-2 leading-relaxed">
            <li>
              <strong>Documented Portability</strong>: JSON exports contain business-scoped operational documents. They are designed for your own offsite archives and external spreadsheet migrations.
            </li>
            <li>
              <strong>Cloud Persistence</strong>: When connected to Firebase, your database is protected by automated Google Cloud infrastructure.
            </li>
            <li>
              <strong>No Account Passwords in Exports</strong>: In compliance with security standards, credentials and authentication secrets are never saved in data exports or Firestore documents.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
