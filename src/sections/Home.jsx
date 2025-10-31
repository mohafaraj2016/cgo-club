import React from 'react'
import Carousel from '../components/Carousel.jsx'

export default function Home({ lang }) {
  const EN = {
    title: 'Welcome to CGO Club',
    subtitle: 'Official private hub for our team.',
    intro1: 'CGO is a friendly football club focused on fair play, teamwork, and improving every match.',
    intro2: 'We organize regular 8-a-side and 5-a-side games, keep simple records, and balance teams for competitive fun.',
    stadiumTitle: 'Home Ground',
    stadiumName: 'San Nazario',
    stadiumAddr: '34151 Contovello, Province of Trieste',
    openMap: 'Open in Google Maps',
    sections: 'Sections'
  }

  const IT = {
    title: 'Benvenuti al CGO Club',
    subtitle: 'Hub privato ufficiale della nostra squadra.',
    intro1: 'CGO è un club amatoriale focalizzato su fair play, spirito di squadra e crescita partita dopo partita.',
    intro2: 'Organizziamo partite 8-contro-8 e 5-contro-5, teniamo semplici registri e bilanciamo le squadre per un gioco competitivo e divertente.',
    stadiumTitle: 'Stadio',
    stadiumName: 'San Nazario',         // <- fixed typo
    stadiumAddr: '34151 Contovello, Provincia di Trieste',
    openMap: 'Apri in Google Maps',
    sections: 'Sezioni'
  }

  const S = lang === 'it' ? IT : EN

  // Put your images in /public/gallery
  const images = [
    'gallery/CGO_1.jpeg',
    'gallery/CGO_2.jpeg',
    'gallery/CGO_3.jpeg'
  ]

  // Direct link to Google Maps (clickable)
  const mapsLink =
    'https://www.google.com/maps?q=Campo+Sportivo+San+Nazario,+34151+Contovello,+Trieste'

  return (
    <section className="home-layout">
      {/* Carousel full width */}
      <div className="card" style={{ padding: 12 }}>
        <Carousel images={images} height={360} />
      </div>

      {/* Intro + crest */}
      <div className="home-grid">
        <div className="card">
          <h1 className="h1">{S.title}</h1>
          <div className="p" style={{ marginBottom: 12 }}>{S.subtitle}</div>

          <h2 className="h2">CGO</h2>
          <p className="p" style={{ marginBottom: 8 }}>{S.intro1}</p>
          <p className="p">{S.intro2}</p>

          <div style={{ height: 16 }} />

          <h2 className="h2">{S.stadiumTitle}</h2>
          <p className="p">
            <strong>
              <a href={mapsLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                {S.stadiumName}
              </a>
            </strong><br />
            {S.stadiumAddr}
          </p>

          <div style={{ height: 12 }} />

          {/* Embedded Google Map */}
          <div className="map-frame">
            <iframe
              title="San Nazaro Football Field"
              width="100%"
              height="260"
              style={{ border: 0, borderRadius: '12px' }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2774.1377811544383!2d13.768182476981815!3d45.70331717107847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x477b6d9b45b804cb%3A0xe1528199a5cd88f7!2sCampo%20Sportivo%20San%20Nazario!5e0!3m2!1sen!2sit!4v1730398515435!5m2!1sen!2sit"
            ></iframe>
          </div>

          <div style={{ marginTop: 8 }}>
            <a className="btn" href={mapsLink} target="_blank" rel="noreferrer">
              {S.openMap}
            </a>
          </div>
        </div>

        <div className="card" style={{ display: 'grid', placeItems: 'center' }}>
          <div className="logo" style={{ width: 220, height: 220 }}>
            <img
              src={import.meta.env.BASE_URL + 'cgo-log.png'}
              alt="CGO crest"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Section cards (like your renewable site) */}
      <div className="sections-grid">
        <a className="section-card section-players" href="#/players">
          <div className="h2">Players</div>
          <p className="p">FIFA-style cards and bios.</p>
        </a>
        <a className="section-card section-matches" href="#/matches">
          <div className="h2">Matches</div>
          <p className="p">Match log and results.</p>
        </a>
        <a className="section-card section-stats" href="#/stats">
          <div className="h2">Stats</div>
          <p className="p">Per-player totals (goals, assists, W-D-L).</p>
        </a>
        <a className="section-card section-selection" href="#/selection">
          <div className="h2">Selection</div>
          <p className="p">Balanced team generator.</p>
        </a>
    </div>
    </section>
  )
}