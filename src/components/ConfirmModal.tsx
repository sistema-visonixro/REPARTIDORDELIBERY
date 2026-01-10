import React from "react";

export default function ConfirmModal({
  visible,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = "Sí",
  cancelLabel = "Cancelar",
}: {
  visible: boolean;
  title?: string;
  description?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  if (!visible) return null;

  return (
    <div style={overlay} role="dialog" aria-modal="true">
      <div style={panel}>
        {title && <h3 style={{ margin: 0, marginBottom: 8 }}>{title}</h3>}
        {description && (
          <p style={{ margin: 0, marginBottom: 16, color: "#6b7280" }}>
            {description}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={cancelBtn}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={confirmBtn}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.35)",
  zIndex: 1400,
  padding: 20,
};

const panel: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  background: "white",
  borderRadius: 14,
  padding: 18,
  boxShadow: "0 12px 40px rgba(2,6,23,0.12)",
};

const confirmBtn: React.CSSProperties = {
  background: "#10b981",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};

const cancelBtn: React.CSSProperties = {
  background: "transparent",
  color: "#374151",
  border: "1px solid #e5e7eb",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
};
