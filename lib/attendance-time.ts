// ============================================================
// Smart Konstruksi — Attendance time helpers
// Local-time day boundaries (matching dashboard startOfDay pattern)
// ============================================================

export function startOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Format seconds as "7h 32m" */
export function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
