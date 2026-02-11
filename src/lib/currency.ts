export function formatHNL(value?: number | null) {
  if (value === undefined || value === null) return "HNL 0.00";
  const n = Number(value);
  if (Number.isNaN(n)) return "HNL 0.00";
  return `HNL ${n.toFixed(2)}`;
}
