import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Table, Spinner, Dropdown, ButtonGroup, Row, Col } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import { toast } from "react-hot-toast";
import { API_BASE } from "../../../Config/api";
import { apiFetch } from "../../../Utils/apiFetch";
import { showErrorToast } from "../../../Utils/utilFunctions";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faListUl, faUpload, faFileCsv, faTimes, faFileAlt, faFileExcel,
    faFileImport, faCheckCircle, faExclamationTriangle, faUndo, faSave, faDownload
} from '@fortawesome/free-solid-svg-icons';
import StickyHeader from "../../../Components/Common/StickyHeader";
import Swal from "sweetalert2";

const VendorImportIndex = () => {
    const navigate = useNavigate();
    const [importType, setImportType] = useState("vendor");
    const [selectedFile, setSelectedFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [duplicateAction, setDuplicateAction] = useState("skip"); // "skip" or "update"
    // Wizard Flow State
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Validation
    const [importSummary, setImportSummary] = useState({
        file_id: "",
        total_rows: 0,
        valid_count: 0,
        invalid_count: 0,
        preview_data: [],
        errors: []
    });

    const handleExportVendors = async (format) => {
        setIsDownloading(true);
        try {
            const res = await apiFetch(`${API_BASE}api/vendor/api/export-vendors?file_type=vendor&file_format=${format}`, {
                method: 'GET',
                responseType: 'blob'
            });

            const blob = new Blob([res.data], {
                type: res.headers['content-type'] || (format === 'xl' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv')
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = format === 'xl' ? 'xlsx' : 'csv';
            a.download = `vendor_export.${ext}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Vendor data exported!", {
                position: "bottom-center",
            });
        } catch (err) {
            showErrorToast("Download failed", {
                position: "bottom-center",
            });
        } finally {
            setIsDownloading(false);
        }
    };


    // --- Template Download Logic ---
    const handleDownloadTemplate = async (fileType, format) => {
        setIsDownloading(true);
        try {
            const res = await apiFetch(`${API_BASE}api/vendor/api/download-template?file_type=${fileType}&file_format=${format}`, {
                method: 'GET',
                responseType: 'blob'
            });

            const blob = new Blob([res.data], {
                type: res.headers['content-type'] || (format === 'xl' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv')
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = format === 'xl' ? 'xlsx' : 'csv';
            a.download = `${fileType}_template.${ext}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Template downloaded!", {
                position: "bottom-center",
            });
        } catch (err) {
            showErrorToast("Download failed", {
                position: "bottom-center",
            });
        } finally {
            setIsDownloading(false);
        }
    };

    // --- Dropzone Config ---
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        multiple: false
    });

    // --- API: Step 1 (Validate) ---
    const handleInitialUpload = async () => {
        if (!selectedFile) return toast.error("Please select a file first");

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("import_type", importType);
        formData.append("duplicate_action", duplicateAction);
        setProcessing(true);
        try {
            const res = await apiFetch(`${API_BASE}api/vendor/api/pre-import-check`, {
                method: "POST",
                body: formData,
                isFormData: true
            });
            if (res.status) {
                setImportSummary(res.data);
                setStep(2);
                toast.success("Validation complete. Please review records.");
            }
        } catch (err) {
            if (err?.data?.errors?.length) {
                Swal.fire({
                    icon: 'error',
                    title: 'Validation Failed',
                    html: `
                        <div style="max-height:300px; overflow:auto; text-align:left;">
                            <ul style="padding-left:18px; margin:0;">
                                ${err.data.errors.map(item => `
                                    <li><b>Row ${item.row}</b> - <b>${item.column}</b>: ${item.message}</li>
                                `).join("")}
                            </ul>
                        </div>
                    `,
                    width: 700,
                    confirmButtonText: 'OK'
                });
            } else {
                showErrorToast(err);
            }
        } finally {
            setProcessing(false);
        }
    };

    // --- API: Step 2 (Final Import) ---
    const handleFinalConfirm = async () => {
        setIsConfirming(true);
        try {
            const res = await apiFetch(`${API_BASE}api/vendor/api/confirm-import/`, {
                method: "POST",
                body: JSON.stringify({
                    file_id: importSummary.file_id,
                    import_type: importType,
                    duplicate_action: duplicateAction
                })
            });

            if (res.status) {
                const summary = res.summary || {};

                Swal.fire({
                    title: "Import Completed",
                    icon: "success",
                    html: `
                    <div style="text-align:middle">
                        <p><strong>Created:</strong> ${summary.created || 0} Records</p>
                        <p><strong>Updated:</strong> ${summary.updated || 0} Records</p>
                        <p><strong>Skipped:</strong> ${summary.skipped || 0} Records</p>
                        <hr/>
                        <p><strong>Total Processed:</strong> ${summary.total_processed || 0} Records.</p>
                    </div>
                    `,
                    confirmButtonText: "OK",
                    confirmButtonColor: "#000000"
                }).then((result) => {
                    if (result.isConfirmed) {
                        navigate("/vendor/vendors");
                    }
                });

            } else {
                showErrorToast(res);
            }
        } catch (err) {
            console.log(err);
            showErrorToast(err);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setSelectedFile(null);
        setImportSummary({ file_id: "", total_rows: 0, valid_count: 0, invalid_count: 0, preview_data: [], errors: [] });
    };

    return (
        <div className="mt-0">
            <StickyHeader>
                <div className="d-flex justify-content-between mb-2">
                    <h5 className="fw-bold py-1 ps-0">
                        <FontAwesomeIcon icon={faFileImport} className="me-2 text-primary" />
                        Vendor Import Engine
                    </h5>
                    <div className="d-flex gap-2">
                        <div className="dropdown">
                            <button
                                className="btn btn-success dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                disabled={isDownloading}
                            >
                                <i className="fa fa-download me-2"></i>
                                {isDownloading ? 'Exporting...' : 'Export'}
                            </button>
                            <ul className="dropdown-menu">
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => handleExportVendors('csv')}
                                    >
                                        Export Vendor Data (CSV)
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => handleExportVendors('xl')}
                                    >
                                        Export Vendor Data (Excel)
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <button className="btn btn-outline-primary px-3 shadow-sm" onClick={() => navigate("/vendor/vendors")}>
                            <FontAwesomeIcon icon={faListUl} className="me-1" /> Listing
                        </button>
                    </div>
                </div>
            </StickyHeader>

            <div className="bg-white shadow-sm mt-1">
                {/* Stepper Navigation */}
                <div className="d-flex justify-content-center border-bottom py-3 bg-light">
                    <div className={`d-flex align-items-center ${step === 1 ? 'text-primary fw-bold' : 'text-muted'}`}>
                        <span className={`me-2 rounded-circle border px-3 py-2 shadow-sm ${step === 1 ? 'bg-primary text-white border-primary' : ''}`}>1</span> Upload
                    </div>
                    <div className="mx-4 text-muted opacity-50"></div>
                    <div className={`d-flex align-items-center ${step === 2 ? 'text-primary fw-bold' : 'text-muted'}`}>
                        <span className={`me-2 rounded-circle border px-3 py-2 ${step === 2 ? 'bg-primary text-white border-primary' : ''}`}>2</span> Preview & Verify
                    </div>
                </div>

                {/* Tabs below Stepper */}
                <div className="d-flex justify-content-center gap-2 py-3  bg-white">
                    <Button
                        variant={importType === 'vendor' ? 'primary' : 'outline-primary'}
                        className="px-3 shadow-sm"
                        onClick={() => setImportType('vendor')}
                    >
                        Vendor Details
                    </Button>

                    <Button
                        variant={importType === 'contact' ? 'primary' : 'outline-primary'}
                        className="px-3 shadow-sm"
                        onClick={() => setImportType('contact')}
                    >
                        Vendor Contacts
                    </Button>
                </div>


                <div className="p-4">
                    {step === 1 ? (
                        /* STAGE 1: UPLOAD */
                        <div className="animate__animated animate__fadeIn">
                            <Row className="mb-3">
                                <Col md="6">
                                    <div {...getRootProps()} className={`mt-3 border rounded-3 p-5  text-center transition-all ${isDragActive ? 'bg-primary-subtle border-primary' : 'bg-light border-dashed'}`} style={{ cursor: 'pointer', border: '2px dashed #dee2e6' }}>
                                        <input {...getInputProps()} />
                                        {!selectedFile ? (
                                            <>
                                                <FontAwesomeIcon icon={faUpload} size="3x" className="text-muted mb-3" />
                                                <h6 className="fw-bold">Drop .csv or .xlsx file here</h6>
                                                <p className="text-muted small mb-2">Drag and drop or click to browse</p>
                                            </>
                                        ) : (
                                            <div className="d-flex flex-column align-items-center">
                                                <div className="p-3 border rounded bg-white shadow-sm d-flex align-items-center w-50">
                                                    <FontAwesomeIcon icon={faFileAlt} className="text-primary me-3 fs-4" />
                                                    <div className="text-start flex-grow-1">
                                                        <p className="mb-0 fw-bold">{selectedFile.name}</p>
                                                        <p className="mb-0 small text-muted">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                                                    </div>
                                                    <Button variant="link" className="text-danger p-0" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                                <Col md="6">
                                    <div className="card p-2">
                                        <div className="card-header">
                                            <h6 className="fw-bold mb-2">How should duplicate records be handled?</h6>

                                        </div>

                                        <div className="card-body pt-3 ps-3 pb-0">
                                            <div className="mb-3">
                                                <div className="form-check icheck-primary d-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="duplicate_action"
                                                        id="skip_duplicates"
                                                        value="skip"
                                                        checked={duplicateAction === "skip"}
                                                        onChange={(e) => setDuplicateAction(e.target.value)}
                                                    />
                                                    <label className="form-check-label" htmlFor="skip_duplicates">
                                                        Skip duplicate records
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <div className="form-check icheck-primary d-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="duplicate_action"
                                                        id="update_duplicates"
                                                        value="update"
                                                        checked={duplicateAction === "update"}
                                                        onChange={(e) => setDuplicateAction(e.target.value)}
                                                    />
                                                    <label className="form-check-label" htmlFor="update_duplicates">
                                                        Update duplicate records
                                                    </label>
                                                </div></div>

                                        </div>

                                        <div className="card-footer">
                                            <small className="text-muted d-block mb-2">
                                                {importType === 'vendor' ? (
                                                    <>
                                                        Duplicate detection rules:<br />
                                                        • Validation requires Vendor Code, Vendor Name, and Company Name.<br />
                                                        • Duplicate detection checks Vendor Code, Vendor Name, and Company Name.<br />
                                                        • If you choose update, related details like addresses, contacts, and bank records are refreshed from the file.
                                                    </>
                                                ) : (
                                                    <>
                                                        Duplicate detection rules for contacts:<br />
                                                        • Validation requires Vendor Code and Email.<br />
                                                        • Duplicate detection checks Vendor Code and Email.<br />
                                                        • If you choose update, matching contact details are refreshed from the file.
                                                    </>
                                                )}
                                            </small>
                                        </div>
                                    </div>
                                </Col>

                            </Row>



                            <div className="d-flex justify-content-between mt-4">
                                {/* Format Dropdown Template Button */}
                                <Dropdown as={ButtonGroup} size="sm">
                                    <Button variant="link" className="text-decoration-none text-dark fw-bold p-0" disabled={isDownloading}>
                                        <FontAwesomeIcon icon={faDownload} className="me-1 text-success" />
                                        Get {importType === 'contact' ? 'Contact' : 'Vendor'} Template
                                    </Button>
                                    <Dropdown.Toggle split variant="link" className="text-success p-0 ms-2" id="dropdown-split-basic" />
                                    <Dropdown.Menu className="shadow border-0 small">
                                        <Dropdown.Item onClick={() => handleDownloadTemplate(importType, 'csv')}>
                                            <FontAwesomeIcon icon={faFileCsv} className="me-2 text-primary" /> Download as CSV
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleDownloadTemplate(importType, 'xl')}>
                                            <FontAwesomeIcon icon={faFileExcel} className="me-2 text-success" /> Download as Excel (.xlsx)
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>

                                <Button variant="primary" className="px-4 shadow-sm" disabled={!selectedFile || processing} onClick={handleInitialUpload}>
                                    {processing ? <><Spinner size="sm" className="me-2" />Validating...</> : "Next: Preview Data"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* STAGE 2: PREVIEW & ERROR LOG */
                        <div className="animate__animated animate__fadeIn">
                            <div className="row mb-4">
                                <div className="col-md-8">
                                    <h6 className="fw-bold mb-3"><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" /> Preview (Top Records)</h6>
                                    <Table responsive bordered size="sm" className="small align-middle">
                                        <thead className="table-light text-uppercase" style={{ fontSize: "11px" }}>
                                            {importType === 'contact' ? (
                                                <tr>
                                                    <th>Vendor Code</th>
                                                    <th>First Name</th>
                                                    <th>Last Name</th>
                                                    <th>Department</th>
                                                    <th>Email</th>
                                                    <th>Phone</th>
                                                    <th>Description</th>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <th>Vendor Code</th>
                                                    <th>Vendor Name</th>
                                                    <th>Company Name</th>
                                                    <th>Payment Term</th>
                                                    <th>Status</th>
                                                </tr>
                                            )}
                                        </thead>
                                        <tbody>
                                            {importSummary.preview_data.map((row, idx) => (
                                                importType === 'contact' ? (
                                                    <tr key={idx}>
                                                        <td className="fw-bold">{row["Vendor Code"]}</td>
                                                        <td>{row["First Name"] || "-"}</td>
                                                        <td>{row["Last Name"] || "-"}</td>
                                                        <td>{row["Department"] || "-"}</td>
                                                        <td>{row["Email"] || "-"}</td>
                                                        <td>{row["Phone"] || "-"}</td>
                                                        <td>{row["Description"] || "-"}</td>
                                                    </tr>
                                                ) : (
                                                    <tr key={idx}>
                                                        <td className="fw-bold">{row["Vendor Code"]}</td>
                                                        <td>{row["Vendor Name"]}</td>
                                                        <td>{row["Company Name"]}</td>
                                                        <td>{row["Payment Term"] || "-"}</td>
                                                        <td>{row["Status"] || "Pending"}</td>
                                                    </tr>
                                                )
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="col-md-4">
                                    <h6 className="fw-bold mb-3">Staging Statistics</h6>
                                    <div className="border rounded p-3 bg-light shadow-sm">
                                        <div className="d-flex justify-content-between small mb-2"><span>Total Rows Found:</span> <strong>{importSummary.total_rows}</strong></div>
                                        <div className="d-flex justify-content-between small mb-2 text-success"><span>Valid Records:</span> <strong>{importSummary.valid_count}</strong></div>
                                        <div className="d-flex justify-content-between small text-danger"><span>Errors Detected:</span> <strong>{importSummary.invalid_count}</strong></div>
                                    </div>
                                </div>
                            </div>

                            {/* ERROR LOG SECTION */}
                            {importSummary.errors.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="fw-bold text-danger small"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" /> Validation Error Log</h6>
                                    <div className="border border-danger-subtle rounded bg-danger-light p-2" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                                        {importSummary.errors.map((err, i) => (
                                            <div key={i} className="text-danger small border-bottom border-danger-subtle py-1">
                                                <strong>Row {err.row}:</strong> Column "{err.column}" — {err.message}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="d-flex justify-content-between border-top pt-3">
                                <Button variant="outline-secondary" size="md" onClick={handleReset}>
                                    <FontAwesomeIcon icon={faUndo} className="me-1" /> Cancel & Reset
                                </Button>
                                <Button
                                    variant="success"
                                    size="md"
                                    className="px-4 shadow-sm"
                                    disabled={importSummary.valid_count === 0 || isConfirming}
                                    onClick={handleFinalConfirm}
                                >
                                    {isConfirming ? <Spinner size="sm" className="me-2" /> : <FontAwesomeIcon icon={faSave} className="me-2" />}
                                    Confirm & Import {importSummary.valid_count} Records
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorImportIndex;