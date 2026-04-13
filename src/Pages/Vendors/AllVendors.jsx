import React, { useEffect, useRef, useCallback } from "react";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import Swal from "sweetalert2";
import { API_BASE } from "../../Config/api";
import { apiFetch } from "../../Utils/apiFetch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListUl } from "@fortawesome/free-solid-svg-icons";
import { getVendorStatusName } from "../../Constants/vendorStatus";

const STORAGE_KEY = "purchase_order_columns";

/* ----------------------------------------
   COLUMN DEFINITIONS (outside component — stable reference)
---------------------------------------- */
const ALL_COLUMNS = [
  {
    title: "VENDOR CODE",
    field: "vendor_code",
    width: 160,
    fixed: true,
    formatter: (cell) => {
      const id = cell.getRow().getData().id;
      return `
        <a href="/vendor/editvendor/${id}" class=" link" title="Edit">
            ${cell.getValue()}
      </a>`;
    },
  },
  {
    title: "VENDOR NAME",
    field: "vendor_name",
    minWidth: 270,
    formatter: (cell) => {
      const id = cell.getRow().getData().id;
      return `
        <a href="/vendor/editvendor/${id}" class=" link" title="Edit">
            ${cell.getValue()}
      </a>`;
    },
  },
  {
    title: "VENDOR TYPE",
    field: "vendor_model",
    headerSort: false,
    width: 140,
  },
  {
    title: "Company Locality",
    field: "vendor_locality",
    headerSort: false,
    width: 170,
    formatter: (cell) => {
      const det = cell.getRow().getData().vendor_locality;
      if (det === "0") return "Local";
      else if (det === "1") return "International";
      else return "";
    },
  },
  {
    title: "CITY",
    field: "billing_city",
    width: 140,
    fixed: true,
    headerSort: false,
  },
  {
    title: "COUNTRY",
    field: "billing_country",
    width: 140,
    fixed: true,
    headerSort: false,
  },
  {
    title: "CURRENCY",
    field: "currency",
    width: 120,
    headerSort: false,
  },
  {
    title: "TAX %",
    field: "tax_percent",
    width: 98,
  },
  {
    title: "STATUS",
    field: "status",
    width: 110,
    hozAlign: "left",
    headerHozAlign: "left",
    formatter: (cell) => {
      return getVendorStatusName(cell.getValue());
    },
  },
  // ACTIONS column is added inside the component (needs handleDeleteVendor reference)
];

/* ----------------------------------------
   localStorage helpers (outside component — stable reference)
---------------------------------------- */
const getSavedColumns = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return ALL_COLUMNS.filter((c) => c.optional).map((c) => c.field);
  }
  return JSON.parse(saved);
};

const saveColumns = (fields) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
};

