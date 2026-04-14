import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Row, Col, Button, Card, Badge, Spinner, Tabs, Tab, FormGroup, Table } from 'react-bootstrap';
import { toast } from "react-hot-toast";
import { apiFetch } from "../../Utils/apiFetch";
import { API_BASE } from "../../Config/api";
import useMasterData from "../../Context/MasterDataProvider";
import Swal from "sweetalert2";
import SearchableSelect from "../../Components/Common/SearchableSelect";
import { showErrorToast, formatToISODate } from "../../Utils/utilFunctions";
import DateInput from "../../Components/Common/DateInput";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListUl, faSave, faUndo, faPen, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import StickyHeader from "../../Components/Common/StickyHeader";
import ABNInput from "../../Components/Common/ABNInput";
import ACNInput from "../../Components/Common/ACNInput";
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { AddressForm } from "./AddressForm";
import VendorPOList from "../../Components/VendorPOList";
import VendorPaymentForm from "./Edit/tabs/VendorPaymentForm";

// ─── Flush Registry Context ──────────────────────────────────────
const FlushRegistryContext = createContext(null);

const useFlushRegistry = () => {
    const registryRef = useRef(new Set());

    const register = useCallback((flushFn) => {
        registryRef.current.add(flushFn);
        return () => registryRef.current.delete(flushFn);
    }, []);

    const flushAll = useCallback(() => {
        registryRef.current.forEach(fn => fn());
    }, []);

    return { register, flushAll };
};

// ─── Optimized uncontrolled text input ───────────────────────────
const DeferredInput = React.memo(({ value, name, onChange, onValidate, helpText, component: Component = Form.Control, ...rest }) => {
    const [localValue, setLocalValue] = useState(value ?? "");
    const [isFocused, setIsFocused] = useState(false);
    const prevValueRef = useRef(value);
    const localValueRef = useRef(localValue);
    const registry = useContext(FlushRegistryContext);

    useEffect(() => { localValueRef.current = localValue; }, [localValue]);

    useEffect(() => {
        if (value !== prevValueRef.current) {
            setLocalValue(value ?? "");
            localValueRef.current = value ?? "";
            prevValueRef.current = value;
        }
    }, [value]);

    const flush = useCallback(() => {
        const current = localValueRef.current;
        if (current !== value) {
            onChange({ target: { name, value: current, type: "text" } });
        }
    }, [value, name, onChange]);

    useEffect(() => {
        if (registry) return registry(flush);
    }, [registry, flush]);

    const handleLocalChange = useCallback((e) => {
        const val = e.target.value;
        if (onValidate && !onValidate(val)) return;
        setLocalValue(val);
        localValueRef.current = val;
    }, [onValidate]);

    const handleBlur = useCallback(() => {
        flush();
        setIsFocused(false);
    }, [flush]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') flush();
    }, [flush]);

    return (
        <>
            <Component
                {...rest}
                name={name}
                value={localValue}
                onChange={handleLocalChange}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
            {helpText && isFocused && (
                <Form.Text className="text-muted">{helpText}</Form.Text>
            )}
        </>
    );
});

DeferredInput.displayName = "DeferredInput";

// ─── Optimized uncontrolled number input ─────────────────────────
const DeferredNumberInput = React.memo(({ value, name, onChange, min, max, step, onValidate, helpText, ...rest }) => {
    const [localValue, setLocalValue] = useState(value ?? "");
    const [isFocused, setIsFocused] = useState(false);
    const prevValueRef = useRef(value);
    const localValueRef = useRef(localValue);
    const registry = useContext(FlushRegistryContext);

    useEffect(() => { localValueRef.current = localValue; }, [localValue]);

    useEffect(() => {
        if (value !== prevValueRef.current) {
            setLocalValue(value ?? "");
            localValueRef.current = value ?? "";
            prevValueRef.current = value;
        }
    }, [value]);

    const flush = useCallback(() => {
        const current = localValueRef.current;
        if (current !== value) {
            onChange({ target: { name, value: current, type: "number" } });
        }
    }, [value, name, onChange]);

    useEffect(() => {
        if (registry) return registry(flush);
    }, [registry, flush]);

    const handleLocalChange = useCallback((e) => {
        const val = e.target.value;
        if (onValidate && !onValidate(val)) return;
        setLocalValue(val);
        localValueRef.current = val;
    }, [onValidate]);

    const handleBlur = useCallback(() => {
        flush();
        setIsFocused(false);
    }, [flush]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') flush();
    }, [flush]);

    return (
        <>
            <Form.Control
                {...rest}
                type="number"
                name={name}
                value={localValue}
                min={min}
                max={max}
                step={step}
                onChange={handleLocalChange}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
            {helpText && isFocused && (
                <Form.Text className="text-muted">{helpText}</Form.Text>
            )}
        </>
    );
});

