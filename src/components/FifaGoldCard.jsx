import React from "react";

// prefix assets correctly for GitHub Pages (/cgo-club/)
const withBase = (p) => import.meta.env.BASE_URL + String(p || "").replace(/^\/+/, "");

export default function FifaGoldCard({
  photo,        // e.g. 'players/egodi.png'
  rating = 90,  // number
  position = "CDM",
  name = "PLAYER",
  nationFlag,   // e.g. 'flags/es.png'
  leagueLogo,   // e.g. 'leagues/premier-league.png'
  clubLogo,     // e.g. 'clubs/man-city.png'
  stats = { PAC: 65, SHO: 80, PAS: 86, DRI: 84, DEF: 86, PHY: 85 },
}) {
  return (
    <div className="fifa-gold">
      {/* top arc */}
      <div className="fifa-arc" />

      {/* rating + position */}
      <div className="fifa-hdr">
        <div className="fifa-rating">{rating}</div>
        <div className="fifa-pos">{position}</div>
      </div>

      {/* face */}
      <div className="fifa-face">
        {photo ? (
          <img src={withBase(photo)} alt={name} />
        ) : (
          <div className="fifa-face-ph">CGO</div>
        )}
      </div>

      {/* name banner */}
      <div className="fifa-name">{name}</div>

      {/* stats grid */}
      <div className="fifa-stats6">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="fifa-stat">
            <div className="fifa-stat-v">{v}</div>
            <div className="fifa-stat-k">{k}</div>
          </div>
        ))}
      </div>

      {/* badges */}
      <div className="fifa-badges">
        {nationFlag && <img src={withBase(nationFlag)} alt="nation" />}
        {leagueLogo && <img src={withBase(leagueLogo)} alt="league" />}
        {clubLogo && <img src={withBase(clubLogo)} alt="club" />}
      </div>
    </div>
  );
}