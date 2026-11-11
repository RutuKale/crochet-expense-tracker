import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext.jsx';
import { formatINR } from '../../domain/formatters.js';
import { Plus, Edit2, Trash2, Sparkles, AlertTriangle } from 'lucide-react';
import PageHeader from '../common/PageHeader.jsx';
import DataTable from '../common/DataTable.jsx';

export default function ProductsView({ 
  onOpenAddProduct, 
  onEditProduct
}) {
  const { products, deleteProduct, showToast } = useBusiness();
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
    } catch (err) {
      showToast('error', `Failed to delete product: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalFinishedStock = products.reduce((acc, p) => acc + (Number(p.stockQuantity) || 0), 0);
  const totalValuation = products.reduce((acc, p) => acc + ((Number(p.stockQuantity) || 0) * (Number(p.costPerUnit) || 0)), 0);

  const columns = [
    {
      header: 'Product Details',
      key: 'name',
      render: (p) => (
        <div 
          onClick={() => onEditProduct && onEditProduct(p)}
          className="cursor-pointer group py-0.5"
          title="Click to edit product"
        >
          <span className="font-bold text-brand-plum-950 group-hover:text-brand-rose-600 transition inline-flex items-center gap-1.5">
            {p.name}
            <Edit2 className="w-3 h-3 text-brand-plum-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <span className="text-[11px] font-mono text-brand-plum-400 block">{p.category}</span>
          {p.description && (
            <p className="text-xs text-brand-plum-600 line-clamp-1 mt-0.5">{p.description}</p>
          )}
        </div>
      )
    },
    {
      header: 'In Stock',
      key: 'stockQuantity',
      align: 'center',
      render: (p) => {
        const isLow = Number(p.stockQuantity) <= Number(p.reorderThreshold || 2);
        return (
          <div className="inline-flex flex-col items-center">
            <span className={`font-bold text-sm ${isLow ? 'text-rose-600' : 'text-brand-plum-950'}`}>
              {p.stockQuantity} pcs
            </span>
            {isLow && (
              <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-semibold mt-0.5">
                <AlertTriangle className="w-3 h-3" /> Low stock
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Unit Cost (COGS basis)',
      key: 'costPerUnit',
      align: 'right',
      render: (p) => (
        <span className="font-semibold text-brand-plum-700">{formatINR(p.costPerUnit)}</span>
      )
    },
    {
      header: 'Selling Price',
      key: 'sellingPrice',
      align: 'right',
      render: (p) => (
        <span className="font-extrabold text-brand-plum-950 font-['Outfit']">
          {formatINR(p.sellingPrice)}
        </span>
      )
    },
    {
      header: 'Gross Margin',
      key: 'margin',
      align: 'center',
      render: (p) => {
        const profit = (Number(p.sellingPrice) || 0) - (Number(p.costPerUnit) || 0);
        const marginPct = p.sellingPrice > 0 ? Math.round((profit / p.sellingPrice) * 100) : 0;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${marginPct >= 35 ? 'bg-brand-sage-100 text-brand-sage-700' : marginPct >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
            {marginPct}% (+{formatINR(profit)})
          </span>
        );
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap min-w-[140px]">
          <button
            onClick={() => onEditProduct(p)}
            className="p-1.5 px-2 text-xs font-semibold text-brand-plum-800 bg-white hover:bg-brand-cream-100 border border-brand-plum-200 rounded-lg flex items-center gap-1 transition shadow-2xs hover:border-brand-plum-400 shrink-0"
            title="Edit Product"
          >
            <Edit2 className="w-3.5 h-3.5 text-brand-plum-600 shrink-0" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setProductToDelete(p)}
            className="p-1.5 px-2 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1 transition shadow-2xs hover:border-rose-300 shrink-0"
            title="Delete Product"
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
        title="Finished Products Catalog"
        subtitle="Crafted crochet articles ready for direct sale, wholesale, and artisan markets."
        action={
          <button
            onClick={onOpenAddProduct}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 hover:from-brand-rose-700 hover:to-brand-rose-600 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">Add Product</span>
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-brand-plum-100 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-plum-500">Catalog Size</span>
          <p className="text-2xl font-extrabold text-brand-plum-950 font-['Outfit'] mt-1">{products.length} Designs</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-brand-plum-100 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-plum-500">Finished Stock on Hand</span>
          <p className="text-2xl font-extrabold text-brand-plum-950 font-['Outfit'] mt-1">{totalFinishedStock} pieces</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-brand-plum-100 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-plum-500">Finished Goods Valuation</span>
          <p className="text-2xl font-extrabold text-brand-plum-950 font-['Outfit'] mt-1">{formatINR(totalValuation)}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        searchPlaceholder="Search products by title, category, or description..."
        searchKeys={['name', 'category', 'description']}
        initialSortKey="name"
      />

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-plum-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-rose-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-plum-950 font-['Outfit']">Delete Product</h3>
                <p className="text-xs text-brand-plum-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-brand-plum-700">
              Are you sure you want to permanently delete <strong className="text-brand-plum-950">"{productToDelete.name}"</strong> from your products catalog?
            </p>

            {Number(productToDelete.stockQuantity) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Notice:</strong> This product currently has <strong>{productToDelete.stockQuantity} pcs</strong> recorded in finished goods stock.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-brand-plum-700 hover:bg-brand-cream-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Product'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
