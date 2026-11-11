import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { databaseService } from '../../services/databaseService.js';
import { formatINR } from '../../domain/formatters.js';
import { Save, Store, Receipt, Sliders, CheckCircle2 } from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';
import FormField from '../common/FormField.jsx';

export default function SettingsHubView() {
  const { businessProfile, setBusinessProfile } = useAuth();

  const [businessName, setBusinessName] = useState(businessProfile?.name || 'Wooly Bloom');
  const [ownerName, setOwnerName] = useState(businessProfile?.ownerName || 'Rutuja');
  const [phone, setPhone] = useState(businessProfile?.phone || '');
  const [address, setAddress] = useState(businessProfile?.address || '');
  const [hourlyLaborRate, setHourlyLaborRate] = useState(businessProfile?.pricingDefaults?.hourlyLaborRate ?? 250);
  const [targetMarginPct, setTargetMarginPct] = useState(businessProfile?.pricingDefaults?.targetMarginPct ?? 35);
  const [invoicePrefix, setInvoicePrefix] = useState(businessProfile?.invoiceSettings?.prefix || 'WB-INV-');
  const [footerNote, setFooterNote] = useState(businessProfile?.invoiceSettings?.footerNote || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const updated = await databaseService.updateBusinessProfile({
      name: businessName,
      ownerName,
      phone,
      address,
      pricingDefaults: {
        ...businessProfile?.pricingDefaults,
        hourlyLaborRate: Number(hourlyLaborRate) || 250,
        targetMarginPct: Number(targetMarginPct) || 35,
      },
      invoiceSettings: {
        ...businessProfile?.invoiceSettings,
        prefix: invoicePrefix,
        footerNote,
      }
    });
    setBusinessProfile(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Profile & Settings"
        subtitle="Manage business identity, default pricing rates, and invoice branding."
      />

      {isSaved && (
        <div className="p-3 bg-brand-sage-50 border border-brand-sage-200 text-brand-sage-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-sage-600" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Identity */}
        <div className="bg-white rounded-2xl border border-brand-plum-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-brand-plum-100">
            <Store className="w-4 h-4 text-brand-rose-500" />
            <h3 className="text-sm font-bold text-brand-plum-950 uppercase tracking-wider">
              Studio Identity & Contact
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Business Brand Name" required>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 text-brand-plum-950 font-bold"
                required
              />
            </FormField>

            <FormField label="Owner / Lead Artisan">
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 text-brand-plum-950"
              />
            </FormField>

            <FormField label="Contact Phone">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 text-brand-plum-950"
              />
            </FormField>

            <FormField label="Studio Address / Workshop">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 text-brand-plum-950"
              />
            </FormField>
          </div>
        </div>

        {/* Pricing Defaults */}
        <div className="bg-white rounded-2xl border border-brand-plum-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-brand-plum-100">
            <Sliders className="w-4 h-4 text-brand-rose-500" />
            <h3 className="text-sm font-bold text-brand-plum-950 uppercase tracking-wider">
              Default Costing & Margin Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Default Hourly Crochet Labor Rate (₹/hr)" hint="Standard wage allocated to your crafting time">
              <input
                type="number"
                min="0"
                value={hourlyLaborRate}
                onChange={(e) => setHourlyLaborRate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 text-brand-plum-950 font-bold"
              />
            </FormField>

            <FormField label="Default Target Profit Margin (%)" hint="Recommended benchmark: 30% - 45%">
              <input
                type="number"
                min="5"
                max="90"
                value={targetMarginPct}
                onChange={(e) => setTargetMarginPct(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 text-brand-plum-950 font-bold"
              />
            </FormField>
          </div>
        </div>

        {/* Invoicing Settings */}
        <div className="bg-white rounded-2xl border border-brand-plum-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-brand-plum-100">
            <Receipt className="w-4 h-4 text-brand-rose-500" />
            <h3 className="text-sm font-bold text-brand-plum-950 uppercase tracking-wider">
              Invoice Formatting & PDF Footer
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Invoice Number Prefix">
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 text-brand-plum-950 font-mono font-bold"
              />
            </FormField>

            <FormField label="Invoice Footer Care Note">
              <input
                type="text"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-brand-cream-50 rounded-xl border border-brand-plum-200 text-brand-plum-950"
              />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-plum-900 hover:bg-brand-plum-950 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <Save className="w-4 h-4 text-brand-rose-300" />
            <span>Save Settings Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