DeferredNumberInput.displayName = "DeferredNumberInput";

// ─── Optimized textarea ──────────────────────────────────────────
const DeferredTextarea = React.memo(({ value, name, onChange, maxLength, rows, ...rest }) => {
    const [localValue, setLocalValue] = useState(value ?? "");
    const [isFocused, setIsFocused] = useState(false);
    const prevValueRef = useRef(value);
    const localValueRef = useRef(localValue);
    const registry = useContext(FlushRegistryContext);

    useEffect(() => { localValueRef.current = localValue; }, [localValue]);

    useEffect(() => {
        if (value !== prevValueRef.current) {
            setLocalValue(value ?? "");
            localValueRef.current = value ?? "";
            prevValueRef.current = value;
        }
    }, [value]);

    const flush = useCallback(() => {
        const current = localValueRef.current;
        if (current !== value) {
            onChange({ target: { name, value: current, type: "text" } });
        }
    }, [value, name, onChange]);

    useEffect(() => {
        if (registry) return registry(flush);
    }, [registry, flush]);

    const handleBlur = useCallback(() => {
        flush();
        setIsFocused(false);
    }, [flush]);

    return (
        <>
            <Form.Control
                {...rest}
                as="textarea"
                name={name}
                rows={rows}
                maxLength={maxLength}
                value={localValue}
                onChange={(e) => {
                    setLocalValue(e.target.value);
                    localValueRef.current = e.target.value;
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
            />
            {maxLength && isFocused && (
                <Form.Text className="text-muted">{localValue.length}/{maxLength}</Form.Text>
            )}
        </>
    );
});

DeferredTextarea.displayName = "DeferredTextarea";


const AddNewVendor = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("primary");
    const { paymentTerms, warehouses, countries } = useMasterData();
    const [activePaymentView, setActivePaymentView] = useState("bank_transfer");
    const { register, flushAll } = useFlushRegistry();

    const [formData, setFormData] = useState({
        vendor_code: "",
        vendor_name: "",
        vendor_company_name: "",
        vendor_type: "",
        currency: "",
        min_order_value: "",
        vendor_account_number:"",
        status: "",
        is_taxable: false,
        tax_percent: "",
        company_abn: "",
        company_acn: "",
        company_website: "",
        company_locality: "",

        payment_term: "",
        mode_of_payment: ["bank_transfer"],
        paypal_notes: "",
        wallet_notes: "",
        credit_card_notes: "",
        bank_name: "",
        bank_account_holder_name: "",
        bank_ifsc: "",
        bank_country: "",
        bank_account_number:"",
        bank_account_number_confirm:"",
        first_contact_date: "",
        first_contact_via: "",   
        onboard_date: "",
        onboard_by: "",
        onboard_comments: "",
        medium_of_contact: "",
    });

    const formDataRef = useRef(formData);
    useEffect(() => { formDataRef.current = formData; }, [formData]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            ...(name === "is_taxable" && checked ? { tax_percent: "0" } : {})
        }));
    }, []);

    const validateVendorCode = useCallback((val) => /^[a-zA-Z0-9_-]*$/.test(val), []);
    const validateAlphanumeric = useCallback((val) => /^[a-zA-Z0-9]*$/.test(val), []);
    const validateMinOrder = useCallback((val) => {
        return val === "" || (/^\d*\.?\d{0,2}$/.test(val) && Number(val) <= 10000000);
    }, []);

    const validateRequiredFields = useCallback((data) => {
        const fd = data || formDataRef.current;
        const missing = [];

        if (!fd.vendor_code?.trim()) missing.push("Vendor Code");
        if (!fd.vendor_company_name?.trim()) missing.push("Vendor Company Name");
        if (!fd.vendor_name?.trim()) missing.push("Vendor Display Name");

        const paymentMethods = Array.isArray(fd.mode_of_payment)
            ? fd.mode_of_payment
            : (fd.mode_of_payment || "").split(",").filter(Boolean);

        const hasBankTransfer = paymentMethods.some(
            m => m.toLowerCase().includes("bank") || m.toLowerCase() === "bank_transfer" || m.toLowerCase() === "bank transfer"
        );

        if (hasBankTransfer) {
            if (!fd.bank_name?.trim()) missing.push("Bank Name");
            if (!fd.bank_account_holder_name?.trim()) missing.push("Bank Account Holder Name");
            if (!fd.bank_ifsc?.trim()) missing.push("BSB / IFSC / SWIFT Code");
            if (!fd.bank_account_number?.trim()) missing.push("Bank Account Number");
            if (!fd.bank_account_number_confirm?.trim()) missing.push("Re-enter Account Number");
            if (
                fd.bank_account_number?.trim() &&
                fd.bank_account_number_confirm?.trim() &&
                fd.bank_account_number.trim() !== fd.bank_account_number_confirm.trim()
            ) {
                missing.push("Bank Account Number mismatch");
            }
        }

        return missing;
    }, []);

    const flushAndRun = useCallback((callback) => {
        flushAll();
        requestAnimationFrame(() => {
            setTimeout(() => {
                callback(formDataRef.current);
            }, 0);
        });
    }, [flushAll]);

    const showValidationError = useCallback((missing) => {
        Swal.fire({
            icon: 'error',
            title: 'Required Fields Missing',
            html: `<p class="mb-2" style="color: #555;">Please fill in the following required fields:</p>
                   <div class="text-start" style="font-size: 14px; padding: 0 20px;">
                       ${missing.map(f => `<div style="color: #dc3545; font-weight: 600; padding: 4px 0; border-bottom: 1px solid #f0f0f0;">✗ &nbsp;${f}</div>`).join("")}
                   </div>`,
        });
    }, []);

    // ✅ FIX: Removed console.log + return (debug code) — API call now actually runs
    const performSave = useCallback(async (fd, targetTab) => {
        setSaving(true);
        try {
            const res = await apiFetch(`${API_BASE}api/vendor/api/addvendor/`, {
                method: "POST",
                body: JSON.stringify({
                    ...fd,
                    mode_of_payment: Array.isArray(fd.mode_of_payment)
                        ? fd.mode_of_payment.join(",")
                        : fd.mode_of_payment,
                    tax_percent: fd.is_taxable ? parseFloat(fd.tax_percent || 0) : 0,
                    first_contact_date: formatToISODate(fd.first_contact_date),
                    onboard_date:       formatToISODate(fd.onboard_date),
                }),
            });

            if (res.status && res.vendor_id) {
                toast.success("Vendor registered successfully!");
                if (targetTab) {
                    navigate(`/vendor/editvendor/${res.vendor_id}`, { state: { activeTab: targetTab } });
                } else {
                    navigate(`/vendor/editvendor/${res.vendor_id}`);
                }
            } else {
                toast.error(res.message || "Registration failed");
            }
        } catch (err) {
            toast.error(err?.message || "Registration failed");
        } finally {
            setSaving(false);
        }
    }, [navigate]);

    const handleTabSelect = useCallback((key) => {
        setActiveTab(key);
    }, []);

    const handleCreate = useCallback(async (e) => {
        if (e) e.preventDefault();

        flushAndRun((latestData) => {
            const missing = validateRequiredFields(latestData);
            if (missing.length > 0) {
                showValidationError(missing);
                return;
            }
            performSave(latestData, null);
        });
    }, [flushAndRun, validateRequiredFields, showValidationError, performSave]);

    return (
        <FlushRegistryContext.Provider value={register}>
            <div className="mt-0">
                <StickyHeader>
                    <div className="d-flex justify-content-between mb-2 mt-0">
                        <div className="ps-0">
                            <h5 className="mt-2 pb-1 fw-bold"><FontAwesomeIcon icon={faPen} className="me-2 text-primary" />Vendor Registration</h5>
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                            <button type="button" className="btn btn-outline-primary px-3 shadow-sm" onClick={() => navigate("/vendor/vendors")}>
                                <FontAwesomeIcon className="me-1" icon={faListUl} /> Listing
                            </button>
                            <button type="submit" form="vendor-form" className="btn btn-primary px-3 shadow-sm" disabled={saving}>
                                <FontAwesomeIcon className="me-1" icon={faSave} />
                                {saving ? "Saving..." : "Create"}
                            </button>
                            <button type="button" className="btn btn-secondary px-3 shadow-sm" onClick={() => navigate(-1)}>
                                <FontAwesomeIcon className="me-1" icon={faUndo} /> Cancel
                            </button>
                        </div>
                    </div>
                </StickyHeader>

                <div className="bg-white shadow-sm mt-4">
                    <Form id="vendor-form" onSubmit={handleCreate}>
                        <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mb-4 custom-tabs mt-2">

                            {/* Primary Details Tab */}
                            <Tab eventKey="primary" title="Primary Details">
                                <div className="py-3 px-3">
                                    <Row className="mb-3">
                                        <Col md={4} className="px-3">
                                            <FormGroup className="mb-3">
                                                <Form.Label className="small fw-bold">Vendor Code <span className="text-danger">*</span></Form.Label>
                                                <DeferredInput
                                                    name="vendor_code" placeholder="VEND001" maxLength={20}
                                                    value={formData.vendor_code} onChange={handleChange}
                                                    onValidate={validateVendorCode}
                                                    helpText="Max 20 characters. Letters, numbers, hyphens, underscores only."
                                                    required
                                                />
                                            </FormGroup>
                                            <FormGroup className="mb-3">
                                                <Form.Label className="small fw-bold">Vendor Company Name <span className="text-danger">*</span></Form.Label>
                                                <DeferredInput
                                                    name="vendor_company_name" maxLength={120} placeholder="Enter vendor company name"
                                                    value={formData.vendor_company_name} onChange={handleChange} required
                                                />
                                            </FormGroup>
                                            <FormGroup className="mb-3">
                                                <Form.Label className="small fw-bold">Vendor Display Name <span className="text-danger">*</span></Form.Label>
                                                <DeferredInput
                                                    name="vendor_name" maxLength={120} placeholder="Enter vendor display name"
                                                    value={formData.vendor_name} onChange={handleChange} required
                                                />
                                            </FormGroup>
                                            <FormGroup className="mb-3">
                                                <Form.Label className="small fw-bold">Vendor Type</Form.Label>
                                                <Form.Select name="vendor_type" value={formData.vendor_type} onChange={handleChange}>
                                                    <option value="">Select</option>
                                                    {[{ id: "Dropship", name: "Dropship" }, { id: "Distributor", name: "Distributor" }, { id: "Both", name: "Both" }].map(pt => (
                                                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                                                    ))}
                                                </Form.Select>
                                            </FormGroup>
                                        </Col>

                                        <Col md={4} className="px-3">
                                            <FormGroup className="mb-3">
                                                <Form.Label className="small fw-bold">Currency</Form.Label>
                                                <SearchableSelect
                                                    name="currency" options={countries} value={formData.currency}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                                                    labelKey="currency" valueKey="currency" unique={true} placeholder="Search currency..."
                                                    renderLabel={(v) => (
                                                        <div className="w-100">
                                                            <span className="fw-bold">{v.currency}</span>
                                                            {v.name && <span className="ms-2 text-muted small">- {v.name}</span>}
                                                        </div>
                                                    )}
                                                />
                                            </FormGroup>
                                            <FormGroup className="mb-3">
                                                <Form.Label className="small fw-bold">Minimum Order Value</Form.Label>
                                                <DeferredNumberInput
                                                    name="min_order_value" placeholder="0"
                                                    value={formData.min_order_value} min="0" max="10000000" step="0.01"
                                                    onChange={handleChange} onValidate={validateMinOrder} helpText="Max: 10,000,000"
                                                />
                                            </FormGroup>
                                            <FormGroup className="mb-3">
                                                <Form.Label className="small fw-bold">Vendor Account Number</Form.Label>
                                                <DeferredInput
                                                    name="vendor_account_number" placeholder="" maxLength={25}
                                                    value={formData.vendor_account_number} onChange={handleChange}
                                                    onValidate={validateAlphanumeric}
                                                    helpText="Letters and numbers only. Max 25 characters."
                                                />
                                            </FormGroup>

                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <FormGroup className="mb-0">
                                                    <Form.Label className="small fw-bold">Vendor Status</Form.Label>
                                                    <Form.Select name="status" value={formData.status} onChange={handleChange}>
                                                        <option value="">Select</option>
                                                        {[{ id: 0, name: "Pending" }, { id: 1, name: "In Process" }, { id: 2, name: "Active" }, { id: 3, name: "Reject" }, { id: 4, name: "On Hold" }].map(pt => (
                                                            <option key={pt.id} value={pt.id}>{pt.name}</option>
                                                        ))}
                                                    </Form.Select>
                                                </FormGroup>

                                                <div className="d-flex align-items-center justify-content-around" style={{ minWidth: "68px", minHeight: "64px" }}>
                                                    <Form.Label className="small fw-bold me-2 mb-0" style={{ marginTop: "22px" }}>Taxable</Form.Label>
                                                    <Form.Check
                                                        type="switch" id="tax-free-switch" name="is_taxable"
                                                        className="fw-bold fs-7" checked={formData.is_taxable} onChange={handleChange}
                                                    />
                                                </div>

                                                {formData.is_taxable ? (
                                                    <div>
                                                        <Form.Label className="small fw-bold mb-1">Tax %</Form.Label>
                                                        <Form.Control
                                                            type="number" name="tax_percent" placeholder="0" size="sm"
                                                            value={formData.tax_percent} min="0" max="100" step="0.01"
                                                            style={{ width: "80px" }}
                                                            onChange={(e) => {
                                                                let val = e.target.value;
                                                                if (val === "") { setFormData(prev => ({ ...prev, tax_percent: "" })); return; }
                                                                const numericVal = parseFloat(val);
                                                                if (isNaN(numericVal)) return;
                                                                if (numericVal < 0) setFormData(prev => ({ ...prev, tax_percent: 0 }));
                                                                else if (numericVal > 100) setFormData(prev => ({ ...prev, tax_percent: 100 }));
                                                                else setFormData(prev => ({ ...prev, tax_percent: numericVal }));
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div style={{ width: "80px" }} />
                                                )}
                                            </div>
                                        </Col>

                                        <Col md={4} className="px-3">
                                            <FormGroup className="mb-3">
                                                <Form.Label className="small fw-bold">Company ABN</Form.Label>
                                                <ABNInput value={formData.company_abn} onChange={handleChange} name="company_abn" />
                                            </FormGroup>
                                            <FormGroup className="mb-3">
                                                <Form.Label className="small fw-bold">Company ACN</Form.Label>
                                                <ACNInput value={formData.company_acn} onChange={handleChange} name="company_acn" />
                                            </FormGroup>
                                            <FormGroup className="mb-3">
                                                <Form.Label className="small fw-bold">Company Website</Form.Label>
                                                <DeferredInput
                                                    type="url" name="company_website" placeholder="https://example.com"
                                                    maxLength={255} value={formData.company_website} onChange={handleChange}
                                                    helpText="Max 255 characters."
                                                />
                                            </FormGroup>
                                            <FormGroup className="mb-3">
                                                <Form.Label className="small fw-bold">Company Locality</Form.Label>
                                                <Form.Select name="company_locality" value={formData.company_locality} onChange={handleChange}>
                                                    <option value="">Select</option>
                                                    {[{ id: 0, name: "Local" }, { id: 1, name: "International" }].map(pt => (
                                                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                                                    ))}
                                                </Form.Select>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>
                            </Tab>

                            {/* Payment Details Tab */}
                            <Tab eventKey="payment" title="Payment Details">
                                <VendorPaymentForm data={formData} onChange={setFormData} paymentTerms={paymentTerms} countries={countries} />
                            </Tab>

                            {/* Onboard Details Tab */}
                            <Tab eventKey="onboard_details" title="Onboard Details">
                                <Row className="py-3 px-3">
                                    <Col md="4" className="px-3 float-start">
                                        <FormGroup className="mb-3">
                                            <Form.Label className="small fw-bold">First Contact Date</Form.Label>
                                            <DateInput
                                                value={formData.first_contact_date || null}
                                                onChange={date =>
                                                setFormData(prev => ({ ...prev, first_contact_date: date }))
                                                }
                                            />
                                            
                                        </FormGroup>
                                        <FormGroup className="mb-3">
                                            <Form.Label className="small fw-bold">First Contact Via</Form.Label>
                                            <Form.Select name="first_contact_via" value={formData.first_contact_via} onChange={handleChange}>
                                                <option value="">Select</option>
                                                <option value="email">Email</option>
                                                <option value="phone">Phone</option>
                                                <option value="web_form">Web Form</option>
                                            </Form.Select>
                                        </FormGroup>
                                    </Col>
                                    <Col md="4" className="px-3 float-start">
                                        <FormGroup className="mb-3">
                                            <Form.Label className="small fw-bold">Onboard Date</Form.Label>
                                            <DateInput
                                                value={formData.onboard_date || null}
                                                onChange={date =>
                                                setFormData(prev => ({ ...prev, onboard_date: date }))
                                                }
                                            />
                                            
                                        </FormGroup>
                                        <FormGroup className="mb-3">
                                            <Form.Label className="small fw-bold">Onboard By</Form.Label>
                                            <DeferredInput
                                                name="onboard_by" maxLength={100}
                                                value={formData.onboard_by} onChange={handleChange}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md="4" className="px-3 float-start">
                                        {/* ✅ FIX: name → medium_of_contact (was mode_of_contact) */}
                                        <FormGroup className="mb-3">
                                            <Form.Label className="small fw-bold">How We Find This Vendor</Form.Label>
                                            <Form.Select name="medium_of_contact" value={formData.medium_of_contact} onChange={handleChange}>
                                                <option value="">Select</option>
                                                <option value="google">Google</option>
                                                <option value="trade_show">Trade Show</option>
                                                <option value="network">Network</option>
                                            </Form.Select>
                                        </FormGroup>
                                        <FormGroup className="mb-3">
                                            <Form.Label className="small fw-bold">Onboard Comments</Form.Label>
                                            <DeferredTextarea
                                                name="onboard_comments" rows={4} maxLength={500}
                                                value={formData.onboard_comments} onChange={handleChange}
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Tab>

                            {/* Vendor Details Tab - Disabled */}
                            <Tab eventKey="vendor_warehouse" title="Vendor Details" tabClassName="vendor-tab">
                                <div className="py-0 px-2 pb-1">
                                    <Button variant="link" disabled={true} className="p-0 text-decoration-none mb-3 float-right small">
                                        <i className="fas fa-plus-circle me-1"></i> Add Location
                                    </Button>
                                    <Table size="sm" bordered hover className="text-center align-middle" style={{ fontSize: '13px' }}>
                                        <thead className="table-light text-muted">
                                            <tr>
                                                <th style={{ width: "30%" }}>WAREHOUSE NAME</th>
                                                <th style={{ width: "30%" }}>DELIVERY NAME</th>
                                                <th style={{ width: "15%" }}>CITY</th>
                                                <th style={{ width: "10%" }}>ZIP</th>
                                                <th style={{ width: '5%' }}>ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td colSpan="5" className="py-4 text-muted">No locations found</td></tr>
                                        </tbody>
                                    </Table>
                                </div>
                            </Tab>

                            {/* Shopperbeats Address Details Tab - Disabled */}
                            <Tab eventKey="address" title="Shopperbeats Address Details" tabClassName="vendor-tab">
                                <div className="text-end mb-2">
                                    <Button variant="link" size="sm" className="text-decoration-none">
                                        <i className="fas fa-copy me-1"></i>Copy Billing to Shipping
                                    </Button>
                                </div>
                                <Row className="py-3">
                                    <AddressForm type="billing" data={[]} countries={countries} onChange={() => { return null; }} states={[]} />
                                    <AddressForm type="shipping" data={[]} countries={countries} onChange={() => { return null; }} states={[]} />
                                </Row>
                            </Tab>

                            {/* Contact Details Tab - Disabled */}
                            <Tab eventKey="contact" title="Contact Details" tabClassName="vendor-tab">
                                <div className="py-0 px-2 pb-1">
                                    <Button variant="link" className="p-0 text-decoration-none mb-3 float-right small" disabled={true}>
                                        <i className="fas fa-plus-circle me-1"></i> Add Contact
                                    </Button>
                                    <Table size="sm" bordered hover className="text-center align-middle" style={{ fontSize: '13px' }}>
                                        <thead className="table-light text-muted">
                                            <tr>
                                                <th>NAME</th><th>DEPARTMENT</th><th>EMAIL</th><th>PHONE</th>
                                                <th style={{ width: '100px' }}>ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td colSpan="5" className="py-4 text-muted">No contacts found</td></tr>
                                        </tbody>
                                    </Table>
                                </div>
                            </Tab>

                            {/* Inventory Section Tab */}
                            <Tab eventKey="inventory" title="Inventory Section" tabClassName="vendor-tab">
                                <div className="p-4 text-center text-muted">
                                    <i className="fas fa-boxes fa-3x mb-3 opacity-50"></i>
                                    <h6 className="fw-bold">Inventory Section</h6>
                                    <p className="mb-0">Create vendor first to add inventory configuration.</p>
                                </div>
                            </Tab>

                            {/* Documents Tab */}
                            <Tab eventKey="documents" title="Documents" tabClassName="vendor-tab">
                                <div className="p-1 pb-2">
                                    <Row className="mb-4 align-items-end">
                                        <Col md={5}>
                                            <Form.Label className="small fw-bold">Upload New Document</Form.Label>
                                            <div className="border p-3 rounded bg-light border-dashed">
                                                <Form.Control type="file" size="sm" disabled={true} />
                                            </div>
                                        </Col>
                                        <Col md={7}>
                                            <p className="text-muted small mb-2">
                                                <i className="fas fa-info-circle me-1"></i>Supported formats: PDF, JPG, PNG. Max size: 5MB.
                                            </p>
                                        </Col>
                                    </Row>
                                    <div className="table-responsive border rounded">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr className="text-uppercase">
                                                    <th className="ps-3">Filename</th><th>Attached By</th>
                                                    <th>Attached Time</th><th className="text-end pe-3">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr><td colSpan="5" className="text-center py-4 text-muted">No documents attached yet.</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </Tab>

                            {/* Purchases Tab */}
                            <Tab eventKey="purchases" title="Purchases" tabClassName="vendor-tab">
                                <div className="ps-3 pe-3 pb-2">
                                    <VendorPOList vendorId={1} />
                                </div>
                            </Tab>

                            {/* Invoices Tab */}
                            <Tab eventKey="invoices" title="Invoices" tabClassName="vendor-tab">
                                <div className="p-4 text-center text-muted">
                                    <i className="fas fa-dollar-sign fa-3x mb-3 opacity-50"></i>
                                    <h6 className="fw-bold">Invoices</h6>
                                    <p className="mb-0">Create vendor first to view invoice history.</p>
                                </div>
                            </Tab>

                            {/* Returns Tab */}
                            <Tab eventKey="returns" title="Returns" tabClassName="vendor-tab">
                                <div className="p-4 text-center text-muted">
                                    <i className="fas fa-undo-alt fa-3x mb-3 opacity-50"></i>
                                    <h6 className="fw-bold">Vendor Returns Locked</h6>
                                </div>
                            </Tab>

                        </Tabs>
                    </Form>
                </div>
                <style jsx>{`
                    .vendor-disabled-tab { opacity: 0.5; cursor: not-allowed !important; pointer-events: all !important; }
                    .vendor-disabled-tab:hover { opacity: 0.6; }
                `}</style>
            </div>
        </FlushRegistryContext.Provider>
    );
};

export default AddNewVendor;