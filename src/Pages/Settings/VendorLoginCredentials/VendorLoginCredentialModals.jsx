import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE } from "../../../Config/api";
import { apiFetch } from "../../../Utils/apiFetch";

const emptyForm = () => ({
  vendor_id: "",
  website_username: "",
  website_user_email: "",
  website_user_password: "",
  website_link: "",
  otp_enabled: false,
  is_active: true,
});

const VendorLoginCredentialModals = ({ config, onClose, onRefresh, credentialVendorIds, vendorsList }) => {
  const { type, data } = config;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  useEffect(() => {
    if (type === "edit" && data) {
      setFormData({
        vendor_id: String(data.vendor_id),
        website_username: data.website_username || "",
        website_user_email: data.website_user_email || "",
        website_user_password: "",
        website_link: data.website_link || "",
        otp_enabled: Boolean(data.otp_enabled),
        is_active: Boolean(data.is_active),
      });
    } else if (type === "add") {
      setFormData(emptyForm());
    }
  }, [type, data]);

  const vendorOptions =
    type === "add" && Array.isArray(vendorsList)
      ? vendorsList.filter((v) => !credentialVendorIds.has(v.id))
      : [];

  const handleSave = async () => {
    const f = formData;
    if (type === "add" && !f.vendor_id) {
      return Swal.fire("Required", "Please select a vendor.", "info");
    }
    if (!f.website_username?.trim()) {
      return Swal.fire("Required", "Website user name is required.", "info");
    }
    if (!f.website_user_email?.trim()) {
      return Swal.fire("Required", "User email is required.", "info");
    }
    if (type === "add" && !f.website_user_password?.trim()) {
      return Swal.fire("Required", "User password is required.", "info");
    }
    if (!f.website_link?.trim()) {
      return Swal.fire("Required", "Website link is required.", "info");
    }

    setLoading(true);
    const body = {
      vendor_id: Number(f.vendor_id),
      website_username: f.website_username.trim(),
      website_user_email: f.website_user_email.trim(),
      website_link: f.website_link.trim(),
      otp_enabled: Boolean(f.otp_enabled),
      is_active: Boolean(f.is_active),
    };
    if (f.website_user_password?.trim()) {
      body.website_user_password = f.website_user_password.trim();
    }

    const url =
      type === "add"
        ? `${API_BASE}api/vendor-portal-credentials/create`
        : `${API_BASE}api/vendor-portal-credentials/update/${data.credential_id}`;

    try {
      const res = await apiFetch(url, {
        method: type === "add" ? "POST" : "PUT",
        body: JSON.stringify(body),
      });

      if (res.status) {
        Swal.fire("Success", res.message || "Saved", "success");
        onRefresh();
        onClose();
      } else {
        Swal.fire("Error", res.message || "Save failed", "error");
      }
    } catch (e) {
      Swal.fire("Error", e.message || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const title = type === "add" ? "Add Vendor Login Credential" : "Edit Vendor Login Credential";
  const subtitle = type === "add" ? "Create secure portal credentials" : "Update stored portal credentials";

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(4px)", zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
          <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex align-items-start justify-content-between">
            <div className="d-flex gap-2">
              <span className="text-dark mt-1">
                <i className={`fas ${type === "add" ? "fa-plus" : "fa-pen"}`} />
              </span>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">{title}</h5>
                <p className="text-muted small mb-0 mt-1">{subtitle}</p>
              </div>
            </div>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>

          <div className="modal-body px-4 pt-2 pb-4">
            {type === "add" && (
              <div className="mb-3">
                <label className="form-label small fw-bold text-uppercase text-secondary mb-1">
                  Vendor <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                >
                  <option value="">Select vendor…</option>
                  {vendorOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendor_code} — {v.vendor_name}
                    </option>
                  ))}
                </select>
                {vendorOptions.length === 0 && (
                  <div className="form-text text-warning">All vendors already have credentials, or no vendors exist.</div>
                )}
              </div>
            )}

            {type === "edit" && data && (
              <div className="mb-3 p-3 bg-light rounded border">
                <div className="small text-uppercase text-secondary fw-bold mb-1">Vendor</div>
                <div className="fw-semibold text-dark">
                  {data.vendor_code} — {data.vendor_company_name}
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-bold text-uppercase text-secondary mb-1">
                Website user name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="portal.username"
                autoComplete="off"
                value={formData.website_username}
                onChange={(e) => setFormData({ ...formData, website_username: e.target.value })}
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold text-uppercase text-secondary mb-1">
                  User email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="portal@vendor.com"
                  autoComplete="off"
                  value={formData.website_user_email}
                  onChange={(e) => setFormData({ ...formData, website_user_email: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold text-uppercase text-secondary mb-1">
                  User password <span className="text-danger">{type === "add" ? "*" : ""}</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder={type === "edit" ? "Leave blank to keep current password" : "Enter password"}
                  autoComplete="new-password"
                  value={formData.website_user_password}
                  onChange={(e) => setFormData({ ...formData, website_user_password: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label small fw-bold text-uppercase text-secondary mb-1">
                Website link <span className="text-danger">*</span>
              </label>
              <input
                type="url"
                className="form-control"
                placeholder="https://vendor-portal.example.com"
                value={formData.website_link}
                onChange={(e) => setFormData({ ...formData, website_link: e.target.value })}
              />
              <div className="form-text">Use full URL including https://</div>
            </div>

            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <label className="form-label small fw-bold text-uppercase text-secondary mb-1">OTP requirement</label>
                <select
                  className="form-select"
                  value={formData.otp_enabled ? "1" : "0"}
                  onChange={(e) => setFormData({ ...formData, otp_enabled: e.target.value === "1" })}
                >
                  <option value="0">Disabled</option>
                  <option value="1">Enabled</option>
                </select>
                <div className="form-text">Reserved for a future staff OTP workflow.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold text-uppercase text-secondary mb-1">Status</label>
                <select
                  className="form-select"
                  value={formData.is_active ? "active" : "inactive"}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "active" })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer border-0 bg-light px-4 py-3 d-flex justify-content-between">
            <button type="button" className="btn btn-light border px-4" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="button" className="btn btn-dark px-4" onClick={handleSave} disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : (
                <i className="fas fa-plus me-2" />
              )}
              {type === "add" ? "Create credential" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorLoginCredentialModals;
