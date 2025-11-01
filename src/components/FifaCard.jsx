import React, { useState } from "react";

// Helper to handle BASE_URL (for GitHub Pages and local dev)
const withBase = (p) =>
  import.meta.env.BASE_URL + String(p || "").replace(/^\/+/, "");

export default function FifaCard({ p }) {
  const [open, setOpen] = useState(false);
  const ovr = Number(p?.ovr ?? 75);
  const longPos = positionLong(p?.pos);

  return (
    <div className="fifa-card">
      {/* ────── Top Section (Rating + Position + Photo) ────── */}
      <div className="fifa-top">
        <div className="fifa-ovr">
          <div className="fifa-ovr-num">{ovr}</div>
          <div className="fifa-ovr-pos">{p?.pos || "—"}</div>
          <div className="fifa-ovr-mat">APP {safe(p?.presence)}</div>
        </div>

        {/* Player Photo Area */}
        <div className="fifa-photo">
          {p?.photo ? (
            <img
              src={withBase(p.photo)} // ✅ ensures correct path locally + GitHub Pages
              alt={p?.name || "player"}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="fifa-photo-ph">CGO</div>
          )}
        </div>
      </div>

      {/* ────── Player Name & Hover Popover ────── */}
      <div className="fifa-name-wrap">
        <button
          className="fifa-name"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          type="button"
        >
          {p?.name || "—"}
        </button>

        {open && (
          <div className="name-popover" role="dialog">
            <div className="name-popover-head">
              <span className="name-pop-ovr">{ovr}</span>
              <span className="name-pop-pos">{p?.pos || "—"}</span>
            </div>
            <div className="name-pop-role">{longPos}</div>
            <div className="name-pop-grid">
              <div>
                <strong>{fmtPct(p?.winPct ?? p?.adjWin)}</strong>
                <span>% Win</span>
              </div>
              <div>
                <strong>{fmtRate(p?.astPerMatch)}</strong>
                <span>A/Match</span>
              </div>
              <div>
                <strong>{fmtRate(p?.goalsPerMatch)}</strong>
                <span>G/Match</span>
              </div>
              <div>
                <strong>{safe(p?.presence)}</strong>
                <span>APP</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ────── Role / Description ────── */}
      <div className="fifa-sub">
        <div className="fifa-poslong">{longPos}</div>
      </div>

      {/* ────── Stats Footer ────── */}
      <div className="fifa-stats">
        <Stat k="% Win" v={fmtPct(p?.winPct ?? p?.adjWin)} />
        <Stat k="A/Match" v={fmtRate(p?.astPerMatch)} />
        <Stat k="G/Match" v={fmtRate(p?.goalsPerMatch)} />
        <Stat k="Pos" v={p?.pos || "—"} />
      </div>
    </div>
  );
}

/* ────── Stat Subcomponent ────── */
function Stat({ k, v }) {
  return (
    <div className="stat-box">
      <div className="stat-v">{v}</div>
      <div className="stat-k">{k}</div>
    </div>
  );
}

/* ────── Helpers ────── */
function safe(x) {
  if (x === 0) return 0;
  return x ?? "—";
}

function fmtRate(x) {
  const n = Number(String(x ?? "").replace(",", "."));
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}

function fmtPct(x) {
  const n = Number(x);
  return Number.isFinite(n) ? `${Math.round(n * 100)}%` : "—";
}

function positionLong(code) {
  if (!code) return "";
  const map = {
    GK: "Goalkeeper",
    P: "Goalkeeper",
    CB: "Center-Back",
    LB: "Left-Back",
    RB: "Right-Back",
    LWB: "Left Wing-Back",
    RWB: "Right Wing-Back",
    CM: "Central Midfielder",
    CAM: "Central Attacking Midfielder",
    CF: "Centre Forward",
    SS: "Second Striker",
    ST: "Striker",
  };
  return map[(code || "").toUpperCase()] || code;
}