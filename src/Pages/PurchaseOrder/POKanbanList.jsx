import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../Utils/apiFetch";
import { API_BASE, API_ENDPOINTS } from "../../Config/api";
import formatCurrency, { formattedDate } from "../../Utils/utilFunctions";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListUl, faSliders, faLock } from '@fortawesome/free-solid-svg-icons';
import KanbanLayoutModal from "./POComponents/KanbanLayoutModal";

/* ================= STATUS HELPERS (Existing) ================= */
const STATUS = { DRAFT: -1, PARKED: 0, PLACED: [1, 2, 3] };
const isPlaced = (statusId) => STATUS.PLACED.includes(statusId);

const POKanbanList = () => {
  const [poData, setPoData] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [updatingPoId, setUpdatingPoId] = useState(null);
  const [showLayoutConfig, setShowLayoutConfig] = useState(false);

  // --- CONFIGURATION STATES ---
  const [displayColumns, setDisplayColumns] = useState([]);
  const [cardFields, setCardFields] = useState([]);
  const [sortConfig, setSortConfig] = useState({ by: "created_at", dir: "desc" });
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // YOUR EXISTING MASTER COLUMNS
  const columns = [
    // { id: "draft", title: "Draft", color: "#6b7280", canDrop: true },
    { id: "parked", title: "Parked", color: "#f06e23", canDrop: true },
    { id: "placed", title: "Placed", color: "#0c81a6", canDrop: true },
    { id: "partially_received", title: "Partially Received", color: "#0ea5e9", canDrop: false },
    { id: "delivered", title: "PO Delivered", color: "#65a523", canDrop: false },
    { id: "closed", title: "PO Closed", color: "#8a3b24", canDrop: false },
    { id: "cancelled", title: "Canceled", color: "#e11e39", canDrop: false },
  ];

  // --- CONFIG FETCH LOGIC ---
  const loadUserConfig = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE}api/purchaseorder/api/kanbanlist/get-config-layout`);
      if (res.status && res.data) {
        const saved = res.data;

        // 1. Column Layout
        if (saved.active_columns?.length > 0) {
          const activeIds = saved.active_columns.map(c => c.id);
          const ordered = columns
            .filter(col => activeIds.includes(col.id))
            .sort((a, b) => activeIds.indexOf(a.id) - activeIds.indexOf(b.id));
          setDisplayColumns(ordered);
        } else {
          setDisplayColumns(columns);
        }

        // 2. Card Content
        if (saved.additional_content) setCardFields(saved.additional_content);

        // 3. Sorting State
        if (saved.sort_by) {
          setSortConfig({ by: saved.sort_by, dir: saved.sort_direction || "desc" });
        }
      } else {
        setDisplayColumns(columns);
      }
    } catch (err) {
      setDisplayColumns(columns);
    } finally {
      setIsConfigLoaded(true);
    }
  }, []);

  // --- DATA FETCH LOGIC (Using Config Params) ---
  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ 
        size: 200, 
        sort_by: sortConfig.by, 
        sort_dir: sortConfig.dir 
      });
      const res = await apiFetch(`${API_ENDPOINTS.PO_LISTING}?${params.toString()}`);
      setPoData(res?.data || []);
    } catch (err) {
      setPoData([]);
    }
  }, [sortConfig]);

  useEffect(() => {
    loadUserConfig();
  }, [loadUserConfig]);

  useEffect(() => {
    if (isConfigLoaded) loadData();
  }, [isConfigLoaded, loadData]);

  /* ================= EXISTING IMPLEMENTATIONS (NOT ALTERED) ================= */
  const getStatusIdFromColumn = (columnId, currentStatusId) => {
    if (columnId === "draft") return STATUS.DRAFT;
    if (columnId === "parked") return STATUS.PARKED;
    if (columnId === "placed") return 1; 
    return currentStatusId;
  };

  const updateStatus = async (item, targetColumn) => {
    const newStatusId = getStatusIdFromColumn(targetColumn, item.status_id);
    if (item.status_id === newStatusId) return;

    setUpdatingPoId(item.po_id);
    try {
      const res = await apiFetch(API_ENDPOINTS.UPDATE_PO_STATUS, {
        method: "POST",
        body: JSON.stringify({ po_id: item.po_id, status_id: newStatusId }),
      });

      if (res?.status === true) {
        setPoData((prev) => prev.map((p) => p.po_id === item.po_id ? { ...p, status_id: newStatusId } : p));
      }
    } finally {
      setUpdatingPoId(null);
    }
  };

  const filterByColumn = (columnId, item) => {
    const s = item.status_id;
    if (columnId === "draft") return s === STATUS.DRAFT;
    if (columnId === "parked") return s === STATUS.PARKED;
    if (columnId === "placed") return isPlaced(s);
    if (columnId === "partially_received") return s === 4;
    if (columnId === "delivered") return s === 5;
    if (columnId === "closed") return s === 6;
    if (columnId === "cancelled") return s === 7;
    return false;
  };
  /* ========================================================================= */

  if (!isConfigLoaded) return null;

  return (
    <div className="p-0 bg-light ">
      <div className="p-0 d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0 fw-bold">Purchase Order Kanban</h3>
        <div className="d-flex gap-2 align-items-center">
          <button className="btn btn-outline-primary shadow-sm" onClick={() => { window.location.href = "/purchaseorder/listing"; }}>
            <FontAwesomeIcon className="me-2" icon={faListUl} /> List View
          </button>
          <button className="btn btn-outline-info px-3 shadow-sm" onClick={() => setShowLayoutConfig(true)}> 
            <FontAwesomeIcon className="me-1 ps-0" icon={faSliders} /> Edit Layout
          </button>
        </div>
      </div>

      <div className="d-flex gap-2 rounded-4 overflow-auto px-2" style={{ Height: "79vh", minHeight: "79vh" }}>
        {displayColumns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            items={poData.filter((p) => filterByColumn(col.id, p))}
            draggedItem={draggedItem}
            setDraggedItem={setDraggedItem}
            onDropItem={(item) => updateStatus(item, col.id)}
            updatingPoId={updatingPoId}
            cardFields={cardFields}
          />
        ))}
      </div>

      <KanbanLayoutModal 
        show={showLayoutConfig} 
        onHide={() => setShowLayoutConfig(false)} 
        columns={columns} 
        onRefresh={loadUserConfig} 
      />
    </div>
  );
};

/* ================= KANBAN COLUMN ================= */
const KanbanColumn = ({ column, items, draggedItem, setDraggedItem, onDropItem, updatingPoId, cardFields }) => {
  const [isOver, setIsOver] = useState(false);
  return (
    <div className="flex-shrink-0 rounded-3 bg-lightgray shadow-sm border" style={{ width: 290 }}>
      <div className="mx-2 mt-2 mb-1 bg-white p-2 rounded-3 d-flex gap-2 align-items-center">
        <span className="badge rounded-circle d-flex align-items-center justify-content-center" style={{ width: 25, height: 25, backgroundColor: column.color }}>{items.length}</span>
        <h6 className="mb-0 fw-bold">{column.title} {!column.canDrop && <FontAwesomeIcon icon={faLock} className="ms-2 small text-muted opacity-50" />}</h6>
      </div>

      <div
        className={`p-2 kanban-column-body ${isOver && column.canDrop ? "kanban-drop-hover" : ""}`}
        style={{ height: "70VH", overflowY: "auto", borderRadius: "12px", backgroundColor: !column.canDrop ? "rgba(0,0,0,0.02)" : "transparent" }}
        onDragOver={(e) => { if (column.canDrop) { e.preventDefault(); setIsOver(true); } }}
        onDragLeave={() => setIsOver(false)}
        onDrop={() => { setIsOver(false); if (column.canDrop && draggedItem) onDropItem(draggedItem); setDraggedItem(null); }}
      >
        {items.map((item) => (
          <KanbanCard key={item.po_id} item={item} onDragStart={setDraggedItem} accentColor={column.color} loading={updatingPoId === item.po_id} isDraggable={column.canDrop} cardFields={cardFields} />
        ))}
      </div>
    </div>
  );
};

/* ================= KANBAN CARD ================= */
const KanbanCard = ({ item, onDragStart, accentColor, loading, isDraggable, cardFields }) => {
  const isVisible = (field) => cardFields.length === 0 || cardFields.includes(field);

  return (
    <div className="card border-0 shadow-sm mb-2 rounded-3 kanban-card" draggable={!loading && isDraggable} onDragStart={(e) => { if (!loading && isDraggable && typeof onDragStart === 'function') onDragStart(item); else e.preventDefault(); }} style={{ opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : (isDraggable ? "grab" : "default") }}>
      <div className="card-body p-3 position-relative">
        {loading && <div className="position-absolute top-50 start-50 translate-middle" style={{zIndex: 10}}><div className="spinner-border spinner-border-sm text-primary" /></div>}
        <h6 className="fw-bold mb-2 text-dark">{item.po_number}</h6>
        
        <div className="small mb-2 text-secondary">
          {isVisible("vendor_name") && <div className="text-truncate"><b>Vendor:</b> {item.vendor_name}</div>}
          {isVisible("vendor_code") && <div><b>Code:</b> <strong className="text-dark">{item.vendor_code}</strong></div>}
          {isVisible("delivery_name") && <div className="text-truncate"><b>Wh:</b> {item.delivery_name || "-"}</div>}
          {isVisible("supplier_ref") && <div className="text-truncate"><b>Ref:</b> {item.po_vendor_ref || "-"}</div>}
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          {isVisible("total_val") && <span className="fw-bold text-primary small">AUD {formatCurrency(item.total_val)}</span>}
          <span className="badge bg-light text-danger border border-danger small">{formattedDate(item.order_date)}</span>
        </div>
        <div className="pt-2" style={{ borderTop: `3px solid ${accentColor}` }} />
      </div>
    </div>
  );
};

export default POKanbanList;