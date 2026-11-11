import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import Toast from '../common/Toast.jsx';

// Main views
import DashboardView from '../dashboard/DashboardView.jsx';
import RawMaterialsView from '../inventory/RawMaterialsView.jsx';
import ProductsView from '../inventory/ProductsView.jsx';
import SalesView from '../operations/SalesView.jsx';
import OrdersView from '../operations/OrdersView.jsx';
import CustomersView from '../operations/CustomersView.jsx';
import ExpensesView from '../operations/ExpensesView.jsx';
import PriceCalculatorView from '../intelligence/PriceCalculatorView.jsx';
import ReportsView from '../intelligence/ReportsView.jsx';
import SettingsHubView from '../settings/SettingsHubView.jsx';
import DataExportView from '../settings/DataExportView.jsx';

// Interactive Modals
import CreateSaleModal from '../operations/CreateSaleModal.jsx';
import MaterialPurchaseModal from '../inventory/MaterialPurchaseModal.jsx';
import MaterialFormModal from '../inventory/MaterialFormModal.jsx';
import ProductFormModal from '../inventory/ProductFormModal.jsx';
import OrderFormModal from '../operations/OrderFormModal.jsx';
import ExpenseFormModal from '../operations/ExpenseFormModal.jsx';
import InvoiceDetailModal from '../operations/InvoiceDetailModal.jsx';
import FirebaseConfigModal from '../settings/FirebaseConfigModal.jsx';

export default function AppLayout() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [isCreateSaleOpen, setIsCreateSaleOpen] = useState(false);
  const [isRecordPurchaseOpen, setIsRecordPurchaseOpen] = useState(false);
  const [purchasePreselectedMaterialId, setPurchasePreselectedMaterialId] = useState(null);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isFirebaseConfigOpen, setIsFirebaseConfigOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Handlers
  const handleOpenRecordPurchase = (materialId = null) => {
    setPurchasePreselectedMaterialId(materialId);
    setIsRecordPurchaseOpen(true);
  };

  const handleEditMaterial = (material) => {
    setMaterialToEdit(material);
    setIsAddMaterialOpen(true);
  };

  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setIsAddProductOpen(true);
  };

  return (
    <div className="min-h-screen bg-brand-cream-100 flex text-brand-plum-950 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        {/* Topbar */}
        <Topbar
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenCreateSale={() => setIsCreateSaleOpen(true)}
          onOpenRecordPurchase={() => handleOpenRecordPurchase()}
          onOpenFirebaseConfig={() => setIsFirebaseConfigOpen(true)}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenCreateSale={() => setIsCreateSaleOpen(true)}
              onOpenRecordPurchase={(matId) => handleOpenRecordPurchase(matId)}
              onSelectSale={(sale) => setSelectedInvoice(sale)}
            />
          )}

          {currentTab === 'materials' && (
            <RawMaterialsView
              onOpenAddMaterial={() => {
                setMaterialToEdit(null);
                setIsAddMaterialOpen(true);
              }}
              onOpenRecordPurchase={(matId) => handleOpenRecordPurchase(matId)}
              onEditMaterial={handleEditMaterial}
            />
          )}

          {currentTab === 'products' && (
            <ProductsView
              onOpenAddProduct={() => {
                setProductToEdit(null);
                setIsAddProductOpen(true);
              }}
              onEditProduct={handleEditProduct}
            />
          )}

          {currentTab === 'sales' && (
            <SalesView
              onOpenCreateSale={() => setIsCreateSaleOpen(true)}
              onSelectSale={(sale) => setSelectedInvoice(sale)}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersView
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onOpenCreateSale={() => setIsCreateSaleOpen(true)}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView />
          )}

          {currentTab === 'expenses' && (
            <ExpensesView
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            />
          )}

          {currentTab === 'pricing' && (
            <PriceCalculatorView />
          )}

          {currentTab === 'reports' && (
            <ReportsView />
          )}

          {currentTab === 'settings' && (
            <SettingsHubView />
          )}

          {currentTab === 'export' && (
            <DataExportView />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <CreateSaleModal
        isOpen={isCreateSaleOpen}
        onClose={() => setIsCreateSaleOpen(false)}
      />

      <MaterialPurchaseModal
        isOpen={isRecordPurchaseOpen}
        onClose={() => {
          setIsRecordPurchaseOpen(false);
          setPurchasePreselectedMaterialId(null);
        }}
        preselectedMaterialId={purchasePreselectedMaterialId}
      />

      <MaterialFormModal
        isOpen={isAddMaterialOpen}
        onClose={() => {
          setIsAddMaterialOpen(false);
          setMaterialToEdit(null);
        }}
        materialToEdit={materialToEdit}
      />

      <ProductFormModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      <OrderFormModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
      />

      <ExpenseFormModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />

      <InvoiceDetailModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        sale={selectedInvoice}
      />

      <FirebaseConfigModal
        isOpen={isFirebaseConfigOpen}
        onClose={() => setIsFirebaseConfigOpen(false)}
      />

      {/* Toast Alert Notifications */}
      <Toast />
    </div>
  );
}
