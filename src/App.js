import React, { useEffect, Suspense, lazy } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "./Assets/dist/css/adminlte.min.css";
import ROCKET_LOADER from "./Assets/dist/img/loading_rocket.gif";
import "./Assets/dist/css/app-custom.css";
import "./Assets/dist/css/erp-theme.css";


import "./Assets/plugins/icheck-bootstrap.min.css";
import "./Assets/plugins/fontawesome-free/css/all.min.css";
import "tabulator-tables/dist/css/tabulator_bootstrap5.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { LayoutProvider } from "./Context/LayoutContext";
import { AuthProvider } from "./Context/AuthContext";
import { MasterDataProvider } from "./Context/MasterDataProvider";

import Header from "./Components/Common/Topbar";
import SideMenu from "./Components/Common/Sidebar";
import Footer from "./Components/Common/Footer";

import { Toaster } from "react-hot-toast";

import NProgress from "nprogress";
import "nprogress/nprogress.css";
// Pages
import LoginPage from "./Pages/LoginPage";
import PendingInvoiceList from "./Pages/PurchaseOrder/Invoices/PendingInvoiceList";
const BlankPage = lazy(() => import("./Pages/BlankPage"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const PurchaseOrderList = lazy(() => import("./Pages/PurchaseOrder/PurchaseOrderList"));
const PurchaseOrderForm = lazy(() => import("./Pages/PurchaseOrder/PurchaseOrderForm"));
const PurchaseOrderView = lazy(() => import("./Pages/PurchaseOrder/PurchaseOrderView"));
const PurchaseReceiveEdit = lazy(() => import("./Components/PO/Receive/PurchaseReceiveForm"));
const PurchaseTrackStatusList = lazy(() => import("./Components/PO/PurchaseTrackStatusList"));
const PurchaseInvoiceList = lazy(() => import("./Components/PO/PurchaseInvoiceList"));
const AllVendors = lazy(() => import("./Pages/Vendors/AllVendors"));
const AddNewVendor = lazy(() => import("./Pages/Vendors/AddNewVendor"));
const EditVendor = lazy(() => import("./Pages/Vendors/EditVendor"));
//import EditVendor from "./pages/Vendors/Edit/EditVendor";

const ProductsList = lazy(() => import("./Pages/Products/ProductsList"));
const CreateProduct = lazy(() => import("./Pages/Products/CreateProduct"));
const EditProduct = lazy(() => import("./Pages/Products/EditProduct"));
const BrandManagement = lazy(() => import("./Pages/Brands/BrandManagement"));
const ManufacturerManagement = lazy(() => import("./Pages/Manufacturers/ManufacturerManagement"));
const CategoryManagement = lazy(() => import("./Pages/Category/CategoryManagement"));
const UnitOfMeasurement = lazy(() => import("./Pages/UnitOfMeasurement/UnitOfMeasurement"));
const AttributeManagement = lazy(() => import("./Pages/Attributes/AttributeManagement"));
const UserManagement = lazy(() => import("./Pages/Security/Users/UserManagement"));
const ManageUserRoles = lazy(() => import("./Pages/Security/Roles/ManageUserRoles"));
const InventoryWarehouseList = lazy(() => import("./Pages/Settings/Warehouse/InventoryWarehouseList"));
const ShippingProvidersList = lazy(() => import("./Pages/Settings/ShippingProviders/ShippingProvidersList"));
const VendorLoginCredentialsList = lazy(() => import("./Pages/Settings/VendorLoginCredentials/VendorLoginCredentialsList"));
const PaymentTermsList = lazy(() => import("./Pages/Settings/PaymentTerms/PaymentTermsList"));
const CountriesList = lazy(() => import("./Pages/Countries/CountriesList"));
const CountryEditView = lazy(() => import("./Pages/Countries/CountryEditView"));
const OrganizationProfile = lazy(() => import("./Pages/Dashboard/OrganizationProfile"));

const ProtectedRoute = lazy(() => import("./Pages/ProtectedRoute"));
const POKanbanList = lazy(() => import("./Pages/PurchaseOrder/POKanbanList"));
const RootRedirect = lazy(() => import("./Pages/RootRedirect"));
const VendorImportIndex = lazy(() => import("./Pages/Vendors/ImportExport/VendorImport"));
const POImportHome = lazy(() => import("./Pages/PurchaseOrder/ImportExport/POImportHome"));
const InvoiceList = lazy(() => import("./Pages/PurchaseOrder/Invoices/InvoiceList"));
const InvoiceDetail = lazy(() => import("./Pages/PurchaseOrder/Invoices/InvoiceDetail"));
const ShipmentsList = lazy(() => import("./Pages/PurchaseOrder/Shipments/ShipmentsList"));
import Lottie from "lottie-react";
import data from "./Assets/dist/img/sb_logo.json";

const LoadingFallback = () => (
  <div
    className="d-flex flex-column align-items-center justify-content-center"
    style={{
      height: "100vh",
      backgroundColor: "#f4f6f9", // AdminLTE light background
      zIndex: 9999
    }}
  >
    {/* Pixabay Double Gear GIF */}
    <div className="mb-4 text-center">
      <Lottie
        animationData={data}
        loop={true}
        style={{
          width: "140px",
          height: "140px"
        }}
      />
    </div>

    {/* Text Section */}
    <div className="text-center">
      <h6 className="fw-medium text-dark mb-1" style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        Loading..
      </h6>
      <p className="text-muted small mb-0">
        {/*Syncing records with the server
        <span className="dot-animation">.</span>
        <span className="dot-animation" style={{ animationDelay: '0.2s' }}>.</span>
        <span className="dot-animation" style={{ animationDelay: '0.4s' }}>.</span>*/}
      </p>
    </div>
  </div>
);

/*
const LoadingFallback = () => (
  <div 
    className="d-flex flex-column align-items-center justify-content-center" 
    style={{ 
      height: "100vh", 
      backgroundColor: "#f4f6f9", // AdminLTE background color
      fontFamily: "'Source Sans Pro', sans-serif" // AdminLTE font
    }}
  >
    <div className="gear-loader-wrapper mb-4">
      <i className="fas fa-cog text-primary gear-big"></i>
      <i className="fas fa-cog text-secondary gear-small"></i>
    </div>

    <div className="text-center">
      <h6 className="fw-bold text-dark mb-1" style={{ letterSpacing: '0.5px' }}>
        Processing Data
      </h6>
      <p className="text-muted small mb-0">
        Please wait while we sync with the server
        <span className="dot-pulse">.</span>
        <span className="dot-pulse" style={{ animationDelay: '0.2s' }}>.</span>
        <span className="dot-pulse" style={{ animationDelay: '0.4s' }}>.</span>
      </p>
    </div>
  </div>
);*/
// ---------------- Protected Layout ----------------
const ProtectedLayout = ({ children }) => {
  return <MasterDataProvider>{children}</MasterDataProvider>;
};

// ---------------- Main Layout ----------------
const MainLayout = ({ children }) => {
  return (
    <div className="wrapper">
      <Header />
      <SideMenu />

      <div
        className="content-wrapper"
        style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}
      >
        <div className="content-header py-2 px-3">
          <div className="container-fluid" />
        </div>

        <section className="content px-3 pb-4">
          <div className="container-fluid">{children}</div>
        </section>
      </div>

      <Toaster
        position="top-center"
        gutter={12}
        autoClose={2500}
        newestOnTop
        pauseOnHover
        draggable
        theme="colored"
        toastOptions={{
          style: {
            padding: "16px 20px",  // inner spacing
            border: "2px solid #63e90a",
          },
          success: {
            style: {
              borderColor: "#22c55e", // green
            },
            iconTheme: {
              primary: "#22c55e",
              secondary: "white",
            },
          },

          error: {
            style: {
              borderColor: "#ef4444", // red
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "white",
            },
          },

          loading: {
            style: {
              borderColor: "#3b82f6", // blue
            },
          },

          custom: {
            style: {
              borderColor: "#f59e0b", // orange
            },
          },
        }}

      />

      <Footer />
    </div>
  );
};

// ---------------- Page Wrapper ----------------
const PageWrapper = ({ title, children }) => {
  useEffect(() => {
    document.title = title || "Admin ERP";
  }, [title]);

  return children;
};

// ---------------- Routes Config ----------------
const routes = [
  { path: "/login", component: <LoginPage />, title: "SB Admin | Login" },

  { path: "/", component: <RootRedirect /> },
  { path: "/dashboard", component: <Dashboard />, title: "SB Admin | Dashboard", layout: true, protected: true },

  { path: "/purchaseorder/create/:poId?", component: <PurchaseOrderForm />, title: "SB Admin | Purchase Order Edit", layout: true, protected: true },
  { path: "/purchaseorder/create/:poId?/AddNew", component: <PurchaseOrderForm />, title: "SB Admin | Purchase Order Create", layout: true, protected: true },
  { path: "/purchaseorder/listing", component: <PurchaseOrderList />, title: "SB Admin | Purchase Order List", layout: true, protected: true },
  { path: "/purchaseorder/kanbanlisting", component: <POKanbanList />, title: "SB Admin | Purchase Order Kanban", layout: true, protected: true },
  { path: "/purchaseorder/import", component: <BlankPage />, title: "SB Admin ", layout: true, protected: true },
  { path: "/purchaseorder/importexport", component: <POImportHome />, title: "SB Admin | Import/Export Purchase Orders", layout: true, protected: true },
  { path: "/purchaseorder/invoices", component: <InvoiceList />, title: "SB Admin | Invoice List", layout: true, protected: true },
  { path: "/purchaseorder/purchaseorder/invoicedetails/:invoiceId?", component: <InvoiceDetail />, title: "SB Admin | InvoiceDetail", layout: true, protected: true },
  { path: "/purchaseorder/shipments", component: <ShipmentsList />, title: "SB Admin | Shipments List", layout: true, protected: true },

  { path: "/purchaseorder/invoicedue", component: <PendingInvoiceList />, title: "SB Admin | Pending Invoice List", layout: true, protected: true },

  //invoicedue
  //receive details
  //purchaseorder/receive/
  { path: "/purchaseorder/receive/:receiveId?", component: <PurchaseReceiveEdit />, title: "SB Admin | Purchase Receive", layout: true, protected: true },


  //shipments

  //purchaseorder/import
  //kanbanlisting
  { path: "/purchaseorder/details/:poId?", component: <PurchaseOrderView />, title: "SB Admin | Purchase Order Details", layout: true, protected: true },

  { path: "/receive/view/:poreceiveId?/:poId?", component: <PurchaseReceiveEdit />, title: "SB Admin | Purchase Receive View", layout: true, protected: true },
  { path: "/purchaseorder/intransit/listing", component: <PurchaseTrackStatusList />, title: "SB Admin | Purchase Track Shipment", layout: true, protected: true },
  { path: "/purchaseorder/bills/listing", component: <PurchaseInvoiceList />, title: "SB Admin | Purchase Bills", layout: true, protected: true },

  { path: "/vendor/vendors", component: <AllVendors />, title: "SB Admin | Vendors List", layout: true, protected: true },
  { path: "/vendor/addnewvendor", component: <AddNewVendor />, title: "SB Admin | Create Vendor", layout: true, protected: true },
  { path: "/vendor/editvendor/:vendorId?", component: <EditVendor />, title: "SB Admin | Edit Vendor", layout: true, protected: true },
  { path: "/vendor/import", component: <VendorImportIndex />, title: "SB Admin | Import Vendors", layout: true, protected: true },

  //purchaseorder/importexport
  { path: "/product/allproducts", component: <ProductsList />, title: "SB Admin | Products", layout: true, protected: true },
  { path: "/product/create", component: <CreateProduct />, title: "SB Admin | Create Product", layout: true, protected: true },
  { path: "/product/edit/:productId", component: <EditProduct />, title: "SB Admin | Edit Product", layout: true, protected: true },

  { path: "/product/brands", component: <BrandManagement />, title: "SB Admin | Brands", layout: true, protected: true },
  { path: "/product/categories", component: <CategoryManagement />, title: "SB Admin | Categories", layout: true, protected: true },
  { path: "/product/manufacturers", component: <ManufacturerManagement />, title: "SB Admin | Manufacturers", layout: true, protected: true },
  { path: "/product/unit_of_measurements", component: <UnitOfMeasurement />, title: "SB Admin | UOM", layout: true, protected: true },
  { path: "/product/attributes", component: <AttributeManagement />, title: "SB Admin | Attributes", layout: true, protected: true },

  { path: "/security/users", component: <UserManagement />, title: "SB Admin | Users", layout: true, protected: true },
  { path: "/security/roles", component: <ManageUserRoles />, title: "SB Admin | Roles", layout: true, protected: true },

  { path: "/settings/warehouses", component: <InventoryWarehouseList />, title: "SB Admin | Warehouses", layout: true, protected: true },
  { path: "/settings/shipping_providers", component: <ShippingProvidersList />, title: "SB Admin | Shipping Providers", layout: true, protected: true },
  { path: "/settings/vendor_login_credentials", component: <VendorLoginCredentialsList />, title: "SB Admin | Vendor Login Credentials", layout: true, protected: true },
  { path: "/settings/payment_terms", component: <PaymentTermsList />, title: "SB Admin | Payment Terms", layout: true, protected: true },
  { path: "/settings/countries", component: <CountriesList />, title: "SB Admin | Countries", layout: true, protected: true },
  { path: "/settings/countries/:countryId/edit", component: <CountryEditView />, title: "SB Admin | Edit Country", layout: true, protected: true },

  { path: "/organizations/view", component: <OrganizationProfile />, title: "SB Admin | Organization", layout: true, protected: true },
];

// ---------------- App ----------------
function App() {
  return (
    <Router>
      <AuthProvider>
        <LayoutProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {routes.map((route) => {
                const page = (
                  <PageWrapper title={route.title}>
                    {route.layout ? <MainLayout>{route.component}</MainLayout> : route.component}
                  </PageWrapper>
                );

                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      route.protected ? (
                        <ProtectedRoute>
                          <ProtectedLayout>{page}</ProtectedLayout>
                        </ProtectedRoute>
                      ) : (
                        page
                      )
                    }
                  />
                );
              })}
            </Routes>
          </Suspense>
        </LayoutProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
