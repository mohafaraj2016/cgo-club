import React, { useMemo, useState } from "react";
import FifaGoldCard from "../components/FifaGoldCard.jsx";

// You can extend this list or later load from your Sheet.
// Assets go under public/: players/, flags/, leagues/, clubs/
const CATALOG = [
  {
    id: "egodi",
    name: "EGO DI",
    position: "CDM",
    rating: 90,
    photo: "players/egodi.png",
    nationFlag: "flags/es.png",
    leagueLogo: "leagues/premier-league.png",
    clubLogo: "clubs/man-city.png",
    stats: { PAC: 65, SHO: 80, PAS: 86, DRI: 84, DEF: 86, PHY: 85 },
  },
  // add more players here…
];

export default function SingleCard({ lang = "en" }) {
  const [sel, setSel] = useState(CATALOG[0]?.id || "");
  const player = useMemo(() => CATALOG.find(p => p.id === sel), [sel]);

  return (
    <section className="home-layout">
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label className="h2" style={{ margin: 0, fontSize: 18 }}>
            {lang === "it" ? "Scegli giocatore" : "Choose player"}
          </label>
          <select className="btn" value={sel} onChange={(e) => setSel(e.target.value)}>
            {CATALOG.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", placeItems: "center", padding: 8 }}>
          {player ? (
            <FifaGoldCard
              photo={player.photo}
              rating={player.rating}
              position={player.position}
              name={player.name}
              nationFlag={player.nationFlag}
              leagueLogo={player.leagueLogo}
              clubLogo={player.clubLogo}
              stats={player.stats}
            />
          ) : <div className="p">No player selected.</div>}
        </div>
      </div>
    </section>
  );
}