import React from "react";

export default function StatsBars({ p, maxPresence = 1 }) {
  if (!p) return null;

  const clamp01 = (x) => Math.max(0, Math.min(1, x ?? 0));

  // Normalize each metric to [0,1] for bar length
  const pres01 = clamp01((p.presence || 0) / (maxPresence || 1));
  const win01  = clamp01(p.winPct ?? p.adjWin ?? 0);
  const ast01  = clamp01((p.astPerMatch || 0) / 1.5);   // scale target ~1.5 A/m
  const gol01  = clamp01((p.goalsPerMatch || 0) / 1.5); // scale target ~1.5 G/m

  const rows = [
    { label: "Presenze", value: p.presence ?? 0, frac: pres01, color: "#3b82f6" },
    { label: "Vittorie", value: toPct(p.winPct ?? p.adjWin), frac: win01, color: "#10b981" },
    { label: "Assist/Match", value: fmt(p.astPerMatch), frac: ast01, color: "#f59e0b" },
    { label: "Goal/Match", value: fmt(p.goalsPerMatch), frac: gol01, color: "#ef4444" },
  ];

  return (
    <div className="stats-panel card">
      <h3 className="h2" style={{marginBottom: 10}}>Statistics</h3>
      <div className="bars">
        {rows.map((r) => (
          <div className="bar-row" key={r.label}>
            <div className="bar-label">{r.label}</div>
            <div className="bar-track">
              <div className="bar-filled" style={{ width: `${Math.round(r.frac*100)}%`, background: r.color }} />
            </div>
            <div className="bar-val">{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function fmt(x){
  const n = Number(String(x ?? "").replace(",", "."));
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}
function toPct(x){
  const n = Number(x);
  return Number.isFinite(n) ? `${Math.round(n*100)}%` : "—";
}