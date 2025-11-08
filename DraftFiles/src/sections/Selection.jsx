import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchCsv } from "../lib/csv.js";
import { SHEETS } from "../lib/sheets.js";
import PitchHalf from "../components/PitchHalf.jsx";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

/* ===== i18n ===== */
const TXT = {
  en: {
    title: "Selection & Balance",
    step1: "1) Match type",
    preset: "Preset:",
    orCustom: "or custom",
    perSide: "per side",
    step2: "2) Availability",
    availHint: "Tick players who are playing tonight. Only these will be eligible.",
    playing: "Playing",
    step3: "3) Captains",
    teamA: "Team A (Green)",
    teamB: "Team B (Orange)",
    auto: "⚡ Auto-balance (Playing only)",
    reset: "Reset teams",
    step4: "4) Manual assignment",
    unassigned: "Unassigned",
    step5: "5) Externals",
    addExternal: "+ Add external",
    name: "Name",
    pos: "Pos",
    power: "Power",
    remove: "Remove",
    step6: "6) Tactics",
    formation: "formation",
    balanceA: "Power total",
    balanceB: "% Power split",
    balanceC: "% Win-consistency avg",
    export: "Export",
    png: "Download PNG",
    pdf: "Download PDF",
    loading: "Loading…",
    error: "Error",
  },
  it: {
    title: "Selezione & Bilanciamento",
    step1: "1) Tipo di partita",
    preset: "Predefinito:",
    orCustom: "oppure personalizzato",
    perSide: "per squadra",
    step2: "2) Disponibilità",
    availHint: "Spunta i giocatori che giocano stasera. Solo questi saranno considerati.",
    playing: "In campo",
    step3: "3) Capitani",
    teamA: "Squadra A (Verde)",
    teamB: "Squadra B (Arancione)",
    auto: "⚡ Auto-bilanciamento (solo disponibili)",
    reset: "Azzera squadre",
    step4: "4) Assegnazione manuale",
    unassigned: "Non assegnato",
    step5: "5) Esterni",
    addExternal: "+ Aggiungi esterno",
    name: "Nome",
    pos: "Ruolo",
    power: "Forza",
    remove: "Rimuovi",
    step6: "6) Tattica",
    formation: "modulo",
    balanceA: "Potenza totale",
    balanceB: "% Ripartizione potenza",
    balanceC: "% Media coerenza vittorie",
    export: "Esporta",
    png: "Scarica PNG",
    pdf: "Scarica PDF",
    loading: "Caricamento…",
    error: "Errore",
  },
};
const t = (lang, k) => (TXT[lang] && TXT[lang][k]) || TXT.en[k];

