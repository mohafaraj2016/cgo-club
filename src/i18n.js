export const STRINGS = {
    en: {
      brand: 'CGO Club',
      home: 'Home',
      players: 'Players',
      matches: 'Matches',
      stats: 'Stats',
      selection: 'Selection',
      language: 'Language',
      english: 'English',
      italian: 'Italian',
    },
    it: {
      brand: 'CGO Club',
      home: 'Home',
      players: 'Giocatori',
      matches: 'Partite',
      stats: 'Statistiche',
      selection: 'Selezione',
      language: 'Lingua',
      english: 'Inglese',
      italian: 'Italiano',
    }
  }
  
  export function t(lang, key) {
    return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key
  }