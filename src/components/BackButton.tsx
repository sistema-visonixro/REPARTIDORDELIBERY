import React from "react";

export default function BackButton({
  onClick,
  ariaLabel = "Volver",
  style,
}: {
  onClick: () => void;
  ariaLabel?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 12,
        border: "none",
        background: "linear-gradient(180deg,#ffffff,#f3f4f6)",
        boxShadow: "0 8px 22px rgba(2,6,23,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 20,
        ...style,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15 18L9 12L15 6"
          stroke="#111827"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
