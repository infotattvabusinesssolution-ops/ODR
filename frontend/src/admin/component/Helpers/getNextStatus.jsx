// src/helpers/getNextStatus.js
export const STATUS_ORDER = ["Pending", "Verified", "Active", "Reject"];

export function getNextStatus(current) {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx === -1) return "Pending";
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}