/* ----------------------------------------
   COLUMN CUSTOMIZE MODAL (outside — avoids nested component re-mount)
---------------------------------------- */
const ColumnModal = () => {
  const saved = getSavedColumns();

  const toggleColumn = (field) => {
    const set = new Set(getSavedColumns());
    set.has(field) ? set.delete(field) : set.add(field);
    saveColumns([...set]);
  };

  return (
    <div className="modal fade" id="columnModal">
      <div className="modal-dialog modal-sm">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Show / Hide Columns</h5>
            <button className="btn-close" data-bs-dismiss="modal" />
          </div>

          <div className="modal-body">
            {ALL_COLUMNS.filter((c) => c.optional).map((col) => (
              <div className="form-check" key={col.field}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  defaultChecked={saved.includes(col.field)}
                  onChange={() => toggleColumn(col.field)}
                />
                <label className="form-check-label">{col.title}</label>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-primary"
              data-bs-dismiss="modal"
              onClick={() => window.location.reload()}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------
   MAIN COMPONENT
---------------------------------------- */
const AllVendors = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const initialSearch = queryParams.get("vendor_search") || "";

  const [vendor_status, setVendorStatus] = React.useState("");
  const [vendor_locality, setVendorLocality] = React.useState("");
  const [searchValue, setSearchValue] = React.useState(initialSearch);
  const [vendors, setVendors] = React.useState([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const debounceRef = useRef(null);

  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);

  const handleVendorSearch = (value) => {
    setSearchValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setVendors([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch(
          `${API_BASE}api/vendor_api/lists?search=${value}`
        );

        if (res?.data) {
          setVendors(res.data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Vendor search error:", err);
      }
    }, 300);
  };

  const handleSelectVendor = (vendor) => {
    setSearchValue(vendor.vendor_code);
    setShowDropdown(false);
    setVendors([]);

    if (tabulatorRef.current) {
      tabulatorRef.current.setPage(1);
    }
  };

  const handleDeleteVendor = useCallback(async (rowData) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You are about to delete vendor. This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#000000",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({
            title: "Deleting...",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          const del_resp = await apiFetch(
            `${API_BASE}api/vendor/api/delete/${rowData.id}`,
            { method: "DELETE" }
          );

          if (del_resp.status)
            Swal.fire({
              title: "Deleted!",
              text: "The vendor has been removed.",
              icon: "success",
              confirmButtonColor: "#000000",
            });
          else
            Swal.fire({
              title: "Not Deleted!",
              text: del_resp.message || "Failed in delete.",
              icon: "error",
              confirmButtonColor: "#000000",
            });

          if (tabulatorRef.current) {
            tabulatorRef.current.setData();
          }
        } catch (error) {
          console.error("Delete failed:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to delete vendor. Please try again.",
            icon: "error",
            confirmButtonColor: "#000000",
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    const visibleOptionalCols = getSavedColumns();

    // Build ACTIONS column here (needs handleDeleteVendor)
    const actionsColumn = {
      title: "ACTIONS",
      field: "actions",
      fixed: true,
      hozAlign: "center",
      headerHozAlign: "center",
      width: 100,
      headerSort: false,
      formatter: (cell) => {
        const id = cell.getRow().getData().id;
        return `
          <div class="d-flex gap-2">
            <a href="/vendor/editvendor/${id}" class="btn btn-outline-primary btn-sm" title="Edit">
              <i class="fas fa-pen"></i>
            </a>
            <button class="btn btn-outline-danger btn-sm delete-btn" data-id="${id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>`;
      },
      cellClick: (e, cell) => {
        if (e.target.closest(".delete-btn")) {
          const rowData = cell.getRow().getData();

          Swal.fire({
            title: "Are you sure?",
            text: `Deleting ${rowData.name}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            confirmButtonText: "Yes, delete it!",
          }).then((result) => {
            if (result.isConfirmed) {
              handleDeleteVendor(rowData);
            }
          });
        }
      },
    };

    const columnsWithActions = [...ALL_COLUMNS, actionsColumn];

    tabulatorRef.current = new Tabulator(tableRef.current, {
      layout: "fitColumns",
      height: "600px",
      placeholder: "No records found",
      pagination: true,
      paginationMode: "remote",
      paginationSize: 20,
      paginationSizeSelector: [20, 30, 40, 50],
      sortMode: "remote",
      ajaxURL: `${API_BASE}api/vendor/vendors_list`,

      ajaxParams: function () {
        return {
          status: vendor_status || "",
          vendor_search: searchValue || "",
          vendor_locality: vendor_locality || "",
        };
      },

      ajaxRequestFunc: async (url, config, params) => {
        const sorter =
          params.sort && params.sort.length > 0 ? params.sort[0] : null;

        const requestParams = {
          page: params.page || 1,
          size: params.size || 20,
          status: params.status || "",
          vendor_search: params.vendor_search || "",
          vendor_locality: params.vendor_locality || "",
          sort_by: sorter ? sorter.field : "",
          sort_dir: sorter ? sorter.dir : "",
        };

        const query = new URLSearchParams(requestParams).toString();
        const response = await apiFetch(`${url}?${query}`);
        return response;
      },

      ajaxResponse: function (url, params, response) {
        return {
          data: response.data || [],
          last_page: response.last_page || 1,
        };
      },

      columns: columnsWithActions.map((col) => {
        if (col.fixed) {
          return { ...col, visible: true };
        }
        if (col.optional) {
          return {
            ...col,
            visible: visibleOptionalCols.includes(col.field),
          };
        }
        return col;
      }),
    });

    return () => tabulatorRef.current?.destroy();
  }, [searchValue, vendor_status, vendor_locality, handleDeleteVendor]);

  const applyFilter = () => {
    if (tabulatorRef.current) {
      tabulatorRef.current.replaceData();
    }
  };

  const clearFilter = () => {
    setSearchValue("");
    setVendorStatus("");
    setVendorLocality("");
    setVendors([]);
    setShowDropdown(false);
    if (tabulatorRef.current) {
      tabulatorRef.current.replaceData();
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="d-flex justify-content-between ps-1 mb-2">
        <h5 className="mt-2 pb-1 fw-bold">
          <FontAwesomeIcon icon={faListUl} className="me-2 text-primary" /> All
          Vendors
        </h5>
        <div className="d-flex gap-2 align-items-center">
          <div className="d-flex gap-2">
            {/* Actions dropdown */}
            <div className="btn-group">
              <button
                className="btn btn-outline-dark"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fas fa-bars me-2"></i>
                Actions
              </button>
              <button
                className="btn btn-dark dropdown-toggle dropdown-toggle-split"
                data-bs-toggle="dropdown"
              ></button>

              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <a
                    className="dropdown-item"
                    href={"/vendor/addnewvendor"}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Add New
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="card-body">
          <div>
            <div className="row mb-3 g-3">
              {/* Vendor Search */}
              <div className="col-md-4">
                <label className="form-label">Search</label>
                <div className="position-relative">
                  <input
                    id="filter_vendor"
                    name="vendor_search"
                    type="text"
                    autoComplete="off"
                    className="form-control"
                    placeholder="Vendor Name or Vendor Code"
                    value={searchValue}
                    onChange={(e) => {
                      handleVendorSearch(e.target.value);
                      if (tabulatorRef.current) {
                        tabulatorRef.current.setPage(1);
                      }
                    }}
                    onFocus={() => vendors.length && setShowDropdown(true)}
                  />

                  {showDropdown && vendors.length > 0 && (
                    <ul
                      className="list-group position-absolute w-100 shadow"
                      style={{
                        zIndex: 1000,
                        maxHeight: "250px",
                        overflowY: "auto",
                      }}
                    >
                      {vendors.map((vendor) => (
                        <li
                          key={vendor.id}
                          className="list-group-item list-group-item-action"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSelectVendor(vendor)}
                        >
                          <strong>{vendor.vendor_code}</strong> -{" "}
                          {vendor.vendor_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Vendor Status */}
              <div className="col-md-4">
                <label className="form-label">Vendor Status</label>
                <select
                  name="status"
                  className="form-control form-select"
                  value={vendor_status}
                  onChange={(e) => {
                    setVendorStatus(e.target.value);
                    if (tabulatorRef.current) {
                      tabulatorRef.current.setPage(1);
                    }
                  }}
                >
                  <option value="">All</option>
                  {[
                    { id: 0, name: "Pending" },
                    { id: 1, name: "In Process" },
                    { id: 2, name: "Active" },
                    { id: 3, name: "Reject" },
                    { id: 4, name: "On Hold" },
                  ]?.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Locality */}
              <div className="col-md-4">
                <label className="form-label">Company Locality</label>
                <select
                  name="vendor_locality"
                  className="form-control form-select"
                  value={vendor_locality}
                  onChange={(e) => {
                    setVendorLocality(e.target.value);
                    if (tabulatorRef.current) {
                      tabulatorRef.current.setPage(1);
                    }
                  }}
                >
                  <option value="">All</option>
                  {[
                    { id: 0, name: "Local" },
                    { id: 1, name: "International" },
                  ]?.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* FILTER ACTIONS */}
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-primary" onClick={applyFilter}>
                <i className="fas fa-search me-2"></i>
                Filter
              </button>

              <button className="btn btn-light" onClick={clearFilter}>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-body p-0 m-0">
          <div ref={tableRef} />
        </div>
      </div>

      <ColumnModal />
    </>
  );
};

export default AllVendors;