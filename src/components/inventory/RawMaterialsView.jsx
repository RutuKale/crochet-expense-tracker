import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { formatINR, formatQuantity } from '../../domain/formatters.js';
import { Plus, PackagePlus, Edit2, Trash2, AlertTriangle, Layers } from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';
import DataTable from '../common/DataTable.jsx';

export default function RawMaterialsView({ onOpenAddMaterial, onOpenRecordPurchase, onEditMaterial }) {
  const { rawMaterials, deleteRawMaterial, showToast } = useBusiness();
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRawMaterial(materialToDelete.id);
      setMaterialToDelete(null);
    } catch (err) {
      showToast('error', `Failed to delete material: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Summary Metrics
  const totalStockItems = rawMaterials.reduce((acc, m) => acc + (Number(m.stockQuantity) || 0), 0);
  const totalValuation = rawMaterials.reduce((acc, m) => {
    if (m.totalCost !== undefined && m.totalCost !== null && !isNaN(Number(m.totalCost))) {
      return acc + Number(m.totalCost);
    }
    return acc + ((Number(m.stockQuantity) || 0) * (Number(m.averageUnitCost) || 0));
  }, 0);
  const lowStockCount = rawMaterials.filter(m => (Number(m.stockQuantity) || 0) <= (Number(m.reorderThreshold) || 5)).length;

  const columns = [
    {
      header: 'Material Name & Category',
      key: 'name',
      render: (m) => (
        <div
          onClick={() => onEditMaterial && onEditMaterial(m)}
          className="cursor-pointer group py-0.5"
          title="Click to edit material details"
        >
          <span className="font-bold text-brand-plum-950 group-hover:text-brand-rose-600 transition inline-flex items-center gap-1.5">
            {m.name}
            <Edit2 className="w-3 h-3 text-brand-plum-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <span className="text-[11px] font-mono text-brand-plum-400 block">{m.category}</span>
        </div>
      )
    },
    {
      header: 'On-Hand Stock',
      key: 'stockQuantity',
      align: 'center',
      render: (m) => {
        const isLow = Number(m.stockQuantity) <= Number(m.reorderThreshold || 5);
        return (
          <div className="inline-flex flex-col items-center">
            <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-brand-plum-950'}`}>
              {formatQuantity(m.stockQuantity, m.unit)}
            </span>
            {isLow && (
              <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-semibold mt-0.5">
                <AlertTriangle className="w-3 h-3" /> Reorder (min {m.reorderThreshold})
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Average Unit Cost',
      key: 'averageUnitCost',
      align: 'right',
      render: (m) => (
        <span className="font-semibold text-brand-plum-900">
          {formatINR(m.averageUnitCost)} / {m.unit}
        </span>
      )
    },
    {
      header: 'Stock Value',
      key: 'stockValue',
      align: 'right',
      render: (m) => {
        const val = m.totalCost !== undefined && m.totalCost !== null && !isNaN(Number(m.totalCost))
          ? Number(m.totalCost)
          : ((Number(m.stockQuantity) || 0) * (Number(m.averageUnitCost) || 0));
        return (
          <span className="font-extrabold text-brand-plum-950 font-['Outfit']">
            {formatINR(val)}
          </span>
        );
      }
    },
    {
      header: 'Supplier',
      key: 'supplier',
      render: (m) => (
        <span className="text-xs text-brand-plum-600">{m.supplier || '—'}</span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      align: 'right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap min-w-[190px]">
          <button
            onClick={() => onOpenRecordPurchase(m.id)}
            className="p-1.5 px-2 text-xs font-semibold text-brand-plum-700 bg-brand-cream-100 hover:bg-brand-cream-200 rounded-lg flex items-center gap-1 transition shrink-0"
            title="Receive Material Purchase"
          >
            <PackagePlus className="w-3.5 h-3.5 shrink-0" />
            <span>Receive</span>
          </button>
          <button
            onClick={() => onEditMaterial(m)}
            className="p-1.5 px-2 text-xs font-semibold text-brand-plum-800 bg-white hover:bg-brand-cream-100 border border-brand-plum-200 rounded-lg flex items-center gap-1 transition shadow-2xs hover:border-brand-plum-400 shrink-0"
            title="Edit Material"
          >
            <Edit2 className="w-3.5 h-3.5 text-brand-plum-600 shrink-0" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setMaterialToDelete(m)}
            className="p-1.5 px-2 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1 transition shadow-2xs hover:border-rose-300 shrink-0"
            title="Delete Material"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Delete</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Raw Materials & Supplies"
        subtitle="Track skeins, fibers, hooks, packaging, and weighted average cost bases."
        action={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onOpenRecordPurchase()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 bg-white border border-brand-plum-200 text-brand-plum-900 hover:bg-brand-cream-100 rounded-xl text-xs font-bold transition shadow-2xs shrink-0"
            >
              <PackagePlus className="w-4 h-4 text-brand-plum-700 shrink-0" />
              <span className="truncate">Record Purchase</span>
            </button>
            <button
              onClick={onOpenAddMaterial}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Add Material</span>
            </button>
          </div>
        }
      />

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-brand-plum-100 shadow-2xs flex items-center justify-between sm:block">
          <div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-plum-500">Total Material Types</span>
            <p className="text-xl sm:text-2xl font-extrabold text-brand-plum-950 font-['Outfit'] mt-0.5 sm:mt-1">{rawMaterials.length} materials</p>
          </div>
          <div className="p-2.5 bg-brand-cream-100 text-brand-plum-700 rounded-xl sm:hidden shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-brand-plum-100 shadow-2xs flex items-center justify-between sm:block">
          <div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-plum-500">Total Raw Inventory Value</span>
            <p className="text-xl sm:text-2xl font-extrabold text-brand-plum-950 font-['Outfit'] mt-0.5 sm:mt-1">{formatINR(totalValuation)}</p>
          </div>
          <div className="p-2.5 bg-brand-cream-100 text-brand-plum-700 rounded-xl sm:hidden shrink-0 font-bold text-sm">
            ₹
          </div>
        </div>
        <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-brand-plum-100 shadow-2xs sm:col-span-2 lg:col-span-1 flex items-center justify-between sm:block">
          <div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-plum-500">Low Stock Supplies</span>
            <p className={`text-xl sm:text-2xl font-extrabold font-['Outfit'] mt-0.5 sm:mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-brand-sage-600'}`}>
              {lowStockCount} items below threshold
            </p>
          </div>
          <div className={`p-2.5 rounded-xl sm:hidden shrink-0 ${lowStockCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rawMaterials}
        searchPlaceholder="Search materials by name or category..."
        searchKeys={['name', 'category', 'supplier']}
        initialSortKey="name"
      />

      {/* Delete Confirmation Modal */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-brand-plum-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-rose-100 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-plum-950 font-['Outfit']">Delete Material</h3>
                <p className="text-xs text-brand-plum-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-brand-plum-700">
              Are you sure you want to permanently delete <strong className="text-brand-plum-950">"{materialToDelete.name}"</strong> from your supplies catalog?
            </p>

            {Number(materialToDelete.stockQuantity) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Notice:</strong> This material currently has <strong>{materialToDelete.stockQuantity} {materialToDelete.unit}</strong> recorded in on-hand inventory.
                </span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-semibold text-brand-plum-700 hover:bg-brand-cream-100 rounded-xl transition text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Material'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
