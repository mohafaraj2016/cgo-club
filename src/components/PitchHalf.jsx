import React from "react";

/** players: [{id?, name, pos?, power}], formation: [1,2,3,...], color: CSS color/var */
export default function PitchHalf({
  title,
  formation = [1, 2, 3, 1],
  players = [],
  color = "var(--teamA)",
}) {
  const rows = formation.length ? formation : [1, 2, 3, 1];

  // Clamp so circles never spill outside
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  // Build anchor slots (x%, y%), top (attacking) → bottom (goal)
  const yTop = 10, yBottom = 92;
  const yStep = rows.length > 1 ? (yBottom - yTop) / (rows.length - 1) : 0;
  const anchors = [];
  rows.forEach((count, r) => {
    const y = clamp(yTop + r * yStep, 6, 94);
    if (count === 1) {
      anchors.push({ x: 50, y });
    } else {
      for (let i = 0; i < count; i++) {
        const x = clamp(((i + 1) * 100) / (count + 1), 6, 94);
        anchors.push({ x, y });
      }
    }
  });

  // Map players to anchors (wrap if more than slots)
  const chips = players.map((p, i) => {
    const a = anchors[i % anchors.length] || { x: 50, y: 50 };
    return { ...p, x: a.x, y: a.y };
  });

  const label = (n) =>
    String(n || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ")
      .split(" ")[0]
      .slice(0, 3);

  return (
    <div className="pitch-wrap">
      <div className="pitch-title" style={{ color }}>{title}</div>

      <div className="hp">
        {/* Decorative layers (order matters) */}
        <div className="hp-stripes" />
        <div className="hp-border" />
        <div className="hp-halfway" />
        <div className="hp-goal" />
        <div className="hp-box18" />
        <div className="hp-box6" />
        <div className="hp-pen-spot" />
        <div className="hp-arc" />
        <div className="hp-corner tl" />
        <div className="hp-corner tr" />
        <div className="hp-corner bl" />
        <div className="hp-corner br" />

        {/* Players */}
        {chips.map((p) => (
          <div
            key={p.id || p.name}
            className="chip"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              borderColor: color,
              color, // so .pitch-half .chip { border-color: currentColor } works
            }}
          >
            <div className="chip-name">{label(p.name)}</div>
            <div className="chip-power">{Math.round(p.power || 0)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}