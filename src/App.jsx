import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './sections/Home.jsx'
import { t } from './i18n.js'
import Players from "./sections/Players.jsx";

export default function App() {
  const [lang, setLang] = useState('en')

  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <div className="brand">
            <img src={import.meta.env.BASE_URL + 'cgo-log.png'} alt="CGO" className="brand-logo" />
            <div className="brand-text">{t(lang, 'brand')}</div>
            <span className="badge">Private</span>
          </div>

          <div className="nav-spacer" />

          <span className="lang">{t(lang, 'language')}:</span>
          <button className="btn" onClick={() => setLang('en')}>English</button>
          <button className="btn" onClick={() => setLang('it')}>Italiano</button>
        </div>
      </nav>

      <main className="container">
        <Routes>
          {/* Home page */}
          <Route path="/" element={<Home lang={lang} />} />
          
          {/* 👇 New route for your FIFA player cards */}
          <Route path="/players" element={<Players />} />
        </Routes>
      </main>
    </div>
  )
}