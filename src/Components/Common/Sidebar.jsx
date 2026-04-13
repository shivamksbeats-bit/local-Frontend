import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import apiFetch from "../../Utils/apiFetch";
import { API_BASE } from "../../Config/api";
import { useAuth } from "../../Context/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.is_superuser);
  const [openMenu, setOpenMenu] = useState(null);
  const [openGroup, setOpenGroup] = useState(null); // Purchases group-ku

  const toggleGroup = (key) => setOpenGroup(openGroup === key ? null : key);
  
  const [creating, setCreating] = useState(false);
  const isActive = (path) => location.pathname === path;
  const isParentActive = (prefix) => location.pathname.startsWith(prefix);

  // Sync openMenu state with current URL on load and navigation
  useEffect(() => {
    const path = location.pathname;

    // =============================
    // Finance Group — FIRST check பண்ணு
    // =============================
    if (
      path.startsWith("/purchaseorder/invoices") ||
      path.startsWith("/purchaseorder/invoicedue") 
    ) {
      setOpenGroup("finance_group");
      setOpenMenu(null);
      return;
    }

    // =============================
    // Purchases Group
    // =============================
    if (
      path.startsWith("/purchaseorder") ||
      path.startsWith("/supplier-return") ||
      path.startsWith("/purchaseorder/shipments")
    ) {
      setOpenGroup("purchases_group");
      if (path.startsWith("/purchaseorder")) setOpenMenu("purchase_orders");
      else if (path.startsWith("/supplier-return")) setOpenMenu("supplier_returns");
      return;
    }

    // =============================
    // Standalone Menus
    // =============================
    setOpenGroup(null);

    if (path.startsWith("/vendor")) setOpenMenu("vendors");
    else if (path.startsWith("/product")) setOpenMenu("products");
    else if (path.startsWith("/security")) setOpenMenu("security");
    else if (
      path.startsWith("/settings") ||
      path.includes("payment_terms") ||
      path.includes("warehouses") ||
      path.includes("shipping_providers")
    ) setOpenMenu("settings");
    else setOpenMenu(null);

  }, [location.pathname]);

  const toggleMenu = (key) => {
    setOpenMenu(openMenu === key ? null : key);
  };

  const handleAddNew = async (e) => {
    if (e) e.preventDefault();
    if (creating) return;

    try {
      setCreating(true);

      const res = await apiFetch(`${API_BASE}api/purchaseorder/api/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-type": "application/json" },
      });

      if (res?.data?.po_id) {
        navigate(`/purchaseorder/create/${res.data.po_id}/AddNew`);
      }
    } catch (err) {
      console.error("Failed to create PO", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="main-sidebar sidebar-light-dark elevation-2">
      {/* Brand */}
      <Link to="/dashboard" className="brand-link navbar-light">
        <img
          src="http://admin.hansona.com/static/sbadmin/dist/img/sb_logo.png"
          className="brand-image elevation-0"
          alt="User"
        />
        <span className="brand-text font-weight-bold text-black ">SB Admin</span>
      </Link>

      <div className="user-panel mt-1 pt-2 pb-3 mb-2 d-flex">
        <div className="image">
          <img
            src="http://admin.hansona.com/static/sbadmin/dist/img/profile-picture.png"
            className="img-circle elevation-2"
            alt="User Image"
          />
        </div>
        <div className="info">
          <a href="#" className="d-block text-dark">Admin User</a>
        </div>
      </div>

      <div className="sidebar clearfix" style={{ height: "calc(100vh - 120px)", overflowY: "auto" }}>
        <nav className="mt-2">
          <ul className="nav nav-pills nav-sidebar flex-column" role="menu" style={{ paddingBottom: '50px' }}>
            
            {/* Dashboard */}
            <li className="nav-item">
              <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}>
                <i className="nav-icon fas fa-tachometer-alt"></i>
                <p>Dashboard</p>
              </Link>
            </li>

            {/* Vendors */}
          <li className={`nav-item has-treeview ${openMenu === "vendors" ? "menu-open" : ""}`}>
            <a 
              className={`nav-link ${isParentActive("/vendor") ? "active" : ""}`}
              onClick={() => toggleMenu("vendors")}
              style={{ cursor: 'pointer' }}
            >
              <i className="nav-icon fas fa-users"></i>
              <p>
                Vendors 
                <i className="right fas fa-angle-right"></i>
              </p>
            </a>
            <ul className="nav nav-treeview" style={{ display: openMenu === "vendors" ? "block" : "none" }}>
              <li className="nav-item">
                <Link 
                  to="/vendor/addnewvendor" 
                  className={`nav-link ${isActive("/vendor/addnewvendor") ? "active" : ""}`}
                >
                  <i className={`${isActive("/vendor/addnewvendor") ? "fas" : "far"} fa-circle nav-icon`}></i>
                  <p>Add Vendor</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/vendor/vendors" 
                  className={`nav-link ${isActive("/vendor/vendors") ? "active" : ""}`}
                >
                  <i className={`${location.pathname.startsWith("/vendor/editvendor/")? "fas" : "far"} ${isActive("/vendor/vendors") ? "fas" : "far"} fa-circle nav-icon`}></i>
                  <p>View Vendors</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/vendor/import" 
                  className={`nav-link ${isActive("/vendor/import") ? "active" : ""}`}
                >
                  <i className={`${isActive("/vendor/import") ? "fas" : "far"} fa-circle nav-icon`}></i>
                  <p>Import/Export</p>
                </Link>
              </li>
            </ul>
          </li>
          <li className={`nav-item has-treeview ${openGroup === "purchases_group" ? "menu-open" : ""}`}>
            <a 
              className={`nav-link ${openGroup === "purchases_group" ? "active" : ""}`}
              onClick={() => toggleGroup("purchases_group")}
              style={{ cursor: 'pointer' }}
            >
              <i className="nav-icon fas fa-truck"></i>
              <p>
                Purchases
                <i className="right fas fa-angle-right"></i>
              </p>
            </a>

            <ul className="nav nav-treeview" style={{ display: openGroup === "purchases_group" ? "block" : "none" }}>
              
              {/* Level 2: Purchase Orders */}
              <li className={`nav-item has-treeview ${openMenu === "purchase_orders" ? "menu-open" : ""}`}>
                <a 
                  className={`nav-link ${isParentActive("/purchaseorder") ? "active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); toggleMenu("purchase_orders"); }}
                  style={{ cursor: 'pointer' }} 
                >
                  <i className={`${isParentActive("/purchaseorder") ? "fas" : "far"} fa-circle nav-icon`}></i>
                  <p>
                    Purchase Orders
                    <i className="right fas fa-angle-right"></i>
                  </p>
                </a>
                
                <ul className="nav nav-treeview" style={{ display: openMenu === "purchase_orders" ? "block" : "none" }}>
                  <li className="nav-item">
                    <a 
                      onClick={handleAddNew} 
                      className={`nav-link ${creating ? "disabled" : ""}`}
              
                      style={{cursor: creating ? "default" : "pointer", pointerEvents: creating ? "none" : "auto", opacity: creating ? 0.6 : 1, paddingLeft: '50px' }}
                    >
                      <i className={`${location.pathname.startsWith("/purchaseorder/create/") ? "fas" : "far"} nav-icon ${creating ? "fas fa-spinner fa-spin" : " fa-dot-circle"}`}></i>
                      <p>{creating ? "Creating..." : "Add Purchase"}</p>
                    </a>
                  </li>
                  <li className="nav-item">
                    <Link to="/purchaseorder/listing" className="nav-link" style={{ paddingLeft: '50px' }}>
                      <i className={`${isActive("/purchaseorder/listing") ? "fas" : "far"} fa-dot-circle nav-icon`}></i>
                      <p>View Purchases</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/purchaseorder/kanbanlisting" className="nav-link" style={{ paddingLeft: '50px' }}>
                      <i className={`${isActive("/purchaseorder/kanbanlisting") ? "fas" : "far"} fa-dot-circle nav-icon`}></i>
                      <p>Purchase Order Kanban</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/purchaseorder/importexport" className="nav-link" style={{ paddingLeft: '50px' }}>
                      <i className="far fa-dot-circle nav-icon"></i>
                      <p>Import/Export</p>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Level 2: Supplier Returns */}
              <li className={`nav-item has-treeview ${openMenu === "supplier_returns" ? "menu-open" : ""}`}>
                <a 
                  className={`nav-link ${isParentActive("/supplier-return") ? "active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); toggleMenu("supplier_returns"); }}
                  style={{ cursor: 'pointer' }}
                >
                  <i className={`${isParentActive("/supplier-return") ? "fas" : "far"} fa-circle nav-icon`}></i>
                  <p>
                    Supplier Returns
                    <i className="right fas fa-angle-right"></i>
                  </p>
                </a>
                
                <ul className="nav nav-treeview" style={{ display: openMenu === "supplier_returns" ? "block" : "none" }}>
                  <li className="nav-item">
                    <Link  className="nav-link" style={{ paddingLeft: '50px' }}>
                      <i className={`${isActive("/supplier-return/add") ? "fas" : "far"} fa-dot-circle nav-icon`}></i>
                      <p>Add Supplier Return</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" style={{ paddingLeft: '50px' }}>
                      <i className={`${isActive("/supplier-return/listing") ? "fas" : "far"} fa-dot-circle nav-icon`}></i>
                      <p>View Returns</p>
                    </Link>
                  </li>
                </ul>
              </li>


              {/* Payment Tracking */}
            <li className="nav-item">
              <Link
                to="/purchaseorder/shipments"
                className={`nav-link ${location.pathname.startsWith("/purchaseorder/shipments") ? "active" : ""}`}
              >
                <i className={`${location.pathname.startsWith("/purchaseorder/shipments") ? "fas" : "far"} fa-dot-circle nav-icon`}></i>
                <p>Track Status</p>
              </Link>
            </li>
            
            </ul>
          </li>

          {/* ── Finance ── */}
        <li className={`nav-item has-treeview ${openGroup === "finance_group" ? "menu-open" : ""}`}>
          
         <a className={`nav-link ${openGroup === "finance_group" ? "active" : ""}`}
            onClick={() => toggleGroup("finance_group")}
            style={{ cursor:"pointer" }}
          >
            <i className="nav-icon fas fa-landmark"></i>
            <p>
              Finance
              <i className="right fas fa-angle-right"></i>
            </p>
          </a>

          <ul className="nav nav-treeview" style={{ display: openGroup === "finance_group" ? "block" : "none" }}>

            {/* All Invoices */}
            <li className="nav-item">
              <Link
                to="/purchaseorder/invoices"
                className={`nav-link ${location.pathname.startsWith("/purchaseorder/invoices") ? "active" : ""}`}
              >
                <i className={`${location.pathname.startsWith("/purchaseorder/invoices") ? "fas" : "far"} fa-dot-circle nav-icon`}></i>
                <p>All Invoices</p>
              </Link>
            </li>

            {/* Dues Today */}
            <li className="nav-item">
              <Link
                to="/purchaseorder/invoicedue"
                className={`nav-link ${location.pathname.startsWith("/purchaseorder/invoicedue") ? "active" : ""}`}
              >
                <i className={`${location.pathname.startsWith("/purchaseorder/invoicedue") ? "fas" : "far"} fa-dot-circle nav-icon`}></i>
                <p>Dues Today</p>
              </Link>
            </li>

            

          </ul>
        </li>
            {/* Products Treeview */}
            <li className={`nav-item has-treeview ${openMenu === "products" ? "menu-open" : ""}`}>
              <a
                className={`nav-link ${isParentActive("/product") ? "active" : ""}`}
                onClick={() => toggleMenu("products")}
                style={{ cursor: 'pointer' }}
              >
                <i className="nav-icon fas fa-shopping-bag"></i>
                <p>
                  Products
                  <i className="right fas fa-angle-right"></i>
                </p>
              </a>

              <ul className="nav nav-treeview" style={{ display: openMenu === "products" ? "block" : "none" }}>
                <li className="nav-item">
                  <Link to="/product/allproducts" className={`nav-link ${isActive("/product/allproducts") ? "active" : ""}`}>
                    <i className={`${isActive("/product/allproducts") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>All Products</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/product/brands" className={`nav-link ${isActive("/product/brands") ? "active" : ""}`}>
                    <i className={`${isActive("/product/brands") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>Brands</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/product/categories" className={`nav-link ${isActive("/product/categories") ? "active" : ""}`}>
                    <i className={`${isActive("/product/categories") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>Category</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/product/manufacturers" className={`nav-link ${isActive("/product/manufacturers") ? "active" : ""}`}>
                    <i className={`${isActive("/product/manufacturers") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>Manufacturers</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/product/attributes" className={`nav-link ${isActive("/product/attributes") ? "active" : ""}`}>
                    <i className={`${isActive("/product/attributes") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>Attributes</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/product/unit_of_measurements" className={`nav-link ${isActive("/product/unit_of_measurements") ? "active" : ""}`}>
                    <i className={`${isActive("/product/unit_of_measurements") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>Unit Of Measurement</p>
                  </Link>
                </li>
              </ul>
            </li>

            {/* Security Treeview */}
            <li className={`nav-item has-treeview ${openMenu === "security" ? "menu-open" : ""}`}>
              <a
                className={`nav-link ${isParentActive("/security") && !location.pathname.includes("countries") ? "active" : ""}`}
                onClick={() => toggleMenu("security")}
                style={{ cursor: 'pointer' }}
              >
                <i className="nav-icon fas fa-shield-alt"></i>
                <p>
                  Security
                  <i className="right fas fa-angle-right"></i>
                </p>
              </a>

              <ul className="nav nav-treeview" style={{ display: openMenu === "security" ? "block" : "none" }}>
                <li className="nav-item">
                  <Link to="/security/users" className={`nav-link ${isActive("/security/users") ? "active" : ""}`}>
                    <i className={`${isActive("/security/users") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>Users</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/security/roles" className={`nav-link ${isActive("/security/roles") ? "active" : ""}`}>
                    <i className={`${isActive("/security/roles") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>Roles</p>
                  </Link>
                </li>
              </ul>
            </li>

            {/* Settings Treeview */}
            <li className={`nav-item has-treeview ${openMenu === "settings" ? "menu-open" : ""}`}>
              <a
                className={`nav-link ${location.pathname.includes("countries") || location.pathname.includes("payment_terms") || location.pathname.includes("warehouses") || location.pathname.includes("shipping_providers") || location.pathname.includes("vendor_login_credentials") ? "active" : ""}`}
                onClick={() => toggleMenu("settings")}
                style={{ cursor: 'pointer' }}
              >
                <i className="nav-icon fas fa-cog"></i>
                <p>
                  Settings
                  <i className="right fas fa-angle-right"></i>
                </p>
              </a>

              <ul className="nav nav-treeview" style={{ display: openMenu === "settings" ? "block" : "none" }}>
                <li className="nav-item">
                  <Link to="/settings/countries" className={`nav-link ${isActive("/settings/countries") ? "active" : ""}`}>
                    <i className={`${isActive("/settings/countries") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>Country</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/settings/payment_terms" className={`nav-link ${isActive("/settings/payment_terms") ? "active" : ""}`}>
                    <i className={`${isActive("/settings/payment_terms") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>Payment Terms</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/settings/warehouses" className={`nav-link ${isActive("/settings/warehouses") ? "active" : ""}`}>
                    <i className={`${isActive("/settings/warehouses") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>Warehouse</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/settings/shipping_providers" className={`nav-link ${isActive("/settings/shipping_providers") ? "active" : ""}`}>
                    <i className={`${isActive("/settings/shipping_providers") ? "fas" : "far"} fa-circle nav-icon`}></i>
                    <p>Shipping Providers</p>
                  </Link>
                </li>
                {isSuperAdmin && (
                  <li className="nav-item">
                    <Link
                      to="/settings/vendor_login_credentials"
                      className={`nav-link ${isActive("/settings/vendor_login_credentials") ? "active" : ""}`}
                    >
                      <i className={`${isActive("/settings/vendor_login_credentials") ? "fas" : "far"} fa-circle nav-icon`}></i>
                      <p>Vendor Login Credentials</p>
                    </Link>
                  </li>
                )}
              </ul>
            </li>

          </ul>
        </nav>
      </div>
    </aside>
  );
}