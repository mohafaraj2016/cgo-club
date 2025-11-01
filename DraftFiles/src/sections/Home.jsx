import React from 'react'
import { Link } from 'react-router-dom'
import Carousel from '../components/Carousel.jsx'
import { t } from '../i18n.js'

export default function Home({ lang }) {
  // Localized page text (intro + tile descriptions)
  const EN = {
    title: 'Welcome to CGO Club',
    subtitle: 'Official private hub for our team.',
    intro1: 'CGO is a friendly football club focused on fair play, teamwork, and improving every match.',
    intro2: 'We organize regular 8-a-side and 5-a-side games, keep simple records, and balance teams for competitive fun.',
    stadiumTitle: 'Home Ground',
    stadiumName: 'San Nazario',
    stadiumAddr: '34151 Contovello, Province of Trieste',
    openMap: 'Open in Google Maps',
    sec_players_desc: 'FIFA-style cards and bios.',
    sec_matches_desc: 'Match log and results.',
    sec_stats_desc:   'Per-player totals (goals, assists, W-D-L).',
    sec_selection_desc: 'Balanced team generator.',
  }

  const IT = {
    title: 'Benvenuti al CGO Club',
    subtitle: 'Hub privato ufficiale della nostra squadra.',
    intro1: 'CGO è un club amatoriale focalizzato su fair play, spirito di squadra e crescita partita dopo partita.',
    intro2: 'Organizziamo partite 8-contro-8 e 5-contro-5, teniamo semplici registri e bilanciamo le squadre per un gioco competitivo e divertente.',
    stadiumTitle: 'Stadio',
    stadiumName: 'San Nazario',
    stadiumAddr: '34151 Contovello, Provincia di Trieste',
    openMap: 'Apri in Google Maps',
    sec_players_desc: 'Carte stile FIFA e profili.',
    sec_matches_desc: 'Registro partite e risultati.',
    sec_stats_desc:   'Totali per giocatore (gol, assist, V-N-P).',
    sec_selection_desc: 'Generatore di squadre bilanciate.',
  }

  const S = lang === 'it' ? IT : EN

  // images in public/gallery/
  const images = [
    'gallery/CGO_1.jpeg',
    'gallery/CGO_2.jpeg',
    'gallery/CGO_3.jpeg'
  ]

  const mapsLink =
    'https://www.google.com/maps?q=Campo+Sportivo+San+Nazario,+34151+Contovello,+Trieste'

  return (
    <section className="home-layout">
      {/* Carousel */}
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

          <div className="map-frame">
            <iframe
              title="San Nazario Football Field"
              width="100%"
              height="260"
              style={{ border: 0, borderRadius: '12px' }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2774.1377811544383!2d13.768182476981815!3d45.70331717107847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x477b6d9b45b804cb%3A0xe1528199a5cd88f7!2sCampo%20Sportivo%20San%20Nazario!5e0!3m2!1sen!2sit!4v1730398515435!5m2!1sen!2sit"
            />
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

      {/* Localized section tiles */}
      <div className="sections-grid">
        <Link className="section-card section-players card" to="/players">
          <div className="h2">{t(lang, 'players')}</div>
          <p className="p">{S.sec_players_desc}</p>
        </Link>

        <a className="section-card section-matches card" href="#/matches">
          <div className="h2">{t(lang, 'matches')}</div>
          <p className="p">{S.sec_matches_desc}</p>
        </a>

        <a className="section-card section-stats card" href="#/stats">
          <div className="h2">{t(lang, 'stats')}</div>
          <p className="p">{S.sec_stats_desc}</p>
        </a>

        <a className="section-card section-selection card" href="#/selection">
          <div className="h2">{t(lang, 'selection')}</div>
          <p className="p">{S.sec_selection_desc}</p>
        </a>
      </div>
    </section>
  )
}