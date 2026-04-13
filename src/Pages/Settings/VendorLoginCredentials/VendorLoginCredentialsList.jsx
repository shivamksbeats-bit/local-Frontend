import React, { useEffect, useMemo, useRef, useState } from "react";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import { API_BASE } from "../../../Config/api";
import VendorLoginCredentialModals from "./VendorLoginCredentialModals";
import Swal from "sweetalert2";
import { apiFetch } from "../../../Utils/apiFetch";
import { useAuth } from "../../../Context/AuthContext";

const VendorLoginCredentialsList = () => {
  const { user, authChecked } = useAuth();
  const isSuper = Boolean(user?.is_superuser);
  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  const [modalConfig, setModalConfig] = useState({ type: null, data: null });
  const [vendorsList, setVendorsList] = useState([]);
  const [tableRows, setTableRows] = useState([]);

  const refreshTable = () => tabulatorRef.current?.replaceData();

  const credentialVendorIds = useMemo(() => new Set((tableRows || []).map((r) => r.vendor_id)), [tableRows]);

  useEffect(() => {
    if (!isSuper) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`${API_BASE}api/vendor_api/lists`);
        if (!cancelled && res?.data) setVendorsList(res.data);
      } catch {
        if (!cancelled) setVendorsList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuper]);

  const handleDelete = async (row) => {
    Swal.fire({
      title: "Remove credentials?",
      text: `This will delete stored login details for ${row.vendor_company_name || "this vendor"}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#111827",
      confirmButtonText: "Yes, remove",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await apiFetch(`${API_BASE}api/vendor-portal-credentials/delete/${row.credential_id}`, {
          method: "DELETE",
        });
        if (res.status) {
          Swal.fire("Removed", res.message || "Credentials deleted.", "success");
          refreshTable();
        }
      } catch (e) {
        Swal.fire("Error", e.message || "Failed to delete", "error");
      }
    });
  };

  useEffect(() => {
    if (!isSuper) return;
    if (tabulatorRef.current) {
      tabulatorRef.current.destroy();
      tabulatorRef.current = null;
    }
    tabulatorRef.current = new Tabulator(tableRef.current, {
      layout: "fitColumns",
      height: "750px",
      placeholder: `<div class="cl-state-cell"><div class="cl-state-icon"><i class="fas fa-key"></i></div>No vendor login credentials yet</div>`,
      ajaxURL: `${API_BASE}api/vendor-portal-credentials`,
      ajaxRequestFunc: async (url) => {
        const query = new URLSearchParams({ search: searchValue || "" }).toString();
        const response = await apiFetch(`${url}?${query}`);
        const rows = response.data || [];
        setTableRows(rows);
        return response;
      },
      ajaxResponse: (url, params, response) => response.data || [],
      columns: [
        {
          title: "Vendor",
          field: "vendor_company_name",
          minWidth: 200,
          headerSort: false,
          formatter: (cell) => {
            const d = cell.getData();
            return `<div><span style="font-weight:700;color:#111827;font-size:14px;">${cell.getValue() || "—"}</span><br/>
              <span style="font-size:12px;color:#6b7280;font-family:monospace;">${d.vendor_code || ""}</span></div>`;
          },
        },
        {
          title: "Website user name",
          field: "website_username",
          minWidth: 140,
          headerSort: false,
          formatter: (cell) =>
            `<span style="font-size:13px;color:#374151;font-weight:600;">${cell.getValue() || "—"}</span>`,
        },
        {
          title: "User email",
          field: "website_user_email",
          minWidth: 200,
          headerSort: false,
          formatter: (cell) => `<span style="font-size:12px;color:#4b5563;">${cell.getValue() || "—"}</span>`,
        },
        {
          title: "Website link",
          field: "website_link",
          minWidth: 220,
          headerSort: false,
          formatter: (cell) => {
            const u = cell.getValue() || "";
            const short = u.length > 48 ? `${u.slice(0, 46)}…` : u;
            return `<a href="${u}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:#2563eb;">${short || "—"}</a>`;
          },
        },
        {
          title: "OTP",
          field: "otp_enabled",
          width: 90,
          hozAlign: "center",
          headerSort: false,
          formatter: (cell) =>
            cell.getValue()
              ? `<span style="padding:3px 8px;border-radius:20px;font-size:10px;font-weight:700;background:#fef3c7;color:#b45309;">ON</span>`
              : `<span style="padding:3px 8px;border-radius:20px;font-size:10px;font-weight:700;background:#f3f4f6;color:#6b7280;">OFF</span>`,
        },
        {
          title: "Status",
          field: "is_active",
          width: 100,
          hozAlign: "center",
          headerSort: false,
          formatter: (cell) => {
            const active = cell.getValue() === true || cell.getValue() === 1;
            return active
              ? `<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#dcfce7;color:#15803d;">ACTIVE</span>`
              : `<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#fee2e2;color:#b91c1c;">INACTIVE</span>`;
          },
        },
        {
          title: "Actions",
          width: 160,
          hozAlign: "center",
          headerSort: false,
          formatter: function () {
            const wrap = document.createElement("div");
            wrap.style.cssText = "display:flex;gap:5px;justify-content:center;align-items:center;";
            const editBtn = document.createElement("button");
            editBtn.className = "cl-edit-btn edit-btn";
            editBtn.innerHTML = `<i class="fas fa-pen"></i> Edit`;
            const delBtn = document.createElement("button");
            delBtn.className = "cl-del-btn delete-btn";
            delBtn.innerHTML = `<i class="fas fa-trash"></i>`;
            wrap.appendChild(editBtn);
            wrap.appendChild(delBtn);
            return wrap;
          },
          cellClick: (e, cell) => {
            const btn = e.target.closest("button");
            if (!btn) return;
            const rowData = cell.getData();
            if (btn.classList.contains("edit-btn")) setModalConfig({ type: "edit", data: rowData });
            else if (btn.classList.contains("delete-btn")) handleDelete(rowData);
          },
        },
      ],
    });
    return () => tabulatorRef.current?.destroy();
  }, [searchValue, isSuper]);

  if (!authChecked) {
    return null;
  }

  if (!isSuper) {
    return (
      <div className="cl-wrap">
        <div className="cl-card tbl-purple p-5 text-center">
          <i className="fas fa-lock fa-2x text-muted mb-3" />
          <h4 className="fw-bold text-dark">Access restricted</h4>
          <p className="text-muted mb-0">Vendor login credentials are visible only to Super Admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cl-wrap">
      <div className="cl-header">
        <div className="cl-title-wrap">
          <div className="cl-icon">
            <i className="fas fa-key" />
          </div>
          <div>
            <h3 className="cl-title">Vendor Login Credentials</h3>
            <p className="cl-subtitle">Manage encrypted vendor portal logins (Super Admin only)</p>
          </div>
        </div>
        <button className="cl-search-btn" type="button" onClick={() => setModalConfig({ type: "add", data: null })}>
          <i className="fas fa-plus" /> Add credential
        </button>
      </div>

      <div className="cl-search-wrap">
        <div className="cl-search-inner">
          <i className="fas fa-search cl-search-icon" />
          <input
            type="text"
            className="cl-search-input"
            placeholder="Search vendor credentials…"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              tabulatorRef.current?.replaceData();
            }}
          />
        </div>
        <button className="cl-search-btn" type="button" onClick={() => tabulatorRef.current?.replaceData()}>
          <i className="fas fa-search" /> Search
        </button>
        {searchValue && (
          <button
            type="button"
            className="cl-clear-btn"
            onClick={() => {
              setSearchValue("");
              tabulatorRef.current?.replaceData();
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="cl-card tbl-purple">
        <div ref={tableRef} />
      </div>

      {modalConfig.type && (
        <VendorLoginCredentialModals
          config={modalConfig}
          onClose={() => setModalConfig({ type: null, data: null })}
          onRefresh={refreshTable}
          credentialVendorIds={credentialVendorIds}
          vendorsList={vendorsList}
        />
      )}
    </div>
  );
};

export default VendorLoginCredentialsList;
