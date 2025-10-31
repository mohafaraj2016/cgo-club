import React, { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './sections/Home.jsx'
import Players from './sections/Players.jsx'
import { t } from './i18n.js'

export default function App() {
  const [lang, setLang] = useState('en')

  return (
    <div>
      {/* ────── Top Navigation Bar ────── */}
      <nav className="nav">
        <div className="nav-inner">
          {/* Brand section (logo + text) */}
          <Link
            to="/"
            className="brand"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <img
              src={import.meta.env.BASE_URL + 'cgo-log.png'}
              alt="CGO Club Logo"
              className="brand-logo"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <div className="brand-text">CGO Club</div>
            <span className="badge">Private</span>
          </Link>

          <div className="nav-spacer" />

          {/* Language selector */}
          <span className="lang">{t(lang, 'language')}:</span>
          <button className="btn" onClick={() => setLang('en')}>English</button>
          <button className="btn" onClick={() => setLang('it')}>Italiano</button>
        </div>
      </nav>

      {/* ────── Main Content ────── */}
      <main className="container">
        <Routes>
          {/* Home page */}
          <Route path="/" element={<Home lang={lang} />} />

          {/* Players section (FIFA cards) */}
          <Route path="/players" element={<Players />} />
        </Routes>
      </main>
    </div>
  )
}