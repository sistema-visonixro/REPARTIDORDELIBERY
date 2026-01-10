import React, { useEffect } from "react";

export default function SuccessToast({
  visible,
  message = "Operación exitosa",
  duration = 1500,
  onClose,
}: {
  visible: boolean;
  message?: string;
  duration?: number;
  onClose?: () => void;
}) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div style={container} aria-live="polite">
      <div style={toast}>{message}</div>
    </div>
  );
}

const container: React.CSSProperties = {
  position: "fixed",
  left: "50%",
  transform: "translateX(-50%)",
  bottom: 90,
  zIndex: 1200,
};

const toast: React.CSSProperties = {
  background: "#10b981",
  color: "white",
  padding: "10px 16px",
  borderRadius: 12,
  boxShadow: "0 8px 30px rgba(16,185,129,0.18)",
  fontWeight: 700,
  minWidth: 160,
  textAlign: "center",
};
