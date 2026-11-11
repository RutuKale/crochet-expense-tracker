import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { databaseService } from '../../services/databaseService.js';
import { formatINR } from '../../domain/formatters.js';
import { Plus, Users, Phone, Mail, MapPin, X } from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';
import DataTable from '../common/DataTable.jsx';
import FormField from '../common/FormField.jsx';

export default function CustomersView() {
  const { customers, showToast } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await databaseService.addCustomer({
        name,
        phone,
        email,
        address,
        city,
        notes,
      });
      showToast('success', `Added customer ${name}.`);
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCity('');
      setNotes('');
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const columns = [
    {
      header: 'Customer',
      key: 'name',
      render: (c) => (
        <div>
          <span className="font-bold text-brand-plum-950 block">{c.name}</span>
          {(c.city || c.address) && (
            <div className="flex items-center gap-1 text-[11px] text-brand-plum-500 mt-0.5">
              <MapPin className="w-3 h-3 text-brand-plum-400 shrink-0" />
              <span className="truncate max-w-[200px]" title={[c.address, c.city].filter(Boolean).join(', ')}>
                {[c.address, c.city].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Contact Info',
      key: 'phone',
      render: (c) => (
        <div className="space-y-0.5 text-xs text-brand-plum-700">
          {c.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-brand-plum-400" />
              <span>{c.phone}</span>
            </div>
          )}
          {c.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-brand-plum-400" />
              <span>{c.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Total Purchases',
      key: 'totalPurchases',
      align: 'right',
      render: (c) => (
        <span className="font-extrabold text-brand-plum-950 font-['Outfit']">
          {formatINR(c.totalPurchases || 0)}
        </span>
      )
    },
    {
      header: 'Outstanding Balance',
      key: 'outstandingBalance',
      align: 'right',
      render: (c) => {
        const bal = Number(c.outstandingBalance) || 0;
        return (
          <span className={`font-bold ${bal > 0 ? 'text-brand-rose-600' : 'text-brand-sage-700'}`}>
            {bal > 0 ? formatINR(bal) : 'All Cleared'}
          </span>
        );
      }
    },
    {
      header: 'Preferences & Notes',
      key: 'notes',
      render: (c) => (
        <span className="text-xs text-brand-plum-600 italic line-clamp-1">{c.notes || '—'}</span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        subtitle="Manage client profiles, repeat buyers, custom design preferences, and outstanding balances."
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search customers by name, phone, address, city..."
        searchKeys={['name', 'phone', 'email', 'city', 'address']}
        initialSortKey="name"
      />

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-plum-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-brand-plum-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-brand-plum-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-rose-300" />
                <h3 className="text-base font-bold font-['Outfit']">Add New Client</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-brand-plum-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 space-y-3.5">
              <FormField label="Full Name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Radhika Apte"
                  className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 focus:ring-2 focus:ring-brand-plum-500/20"
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Phone Number">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950"
                  />
                </FormField>

                <FormField label="City / Region">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950"
                  />
                </FormField>
              </div>

              <FormField label="Email Address">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950"
                />
              </FormField>

              <FormField label="Delivery / Street Address">
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat / House No., Street, Landmark, Area, Pincode"
                  className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 focus:ring-2 focus:ring-brand-plum-500/20 resize-none"
                />
              </FormField>

              <FormField label="Preferences & Notes">
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Loves pastel bucket hats, allergic to wool (use cotton), etc."
                  className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-brand-plum-200 text-brand-plum-950 resize-none"
                />
              </FormField>

              <div className="pt-3 border-t border-brand-plum-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-brand-plum-700 hover:bg-brand-cream-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-plum-900 hover:bg-brand-plum-950 rounded-xl transition"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
