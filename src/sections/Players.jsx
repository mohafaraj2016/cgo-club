import React, { useEffect, useState } from "react";
import { fetchCsv } from "../lib/csv.js";
import { SHEETS } from "../lib/sheets.js";
import FifaCard from "../components/FifaCard.jsx";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const url = SHEETS.PLAYERS_CSV;
        if (!url) {
          setStatus("error");
          setMsg("Missing VITE_PLAYERS_CSV in .env (restart dev server after adding).");
          return;
        }

        // CSV -> array-of-arrays, skip header row explicitly
        const rows = await fetchCsv(url, { header: false });
        const body = rows.filter(r => Array.isArray(r) && r.length > 1).slice(1);

        // A,B,D,E,G,H  ->  0,1,3,4,6,7
        const basic = body.map((r, i) => {
          const surname  = str(r[0]);
          const pos      = str(r[1]).toUpperCase();
          const presence = toInt(r[3]);            // D: Presenze (APP)
          const winPct01 = toPercent01(r[4]);      // E: % Vittorie (0..1)
          const astPM    = toFloat(r[6]);          // G: Assist/Match
          const golPM    = toFloat(r[7]);          // H: Goal/Match
          const wins     = Math.round((presence || 0) * winPct01);
          return {
            id: `${i}-${surname}-${pos}`,
            name: surname,
            pos,
            presence,
            winPct: winPct01,
            wins,
            astPerMatch: astPM,
            goalsPerMatch: golPM,
          };
        });

        // Reference stats
        const presenzeList = basic.map(p => p.presence || 0).filter(n => n > 0);
        const appsMax    = Math.max(8, ...presenzeList, 0);
        const appsMedian = presenzeList.length ? median(presenzeList) : 8;

        // Wilson lower bound for conservative win% (95%)
        const z = 1.96;
        const withConservative = basic.map(p => {
          const n = Math.max(0, p.presence || 0);
          const w = Math.max(0, Math.min(p.wins || 0, n));
          const winConservative = wilsonLowerBound(w, n, z); // 0..1
          return { ...p, winConservative };
        });

        // Reliability factor vs median apps
        const denom = Math.max(appsMedian, 6);
        const gamma = 1.2;

        // Role-aware OVR
        const withOVR = withConservative.map(p => {
          const ovr = computeOVR_roleAware({
            pos: p.pos,
            winCons01: p.winConservative,
            astPM: p.astPerMatch,
            golPM: p.goalsPerMatch,
            presenze: p.presence,
            appsMax,
            denomForReliability: denom,
            gamma,
          });
          return { ...p, ovr, adjWin: p.winConservative };
        });

        setPlayers(withOVR);
        setStatus(withOVR.length ? "ok" : "empty");
        if (!withOVR.length) setMsg("CSV loaded but no data rows found.");
      } catch (e) {
        setStatus("error");
        setMsg(String(e.message || e));
      }
    })();
  }, []);

  return (
    <section>
      <h2 className="h2" style={{ fontSize: 22, marginBottom: 12 }}>Players</h2>

      {status === "loading" && <div className="p">Loading players…</div>}
      {status === "error"   && <div className="card" style={{ color: "#b91c1c" }}>Error: {msg}</div>}
      {status === "empty"   && <div className="card">{msg}</div>}

      {status === "ok" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: "16px" }}>
          {players.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "center" }}>
              <FifaCard p={p} />
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="h2" style={{ fontSize: 16, marginBottom: 6 }}>
          Google Sheet «giocatori» (column mapping)
        </div>
        <code style={{ fontSize: 12 }}>
          A: Surname · B: Position · D: Presenze · E: % Vittorie · G: Assist/Match · H: Goal/Match
        </code>
        <div className="p" style={{ marginTop: 6 }}>
          GK are scored mainly by conservative win% and appearances; goals/assists have minimal impact for GKs.
        </div>
      </div>
    </section>
  );
}

/* ----------------- helpers ----------------- */

function str(x){ return x == null ? "" : String(x).trim(); }
function toInt(x){ const n = parseInt(String(x ?? "").replace(",",".").trim(), 10); return Number.isFinite(n) ? n : 0; }
function toFloat(x){ const n = parseFloat(String(x ?? "").replace(",",".").trim()); return Number.isFinite(n) ? n : 0; }

/** Accepts "67", "67%", "0.67" → returns 0..1 */
function toPercent01(v){
  if (v == null || v === "") return 0;
  const s = String(v).trim().replace(",",".");
  if (s.endsWith("%")) {
    const n = parseFloat(s.slice(0, -1));
    return Number.isFinite(n) ? clamp01(n / 100) : 0;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? clamp01(n > 1 ? n / 100 : n) : 0;
}
const clamp01 = x => Math.max(0, Math.min(1, x));

/** Median utility */
function median(arr){
  const a = [...arr].sort((x,y)=>x-y);
  const n = a.length;
  if (!n) return 0;
  return n % 2 ? a[(n-1)/2] : (a[n/2 - 1] + a[n/2]) / 2;
}

/** Wilson score interval lower bound for binomial proportion (conservative win%) */
function wilsonLowerBound(wins, n, z = 1.96){
  if (n <= 0) return 0;
  const pHat = Math.max(0, Math.min(1, wins / n));
  const z2 = z*z;
  const denom = 1 + z2 / n;
  const center = pHat + z2/(2*n);
  const margin = z * Math.sqrt((pHat*(1-pHat) + z2/(4*n)) / n);
  const lb = (center - margin) / denom;
  return clamp01(lb);
}

/** Role-aware OVR computation */
function computeOVR_roleAware({
  pos, winCons01, astPM, golPM, presenze, appsMax,
  denomForReliability, gamma
}){
  const isGK = isGoalkeeper(pos);

  // Normalize A/G per match (tune caps later)
  const normA = clamp01((astPM || 0) / 1.5);
  const normG = clamp01((golPM || 0) / 1.5);
  const appNorm = clamp01((presenze || 0) / (appsMax || 8));

  // Reliability multiplier vs squad median apps
  const R = clamp01(Math.pow((presenze || 0) / (denomForReliability || 6), gamma || 1.2));

  // Weights by role
  let wWin, wG, wA, wApp;
  if (isGK) {
    // Goalkeepers: emphasize win % and appearances; minimal A/G influence
    wWin = 0.70; wG = 0.05; wA = 0.05; wApp = 0.20;
  } else {
    // Outfield: favor win%, then goals, then assists, plus apps
    wWin = 0.55; wG = 0.22; wA = 0.13; wApp = 0.10;
  }

  const base01 = wWin*winCons01 + wG*normG + wA*normA + wApp*appNorm;
  const final01 = clamp01(base01 * R);
  return Math.round(final01 * 100);
}

function isGoalkeeper(pos){
  const p = String(pos || "").toUpperCase();
  return p === "GK" || p === "P" || p === "P/GK";
}