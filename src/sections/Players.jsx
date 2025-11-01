import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchCsv } from "../lib/csv.js";
import { SHEETS } from "../lib/sheets.js";
import FifaGoldCard from "../components/FifaGoldCard.jsx";
import StatsBars from "../components/StatsBars.jsx";          // <— bars
import * as htmlToImage from "html-to-image";                  // <— export
import { jsPDF } from "jspdf";

/* ---------- utilities ---------- */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const str = (x) => (x == null ? "" : String(x).trim());
const toInt = (x) => {
  const n = parseInt(String(x ?? "").replace(",", "."), 10);
  return Number.isFinite(n) ? n : 0;
};
const toFloat = (x) => {
  const n = parseFloat(String(x ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
// Accepts "67", "67%", "0.67" → 0..1
const toPct01 = (v) => {
  if (v == null || v === "") return 0;
  const s = String(v).trim().replace(",", ".");
  if (s.endsWith("%")) {
    const n = parseFloat(s.slice(0, -1));
    return Number.isFinite(n) ? clamp01(n / 100) : 0;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? clamp01(n > 1 ? n / 100 : n) : 0;
};

function wilsonLowerBound(wins, n, z = 1.96) {
  if (n <= 0) return 0;
  const pHat = Math.max(0, Math.min(1, wins / n));
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = pHat + z2 / (2 * n);
  const margin = z * Math.sqrt((pHat * (1 - pHat) + z2 / (4 * n)) / n);
  return clamp01((center - margin) / denom);
}

const isGK = (pos) => {
  const p = String(pos || "").toUpperCase();
  return p === "GK" || p === "P" || p === "P/GK";
};

/* Heuristic OVR + six FIFA stats */
function deriveOVRAndStats({ pos, presenze, winPct01, astPM, golPM }) {
  const wins = Math.round((presenze || 0) * (winPct01 || 0));
  const winCons01 = wilsonLowerBound(wins, presenze, 1.96);

  const presenceR = clamp01((presenze || 0) / 12); // ~fully reliable around 12 apps
  const A = clamp01((astPM || 0) / 1.0);
  const G = clamp01((golPM || 0) / 1.0);

  let wWin, wG, wA, wApp;
  if (isGK(pos)) { wWin = 0.70; wG = 0.05; wA = 0.05; wApp = 0.20; }
  else           { wWin = 0.55; wG = 0.22; wA = 0.13; wApp = 0.10; }

  const ovr01 = clamp01((wWin*winCons01 + wG*G + wA*A + wApp*presenceR) * (0.85 + 0.15*presenceR));
  const rating = Math.round(60 + 40 * ovr01); // 60–100

  const base = 55;
  const PAC = Math.round(base + 20*G + 10*winCons01 + 10*presenceR);
  const SHO = Math.round(base + 35*G + 10*winCons01);
  const PAS = Math.round(base + 35*A + 8*winCons01);
  const DRI = Math.round(base + 22*A + 12*G + 8*winCons01);
  const isDef = ["CB","LB","RB","LWB","RWB","CDM"].includes(String(pos||"").toUpperCase());
  const DEF = Math.round(base + (isDef || isGK(pos) ? 20 : 6) + 14*winCons01 + 6*presenceR);
  const PHY = Math.round(base + 18*presenceR + 12*winCons01);
  const clampStat = (x) => Math.max(30, Math.min(99, x));

  return {
    rating,
    stats: {
      PAC: clampStat(PAC),
      SHO: clampStat(SHO),
      PAS: clampStat(PAS),
      DRI: clampStat(DRI),
      DEF: clampStat(DEF),
      PHY: clampStat(PHY),
    },
  };
}

/* photo path from surname, e.g. ANTU -> public/players/antu.png */
function defaultPhotoFromName(name) {
  const slug = String(name || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
  return `players/${slug}.png`;
}

/* ---------- component ---------- */
export default function Players({ lang = "en" }) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("");
  const [selId, setSelId] = useState("");

  const cardRef = useRef(null); // for export

  useEffect(() => {
    (async () => {
      try {
        const url = SHEETS.PLAYERS_CSV;
        if (!url) { setStatus("error"); setMsg("Missing VITE_PLAYERS_CSV in .env"); return; }

        const arr = await fetchCsv(url, { header: false });
        const body = arr.filter(r => Array.isArray(r) && r.length > 1).slice(1); // skip header

        const players = body.map((r, i) => {
          const surname  = str(r[0]);               // A
          const pos      = str(r[1]).toUpperCase(); // B
          const presenze = toInt(r[3]);             // D
          const winPct01 = toPct01(r[4]);           // E
          const astPM    = toFloat(r[6]);           // G
          const golPM    = toFloat(r[7]);           // H

          const { rating, stats } = deriveOVRAndStats({ pos, presenze, winPct01, astPM, golPM });

          return {
            id: `${i}-${surname}-${pos}`,
            name: surname || `Player ${i+1}`,
            pos,
            presence: presenze,
            winPct: winPct01,
            astPerMatch: astPM,
            goalsPerMatch: golPM,
            rating,
            stats,
            photo: defaultPhotoFromName(surname),
            nationFlag: "flags/it.png",                // optional assets
            leagueLogo: "",
            clubLogo: "clubs/cgo.png",
          };
        });

        setRows(players);
        setSelId(players[0]?.id || "");
        setStatus(players.length ? "ok" : "empty");
        if (!players.length) setMsg("CSV loaded but no data rows found.");
      } catch (e) {
        setStatus("error"); setMsg(String(e.message || e));
      }
    })();
  }, []);

  const selected = useMemo(() => rows.find(p => p.id === selId), [rows, selId]);
  const maxPresence = useMemo(() => rows.reduce((m,p)=>Math.max(m, p.presence||0), 1), [rows]);

  /* ----- exporters ----- */
  const downloadPng = async () => {
    if (!cardRef.current) return;
    const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${(selected?.name || "card").toLowerCase()}-fifa.png`;
    a.click();
  };

  const downloadPdf = async () => {
    if (!cardRef.current) return;
    const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2 });
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const w = img.width, h = img.height;
    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: [w, h] });
    pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
    pdf.save(`${(selected?.name || "card").toLowerCase()}-fifa.pdf`);
  };

  return (
    <section className="home-layout">
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <h2 className="h2" style={{ fontSize: 22, margin: 0 }}>
          {lang === "it" ? "Carta FIFA" : "FIFA Card"}
        </h2>

        {/* selector */}
        {status === "ok" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label className="p" style={{ fontWeight: 700 }}>
              {lang === "it" ? "Giocatore" : "Player"}
            </label>
            <select className="btn" value={selId} onChange={(e) => setSelId(e.target.value)}>
              {rows.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.pos ? `(${p.pos})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* status */}
        {status === "loading" && <div className="p">Loading…</div>}
        {status === "error" && <div className="p" style={{ color: "#b91c1c" }}>Error: {msg}</div>}
        {status === "empty" && <div className="p">{msg}</div>}

        {/* layout: card + stats */}
        {status === "ok" && selected && (
          <div className="player-row">
            {/* export box wraps only the card */}
            <div className="card export-box" ref={cardRef}>
              <FifaGoldCard
                photo={selected.photo}
                rating={selected.rating}
                position={selected.pos || "—"}
                name={selected.name.toUpperCase()}
                nationFlag={selected.nationFlag}
                leagueLogo={selected.leagueLogo}
                clubLogo={selected.clubLogo}
                stats={selected.stats}
              />
            </div>

            <StatsBars p={selected} maxPresence={maxPresence} />
          </div>
        )}

        {/* export buttons */}
        {status === "ok" && selected && (
          <div className="export-buttons" style={{ display:"flex", gap:10 }}>
            <button className="btn" onClick={downloadPng}>
              {lang === "it" ? "Scarica PNG" : "Download PNG"}
            </button>
            <button className="btn" onClick={downloadPdf}>
              {lang === "it" ? "Scarica PDF" : "Download PDF"}
            </button>
          </div>
        )}

        {/* hint */}
        <div className="p" style={{ fontSize: 13, color: "#64748b" }}>
          Google Sheet «giocatori»: A=Cognome, B=Posizione, D=Presenze, E=%Vittorie, G=Assist/Match, H=Goal/Match.
          Foto cercate in <code>public/players/&lt;cognome-lower&gt;.png</code>. Puoi sovrascriverle per giocatore.
        </div>
      </div>
    </section>
  );
}