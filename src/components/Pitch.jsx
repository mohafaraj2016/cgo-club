import React from "react";

/* formation: [1,3,3,1] etc; players: array of {name,pos,power} */
export default function Pitch({ title = "Team", formation = [1,2,3,1], players = [] }) {
  const rows = Array.isArray(formation) && formation.length ? formation : [1,2,3,1];

  // slice players into lines according to the formation
  const lines = [];
  let idx = 0;
  for (const n of rows) {
    const seg = players.slice(idx, idx + n);
    lines.push(seg);
    idx += n;
  }

  return (
    <div className="pitch card">
      <div className="pitch-title">{title}</div>
      <div className="pitch-field">
        {lines.map((line, i) => (
          <div key={i} className="pitch-row">
            {line.map((p, j) => (
              <div key={p.id || j} className="pitch-dot" title={`${p.name}${p.pos?` (${p.pos})`:""} • ${p.power ?? "—"}`}>
                <div className="dot-name">{p.name}</div>
                <div className="dot-sub">{(p.pos||"").toUpperCase()} • {p.power ?? "—"}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}