/* ---------- utils ---------- */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const str = (x) => (x == null ? "" : String(x).trim());
const toInt = (x) => { const n = parseInt(String(x ?? "").replace(",", "."), 10); return Number.isFinite(n) ? n : 0; };
const toFloat = (x) => { const n = parseFloat(String(x ?? "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
const toPct01 = (v) => {
  if (v == null || v === "") return 0;
  const s = String(v).trim().replace(",", ".");
  if (s.endsWith("%")) { const n = parseFloat(s.slice(0, -1)); return Number.isFinite(n) ? clamp01(n / 100) : 0; }
  const n = parseFloat(s); return Number.isFinite(n) ? clamp01(n > 1 ? n / 100 : n) : 0;
};
const isGK = (pos) => ["GK", "P", "P/GK"].includes(String(pos || "").toUpperCase());
function wilsonLowerBound(wins, n, z = 1.96){ if(n<=0) return 0; const p=wins/n; const z2=z*z; const d=1+z2/n; const c=p+z2/(2*n); const m=z*Math.sqrt((p*(1-p)+z2/(4*n))/n); return clamp01((c-m)/d); }
function derivePower({ pos, presenze, winPct01, astPM, golPM }){
  const wins = Math.round((presenze||0)*(winPct01||0));
  const winCons01 = wilsonLowerBound(wins, presenze, 1.96);
  const presenceR = clamp01((presenze||0)/12);
  const A = clamp01((astPM||0)/1.0);
  const G = clamp01((golPM||0)/1.0);
  let wWin,wG,wA,wApp; if(isGK(pos)){ wWin=.7; wG=.05; wA=.05; wApp=.2; } else { wWin=.55; wG=.22; wA=.13; wApp=.1; }
  const ovr01 = clamp01((wWin*winCons01 + wG*G + wA*A + wApp*presenceR) * (0.85 + 0.15*presenceR));
  const power = Math.round(100*clamp01(0.7*ovr01 + 0.3*winCons01));
  return { power, winCons01 };
}

const FORMATIONS_BY_SIZE = { 5:["1-2-1-1","1-3-1","2-2-1"], 6:["1-2-2-1","2-2-2","1-3-2"], 7:["1-2-3-1","2-3-1-1","1-3-2-1"], 8:["1-3-3-1","1-2-3-2","2-3-2-1"], 11:["4-4-2","4-3-3","3-5-2","4-2-3-1","5-3-2"], };
const parseFormation = (s)=> s.split("-").map(n=>parseInt(n,10)).filter(Number.isFinite);

export default function Selection({ lang = "en" }){
  const [rows,setRows] = useState([]);
  const [status,setStatus] = useState("loading");
  const [msg,setMsg] = useState("");

  const [teamSize,setTeamSize] = useState(7);
  const [customSize,setCustomSize] = useState("");

  const [playing,setPlaying] = useState({});  // id -> true
  const [captA,setCaptA] = useState("");
  const [captB,setCaptB] = useState("");
  const [assign,setAssign] = useState({});    // id -> 'A'|'B'|''
  const [extA,setExtA] = useState([]);
  const [extB,setExtB] = useState([]);
  const [formationA,setFormationA] = useState("1-2-3-1");
  const [formationB,setFormationB] = useState("1-2-3-1");

  // export target (two pitches side by side)
  const exportRef = useRef(null);

  useEffect(()=>{ (async()=>{
    try{
      const url = SHEETS.PLAYERS_CSV; if(!url){ setStatus("error"); setMsg("Missing VITE_PLAYERS_CSV in .env"); return; }
      const arr = await fetchCsv(url,{ header:false });
      const body = arr.filter(r=>Array.isArray(r)&&r.length>1).slice(1);
      const players = body.map((r,i)=>{
        const surname=str(r[0]); const pos=str(r[1]).toUpperCase();
        const pres=toInt(r[3]); const win=toPct01(r[4]); const ast=toFloat(r[6]); const gol=toFloat(r[7]);
        const { power, winCons01 } = derivePower({ pos, presenze:pres, winPct01:win, astPM:ast, golPM:gol });
        return { id:`cgo-${i}-${surname}-${pos}`, name:surname||`Player ${i+1}`, pos, presence:pres, winCons01, power };
      });
      setRows(players);
      setStatus(players.length?"ok":"empty");
      if(!players.length) setMsg("CSV loaded but no data rows found.");
    }catch(e){ setStatus("error"); setMsg(String(e.message||e)); }
  })(); },[]);

  const perSide = Math.max(3, Math.min(11, Number(customSize)||Number(teamSize)));
  const formations = FORMATIONS_BY_SIZE[perSide] || ["1-2-3-1"];
  const poolPlaying = useMemo(()=> rows.filter(p => !!playing[p.id]), [rows, playing]);

  function togglePlaying(id){
    setPlaying(s=>({ ...s, [id]: !s[id] }));
    if (playing[id]) {
      setAssign(s=>({ ...s, [id]: '' }));
      if(id===captA) setCaptA("");
      if(id===captB) setCaptB("");
    }
  }
  function setCaptainA(id){ if(!playing[id] || id===captB) return; setCaptA(id); setAssign(s=>({ ...s, [id]:'A' })); }
  function setCaptainB(id){ if(!playing[id] || id===captA) return; setCaptB(id); setAssign(s=>({ ...s, [id]:'B' })); }
  function changeAssign(id, team){
    if(!playing[id]) return;
    if(id===captA && team!=='A') return;
    if(id===captB && team!=='B') return;
    setAssign(s=>({ ...s, [id]: team }));
  }

  function autoDraft(){
    if(!captA || !captB){ alert("Pick two captains from the available list."); return; }
    const target = perSide;
    let A = new Set([captA]), B = new Set([captB]);
    let sumA = poolPlaying.find(p=>p.id===captA)?.power || 0;
    let sumB = poolPlaying.find(p=>p.id===captB)?.power || 0;

    const candidates = poolPlaying
      .filter(p => p.id!==captA && p.id!==captB && (assign[p.id]||'') === '')
      .sort((x,y)=>(y.power||0)-(x.power||0));

    for(const p of candidates){
      if(A.size>=target && B.size>=target) break;
      if((sumA<=sumB && A.size<target) || B.size>=target){ A.add(p.id); sumA+=p.power||0; }
      else { B.add(p.id); sumB+=p.power||0; }
    }
    setAssign(prev=>{
      const next={...prev};
      poolPlaying.forEach(p=>{ if(p.id!==captA && p.id!==captB) next[p.id]=''; });
      A.forEach(id=> next[id]='A'); B.forEach(id=> next[id]='B');
      next[captA]='A'; next[captB]='B';
      return next;
    });
  }
  function clearTeams(){
    setAssign(prev=>{
      const n={...prev};
      poolPlaying.forEach(p=>{ if(p.id!==captA && p.id!==captB) n[p.id]=''; });
      if(captA) n[captA]='A'; if(captB) n[captB]='B';
      return n;
    });
  }

  const teamA = useMemo(()=>{
    const base = poolPlaying.filter(p=>assign[p.id]==='A');
    return [...base, ...extA.map((p,i)=>({ id:`extA-${i}`, name:p.name||"EXT", pos:(p.pos||"").toUpperCase(), power:clamp01((+p.power||60)/100)*100, winCons01:0.5 }))];
  },[poolPlaying,assign,extA]);
  const teamB = useMemo(()=>{
    const base = poolPlaying.filter(p=>assign[p.id]==='B');
    return [...base, ...extB.map((p,i)=>({ id:`extB-${i}`, name:p.name||"EXT", pos:(p.pos||"").toUpperCase(), power:clamp01((+p.power||60)/100)*100, winCons01:0.5 }))];
  },[poolPlaying,assign,extB]);

  const metrics = useMemo(()=>{
    const sA = teamA.reduce((s,p)=>s+(p.power||0),0);
    const sB = teamB.reduce((s,p)=>s+(p.power||0),0);
    const tot = sA+sB || 1;
    const pctA = Math.round(10000*(sA/tot))/100, pctB = Math.round(10000*(sB/tot))/100;
    const wA = teamA.reduce((s,p)=>s+(p.winCons01||0),0)/(teamA.length||1);
    const wB = teamB.reduce((s,p)=>s+(p.winCons01||0),0)/(teamB.length||1);
    return { sA, sB, pctA, pctB, wPctA:Math.round(10000*wA)/100, wPctB:Math.round(10000*wB)/100 };
  },[teamA,teamB]);

  // externals helpers
  const addExtA = ()=> setExtA(a=>[...a,{name:"",pos:"",power:60}]);
  const addExtB = ()=> setExtB(a=>[...a,{name:"",pos:"",power:60}]);
  const updExtA = (i,p)=> setExtA(a=>a.map((r,k)=>k===i?{...r,...p}:r));
  const updExtB = (i,p)=> setExtB(a=>a.map((r,k)=>k===i?{...r,...p}:r));
  const delExtA = (i)=> setExtA(a=>a.filter((_,k)=>k!==i));
  const delExtB = (i)=> setExtB(a=>a.filter((_,k)=>k!==i));

  /* ===== Export (PNG / PDF) ===== */
  async function doExportPNG(){
    if(!exportRef.current) return;
    const dataUrl = await toPng(exportRef.current, { cacheBust:true, backgroundColor: "#0b1b33", pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `cgo_selection_${perSide}v${perSide}.png`;
    a.click();
  }
  async function doExportPDF(){
    if(!exportRef.current) return;
    const dataUrl = await toPng(exportRef.current, { cacheBust:true, backgroundColor: "#0b1b33", pixelRatio: 2 });
    const img = new Image(); img.src = dataUrl;
    await img.decode();
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [img.width, img.height] });
    pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
    pdf.save(`cgo_selection_${perSide}v${perSide}.pdf`);
  }

  return (
    <section className="home-layout">
      <div className="card" style={{ display:"grid", gap:16 }}>
        <h2 className="h2" style={{ fontSize:22, margin:0 }}>{t(lang,"title")}</h2>

        {/* Step 1 */}
        <div className="card">
          <div className="h2">{t(lang,"step1")}</div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <label className="p">{t(lang,"preset")}</label>
            <select className="btn" value={teamSize} onChange={e=>setTeamSize(Number(e.target.value))}>
              {[5,6,7,8,11].map(n=> <option key={n} value={n}>{n} v {n}</option>)}
            </select>
            <span className="p">{t(lang,"orCustom")}</span>
            <input className="btn" type="number" min={3} max={11} style={{ width:120 }}
              placeholder={t(lang,"perSide")} value={customSize} onChange={e=>setCustomSize(e.target.value)} />
          </div>
        </div>

        {/* Step 2 */}
        <div className="card" style={{ display:"grid", gap:10 }}>
          <div className="h2">{t(lang,"step2")}</div>
          <div className="p">{t(lang,"availHint")}</div>
          {status==="loading" && <div className="p">{t(lang,"loading")}</div>}
          {status==="error" && <div className="p" style={{ color:"#b91c1c" }}>{t(lang,"error")}: {msg}</div>}
          {status==="ok" && (
            <div style={{ display:"grid", gap:6 }}>
              {rows.map(p=>(
                <label key={p.id} style={{ display:"grid", gridTemplateColumns:"26px 1fr 90px", gap:8, alignItems:"center" }}>
                  <input type="checkbox" checked={!!playing[p.id]} onChange={()=>togglePlaying(p.id)} />
                  <span className="p"><b>{p.name}</b> {p.pos?`(${p.pos})`:""} · Pwr {p.power}</span>
                  <span className="pill">{playing[p.id] ? t(lang,"playing") : "—"}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Step 3 */}
        <div className="card" style={{ display:"grid", gap:10 }}>
          <div className="h2">{t(lang,"step3")}</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <div>
              <div className="p" style={{ fontWeight:700, color:"var(--teamA)" }}>{t(lang,"teamA")}</div>
              <select className="btn" value={captA} onChange={e=>setCaptainA(e.target.value)}>
                <option value="">—</option>
                {poolPlaying.map(p=><option key={p.id} value={p.id} disabled={p.id===captB}>{p.name} {p.pos?`(${p.pos})`:""}</option>)}
              </select>
            </div>
            <div>
              <div className="p" style={{ fontWeight:700, color:"var(--teamB)" }}>{t(lang,"teamB")}</div>
              <select className="btn" value={captB} onChange={e=>setCaptainB(e.target.value)}>
                <option value="">—</option>
                {poolPlaying.map(p=><option key={p.id} value={p.id} disabled={p.id===captA}>{p.name} {p.pos?`(${p.pos})`:""}</option>)}
              </select>
            </div>
            <button className="btn" onClick={autoDraft}>{t(lang,"auto")}</button>
            <button className="btn" onClick={clearTeams}>{t(lang,"reset")}</button>
          </div>
        </div>

        {/* Step 4 */}
        <div className="card" style={{ display:"grid", gap:10 }}>
          <div className="h2">{t(lang,"step4")}</div>
          <div style={{ display:"grid", gap:8 }}>
            {poolPlaying.map(p=>(
              <div key={p.id} style={{ display:"grid", gridTemplateColumns:"minmax(200px,1fr) 130px 130px", gap:8, alignItems:"center" }}>
                <div className="p"><b>{p.name}</b> {p.pos?`(${p.pos})`:""} · Pwr {p.power}</div>
                <select className="btn" value={p.id===captA?'A':p.id===captB?'B':(assign[p.id]||'')}
                        onChange={e=>changeAssign(p.id,e.target.value)}
                        disabled={p.id===captA || p.id===captB}>
                  <option value="">{t(lang,"unassigned")}</option>
                  <option value="A" disabled={p.id===captB}>Team A</option>
                  <option value="B" disabled={p.id===captA}>Team B</option>
                </select>
                <div className="bar"><div className="bar-inner green" style={{ width: `${p.power||0}%` }}/></div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 5 */}
        <div className="card" style={{ display:"grid", gap:12 }}>
          <div className="h2">{t(lang,"step5")}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <TeamExt title="Team A" color="var(--teamA)" rows={extA}
                     addLabel={t(lang,"addExternal")} labels={{name:t(lang,"name"),pos:t(lang,"pos"),power:t(lang,"power"),remove:t(lang,"remove")}}
                     onAdd={addExtA} onUpd={(i,p)=>updExtA(i,p)} onDel={delExtA}/>
            <TeamExt title="Team B" color="var(--teamB)" rows={extB}
                     addLabel={t(lang,"addExternal")} labels={{name:t(lang,"name"),pos:t(lang,"pos"),power:t(lang,"power"),remove:t(lang,"remove")}}
                     onAdd={addExtB} onUpd={(i,p)=>updExtB(i,p)} onDel={delExtB}/>
          </div>
        </div>

        {/* Step 6 + Export */}
        <div className="card" style={{ display:"grid", gap:12 }}>
          <div className="h2">{t(lang,"step6")}</div>

          <div className="export-row">
            <div className="p" style={{ fontWeight:800 }}>{t(lang,"export")}:</div>
            <button className="btn" onClick={doExportPNG}>{t(lang,"png")}</button>
            <button className="btn" onClick={doExportPDF}>{t(lang,"pdf")}</button>
          </div>

          <div ref={exportRef} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <div className="p" style={{ fontWeight:700, color:"var(--teamA)" }}>Team A {t(lang,"formation")}</div>
              <select className="btn" value={formationA} onChange={e=>setFormationA(e.target.value)}>
                { (FORMATIONS_BY_SIZE[perSide] || ["1-2-3-1"]).map(f=> <option key={f} value={f}>{f}</option>) }
              </select>
              <PitchHalf title="Team A" formation={parseFormation(formationA)} players={teamA.slice(0,perSide)} color="var(--teamA)" />
            </div>
            <div>
              <div className="p" style={{ fontWeight:700, color:"var(--teamB)" }}>Team B {t(lang,"formation")}</div>
              <select className="btn" value={formationB} onChange={e=>setFormationB(e.target.value)}>
                { (FORMATIONS_BY_SIZE[perSide] || ["1-2-3-1"]).map(f=> <option key={f} value={f}>{f}</option>) }
              </select>
              <PitchHalf title="Team B" formation={parseFormation(formationB)} players={teamB.slice(0,perSide)} color="var(--teamB)" />
            </div>
          </div>
        </div>

        {/* Balance */}
        {(teamA.length || teamB.length) && (
          <div className="card" style={{ display:"grid", gap:10 }}>
            <div className="balance-title">{t(lang,"balanceA")}</div>
            <div className="power-total">
              <span className="pill green">A: {metrics.sA}</span>
              <span className="pill orange">B: {metrics.sB}</span>
            </div>

            <div className="balance-title">{t(lang,"balanceB")}</div>
            <div className="balance-bar">
              <div className="balance-a" style={{ width:`${metrics.pctA}%` }}>{metrics.pctA}%</div>
              <div className="balance-b" style={{ width:`${metrics.pctB}%` }}>{metrics.pctB}%</div>
            </div>

            <div className="balance-title">{t(lang,"balanceC")}</div>
            <div className="balance-bar thin">
              <div className="balance-a soft" style={{ width:`${metrics.wPctA}%` }}>{metrics.wPctA}%</div>
              <div className="balance-b soft" style={{ width:`${metrics.wPctB}%` }}>{metrics.wPctB}%</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TeamExt({ title, color, rows, onAdd, onUpd, onDel, addLabel, labels }){
  return (
    <div>
      <div className="p" style={{ fontWeight:700, color }}>{title}</div>
      <button className="btn" onClick={onAdd}>{addLabel}</button>
      <div style={{ display:"grid", gap:8, marginTop:8 }}>
        {rows.map((p,i)=>(
          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 90px 110px auto", gap:8, alignItems:"center" }}>
            <input className="btn" placeholder={labels.name}  value={p.name}  onChange={e=>onUpd(i,{name:e.target.value})}/>
            <input className="btn" placeholder={labels.pos}   value={p.pos}   onChange={e=>onUpd(i,{pos:e.target.value})}/>
            <input className="btn" type="number" min={30} max={100} value={p.power||60} onChange={e=>onUpd(i,{power:Number(e.target.value)})}/>
            <button className="btn" onClick={()=>onDel(i)}>{labels.remove}</button>
          </div>
        ))}
      </div>
    </div>
  );
}